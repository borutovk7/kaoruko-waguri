const fs = require(`fs`)

const { isJsonIncludes, linkfy, sleep, fetchJson, saveJSON, API_KEY_WAGURI } = require(`../../definicoes.js`)

const apikeys = require('./configs/apikeys.json');
const { apis = {}, sites = {}, groups = {} } = apikeys;

const { API_KEY_WAGURI } = apis;
const { okarunsite } = sites;



var isUrl = (url) => {
if(linkfy.find(url)[0]) return true
return false
}

const autodwpath = `./arquivo/autodown/autodwlinks.json`

if(!fs.existsSync(autodwpath)) {fs.writeFileSync(autodwpath, JSON.stringify([]))}

const autodw = JSON.parse(fs.readFileSync(autodwpath))

function saveAutoDW() {saveJSON(autodw, autodwpath)}

function addUsuInAutoDW(sender, active = true) {
platforms = [{youtube: true, audio: false},  // [0]
{facebook: true, audio: false}, // [1]
{instagram: true, audio: false},// [2]
{tiktok: true, audio: false},   // [3]
{twitter: true, audio: false},  // [4]
{mediafire: true},  // [5]
{github: true}, // [6]
{xvideos: true},// [7]
{xnxx: true},   // [8]
{spotify: true},// [9]
{kwai: true},   // [10]
{threads: true},// [11]
{pinterest: true},  // [12]
{soundcloud: true}, // [13]
{gdrive: true}, // [14]
{pornhub: true},// [15]
{capcut: true}, // [16]
]
autodw.push({id: sender, multidl: false, active: active, platforms: platforms})
saveAutoDW()
}

const getUsuAutoDW = (sender) => {
AB = autodw.map(i => i.id).indexOf(sender)
return autodw[AB]
}

function activateAutoDWinUsu(sender) {
if(!isJsonIncludes(autodw, sender)) return addUsuInAutoDW(sender)
data = getUsuAutoDW(sender)
data.active = true
saveAutoDW()
}

function disableAutoDWinUsu(sender) {
if(!isJsonIncludes(autodw, sender)) return addUsuInAutoDW(sender, false)
data = getUsuAutoDW(sender)
data.active = false
saveAutoDW()
}

function react(kaoruko, from, emoji, info) {if(info) kaoruko.sendMessage(from, {react: {text: emoji, key: info.key}})}

// Garante que o usuário tem a plataforma no array, retorna o objeto dela
function getPlatform(data, index) {
return data.platforms[index] || {}
}

