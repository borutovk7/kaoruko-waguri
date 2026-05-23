const fs = require('fs');
const moment = require('moment-timezone');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const { proto, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID } = require('@boruto_vk7/baileys');

const sendHours = (formato) => moment.tz('America/Sao_Paulo').format(formato);

const identArroba = (txt) => {
  const cleaned = txt.replace(/[\(\)\+\-\s\/]/g, '');
  return cleaned.includes('@') ? cleaned.split('@')[1] + '@s.whatsapp.net' : cleaned + '@s.whatsapp.net';
};

const atraso = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const botoes = JSON.parse(fs.readFileSync("./configs/nescessario.json")).botoes;

// === FUNÇÃO: sendlistbuttons (Interactive com Native Flow) ===
const sendlistbuttons = async (from, dados, waguri, buttons, info) => {
  try {
if (!botoes) {
return waguri.sendMessage(from, dados, { quoted: info });
}

const but = [];
for (const i of buttons) {
if (i.type === 'copy_url') {
 but.push({
name: "cta_url",
buttonParamsJson: JSON.stringify({ display_text: i.text, url: i.url, merchant_url: i.url })
 });
}
if (i.type === 'copy_text') {
 but.push({
name: "cta_copy",
buttonParamsJson: JSON.stringify({ display_text: i.text, copy_code: i.url })
 });
}
if (i.type === 'call') {
 but.push({
name: "cta_call",
buttonParamsJson: JSON.stringify({ display_text: i.text, id: i.url })
 });
}
if (i.type === 'cmd') {
 but.push({
name: "quick_reply",
buttonParamsJson: JSON.stringify({ display_text: i.text, id: i.command, disabled: false })
 });
}
if (i.type === 'list' || i.type === 'lista') {
 const sections = [];
 for (const a of i.rowId) {
const rows = a.options.map(b => ({
  header: b?.name || '',
  title: b?.title || '',
  description: b?.body || '',
  id: b?.command || '',
  disabled: false
}));
sections.push({
  title: a?.title || '',
  highlight_label: a?.body || '',
  rows
});
 }
 but.push({
name: "single_select",
buttonParamsJson: JSON.stringify({ title: i.title, sections })
 });
}
}

let midia = null;
if (dados?.image) {
midia = await prepareWAMessageMedia({ image: dados.image }, { upload: waguri.waUploadToServer });
} else if (dados?.video) {
midia = await prepareWAMessageMedia({ video: dados.video }, { upload: waguri.waUploadToServer });
}

const header = dados?.image ? { hasMediaAttachment: true, imageMessage: midia.imageMessage } :
  dados?.video ? { hasMediaAttachment: true, videoMessage: midia.videoMessage } :
  undefined;

const message = {
viewOnceMessage: {
 message: {
interactiveMessage: {
  header,
  body: { text: dados?.caption || dados?.text || '' },
  footer: { text: dados?.footer || '' },
  contextInfo: {
participant: info?.key?.id || '',
mentionedJid: dados?.mentions || [],
quotedMessage: info?.message || undefined,
forwardingScore: dados?.contextInfo?.forwardingScore,
isForwarded: dados?.contextInfo?.isForwarded,
forwardedNewsletterMessageInfo: dados?.contextInfo?.forwardedNewsletterMessageInfo
  },
  nativeFlowMessage: {
buttons: but,
messageParamsJson: ""
  }
}
 }
}
};

const msg = generateWAMessageFromContent("0", message, { userJid: waguri.user?.id });
await waguri.relayMessage(from, msg.message, { messageId: generateMessageID(waguri.user?.id) });
  } catch (e) {
console.error("Erro em sendlistbuttons:", e);
  }
};

