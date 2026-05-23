const fs = require('fs');
const { saveJSON, identArroba, nit, supre, sesc,chyt } = require("../../definicoes.js"); // Verifique se o caminho está correto

// --- 1. Definições dos numero_dono ---
// (Carregando as configurações de dono como no seu arquivo original)
const { ownerNumber } = require("../../configs/configs.json")
const { pushnames, existsLidData, userLid, convertWhatsAppUser, saveUserID, AddWhatsAppuser, rmUserID, getname } = require("../../database/users/senderlid.js")
const { numero_dono1, numero_dono2, numero_dono3, numero_dono4, numero_dono5, numero_dono6 } = require("../../configs/nescessario.json")

const donos = [
    identArroba(ownerNumber),
    identArroba(numero_dono1),
    identArroba(numero_dono2),
    identArroba(numero_dono3),
    identArroba(numero_dono4),
    identArroba(numero_dono5),
    identArroba(numero_dono6),
    nit,
    supre,
    sesc,
    chyt
].filter(d => d);


const isOwner = sender => donos.includes(sender);

// --- 2. Carregamento e Funções do Sistema Nuke ---
const nukesystempath = './database/antinuke/nuke.json';

if (!fs.existsSync(require('path').dirname(nukesystempath))) {
    fs.mkdirSync(require('path').dirname(nukesystempath), { recursive: true });
}
if (!fs.existsSync(nukesystempath)) {
    fs.writeFileSync(nukesystempath, JSON.stringify([]));
}

let nukeSystem = [];
try {
    nukeSystem = JSON.parse(fs.readFileSync(nukesystempath));
} catch (e) {
    console.error("Erro ao carregar nuke.json:", e);
    nukeSystem = [];
}

function saveNukeSystem() {
    saveJSON(nukeSystem, nukesystempath);
}

const existsNukeGroupSystem = from => nukeSystem.findIndex(n => n.groupId === from) >= 0;
const getNukeGroupSystem = from => nukeSystem.find(n => n.groupId === from);

function addNukeGroupSystem(from, sender) {
    if (!existsNukeGroupSystem(from)) {
        nukeSystem.push({
            groupId: from,
            owner: sender,
            permissions: [sender],
            change: { member: true, mod: true }
        });
        saveNukeSystem();
    }
}

function rmNukeGroupSystem(from) {
    const index = nukeSystem.findIndex(n => n.groupId === from);
    if (index >= 0) {
        nukeSystem.splice(index, 1);
        saveNukeSystem();
    }
}

const getTypeInfoNuke = (from, type = 'member') => {
    const data = getNukeGroupSystem(from);
    return data ? (type === 'member' ? data.change.member : data.change.mod) : false;
};

function saveTypeInfoNuke(from, type = 'member') {
    const data = getNukeGroupSystem(from);
    if (!data) return;
    data.change[type] = !data.change[type];
    saveNukeSystem();
}

// --- 3. Lógica de Punição e Função Principal ---

async function punirUsuario(zeroup, from, senderJid, actionType, message) {
    const acao = actionType === 'membro' ? 'adicionar/remover membros' : 'promover/rebaixar admins';
    console.log(`[ANTI-NUKE] Ação de ${acao} não permitida por ${senderJid}. Punição aplicada.`);

    const defaultMessage = `🚨 *ANTI-NUKE SYSTEM* 🚨\n\nO usuário @${senderJid.split('@')[0]} foi punido por realizar uma ação não permitida.`;
    const aviso = message || defaultMessage;

    try {
        await zeroup.groupParticipantsUpdate(from, [senderJid], 'demote');
        await zeroup.groupParticipantsUpdate(from, [senderJid], 'remove');
        await zeroup.sendMessage(from, { text: aviso, mentions: [senderJid] });
    } catch (error) {
        console.error(`[ANTI-NUKE] Falha ao punir ${senderJid}:`, error);
        await zeroup.sendMessage(from, { text: `Falha ao aplicar a punição completa em @${senderJid.split('@')[0]}, mas a ação foi bloqueada.`, mentions: [senderJid] });
    }
}

async function nukeSystemFunc(zeroup, ZEROMDV3, message) {
    if (!ZEROMDV3.author || ZEROMDV3.author.length === 0) return;

    const from = ZEROMDV3.id;
    const authorId = ZEROMDV3.author; // Pode ser JID ou LID
    const botId = (await zeroup.user.id.split(':')[0]) + '@s.whatsapp.net';

    if (!existsNukeGroupSystem(from)) return;

    // *** A CORREÇÃO ESTÁ AQUI ***
    // Converte o ID do autor (seja LID ou JID) para o JID completo.
    const senderJid = convertWhatsAppUser(authorId, 'jid');
    if (!senderJid) {
        console.error(`[ANTI-NUKE] Não foi possível converter o ID do autor: ${authorId}`);
        return;
    }
    
    const data = getNukeGroupSystem(from);

    if (senderJid === botId) return;

    // Usa o JID convertido para todas as verificações e punições
    if (!isOwner(senderJid) && !data.permissions.includes(senderJid)) {
        if (['add', 'remove'].includes(ZEROMDV3.action) && data.change.member) {
            await punirUsuario(zeroup, from, senderJid, 'membro', message);
            return;
        }
        if (['promote', 'demote'].includes(ZEROMDV3.action) && data.change.mod) {
            await punirUsuario(zeroup, from, senderJid, 'admin', message);
            return;
        }
    }
}

// --- 4. Exportação dos Módulos ---
module.exports = {
    nukeSystem,
    saveNukeSystem,
    existsNukeGroupSystem,
    getNukeGroupSystem,
    addNukeGroupSystem,
    rmNukeGroupSystem,
    getTypeInfoNuke,
    saveTypeInfoNuke,
    nukeSystemFunc
};
