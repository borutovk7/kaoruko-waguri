'use strict';
/*
 * ©️ KAORUKO SYSTEM — Todos os direitos reservados
 * Desenvolvido por: Eduh Dev | Paulo Mods
 * Instagram: @paulo_mod_domina
 * Redistribuição ou cópia sem autorização é proibida.
 */

const fs   = require('fs');
const path = require('path');

const VDD_DADOS_FILE    = path.join(__dirname, 'verdade-desafio.json');
const VDD_PARTIDAS_FILE = path.join(__dirname, 'vdd_partidas.json');

function lerDados() {
  try {
    return JSON.parse(fs.readFileSync(VDD_DADOS_FILE, 'utf8'));
  } catch {
    return { verdade: [], desafio: [] };
  }
}

function salvarDados(dados) {
  try {
    fs.writeFileSync(VDD_DADOS_FILE, JSON.stringify(dados, null, 2), 'utf8');
  } catch (err) {
    console.error('[VDD] Erro ao salvar dados:', err);
  }
}

function adicionarItem(tipo, conteudo) {
  tipo = tipo.toLowerCase();
  if (tipo !== 'verdade' && tipo !== 'desafio') return false;
  const dados = lerDados();
  dados[tipo].push(conteudo.trim());
  salvarDados(dados);
  return true;
}

function removerItem(tipo, indice) {
  tipo = tipo.toLowerCase();
  const dados = lerDados();
  if (!dados[tipo] || indice < 0 || indice >= dados[tipo].length) return null;
  const removido = dados[tipo].splice(indice, 1)[0];
  salvarDados(dados);
  return removido;
}

function listarItens(tipo) {
  return lerDados()[tipo.toLowerCase()] || [];
}

function getRandomItem(tipo) {
  const lista = listarItens(tipo);
  if (!lista.length) return null;
  return lista[Math.floor(Math.random() * lista.length)];
}

let vddPartidas = (() => {
  try {
    if (!fs.existsSync(VDD_PARTIDAS_FILE)) return {};
    return JSON.parse(fs.readFileSync(VDD_PARTIDAS_FILE, 'utf8'));
  } catch {
    return {};
  }
})();

function _salvarPartidas() {
  try {
    fs.writeFileSync(VDD_PARTIDAS_FILE, JSON.stringify(vddPartidas, null, 2));
  } catch (err) {
    console.error('[VDD] Erro ao salvar partidas:', err);
  }
}

function getPartida(groupId)   { return vddPartidas[groupId] || null; }
function temPartida(groupId)   { return !!vddPartidas[groupId]; }
function jogadorDaVez(groupId) {
  const p = vddPartidas[groupId];
  if (!p) return null;
  return p.jogadores[p.turnoIndex];
}

function abrirLobby(groupId, hostId) {
  if (vddPartidas[groupId]) return { ok: false, erro: 'jaExiste' };
  vddPartidas[groupId] = {
    hostId,
    jogadores : [hostId],
    turnoIndex: 0,
    aguardando: false,
    status    : 'lobby',
    criadoEm  : Date.now()
  };
  _salvarPartidas();
  return { ok: true };
}

function entrarPartida(groupId, userId) {
  const p = vddPartidas[groupId];
  if (!p)                           return { ok: false, erro: 'semPartida' };
  if (p.jogadores.includes(userId)) return { ok: false, erro: 'jaEsta' };
  p.jogadores.push(userId);
  _salvarPartidas();
  return { ok: true };
}

function iniciarPartida(groupId, hostId) {
  const p = vddPartidas[groupId];
  if (!p)                    return { ok: false, erro: 'semPartida' };
  if (p.hostId !== hostId)   return { ok: false, erro: 'naoEHost' };
  if (p.status === 'playing') return { ok: false, erro: 'jaRodando' };
  if (p.jogadores.length < 3) return { ok: false, erro: 'minimo3' };
  p.status     = 'playing';
  p.turnoIndex = 0;
  _salvarPartidas();
  return { ok: true };
}

function sairPartida(groupId, userId) {
  const p = vddPartidas[groupId];
  if (!p)                            return { ok: false, erro: 'semPartida' };
  if (!p.jogadores.includes(userId)) return { ok: false, erro: 'naoEsta' };
  p.jogadores = p.jogadores.filter(j => j !== userId);
  if (p.turnoIndex >= p.jogadores.length) p.turnoIndex = 0;
  if (p.jogadores.length < 2) {
    delete vddPartidas[groupId];
    _salvarPartidas();
    return { ok: true, encerrou: true };
  }
  _salvarPartidas();
  return { ok: true, encerrou: false };
}

function avancarTurno(groupId) {
  const p = vddPartidas[groupId];
  if (!p) return;
  p.turnoIndex = (p.turnoIndex + 1) % p.jogadores.length;
  p.aguardando = false;
  _salvarPartidas();
}

function setAguardando(groupId, val) {
  const p = vddPartidas[groupId];
  if (!p) return;
  p.aguardando = val;
  _salvarPartidas();
}

function encerrarPartida(groupId) {
  delete vddPartidas[groupId];
  _salvarPartidas();
}

module.exports = {
  lerDados, salvarDados,
  adicionarItem, removerItem, listarItens, getRandomItem,
  getPartida, temPartida, jogadorDaVez,
  abrirLobby, entrarPartida, iniciarPartida,
  sairPartida, avancarTurno, setAguardando, encerrarPartida,
};