// === FUNÇÃO: EnvButton (Botões tradicionais) ===
const EnvButton = async (from, dados, waguri, buttons, info) => {
  try {
const [text, footer, mediaUrl, isVideo] = dados;
const menc = text.split(" ").filter(i => i.includes("@")).map(identArroba);

const options = {
caption: text,
footer: footer || undefined,
mentions: menc,
quoted: info
};

if (botoes && buttons?.length > 0) {
options.buttons = sendConfigButton(buttons);
options.viewOnce = true;
options.headerType = 6;
}

if (mediaUrl) {
if (isVideo === true) {
 return waguri.sendMessage(from, { video: { url: mediaUrl }, ...options });
} else {
 return waguri.sendMessage(from, { image: { url: mediaUrl }, ...options });
}
}

return waguri.sendMessage(from, { text, footer, contextInfo: { mentionedJid: menc }, ...options });
  } catch (e) {
console.error("Erro em EnvButton:", e);
  }
};

// === FUNÇÃO: sendConfigButton (Formato antigo de botões) ===
const sendConfigButton = (lista) => {
  return lista.map(i => ({
buttonId: i.command,
buttonText: { displayText: i.text }
  }));
};

// === FUNÇÃO: sendRoulette (Carrossel) ===
const sendRoulette = async (from, waguri, dados) => {
  try {
if (!botoes) {
for (const i of dados) {
 if (i?.image) {
await atraso(1000);
await waguri.sendMessage(from, { image: i.image, caption: i?.caption || '' });
 } else if (i?.video) {
await atraso(2500);
await waguri.sendMessage(from, { video: i.video, caption: i?.caption || '' });
 }
}
return;
}

const cards = [];
for (const i of dados) {
let mediaMessage = null;
let headerType = 'IMAGE';

if (i?.image) {
 const buffer = Buffer.from(await fetch(i.image.url).then(res => res.arrayBuffer()));
 const media = await prepareWAMessageMedia({ image: buffer }, { upload: waguri.waUploadToServer });
 mediaMessage = media.imageMessage;
} else if (i?.video) {
 const buffer = Buffer.from(await fetch(i.video.url).then(res => res.arrayBuffer()));
 const media = await prepareWAMessageMedia({ video: buffer }, { upload: waguri.waUploadToServer });
 mediaMessage = media.videoMessage;
 headerType = 'VIDEO'; // Corrigido: era 'IMAGE' mesmo para vídeo
}

if (mediaMessage) {
 cards.push({
header: { hasMediaAttachment: true, ...mediaMessage },
headerType,
body: { text: i?.caption || '' },
footer: { text: i?.footer || '' },
nativeFlowMessage: { buttons: [] }
 });
}
}

if (cards.length > 0) {
await waguri.relayMessage(from, {
 interactiveMessage: { carouselMessage: { cards } }
}, {});
}
  } catch (e) {
console.error("Erro em sendRoulette:", e);
  }
};

// === FUNÇÃO: sendRouletteButton (Carrossel com botões) ===
const sendRouletteButton = async (from, dados, waguri, sender, butao, info) => {
  try {
const but = [];
for (const i of butao) {
if (i.type === 'copy_url') but.push({ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: i.text, url: i.url, merchant_url: i.url }) });
if (i.type === 'copy_text') but.push({ name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: i.text, copy_code: i.url }) });
if (i.type === 'call') but.push({ name: "cta_call", buttonParamsJson: JSON.stringify({ display_text: i.text, id: i.url }) });
if (i.type === 'cmd') but.push({ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: i.text, id: i.command, disabled: false }) });
if (i.type === 'list' || i.type === 'lista') {
 const sections = i.rowId.map(a => ({
title: a?.title || '',
highlight_label: a?.body || '',
rows: a.options.map(b => ({
  header: b?.name || '',
  title: b?.title || '',
  description: b?.body || '',
  id: b?.command || '',
  disabled: false
}))
 }));
 but.push({ name: "single_select", buttonParamsJson: JSON.stringify({ title: i.title, sections }) });
}
}

let media = null;
if (dados?.image) {
media = await prepareWAMessageMedia({ image: dados.image }, { upload: waguri.waUploadToServer });
}

const cardImage = {
header: proto.Message.InteractiveMessage.Header.create({
 ...(media ? media : {}),
 hasMediaAttachment: !!media,
 title: (dados?.caption || '') + (dados?.footer ? `\n> ${dados.footer}` : '')
}),
nativeFlowMessage: { buttons: but, messageParamsJson: "" }
};

