const fs = require("fs")
const path = require("path")

const { isJsonIncludes, saveJSON, sendHours, contarMin, converterMin, getBuffer, isUrl } = require(`../../definicoes.js`)


const { NomeDoBot, ownerName, prefix, instaCriador, criador } = require('../../configs/configs.json');

const adsSytemPath = `./arquivos/mensagens programadas/ads.json`

// Garantir que o diretório existe
const dir = path.dirname(adsSytemPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

if(!fs.existsSync(adsSytemPath)) {fs.writeFileSync(adsSytemPath, JSON.stringify([]))}

const ads = JSON.parse(fs.readFileSync(adsSytemPath))

function saveADS() {saveJSON(ads, adsSytemPath)}

function addGroupInAds(from) {
  // Fix: ads usa groupId, não id — isJsonIncludes nunca batia e criava duplicatas
  if(!ads.some(i => i.groupId === from)) {
    ads.push({groupId: from, acctive: true, horarios: []})
    saveADS()
  }
}

const getGroupAds = (from) => {
  let AB = ads.map(i => i.groupId).indexOf(from)
  return ads[AB]
}

const existAdminAds = (from, sender) => {
  let data = getGroupAds(from)
  if (!data) return false
  let caixa = []
  for(let c of data.horarios) {
    if(c.adm && c.adm.length > 0) caixa.push(c.adm[0])
  }
  return caixa.includes(sender)
}

const getAdminAds = (from, sender) => {
  let data = getGroupAds(from)
  if (!data) return undefined
  let caixa = []
  for(let c of data.horarios) {
    if(c.adm && c.adm.length > 0 && c.adm.includes(sender)) caixa.push(c)
  }
  return caixa[0]
}

function rmAdminAds(from, sender) {
  let groupAds = getGroupAds(from);
  if(!groupAds) return;

  // Fix: remove o horario inteiro se o adm ficar vazio, evita entradas fantasma
  groupAds.horarios = groupAds.horarios.filter(c => {
    if(c.adm && c.adm.includes(sender) && !c.start) {
      return false // Remove horarios pendentes (não iniciados) desse sender
    }
    return true
  })
  saveADS()
}

function addAdminAds(from, sender, txt, image = []) {
  rmAdminAds(from, sender) // Remove pendente anterior (síncrono, sem setTimeout)
  let data = getGroupAds(from)
  if (!data) {
      addGroupInAds(from);
      data = getGroupAds(from);
  }
  data.horarios.push({
      id: sendHours("DDMMYYHHmmss") + Math.floor(Math.random() * 1000),
      start: false,
      mentions: false,
      text: txt,
      adm: [sender],
      tempo: {horario: "", type: "", valor: "", dias: 0, save: ""},
      imagem: image
  })
  saveADS()
}

function addAds(from, sender, tempo) {
  let data = getAdminAds(from, sender)
  if (!data) return;
  
  let letra = tempo.toLowerCase().slice(-1)
  let numeral = Number(tempo.toLowerCase().slice(0, -1))
  
  if(isNaN(numeral)) return;
  
  let minutosParaAdicionar = (letra === 'h') ? numeral * 60 : numeral;
  
  let horaatual = sendHours("HH:mm");
  let soma = contarMin(horaatual) + minutosParaAdicionar;
  
  let dias = Math.floor(soma / 1440);
  let sobra = soma % 1440;
  
  // Define o horário do PRIMEIRO envio como a hora atual para disparar imediatamente
  data.tempo.horario = sendHours("HH:mm")
  data.tempo.type = letra
  data.tempo.valor = numeral
  data.tempo.dias = 0
  data.tempo.save = sendHours("DD")
  data.start = true
  // Fix: removida a chamada rmAdminAds aqui — ela limpava o adm[] do horario ativo,
  // deixando entradas órfãs com adm vazio acumulando no JSON.
  // O horario ativo é removido corretamente via rmAds(from, id) pelo usuário.
  saveADS()
}

const isIDads = (from, id) => {
  let data = getGroupAds(from)
  if (!data) return false
  let AB = data.horarios.map(i => i.id).indexOf(id)
  return AB >= 0
}

function rmAds(from, id) {
  let data = getGroupAds(from)
  if (!data) return;
  let AB = data.horarios.map(i => i.id).indexOf(id)
  if (AB >= 0) {
    data.horarios.splice(AB, 1)
    saveADS()
  }
}

async function adsFunc(blackmd, totalgp) {
  if(ads.length > 0) {
    for(let afads of ads) {
      if(!afads.acctive) continue;
      if(afads.horarios.length > 0) {
        for(let bfads of afads.horarios) {
          if(!bfads.start) continue;
          
          const diaAtual = Number(sendHours("DD"));
          const saveDia = Number(bfads.tempo.save);
          
          // Lógica de decremento de dias
          if (diaAtual !== saveDia) {
              let diff = diaAtual - saveDia;
              if (diff < 0) diff += 30; // Simplificação para virada de mês
              bfads.tempo.dias -= diff;
              bfads.tempo.save = sendHours("DD");
              saveADS();
          }

          if(bfads.tempo.dias <= 0) {
            if(contarMin(sendHours("HH:mm")) >= contarMin(bfads.tempo.horario)) {
                let AB = totalgp.map(t => t.id).indexOf(afads.groupId)
                let menc = bfads.mentions && AB >= 0 ? totalgp[AB].participants.map(p => p.id) : []
                
                console.log(`[ADS] Enviando anúncio para ${afads.groupId}`);
                
                if(bfads.imagem && bfads.imagem.length > 0) {
                  await blackmd.sendMessage(afads.groupId, {
                    image: { url: bfads.imagem[0] }, 
                    caption: bfads.text, 
                    mentions: menc
                  })
                } else {
                  await blackmd.sendMessage(afads.groupId, {
                    text: bfads.text, 
                    mentions: menc
                  })
                }

                // Calcular próximo horário
                let minutosIntervalo = (bfads.tempo.type === 'h') ? bfads.tempo.valor * 60 : bfads.tempo.valor;
                let novaSoma = contarMin(sendHours("HH:mm")) + minutosIntervalo;
                
                bfads.tempo.dias = Math.floor(novaSoma / 1440);
                bfads.tempo.horario = converterMin(novaSoma % 1440);
                bfads.tempo.save = sendHours("DD");
                saveADS();
            }
          }
        }
      }
    }
  }
}

const adsStartList = (text, id) => {
  const setday = "🔎 SET ADS AQUI 🔍"
  return [
    {title: setday, body: "Intervalo de 5 minutos", command: text+"|5m|"+id},
    {title: setday, body: "Intervalo de 10 minutos", command: text+"|10m|"+id},
    {title: setday, body: "Intervalo de 30 minutos", command: text+"|30m|"+id},
    {title: setday, body: "Intervalo de 1 hora", command: text+"|1h|"+id},
    {title: setday, body: "Intervalo de 2 horas", command: text+"|2h|"+id},
    {title: setday, body: "Intervalo de 24 horas", command: text+"|24h|"+id}
  ]
}

module.exports = { ads, saveADS, addGroupInAds, getGroupAds, addAds, isIDads, rmAds, adsFunc, adsStartList, existAdminAds, getAdminAds, rmAdminAds, addAdminAds }
