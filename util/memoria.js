/*============================================
   🧠 KAORUKO — MEMÓRIA PERSISTENTE SEGURA
   • Máximo 30 fatos por chave
   • Máximo 500 chaves no arquivo
   • Arquivo nunca passa de ~2MB
   • Cache em memória (sem I/O a cada leitura)
   • Salvamento debounced (não bloqueia)
============================================*/

const fs = require('fs');
const path = require('path');

const MEMORIA_FILE = './database/memoria_kaoruko.json';
const MAX_FATOS    = 30;
const MAX_CHAVES   = 500;
const MAX_FILE_KB  = 1800;
const SAVE_DEBOUNCE_MS = 1500;

/* ─── Cache em memória ──────────────────────────────────────────────────── */
let _cache    = null;
let _cacheMts = 0;

function _carregarDoDisco() {
  try {
    if (!fs.existsSync(MEMORIA_FILE)) return {};
    const mts = fs.statSync(MEMORIA_FILE).mtimeMs;
    /* Só re-lê se o arquivo mudou externamente */
    if (_cache && mts === _cacheMts) return _cache;
    _cache    = JSON.parse(fs.readFileSync(MEMORIA_FILE, 'utf-8'));
    _cacheMts = mts;
    return _cache;
  } catch (e) {
    console.error('[MEMÓRIA] Erro ao carregar:', e.message);
    return _cache ?? {};
  }
}

function carregarMemoria() {
  return _carregarDoDisco();
}

/* ─── Salvamento debounced ──────────────────────────────────────────────── */
let _saveTimer = null;

function salvarMemoria(mem) {
  /* Atualiza cache imediatamente (sem esperar o disco) */
  _cache = mem;

  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    try {
      if (!fs.existsSync('./database'))
        fs.mkdirSync('./database', { recursive: true });

      /* Limite de chaves: remove os mais antigos por timestamp numérico */
      const chaves = Object.keys(mem);
      if (chaves.length > MAX_CHAVES) {
        chaves
          .sort((a, b) => (mem[a]?.ts ?? 0) - (mem[b]?.ts ?? 0))
          .slice(0, chaves.length - MAX_CHAVES)
          .forEach(k => delete mem[k]);
      }

      /* Compressão se arquivo estiver grande demais */
      let json = JSON.stringify(mem, null, 2);
      if (Buffer.byteLength(json, 'utf-8') > MAX_FILE_KB * 1024) {
        Object.keys(mem).forEach(k => {
          if (mem[k].fatos?.length > 10)
            mem[k].fatos = mem[k].fatos.slice(-10);
        });
        json = JSON.stringify(mem, null, 2);
      }

      fs.writeFileSync(MEMORIA_FILE, json);
      _cacheMts = fs.statSync(MEMORIA_FILE).mtimeMs;
    } catch (e) {
      console.error('[MEMÓRIA] Erro ao salvar:', e.message);
    }
  }, SAVE_DEBOUNCE_MS);
}

/* ─── Get ───────────────────────────────────────────────────────────────── */
function getMemoria(chave) {
  return carregarMemoria()[chave] ?? null;
}

/* ─── Set ───────────────────────────────────────────────────────────────── */
function setMemoria(chave, dados) {
  const mem = carregarMemoria();
  mem[chave] = { ...(mem[chave] ?? {}), ...dados, ts: Date.now() };
  salvarMemoria(mem);
}

/* ─── Adiciona fato (sem duplicar) ─────────────────────────────────────── */
function adicionarFato(chave, fato) {
  if (!fato || fato.length < 3) return;
  const mem   = carregarMemoria();
  const atual = mem[chave] ?? {};
  const fatos = atual.fatos ?? [];

  const prefixo = fato.toLowerCase().slice(0, 20);
  if (fatos.some(f => f.toLowerCase().includes(prefixo))) return;

  fatos.push(fato.slice(0, 120));
  if (fatos.length > MAX_FATOS) fatos.shift();

  mem[chave] = { ...atual, fatos, ts: Date.now() };
  salvarMemoria(mem);
}

/* ─── Deleta chave ──────────────────────────────────────────────────────── */
function deletarMemoria(chave) {
  const mem = carregarMemoria();
  delete mem[chave];
  salvarMemoria(mem);
}

/* ─── Formata pra contexto do Gemini ────────────────────────────────────── */
function formatarMemoriaParaContexto(chave, isGroup) {
  const mem = getMemoria(chave);
  if (!mem) return '';

  const linhas = [];
  if (!isGroup) {
    if (mem.nome)    linhas.push(`Nome: ${mem.nome}`);
    if (mem.apelido) linhas.push(`Apelido: ${mem.apelido}`);
    if (mem.humor)   linhas.push(`Humor recente: ${mem.humor}`);
  } else {
    if (mem.nomeGrupo) linhas.push(`Grupo: ${mem.nomeGrupo}`);
  }

  if (mem.fatos?.length)
    linhas.push(`Fatos: ${mem.fatos.slice(-15).join(' | ')}`);

  if (mem.ultimaVez)  linhas.push(`Última conversa: ${mem.ultimaVez}`);
  if (mem.totalMsgs)  linhas.push(`Total msgs: ${mem.totalMsgs}`);

  return linhas.join('\n');
}

module.exports = {
  getMemoria,
  setMemoria,
  adicionarFato,
  deletarMemoria,
  carregarMemoria,
  salvarMemoria,
  formatarMemoriaParaContexto,
};
