/* OPEN / CLOSE GROUP - AGENDAMENTOS
 Desenvolvido por: EDUH DEV </>
 © 2026 - Todos os direitos reservados 
 Proibida a cópia ou redistribuição sem autorização
 */

const fs = require('fs')
const { saveJSON, isJsonIncludes, contarMin, converterMin, sendHours, sleep } = require('../../definicoes.js')

const OCGP_PATH = './arquivos/openclosegp.json'
const MAX_HORARIOS_POR_GRUPO = 20

if (!fs.existsSync(OCGP_PATH)) {
fs.writeFileSync(OCGP_PATH, JSON.stringify([]))
console.log('[openclosegp] Arquivo criado:', OCGP_PATH)
}

let openclosegp = []
try {
openclosegp = JSON.parse(fs.readFileSync(OCGP_PATH, 'utf8'))
if (!Array.isArray(openclosegp)) {
console.warn('[openclosegp] Dados inválidos no arquivo, resetando para []')
openclosegp = []
}
} catch (e) {
console.error('[openclosegp] Erro ao carregar arquivo JSON:', e.message)
openclosegp = []
}

function saveOpenCloseGP() {
try {
saveJSON(openclosegp, OCGP_PATH)
} catch (e) {
console.error('[openclosegp] Erro ao salvar arquivo:', e.message)
}
}

function rgGroupOCfunc(from) {
try {
if (!isJsonIncludes(openclosegp, from)) {
openclosegp.push({ groupId: from, horarios: [] })
saveOpenCloseGP()
console.log('[openclosegp] Grupo registrado:', from)
}
} catch (e) {
console.error('[openclosegp] Erro ao registrar grupo:', e.message)
}
}

function getGroupOpenCloseFunc(from) {
try {
const grupo = openclosegp.find(g => g.groupId === from)
return grupo ? grupo.horarios : []
} catch (e) {
console.error('[openclosegp] Erro ao buscar horários do grupo:', e.message)
return []
}
}

function addOpenCloseGP(from, horario, adm, af = 'open') {
try {
let hr, day

if (horario.includes(':')) {
const totalMin = contarMin(horario)
const restante = totalMin % 1440
day = (totalMin - restante) / 1440
hr= converterMin(restante)
} else {
const letra = horario.slice(-1).toLowerCase()
const mp= letra === 'd' ? 1440 : letra === 'h' ? 60 : 1
const nmr = Math.max(1, Number(horario.slice(0, -1)) || 1)
const total = contarMin(sendHours('HH:mm')) + nmr * mp
const resto = total % 1440
day = (total - resto) / 1440
hr= converterMin(resto)
}

if (day === 0 && contarMin(hr) <= contarMin(sendHours('HH:mm'))) {
day = 1
}

const horarios = getGroupOpenCloseFunc(from)

if (horarios.length >= MAX_HORARIOS_POR_GRUPO) {
console.warn(`[openclosegp] Limite de agendamentos atingido para o grupo: ${from}`)
return { erro: `Limite de ${MAX_HORARIOS_POR_GRUPO} agendamentos por grupo atingido. Remova algum antes.` }
}

const jaExiste = horarios.some(h => h.hora === hr && h.dias === day && h.func === af)
if (jaExiste) {
console.warn(`[openclosegp] Agendamento duplicado ignorado para grupo: ${from}`)
return { erro: `Já existe um agendamento de *${af === 'open' ? 'abertura' : 'fechamento'}* para esse horário.` }
}

horarios.push({
id:sendHours('DDMMYYHHmmss') + Math.random().toString(36).slice(2, 6),
func:af,
hora:hr,
dias:day,
save:sendHours('DD'),
cobrado: false,
adm: adm,
})

saveOpenCloseGP()
console.log(`[openclosegp] Agendamento adicionado | Grupo: ${from} | Tipo: ${af} | Hora: ${hr} | Dias: ${day}`)
return { sucesso: true, hora: hr, dias: day }
} catch (e) {
console.error('[openclosegp] Erro ao adicionar agendamento:', e.message)
return { erro: 'Erro interno ao adicionar agendamento.' }
}
}

function getLastOpenCloseGP(from) {
try {
const horarios = getGroupOpenCloseFunc(from)
return horarios[horarios.length - 1] || null
} catch (e) {
console.error('[openclosegp] Erro ao buscar último agendamento:', e.message)
return null
}
}

