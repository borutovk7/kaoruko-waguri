const fs = require("fs");

const { isJsonIncludes, allvaluerent, rmLetras, upload, getFileBuffer, colors, prepareWAMessageMedia, okarunsite, links } = require("../../definicoes.js");

//=============LEVEL===========\\
const moment = require("moment");
moment.locale("pt");

const sendHours = (formato) => {
  return moment().format(formato);
};

//const fs = require("fs");

function saveJSON(inter, caminho) {
  try {
    fs.writeFileSync(caminho, JSON.stringify(inter, null, 2), "utf-8");
//    console.log(`Arquivo salvo com sucesso em: ${caminho}`);
  } catch (err) {
//    console.error("Erro ao salvar JSON:", err);
  }
}

levelpath = `./database/leveling/leveling.json`

function saveLeVeLdb(base) {fs.writeFileSync(levelpath, JSON.stringify(base, null, 2))}

if(!fs.existsSync(levelpath)) {saveLeVeLdb([])}

const level = JSON.parse(fs.readFileSync(levelpath));

const isYouInLevel = (usu) => {
  AB = level.map(i => i.id).indexOf(usu)
  resp = AB < 0 ? false : true
  return resp
}

function addlevel(usu, quant) {
  nmr = Number(quant)
  AB = level.map(i => i.id).indexOf(usu)
  level[AB].level += nmr
  saveLeVeLdb(level)
}

function rmlevel(usu, quant) {
  nmr = Number(quant)
  AB = level.map(i => i.id).indexOf(usu)
  level[AB].level -= nmr
  saveLeVeLdb(level)
}

function addXP(usu, quant) {
  nmr = Number(quant)
  AB = level.map(i => i.id).indexOf(usu)
  level[AB].contador += nmr
  saveLeVeLdb(level)
}

function rmXP(usu, quant) {
  nmr = Number(quant)
  AB = level.map(i => i.id).indexOf(usu)
  level[AB].contador -= nmr
  saveLeVeLdb(level)
}

function blockLevelUser(usu) {
  AB = level.map(i => i.id).indexOf(usu)
  level[AB].block = true
  saveLeVeLdb(level)
}

function unBlockLevelUser(usu) {
  AB = level.map(i => i.id).indexOf(usu)
  level[AB].block = false
  saveLeVeLdb(level)
}

function isBlockGetLevelUser(usu) {
  AB = level.map(i => i.id).indexOf(usu)
  return level[AB].block
}

const levelDBuser = (usu) => {
  AB = level.map(i => i.id).indexOf(usu)
  return level[AB]
}

const dbpt = [
    {pat: "E-Rank I ⚪", xp: "0", nmr: 0},
    {pat: "E-Rank II ⚪", xp: "100", nmr: 100},
    {pat: "E-Rank III ⚪", xp: "200", nmr: 200},
    {pat: "D-Rank I 🔵", xp: "300", nmr: 300},
    {pat: "D-Rank II 🔵", xp: "400", nmr: 400},
    {pat: "D-Rank III 🔵", xp: "500", nmr: 500},
    {pat: "C-Rank I 🟢", xp: "600", nmr: 600},
    {pat: "C-Rank II 🟢", xp: "700", nmr: 700},
    {pat: "C-Rank III 🟢", xp: "800", nmr: 800},
    {pat: "B-Rank I 🟡", xp: "900", nmr: 900},
    {pat: "B-Rank II 🟡", xp: "1.200", nmr: 1200},
    {pat: "B-Rank III 🟡", xp: "1.500", nmr: 1500},
    {pat: "A-Rank I 🔴", xp: "1.800", nmr: 1800},
    {pat: "A-Rank II 🔴", xp: "2.100", nmr: 2100},
    {pat: "A-Rank III 🔴", xp: "2.700", nmr: 2700},
    {pat: "S-Rank I 🟣", xp: "3.300", nmr: 3300},
    {pat: "S-Rank II 🟣", xp: "3.900", nmr: 3900},
    {pat: "S-Rank III 🟣", xp: "4.500", nmr: 4500},
    {pat: "SS-Rank 💎", xp: "5.000", nmr: 5000},
    {pat: "SSS-Rank ⭐", xp: "5.500", nmr: 5500},
    {pat: "Transcendente I 👑", xp: "6.500", nmr: 6500},
    {pat: "Transcendente II 👑", xp: "7.500", nmr: 7500},
    {pat: "Transcendente III 👑", xp: "9.000", nmr: 9000},
    {pat: "Transcendente IV 👑", xp: "10.500", nmr: 10500},
    {pat: "Transcendente V 👑", xp: "12.000", nmr: 12000},
    {pat: "Divino I ❤️‍🔥", xp: "13.500", nmr: 13500},
    {pat: "Divino II ❤️‍🔥", xp: "15.000", nmr: 15000},
    {pat: "Divino III ❤️‍🔥", xp: "20.000", nmr: 20000},
    {pat: "Divino IV ❤️‍🔥", xp: "25.000", nmr: 25000},
    {pat: "Divino V ❤️‍🔥", xp: "30.000", nmr: 30000},
    {pat: "Imortal I 🪄", xp: "35.000", nmr: 35000},
    {pat: "Imortal II 🪄", xp: "40.000", nmr: 40000},
    {pat: "Imortal III 🪄", xp: "50.000", nmr: 50000},
    {pat: "Imortal IV 🪄", xp: "60.000", nmr: 60000},
    {pat: "Imortal V 🪄", xp: "70.000", nmr: 70000},
    {pat: "Supremo I ⚒️", xp: "80.000", nmr: 80000},
    {pat: "Supremo II ⚒️", xp: "100.000", nmr: 100000},
    {pat: "Supremo III ⚒️", xp: "150.000", nmr: 150000},
    {pat: "Deidade I 🛰️", xp: "200.000", nmr: 200000},
    {pat: "Deidade II 🛰️", xp: "300.000", nmr: 300000},
    {pat: "Deidade III 🛰️", xp: "400.000", nmr: 400000},
    {pat: "Absoluto I 🪩", xp: "500.000", nmr: 500000},
    {pat: "Absoluto II 🪩", xp: "1.000.000", nmr: 1000000},
    {pat: "Absoluto III 🪩", xp: "1.500.000", nmr: 1500000},
    {pat: "Infinito ⚜️", xp: "5.000.000", nmr: 5000000}
]

