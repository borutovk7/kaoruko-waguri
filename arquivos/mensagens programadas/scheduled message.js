const fs = require("fs")
const path = require("path")

const { isJsonIncludes, saveJSON, sendHours, contarMin, converterMin, rmLetras } = require(`../config.js`)

const scheduledmessagepath = `./operacao/mensagens programadas/schemsg.json`

// Garantir que o diretório existe
const dir = path.dirname(scheduledmessagepath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

if(!fs.existsSync(scheduledmessagepath)) {fs.writeFileSync(scheduledmessagepath, JSON.stringify([]))}

const schemsg = JSON.parse(fs.readFileSync(scheduledmessagepath))

function saveScheMsg() {saveJSON(schemsg, scheduledmessagepath)}

function addGroupInScheMsg(from) {
  let AB = schemsg.map(i => i.groupId).indexOf(from)
  if(AB < 0) {
    schemsg.push({groupId: from, acctive: true, dados: []})
    saveScheMsg()
  }
}

function rmGroupInScheMsg(from) {
  let AB = schemsg.map(i => i.groupId).indexOf(from)
  if(AB >= 0) {
    schemsg.splice(AB, 1)
    saveScheMsg()
  }
}

const getGroupScheMsg = (from) => {
  let AB = schemsg.map(i => i.groupId).indexOf(from)
  return schemsg[AB]
}

function addMessageScheduled(from, txt, hours = undefined) {
  let data = getGroupScheMsg(from)
  if (!data) {
      addGroupInScheMsg(from);
      data = getGroupScheMsg(from);
  }
  // Inicializa horários como array vazio se hours for undefined, ou com o objeto correto se fornecido
  let initialHorarios = [];
  if (hours) {
      initialHorarios.push({hora: hours, dia: sendHours('DD'), save: false});
  }
  
  data.dados.push({
      id: sendHours('DDMMHHmm') + Math.floor(Math.random() * 1000), 
      text: txt, 
      mentions: true, 
      imagem: [], 
      horarios: initialHorarios
  })
  saveScheMsg()
}

const getIDbyMessage = (from, message) => {
  let data = getGroupScheMsg(from)
  if (!data) return undefined
  let caixa = []
  for(let i of data.dados) {
    if(rmLetras(message) === rmLetras(i.text)) caixa.push(i.id)
  }
  return caixa.length > 0 ? caixa[0] : undefined
}

const existsIDinSM = (from, id) => {
  let data = getGroupScheMsg(from)
  if (!data) return false
  let AB = data.dados.map(i => i.id).indexOf(id)
  return AB >= 0
}

const getMessageByID = (from, id) => {
  let data = getGroupScheMsg(from)
  if(data && data.dados.length > 0) {
    let AB = data.dados.map(i => i.id).indexOf(id)
    return data.dados[AB]
  }
  return undefined
}

function addHoursInMessage(from, id, hours) {
  if(existsIDinSM(from, id)) {
    let data = getMessageByID(from, id)
    // Filtra nulos antes de dar map para evitar erro de 'hora' undefined
    let AC = data.horarios.filter(f => f && f.hora).map(f => f.hora).indexOf(hours)
    if(AC < 0) {
      data.horarios.push({hora: hours, dia: sendHours('DD'), save: false})
      saveScheMsg()
    }
  } else console.log('ID inexistente no sistema para adicionar o horário')
}

function rmHoursInMessage(from, id, hours) {
  if(existsIDinSM(from, id)) {
    let data = getMessageByID(from, id)
    let AC = data.horarios.filter(f => f && f.hora).map(f => f.hora).indexOf(hours)
    if(AC >= 0) {
      data.horarios.splice(AC, 1)
      saveScheMsg()
    }
  } else console.log('ID inexistente no sistema para remover o horário')
}

const existsHoursInMessage = (from, id, hours) => {
  if(existsIDinSM(from, id)) {
    let data = getMessageByID(from, id)
    let AC = data.horarios.filter(f => f && f.hora).map(f => f.hora).indexOf(hours)
    return AC >= 0
  }
  return false
}

function addImageInMessage(from, id, image) {
  if(existsIDinSM(from, id)) {
    let data = getMessageByID(from, id)
    if(data.imagem.length > 0) {
      data.imagem[0] = image
    } else {
      data.imagem.push(image)
    }
    saveScheMsg()
  } else console.log('ID inexistente no sistema para adicionar a imagem')
}

function rmMessageScheduled(from, id) {
  if(existsIDinSM(from, id)) {
    let data = getGroupScheMsg(from)
    let AB = data.dados.map(i => i.id).indexOf(id)
    data.dados.splice(AB, 1)
    saveScheMsg()
  } else console.log('ID inexistente no sistema para remover')
}

async function defaultScheduledMessage() {
  if(schemsg.length > 0) {
    let changed = false;
    for(let a of schemsg) {
      if(a.dados.length > 0) {
        for(let b of a.dados) {
          if(b.horarios.length) {
            for(let c of b.horarios) {
              if(c && c.dia && Number(c.dia) !== Number(sendHours('DD'))) {
                c.dia = sendHours('DD') // Corrigido: deve resetar para o dia atual, não HH:mm
                c.save = false // Resetar o status de enviado para o novo dia
                changed = true;
              }
            }
          }
        }
      }
    }
    if (changed) saveScheMsg();
  }
}

// Executa o reset diário ao carregar
defaultScheduledMessage()

async function ScheMsgFunc(blackmd, totalgp) {
  if(schemsg.length > 0) {
    for(let afsche of schemsg) {
      if(!afsche.acctive) continue;
      if(afsche.dados.length > 0) {
        for(let bfsche of afsche.dados) {
          let ABSCHE = totalgp.map(absche => absche.id).indexOf(afsche.groupId)
          let menc = bfsche.mentions && ABSCHE >= 0 ? totalgp[ABSCHE].participants.map(p => p.id) : []
          
          if(bfsche.horarios.length) {
            for(let cfsche of bfsche.horarios) {
              if(!cfsche) continue;
              
              const diaAtual = Number(sendHours('DD'));
              const horaAtualMin = contarMin(sendHours('HH:mm'));
              const horaAgendadaMin = contarMin(cfsche.hora);

              if(Number(cfsche.dia) === diaAtual && !cfsche.save && horaAtualMin >= horaAgendadaMin) {
                cfsche.save = true
                saveScheMsg() // Corrigido: era saveMessageHours() que não existia
                
                console.log(`[SISTEMA] Enviando mensagem agendada para ${afsche.groupId}`);
                
                if(bfsche.imagem && bfsche.imagem.length > 0) {
                  await blackmd.sendMessage(afsche.groupId, {image: {url: bfsche.imagem[0]}, caption: bfsche.text, mentions: menc})
                } else {
                  await blackmd.sendMessage(afsche.groupId, {text: bfsche.text, mentions: menc})
                }
              }
            }
          }
        }
      }
    }
  }
}

module.exports = { schemsg, saveScheMsg, addGroupInScheMsg, rmGroupInScheMsg, getGroupScheMsg, addMessageScheduled, getIDbyMessage, existsIDinSM, getMessageByID, addHoursInMessage, rmHoursInMessage, existsHoursInMessage, addImageInMessage, rmMessageScheduled, defaultScheduledMessage, ScheMsgFunc }