function isIDopenCloseGP(from, id) {
try {
return getGroupOpenCloseFunc(from).some(h => h.id === id)
} catch (e) {
console.error('[openclosegp] Erro ao verificar ID:', e.message)
return false
}
}

function rmOpenCloseGP(from, id) {
try {
const grupo = openclosegp.find(g => g.groupId === from)
if (!grupo) {
console.warn(`[openclosegp] Grupo não encontrado para remoção: ${from}`)
return false
}
const idx = grupo.horarios.findIndex(h => h.id === id)
if (idx === -1) {
console.warn(`[openclosegp] ID não encontrado para remoção: ${id}`)
return false
}
grupo.horarios.splice(idx, 1)
saveOpenCloseGP()
console.log(`[openclosegp] Agendamento removido | Grupo: ${from} | ID: ${id}`)
return true
} catch (e) {
console.error('[openclosegp] Erro ao remover agendamento:', e.message)
return false
}
}

function limparGruposVazios() {
try {
const antes = openclosegp.length
for (let i = openclosegp.length - 1; i >= 0; i--) {
if (!openclosegp[i].groupId || !Array.isArray(openclosegp[i].horarios)) {
openclosegp.splice(i, 1)
}
}
if (openclosegp.length !== antes) {
console.log(`[openclosegp] Limpeza concluída | Removidos: ${antes - openclosegp.length} grupo(s) inválido(s)`)
saveOpenCloseGP()
}
} catch (e) {
console.error('[openclosegp] Erro na limpeza de grupos:', e.message)
}
}

async function ABRIR_E_FECHAR_GRUPO(kyomi) {
if (!openclosegp.length) return

const horaAtual = contarMin(sendHours('HH:mm'))
const diaAtual= sendHours('DD')

for (const grupo of openclosegp) {
if (!grupo.horarios?.length) continue

for (const agend of [...grupo.horarios]) {
try {
if (agend.dias > 0 && String(agend.save) !== String(diaAtual)) {
agend.save = diaAtual
agend.dias -= 1
saveOpenCloseGP()
console.log(`[openclosegp] Dia decrementado | Grupo: ${grupo.groupId} | ID: ${agend.id} | Dias restantes: ${agend.dias}`)
continue
}

if (agend.dias === 0 && horaAtual >= contarMin(agend.hora) && !agend.cobrado) {
agend.cobrado = true
saveOpenCloseGP()

const groupId = grupo.groupId
let nomeGrupo = 'indefinido'

try {
const meta = await kyomi.groupMetadata(groupId)
nomeGrupo = meta.subject || 'indefinido'
} catch (e) {
console.error(`[openclosegp] Erro ao buscar metadata do grupo ${groupId}:`, e.message)
}

const admNumero = agend.adm.split('@')[0]
const isFechar= agend.func === 'close'

try {
await kyomi.groupSettingUpdate(groupId, isFechar ? 'announcement' : 'not_announcement')
console.log(`[openclosegp] Grupo ${isFechar ? 'fechado' : 'aberto'} | Grupo: ${groupId}`)
await sleep(2000)
await kyomi.sendMessage(groupId, {
text: isFechar
? `🔒 O grupo *${nomeGrupo}* foi *fechado* pelo ADM @${admNumero} em horário programado. ❌`
: `🔓 O grupo *${nomeGrupo}* foi *aberto* pelo ADM @${admNumero} em horário programado. ✅`,
mentions: [agend.adm],
})
} catch (e) {
console.error(`[openclosegp] Erro ao ${isFechar ? 'fechar' : 'abrir'} grupo ${groupId}:`, e.message)
}

const idxGrupo = openclosegp.findIndex(g => g.groupId === groupId)
if (idxGrupo !== -1) {
const idxAgend = openclosegp[idxGrupo].horarios.findIndex(h => h.id === agend.id)
if (idxAgend !== -1) {
openclosegp[idxGrupo].horarios.splice(idxAgend, 1)
saveOpenCloseGP()
console.log(`[openclosegp] Agendamento executado e removido | ID: ${agend.id}`)
}
}
}
} catch (e) {
console.error(`[openclosegp] Erro inesperado no loop | Grupo: ${grupo.groupId} | ID: ${agend.id}:`, e.message)
}
}
}

limparGruposVazios()
}

module.exports = { openclosegp, saveOpenCloseGP, rgGroupOCfunc, getGroupOpenCloseFunc, addOpenCloseGP, rmOpenCloseGP, isIDopenCloseGP, getLastOpenCloseGP, ABRIR_E_FECHAR_GRUPO,
}
