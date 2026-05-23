const { successLog, errorLog, warningLog } = require('../../arquivos/funcoes/logger.js');
const fs   = require('fs');
const path = require('path');

/* ─── Paths ──────────────────────────────────────────────────────────────── */
const USERS_DIR    = path.resolve('./database/users');
const GROUPS_FILE  = path.resolve('./util/temp/grupos.json');
const TEMPLID_FILE = path.join(USERS_DIR, 'templid.json');

const userPath = (lid) => path.join(USERS_DIR, `${lid}.json`);

/* Garante que a pasta de usuários existe */
if (!fs.existsSync(USERS_DIR)) fs.mkdirSync(USERS_DIR, { recursive: true });

/* ─── Cache em memória do tempLid ────────────────────────────────────────── */
let _tempLid = { id: null, ts: 0 };
const TEMPLID_TTL = 2500;

try {
  if (fs.existsSync(TEMPLID_FILE)) {
    const saved = JSON.parse(fs.readFileSync(TEMPLID_FILE, 'utf8'));
    if (saved?.id && Date.now() < (saved.date ?? 0) + TEMPLID_TTL) {
      _tempLid = { id: saved.id, ts: saved.date ?? 0 };
    }
  }
} catch { /* ignora arquivo corrompido */ }

function _saveTempLid(id) {
  const ts = Date.now();
  _tempLid  = { id, ts };
  fs.writeFile(TEMPLID_FILE, JSON.stringify({ id, date: ts }, null, 2), () => {});
}

function _tempLidValid(jid) {
  return _tempLid.id === jid && Date.now() < _tempLid.ts + TEMPLID_TTL;
}

/* ─── Grupos ─────────────────────────────────────────────────────────────── */
let _groupsCache    = null;
let _groupsCacheMts = 0;

function getGroups() {
  try {
    if (!fs.existsSync(GROUPS_FILE)) return [];
    const mts = fs.statSync(GROUPS_FILE).mtimeMs;
    if (_groupsCache && mts === _groupsCacheMts) return _groupsCache;
    _groupsCache    = JSON.parse(fs.readFileSync(GROUPS_FILE, 'utf8'));
    _groupsCacheMts = mts;
    return _groupsCache;
  } catch (err) {
    errorLog(`[senderlid] Erro ao ler grupos.json: ${err.message}`);
    return _groupsCache ?? [];
  }
}

function getGroupParticipantsMap() {
  const participants = getGroups().flatMap(g => g.participants ?? []);
  return new Map(participants.map(p => [p.jid, { ...p, lid: p.id }]));
}

/* ─── Helpers de normalização ────────────────────────────────────────────── */
function normalizeJid(jid) {
  if (!jid || typeof jid !== 'string') return jid;
  return jid.includes(':') ? jid.split(':')[0] + '@s.whatsapp.net' : jid;
}

function normalizeLid(lid) {
  if (!lid || typeof lid !== 'string') return lid;
  return lid.includes(':') ? lid.split(':')[0] + '@lid' : lid;
}

function isLidAddress(str) {
  return typeof str === 'string' && str.endsWith('@lid');
}

function isJidAddress(str) {
  return typeof str === 'string' && str.endsWith('@s.whatsapp.net');
}

/* ─── I/O de usuários ────────────────────────────────────────────────────── */
function pushnames() {
  try {
    return fs.readdirSync(USERS_DIR)
      .filter(f => f.endsWith('.json') && f !== 'templid.json')
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(USERS_DIR, f), 'utf8'));
        } catch {
          errorLog(`[senderlid] Erro ao parsear ${f}`);
          return null;
        }
      })
      .filter(Boolean);
  } catch (err) {
    errorLog(`[senderlid] Erro ao listar usuários: ${err.message}`);
    return [];
  }
}

let _jidScanCache    = null;
let _jidScanCacheMts = 0;

function _getJidScan() {
  try {
    const mts = fs.statSync(USERS_DIR).mtimeMs;
    if (_jidScanCache && mts === _jidScanCacheMts) return _jidScanCache;
    _jidScanCache    = pushnames();
    _jidScanCacheMts = mts;
    return _jidScanCache;
  } catch {
    return pushnames();
  }
}

