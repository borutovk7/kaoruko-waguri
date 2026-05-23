const fs = require('fs')
const path = require('path')
const moment = require('moment-timezone')
const { saveJSON, sendHours, colors } = require('../../definicoes.js')

const QRCODEPATH  = './database/KAUROKO-QR'
const RESTARTPATH = './arquivos/funcoes/restartqr.json'
const LOGPATH     = './arquivos/funcoes/restartqr-log.json'
const BACKUPPATH  = './database/KAUROKO-QR-BACKUP'

const MAX_TENTATIVAS = 5
const DELAY_RETRY    = 800
const DELAY_RESTART  = 1000

const isRestartQR = fs.existsSync(RESTARTPATH)
const restartqr   = isRestartQR
  ? JSON.parse(fs.readFileSync(RESTARTPATH, 'utf-8'))
  : undefined

function salvarLog(tipo, mensagem, extra = {}) {
  const logs = fs.existsSync(LOGPATH)
    ? JSON.parse(fs.readFileSync(LOGPATH, 'utf-8'))
    : []

  logs.push({
    tipo,
    mensagem,
    data: moment().tz('America/Sao_Paulo').format('DD/MM/YYYY HH:mm:ss'),
    ...extra
  })

  fs.writeFileSync(LOGPATH, JSON.stringify(logs, null, 2))
}

function garantirDiretorios() {
  if (!fs.existsSync(QRCODEPATH)) fs.mkdirSync(QRCODEPATH, { recursive: true })
  if (!fs.existsSync(BACKUPPATH)) fs.mkdirSync(BACKUPPATH, { recursive: true })
  if (!fs.existsSync('./arquivos/funcoes')) fs.mkdirSync('./arquivos/funcoes', { recursive: true })
}

function deletarComRetry(filePath, tentativa = 1) {
  return new Promise((resolve) => {
    fs.unlink(filePath, (err) => {
      if (!err) {
        console.log(colors.cyan(`🗑 Deletado: ${path.basename(filePath)}`))
        salvarLog('DELETE_OK', `Arquivo deletado com sucesso`, { arquivo: path.basename(filePath), tentativa })
        return resolve({ ok: true, arquivo: path.basename(filePath), tentativa })
      }

      if (tentativa >= MAX_TENTATIVAS) {
        console.error(colors.red(`❌ Falha após ${MAX_TENTATIVAS} tentativas: ${path.basename(filePath)}`))
        salvarLog('DELETE_FAIL', `Falha ao deletar após ${MAX_TENTATIVAS} tentativas`, { arquivo: path.basename(filePath), erro: err.message })
        return resolve({ ok: false, arquivo: path.basename(filePath), erro: err.message })
      }

      console.log(colors.yellow(`⚠ Tentativa ${tentativa}/${MAX_TENTATIVAS} falhou para ${path.basename(filePath)}, tentando novamente...`))

      setTimeout(() => {
        resolve(deletarComRetry(filePath, tentativa + 1))
      }, DELAY_RETRY * tentativa)
    })
  })
}

async function fazerBackup() {
  return new Promise((resolve) => {
    fs.readdir(QRCODEPATH, (err, files) => {
      if (err) {
        salvarLog('BACKUP_FAIL', 'Erro ao listar arquivos para backup', { erro: err.message })
        return resolve(false)
      }

      const targets = files.filter(f =>
        f.startsWith('pre-key') ||
        f.startsWith('sender-key') ||
        f.startsWith('session-')
      )

      if (targets.length === 0) return resolve(true)

      const timestamp = moment().tz('America/Sao_Paulo').format('DD-MM-YYYY_HH-mm-ss')
      const pastaBackup = path.join(BACKUPPATH, timestamp)
      fs.mkdirSync(pastaBackup, { recursive: true })

      let copiados = 0
      targets.forEach(file => {
        try {
          fs.copyFileSync(path.join(QRCODEPATH, file), path.join(pastaBackup, file))
          copiados++
        } catch (e) {
          salvarLog('BACKUP_FILE_FAIL', `Erro ao copiar ${file}`, { erro: e.message })
        }
      })

      console.log(colors.green(`💾 Backup feito: ${copiados}/${targets.length} arquivos → ${pastaBackup}`))
      salvarLog('BACKUP_OK', `Backup realizado`, { pasta: pastaBackup, arquivos: copiados })
      resolve(true)
    })
  })
}

