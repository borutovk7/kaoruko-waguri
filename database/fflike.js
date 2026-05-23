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
 * Retorna o registro de cooldown do ID do FF + tipo, ou null se não existir.
 * @param {string} ffId   — ID do jogador FF alvo
 * @param {string} tipo   — 'normal' | 'vip'
 */
const getLikeCD = (ffId, tipo = 'normal') => {
  const db = load()
  return db.find(r => r.ffId === String(ffId) && r.tipo === tipo) || null
}

/**
 * Salva/atualiza o cooldown pelo ID do jogador FF.
 * @param {string} ffId
 * @param {string} tipo
 * @param {number} proximoEnvio — timestamp em ms do próximo envio permitido
 */
const setLikeCD = (ffId, tipo = 'normal', proximoEnvio) => {
  const db = load()
  const idx = db.findIndex(r => r.ffId === String(ffId) && r.tipo === tipo)
  const entry = {
    ffId: String(ffId),
    tipo,
    enviadoEm: Date.now(),
    proximoEnvio
  }
  if (idx >= 0) db[idx] = entry
  else db.push(entry)
  save(db)
}

/**
 * Verifica se o ID do FF ainda está em cooldown.
 * Retorna { bloqueado: true, restante: '2h 30m' } ou { bloqueado: false }
 * @param {string} ffId
 * @param {string} tipo
 */
const checkCD = (ffId, tipo = 'normal') => {
  const rec = getLikeCD(ffId, tipo)
  if (!rec) return { bloqueado: false }
  const agora = Date.now()
  if (agora < rec.proximoEnvio) {
    const diff = rec.proximoEnvio - agora
    const h = Math.floor(diff / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return { bloqueado: true, restante: `${h}h ${m}m` }
  }
  return { bloqueado: false }
}

module.exports = { getLikeCD, setLikeCD, checkCD }