function _invalidateJidCache() {
  _jidScanCache = null;
}

/* FIX: type padrão era 'lid' antes mas a chamada interna usava 'jid' — unificado */
function existsLidData(lid, type = 'lid') {
  if (!lid || typeof lid !== 'string') return false;
  if (type === 'lid') {
    /* Busca pelo arquivo cujo nome é o LID */
    const cleanLid = normalizeLid(lid);
    return fs.existsSync(userPath(cleanLid));
  }
  /* type === 'jid': busca por JID dentro dos arquivos */
  return _getJidScan().some(u => u?.jid === lid);
}

function userLid(lid, type = 'lid') {
  if (!lid || typeof lid !== 'string') return {};
  if (type === 'lid') {
    const cleanLid = normalizeLid(lid);
    try { return JSON.parse(fs.readFileSync(userPath(cleanLid), 'utf8')); } catch { return {}; }
  }
  return _getJidScan().find(u => u?.jid === lid) ?? {};
}

/* FIX: saveUserID agora recebe o LID já resolvido e salva direto, sem reconversão */
function saveUserID(data, lid) {
  try {
    /* Garante que usamos o LID limpo como nome do arquivo */
    const cleanLid = normalizeLid(lid);
    if (!cleanLid || !isLidAddress(cleanLid)) {
      errorLog(`[senderlid] saveUserID: LID inválido "${lid}"`);
      return;
    }
    fs.writeFileSync(userPath(cleanLid), JSON.stringify(data, null, 2));
    _invalidateJidCache();
  } catch (err) {
    errorLog(`[senderlid] Erro ao salvar usuário ${lid}: ${err.message}`);
  }
}

function rmUserID(lid) {
  try {
    const cleanLid = normalizeLid(lid);
    const filePath = userPath(cleanLid);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      _invalidateJidCache();
    }
  } catch (err) {
    errorLog(`[senderlid] Erro ao remover usuário ${lid}: ${err.message}`);
  }
}

/* ─── Conversão JID ↔ LID ───────────────────────────────────────────────── */
function convertWhatsAppUser(input, type = 'jid') {
  if (input == null) return;

  const isArray  = Array.isArray(input);
  const lidArray = isArray ? input : [input];
  const byJid    = getGroupParticipantsMap();

  const result = lidArray.map(lid => {
    if (!lid || typeof lid !== 'string') return lid ?? undefined;

    const detection = isLidAddress(lid) ? 'lid' : 'jid';

    /* 1. Tenta no mapa de participantes do grupo (mais rápido) */
    let match;
    if (detection === 'lid') {
      match = [...byJid.values()].find(m => normalizeLid(m.lid) === normalizeLid(lid));
    } else {
      match = byJid.get(normalizeJid(lid));
    }

    if (match) {
      if (type === 'lid') return normalizeLid(match.lid);
      if (type === 'jid') return normalizeJid(match.jid);
    }

    /* 2. Tenta no arquivo do usuário */
    const fromFile = existsLidData(lid, detection) ? userLid(lid, detection) : null;
    if (fromFile?.jid && fromFile?.lid) {
      if (type === 'lid') return normalizeLid(fromFile.lid);
      if (type === 'jid') return normalizeJid(fromFile.jid);
    }

    /* 3. Fallback: retorna o próprio input */
    return lid;
  });

  return isArray ? result : result[0];
}

