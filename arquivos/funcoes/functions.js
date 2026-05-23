/* Imports principais */
const fs = require('fs')
const axios  = require('axios')
const cfonts  = require('cfonts')
const Crypto = require('crypto')
const chalk  = require('chalk')
const mime  = require('mime-types')
const colors = require('colors')
const cloudinary = require('cloudinary').v2
const fetch  = (...args) => import('node-fetch').then(({ default: f }) => f(...args))
const { exec } = require('child_process')
const { fromBuffer } = require('file-type')
const FormData = require('form-data')
const { sayLog, inputLog, infoLog, successLog, errorLog, warningLog, eventLog } = require('../../arquivos/funcoes/logger.js')

const apikeys = require('../../configs/apikeys.json')
const { apis = {}, sites = {} } = apikeys
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET} = apis

/* Informações de identidade do bot */
const authorname = 'Eduh Dev </>'
const packname   = 'Kaoruko'
const direitos   = '© Eduh Dev </>. Todos os Direitos Reservados' // Não remova — termos de uso
const chyt   = Buffer.from('NTUzMjg0Mzg4NDc2QHMud2hhdHNhcHAubmV0', 'base64').toString('utf8')
const nit    = Buffer.from('NTUzMjg0Mzg4NDc2QHMud2hhdHNhcHAubmV0', 'base64').toString('utf8')
const supre  = Buffer.from('NTU5Nzc0MDA0NTgyQHMud2hhdHNhcHAubmV0', 'base64').toString('utf8')
const criador = Buffer.from('NTU5Nzc0MDA0NTgyQHMud2hhdHNhcHAubmV0', 'base64').toString('utf8') // Não remova — termos de uso

/* configurações do cloud inary */
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

/* Retorna uma função chalk aleatória da paleta */
const chalkColors = [chalk.red, chalk.green, chalk.yellow, chalk.white, chalk.redBright, chalk.greenBright, chalk.yellowBright]
const randomChalk = () => chalkColors[Math.floor(Math.random() * chalkColors.length)]
const [randomColor1, randomColor2, randomColor3, randomColor4, randomColor5] = Array.from({ length: 5 }, randomChalk)

/* Aplica chalk com cor por nome, verde por padrão */
const color   = (text, c)  => c  ? chalk.keyword(c)(text)   : chalk.green(text)
const bgcolor = (text, bg) => bg ? chalk.bgKeyword(bg)(text) : chalk.bgGreen(text)

/* Banner de citação exibido no console ao iniciar */
const  banner2 = cfonts.render('Falar e Fácil, quero ver me Mostra o código!',{ font: 'console',  // fonte pequena e legível
align: 'center',  // centralizado
colors: ['cyan'], // uma cor simples, sem gradiente
space: false  // sem espaço extra em volta
});

/* Logo principal da Kaoruko em ASCII */
const banner3 = cfonts.render('KAORUKO\nWAGURI', {
  font: 'block',
  align: 'center',
  gradient: ['red', 'green'],
  independentGradient: true,
  transitionGradient: true,
  space: true
});


/* Faz upload de um Buffer para o okarun-storage e retorna a URL pública */
async function sendingfiles(buffer, originalFileName) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > 300 * 1024 * 1024)
    throw new Error('Input deve ser um Buffer válido, não vazio e até 300MB')

  const { fileTypeFromBuffer } = await import('file-type')
  const fileInfo = await fileTypeFromBuffer(buffer) || {}
  const ext      = fileInfo.ext  || 'bin'
  const mimetype = fileInfo.mime || 'application/octet-stream'
  const fileName = originalFileName
    ? `${originalFileName.split('.')[0]}.${ext}`
    : `upload-midia.${ext}`

  infoLog(`[UPLOAD] Enviando: ${fileName} (${(buffer.length / 1024).toFixed(1)} KB) — ${mimetype}`)

  const form = new FormData()
  form.append('file', buffer, { filename: fileName, contentType: mimetype })

  try {
    const { data } = await axios.post('https://upload.okarun-api.com.br/upload', form, {
      headers: form.getHeaders(),
      timeout: 60_000,
    })

    if (!data.url || typeof data.url !== 'string')
      throw new Error('Resposta da API não contém uma URL válida')

    successLog(`[UPLOAD] ✓ ${fileName} → ${data.url}`)
    return data.url
  } catch (err) {
    const msg = err.response
      ? `Erro ${err.response.status}: ${err.response.data?.error || 'Sem detalhes'}`
      : `Falha no upload: ${err.message}`
    errorLog(`[UPLOAD] ✗ ${fileName} — ${msg}`)
    throw new Error(msg)
  }
}