const patente = (exp) => {
  caixa = []
  for(i of dbpt) {
    if(Number(exp) >= i.nmr) caixa.push(i.pat)
  }
  return caixa[caixa.length - 1]
}

//=============RANK===========\\

temprankpath = `./database/leveling/ranqueda.json`

if(!fs.existsSync(temprankpath)) {saveJSON([], temprankpath)}

const ranktemp = JSON.parse(fs.readFileSync(temprankpath))

function saveNewTempRank() {saveJSON(ranktemp, temprankpath)}

const atualrank = ranktemp.length <= 0 ? 1 : ranktemp[ranktemp.length - 1].temporada

const atualmesrank = ranktemp.length <= 0 ? sendHours("MM") : ranktemp[ranktemp.length - 1].mes

function addNewRankTemp(rank = atualrank, mes = atualmesrank, totalrank = 2) {ranktemp.push({id: sendHours("MMYYYY"),temporada: rank, mes: mes, final: totalrank, usuarios: []})
saveNewTempRank()}

//gerar primeira temporada
if(ranktemp.length <= 0) {addNewRankTemp()}

//gerar próxima temporada
if(Number(sendHours("MM")) !== Number(atualmesrank)) {
  AB = ranktemp.map(nt => nt.temporada).indexOf(Number(atualrank))
  if(ranktemp[AB].final > 1) {
    ranktemp[AB].mes = sendHours("MM")
    ranktemp[AB].final -= 1
    saveNewTempRank()
  } else {
    addNewRankTemp(atualrank + 1, sendHours("MM"))
    console.log(colors.yellow(`GERANDO ${atualrank + 1}ª TEMPORADA DE CAÇA`))
    setTimeout(() => {
      return process.exit()
    }, 700);
  }
}

const existUsuInRank = (usu, temp) => {
  if(ranktemp.length <= 0) return false
  nmr = 0
  if(temp != undefined) {
    for(a of ranktemp) {
      if(Number(temp) === a.temporada) {
        for(b of a.usuarios) {
          if(b.id == usu) nmr += 1
        }
      }
    }
  } else {
    if(!isJsonIncludes(ranktemp, usu)) return false
    nmr += 1
  }
  return nmr > 0 ? true : false
}

const getInfoRankLevel = (temp) => {
  caixa = []
  for(i of ranktemp) {
    if(Number(i.temporada) === Number(temp)) caixa.push(i)
  }
  return caixa[0]
}

const getInfoUsuAtualRank = (usu, rank = atualrank) => {
  inforank = getInfoRankLevel(rank)
  AB = inforank.usuarios.map(a => a.id).indexOf(usu)
  return inforank.usuarios[AB]
}