const msg = generateWAMessageFromContent(from, {
interactiveMessage: {
 contextInfo: {
participant: sender,
mentionedJid: dados?.mentions || [],
quotedMessage: info?.message
 },
 carouselMessage: { cards: [cardImage], messageVersion: 1 }
}
}, {});

await waguri.relayMessage(from, msg.message, { messageId: msg.key.id });
  } catch (e) {
console.error("Erro em sendRouletteButton:", e);
  }
};


const sendListB = async(from, dados, kyomi, sender, title, lista, info) => {
try {
if(botoes) {
caixa = []
for(a of lista) {
hehe = []
for(b of a.options) {
hehe.push({header: b?.name || ``, title: b?.title || ``, description: b?.body, id: b?.command || ``, disabled: false})
}
caixa.push({title: a?.title || ``, highlight_label: a?.body || ``, rows: hehe})
}
but = [{name: "single_select", buttonParamsJson: JSON.stringify({title: title, sections: caixa})}]
if(dados?.text) return kyomi.relayMessage(from, {interactiveMessage: {body: {text: dados?.text || ``}, footer: {text: dados?.footer || ``}, contextInfo: {participant: sender, mentionedJid: dados?.mentions, quotedMessage: info ? info.message : ``, forwardingScore: dados?.contextInfo?.forwardingScore || 0, isForwarded: dados?.contextInfo?.isForwarded || false, forwardedNewsletterMessageInfo: {newsletterJid: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid || ``, newsletterName: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterName || ``}}, nativeFlowMessage: {buttons: but, messageParamsJson: ""}}}, {})
if(dados?.image) {
img = await prepareWAMessageMedia({image: dados?.image}, {upload: kyomi.waUploadToServer})
return kyomi.relayMessage(from, {interactiveMessage: {header: {hasMediaAttachment: true, imageMessage: img.imageMessage}, headerType: `IMAGE`, body: {text: dados?.caption || ``}, footer: {text: dados?.footer || ``}, contextInfo: {participant: sender, mentionedJid: dados?.mentions, quotedMessage: info ? info.message : ``, forwardingScore: dados?.contextInfo?.forwardingScore || 0, isForwarded: dados?.contextInfo?.isForwarded || false, forwardedNewsletterMessageInfo: {newsletterJid: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid || ``, newsletterName: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterName || ``}}, nativeFlowMessage: {buttons: but, messageParamsJson: ""}}}, {})
}
vid = await prepareWAMessageMedia({video: dados?.video}, {upload: kyomi.waUploadToServer})
return kyomi.relayMessage(from, {interactiveMessage: {header: {hasMediaAttachment: true, videoMessage: vid.videoMessage}, headerType: `IMAGE`, body: {text: dados?.caption || ``}, footer: {text: dados?.footer || ``}, contextInfo: {participant: sender, mentionedJid: dados?.mentions, quotedMessage: info ? info.message : ``, forwardingScore: dados?.contextInfo?.forwardingScore || 0, isForwarded: dados?.contextInfo?.isForwarded || false, forwardedNewsletterMessageInfo: {newsletterJid: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid || ``, newsletterName: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterName || ``}}, nativeFlowMessage: {buttons: but, messageParamsJson: ""}}}, {})
} else {
if(dados?.text) return kyomi.sendMessage(from, {text: dados?.text, mentions: dados?.mentions, contextInfo: {forwardingScore: dados?.contextInfo?.forwardingScore || 0, isForwarded: dados?.contextInfo?.isForwarded || false, forwardedNewsletterMessageInfo: {newsletterJid: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid || ``, newsletterName: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterName || ``}}}, {quoted: info})
if(dados?.image) return kyomi.sendMessage(from, {image: dados?.image, caption: dados?.caption, mentions: dados?.mentions, contextInfo: {forwardingScore: dados?.contextInfo?.forwardingScore || 0, isForwarded: dados?.contextInfo?.isForwarded || false, forwardedNewsletterMessageInfo: {newsletterJid: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid || ``, newsletterName: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterName || ``}}}, {quoted: info})
return kyomi.sendMessage(from, {video: dados?.video, caption: dados?.caption, mentions: dados?.mentions, contextInfo: {forwardingScore: dados?.contextInfo?.forwardingScore || 0, isForwarded: dados?.contextInfo?.isForwarded || false, forwardedNewsletterMessageInfo: {newsletterJid: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid || ``, newsletterName: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterName || ``}}}, {quoted: info})
}
} catch(e) {console.log(e)}
}

