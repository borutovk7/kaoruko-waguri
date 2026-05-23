const fs = require('fs')
const path = require('path')

const STATUS_FILE = path.join(__dirname, 'data', 'status_normal_history.json')


function garantirArquivo() {
  const dir = path.dirname(STATUS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(STATUS_FILE)) fs.writeFileSync(STATUS_FILE, JSON.stringify([]), 'utf-8')
}

function lerHistorico() {
  garantirArquivo()
  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function salvarHistorico(lista) {
  garantirArquivo()
  fs.writeFileSync(STATUS_FILE, JSON.stringify(lista, null, 2), 'utf-8')
}



function limparExpirados() {
  const agora = Date.now()
  const lista = lerHistorico()
  const filtrado = lista.filter(s => agora - s.timestamp < 24 * 60 * 60 * 1000)
  if (filtrado.length !== lista.length) {
    salvarHistorico(filtrado)
    console.log(`[STATUS_NORMAL] ${lista.length - filtrado.length} status expirado(s) removido(s).`)
  }
}

setInterval(limparExpirados, 60 * 60 * 1000)
limparExpirados()

function adicionarStatus({ id, tipo, caption, cor, enviados, from }) {
  const lista = lerHistorico()
  lista.push({
    id,
    tipo,
    caption: caption || '',
    cor: cor || null,
    enviados: enviados || 0,
    from: from || 'Dono',
    hora: new Date().toLocaleString('pt-BR'),
    timestamp: Date.now()
  })
  salvarHistorico(lista)
}

function removerStatus(id) {
  const lista = lerHistorico()
  const nova = lista.filter(s => s.id !== id)
  salvarHistorico(nova)
  return lista.length !== nova.length
}

function getHistorico() {
  limparExpirados()
  return lerHistorico()
}

function limparTudo() {
  const lista = lerHistorico()
  const total = lista.length
  salvarHistorico([])
  return total
}

function getEstatisticas() {
  const lista = getHistorico()
  const tipos = { foto: 0, vídeo: 0, áudio: 0, texto: 0 }
  let totalEnviados = 0
  for (const s of lista) {
    if (tipos[s.tipo] !== undefined) tipos[s.tipo]++
    totalEnviados += s.enviados || 0
  }
  return { total: lista.length, tipos, totalEnviados }
}

module.exports = {
  adicionarStatus,
  removerStatus,
  getHistorico,
  limparTudo,
  getEstatisticas
}
