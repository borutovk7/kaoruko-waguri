case 'start':
case 'menu': 
  reagir(from, '🪷')
  if (botoes) {
txt = `🪷 *Olá, ${pushname}!*\n` +
  `╭┈ׅׄ┉-ׅ━━━━━ׁ━፝֟━̷━ׁ۫━━━━━┈ׅׄ┉ׅ-╮\n` +
  `᥀·࣭࣪̇˖🪷◗ Nome: *${pushname}*\n` +
  `᥀·࣭࣪̇˖🪷◗ Bot: *${NomeDoBot}*\n` +
  `᥀·࣭࣪̇˖🪷◗ Semana: *${semana}*\n` +
  `᥀·࣭࣪̇˖🪷◗ Premium: *${isChpremium}*\n` +
  `᥀·࣭࣪̇˖🪷◗ Cargo: ${isCargo}\n` +
  `╰┈ׅׄ┉-ׅ━━━━━ׁ━፝֟━̷━ׁ۫━━━━━┈ׅׄ┉ׅ-╯`
await kaoruko.relayMessage(from, { interactiveMessage: { contextInfo: { mentionedJid: [sender], participant: sender }, header: { hasMediaAttachment: true, imageMessage: await kaoruko.prepareWAMessageMedia({ image: { url: linksimg.logo } },{ upload: kaoruko.waUploadToServer }).then(m => m.imageMessage)}, body: { text: txt },
footer: { text: direitos }, nativeFlowMessage: { buttons: [
{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '⧽⧽🪷 CRIADOR 🪷⧼⧼', id: prefix + 'Criador'})},
{ name: 'single_select', buttonParamsJson: JSON.stringify({ title: '⧽⧽🪷 COMANDOS 🪷⧼⧼',
sections: [
  {
title: '© Eduh Dev </>. Todos os Direitos Reservados',
highlight_label: '👾',
rows: [
  { header: '⧽⧽ 🪷 𝐌𝐀𝐍𝐔𝐀𝐋 𝐃𝐀 𝐁𝐎𝐓 🪷 ⧼⧼', title: '☆ 𝚔𝚊𝚘𝚛𝚞𝚔𝚘 𝚠𝚊𝚐𝚞𝚛𝚒 𝙾𝚏𝚒𝚌𝚒𝚊𝚕', description: 'Tutorial básico de como usar o Bot.', id: prefix + 'ajuda' },
  { header: '⧽⧽ 🪷 𝐌𝐄𝐍𝐔 𝐁𝐀𝐒𝐈𝐂𝐎 🪷 ⧼⧼', title: '☆ 𝚔𝚊𝚘𝚛𝚞𝚔𝚘 𝚠𝚊𝚐𝚞𝚛𝚒 𝙾𝚏𝚒𝚌𝚒𝚊𝚕', description: 'Comandos básicos do bot.', id: prefix + 'menu-completo' },
  { header: '⧽⧽ 🪷 𝐌𝐄𝐍𝐔 𝐁𝐑𝐈𝐍𝐂𝐀𝐃𝐄𝐈𝐑𝐀𝐒 🪷 ⧼⧼', title: '☆ 𝚔𝚊𝚘𝚛𝚞𝚔𝚘 𝚠𝚊𝚐𝚞𝚛𝚒 𝙾𝚏𝚒𝚌𝚒𝚊𝚕', description: 'Jogos e brincadeiras interativas.', id: prefix + 'brincadeiras' },
  { header: '⧽⧽ 🪷 𝐌𝐄𝐍𝐔 𝐃𝐎𝐍𝐎 🪷 ⧼⧼', title: '☆ 𝚔𝚊𝚘𝚛𝚞𝚔𝚘 𝚠𝚊𝚐𝚞𝚛𝚒 𝙾𝚏𝚒𝚌𝚒𝚊𝚕', description: 'Funções exclusivas para o dono.', id: prefix + 'menudono' },
  { header: '⧽⧽ 🪷 𝐌𝐄𝐍𝐔 𝐀𝐃𝐌 🪷 ⧼⧼', title: '☆ 𝚔𝚊𝚘𝚛𝚞𝚔𝚘 𝚠𝚊𝚐𝚞𝚛𝚒 𝙾𝚏𝚒𝚌𝚒𝚊𝚕', description: 'Menu de administradores.', id: prefix + 'menuadm' },
  { header: '⧽⧽ 🪷 𝐌𝐄𝐍𝐔 𝐂𝐎𝐈𝐍𝐒 🪷 ⧼⧼', title: '☆ 𝚔𝚊𝚘𝚛𝚞𝚔𝚘 𝚠𝚊𝚐𝚞𝚛𝚒 𝙾𝚏𝚒𝚌𝚒𝚊𝚕', description: 'Sistema de coins.', id: prefix + 'menucoins' },
  { header: '⧽⧽ 🪷 𝐌𝐄𝐍𝐔 𝐂𝐎𝐍𝐒𝐔𝐋𝐓𝐀 🪷 ⧼⧼', title: '☆ 𝚔𝚊𝚘𝚛𝚞𝚔𝚘 𝚠𝚊𝚐𝚞𝚛𝚒 𝙾𝚏𝚒𝚌𝚒𝚊𝚕', description: 'Puxar dados.', id: prefix + 'consultas' },
  { header: '⧽⧽ 🪷 𝐂𝐇𝐀𝐓 𝐎𝐅𝐈𝐂𝐈𝐀𝐋 🪷 ⧼⧼', title: '☆ 𝚔𝚊𝚘𝚛𝚞𝚔𝚘 𝚠𝚊𝚐𝚞𝚛𝚒 𝙾𝚏𝚒𝚌𝚒𝚊𝚕', description: 'Chat Oficial.', id: prefix + 'chatofc' },
  { header: '⧽⧽ 🪷 𝐌𝐄𝐍𝐔 +18 🪷 ⧼⧼', title: '☆ 𝚔𝚊𝚘𝚛𝚞𝚔𝚘 𝚠𝚊𝚐𝚞𝚛𝚒 𝙾𝚏𝚒𝚌𝚒𝚊𝚕', description: 'Conteúdo adulto.', id: prefix + 'menu18' },
  { header: '⧽⧽ 🪷 𝐌𝐄𝐍𝐔 𝐀𝐋𝐓𝐄𝐑𝐀𝐃𝐎𝐑𝐄𝐒 🪷 ⧼⧼', title: '☆ 𝚔𝚊𝚘𝚛𝚞𝚔𝚘 𝚠𝚊𝚐𝚞𝚛𝚒 𝙾𝚏𝚒𝚌𝚒𝚊𝚕', description: 'Alteradores.', id: prefix + 'menualteradores' },
  { header: '⧽⧽ 🪷 𝐌𝐄𝐍𝐔 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 🪷 ⧼⧼', title: '☆ 𝚔𝚊𝚘𝚛𝚞𝚔𝚘 𝚠𝚊𝚐𝚞𝚛𝚒 𝙾𝚏𝚒𝚌𝚒𝚊𝚕', description: 'Downloads.', id: prefix + 'menudow' },
  { header: '⧽⧽ 🪷 𝐌𝐄𝐍𝐔 𝐄𝐅𝐄𝐈𝐓𝐎𝐒 🪷 ⧼⧼', title: '☆ 𝚔𝚊𝚘𝚛𝚞𝚔𝚘 𝚠𝚊𝚐𝚞𝚛𝚒 𝙾𝚏𝚒𝚌𝚒𝚊𝚕', description: 'Efeitos visuais.', id: prefix + 'efeitosimg' },
  { header: '⧽⧽ 🪷 𝐌𝐄𝐍𝐔 𝐏𝐑𝐄𝐌𝐈𝐔𝐌 🪷 ⧼⧼', title: '☆ 𝚔𝚊𝚘𝚛𝚞𝚔𝚘 𝚠𝚊𝚐𝚞𝚛𝚒 𝙾𝚏𝚒𝚌𝚒𝚊𝚕', description: 'Funções premium.', id: prefix + 'menuprem' },
]
}]})}],messageParamsJson: ''}}}, { participant: { jid: sender } })
} else {
if (isAudioMenu) {
  sendAudio(from, "./database/audios/menu.mp3", "audio/mpeg", waguriselo) }
await reagir(from, "🪷")
await kaoruko.sendMessage(from, {image: { url: linksimg.menu }, caption: linguagem.menu(prefix, NomeDoBot, isCargo, versão, ownerName), mentions: [sender]
}, { quoted: waguriselo })}
break
 