const sendListIOS = async(from, dados, kyomi, sender, title, lista, info) => {
try {
if(botoes) {
caixa = []
for(a of lista) {
for(b = 0; b < a.options.length; b++) {
c = a.options[b]
caixa.push({
title: b == 0 ? a?.title || `` : ``,
highlight_label: a?.body ? a.body : c?.high ? c.high : ``,
rows: [{
header: c?.name || ``,
title: c?.title,
description: c?.body,
id: c?.command
}]
})
}
}
if(dados?.image) {img = await prepareWAMessageMedia({image: dados?.image}, {upload: kyomi.waUploadToServer})}
if(dados?.video) {vid = await prepareWAMessageMedia({video: dados?.video}, {upload: kyomi.waUploadToServer})}
return kyomi.relayMessage(from, {
interactiveMessage: {
header: dados?.image ? {
title: dados?.contextInfo?.externalAdReply?.title || ``,
subtitle: dados?.contextInfo?.externalAdReply?.body || ``,
hasMediaAttachment: true,
imageMessage: img.imageMessage
} : dados?.video ? {
title: dados?.contextInfo?.externalAdReply?.title || ``,
subtitle: dados?.contextInfo?.externalAdReply?.body || ``,
hasMediaAttachment: true,
videoMessage: vid.videoMessage
} : ``,
body: {text: dados?.text ? dados.text : dados.caption},
footer: {text: dados?.footer || ``},
contextInfo: {
participant: sender,
mentionedJid: dados?.mentions,
quotedMessage: info ? info.message : ``,
forwardingScore: dados?.contextInfo?.forwardingScore || 0,
isForwarded: dados?.contextInfo?.isForwarded || false,
forwardedNewsletterMessageInfo: {
newsletterJid: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid || ``,
newsletterName: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterName || ``
}
},
nativeFlowMessage: {
buttons: [{name: "single_select",
buttonParamsJson: JSON.stringify({title: title, sections: caixa})
}],
messageParamsJson: ""
}
}
}, {})
} else {
if(dados?.text) return kyomi.sendMessage(from, {text: dados?.text, mentions: dados?.mentions, contextInfo: {forwardingScore: dados?.contextInfo?.forwardingScore || 0, isForwarded: dados?.contextInfo?.isForwarded || false, forwardedNewsletterMessageInfo: {newsletterJid: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid || ``, newsletterName: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterName || ``}}}, {quoted: info})
if(dados?.image) return kyomi.sendMessage(from, {image: dados?.image, caption: dados?.caption, mentions: dados?.mentions, contextInfo: {forwardingScore: dados?.contextInfo?.forwardingScore || 0, isForwarded: dados?.contextInfo?.isForwarded || false, forwardedNewsletterMessageInfo: {newsletterJid: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid || ``, newsletterName: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterName || ``}}}, {quoted: info})
return kyomi.sendMessage(from, {video: dados?.video, caption: dados?.caption, mentions: dados?.mentions, contextInfo: {forwardingScore: dados?.contextInfo?.forwardingScore || 0, isForwarded: dados?.contextInfo?.isForwarded || false, forwardedNewsletterMessageInfo: {newsletterJid: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterJid || ``, newsletterName: dados?.contextInfo?.forwardedNewsletterMessageInfo?.newsletterName || ``}}}, {quoted: info})
}
} catch(e) {console.log(e)}
}


module.exports = { sendRouletteButton, sendlistbuttons, EnvButton, sendRoulette, sendListB, sendListIOS };