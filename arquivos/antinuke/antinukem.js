const fs = require('fs');
const path = require('path');

// Fix: caminho e nome corretos
const { saveJSON, identArroba, nit, supre, sesc, chyt } = require("../../definicoes.js");

const { ownerNumber } = require("../../configs/configs.json");
const { numero_dono1, numero_dono2, numero_dono3, numero_dono4, numero_dono5, numero_dono6 } = require("../../configs/nescessario.json");

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
];

// Fix: numero_dono não existe neste arquivo — usar donos
const SoDono = sender => donos.includes(sender);

// --- Sistema Nuke ---
const nukesystempath = './database/antinuke/nuke.json';

if (!fs.existsSync(nukesystempath)) {
    const dir = path.dirname(nukesystempath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
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

const existsNukeGroupSystem = from => {
    return nukeSystem.findIndex(n => n.groupId === from) >= 0;
};

const getNukeGroupSystem = from => {
    const index = nukeSystem.findIndex(n => n.groupId === from);
    return nukeSystem[index];
};

function addNukeGroupSystem(from, sender) {
    if (!existsNukeGroupSystem(from)) {
        nukeSystem.push({
            groupId: from,
            owner: sender,
            permissions: [sender],
            change: {
                member: true,
                mod: true
            }
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
    if (!data) return false;
    return type === 'member' ? data.change.member : data.change.mod;
};

function saveTypeInfoNuke(from, type = 'member') {
    const data = getNukeGroupSystem(from);
    if (!data) return;
    if (type === 'member') {
        data.change.member = !data.change.member;
    } else {
        data.change.mod = !data.change.mod;
    }
    saveNukeSystem();
}

// --- Lógica de Punição ---

async function punirUsuario(kyomi, from, sender, actionType, message) {
    const acao = actionType === 'membro' ? 'adicionar/remover membros' : 'promover/rebaixar admins';
    console.log(`[ANTI-NUKE] Ação de ${acao} não permitida por ${sender} no grupo ${from}. Punição aplicada.`);

    const defaultMessage = `🚨 *ANTI-NUKE SYSTEM* 🚨\n\nO usuário @${sender.split('@')[0]} foi punido por realizar uma ação não permitida.`;
    const aviso = message || defaultMessage;

    try {
        await kyomi.groupParticipantsUpdate(from, [sender], 'demote');
        await kyomi.groupParticipantsUpdate(from, [sender], 'remove');
        await kyomi.sendMessage(from, { text: aviso, mentions: [sender] });
    } catch (error) {
        console.error(`[ANTI-NUKE] Falha ao punir ${sender}:`, error);
        await kyomi.sendMessage(from, { text: `Falha ao aplicar a punição completa em @${sender.split('@')[0]}, mas a ação foi bloqueada.`, mentions: [sender] });
    }
}

async function nukeSystemFunc(kyomi, info, message) {
    if (!info.author || info.author.length === 0) return;

    const from = info.id;
    const sender = info.author;

    // Fix: user.id é string, await é desnecessário e parênteses estavam errados
    const bot = kyomi.user.id.split(':')[0] + '@s.whatsapp.net';

    if (!existsNukeGroupSystem(from)) return;

    const data = getNukeGroupSystem(from);

    if (sender === bot) return;

    if (!SoDono(sender) && !data.permissions.includes(sender)) {
        if (['add', 'remove'].includes(info.action) && data.change.member) {
            await punirUsuario(kyomi, from, sender, 'membro', message);
            return;
        }
        if (['promote', 'demote'].includes(info.action) && data.change.mod) {
            await punirUsuario(kyomi, from, sender, 'admin', message);
            return;
        }
    }
}

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
