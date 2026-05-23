
if(!isCmd && isGroup && body.includes(`http`) && isJsonIncludes(autodw, sender)) {
    idAllLinkAutoDW(kaoruko, from, sender, body, info)
}

case 'autodw': case 'autodl':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
usu = getUsuAutoDW(sender).platforms
kaoruko.sendMessage(from, {text:
`\t\t\t\t📥 *AUTO-DOWNLOAD* 📥

👤 *Usuário:* @${sender.split(`@`)[0]}
🎯 *Sistema Ativo (${getUsuAutoDW(sender).active ? `✅` : `❌`})*
🔁 *Multi Download (${getUsuAutoDW(sender).multidl ? `✅` : `❌`})*

📽 *VÍDEO/ÁUDIO* 🎵
⛔ *Youtube (${usu[0]?.youtube ? `✅` : `❌`}) ┋ Áudio (${usu[0]?.audio ? `✅` : `❌`})*
🚮 *Facebook (${usu[1]?.facebook ? `✅` : `❌`}) ┋ Áudio (${usu[1]?.audio ? `✅` : `❌`})*
☸ *Instagram (${usu[2]?.instagram ? `✅` : `❌`}) ┋ Áudio (${usu[2]?.audio ? `✅` : `❌`})*
🕶 *Tiktok (${usu[3]?.tiktok ? `✅` : `❌`}) ┋ Áudio (${usu[3]?.audio ? `✅` : `❌`})*
🕊 *Twitter (${usu[4]?.twitter ? `✅` : `❌`}) ┋ Áudio (${usu[4]?.audio ? `✅` : `❌`})*
🎵 *Spotify (${usu[9]?.spotify ? `✅` : `❌`})*
🎬 *Kwai (${usu[10]?.kwai ? `✅` : `❌`})*
🧵 *Threads (${usu[11]?.threads ? `✅` : `❌`})*
📌 *Pinterest (${usu[12]?.pinterest ? `✅` : `❌`})*
🎧 *SoundCloud (${usu[13]?.soundcloud ? `✅` : `❌`})*
☁️ *Google Drive (${usu[14]?.gdrive ? `✅` : `❌`})*
✂️ *CapCut (${usu[16]?.capcut ? `✅` : `❌`})*

📃 *DOCUMENTO-VARIADO* 📃
▶ *Mediafire (${usu[5]?.mediafire ? `✅` : `❌`})*
🐱 *Github (${usu[6]?.github ? `✅` : `❌`})*
🔞 *Xvideos (${usu[7]?.xvideos ? `✅` : `❌`})*
🚻 *XNXX (${usu[8]?.xnxx ? `✅` : `❌`})*
🔞 *Pornhub (${usu[15]?.pornhub ? `✅` : `❌`})*`, contextInfo: {mentionedJid: [sender], isForwarded: true, forwardingScore: 999}}, {quoted: seloctt})
break

case 'startautodl': case 'startautodw': case 'stopautodl': case 'stopautodw':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(getUsuAutoDW(sender).active) {
    getUsuAutoDW(sender).active = false
    saveAutoDW()
    return reply(`*AUTODW* do usuário desativado com sucesso ✖`)
} else {
    getUsuAutoDW(sender).active = true
    saveAutoDW()
    return reply(`*AUTODW* do usuário ativado com sucesso ✔`)
}
break

case 'multidw': case 'multidl':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
if(getUsuAutoDW(sender).multidl) {
    getUsuAutoDW(sender).multidl = false
    saveAutoDW()
    return reply(`*MULTIDL* do sistema de auto download desativado com sucesso ✖`)
} else {
    getUsuAutoDW(sender).multidl = true
    saveAutoDW()
    return reply(`*MULTIDL* do sistema de auto download ativado com sucesso ✔`)
}
break