function addUsuInRank(usu, type, msg = 1) {
  if(!existUsuInRank(usu, atualrank)) {
    inforank = getInfoRankLevel(atualrank)
    inforank.usuarios.push({id: usu, messages: [], cmd: []})
    saveNewTempRank()
  } else {
    data = getInfoUsuAtualRank(usu)
    dia = sendHours("DD")
    mes = sendHours("MM")
    AB = data.messages.map(a => a.mes).indexOf(mes)
    if(AB < 0) {
      data.messages.push({mes: mes, dias: []})
      saveNewTempRank()
    } else {
      BC = data.messages[AB].dias.map(b => b.dia).indexOf(dia)
      if(BC < 0) {
        data.messages[AB].dias.push({dia: dia, dados: {msg: 0, fig: 0, ft: 0, vid: 0, aud: 0, ctt: 0, doc: 0, loc: 0}})
        saveNewTempRank()
      } else {
        dados = data.messages[AB].dias[BC].dados
        if(type == "stickerMessage") {
          dados.fig += msg
          saveNewTempRank()
        } else if(type == "imageMessage") {
          dados.ft += msg
          saveNewTempRank()
        } else if(type == "videoMessage") {
          dados.vid += msg
          saveNewTempRank()
        } else if(type == "audioMessage") {
          dados.aud += msg
          saveNewTempRank()
        } else if(type == "contactMessage") {
          dados.ctt += msg
          saveNewTempRank()
        } else if(type == "documentMessage") {
          dados.doc += msg
          saveNewTempRank()
        } else if(type == "locationMessage") {
          dados.loc += msg
          saveNewTempRank()
        } else {
          dados.msg += msg
          saveNewTempRank()
        }
      }
    }
  }
}

function addCommandInUsuLevelRank(usu, cmd, quant = 1) {
  data = getInfoUsuAtualRank(usu)
  commands = data.cmd
  AB = commands.map(i => i.name).indexOf(rmLetras(cmd))
  if(AB < 0) {
    commands.push({name: rmLetras(cmd), uso: quant})
    saveNewTempRank()
  } else {
    commands[AB].uso += quant
    saveNewTempRank()
  }
}

function resetGhostInRankLevel() {
  if(ranktemp.length > 2) {
    rankmenosum = ranktemp.length - 1
    rankmenosdois = ranktemp.length - 2
    for(a of ranktemp[rankmenosdois].usuarios) {
      AB = level.map(b => b.id).indexOf(rmLetras(a.id))
      if(!isJsonIncludes(ranktemp[rankmenosum].usuarios.map(a1 => a1.id), a.id) && AB < 0) {
        level.splice(AB, 1)
        saveLeVeLdb(level)
      }
    }
  }
}


const getFinishInfoRankLevel = (usu, rank) => {
  data = getInfoUsuAtualRank(usu, rank)
  messages = data.messages
  totalmsg = 0
  totalfig = 0
  totalft = 0
  totalvid = 0
  totalaud = 0
  totalctt = 0
  totaldoc = 0
  totalloc = 0
  totaldivi = 0
  for(a of messages) {
    totaldivi += a.dias.length
    for(b of a.dias) {
      c = b.dados
      totalmsg += c.msg
      totalfig += c.fig
      totalft += c.ft
      totalvid += c.vid
      totalaud += c.aud
      totalctt += c.ctt
      totaldoc += c.doc
      totalloc += c.loc
    }
  }
  allmsg = totalmsg + totalfig + totalft + totalvid + totalaud + totalctt + totaldoc + totalloc
  divimsg = allmsg > 0 ? Number(allmsg / totaldivi).toFixed(0) : 0
  diasfaltados = []
  ultimodia = 0
  for(d of messages) {
    if(Number(d.mes) <= ranktemp[rank - 1].mes) {
      ultimomes = moment(d.mes, "MM").endOf("month").date()
      ultimodia += Number(ultimomes)
      for(e = 0; e < Number(ultimomes); e++) {
        g = e + 1
        addzero = g < 10 ? "0" + String(g) : String(g)
        if(!isJsonIncludes(d.dias.map(f => f.dia), addzero)) diasfaltados.push(addzero + "/" + d.mes)
      }
    }
  }
  if(data.cmd.length > 0) {
    matheuzinho = data.cmd.map(dc => dc)
    top = matheuzinho.sort((x, y) => (x.uso < y.uso) ? 0 : -1)
  }
  return {
    id: usu,
    totalmsg: allmsg,
    mediamsg: divimsg,
    totalcmd: data.cmd.length,
    cmdmaisusado: data.cmd.length > 0 ? top[0].name : null,
    dadosmsg: {
      mensagens: totalmsg,
      figs: totalfig,
      fotos: totalft,
      videos: totalvid,
      audios: totalaud,
      contatos: totalctt,
      docs: totaldoc,
      locs: totalloc
    },
    totaldias: totaldivi,
    diasfaltados: diasfaltados,
    pp: diasfaltados.length > 0 ? Number(100 - ((diasfaltados.length / Number(ultimodia)) * 100)).toFixed(1) : 100//pp = porcentagem de presença
  }
}

