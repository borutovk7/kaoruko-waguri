/* SISTEMA DE DE PEGA STICK DE CANAL PRA GIT HUB */
const fs    = require('fs');
const path  = require('path');
const https = require('https');

/* logs */

let successLog, infoLog, warningLog, errorLog;
try {
  ({ successLog, infoLog, warningLog, errorLog } = require('../definicoes.js'));
  if (typeof successLog !== 'function') throw new Error();
} catch {
  const tag  = '[StickerWatcher]';
  successLog = (...a) => console.log(tag, '✅', ...a);
  infoLog    = (...a) => console.log(tag, 'ℹ️ ', ...a);
  warningLog = (...a) => console.warn(tag, '⚠️ ', ...a);
  errorLog   = (...a) => console.error(tag, '❌', ...a);
}

/* configuração */

const CANAIS_JID = [
  '120363404701403742@newsletter',
  '120363425625000221@newsletter',
  "120363425654391456@newsletter",
];

const REPO_NAME   = 'kauroko-stickers';
const REPO_FOLDER = 'stickers';
const BRANCH      = 'main';
const LOCAL_DIR   = './database/stickers-canal';
const LINKS_JSON  = './database/sticker-links.json';
const DELAY_MS    = 800;
const MAX_RETRIES = 3;

let GITHUB_TOKEN, GITHUB_USER;
try {
  const apikeys = require('../configs/apikeys.json');
  GITHUB_TOKEN  = apikeys.apis?.GITHUB_TOKEN;
  GITHUB_USER   = apikeys.apis?.GITHUB_USER;
} catch {
  errorLog('Não foi possível ler ./configs/apikeys.json');
}

/* github */

function githubRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const data    = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path:     endpoint,
      method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent':    'kauroko-sticker-uploader',
        'Accept':        'application/vnd.github+json',
        'Content-Type':  'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getFileSha(repoPath) {
  const res = await githubRequest('GET',
    `/repos/${GITHUB_USER}/${REPO_NAME}/contents/${repoPath}?ref=${BRANCH}&t=${Date.now()}`);
  return res.status === 200 ? res.body.sha : null;
}

async function uploadToGitHub(localPath, repoPath, msgId) {
  const content = fs.readFileSync(localPath).toString('base64');
  for (let tentativa = 1; tentativa <= MAX_RETRIES; tentativa++) {
    const sha = await getFileSha(repoPath);
    const res = await githubRequest('PUT',
      `/repos/${GITHUB_USER}/${REPO_NAME}/contents/${repoPath}`, {
        message: `sticker: ${msgId}`,
        content,
        branch: BRANCH,
        ...(sha ? { sha } : {})
      });
    if (res.status === 201 || res.status === 200) {
      return `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO_NAME}/${BRANCH}/${repoPath}`;
    }
    if (res.status === 409) {
      warningLog(`SHA desatualizado, tentativa ${tentativa}/${MAX_RETRIES}...`);
      await new Promise(r => setTimeout(r, 500 * tentativa));
      continue;
    }
    throw new Error(`GitHub ${res.status}: ${JSON.stringify(res.body)}`);
  }
  throw new Error(`Falhou após ${MAX_RETRIES} tentativas (409 persistente)`);
}

let _repoOk = false;
async function ensureRepo() {
  if (_repoOk) return;
  const check = await githubRequest('GET', `/repos/${GITHUB_USER}/${REPO_NAME}`);
  if (check.status === 200) { _repoOk = true; return; }
  infoLog(`Criando repositório "${REPO_NAME}"...`);
  const res = await githubRequest('POST', '/user/repos', {
    name: REPO_NAME, description: 'Figurinhas capturadas do canal pelo bot',
    private: false, auto_init: true
  });
  if (res.status !== 201) throw new Error(`Erro ao criar repo: ${JSON.stringify(res.body)}`);
  successLog('Repositório criado!');
  await new Promise(r => setTimeout(r, 3000));
  _repoOk = true;
}

/* links */

function loadLinks() {
  try {
    if (fs.existsSync(LINKS_JSON)) return JSON.parse(fs.readFileSync(LINKS_JSON, 'utf8'));
  } catch {}
  return {};
}

function saveLinks(links) {
  fs.mkdirSync(path.dirname(LINKS_JSON), { recursive: true });
  fs.writeFileSync(LINKS_JSON, JSON.stringify(links, null, 2));
}

/* sticker */

function buildStickerUrl(sticker) {
  if (sticker.directPath) return `https://mmg.whatsapp.net${sticker.directPath}`;
  if (sticker.url)        return sticker.url;
  return null;
}