case 'configautodw': case 'configautodl':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
usu = getUsuAutoDW(sender).platforms
botaoblk = [
  {title: `VÍDEO/ÁUDIO`, options: [
    {name: `⛔ YOUTUBE`, title: `${!usu[0]?.youtube ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwyoutube`},
    {title: usu[0]?.audio ? `MUDAR PARA MODO VÍDEO` : `MUDAR PARA MODO ÁUDIO`, body: `↪ Programado para enviar ${usu[0]?.audio ? `áudio` : `vídeo`}...`, command: prefix+`audiodwyoutube`},
    {name: `🚮 FACEBOOK`, title: `${!usu[1]?.facebook ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwfacebook`},
    {title: usu[1]?.audio ? `MUDAR PARA MODO VÍDEO` : `MUDAR PARA MODO ÁUDIO`, body: `↪ Programado para enviar ${usu[1]?.audio ? `áudio` : `vídeo`}...`, command: prefix+`audiodwfacebook`},
    {name: `☸ INSTAGRAM`, title: `${!usu[2]?.instagram ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwinstagram`},
    {title: usu[2]?.audio ? `MUDAR PARA MODO VÍDEO` : `MUDAR PARA MODO ÁUDIO`, body: `↪ Programado para enviar ${usu[2]?.audio ? `áudio` : `vídeo`}...`, command: prefix+`audiodwinstagram`},
    {name: `🕶 TIKTOK`, title: `${!usu[3]?.tiktok ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwtiktok`},
    {title: usu[3]?.audio ? `MUDAR PARA MODO VÍDEO` : `MUDAR PARA MODO ÁUDIO`, body: `↪ Programado para enviar ${usu[3]?.audio ? `áudio` : `vídeo`}...`, command: prefix+`audiodwtiktok`},
    {name: `🕊 TWITTER`, title: `${!usu[4]?.twitter ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwtwitter`},
    {title: usu[4]?.audio ? `MUDAR PARA MODO VÍDEO` : `MUDAR PARA MODO ÁUDIO`, body: `↪ Programado para enviar ${usu[4]?.audio ? `áudio` : `vídeo`}...`, command: prefix+`audiodwtwitter`},
    {name: `🎵 SPOTIFY`, title: `${!usu[9]?.spotify ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwspotify`},
    {name: `🎬 KWAI`, title: `${!usu[10]?.kwai ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwkwai`},
    {name: `🧵 THREADS`, title: `${!usu[11]?.threads ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwthreads`},
    {name: `📌 PINTEREST`, title: `${!usu[12]?.pinterest ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwpinterest`},
    {name: `🎧 SOUNDCLOUD`, title: `${!usu[13]?.soundcloud ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwsoundcloud`},
    {name: `☁️ GOOGLE DRIVE`, title: `${!usu[14]?.gdrive ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwgdrive`},
    {name: `✂️ CAPCUT`, title: `${!usu[16]?.capcut ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwcapcut`},
  ]},
  {title: `DOCUMENTO-VARIADO`, options: [
    {name: `▶ MEDIAFIRE`, title: `${!usu[5]?.mediafire ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwmediafire`},
    {name: `🐱 GITHUB`, title: `${!usu[6]?.github ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwgithub`},
    {name: `🔞 XVIDEOS`, title: `${!usu[7]?.xvideos ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwxvideos`},
    {name: `🚻 XNXX`, title: `${!usu[8]?.xnxx ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwxnxx`},
    {name: `🔞 PORNHUB`, title: `${!usu[15]?.pornhub ? `` : `DES`}ATIVAR AUTO DW`, body: NomeDoBot, command: prefix+`autodwpornhub`},
  ]}
]
try { img = await kaoruko.profilePictureUrl(from, 'image')
} catch { img = semfoto }
if(isGroup) reply(`Enviando PV 🔰`)
return sendButton(from, {text: `Configuração de downloads do sistema abaixo:`, footer: `Todos os downloads do bot...`}, kaoruko, [{type: `list`, title: `🫧 CLIQUE AQUI 🫧`, rowId: botaoblk}], seloctt)
break

// ── TOGGLES DAS PLATAFORMAS ──────────────────────────────────────