const convertNumberInMonth = (pser) => {
  allmes = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
  return allmes[Number(pser) - 1]
}


async function finishUsuRankTemp(kyomi, from, usu, prefix, pushname, info) {
  if(ranktemp.length > 1) {
    if(!existUsuInRank(usu, atualrank) && existUsuInRank(usu, atualrank - 1)) {
      console.log(colors.green(`DADOS DO CAÇADOR ${pushname} COLETADOS COM SUCESSO`))
      console.log(colors.white(`NÚMERO wa.me/${usu.split("@")[0]}\n\n`))
      /*try {
        getimg = await kyomi.profilePictureUrl(usu, 'image')
        upwapi = await prepareWAMessageMedia({image: {url: getimg}}, {upload: kyomi.waUploadToServer})
        getfile = await getFileBuffer(upwapi.imageMessage, `image`)
        ppimg = await upload(getfile)
      } catch { ppimg = `https://blackstorage.store/midia/1739312972663.gif` }*/
      dados = getFinishInfoRankLevel(usu, atualrank - 1)
      calendario = []
      if(dados.diasfaltados.length > 0) {
        dados.diasfaltados.forEach(dd => {
          AB = calendario.map(i => i.mes).indexOf(dd.split("/")[1])
          if(AB < 0) {
            calendario.push({mes: dd.split("/")[1], dias: [dd.split("/")[0]]})
          } else {
            calendario[AB].dias.push(dd.split("/")[0])
          }
        })
      }
      LV = level.map(l => l.id).indexOf(usu)
      patatual = patente(level[LV].contador)
      lvatual = dbpt.map(d => d.pat).indexOf(patatual) + 1
      if(lvatual <= dbpt.length) {
        percentual = 100 - Number(dados.pp)
        rest = dbpt[lvatual].nmr - dbpt[lvatual - 1].nmr
        sublv = Number(String(rest + ((percentual * rest) / 100)).split(".")[0])
        maxlv = level[LV].contador
        minlv = maxlv - sublv
        if(minlv > 0) {
          proxlv = dbpt.map(d => d.pat).indexOf(patente(minlv)) + 1
          level[LV].level = proxlv
          saveLeVeLdb(level)
          level[LV].contador -= sublv
          saveLeVeLdb(level)
          dimlvtxt = `⚔️ *ALTERAÇÃO NO RANK* ⚔️
- *Novo Nível:* ~${lvatual}~ → ${proxlv}
- *Novo Rank:* ~${patatual}~ → ${patente(minlv)}
- *Novo XP:* ~${maxlv}~ → ${minlv}`
        } else {
          proxlv = 0
          level.splice(LV, 1)
          saveLeVeLdb(level);
          dimlvtxt = `🔥 **RANK ZERADO POR NÍVEL MUITO BAIXO** 🔥`
        }
      } else { dimlvtxt = `⚜️ **NENHUMA ALTERAÇÃO NO RANK - VOCÊ ATINGIU O MÁXIMO** ⚜️` }
      resumolevel =
`╔════════════════════════════════════════╗
║   📊 RESUMO DA ${atualrank - 1}ª TEMPORADA 📊   ║
╚════════════════════════════════════════╝

👤 *CAÇADOR:* @${dados.id.split("@")[0]}

⚔️ *_DADOS DE ATIVIDADES - GERAL_* ⚔️
- *Mensagens:* ${dados.totalmsg}
- *Média:* ${dados.mediamsg} mensage${dados.mediamsg != 1 ? "ns" : "m"} por dia
- *Comandos Usados:* ${dados.totalcmd}
- *Comando Favorito:* ${dados.cmdmaisusado != null ? prefix+dados.cmdmaisusado : `"sem dados"`}

🎯 *_DADOS DE ATIVIDADES - ESPECÍFICO_* 🎯
💬 *Mensagens:* ${dados.dadosmsg.mensagens}
🥰 *Figurinhas:* ${dados.dadosmsg.figs}
🖼 *Fotos:* ${dados.dadosmsg.fotos}
📺 *Vídeos:* ${dados.dadosmsg.videos}
🎤 *Áudios:* ${dados.dadosmsg.audios}
☎ *Contatos:* ${dados.dadosmsg.contatos}
🗂 *Documentos:* ${dados.dadosmsg.docs}
📍 *Localizações:* ${dados.dadosmsg.locs}

📅 *_ESTATÍSTICAS DE PRESENÇA_* 📅
🥇 *Dias Participados:* ${dados.totaldias}
🥈 *Dias Faltados:* ${dados.diasfaltados.length > 0 ? calendario.map(c => `
× *Mês:* ${convertNumberInMonth(c.mes)}
× *Dias:* ${c.dias.join(", ")}`).join(`\n`) : `"nenhum"`}
🥉 *Presença:* ${dados.pp}%

${dimlvtxt}`
      //return kyomi.sendMessage(from, {text: resumolevel}, {quote: info})
      addUsuInRank(usu)
      ppimg =  links.semfoto
      try {
        kyomi.sendMessage(from, {
          image: {
            url: okarunsite+`/api/canvas/levelup2?nome=${pushname}&lvb=${lvatual}&lva=${proxlv}&foto=${ppimg}&fundo=https://blackstorage.store/midia/1735955841752.jpg`
          },
          caption: resumolevel,
          mentions: [dados.id]
        }, {quote: info})
      } catch(e) {
        console.log(e)
        kyomi.sendMessage(from, {text: resumolevel, mentions: [dados.id]}, {quote: info})
      }
    }
  }
}