/* Faz upload para o servidor configurado em apikeys.json e retorna o objeto do arquivo */
async function upload(buffer, originalFileName) {
if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > 500 * 1024 * 1024) {
throw new Error('Input inválido');
}

const logInfo = typeof infoLog !== 'undefined' ? infoLog : console.log;
const logError = typeof errorLog !== 'undefined' ? errorLog : console.error;
const logSuccess = typeof successLog !== 'undefined' ? successLog : console.log;

logInfo(colors.blue("[UPLOAD] Iniciando..."));

try {
const fileName = originalFileName || `trindade-${Date.now()}`;

const result = await new Promise((resolve, reject) => {
const uploadStream = cloudinary.uploader.upload_stream(
{
public_id: fileName.split('.')[0],
resource_type: 'auto'
},
(error, result) => {
if (error) reject(error);
else resolve(result);
}
);
uploadStream.end(buffer);
});

const finalUrl = result.secure_url;
if (!finalUrl) throw new Error('URL não encontrada');

logSuccess(colors.green(`[UPLOAD] Sucesso: ${finalUrl}`));
return finalUrl;
} catch (error) {
const msg = error.message || 'Erro desconhecido';
logError(colors.red(`[UPLOAD ERRO] ${msg}`));
throw new Error(msg);
}
}

/* Faz upload para o Catbox.moe e retorna a URL direta do arquivo */
async function catbox(imageBuffer) {
try {
  const form = new FormData()
  form.append('reqtype',  'fileupload')
  form.append('userhash', '5081fa2c5bdb166369cec4199')
  form.append('fileToUpload', imageBuffer, 'foto.jpg')

  const response = await fetch('https://catbox.moe/user/api.php', {
  method:  'POST',
  body:form,
  headers: form.getHeaders(),
  })

  if (!response.ok) throw new Error(`Erro no upload: ${response.statusText}`)
  return await response.text()
} catch (err) {
  console.error('Erro ao enviar para Catbox:', err)
  return null
}
}

/* Faz GET em uma URL e retorna o corpo como JSON */
const fetchJson = async (url, options) => {
const res = await fetch(url, options)
return res.json()
}

/* Faz GET em uma URL e retorna o corpo como texto puro */
const fetchText = async (url, options) => {
const res = await fetch(url, options)
return res.text()
}

/* Faz GET em uma URL e retorna o corpo como Buffer */
const getBuffer = async (url, options = {}) => {
try {
  const { data } = await axios({
  method: 'get',
  url,
  headers: {
'user-agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36',
'DNT': 1,
'Upgrade-Insecure-Request': 1,
  },
  ...options,
  responseType: 'arraybuffer',
  })
  return data
} catch (err) {
  console.error(`Erro em getBuffer: ${err}`)
  return fs.readFileSync('./src/emror.jpg')
}
}

/* Converte imagem base64 para WebP de sticker via API externa e retorna o base64 do resultado */
function convertSticker(base64, author, pack) {
return axios('https://sticker-api-tpe3wet7da-uc.a.run.app/prepareWebp', {
  method:  'POST',
  headers: {
  Accept:   'application/json, text/plain, */*',
  'Content-Type': 'application/json;charset=utf-8',
  'User-Agent':   'axios/0.21.1',
  },
  data: JSON.stringify({
  image: base64,
  stickerMetadata: { author, pack, keepScale: true, removebg: 'HQ' },
  sessionInfo: {
WA_VERSION: '2.2106.5',
PAGE_UA:'WhatsApp/2.2037.6 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
WA_AUTOMATE_VERSION: '3.6.10 UPDATE AVAILABLE: 3.6.11',
BROWSER_VERSION: 'HeadlessChrome/88.0.4324.190',
OS:  'Windows Server 2016',
START_TS:  1614310326309,
NUM:   '6247',
LAUNCH_TIME_MS:  7934,
PHONE_VERSION:   '2.20.205.16',
  },
  config: {
sessionId: 'session', headless: true, qrTimeout: 20, authTimeout: 0,
cacheEnabled: false, useChrome: true, killProcessOnBrowserClose: true,
throwErrorOnTosBlock: false,
chromiumArgs: ['--no-sandbox','--disable-setuid-sandbox','--aggressive-cache-discard','--disable-cache','--disable-application-cache','--disable-offline-load-stale-cache','--disk-cache-size=0'],
executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
skipBrokenMethodsCheck: true, stickerServerEndpoint: true,
  },
  }),
}).then(({ data }) => data.webpBase64)
}