case 'autodwyoutube':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[0].youtube = !usu[0].youtube
saveAutoDW()
return reply(`AUTO DW do Youtube ${usu[0].youtube ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'audiodwyoutube':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[0].audio = !usu[0].audio
saveAutoDW()
return reply(`AUTO DW do Youtube definido para ${usu[0].audio ? `ÁUDIO 🎵` : `VÍDEO 📽`}`)
break

case 'autodwfacebook':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[1].facebook = !usu[1].facebook
saveAutoDW()
return reply(`AUTO DW do Facebook ${usu[1].facebook ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'audiodwfacebook':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[1].audio = !usu[1].audio
saveAutoDW()
return reply(`AUTO DW do Facebook definido para ${usu[1].audio ? `ÁUDIO 🎵` : `VÍDEO 📽`}`)
break

case 'autodwinstagram':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[2].instagram = !usu[2].instagram
saveAutoDW()
return reply(`AUTO DW do Instagram ${usu[2].instagram ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'audiodwinstagram':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[2].audio = !usu[2].audio
saveAutoDW()
return reply(`AUTO DW do Instagram definido para ${usu[2].audio ? `ÁUDIO 🎵` : `VÍDEO 📽`}`)
break

case 'autodwtiktok':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[3].tiktok = !usu[3].tiktok
saveAutoDW()
return reply(`AUTO DW do TikTok ${usu[3].tiktok ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'audiodwtiktok':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[3].audio = !usu[3].audio
saveAutoDW()
return reply(`AUTO DW do TikTok definido para ${usu[3].audio ? `ÁUDIO 🎵` : `VÍDEO 📽`}`)
break

case 'autodwtwitter':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[4].twitter = !usu[4].twitter
saveAutoDW()
return reply(`AUTO DW do Twitter ${usu[4].twitter ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'audiodwtwitter':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[4].audio = !usu[4].audio
saveAutoDW()
return reply(`AUTO DW do Twitter definido para ${usu[4].audio ? `ÁUDIO 🎵` : `VÍDEO 📽`}`)
break

case 'autodwmediafire':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[5].mediafire = !usu[5].mediafire
saveAutoDW()
return reply(`AUTO DW do Mediafire ${usu[5].mediafire ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'autodwgithub':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[6].github = !usu[6].github
saveAutoDW()
return reply(`AUTO DW do Github ${usu[6].github ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'autodwxvideos':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[7].xvideos = !usu[7].xvideos
saveAutoDW()
return reply(`AUTO DW do Xvideos ${usu[7].xvideos ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'autodwxnxx':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[8].xnxx = !usu[8].xnxx
saveAutoDW()
return reply(`AUTO DW do XNXX ${usu[8].xnxx ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'autodwspotify':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[9].spotify = !usu[9].spotify
saveAutoDW()
return reply(`AUTO DW do Spotify ${usu[9].spotify ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'autodwkwai':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[10].kwai = !usu[10].kwai
saveAutoDW()
return reply(`AUTO DW do Kwai ${usu[10].kwai ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'autodwthreads':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[11].threads = !usu[11].threads
saveAutoDW()
return reply(`AUTO DW do Threads ${usu[11].threads ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'autodwpinterest':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[12].pinterest = !usu[12].pinterest
saveAutoDW()
return reply(`AUTO DW do Pinterest ${usu[12].pinterest ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'autodwsoundcloud':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[13].soundcloud = !usu[13].soundcloud
saveAutoDW()
return reply(`AUTO DW do SoundCloud ${usu[13].soundcloud ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'autodwgdrive':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[14].gdrive = !usu[14].gdrive
saveAutoDW()
return reply(`AUTO DW do Google Drive ${usu[14].gdrive ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'autodwpornhub':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[15].pornhub = !usu[15].pornhub
saveAutoDW()
return reply(`AUTO DW do Pornhub ${usu[15].pornhub ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break

case 'autodwcapcut':
if(!isVip) return reply(enviar.msg.vip)
if(!isJsonIncludes(autodw, sender)) activateAutoDWinUsu(sender)
if(!getUsuAutoDW(sender).active) return reply(`É necessário ativar o auto dw primeiro... Use ${prefix}startautodw`)
usu = getUsuAutoDW(sender).platforms
usu[16].capcut = !usu[16].capcut
saveAutoDW()
return reply(`AUTO DW do CapCut ${usu[16].capcut ? `ATIVADO ✅` : `DESATIVADO ❌`}`)
break