//===========CARD-XP===========\\

cardpath = `./database/leveling/cardxp.json`

if(!fs.existsSync(cardpath)) {saveJSON([], cardpath)}

const cardxp = JSON.parse(fs.readFileSync(cardpath))

function saveCardXP() {saveJSON(cardxp, cardpath)}

function addCardExperience(usu) {
  if(!isJsonIncludes(cardxp, usu)) {
    cardxp.push({id: usu, mapa: 0, active: false, save: "00", tempo: 0, cards: []})
    saveCardXP()
  }
}

function addUsuCardXP(mention, prefix, usu, v, d) {
  addCardExperience(usu)
  nmr = Number(d.slice(0, d.length - 1))
  letra = d.slice(d.length - 1, d.length).toLowerCase()
  multiplicador = Number(v.slice(0, v.length - 1))
  if(letra == `d`) vzs = 24
  else vzs = 1
  nmr *= vzs
  AB = cardxp.map(i => i.id).indexOf(usu)
  cardxp[AB].cards.push({multi: multiplicador, horas: nmr})
  saveCardXP()
  mention(`🔖 *_Cristal de Experiência ${multiplicador}x ativado por ${nmr == 24 ? "24h" : String(Number(nmr / 24).toFixed(0)) +"d"} para o caçador @${usu.split("@")[0]} com sucesso... Use ${prefix}setcard para ativar 🪽_*`)
}

const getCardXPusu = (usu) => {
  AB = cardxp.map(i => i.id).indexOf(usu)
  return cardxp[AB]
}

const valoresXP = (allvaluerent && allvaluerent?.cardxp) ? allvaluerent?.cardxp : [];

function cardTime(kyomi, tempo) {
  if(cardxp.length > 0) {
    for(a of cardxp) {
      if(a.active) {
        if(Number(a.save) !== Number(sendHours("HH"))) {
          a.save = sendHours("HH")
          saveCardXP()
          if(a.tempo > 1) {
            a.tempo -= 1
            saveCardXP()
          } else {
            a.active = false
            saveCardXP()
            a.cards.splice(a.mapa, 1)
            saveCardXP()
            kyomi.sendMessage(a.id, {text: `${tempo} @${a.id.split("@")[0]}, estou apenas passando para avisar que seu Cristal de Experiência expirou... Caso queira um novo, ative algum de sua lista ou compre um na loja 😊`, mentions: [a.id]})
          }
        }
      }
    }
  }
}

module.exports = { isYouInLevel, dbpt, patente, saveLeVeLdb, level, addlevel, rmlevel, addXP, rmXP, blockLevelUser, unBlockLevelUser, isBlockGetLevelUser, levelDBuser, cardxp, addCardExperience, addUsuCardXP, valoresXP, getCardXPusu, saveCardXP, cardTime,
ranktemp, saveNewTempRank, atualrank, atualmesrank, addNewRankTemp, existUsuInRank, getInfoUsuAtualRank, addUsuInRank, addCommandInUsuLevelRank, resetGhostInRankLevel, getFinishInfoRankLevel, finishUsuRankTemp }