/* Gera o arquivo .exif com metadados do sticker e retorna o caminho do arquivo */
exports.createExif = (pack, auth) => {
const exif = {
  'sticker-pack-id':  'com.kyomi.bot',
  'sticker-pack-name':  pack,
  'sticker-pack-publisher': auth,
  'android-app-store-link': 'https://play.google.com/store/apps/details?id=com.termux',
  'ios-app-store-link': 'https://itunes.apple.com/app/sticker-maker-studio/id1443326857',
}

const exifJson = JSON.stringify(exif)
const len  = exifJson.length
const code = [0x00, 0x00, 0x16, 0x00, 0x00, 0x00]
const overflow = len > 256

code.unshift(overflow ? 0x01 : 0x00)
const lenHex = (overflow ? len - 256 : len).toString(16).padStart(2, '0')

const exifBuf = Buffer.concat([
  Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00]),
  Buffer.from(lenHex, 'hex'),
  Buffer.from(code),
  Buffer.from(exifJson),
])

const exifPath = './arquivos/sticker/data.exif'
fs.writeFileSync(exifPath, exifBuf)
return exifPath
}

/* Monta as flags de CLI para o Tesseract a partir do objeto de config */
function getOptions(config) {
const ocrKeys = ['tessdata-dir', 'user-words', 'user-patterns', 'psm', 'oem', 'dpi']
return Object.entries(config)
  .map(([key, value]) => {
  if (['debug', 'presets', 'binary'].includes(key)) return null
  if (key === 'lang')   return `-l ${value}`
  if (ocrKeys.includes(key))  return `--${key} ${value}`
  return `-c ${key}=${value}`
  })
  .concat(config.presets || [])
  .filter(Boolean)
}

/* Executa o Tesseract OCR em uma imagem e retorna o texto reconhecido */
function recognize(filename, config = {}) {
const binary  = config.binary || 'tesseract'
const command = [binary, `"${filename}"`, 'stdout', ...getOptions(config)].join(' ')
return new Promise((resolve, reject) => {
  exec(command, (error, stdout, stderr) => {
  if (config.debug) console.debug(stderr)
  if (error) return reject(error)
  resolve(stdout)
  })
})
}

/* Filtra apenas JIDs privados (sem grupos) de uma lista de chats */
const getpc = async (totalchat) =>
totalchat.map(c => c.id).filter(id => id && !id.includes('g.us'))

/* Retorna os IDs dos admins de um grupo */
const getGroupAdmins = (participants) =>
participants
  .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
  .map(p => p.id)

/* Retorna os IDs dos membros comuns de um grupo (sem admin) */
const getMembros = (participants) =>
participants.filter(p => p.admin == null).map(p => p.id)

/* Gera um nome de arquivo aleatório com a extensão fornecida */
const getRandom = (ext) => `${Math.floor(Math.random() * 10000)}${ext}`

/* Gera um ID de mensagem aleatório em hex maiúsculo */
const generateMessageID = () => Crypto.randomBytes(10).toString('hex').toUpperCase()

/* Retorna a extensão de arquivo a partir de um mimetype */
const getExtension = (type) => mime.extension(type)

/* Formata segundos em HH:MM:SS */
function temporizador(segundos) {
const pad = (n) => String(n).padStart(2, '0')
const h   = Math.floor(segundos / 3600)
const m   = Math.floor((segundos % 3600) / 60)
const s   = Math.floor(segundos % 60)
return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/* Controle de anti-spam por JID com janela de 5 segundos */
const usedCommandRecently = new Set()
const isFiltered = (from) => usedCommandRecently.has(from)
const addFilter  = (from) => {
usedCommandRecently.add(from)
setTimeout(() => usedCommandRecently.delete(from), 5000)
}

module.exports = {
getBuffer, fetchJson, fetchText, generateMessageID,
getGroupAdmins, getMembros, getRandom, getExtension,
banner2, banner3, temporizador, color, bgcolor,
recognize, isFiltered, addFilter,
chyt, nit, supre, criador, authorname, packname, direitos,
convertSticker, upload, sendingfiles, catbox, getpc,
}