async function processStickerFromCanal(sock, data) {
  const message   = data.messages[0];
  const msgId     = message?.key?.id;
  const remoteJid = message?.key?.remoteJid;
  const Sticker   = message?.message?.stickerMessage;

  if (!Sticker) return;
  if (!CANAIS_JID.includes(remoteJid)) return;
  if (loadLinks()[msgId]) return;

  infoLog(`Sticker detectado no canal ${remoteJid} | msgId: ${msgId}`);

  try {
    if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });

    const stickerUrl = buildStickerUrl(Sticker);

    if (!stickerUrl) {
      warningLog(`Sticker ${msgId} sem url ou directPath — ignorado.`);
      return;
    }

    const response    = await fetch(stickerUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);

    const fileName = `${LOCAL_DIR}/sticker_${msgId}.webp`;
    fs.writeFileSync(fileName, buffer);
    infoLog(`Sticker salvo localmente: ${fileName}`);

    await ensureRepo();
    await new Promise(r => setTimeout(r, DELAY_MS));

    const repoPath = `${REPO_FOLDER}/sticker_${msgId}.webp`;
    const rawUrl   = await uploadToGitHub(fileName, repoPath, msgId);

    const links  = loadLinks();
    links[msgId] = rawUrl;
    saveLinks(links);

    successLog(`Sticker enviado ao GitHub: ${rawUrl}`);
    fs.unlinkSync(fileName);

  } catch (e) {
    errorLog(`Falha ao processar sticker ${msgId}:`, e);
  }
}

/* ─── Valida se os canais existem antes de escutar ─── */

async function validarCanais(sock) {
  const validos = [];
  for (const jid of CANAIS_JID) {
    try {
      const meta = await sock.newsletterMetadata('jid', jid);
      if (meta?.id) {
        infoLog(`Canal válido: ${meta.name || jid}`);
        validos.push(jid);
      } else {
        warningLog(`Canal não encontrado ou inacessível: ${jid}`);
      }
    } catch (e) {
      warningLog(`Erro ao validar canal ${jid}: ${e.message}`);
    }
  }
  return validos;
}

/* ─── Busca stickers históricos do canal no boot ─── */

async function buscarStickersHistoricos(sock, jid, count = 50) {
  try {
    infoLog(`Buscando histórico de stickers do canal ${jid}...`);
    const mensagens = await sock.newsletterFetchMessages('jid', jid, count);
    if (!Array.isArray(mensagens) || !mensagens.length) {
      infoLog(`Nenhuma mensagem histórica encontrada em ${jid}`);
      return;
    }

    const links = loadLinks();
    let novos = 0;

    for (const msg of mensagens) {
      const msgId   = msg?.key?.id;
      const sticker = msg?.message?.stickerMessage;
      if (!sticker || !msgId) continue;
      if (links[msgId]) continue; /* já processado */

      try {
        if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });

        const stickerUrl = buildStickerUrl(sticker);
        if (!stickerUrl) continue;

        const response    = await fetch(stickerUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer      = Buffer.from(arrayBuffer);

        const fileName = `${LOCAL_DIR}/sticker_${msgId}.webp`;
        fs.writeFileSync(fileName, buffer);

        await ensureRepo();
        await new Promise(r => setTimeout(r, DELAY_MS));

        const repoPath = `${REPO_FOLDER}/sticker_${msgId}.webp`;
        const rawUrl   = await uploadToGitHub(fileName, repoPath, msgId);

        links[msgId] = rawUrl;
        saveLinks(links);
        successLog(`[Histórico] Sticker enviado ao GitHub: ${rawUrl}`);
        fs.unlinkSync(fileName);
        novos++;

        await new Promise(r => setTimeout(r, DELAY_MS));
      } catch (e) {
        errorLog(`[Histórico] Falha no sticker ${msgId}: ${e.message}`);
      }
    }

    infoLog(`[Histórico] ${novos} sticker(s) novo(s) processado(s) de ${jid}`);
  } catch (e) {
    errorLog(`[Histórico] Erro ao buscar mensagens de ${jid}: ${e.message}`);
  }
}

/* ─── Inicialização: valida canais e busca histórico ─── */

async function iniciarCanalWatcher(sock) {
  const validos = await validarCanais(sock);
  for (const jid of validos) {
    await buscarStickersHistoricos(sock, jid);
  }
}

module.exports = { processStickerFromCanal, loadLinks, iniciarCanalWatcher };
