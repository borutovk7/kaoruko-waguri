const fs = require("fs");

const { sendHours, saveJSON, isJsonIncludes, alerandom, letras, randomLetra, addNumberMais, identArroba, sendButton, sleep, contarMin, moment, sendFutureTime, allvaluerent, colors } = require("../../../definicoes.js")

const { NomeDoBot, prefix, ownerNumber } = require('../../../configs/configs.json');


//================GRUPOS==============\\

const groupspath = `./database/saldo virtual/aluguel/grupos.json`

if(!fs.existsSync(groupspath)) {saveJSON([{id: "@p4aulinx_", save: sendHours("MM"), gps: []}], groupspath)}

const grupos = JSON.parse(fs.readFileSync(groupspath))

function saveGroupsRent() {saveJSON(grupos, groupspath)}

const isSaveGroup = (from) => {
  let nmr = 0
  for(let i of grupos) {
    if(from == i.id) nmr += 1
  }
  return nmr > 0 ? true : false
}

const getSaveGroup = (from) => {
  let nmr = -1
  let caixa = []
  for(let i of grupos) {
    nmr += 1
    if(from == i.id) caixa.push(nmr)
  }
  if(caixa.length > 0) {
    let AB = caixa[0]
    return grupos[AB]
  }
}

function addGroupInRent(from, validado = false) {
  let sn = validado != true && validado != false ? false : validado
  if(!isSaveGroup(from)) {
    grupos.push({id: from, limite: 3, validado: sn})
    saveGroupsRent()
  } else {
    getSaveGroup(from).validado = sn
    saveGroupsRent()
  }
}

function rmGroupInRent(from) {
  let nmr = -1
  let caixa = []
  for(let i of grupos) {
    nmr += 1
    if(from == i.id) caixa.push(nmr)
  }
  if(caixa.length > 0) {
    let AB = caixa[0]
    grupos.splice(AB, 1)
    saveGroupsRent()
  }
}

//================ALUGUEL==============\\

const rentpath = `./database/saldo virtual/aluguel/aluguel.json`

if(!fs.existsSync(rentpath)) {saveJSON([], rentpath)}

const aluguel = JSON.parse(fs.readFileSync(rentpath))

function saveRent() {saveJSON(aluguel, rentpath)}

const sendTimeDay = (nmr) => {
  if(Number(nmr) > 1) {
    return `${Number(nmr)} dias`
  } else {
    let hh = Number(sendHours('HH'))
    let mm = Number(sendHours('mm'))
    let ss = Number(sendHours('ss'))
    let txt = `${60 - ss} segundo${ss < 59 ? 's' : ''}`
    if(mm < 59) txt = `${60 - mm} minutos`
    if(hh < 23) txt = `${24 - hh} horas`
    return txt
  }
}

const sendTimeHours = (txt) => {
  let nmr = Number(txt)
  if(nmr <= 36) return `${nmr} hora${nmr != 1 ? `s` : ``}`
  let dias = Number(nmr / 24).toFixed(0)
  return `${dias} dia${dias != 1 ? `s` : ``}`
}

const sendLetterTime = (txt) => {
  let nmr = Number(txt)
  if(nmr <= 36) return `${nmr}h`
  let dias = Number(nmr / 24).toFixed(0)
  return `${dias}d`
}

const isGroupInRent = (from) => {
  let AB = aluguel.map(i => i.id).indexOf(from)
  if(AB >= 0) return true
  return false
}

const getGroupRent = (from) => {
  let AB = aluguel.map(i => i.id).indexOf(from)
  return aluguel[AB]
}

const valoresDeAluguel = allvaluerent.aluguel

const getValuesRent = (nmr) => {
  let value = [{tempo: 0, valor: 0}]
  for(let i of valoresDeAluguel) {
    if(Number(nmr) === i.tempo) value.push(i)
  }
  return value[value.length - 1]
}

async function addRent(from, matheuzinho, horas, transf) {
  let transferencia = transf != undefined ? transf : 2
  addGroupInRent(from, true)
  if(!isJsonIncludes(aluguel, from)) {
    aluguel.push({
      id: from,
      nome: '',
      tempo: horas,
      totalRent: horas,
      horario: sendHours("HH:mm"),
      cliente: matheuzinho,
      save: Number(sendHours(horas > 48 ? "DD" : "HH")),
      transferir: transferencia,
      cortesia: false
    })
    saveRent()
  } else {
    let AB = aluguel.map(i => i.id).indexOf(from)
    aluguel[AB].cortesia = false
    if(matheuzinho != undefined) aluguel[AB].cliente = matheuzinho
    aluguel[AB].totalRent = aluguel[AB].tempo + horas
    aluguel[AB].tempo += horas
    aluguel[AB].transferir += transferencia
    saveRent()
  }
}

const isCourtesyGroup = (from) => {
  if(isJsonIncludes(grupos[0].gps, from)) return true
  return false
}