/* ─── Registro de usuário ────────────────────────────────────────────────── */
async function AddWhatsAppuser(socket, message, restart = 1000 * 60 * 60) {
  try {
    /* Monta info normalizada (fromMe ou mensagem recebida) */
    const info = message?.key?.fromMe
      ? {
          key: {
            remoteJid:      socket?.user?.id  || socket?.user?.jid,
            senderLid:      socket?.user?.lid,
            addressingMode: null,
          },
          pushName: socket?.user?.name || socket?.user?.pushname || socket?.user?.verifiedName,
        }
      : message;

    if (!info?.key?.remoteJid) return;

    const from    = info.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const name    = info.pushName || message?.pushName || 'user';

    let senderjid, senderlid;

    if (isGroup) {
      /* ── Grupo ──────────────────────────────────────────────────────────
       *
       * Modo LID (addressingMode = "lid"):
       *   key.participant    = "XXXXX@lid"            ← LID
       *   key.participantAlt = "XXXXX@s.whatsapp.net" ← JID
       *
       * Modo antigo:
       *   key.participant    = "XXXXX@s.whatsapp.net" ← JID
       *   key.participantAlt = não existe / é o LID
       * ----------------------------------------------------------------- */
      const rawParticipant    = info.key.participant    || '';
      const rawParticipantAlt = info.key.participantAlt || '';
      const isLidMode         = info.key.addressingMode === 'lid' || isLidAddress(rawParticipant);

      if (isLidMode) {
        /* FIX: normalizações diretas — sem tentar converter pelo mapa ainda */
        senderlid = normalizeLid(rawParticipant);
        senderjid = normalizeJid(
          rawParticipantAlt ||
          convertWhatsAppUser(senderlid, 'jid') ||
          rawParticipant
        );
      } else {
        senderjid = normalizeJid(rawParticipant);
        if (!senderjid || typeof senderjid !== 'string') return;

        if (_tempLidValid(senderjid)) {
          senderlid = normalizeLid(senderjid.replace('@s.whatsapp.net', '') + '@lid');
        } else {
          const altLid = rawParticipantAlt && isLidAddress(rawParticipantAlt)
            ? rawParticipantAlt
            : null;

          if (altLid) {
            senderlid = normalizeLid(altLid);
            _saveTempLid(senderjid);
          } else if (socket && typeof socket.onWhatsApp === 'function') {
            const infoWA = await socket.onWhatsApp(senderjid).catch(() => []);
            if (!infoWA?.length) return;
            senderlid = normalizeLid(infoWA[0]?.lid);
            if (senderlid) _saveTempLid(senderjid);
            else return;
          } else {
            return;
          }
        }
      }

    } else {
      /* ── Chat privado ─────────────────────────────────────────────────── */
      const isLidMode = info.key.addressingMode === 'lid' || isLidAddress(from);

      if (isLidMode) {
        senderlid = normalizeLid(from);
        senderjid = normalizeJid(
          info.key.remoteJidAlt ||
          convertWhatsAppUser(senderlid, 'jid') ||
          from
        );
      } else {
        senderjid = normalizeJid(from);
        senderlid = normalizeLid(info.key.senderLid);
      }
    }

    /* Validações finais */
    if (!senderjid || !senderlid) return;
    if (typeof senderlid !== 'string' || senderlid.includes('status')) return;
    if (!isLidAddress(senderlid)) return;

    const now  = Date.now();
    /* FIX: data salva com o LID limpo já resolvido, não passa pelo convertWhatsAppUser */
    const data = { jid: senderjid, lid: senderlid, name, date: now + restart };

    if (!existsLidData(senderlid)) {
      successLog(`NOVO USUÁRIO: ${senderjid} / ${senderlid} / ${name}`);
      saveUserID(data, senderlid);
      return;
    }

    const existing = userLid(senderlid);
    if (now >= (existing.date ?? 0)) {
      warningLog(`ATUALIZANDO USUÁRIO: ${senderjid} / ${senderlid} / ${name}`);
      saveUserID(data, senderlid);
    }

  } catch (e) {
    errorLog(`[senderlid] Erro AddWhatsAppuser: ${e?.message ?? e}`);
  }
}

/* ─── Helpers públicos ───────────────────────────────────────────────────── */

/* FIX: type padrão agora é 'lid' — correto para busca por arquivo */
const getname = (id, type) => {
  const resolvedType = type ?? (isLidAddress(id) ? 'lid' : 'jid');
  return existsLidData(id, resolvedType) ? (userLid(id, resolvedType).name ?? 'usuário') : 'usuário';
};

/* ─── Exports ────────────────────────────────────────────────────────────── */
module.exports = {
  pushnames,
  existsLidData,
  userLid,
  convertWhatsAppUser,
  saveUserID,
  AddWhatsAppuser,
  rmUserID,
  getname,
  normalizeJid,
  normalizeLid,
  isLidAddress,
};
