const fs = require("fs")

const { sleep, moment } = require("../../../definitions.js")

const isJsonIncludes = (json, value) => {
if(JSON.stringify(json).includes(value)) return true
return false}

function saveJSON(inter, caminho) {
fs.writeFileSync(caminho, JSON.stringify(inter, null, 2))}

const alerandom = (nmr) => {return Math.floor(Math.random()*nmr)}

const rmLetras = (txt) => {
return txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")}

const iniMai = (texto) => {
txt = texto.toUpperCase().slice(0, 1) + texto.slice(1)
return txt}

const contar = (frase, letraProcurada) => {
     total = 0
     for(i = 0; i < frase.length; i++) {
          if(letraProcurada == frase[i]) total += 1
     }
     return total
}

const sendHours = (formato) => {return moment.tz('America/Sao_Paulo').format(formato)}

const shuffle = (XXX) => {
     palavra = `${XXX} `
     armax = []
     for(i = 0; i < palavra.length; i++) {
          armax.push({letra: palavra.split(palavra.slice(i+1))[0].slice(i)})
     }
     pross = ""
     total_armax = armax.length
     for(a = 0; a < total_armax; a++) {
          alex = Math.floor(Math.random()*armax.length)
          pross += `${armax[alex].letra}`
          armax.splice(alex, 1)
     }
     return pross
}

//==================USUÁRIOS===================\\

const usuariosForcaPath = `./javascript/jogo/forca/usuarios.json`

function saveUsuForcaGame(pasta) {saveJSON(pasta, usuariosForcaPath)}

if(!fs.existsSync(usuariosForcaPath)) {saveUsuForcaGame([])}

const usuarios_forca = JSON.parse(fs.readFileSync(usuariosForcaPath))

function addUsuarioForca(sender) {
     AB = usuarios_forca.map(i => i.id).indexOf(sender)
     if(AB < 0) {
          usuarios_forca.push({
               id: sender, dados: {
                    acertos: 0,
                    erros: 0,
                    corretor: 0,
                    jogos: 0,
                    partidas: []
               }
          })
          saveUsuForcaGame(usuarios_forca);
     }
}

function rmUsuarioForca(sender) {
     AB = usuarios_forca.map(i => i.id).indexOf(sender)
     usuarios_forca.splice(AB, 1)
     saveUsuForcaGame(usuarios_forca);
}

function addAcertoUsuForca(sender, nmr) {
     AB = usuarios_forca.map(i => i.id).indexOf(sender)
     usuarios_forca[AB].dados.acertos += Number(nmr)
     saveUsuForcaGame(usuarios_forca);
     if(usuarios_forca[AB].dados.corretor >= 20) {
          usuarios_forca[AB].dados.corretor = 0
          saveUsuForcaGame(usuarios_forca);
          nmr = (usuarios_forca[AB].dados.erros - 2) < 0 ? usuarios_forca[AB].dados.erros : 2
          usuarios_forca[AB].dados -= nmr
          saveUsuForcaGame(usuarios_forca);
     }
}

function addErroUsuForca(sender, nmr) {
     AB = usuarios_forca.map(i => i.id).indexOf(sender)
     usuarios_forca[AB].dados.erros += Number(nmr)
     saveUsuForcaGame(usuarios_forca);
}

const existIdForcaGameInUsu = (sender, from) => {
     AB = usuarios_forca.map(i => i.id).indexOf(sender)
     data = JSON.parse(fs.readFileSync(`./javascript/jogo/forca/${from}.json`))
     nmr = 0
     for(i of usuarios_forca[AB].dados.partidas) {
          if(data.ID == i.id) nmr += 1
     }
     return nmr > 0 ? true : false
}

function registrarIdNaForca(sender, from, quant, tipo) {
     addUsuarioForca(sender);
     AB = usuarios_forca.map(i => i.id).indexOf(sender)
     usuarios_forca[AB].dados.jogos += Number(quant)
     saveUsuForcaGame(usuarios_forca);
     data = JSON.parse(fs.readFileSync(`./javascript/jogo/forca/${from}.json`))
     AC = usuarios_forca[AB].dados.partidas.map(u => u.id).indexOf(data.ID)
     if(tipo == 0) {
          if(AC >= 0) {
               usuarios_forca[AB].dados.partidas[AC].letras_acertadas += Number(quant)
               saveUsuForcaGame(usuarios_forca)
          } else {
               usuarios_forca[AB].dados.partidas.push({id: data.ID, letras_acertadas: 1, letras_erradas: 0})
               saveUsuForcaGame(usuarios_forca)
          } 
     }
     if(tipo == 1) {
          if(AC >= 0) {
               usuarios_forca[AB].dados.partidas[AC].letras_acertadas += Number(quant)
               saveUsuForcaGame(usuarios_forca)
          } else {
               usuarios_forca[AB].dados.partidas.push({id: data.ID, letras_acertadas: 0, letras_erradas: 1})
               saveUsuForcaGame(usuarios_forca)
          }
     }
}

function addVitoriaForca(sender, nmr) {
     addUsuarioForca(sender);
     AB = usuarios_forca.map(i => i.id).indexOf(sender)
     usuarios_forca[AB].dados.acertos += Number(nmr)
     usuarios_forca[AB].dados.jogos += Number(nmr)
}

function addDerrotaForca(sender, nmr) {
     addUsuarioForca(sender);
     AB = usuarios_forca.map(i => i.id).indexOf(sender)
     usuarios_forca[AB].dados.erros += Number(nmr)
     usuarios_forca[AB].dados.jogos += Number(nmr)
}

const getUsuDatabaseForca = (sender, barrinha) => {
     AB = usuarios_forca.map(i => i.id).indexOf(sender)
     i = usuarios_forca[AB].dados
     caixa = []
     porc = 0
     total = 0
     if(i.partidas.length > 0) {
          for(pt of i.partidas) {
               porc += (pt.letras_acertadas / (pt.letras_acertadas + pt.letras_erradas)) * 100
               total += 1
          }
          caixa.push(porc / total)
     }
     br = !isNaN(Number((i.acertos / (i.acertos + i.erros)) * 100).toFixed(1)) ? barrinha(i.acertos, i.acertos + i.erros) : `〘${"▒".repeat(10)}〙0%`
     txt =
`🎗 *_FORCA - DADOS PESSOAIS_* 🎗

📈 *Acertos:* ${i.acertos}
📉 *Erros:* ${i.erros}
🎮 *Partidas jogadas:* ${i.jogos}
📊 *Percentual de ganhos ↴*
${br}

🏓 *Média - acerto de letras por jogos:* ${caixa.length > 0 ? Number(caixa[0]).toFixed(1) : 0}%`
return txt
}

//=============REGISTRAR-PALAVRAS===============\\

const forcaWordPath = `./javascript/jogo/forca/palavras.json`

function saveForcaWord(pasta) {saveJSON(pasta, forcaWordPath)}

if(!fs.existsSync(forcaWordPath)) {saveForcaWord([])}

const forcaWord = JSON.parse(fs.readFileSync(forcaWordPath))

const sendPathForcaGame = (grupo) => {
return forcaWordPath.replace("palavras", grupo)}

const existSomeWordForcaGame = forcaWord.length > 0 ? true : false

const existThemeWordForcaGame = (txt) => {
     if(forcaWord.length <= 0) return false
     nmr = 0
     for(i of forcaWord) {
          if(rmLetras(txt) === rmLetras(i.title)) nmr += 1
     }
     return nmr > 0 ? true : false
}

const getThemeWordForcaGame = (txt) => {
     caixa = []
     for(i of forcaWord) {
          if(rmLetras(txt) === rmLetras(i.title)) caixa.push(i)
     }
     return caixa[0]
}

const getRandomWordForcaGame = () => {
     primeiro = []
     for(a of forcaWord) {
          for(b of a.words) {
               primeiro.push({title: a.title, nome: b.nome, desc: b.desc})
          }
     }
     segundo = []
     for(l = 0; l < primeiro.length; l++) {
          random = alerandom(primeiro.length)
          segundo.push(primeiro[random])
          primeiro.splice(random, 1)
     }
     return segundo[alerandom(segundo.length)]
}

function rgWordForcaGame(tm, pl, dc) {
     if(!existThemeWordForcaGame(tm)) {
          forcaWord.push({title: tm, words: []})
          saveForcaWord(forcaWord)
     }
     palavras = getThemeWordForcaGame(tm).words
     palavras.push({nome: pl, desc: dc})
     saveForcaWord(forcaWord);
}

function rmThemeForcaGame(reply, tm) {
     caixa = []
     nmr = -1
     for(i of forcaWord) {
          nmr += 1
          if(tm == i.title) caixa.push(nmr)
     }
     if(nmr < 0) return reply(`[❗] tema da forca não encontrado ou inexistente ❌`)
     forcaWord.splice(nmr, 1)
     saveForcaWord(forcaWord);
     reply(`O tema "${tm}" foi deletado com sucesso ✅`)
}

function rmWordForcaGame(reply, pl) {
     caixa = []
     a1 = -1
     for(a of forcaWord) {
          a1 += 1
          a2 = -1
          for(b of a.words) {
               a2 += 1
               if(pl == b.nome) {
                    caixa.push(a1)
                    caixa.push(a2)
               }
          }
     }
     if(a1 >= 0 && a2 >= 0) {
          forcaWord[caixa[0]].words.splice(caixa[1], 1)
          saveForcaWord(forcaWord);
          return reply(`Palavra da forca deletada com sucesso 🥰`)
     } else return reply(`[❗] palavra da forca não encontrada ou inexistente ❌`)
}

//===============JOGO===============\\

const isForcaGame = (grupo) => {
     if(fs.existsSync(sendPathForcaGame(grupo))) return true
     return false
}

function saveForcaGame(inter, from) {saveJSON(inter, sendPathForcaGame(from))}

function startForcaGame(reply, prefix, from) {
     palavra = getRandomWordForcaGame()
     sp = palavra.nome.split(` `)
     nm = []
     for(s of sp) {
          nm.push(`_ `.repeat(s.length))
     }
     caixa = []
     for(a = 0; a < sp.length; a++) {
          caixa.push({words: []})
          for(b of sp[a]) {
               caixa[a].words.push({letra: b, acertou: false})
          }
     }
     game = {
          ID: sendHours("DDMMYYYY") + sendHours("HHmmss"),
          title: palavra.title,
          nome: palavra.nome,
          desc: palavra.desc,
          erros: 0,
          letras: [],
          resultado: caixa
     }
     saveForcaGame(game, from)
txt = `🎗 *_FORCA INICIADA COM SUCESSO_* 🎗

🎮 *Tema:* ${iniMai(palavra.title)}
🖱 *Dica:* ${iniMai(palavra.desc)}

______
\t\t\t|





${nm.join(`\t\t`)}

${"-".repeat(40)}
Use "${prefix}fc" para responder ヅ
${"-".repeat(40)}`
reply(txt)
}

function resetForcaGame(from) {fs.unlinkSync(sendPathForcaGame(from))}

function restartForcaGame(reply, prefix, from) {
     resetForcaGame(from)
     setTimeout(() => {
          startForcaGame(reply, prefix, from)
     }, 1000);
}

const getJSONforcaGame = (grupo) => {
     jogo = JSON.parse(fs.readFileSync(sendPathForcaGame(grupo)))
     return jogo
}

const letraFoiJogada = (grupo, letra) => {
     data = getJSONforcaGame(grupo)
     if(data.letras.length <= 0) return false
     nmr = 0
     for(i of data.letras) {
          if(rmLetras(letra) === rmLetras(i)) nmr += 1
     }
     return nmr > 0 ? true : false
}

const isTrueLetter = (from, q) => {
     data = getJSONforcaGame(from)
     nmr = 0
     for(a of data.resultado) {
          for(b of a.words) {
               if(rmLetras(q) === rmLetras(b.letra)) nmr += 1
          }
     }
     return nmr > 0 ? true : false
}

const isLetterFinishForcaGame = (from) => {
     data = getJSONforcaGame(from)
     total = 0
     for(a of data.resultado) {
          for(b of a.words) {
               if(b.acertou) total += 1
          }
     }
     nome = data.nome.split(` `).join(``).length
     if(total == nome) return true
     return false
}

function registrarLetraForca(from, q) {
     data = getJSONforcaGame(from)
     data.letras.push(q)
     saveForcaGame(data, from)
     if(isTrueLetter(from, q)) {
          caixa = []
          for(a = 0; a < data.resultado.length; a++) {
               caixa.push({words: []})
               for(b of data.resultado[a].words) {
                    r = rmLetras(q) === rmLetras(b.letra) || b.acertou ? true : false
                    caixa[a].words.push({letra: b.letra, acertou: r})
               }
          }
          data.resultado = caixa
          saveForcaGame(data, from)
     }
}

const getWordSplitForcaGame = (from) => {
     data = getJSONforcaGame(from)
     txt = data.resultado.map(a => a.words.map(b => b.acertou ? b.letra.toUpperCase() : `_`).join(` `)).join(`\t\t`)
     return txt
}

const getErrEmojiForcaGame = (from) => {
     data = getJSONforcaGame(from)
     nmr = data.erros
     return `${nmr > 0 ? `\t\t😔` : ``}
${nmr > 2 ? `✋🏼` : ``}${nmr > 1 ? `${nmr > 2 ? `` : `\t\t`}🎽` : ``}${nmr > 3 ? `🤚🏼` : ``}
${nmr > 4 ? `\t\t🩳` : ``}
${nmr > 5 ? `\t👟` : ``}${nmr > 6 ? `👟` : ``}`
}

function sendTextForcaGame(reply, prefix, from) {
     data = getJSONforcaGame(from)
     txt = `🎗 *_FORCA GAME_* 🎗

🎮 *Tema:* ${iniMai(data.title)}
🖱 *Dica:* ${iniMai(data.desc)}
${data.letras.length > 0 ? `🪁 *Letras jogadas:* ${data.letras.join(`, `)}
` : ``}______
\t\t\t|
${getErrEmojiForcaGame(from)}

${getWordSplitForcaGame(from)}

${"-".repeat(40)}
Use "${prefix}fc" para responder ヅ
${"-".repeat(40)}`
reply(txt)
}

const getTextForcaGame = (from) => {
     data = getJSONforcaGame(from)
     return `🎗 *_FORCA GAME_* 🎗

🎮 *Tema:* ${iniMai(data.title)}
🖱 *Dica:* ${iniMai(data.desc)}
______
\t\t\t|
${getErrEmojiForcaGame(from)}

${getWordSplitForcaGame(from)}`
}

async function jogarLetraForcaGame(mention, from, sender, prefix, q) {
     data = getJSONforcaGame(from)
     if(q.length > 1) {
          if(rmLetras(q) === rmLetras(data.nome)) {
               addVitoriaForca(sender, 1)
               errou = `😀 Parabéns @${sender.split("@")[0]}, você acertou a palavra toda`
          } else {
               addDerrotaForca(sender, 1)
               errou = `😂 Muito burro @${sender.split("@")[0]}, você tentou a palavra toda e errou kkkkk`
          }
          errou += `... Irei reiniciar o jogo (caso queira encerrar o jogo, use ${prefix}rfc) ♨`
          mention(errou)
          return restartForcaGame(mention, prefix, from)
     } else {
          if(letraFoiJogada(from, q)) return mention(`Essa letra já foi jogada... Escolha outra pfvr 🥱`)
          registrarLetraForca(from, q)
          if(isTrueLetter(from, q)) {
               if(isLetterFinishForcaGame(from)) {
                    mention(`${getTextForcaGame(from)}\n\n\n🥰🎉 Parabéns @${sender.split("@")[0]}, a palavra era *"${data.nome.toUpperCase()}",* e você completou com sucesso as letras da forca... Irei sortear uma nova palavra 😪`)
                    await sleep(2000)
                    addVitoriaForca(sender, 1)
                    return restartForcaGame(mention, prefix, from)
               } else {
                    mention(`🎉 Parabéns @${sender.split("@")[0]}, você acertou a letra... Continue assim que você irá longe 🥰`)
                    await sleep(700)
                    registrarIdNaForca(sender, from, 1, 0)
                    sendTextForcaGame(mention, prefix, from)
               }
          } else {
               if(data.erros >= 7) {
                    mention(`🙄 Você perdeu @${sender.split("@")[0]} kkkkkkkk mas eu não vou revelar qual era a palavra... Irei reiniciar o jogo (caso queira encerrar o jogo, use ${prefix}rfc) 😪`)
                    await sleep(2000)
                    addDerrotaForca(sender, 1)
                    return restartForcaGame(mention, prefix, from)
               } else {
                    data.erros += 1
                    saveForcaGame(data, from)
                    mention(`😆 Você errou a letra @${sender.split("@")[0]} ksksks felizmente você ainda tem +${8 - data.erros} chance${Number(8 - data.erros) != 1 ? "s" : ""} 👀`)
                    await sleep(700)
                    registrarIdNaForca(sender, from, 1, 1)
                    sendTextForcaGame(mention, prefix, from)
               }
          }
     }
}

module.exports = {
     //======================USUÁRIOS=================\\
     saveUsuForcaGame, usuarios_forca, addUsuarioForca, rmUsuarioForca,
     addAcertoUsuForca, addErroUsuForca, existIdForcaGameInUsu, registrarIdNaForca,
     addVitoriaForca, addDerrotaForca, getUsuDatabaseForca,
     //======================PALAVRAS==================\\
     saveForcaWord, forcaWord, sendPathForcaGame, existSomeWordForcaGame,
     existThemeWordForcaGame, getThemeWordForcaGame, getRandomWordForcaGame, rgWordForcaGame,
     rmThemeForcaGame, rmWordForcaGame,
     //========================JOGO=====================\\
     isForcaGame, saveForcaGame, startForcaGame, resetForcaGame, restartForcaGame, getJSONforcaGame,
     letraFoiJogada, isTrueLetter, isLetterFinishForcaGame, registrarLetraForca, getWordSplitForcaGame,
     getErrEmojiForcaGame, sendTextForcaGame, jogarLetraForcaGame
}