async function reviverQR() {
  garantirDiretorios()

  let files
  try {
    files = fs.readdirSync(QRCODEPATH)
  } catch (err) {
    console.error(colors.red('❌ Erro ao listar arquivos do QR:'), err.message)
    salvarLog('REVIVER_FAIL', 'Erro ao listar arquivos', { erro: err.message })
    return
  }

  const targets = files.filter(f =>
    f.startsWith('pre-key') ||
    f.startsWith('sender-key') ||
    f.startsWith('session-')
  )

  if (targets.length === 0) {
    console.log(colors.yellow('⚠ Nenhum arquivo de sessão encontrado para limpar.'))
    salvarLog('REVIVER_VAZIO', 'Nenhum arquivo encontrado para limpar')
    setTimeout(() => process.exit(), DELAY_RESTART)
    return
  }

  console.log(colors.cyan(`📂 ${targets.length} arquivo(s) encontrado(s) para limpeza.`))
  await fazerBackup()

  const resultados = await Promise.all(
    targets.map(file => deletarComRetry(path.join(QRCODEPATH, file)))
  )

  const sucesso  = resultados.filter(r => r.ok).length
  const falhou   = resultados.filter(r => !r.ok).length

  console.log(colors.green(`✅ Limpeza concluída → ${sucesso} deletado(s), ${falhou} falhou(aram).`))
  salvarLog('REVIVER_FIM', 'Limpeza finalizada', { sucesso, falhou, total: targets.length })

  setTimeout(() => {
    console.log(colors.green('♻ Reiniciando sistema...'))
    process.exit()
  }, DELAY_RESTART)
}

function setHorarioRestart(from, sender, time, reset = true, conso = false) {
  const hora = Number(time)
  saveJSON(
    { id: from, usu: sender, tempo: hora, save: sendHours('DD--HH') },
    RESTARTPATH
  )
  salvarLog('SET_RESTART', `Restart agendado a cada ${hora}h`, { from, sender })
  if (reset) {
    setTimeout(() => {
      if (conso) console.log(colors.green('♻ Reiniciando para aplicar agendamento...'))
      process.exit()
    }, 500)
  }
}

function stopRestartQR(conso = false) {
  if (!isRestartQR) return
  try {
    fs.unlinkSync(RESTARTPATH)
    salvarLog('STOP_RESTART', 'Agendamento de restart cancelado')
    setTimeout(() => {
      if (conso) console.log(colors.green('🛑 Restart cancelado. Reiniciando sistema...'))
      process.exit()
    }, 500)
  } catch (err) {
    console.error(colors.red('❌ Erro ao cancelar restart:'), err.message)
    salvarLog('STOP_FAIL', 'Erro ao cancelar restart', { erro: err.message })
  }
}

function lerLogs(limite = 20) {
  if (!fs.existsSync(LOGPATH)) return []
  const logs = JSON.parse(fs.readFileSync(LOGPATH, 'utf-8'))
  return logs.slice(-limite)
}

function limparLogs() {
  fs.writeFileSync(LOGPATH, JSON.stringify([], null, 2))
  console.log(colors.green('🧹 Logs limpos com sucesso.'))
}

function statusAtual() {
  if (!isRestartQR || !restartqr) return { ativo: false }
  const [dia, hora] = restartqr.save.split('--')
  return {
    ativo: true,
    id: restartqr.id,
    usu: restartqr.usu,
    intervalo: `${restartqr.tempo}h`,
    ultimoRestart: `Dia ${dia} às ${hora}h`
  }
}

async function restartQRfunc(zerotwo) {
  if (!isRestartQR || !restartqr) return

  const [dia, hora] = restartqr.save.split('--')
  const horaAtual   = Number(sendHours('HH'))
  const horaAntiga  = Number(hora)
  const diaAtual    = Number(sendHours('DD'))
  const diasDiff    = Number(dia) !== diaAtual ? 24 : 0
  const horaProxima = horaAntiga + restartqr.tempo

  if (horaProxima > horaAtual + diasDiff) return

  const { id, usu, tempo } = restartqr

  await zerotwo.sendMessage(id, {
    text: `⏱ _Dado o horário de *${tempo}h*, hora da limpeza do QR!_ 🗑`,
    mentions: [usu]
  })

  salvarLog('RESTART_ACIONADO', `Restart automático acionado após ${tempo}h`, { id, usu })
  setHorarioRestart(id, usu, tempo, false)

  setTimeout(() => reviverQR(), 500)
}

module.exports = {
  QRCODEPATH,
  RESTARTPATH,
  LOGPATH,
  BACKUPPATH,
  MAX_TENTATIVAS,
  isRestartQR,
  restartqr,
  setHorarioRestart,
  stopRestartQR,
  reviverQR,
  restartQRfunc,
  lerLogs,
  limparLogs,
  statusAtual,
  fazerBackup
}
