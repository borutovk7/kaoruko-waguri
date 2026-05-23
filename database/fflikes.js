const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, 'fflikes.json')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const load = () => {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')) }
  catch { return [] }
}

const save = (data) => {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8')
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Retorna o registro de cooldown do usuário+tipo, ou null se não existir.
 * @param {string} sender  — JID do usuário (ex: "5511999999999@s.whatsapp.net")
 * @param {string} tipo    — 'normal' | 'vip'
 */
const getLikeCD = (sender, tipo = 'normal') => {
  const db = load()
  return db.find(r => r.sender === sender && r.tipo === tipo) || null
}

/**
 * Salva/atualiza o timestamp do último like enviado.
 * @param {string} sender
 * @param {string} tipo
 * @param {string} ffId    — ID do jogador FF alvo
 * @param {number} proximoEnvio — timestamp em ms do próximo envio permitido (vindo da API)
 */
const setLikeCD = (sender, tipo = 'normal', ffId, proximoEnvio) => {
  const db = load()
  const idx = db.findIndex(r => r.sender === sender && r.tipo === tipo)
  const entry = {
    sender,
    tipo,
    ffId,
    enviadoEm: Date.now(),
    proximoEnvio  // ms — quando pode enviar de novo
  }
  if (idx >= 0) db[idx] = entry
  else db.push(entry)
  save(db)
}

/**
 * Verifica se o usuário ainda está em cooldown.
 * Retorna { bloqueado: true, restante: '2h 30m' } ou { bloqueado: false }
 * @param {string} sender
 * @param {string} tipo
 */
const checkCD = (sender, tipo = 'normal') => {
  const rec = getLikeCD(sender, tipo)
  if (!rec) return { bloqueado: false }
  const agora = Date.now()
  if (agora < rec.proximoEnvio) {
    const diff = rec.proximoEnvio - agora
    const h = Math.floor(diff / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return { bloqueado: true, restante: `${h}h ${m}m`, proximoEnvio: rec.proximoEnvio }
  }
  return { bloqueado: false }
}

module.exports = { getLikeCD, setLikeCD, checkCD }