function addCourtesy(reply, from) {
  if(isGroupInRent(from)) return reply(`Este grupo já está registrado no sistema de aluguel...`)
  addGroupInRent(from, true)
  let ttr = 24
  aluguel.push({id: from, nome: ``, tempo: ttr, totalRent: ttr, horario: sendHours("HH:mm"), cliente: ``, save: Number(sendHours("HH")), cortesia: true})
  saveRent()
  grupos[0].gps.push(from)
  saveGroupsRent()
  reply(`💳 Card "cortesia 24h" liberada neste grupo com sucesso, válida até ${sendFutureTime([{valor: 1, type: `days`}])}`)
}

function tirarRent(from, reply, pc, q) {
  let dias = q
  let day = dias.slice(0, dias.length-1)
  if(!Number(day)) return reply(day+` não é um número... Use ${pc} ${addNumberMais(nmrdn)}/30d`)
  if(Number(day) <= 0) return reply(`É necessária ao menos 1 hora de aluguel, né?`)
  if(dias.includes('.')) return reply("Não use números decimais")
  let letra
  if(dias.slice(dias.length-1, dias.length).toLowerCase() === "h") { 
    letra = 1
  } else if(dias.slice(dias.length-1, dias.length).toLowerCase() === "d") { 
    letra = 24
  } else return reply("Retorne após o número uma letra como d/h, ex: 30d ou 24h")
  let ttr = (Number(day)) * letra
  let AB = aluguel.map(i => i.id).indexOf(from)
  aluguel[AB].tempo -= ttr
  saveRent()
  reply(`${q} retirad${letra == 1 ? "a" : "o"}${Number(day) > 1 ? 's' : ''} deste grupo`)
}

function delRent(reply, from) {
  let AB = aluguel.map(i => i.id).indexOf(from)
  let grupo = aluguel[AB].nome
  aluguel.splice(AB, 1)
  saveRent()
  rmGroupInRent(from)
  reply(`📍 Grupo ${grupo} deletado do aluguel com sucesso ✔`)
}

function rmRent(from) {
  let AB = aluguel.map(i => i.id).indexOf(from)
  aluguel.splice(AB, 1)
  saveRent()
  rmGroupInRent(from)
}

async function rentContSystem(kyomi, sendMess, tempmsg) {
  if(aluguel.length > 0) {
    let gp_numeral = -1
    function cobranca(cliente, nome, tempo) {
      kyomi.sendMessage(cliente, {text: `${tempmsg} @${cliente.split("@")[0]} 👋🏽😊\nSegundo consta em meus registros, o grupo ${nome} terminará a sua locação em ${Number(tempo) === (24 * 7) ? `1 semana (7 dias)` : Number(tempo / 24).toFixed(0) != 2 ? `${(Number(tempo / 24).toFixed(0)) - 1} dias` : `24 horas`}... Use o comando ${prefix}alugar para renovar o seu contrato com a melhor assistente da região 📍\n_(OBS: Qualquer dúvida, contate minha dona)_`, contextInfo: {mentionedJid: [cliente], forwardingScore: 1, isForwarded: true}})
    }
    for(let a of aluguel) {
      gp_numeral += 1
      let grupo = a.id
      let cliente = a.cliente
      let nome = a.nome
      let cortesia = a.cortesia
      let tempo = a.tempo
      let save = a.save
      let horario = a.horario
      if(tempo > 0) {
        if(a.tempo >= 48) {
          if(Number(a.save) !== Number(sendHours("DD")) && contarMin(sendHours("HH:mm")) >= contarMin(a.horario)) {
            let total = a.tempo
            let sub = a.tempo
            while(sub > (total - 24)) {
              sub -= 1
              if(sub == (24 * 2) || sub == (24 * 3) || sub == (24 * 7)) cobranca(cliente, nome, a.tempo)
            }
            a.tempo = sub
            a.save = sendHours("DD")
            saveRent()
          }
        } else {
          if(Number(a.save) !== Number(sendHours("HH"))) {
            if((a.tempo == 24) && !a.cortesia) cobranca(cliente, nome, a.tempo)
            a.tempo -= 1
            a.save = sendHours("HH")
            saveRent()
          }
        }
      } else {
        if(a.totalRent > 0) {
          a.totalRent = 0
          saveRent()
          sendButton(identArroba(ownerNumber), {text: `💆🏼‍♀️ ${tempmsg} Ei Meu Chefe, o grupo ${nome} expirou o aluguel neste exato momento... Visto que o cliente @${cliente.split("@")[0]} não renovou contrato, clique no botão abaixo para deletar o aluguel do grupo dele e sair do mesmo automaticamente 🗑`, footer: NomeDoBot, mentions: [cliente]}, kyomi,
          [
            {type: 'cmd', text: '🚮 DELETAR ALUGUEL', command: prefix+'rmrent '+grupo},
            {type: 'cmd', text: '📋 LISTAR ALUGUEL', command: prefix+'listrent'},
            {type: 'cmd', text: '🎭 ATUALIZAR GRUPOS', command: prefix+'attgp'}
          ])
        }
      }
    }
  }
}

module.exports = { groupspath, grupos, saveGroupsRent, addGroupInRent, rmGroupInRent, aluguel, saveRent, sendTimeDay, sendTimeHours, sendLetterTime, isGroupInRent, getGroupRent, addRent, isCourtesyGroup, addCourtesy, tirarRent, delRent, rentContSystem, valoresDeAluguel, getValuesRent, getSaveGroup, isSaveGroup, rmRent };