async function idAllLinkAutoDW(kaoruko, from, sender, body, info) {
data = getUsuAutoDW(sender)
if(!data) return
if(data.active) {
sp = body.split(`\n`).join(` `).split(`,`).join(` `).split(` `)
links = []
for(i of sp) {
txt = i.replace(`\n`, ``).replace(`\n`, ``)
if(isUrl(txt)) links.push(txt)
}
if(data.multidl) { alllinksplatforms = links
} else { alllinksplatforms = [links[0]] }

for(dw of alllinksplatforms) {
if(!dw) continue

// ── YOUTUBE ───────────────────────────────────────────────────
if(dw.includes(`youtube`) || dw.includes(`youtu.be`)) {
yt = getPlatform(data, 0)
if(yt.youtube) {
try {
if(!yt.audio) {
react(kaoruko, from, `📽`, info)
// Tenta ytvideo, fallback para ytvideo2
fetchyt = await fetchJson(`${okarunsite}/api/dl/ytvideo?url=${dw}&apikey=${API_KEY_WAGURI}`)
.catch(() => fetchJson(`${okarunsite}/api/dl/ytvideo2?url=${dw}&apikey=${API_KEY_WAGURI}`))
const videoUrl = fetchyt?.resultado?.video || fetchyt?.resultado?.url
if(videoUrl) kaoruko.sendMessage(from, {video: {url: videoUrl}}, {quoted: info})
} else {
react(kaoruko, from, `🎶`, info)
fetchyt = await fetchJson(`${okarunsite}/api/dl/ytaudio?url=${dw}&apikey=${API_KEY_WAGURI}`)
.catch(() => fetchJson(`${okarunsite}/api/dl/ytaudio2?url=${dw}&apikey=${API_KEY_WAGURI}`))
const audioUrl = fetchyt?.resultado?.audio || fetchyt?.resultado?.url
if(audioUrl) kaoruko.sendMessage(from, {audio: {url: audioUrl}, mimetype: `audio/mpeg`}, {quoted: info})
}
} catch(e) {console.log(`Erro em dw do youtube - `, e)}
}
await sleep(1000)
}

// ── FACEBOOK ──────────────────────────────────────────────────
if(dw.includes(`facebook`) || dw.includes(`fb.watch`)) {
fb = getPlatform(data, 1)
if(fb.facebook) {
try {
if(!fb.audio) {
react(kaoruko, from, `📽`, info)
fetchfb = await fetchJson(`${okarunsite}/download/facebook?url=${dw}&apikey=${API_KEY_WAGURI}`)
.catch(() => fetchJson(`${okarunsite}/download/facebook2?url=${dw}&apikey=${API_KEY_WAGURI}`))
const videoUrl = fetchfb?.resultado?.Normal_video || fetchfb?.resultado?.url || fetchfb?.resultado?.media?.url
if(videoUrl) kaoruko.sendMessage(from, {video: {url: videoUrl}}, {quoted: info})
} else {
react(kaoruko, from, `🎶`, info)
fetchfb = await fetchJson(`${okarunsite}/download/facebook2?url=${dw}&apikey=${API_KEY_WAGURI}`)
const audioUrl = fetchfb?.resultado?.media?.url
if(audioUrl) kaoruko.sendMessage(from, {audio: {url: audioUrl}, mimetype: `audio/mpeg`}, {quoted: info})
}
} catch(e) {console.log(`Erro em dw do facebook - `, e)}
}
await sleep(1000)
}

// ── INSTAGRAM ─────────────────────────────────────────────────
if(dw.includes(`instagram`) || dw.includes(`reel`)) {
ig = getPlatform(data, 2)
if(ig.instagram) {
try {
// Tenta rota principal, fallback para dl/instagram
fetchig = await fetchJson(`${okarunsite}/api/instagram?url=${dw}&apikey=${API_KEY_WAGURI}`)
.catch(() => fetchJson(`${okarunsite}/api/dl/instagram?url=${dw}&apikey=${API_KEY_WAGURI}`))
const medias = fetchig?.resultado
if(!medias || !medias.length) throw new Error(`Sem resultado`)
if(!ig.audio) {
react(kaoruko, from, isJsonIncludes(medias, `image`) ? `📸` : `📽`, info)
for(ftigvd of medias) {
await sleep(700)
if(ftigvd.type == `video`) {
kaoruko.sendMessage(from, {video: {url: ftigvd.url}}, {quoted: info})
} else {
kaoruko.sendMessage(from, {image: {url: ftigvd.url}}, {quoted: info})
}
}
} else {
react(kaoruko, from, `🎶`, info)
caixa = []
for(ftigad of medias) {
if(ftigad.type == `video`) caixa.push(ftigad)
}
if(caixa.length <= 0) return console.log(`Nenhum áudio encontrado!`)
for(c of caixa) {
await sleep(700)
kaoruko.sendMessage(from, {audio: {url: c.url}, mimetype: `audio/mpeg`}, {quoted: info})
}
}
} catch(e) {console.log(`Erro em dw do instagram - `, e)}
}
await sleep(1000)
}

// ── TIKTOK ────────────────────────────────────────────────────
if(dw.includes(`tiktok`) || dw.includes(`vm.tiktok`)) {
ttk = getPlatform(data, 3)
if(ttk.tiktok) {
try {
// Tenta v1, v2, v3 em cascata
fetchttk = await fetchJson(`${okarunsite}/api/download/tiktok?url=${dw}&apikey=${API_KEY_WAGURI}`)
.catch(() => fetchJson(`${okarunsite}/api/download/tiktok/v2?url=${dw}&apikey=${API_KEY_WAGURI}`))
.catch(() => fetchJson(`${okarunsite}/api/download/tiktok/v3?url=${dw}&apikey=${API_KEY_WAGURI}`))
if(!ttk.audio) {
if(fetchttk?.resultado?.type == `video`) {
react(kaoruko, from, `🎥`, info)
kaoruko.sendMessage(from, {video: {url: fetchttk.resultado.video}}, {quoted: info})
} else if(fetchttk?.resultado?.type == `image`) {
react(kaoruko, from, `📸`, info)
for(image of fetchttk.resultado.images) {
await sleep(1200)
kaoruko.sendMessage(from, {image: {url: image}})
}
setTimeout(() => {
kaoruko.sendMessage(from, {audio: {url: fetchttk.resultado.music}, mimetype: `audio/mpeg`}, {quoted: info})
}, 1000)
} else return kaoruko.sendMessage(from, {text: `Nenhum type identificado`})
} else {
react(kaoruko, from, `🎶`, info)
kaoruko.sendMessage(from, {audio: {url: fetchttk.resultado.music}, mimetype: `audio/mpeg`}, {quoted: info})
}
} catch(e) {console.log(`Erro em dw do tiktok - `, e)}
}
await sleep(1000)
}

// ── TWITTER / X ───────────────────────────────────────────────
if(dw.includes(`twitter`) || dw.includes(`x.com`)) {
twt = getPlatform(data, 4)
if(twt.twitter) {
try {
fetchtwt = await fetchJson(`${okarunsite}/api/dl/twitter?url=${dw}&apikey=${API_KEY_WAGURI}`)
if(!twt.audio) {
react(kaoruko, from, `📷`, info)
for(ttrvd of fetchtwt.resultado.media) {
if(ttrvd.url.includes(`mp4`)) {
kaoruko.sendMessage(from, {video: {url: ttrvd.url}}, {quoted: info})
} else {
kaoruko.sendMessage(from, {image: {url: ttrvd.url}}, {quoted: info})
}
}
} else {
react(kaoruko, from, `🎶`, info)
for(ttrad of fetchtwt.resultado.media) {
if(ttrad.url.includes(`mp4`)) {
kaoruko.sendMessage(from, {audio: {url: ttrad.url}, mimetype: `audio/mpeg`}, {quoted: info})
}
}
}
} catch(e) {console.log(`Erro em dw do twitter - `, e)}
}
await sleep(1000)
}

// ── MEDIAFIRE ─────────────────────────────────────────────────
if(dw.includes(`mediafire`)) {
mf = getPlatform(data, 5)
if(mf.mediafire) {
try {
// Usa rota de info primeiro para pegar dados do arquivo
fetchmf = await fetchJson(`${okarunsite}/api/dl/mediafire/info?url=${dw}&apikey=${API_KEY_WAGURI}`)
.catch(() => fetchJson(`${okarunsite}/api/dl/mediafire?url=${dw}&apikey=${API_KEY_WAGURI}`))
const r = fetchmf?.resultado
if(r) {
kaoruko.sendMessage(from, {text: `📂 *Nome:* ${r.filename}\n🧮 *Tamanho:* ${r.size}\n_Criado em ${r.uploadDate}_`}, {quoted: info})
kaoruko.sendMessage(from, {document: {url: r.url}, mimetype: `application/` + r.filetype, fileName: r.filename}, {quoted: info})
}
} catch(e) {console.log(`Erro em dw do mediafire - `, e)}
}
await sleep(1000)
}

// ── GITHUB ────────────────────────────────────────────────────
if(dw.includes(`github`)) {
gh = getPlatform(data, 6)
if(gh.github) {
try {
let regex1 = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i
let [, user, repo] = dw.match(regex1) || []
repo = repo.replace(/.git$/, '')
let giturl = `https://api.github.com/repos/${user}/${repo}/zipball`
let filename = (await fetch(giturl, {method: 'HEAD'})).headers.get('content-disposition').match(/attachment; filename=(.*)/)[1]
let finishname = filename.split(`-`).splice(0, filename.split(`-`).length - 1).join(`-`)
kaoruko.sendMessage(from, {document: {url: giturl}, fileName: finishname+'.zip', mimetype: 'application/zip'}, {quoted: info})
} catch(e) {console.log(`Erro em dw do github - `, e)}
}
await sleep(1000)
}

// ── XVIDEOS ───────────────────────────────────────────────────
if(dw.includes(`xvideos`)) {
xv = getPlatform(data, 7)
if(xv.xvideos) {
try {
fetchxv = await fetchJson(`${okarunsite}/api/xvideos?url=${dw}&apikey=${API_KEY_WAGURI}`)
const videoUrl = fetchxv?.resultado?.download || fetchxv?.resultado?.url
if(videoUrl) kaoruko.sendMessage(from, {video: {url: videoUrl}}, {quoted: info})
} catch(e) {console.log(`Erro em dw do xvideos - `, e)}
}
await sleep(1000)
}

// ── XNXX ──────────────────────────────────────────────────────
if(dw.includes(`xnxx`)) {
xx = getPlatform(data, 8)
if(xx.xnxx) {
try {
fetchxx = await fetchJson(`${okarunsite}/api/xnxxdl?url=${dw}&apikey=${API_KEY_WAGURI}`)
const videoUrl = fetchxx?.resultado?.url
if(videoUrl) kaoruko.sendMessage(from, {video: {url: videoUrl}}, {quoted: info})
} catch(e) {console.log(`Erro em dw do xnxx - `, e)}
}
await sleep(1000)
}

// ── SPOTIFY ───────────────────────────────────────────────────
if(dw.includes(`spotify`)) {
sp2 = getPlatform(data, 9)
if(sp2.spotify) {
try {
react(kaoruko, from, `🎵`, info)
fetchsp = await fetchJson(`${okarunsite}/api/dl/spotify?url=${dw}&apikey=${API_KEY_WAGURI}`)
.catch(() => fetchJson(`${okarunsite}/api/dl/spotify/track?url=${dw}&apikey=${API_KEY_WAGURI}`))
const audioUrl = fetchsp?.resultado?.url || fetchsp?.resultado?.audio
const title = fetchsp?.resultado?.title || fetchsp?.resultado?.name || `Spotify`
if(audioUrl) kaoruko.sendMessage(from, {audio: {url: audioUrl}, mimetype: `audio/mpeg`, fileName: title+`.mp3`}, {quoted: info})
} catch(e) {console.log(`Erro em dw do spotify - `, e)}
}
await sleep(1000)
}

// ── KWAI ──────────────────────────────────────────────────────
if(dw.includes(`kwai`) || dw.includes(`k.kwai`)) {
kw = getPlatform(data, 10)
if(kw.kwai) {
try {
react(kaoruko, from, `🎬`, info)
fetchkw = await fetchJson(`${okarunsite}/api/kwai/video?url=${dw}&apikey=${API_KEY_WAGURI}`)
const videoUrl = fetchkw?.resultado?.url || fetchkw?.resultado?.video
if(videoUrl) kaoruko.sendMessage(from, {video: {url: videoUrl}}, {quoted: info})
} catch(e) {console.log(`Erro em dw do kwai - `, e)}
}
await sleep(1000)
}

// ── THREADS ───────────────────────────────────────────────────
if(dw.includes(`threads.net`)) {
th = getPlatform(data, 11)
if(th.threads) {
try {
fetchth = await fetchJson(`${okarunsite}/api/dl/threads?url=${dw}&apikey=${API_KEY_WAGURI}`)
.catch(() => fetchJson(`${okarunsite}/api/dl2/threads?url=${dw}&apikey=${API_KEY_WAGURI}`))
const medias = fetchth?.resultado
if(Array.isArray(medias)) {
for(thm of medias) {
await sleep(700)
if(thm.type == `video`) {
react(kaoruko, from, `📽`, info)
kaoruko.sendMessage(from, {video: {url: thm.url}}, {quoted: info})
} else {
react(kaoruko, from, `📸`, info)
kaoruko.sendMessage(from, {image: {url: thm.url}}, {quoted: info})
}
}
} else if(medias?.url) {
react(kaoruko, from, `📽`, info)
kaoruko.sendMessage(from, {video: {url: medias.url}}, {quoted: info})
}
} catch(e) {console.log(`Erro em dw do threads - `, e)}
}
await sleep(1000)
}

// ── PINTEREST ─────────────────────────────────────────────────
if(dw.includes(`pinterest`) || dw.includes(`pin.it`)) {
pn = getPlatform(data, 12)
if(pn.pinterest) {
try {
fetchpn = await fetchJson(`${okarunsite}/api/pinterest_mp4?url=${dw}&apikey=${API_KEY_WAGURI}`)
const videoUrl = fetchpn?.resultado?.url || fetchpn?.resultado?.video
const imageUrl = fetchpn?.resultado?.image
if(videoUrl) {
react(kaoruko, from, `📽`, info)
kaoruko.sendMessage(from, {video: {url: videoUrl}}, {quoted: info})
} else if(imageUrl) {
react(kaoruko, from, `📸`, info)
kaoruko.sendMessage(from, {image: {url: imageUrl}}, {quoted: info})
}
} catch(e) {console.log(`Erro em dw do pinterest - `, e)}
}
await sleep(1000)
}

// ── SOUNDCLOUD ────────────────────────────────────────────────
if(dw.includes(`soundcloud`)) {
sc = getPlatform(data, 13)
if(sc.soundcloud) {
try {
react(kaoruko, from, `🎵`, info)
fetchsc = await fetchJson(`${okarunsite}/api/soundcloud?url=${dw}&apikey=${API_KEY_WAGURI}`)
const audioUrl = fetchsc?.resultado?.url || fetchsc?.resultado?.audio
const title = fetchsc?.resultado?.title || `SoundCloud`
if(audioUrl) kaoruko.sendMessage(from, {audio: {url: audioUrl}, mimetype: `audio/mpeg`, fileName: title+`.mp3`}, {quoted: info})
} catch(e) {console.log(`Erro em dw do soundcloud - `, e)}
}
await sleep(1000)
}

// ── GOOGLE DRIVE ──────────────────────────────────────────────
if(dw.includes(`drive.google`)) {
gd = getPlatform(data, 14)
if(gd.gdrive) {
try {
react(kaoruko, from, `📁`, info)
fetchgd = await fetchJson(`${okarunsite}/api/dl/gdrive?url=${dw}&apikey=${API_KEY_WAGURI}`)
const fileUrl = fetchgd?.resultado?.url || fetchgd?.resultado?.download
const fileName = fetchgd?.resultado?.name || fetchgd?.resultado?.filename || `arquivo`
const mimeType = fetchgd?.resultado?.mimeType || `application/octet-stream`
if(fileUrl) kaoruko.sendMessage(from, {document: {url: fileUrl}, mimetype: mimeType, fileName: fileName}, {quoted: info})
} catch(e) {console.log(`Erro em dw do google drive - `, e)}
}
await sleep(1000)
}

// ── PORNHUB ───────────────────────────────────────────────────
if(dw.includes(`pornhub`)) {
ph = getPlatform(data, 15)
if(ph.pornhub) {
try {
fetchph = await fetchJson(`${okarunsite}/api/pornhub?url=${dw}&apikey=${API_KEY_WAGURI}`)
const videoUrl = fetchph?.resultado?.url || fetchph?.resultado?.video
if(videoUrl) kaoruko.sendMessage(from, {video: {url: videoUrl}}, {quoted: info})
} catch(e) {console.log(`Erro em dw do pornhub - `, e)}
}
await sleep(1000)
}

// ── CAPCUT ────────────────────────────────────────────────────
if(dw.includes(`capcut`)) {
cc = getPlatform(data, 16)
if(cc.capcut) {
try {
react(kaoruko, from, `🎬`, info)
fetchcc = await fetchJson(`${okarunsite}/api/dl/capcut?url=${dw}&apikey=${API_KEY_WAGURI}`)
const videoUrl = fetchcc?.resultado?.url || fetchcc?.resultado?.video
if(videoUrl) kaoruko.sendMessage(from, {video: {url: videoUrl}}, {quoted: info})
} catch(e) {console.log(`Erro em dw do capcut - `, e)}
}
await sleep(1000)
}
}
}
}

module.exports = { autodw, saveAutoDW, addUsuInAutoDW, getUsuAutoDW, activateAutoDWinUsu, disableAutoDWinUsu, idAllLinkAutoDW }
