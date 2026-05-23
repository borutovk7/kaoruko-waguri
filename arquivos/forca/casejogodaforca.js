case 'addforca':
if(!isOwner) return reply(enviar.msg.dono)
if(contar(q, `/`) != 2) return reply(`Retorne após o comando o tema, a palavra e a dica que você deseja adicionar...
Ex: veículo/carro/tem 4 rodas`)
var [tema, palavra, dica] = q.split(`/`)
rgWordForcaGame(tema, palavra, dica);
txt = `🎗 *_Forca registrada com sucesso_* 🎗
🎭 *Tema:* ${iniMai(tema)}
🎨 *Palavra:* ${iniMai(palavra)}
🧶 *Dica:* ${iniMai(dica)}`
reply(txt)
break

case 'rmforca':
if(!isOwner) return reply(enviar.msg.dono)
if(!q) return reply(`KD a palavra que você quer deletar?`)
rmWordForcaGame(reply, q);
break

case 'rmtema':
if(!isOwner) return reply(enviar.msg.dono)
if(!q) return reply(`KD o tema que você quer deletar?`)
rmThemeForcaGame(reply, q);
break

case 'listword': case 'listaforca':
if(!isOwner) return reply(enviar.msg.dono)
if(forcaWord.length <= 0) return reply(`⧼❗⧽ não há palavras salvas ❌`)
txt = forcaWord.map(a => `🎈 _*Tema:* ${iniMai(a.title)}_
📚 _*Palavras ↴*_
${a.words.map(b => `\t🎲 *Nome:* ${iniMai(b.nome)}
\t🧸 *Dica:* ${iniMai(b.desc)}`).join(`\n\n`)}`).join(`\n\n-\n\n`)
reply(txt)
break

case 'forca': case 'startforca':
if(!isGroup) return reply(enviar.msg.grupo)
reagir("🎗")
if(!existSomeWordForcaGame) return reply(`Não há palavras na database do bot para seres distribuidas... Chame o dono do bot para ele adicionar mais palavras 🥰`)
if(isForcaGame(from)) {
  reply(`🎗 Há uma sessão em andamento... Use ${prefix}fc para responder ou ${prefix}rrfc para reiniciar`)
  await sleep(5000)
  return sendTextForcaGame(reply, prefix, from)
}
startForcaGame(reply, prefix, from)
break

case 'myforca': case 'minhaforca': case 'myf':
addUsuarioForca(sender);
try { ppimg = (await axios.get(`https://tinyurl.com/api-create.php?url=${(await sasukeup.profilePictureUrl(`${sender.split('@')[0]}@c.us`, 'image'))}`)).data
} catch(e) { ppimg = semfoto }
sendUrlText(from, getUsuDatabaseForca(sender, barrinha), pushname, ``, ppimg, `https://wa.me/`+sender.split("@")[0], seloblk)
break

case 'fc':
if(!isGroup) return reply(enviar.msg.grupo)
if(!isForcaGame(from)) return reply(`Não há nenhum jogo em andamento... Para começar, use ${prefix}forca`)
if(!q) return reply(`Retore após o comando a letra ou a palavra toda da forca, ex:
${prefix+command} ${randomLetra.toLowerCase()}`)
jogarLetraForcaGame(mention, from, sender, prefix, q);
break

case 'rfc': case 'rrfc':
if(!isGroup) return reply(enviar.msg.grupo)
if(!isGroupAdmins) return reply(enviar.msg.adm)
if(!isForcaGame(from)) return reply(`Não há nenhum jogo em andamento... Para começar, use ${prefix}forca`)
if(command == "rrfc") return restartForcaGame(reply, prefix, from);
resetForcaGame(from);
reply(`🧸 Partida de forca encerrada com sucesso..`)
break
