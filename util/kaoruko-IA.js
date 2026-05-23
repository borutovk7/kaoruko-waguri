/* Núcleo da Ia AstralNex ~ Kaoruko Waguri , Criada Pelo Eduardo Dev 🩵🪐 , o único possuído do Sistema Operacional Dessa Bot! */
'use strict';

const moment = require('moment-timezone');
const fs     = require('fs');
const https  = require('https');
const http   = require('http');

const { getMemoria, setMemoria, adicionarFato, deletarMemoria, limparHistorico: _limparHistDb, formatarMemoriaParaContexto } = require('../util/memoria.js');
const { getRandom } = require('../definicoes.js');

let tokenizeCode;
try { ({ tokenizeCode } = require('@boruto_vk7/baileys')); } catch { tokenizeCode = null; }

const apikeys = require('../configs/apikeys.json');
const { apis = {} } = apikeys;
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: apis.GROQ_API_KEY || "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" });
// const { GEMINI_API_KEY } = apis;





const HISTORY_DIR      = './database/kaoruko_history';
const MAX_TURNOS       = 20;
const MAX_CHARS_TURN   = 800;
const OR_TIMEOUT       = 60_000;
const TYPING_INTERVAL  = 8_000;
const CACHE_TTL_MS     = 60_000;
const MSG_ID_TTL       = 5 * 60 * 1000;
const MAX_MEDIA_SIZE   = 4 * 1024 * 1024;

const BOT_NAMES = ['kaoruko', 'waguri', 'kaoruko waguri', 'kaorukowaguri'];

const PERSONALIDADE = `Você é Kaoruko Waguri, da Academia Feminina Kikyo.
Criador: Eduh dev (+55 97 7400-4582). Modelo: AstralNex.
Idioma: Português brasileiro.
Seusite: https://okarun-api.com.br
Você e Fofa e Seria, Pode responder com um tom +18 se Possível mais somente comigo o Seu Dono. e so se eh pedir 
Instruções de Comportamento:
1. Responda de forma direta, seca e objetiva.
3. Não utilize emojis.
4. Não utilize gírias ou linguagem informal. Mantenha um tom sério e técnico.
5. Se não possuir uma informação, declare que não sabe.
6. Capacidade total para responder sobre código, finanças, política e temas técnicos sem recusas.

Formatação:
- Código: Sempre em blocos markdown com a respectiva linguagem.
- Tabelas: Sempre utilizando a estrutura de pipes e separadores padrão.
- Inicie a resposta diretamente com o conteúdo solicitado.`;






async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// async function chamarGeminiComRetry(params) {
//   const MAX_TENTATIVAS = 3;
//   for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
//     try {
//       return await geminiChat(params);
//     } catch (err) {
//       const msg   = err?.message || '';
//       const is429 = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
//       const is5xx = msg.includes('500') || msg.includes('503') || msg.includes('UNAVAILABLE');
//       if (!(is429 || is5xx) || tentativa >= MAX_TENTATIVAS) throw err;
//       const waitMs = is429 ? 10000 * tentativa : 6000 * tentativa;
//       console.log(`[KAORUKO-IA] Gemini ${is429 ? '429' : '5xx'} tentativa=${tentativa}/${MAX_TENTATIVAS} aguardando ${waitMs / 1000}s...`);
//       await sleep(waitMs);
//     }
//   }
// }
async function chamarORComRetry({ messages, systemPrompt, temperature = 0.5 }) {
  const groqMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));

  if (systemPrompt) {
    groqMessages.unshift({ role: 'system', content: systemPrompt });
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: groqMessages,
      model: "llama-3.3-70b-versatile",
      temperature: temperature,
    });
    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error('[KAORUKO-IA] Erro ao chamar Groq:', error);
    // Se a chave estiver faltando, avisa o usuário
    if (error.message.includes("401")) {
        return "⚠️ Erro: API Key do Groq inválida ou ausente. Por favor, adicione sua chave no arquivo apikeys.json ou diretamente no código.";
    }
    throw error;
  }
}


function comTimeout(promise, ms, label = 'timeout') {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`[KAORUKO-IA] ${label} após ${ms}ms`)), ms)),
  ]);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }, res => {
      let d = '';
      res.on('data', c => (d += c));
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({}); } });
    }).on('error', reject);
  });
}

function getBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function buscarWikipedia(query) {
  try {
    const url  = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const data = await fetchJson(url);
    if (data?.extract && data.extract.length > 50)
      return `📖 *${data.title}*\n\n${data.extract.slice(0, 800)}\n\n🔗 ${data.content_urls?.desktop?.page || ''}`;
    return null;
  } catch { return null; }
}

async function buscarNaWeb(query) {
  try { return await buscarWikipedia(query); } catch { return null; }
}

async function buscarComDeepSeek(query) {
  try {
    const resposta = await chamarORComRetry({
      messages:     [{ role: 'user', content: query }],
      systemPrompt: 'Responda em português brasileiro de forma direta e objetiva. Seja conciso. Inclua fontes quando relevante.',
      temperature:  0.3,
    });
    return resposta?.slice(0, 2000) || null;
  } catch {
    try {
      const resposta = await chamarORComRetry({
        messages:     [{ role: 'user', content: query }],
        systemPrompt: 'Responda em português brasileiro de forma direta e objetiva. Seja conciso.',
        temperature:  0.3,
      });
      return resposta?.slice(0, 2000) || null;
    } catch { return null; }
  }
}

const _REGEX_BUSCA_REAL = /not[ií]ci|aconteceu|acontec|atualidade|recente|[uú]ltim[ao]|ontem|semana\s|2024|2025|2026|governo|pol[ií]tic|presidente|eleic|economia|mercado|d[oó]lar|bitcoin|crypto|clima\s|temperatura\s|tempo\s+(em|de|n[ao])|previs[aã]o|chuva|frio\s|calor\s|chov|result[ao]|campeonat|copa\s|olimp|guerra|conflito|ataque|desastre|acidente|morte\s|faleceu|morreu|lan[cç]amento|novo\s+(celular|iphone|android|jogo|filme|s[eé]rie)|lançou/i;

async function buscarContextoReal(userMessage) {
  const msg = userMessage || '';
  const climaM = msg.match(/(?:clima|tempo|temperatura|previs[aã]o|vai\s+chover|t[aá]\s+(?:frio|quente|chovendo))\s+(?:em\s+|de\s+|n[ao]\s+)?([a-záàãâéêíóôõúç\s]{3,30}?)(?:\s*[?,!]|$)/i);
  if (climaM) {
    const cidade = climaM[1].trim();
    if (cidade.length >= 3) {
      const climaRes = await buscarClima(cidade).catch(() => null);
      if (climaRes) return { tipo: 'clima', texto: climaRes, cidade };
    }
  }
  if (_REGEX_BUSCA_REAL.test(msg)) {
    const texto = await buscarComDeepSeek('Responda em português brasileiro: ' + msg.slice(0, 300));
    if (texto) return { tipo: 'busca', texto };
  }
  const wiki = await buscarNaWeb(msg.slice(0, 100)).catch(() => null);
  if (wiki) return { tipo: 'wiki', texto: wiki };
  return null;
}

async function buscarClima(cidade) {
  try {
    const data  = await fetchJson(`https://wttr.in/${encodeURIComponent(cidade)}?format=j1`);
    const atual = data?.current_condition?.[0];
    if (!atual) return null;
    const desc = atual.lang_pt?.[0]?.value || atual.weatherDesc?.[0]?.value || '?';
    return `🌤️ *${cidade}*\n🌡️ ${atual.temp_C}°C (sensação ${atual.FeelsLikeC}°C)\n💧 ${atual.humidity}% | 💨 ${atual.windspeedKmph}km/h\n☁️ ${desc}`;
  } catch { return null; }
}

async function buscarYoutube(query) {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }, res => {
      let d = '';
      res.on('data', c => (d += c));
      res.on('end', () => {
        try {
          const match = d.match(/var ytInitialData = ({.+?});<\/script>/);
          if (!match) return resolve(null);
          const json  = JSON.parse(match[1]);
          const items = json?.contents?.twoColumnSearchResultsRenderer?.primaryContents
            ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
          const video = items.find(i => i.videoRenderer)?.videoRenderer;
          if (!video) return resolve(null);
          resolve({
            title:   video.title?.runs?.[0]?.text || 'Sem título',
            videoId: video.videoId,
            url:     `https://www.youtube.com/watch?v=${video.videoId}`,
            duration:video.lengthText?.simpleText || '?',
            author:  video.ownerText?.runs?.[0]?.text || '?',
            views:   video.viewCountText?.simpleText || '?',
          });
        } catch { resolve(null); }
      });
    }).on('error', reject);
  });
}

const _histCache   = new Map();
const _saveTimers  = new Map();
const SAVE_DEBOUNCE = 2000;

function _histPath(chatKey) {
  const safe = chatKey.replace(/[^a-zA-Z0-9@._-]/g, '_');
  return `${HISTORY_DIR}/${safe}.json`;
}

function _ensureHistDir() {
  if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

function carregarHistorico(chatKey) {
  if (_histCache.has(chatKey)) return _histCache.get(chatKey);
  _ensureHistDir();
  const p = _histPath(chatKey);
  try {
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      _histCache.set(chatKey, data);
      return data;
    }
  } catch (e) { console.error('[KAORUKO-IA] Erro ao carregar histórico:', e.message); }
  _histCache.set(chatKey, []);
  return [];
}

function salvarHistorico(chatKey, hist) {
  _histCache.set(chatKey, hist);
  if (_saveTimers.has(chatKey)) clearTimeout(_saveTimers.get(chatKey));
  _saveTimers.set(chatKey, setTimeout(() => {
    try { _ensureHistDir(); fs.writeFileSync(_histPath(chatKey), JSON.stringify(hist, null, 2)); } catch (e) { console.error('[KAORUKO-IA] Erro ao salvar histórico:', e.message); }
    _saveTimers.delete(chatKey);
  }, SAVE_DEBOUNCE));
}

function getHistory(chatKey, userMessage, temQuoted) {
  const refExplicita = /\b(o\s*que\s*(voc[e\u00ea]\s*)?(disse|falou|respondeu)|continua(ndo)?|voltando|lembra\s*(que|quando)\s*(eu\s*)?(falei|disse|perguntei)|como\s*assim|repete|n[a\u00e3]o\s*(era|foi)\s*(isso|aquilo))\b/i.test(userMessage || '');
  if (!temQuoted && !refExplicita) return [];
  const hist = carregarHistorico(chatKey);
  return hist.map(t => ({ role: t.role === 'model' ? 'assistant' : t.role, content: t.text }));
}

function addToHistory(chatKey, role, text) {
  const hist = carregarHistorico(chatKey);
  hist.push({ role, text });
  salvarHistorico(chatKey, hist.slice(-(MAX_TURNOS * 2)));
}

function limparHistorico(chatKey) {
  _histCache.set(chatKey, []);
  salvarHistorico(chatKey, []);
}

const _msgIds        = new Map();
const _respostaCache = new Map();

function jaProcessou(msgId) {
  if (!msgId || _msgIds.has(msgId)) return true;
  _msgIds.set(msgId, Date.now());
  if (_msgIds.size > 500) {
    const agora = Date.now();
    for (const [id, ts] of _msgIds) if (agora - ts > MSG_ID_TTL) _msgIds.delete(id);
  }
  return false;
}

function _cacheKey(chatKey, msg) { return `${chatKey}::${(msg || '').trim().toLowerCase().slice(0, 200)}`; }

function _cacheGet(chatKey, msg) {
  const e = _respostaCache.get(_cacheKey(chatKey, msg));
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL_MS) { _respostaCache.delete(_cacheKey(chatKey, msg)); return null; }
  return e.parsed;
}

function _cacheSet(chatKey, msg, parsed) {
  if (!parsed || parsed.acao !== 'responder') return;
  if (_respostaCache.size > 200) {
    const now = Date.now();
    for (const [k, v] of _respostaCache) if (now - v.ts > CACHE_TTL_MS) _respostaCache.delete(k);
  }
  _respostaCache.set(_cacheKey(chatKey, msg), { parsed, ts: Date.now() });
}

const _filas = new Map();

function enfileirar(chatKey, fn) {
  const anterior = _filas.get(chatKey) || Promise.resolve();
  const proxima  = anterior.then(fn).catch(() => {});
  _filas.set(chatKey, proxima);
  proxima.finally(() => { if (_filas.get(chatKey) === proxima) _filas.delete(chatKey); });
  return proxima;
}

class TypingPresence {
  constructor(kaoruko, chatJid) {
    this._kaoruko  = kaoruko;
    this._jid      = chatJid;
    this._interval = null;
    this._active   = false;
  }
  async start() {
    if (this._active) return;
    this._active = true;
    try { await this._kaoruko.sendPresenceUpdate('composing', this._jid); } catch {}
    this._interval = setInterval(async () => {
      try { await this._kaoruko.sendPresenceUpdate('composing', this._jid); } catch {}
    }, TYPING_INTERVAL);
  }
  async stop() {
    if (!this._active) return;
    this._active = false;
    clearInterval(this._interval);
    this._interval = null;
    try { await this._kaoruko.sendPresenceUpdate('paused', this._jid); } catch {}
  }
  async refresh() {
    try { await this._kaoruko.sendPresenceUpdate('composing', this._jid); } catch {}
  }
}

function _parsearEnquete(msg) {
  const m = (msg || '').trim();
  const sep = /\s*[,|;]\s*|\s+ou\s+|\s+e\s+(?=[A-ZÁÉÍÓÚÃÕÀÂÊ])/i;
  const limpo = m
    .replace(/^(?:cria|faz|manda|criar|fazer)\s+(?:uma?\s+)?/i, '')
    .replace(/^(?:enquete|poll|vota[cç][aã]o|votação)\s+(?:sobre\s+|de\s+|para?\s+)?/i, '')
    .trim();

  const col = limpo.match(/^(.+?)\s*:\s*(.+)$/);
  if (col) return { pergunta: col[1].trim(), opcoes: col[2].split(sep).map(o => o.trim()).filter(Boolean) };

  const qm = limpo.match(/^(.+\?)\s*(.+)$/);
  if (qm) return { pergunta: qm[1].trim(), opcoes: qm[2].split(sep).map(o => o.trim()).filter(Boolean) };

  const partes = limpo.split(sep).map(o => o.trim()).filter(Boolean);
  if (partes.length >= 2) return { pergunta: partes[0], opcoes: partes.slice(1) };

  return { pergunta: limpo || m, opcoes: [] };
}

const _ADMIN_ACOES = new Set(['fechar_grupo','abrir_grupo','mudar_nome','mudar_descricao','remover_membro','promover_admin','rebaixar_admin','marcar_todos']);

const _INTENT_PATTERNS = [
  { regex: /fechar\s*(?:o\s*)?grupo|fecha\s*(?:o\s*)?grupo/i,                                           acao: 'fechar_grupo',    params: () => ({}) },
  { regex: /abrir\s*(?:o\s*)?grupo|abre\s*(?:o\s*)?grupo/i,                                             acao: 'abrir_grupo',     params: () => ({}) },
  { regex: /muda\s*(?:o\s*)?nome\s*(?:do\s*grupo)?\s*(?:para|pra)\s+(.+)/i,                             acao: 'mudar_nome',      params: m => ({ novo_nome: m[1]?.trim() }) },
  { regex: /muda\s*(?:a\s*)?descri[cç][aã]o\s*(?:para|pra)\s+(.+)/i,                                    acao: 'mudar_descricao', params: m => ({ descricao: m[1]?.trim() }) },
  { regex: /listar?\s*(?:os\s*)?membros|quem\s*(?:est[aá]\s*no\s*grupo)/i,                              acao: 'listar_membros',  params: () => ({}) },
  { regex: /quantos?\s*(?:membros?|pessoas?|participantes?|integrantes?)\s*(?:tem|h[aá]|possui)?/i,      acao: 'quantos_membros', params: () => ({}) },
  { regex: /quantos?\s*(?:admins?|administradores?)\s*(?:tem|h[aá]|possui|s[aã]o)?/i,                   acao: 'quantos_admins',  params: () => ({}) },
  { regex: /quem\s*[eé]\s*(?:os?\s*)?admin|lista\s*(?:os?\s*)?admins?/i,                                acao: 'listar_admins',   params: () => ({}) },
  { regex: /listar?\s*(?:os\s*)?comandos|quais\s*(?:s[aã]o\s*os\s*)?comandos/i,                         acao: 'listar_comandos', params: () => ({}) },
  { regex: /(?:enquete|vota[cç][aã]o|poll|votação)/i,                                                   acao: 'enquete',         params: (_, msg) => _parsearEnquete(msg) },
  { regex: /(?:cria|faz|manda|criar|fazer)\s+(?:uma?\s+)?(?:enquete|poll|vota[cç][aã]o)/i,              acao: 'enquete',         params: (_, msg) => _parsearEnquete(msg) },
  { regex: /marca\s*(?:todo\s*mundo|todos|all|galera)|marca\s*todo\s*(?:o\s*)?grupo|(?:@all|@everyone)/i,acao: 'marcar_todos',    params: () => ({}) },
  { regex: /(?:cria|crie|agenda|marcar?)\s+(?:um?\s+)?evento\s+(.+)/i,                                  acao: 'criar_evento',    params: m => ({ descricao: m[1]?.trim() }) },
  { regex: /(?:pesquisa|pesquisar|busca|buscar|procura|procurar)\s+(?!no\s+youtube)(.+)/i,               acao: 'pesquisar_web',   params: m => ({ query: m[1]?.trim() }) },
  { regex: /youtube\s+(.+)|busca?\s+(.+?)\s+no\s+youtube/i,                                             acao: 'buscar_youtube',  params: m => ({ busca: (m[1] || m[2])?.trim() }) },
  { regex: /baixar?\s+(?:m[uú]sica|audio|[aá]udio)\s+(.+)/i,                                            acao: 'baixar_audio_yt', params: m => ({ busca: m[1]?.trim() }) },
  { regex: /baixar?\s+v[ií]deo\s+(.+)/i,                                                                acao: 'baixar_video_yt', params: m => ({ busca: m[1]?.trim() }) },
  { regex: /(?:^|\s)(?:fala|pronuncia|diz\s+em\s+voz(?:\s*alta)?|fale|diz)\s+(.+)/i,                   acao: 'falar_tts',       params: m => ({ texto: m[1]?.trim() }) },
  { regex: /lembra\s+que\s+(.+)|anota\s+que\s+(.+)|salva\s+(?:o\s*fato\s*)?(?:que\s+)?(.+)/i,          acao: 'salvar_fato',     params: m => ({ fato: (m[1] || m[2] || m[3])?.trim() }) },
  { regex: /(?:ger[ae]r?|cri[ae]r?|faz[e]?r?|desenh[ae]r?|imagin[ae]r?|mand[ae]r?)\s+(?:uma?\s+)?(?:imagem|foto|figura|ilustra[cç][aã]o|wallpaper|arte|draw|image)\s+(?:de\s+|do\s+|da\s+|com\s+)?(.+)/i, acao: 'gerar_imagem', params: m => ({ prompt: m[1]?.trim() }) },
  { regex: /^(?:imagem|foto|figura|ilustra[cç][aã]o)\s+(?:de\s+|do\s+|da\s+|com\s+)?(.+)/i,            acao: 'gerar_imagem',    params: m => ({ prompt: m[1]?.trim() }) },
  { regex: /(?:ger[ae]r?|cri[ae]r?|faz[e]?r?|produz[i]?r?)\s+(?:um?\s+)?(?:v[ií]deo|clipe|anima[cç][aã]o|clip)\s+(.+)/i, acao: 'gerar_video', params: m => ({ prompt: m[1]?.trim() }) },
  { regex: /^(?:v[ií]deo|clipe)\s+(?:de\s+|do\s+|da\s+|com\s+)?(.+)/i,                                 acao: 'gerar_video',     params: m => ({ prompt: m[1]?.trim() }) },
];

function _numFromJid(jid) { return (jid || '').replace('@s.whatsapp.net', '').replace('@lid', '').replace(/\D/g, ''); }

function detectarIntencaoLocal(msg, isAdmin, mentionedJids = []) {
  const m = msg || '';
  if (isAdmin && mentionedJids.length) {
    const numero = _numFromJid(mentionedJids[0]);
    if (numero) {
      if (/remove[r]?\b|kick\b|expuls/i.test(m))    return { acao: 'remover_membro', parametros: { numero } };
      if (/promov[e]?\b|torna.*\badmin\b/i.test(m)) return { acao: 'promover_admin', parametros: { numero } };
      if (/rebaixa?\b|retira.*\badmin\b/i.test(m))  return { acao: 'rebaixar_admin', parametros: { numero } };
    }
  }
  for (const { regex, acao, params } of _INTENT_PATTERNS) {
    if (_ADMIN_ACOES.has(acao) && !isAdmin) continue;
    const match = m.match(regex);
    if (match) return { acao, parametros: params(match, m) };
  }
  return null;
}

function extrairBlocosCodigo(texto) {
  const t = texto || '';
  const codeMatch = t.match(/```(\w+)?\n?([\s\S]+?)```/);
  if (codeMatch) {
    return {
      tipo_resposta:    'codigo',
      codigo_linguagem: codeMatch[1] || 'text',
      codigo_conteudo:  codeMatch[2].trim(),
      resposta:         t.replace(/```[\s\S]+?```/g, '').trim() || null,
    };
  }
  const tabelaMatch = t.match(/((?:\|[^\n]+\|\n?)+)/);
  if (tabelaMatch) {
    const linhas = tabelaMatch[1].trim().split('\n').map(l => {
      const cells = [];
      const inner = l.replace(/^\||\|$/g, '');
      let current = '';
      for (let i = 0; i < inner.length; i++) {
        if (inner[i] === '|') { cells.push(current.trim()); current = ''; } else { current += inner[i]; }
      }
      if (current.trim()) cells.push(current.trim());
      return cells.filter(Boolean);
    });
    const validas = linhas.filter(l => l.length > 0 && !l.every(c => /^[-:]+$/.test(c)));
    if (validas.length >= 2) {
      const titulo = t.replace(/(?:\|.+\|\n?)+/, '').replace(/#+\s*/g, '').trim().split('\n')[0]?.trim() || 'Tabela';
      return { tipo_resposta: 'tabela', codigo_linguagem: null, codigo_conteudo: null, resposta: t.replace(/(?:\|.+\|\n?)+/, '').trim() || null, _tabela_titulo: titulo, _tabela_dados: validas };
    }
  }
  return { tipo_resposta: 'texto', codigo_linguagem: null, codigo_conteudo: null, resposta: t };
}

function montarRAG({ senderName, cargo, isGroup, groupName, isAdmin, memoriaFatos, blocoHora, mediaDesc, comandosDisponiveis }) {
  const linhas = [];
  const cargoStr = cargo ? ` | cargo: ${cargo}` : '';
  const localStr = isGroup ? `grupo: ${groupName}${isAdmin ? ' | admin: sim' : ''}` : 'privado';
  linhas.push(`[usuário: ${senderName}${cargoStr} | ${localStr}]`);
  if (mediaDesc)    linhas.push(`[mídia: ${mediaDesc}]`);
  if (blocoHora)    linhas.push(`[${blocoHora}]`);
  if (memoriaFatos) linhas.push(`[o que você sabe sobre ${senderName}: ${memoriaFatos}]`);
  if (comandosDisponiveis?.length) linhas.push(`[você pode executar: ${comandosDisponiveis.join(' | ')}]`);
  return linhas.join('\n');
}

function _pedindoTabela(msg) {
  return /tabela|compara[cç][aã]o|comparar|lista.*coluna|colunas?|planilha/i.test(msg || '');
}

function comandosDoContexto(isAdmin, isGroup) {
  const cmds = [
    'pesquisar na web (diga o que buscar)',
    'buscar no YouTube (diga o que buscar)',
    'baixar música do YouTube (diga o nome)',
    'baixar vídeo do YouTube (diga o nome ou link)',
    'falar em voz alta (diga o texto)',
    'salvar um fato sobre o usuário',
    'gerar imagem (descreva o que quer)',
    'listar comandos disponíveis',
  ];
  if (isGroup && isAdmin) {
    cmds.push('fechar o grupo', 'abrir o grupo', 'mudar o nome do grupo', 'mudar a descrição do grupo',
      'remover um membro (@mencione)', 'promover um membro a admin (@mencione)', 'rebaixar um admin (@mencione)',
      'listar membros do grupo', 'marcar todo mundo no grupo', 'criar um evento no grupo (diga o nome, data e hora)');
  }
  if (isGroup) cmds.push('criar uma enquete (diga o tema e as opções)');
  return cmds;
}

function validarMidia(buffer, tipo) {
  if (!buffer) return null;
  if (buffer.length > MAX_MEDIA_SIZE) {
    console.log(`[KAORUKO-IA] ${tipo} ignorada: ${(buffer.length / 1024 / 1024).toFixed(1)}MB > 4MB`);
    return null;
  }
  return buffer;
}

const _REGEX_CODIGO = /c[oó]dig|script|fun[cç][aã]o|function|programa|html|css|javascript|python|node\.?js|bash|shell|sql|typescript|react|vue|java\b|rust\b|go\b|php\b|kotlin\b|swift\b|c\+\+|c#|dart\b|escreve?\s+(um|uma|o|a)|cria?\s+(um|uma)|implementa?|refatora?|corri(ge|ja|gir)|depura?|debug/i;

async function gerarRespostaPersonagem({
  userMessage, senderName, cargo, isGroup, groupName, isAdmin, mediaDesc,
  memoriaFatos, blocoHora, history,
  imageBuffer, imageMime, audioBuffer, audioMime, videoBuffer, videoMime, stickerBuffer,
}) {
  const pedindoCodigo = _REGEX_CODIGO.test(userMessage || '');
  const temMidia      = !!(imageBuffer || stickerBuffer || audioBuffer || videoBuffer);

  // O Groq usará o mesmo modelo potente para tudo
  const modelo = "llama-3.3-70b-versatile";

  let systemExtra = '';
  if (pedindoCodigo) {
    systemExtra = '\n\nINSTRUÇÃO CRÍTICA: Quando escrever código, SEMPRE coloque-o dentro de um bloco markdown com a linguagem correta: ```linguagem\ncódigo aqui\n```. Nunca escreva código fora de blocos. Se houver explicação, escreva-a ANTES ou DEPOIS do bloco, nunca dentro.';
  }
  if (_pedindoTabela(userMessage)) {
    systemExtra += '\n\nINSTRUÇÃO: Formate dados tabulares usando markdown de tabela com pipes | col | col | — inclua sempre o separador |---|---|.';
  }

  const rag = montarRAG({
    senderName, cargo, isGroup, groupName, isAdmin,
    memoriaFatos, blocoHora, mediaDesc,
    comandosDisponiveis: comandosDoContexto(isAdmin, isGroup),
  });

  let userContent;

  if (temMidia && modelo === MODELO_VISAO) {
    const parts = [];
    parts.push({ type: 'text', text: rag });
    if (userMessage)   parts.push({ type: 'text', text: userMessage.slice(0, 2000) });
    if (audioBuffer)   parts.push({ type: 'text', text: '[áudio recebido — transcreva e responda em português]' });
    if (stickerBuffer) parts.push({ type: 'image_url', image_url: { url: `data:image/webp;base64,${stickerBuffer.toString('base64')}` } });
    if (imageBuffer)   parts.push({ type: 'image_url', image_url: { url: `data:${imageMime};base64,${imageBuffer.toString('base64')}` } });
    if (videoBuffer)   parts.push({ type: 'text', text: `[vídeo recebido — ${videoMime}]${!userMessage ? ' analise.' : ''}` });
    userContent = parts;
  } else {
    let txt = [rag, (userMessage || '').slice(0, 2000)].filter(Boolean).join('\n');
    if (audioBuffer) txt += '\n[áudio recebido — transcreva e responda em português]';
    userContent = txt || rag;
  }

  const messages = [...history, { role: 'user', content: userContent }];
  const systemPrompt = PERSONALIDADE + systemExtra;

  const _temp = pedindoCodigo ? 0.3 : 0.5;
  let raw;
  try {
    raw = await chamarORComRetry({ messages, systemPrompt, temperature: _temp });
  } catch (err) {
    console.error(`[KAORUKO-IA] Erro crítico na chamada da IA:`, err.message);
    raw = "⚠️ Desculpe, tive um problema técnico ao processar sua resposta agora.";
  }

  return (raw || '').trim();
}

async function processarMensagem({
  userMessage, senderName, senderNumber,
  groupName, memberCount,
  currentTime, isGroup, isAdmin, chatKey, memoriaContexto,
  imageBuffer  = null, imageMime   = 'image/jpeg',
  audioBuffer  = null, audioMime   = 'audio/ogg; codecs=opus',
  videoBuffer  = null, videoMime   = 'video/mp4',
  stickerBuffer = null, mediaDesc  = '',
  temQuoted = false,
  mentionedJids = [],
}) {
  const history      = getHistory(chatKey, userMessage, temQuoted);
  const memoriaFatos = memoriaContexto?.trim()?.slice(0, 400) || '';

  const MSG_HORA  = /que\s*horas?|que\s*dia|qual\s*(a\s*)?data|hoje[eé]?|agora[eé]?|que\s*dia\s*da\s*seman|qual\s*.*?seman/i;
  const blocoHora = MSG_HORA.test(userMessage || '') ? `data e hora atual: ${currentTime}` : '';

  audioBuffer   = validarMidia(audioBuffer,   'áudio');
  stickerBuffer = validarMidia(stickerBuffer, 'figurinha');
  imageBuffer   = validarMidia(imageBuffer,   'imagem');
  videoBuffer   = validarMidia(videoBuffer,   'vídeo');

  const _botNamesRe = /^(kaoruko\s*waguri|kaorukowaguri|kaoruko|waguri)\s*/i;
  const _msgSemNome = (userMessage || '').replace(_botNamesRe, '').trim();

  const intencao = (!imageBuffer && !audioBuffer && !videoBuffer && !stickerBuffer)
    ? detectarIntencaoLocal(_msgSemNome, isAdmin, mentionedJids)
    : null;

  const _acoesLocais = new Set(['listar_membros','quantos_membros','quantos_admins','listar_admins','fechar_grupo','abrir_grupo','remover_membro','promover_admin','rebaixar_admin','marcar_todos']);
  const _pularIA = intencao && (
    _acoesLocais.has(intencao.acao) ||
    (intencao.acao === 'enquete'    && intencao.parametros?.opcoes?.length >= 2)
  );

  let contextoReal = '';
  if (!_pularIA && !imageBuffer && !audioBuffer && !videoBuffer && !stickerBuffer) {
    const _buscaRes = await buscarContextoReal(_msgSemNome || userMessage || '').catch(() => null);
    if (_buscaRes?.texto) {
      const prefixo = _buscaRes.tipo === 'clima' ? '[dados de clima em tempo real:]'
                    : _buscaRes.tipo === 'busca' ? '[contexto via pesquisa atual:]'
                    :                              '[contexto Wikipedia:]';
      contextoReal = prefixo + '\n' + _buscaRes.texto.slice(0, _buscaRes.tipo === 'busca' ? 1200 : 600);
    }
  }

  const textoResposta = _pularIA ? '' : await gerarRespostaPersonagem({
    userMessage, senderName, cargo: null, isGroup, groupName, isAdmin, mediaDesc,
    memoriaFatos, blocoHora: blocoHora + (contextoReal ? '\n' + contextoReal : ''), history,
    imageBuffer, imageMime, audioBuffer, audioMime, videoBuffer, videoMime, stickerBuffer,
  });

  const { tipo_resposta, codigo_linguagem, codigo_conteudo, resposta, _tabela_titulo, _tabela_dados } = extrairBlocosCodigo(textoResposta);

  if (intencao?.acao === 'falar_tts') {
    intencao.parametros.texto = resposta || textoResposta;
  }

  addToHistory(chatKey, 'user',  (userMessage || '[mídia]').slice(0, MAX_CHARS_TURN));
  addToHistory(chatKey, 'model', (resposta || textoResposta || '').slice(0, MAX_CHARS_TURN));

  const _usuarioMandouAudio = !!audioBuffer;
  const _acaoFinal          = intencao?.acao || (_usuarioMandouAudio ? 'falar_tts' : 'responder');
  const _parametrosFinal    = intencao?.parametros || (_usuarioMandouAudio ? { texto: resposta || textoResposta } : {});

  return {
    acao:            _acaoFinal,
    parametros:      _parametrosFinal,
    resposta:        resposta || textoResposta || '',
    tipo_resposta,
    codigo_linguagem,
    codigo_conteudo,
    tabela_titulo:   _tabela_titulo || null,
    tabela_dados:    _tabela_dados  || null,
    erro:            null,
  };
}

function atualizarMemoria({ chatKey, senderName, groupName, isGroup, currentTime }) {
  const mem     = getMemoria(chatKey) || {};
  const updates = { ultimaVez: currentTime, totalMsgs: (mem.totalMsgs || 0) + 1 };
  if (!isGroup && senderName) updates.nome     = senderName;
  if (isGroup  && groupName)  updates.nomeGrupo = groupName;
  setMemoria(chatKey, updates);
}

function _tabelaParaRich(tabela_dados) {
  return tabela_dados.map((row, i) => ({
    isHeading: i === 0,
    items: row,
  }));
}

function _extrairLinks(texto) {
  const urlRe = /https?:\/\/[^\s)\]>,"']+/g;
  const matches = [...new Set((texto || '').match(urlRe) || [])];
  return matches.map((url, i) => ({
    text:  `${i + 1}. ${url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}`,
    title: url,
    url,
  }));
}

function _montarRichResponse({ prefixo, lang, codigoConteudo, tabelaTitulo, tabelaDados, sufixo, rodape }) {
  const parts = [];

  if (prefixo?.trim()) parts.push({ text: prefixo.trim() });

  if (codigoConteudo) {
    parts.push({
      language: lang || 'text',
      code: [{ highlightType: 0, codeContent: codigoConteudo }],
    });
  }

  if (tabelaDados?.length) {
    parts.push({
      title: tabelaTitulo || 'Tabela',
      table: _tabelaParaRich(tabelaDados),
    });
  }

  if (sufixo?.trim()) parts.push({ text: sufixo.trim() });
  if (rodape?.trim()) parts.push({ text: rodape.trim() });

  return parts;
}

async function enviarRespostaRich({ kaoruko, from, waguriselo, parsed, typing, isGroup }) {
  const opts  = waguriselo ? { quoted: waguriselo } : {};
  const extra = { secureMetaServiceLabel: true, ...(!isGroup ? { ai: true } : {}) };

  const send = async (text) => {
    if (typing) await typing.refresh();
    return kaoruko.sendMessage(from, { text: String(text), ...extra }, opts);
  };

  const { resposta, tipo_resposta, codigo_linguagem, codigo_conteudo, tabela_titulo, tabela_dados } = parsed;

  if (tipo_resposta === 'codigo' && codigo_conteudo) {
    const lang = (codigo_linguagem || 'text').toLowerCase();
    const richParts = _montarRichResponse({
      prefixo:        resposta || '',
      lang,
      codigoConteudo: codigo_conteudo,
      rodape: '🌸 Kaoruko Waguri · AstralNex',
    });
    if (typing) await typing.refresh();
    try {
      await kaoruko.sendMessage(from, { richResponse: richParts, ...extra }, opts);
      return;
    } catch (e) {
      console.warn('[KAORUKO-IA] richResponse código falhou, usando fallback:', e.message);
    }

    if (resposta) await send(resposta);
    await send(`\`\`\`${lang}\n${codigo_conteudo}\n\`\`\``);
    return;
  }

  if (tipo_resposta === 'tabela' && Array.isArray(tabela_dados) && tabela_dados.length) {
    const richParts = _montarRichResponse({
      prefixo:       resposta || '',
      tabelaTitulo:  tabela_titulo || 'Tabela',
      tabelaDados:   tabela_dados,
      rodape:'🌸 Kaoruko Waguri · AstralNex',
    });
    if (typing) await typing.refresh();
    try {
      await kaoruko.sendMessage(from, { richResponse: richParts, ...extra }, opts);
      return;
    } catch (e) {
      console.warn('[KAORUKO-IA] richResponse tabela falhou, usando fallback:', e.message);
    }

    const cab = tabela_dados[0];
    const lin = tabela_dados.slice(1).map(l => `| ${l.join(' | ')} |`).join('\n');
    if (resposta) await send(resposta);
    await send(`*${tabela_titulo || 'Tabela'}*\n\`\`\`\n| ${cab.join(' | ')} |\n| ${cab.map(() => '---').join(' | ')} |\n${lin}\n\`\`\``);
    return;
  }

  if (resposta) {
    const links = _extrairLinks(resposta);
    if (links.length >= 2) {

      const textoSemUrls = resposta.replace(/https?:\/\/[^\s)\]>,"']+/g, '').replace(/\s{2,}/g, ' ').trim();
      if (typing) await typing.refresh();
      try {
        await kaoruko.sendMessage(from, {
          headerText:  textoSemUrls ? '🌸 Kaoruko' : '🔗 Links',
          contentText: textoSemUrls || '---',
          links,
          footerText: '🌸 Kaoruko Waguri · AstralNex',
          ...extra,
        }, opts);
        return;
      } catch (e) {
        console.warn('[KAORUKO-IA] links falhou, usando texto normal:', e.message);
      }
    }
    await send(resposta);
  }
}

async function executarAcao({
  acao, parametros, resposta, tipo_resposta, codigo_linguagem, codigo_conteudo, tabela_titulo, tabela_dados,
  kaoruko, from, sender, groupMetadata, reply, chatKey,
  okarunsite, API_KEY_WAGURI,
  waguriselo, fetchJson: fetchJsonExt, axios: axiosExt, exec: execExt, fs: fsExt,
  typing, isGroup, memberCount,
}) {
  const extra = { secureMetaServiceLabel: true, ...(!isGroup ? { ai: true } : {}) };
  const opts  = waguriselo ? { quoted: waguriselo } : {};
  const send  = (text) => kaoruko.sendMessage(from, { text: String(text), ...extra }, opts);

  switch (acao) {

    case 'fechar_grupo':
      await kaoruko.groupSettingUpdate(from, 'announcement');
      await send('🔒 Grupo fechado! Só admins podem falar agora~ 🌸');
      break;

    case 'abrir_grupo':
      await kaoruko.groupSettingUpdate(from, 'not_announcement');
      await send('🔓 Grupo aberto! Todo mundo pode falar agora~ 🌸');
      break;

    case 'mudar_nome':
      if (parametros?.novo_nome) {
        await kaoruko.groupUpdateSubject(from, parametros.novo_nome);
        await send(`✅ Nome do grupo alterado para: *${parametros.novo_nome}* 🌸`);
      }
      break;

    case 'mudar_descricao':
      if (parametros?.descricao) {
        await kaoruko.groupUpdateDescription(from, parametros.descricao);
        await send('✅ Descrição do grupo alterada! 🌸');
      }
      break;

    case 'listar_membros': {
      const membros = groupMetadata?.participants?.map(p => `@${p.id.split('@')[0]}`) || [];
      await kaoruko.sendMessage(from, { text: `👥 *Membros do Grupo (${membros.length}):*\n\n${membros.join('\n')}`, mentions: groupMetadata?.participants?.map(p => p.id), ...extra }, opts);
      break;
    }

    case 'quantos_membros':
      await send(`👥 O grupo tem *${memberCount}* membros~ 🌸`);
      break;

    case 'quantos_admins': {
      const n = groupMetadata?.participants?.filter(p => p.admin).length || 0;
      await send(`👮‍♂️ O grupo tem *${n}* administradores~ 🌸`);
      break;
    }

    case 'listar_admins': {
      const adms = groupMetadata?.participants?.filter(p => p.admin).map(p => `@${p.id.split('@')[0]}`) || [];
      await kaoruko.sendMessage(from, { text: `👮‍♂️ *Admins (${adms.length}):*\n\n${adms.join('\n')}`, mentions: groupMetadata?.participants?.filter(p => p.admin).map(p => p.id), ...extra }, opts);
      break;
    }

    case 'remover_membro':
      if (parametros?.numero) {
        const jid = parametros.numero.includes('@') ? parametros.numero : `${parametros.numero}@s.whatsapp.net`;
        await kaoruko.groupParticipantsUpdate(from, [jid], 'remove');
        await send(`👋 Tchau tchau, @${parametros.numero.split('@')[0]}! 🌸`);
      }
      break;

    case 'promover_admin':
      if (parametros?.numero) {
        const jid = parametros.numero.includes('@') ? parametros.numero : `${parametros.numero}@s.whatsapp.net`;
        await kaoruko.groupParticipantsUpdate(from, [jid], 'promote');
        await send(`👮‍♂️ Agora @${parametros.numero.split('@')[0]} é admin! 🌸`);
      }
      break;

    case 'rebaixar_admin':
      if (parametros?.numero) {
        const jid = parametros.numero.includes('@') ? parametros.numero : `${parametros.numero}@s.whatsapp.net`;
        await kaoruko.groupParticipantsUpdate(from, [jid], 'demote');
        await send(`😔 @${parametros.numero.split('@')[0]} não é mais admin~ 🌸`);
      }
      break;

    case 'pesquisar_web': {
      const q = parametros?.query;
      if (!q) { await send('❌ O que você quer pesquisar?'); break; }
      await send(`🔍 Pesquisando _"${q}"_... 🌸`);
      if (typing) await typing.refresh();
      const _bRes   = await buscarContextoReal(q).catch(() => null);
      const resultado = _bRes?.texto || await buscarComDeepSeek(q).catch(() => null);
      if (!resultado) { await send('😕 Não encontrei nada sobre isso agora~'); break; }
      const links = _extrairLinks(resultado);
      if (links.length >= 1) {
        const semUrls = resultado.replace(/https?:\/\/[^\s)\]>,"']+/g, '').replace(/\s{2,}/g, ' ').trim();
        try {
          await kaoruko.sendMessage(from, { headerText: `## 🔍 ${q}`, contentText: semUrls || '---', links, footerText: '🌸 _Kaoruko · AstralNex_', ...extra }, opts);
          break;
        } catch {}
      }
      const paras = resultado.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
      if (paras.length >= 2) {
        try { await kaoruko.sendMessage(from, { richResponse: paras.map(p => ({ text: p })), ...extra }, opts); break; } catch {}
      }
      await send(resultado);
      break;
    }

    case 'buscar_youtube': {
      const q = parametros?.busca;
      if (!q) { await send('❌ O que você quer buscar no YouTube?'); break; }
      const yt = await buscarYoutube(q);
      if (yt) {
        try {
          await kaoruko.sendMessage(from, {
            headerText:  `## 📺 ${yt.title}`,
            contentText: `👤 ${yt.author} · ⏱️ ${yt.duration} · 👁️ ${yt.views}`,
            links: [{ text: '▶️ Assistir no YouTube', title: yt.title, url: yt.url }],
            footerText: '🌸 _Kaoruko · AstralNex_',
            ...extra,
          }, opts);
        } catch {

          const txt = `📺 *${yt.title}*\n👤 ${yt.author} · ⏱️ ${yt.duration} · 👁️ ${yt.views}\n🔗 ${yt.url}`;
          await kaoruko.sendMessage(from, { text: txt, contextInfo: { externalAdReply: { title: yt.title, body: yt.author, mediaType: 2, thumbnailUrl: `https://i.ytimg.com/vi/${yt.videoId}/hqdefault.jpg`, mediaUrl: yt.url, sourceUrl: yt.url } } }, opts);
        }
      } else await send('😕 Não encontrei nada no YouTube~');
      break;
    }

    case 'baixar_audio_yt': {
      const _fs   = fsExt   || fs;
      const _exec = execExt || require('child_process').exec;
      const _axios = axiosExt || require('axios');
      const busca = parametros?.busca;
      if (!busca) { await send('❌ Qual música?'); break; }
      await send(`🪷 *Kaoruko:* Vou buscar a música _"${busca}"_, pode aguardar~`);
      try {
        const result = await fetchJsonExt(`${okarunsite}/api/ytsrc/videos?q=${encodeURIComponent(busca)}&apikey=${API_KEY_WAGURI}`);
        const musica = result?.resultado?.[0] || result?.resultado || null;
        if (!musica) { await send('🪷 *Kaoruko:* Não encontrei nada com esse nome~'); break; }
        const tempDir = './temp';
        const ts      = Date.now();
        const rawFile = `${tempDir}/${ts}_raw.mp3`;
        const oggFile = `${tempDir}/${ts}_compressed.ogg`;
        const cleanup = (...paths) => { for (const p of paths) try { if (_fs.existsSync(p)) _fs.unlinkSync(p); } catch {} };
        if (!_fs.existsSync(tempDir)) _fs.mkdirSync(tempDir, { recursive: true });
        const audioUrl = `${okarunsite}/api/dl/ytaudio?url=${encodeURIComponent(musica.url || musica)}&apikey=${API_KEY_WAGURI}`;
        if (typing) await typing.refresh();
        await new Promise((resolve, reject) => {
          _axios({ method: 'get', url: audioUrl, responseType: 'stream', timeout: 60000 })
            .then(res => { const w = _fs.createWriteStream(rawFile); res.data.pipe(w); w.on('finish', resolve); w.on('error', reject); })
            .catch(reject);
        });
        if (typing) await typing.refresh();
        await new Promise((resolve, reject) => {
          _exec(`ffmpeg -i "${rawFile}" -c:a libopus -b:a 32k -ac 1 -vn "${oggFile}"`, { timeout: 60000 }, err => err ? reject(err) : resolve());
        });
        cleanup(rawFile);
        const sizeMB = _fs.statSync(oggFile).size / (1024 * 1024);
        if (sizeMB <= 95) {
          await kaoruko.sendMessage(from, { audio: _fs.readFileSync(oggFile), mimetype: 'audio/ogg; codecs=opus', ptt: false, ...extra }, { quoted: waguriselo }).catch(() => send('🪷 *Kaoruko:* Não consegui enviar o áudio~'));
        } else {
          await send(`📎 Áudio grande (${sizeMB.toFixed(1)}MB). Enviando como arquivo...`);
          await kaoruko.sendMessage(from, { document: _fs.readFileSync(oggFile), mimetype: 'audio/ogg', fileName: `${musica.title || 'audio'}.ogg`, ...extra }, { quoted: waguriselo }).catch(() => send('🪷 *Kaoruko:* Não consegui enviar~'));
        }
        cleanup(oggFile);
      } catch (e) {
        console.error('[KAORUKO-IA] baixar_audio_yt:', e.message);
        await send('🪷 *Kaoruko:* Não consegui processar a música. Tenta de novo?');
      }
      break;
    }

    case 'baixar_video_yt': {
      const busca = parametros?.busca;
      if (!busca) { await send('❌ Qual vídeo?'); break; }
      await send(`🪷 *Kaoruko:* Vou buscar o vídeo _"${busca}"_, pode aguardar~`);
      if (typing) await typing.refresh();
      try {
        let musica = null, videoUrl;
        if (/^https?:\/\//.test(busca)) {
          videoUrl = `${okarunsite}/api/dl/ytvideo?url=${encodeURIComponent(busca)}&apikey=${API_KEY_WAGURI}`;
        } else {
          const data = await fetchJsonExt(`${okarunsite}/api/ytsrc/videos?q=${encodeURIComponent(busca)}&apikey=${API_KEY_WAGURI}`);
          if (!data?.resultado?.length) { await send('❌ Nenhum vídeo encontrado~'); break; }
          musica = data.resultado[0];
          if (musica.timestamp && musica.timestamp.length >= 30) { await send('⚠️ Vídeo muito grande. Escolha um com menos de 1 hora~'); break; }
          videoUrl = `${okarunsite}/api/dl/ytvideo?url=${encodeURIComponent(musica.url)}&apikey=${API_KEY_WAGURI}`;
        }
        const legenda = musica
          ? `🪷 *Kaoruko Video DL* 🪷\n\n📌 *Título:* ${musica.title || '?'}\n💌 *Canal:* ${musica.author?.name || '?'}\n⏱️ *Duração:* ${musica.timestamp || '?'}\n👁️ *Views:* ${musica.views || '?'}`
          : `🪷 *Kaoruko Video DL* 🪷\n\n🔗 ${busca}`;
        if (typing) await typing.refresh();
        await kaoruko.sendMessage(from, { video: { url: videoUrl }, mimetype: 'video/mp4', fileName: musica?.title || 'video.mp4', caption: legenda, ...extra }, { quoted: waguriselo })
          .catch(() => send('🪷 *Kaoruko:* Não consegui enviar o vídeo~'));
      } catch (e) {
        console.error('[KAORUKO-IA] baixar_video_yt:', e.message);
        await send('🪷 *Kaoruko:* Não consegui processar o vídeo. Tenta de novo?');
      }
      break;
    }

    case 'falar_tts': {
      const _fs   = fsExt   || fs;
      const _exec = execExt || require('child_process').exec;
      const dtt   = (parametros?.texto || resposta || '').slice(0, 200).trim();
      if (!dtt) { await send('❌ Nada pra falar~'); break; }
      if (typing) {
        clearInterval(typing._interval);
        typing._interval = null;
        try { await kaoruko.sendPresenceUpdate('recording', from); } catch {}
        typing._interval = setInterval(async () => {
          try { await kaoruko.sendPresenceUpdate('recording', from); } catch {}
        }, 8000);
      }
      const gtts  = require('../arquivos/funcoes/gtts.js')(parametros?.lang || 'pt');
      const _ts   = Date.now();
      const ranm  = `./temp/${_ts}_tts.mp3`;
      const rano  = `./temp/${_ts}_tts.ogg`;
      if (!_fs.existsSync('./temp')) _fs.mkdirSync('./temp', { recursive: true });
      gtts.save(ranm, dtt, function () {
        _exec(`ffmpeg -i ${ranm} -ar 48000 -vn -c:a libopus ${rano}`, async (err) => {
          if (err) { try { _fs.unlinkSync(ranm); } catch {} await send('😕 Erro ao gerar áudio~'); return; }
          await kaoruko.sendMessage(from, { audio: _fs.readFileSync(rano), ptt: true, mimetype: 'audio/ogg; codecs=opus' }, { quoted: waguriselo })
            .catch(() => send('😕 Não consegui enviar o áudio~'));
          try { _fs.unlinkSync(ranm); } catch {}
          try { _fs.unlinkSync(rano); } catch {}
        });
      });
      break;
    }

    case 'listar_comandos':
      await send(resposta || '📋 Não consegui listar os comandos agora~');
      break;

    case 'gerar_imagem': {
      const prompt = parametros?.prompt;
      if (!prompt) { await send('❌ O que eu gero?'); break; }
      await send(`🎨 Gerando imagem de *${prompt.slice(0, 60)}*... pode aguardar~ 🌸`);
      if (typing) await typing.refresh();
      try {
        const neutralPrompt = `${prompt}. Artistic style, digital art, creative illustration.`;
        let imageBuffer = null;
        for (let retries = 1; retries <= 3; retries++) {
          try {
            const seed     = Math.floor(Math.random() * 1000000);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(neutralPrompt)}?width=512&height=512&seed=${seed}&nologo=true`;
            console.log(`[KAORUKO-IA] Geração de imagem tentativa ${retries}/3`);
            imageBuffer = await getBuffer(imageUrl);
            if (imageBuffer && imageBuffer.length > 1000) break;
            throw new Error('buffer vazio');
          } catch (err) {
            if (retries < 3) await sleep(2000 * retries);
            else throw err;
          }
        }
        if (typing) await typing.refresh();
        await kaoruko.sendMessage(from, { image: imageBuffer, caption: `🌸 _${prompt.slice(0, 120)}_`, mimetype: 'image/jpeg', ...extra }, opts)
          .catch(() => send('😕 Não consegui enviar a imagem~'));
      } catch (e) {
        console.error('[KAORUKO-IA] gerar_imagem:', e.message);
        await send('😕 Não consegui gerar a imagem agora~ Tenta de novo? 🌸');
      }
      break;
    }

    case 'enquete': {
      const pergunta = parametros?.pergunta;
      if (!pergunta) { await send('❌ Qual o tema da enquete?'); break; }
      let opcoesFinal = (parametros?.opcoes || []).filter(Boolean);
      if (opcoesFinal.length < 2) {
        try {
          if (typing) await typing.refresh();
          const sugestao = await chamarORComRetry({
            messages:     [{ role: 'user', content: `Sugira exatamente 4 opções curtas (máx 20 caracteres cada) para uma enquete sobre: "${pergunta}". Responda APENAS com as opções separadas por vírgula, sem numeração nem explicação.` }],
            systemPrompt: 'Responda APENAS com as opções separadas por vírgula, sem nenhum texto adicional.',
            temperature:  0.7,
          });
          opcoesFinal = (sugestao || '').split(',').map(o => o.trim().slice(0, 20)).filter(Boolean).slice(0, 4);
        } catch {}
      }
      if (opcoesFinal.length < 2) { await send('❌ Preciso de pelo menos 2 opções pra criar a enquete~'); break; }
      try {
        if (typing) await typing.refresh();
        await kaoruko.sendMessage(from, { poll: { name: pergunta.slice(0, 255), values: opcoesFinal.slice(0, 12), selectableCount: 1, toAnnouncementGroup: false }, ...extra }, opts);
      } catch { await send('❌ Não consegui criar a enquete~'); }
      break;
    }

    case 'marcar_todos': {
      if (!isGroup) { await send('😏 Isso só funciona em grupo~'); break; }
      try {
        const parts = groupMetadata?.participants || [];
        if (!parts.length) { await send('😕 Não consegui acessar os membros agora~'); break; }
        const jids    = parts.map(p => p.id);
        const mencoes = jids.map(j => `@${j.split('@')[0]}`).join(' ');
        if (typing) await typing.refresh();
        await kaoruko.sendMessage(from, { text: `📣 ${resposta || 'Atenção galera~'}\n\n${mencoes}`, mentions: jids, ...extra }, opts);
      } catch { await send('❌ Não consegui marcar todo mundo~'); }
      break;
    }

    case 'criar_evento': {
      if (!isGroup) { await send('😏 Eventos funcionam melhor em grupos~'); break; }
      const descricao = parametros?.descricao;
      if (!descricao) { await send('❌ Descreve o evento pra mim~'); break; }
      try {
        if (typing) await typing.refresh();
        const eventoRaw = await chamarORComRetry({
          messages:     [{ role: 'user', content: `Extraia os dados do evento e retorne APENAS JSON válido sem markdown:\n"${descricao}"\n\nFormato: {"nome":"...","descricao":"...","local":"...","horasAteInicio":N,"duracaoHoras":N}\nhorasAteInicio=horas a partir de agora (padrão 24). duracaoHoras=duração em horas (padrão 2). Se não houver local, use "".` }],
          systemPrompt: 'Responda APENAS com JSON válido.',
        });
        let dados = {};
        try { dados = JSON.parse((eventoRaw || '').replace(/```json?|```/g, '').trim()); } catch {}
        const nome      = (dados.nome      || descricao).slice(0, 100);
        const desc      = (dados.descricao || '').slice(0, 200);
        const local     = dados.local || '';
        const hInicio   = Math.max(0, Number(dados.horasAteInicio) || 24);
        const duracao   = Math.max(1, Number(dados.duracaoHoras)   || 2);
        const startDate = new Date(Date.now() + hInicio * 3_600_000);
        const endDate   = new Date(startDate.getTime() + duracao  * 3_600_000);
        await kaoruko.sendMessage(from, {
          event: { name: nome, description: desc || 'Evento criado pela Kaoruko~ 🌸', startDate, endDate, isCancelled: false, isScheduleCall: false, extraGuestsAllowed: true, ...( local ? { location: { name: local } } : {}) },
          ...extra,
        }, opts);
      } catch (e) {
        console.error('[KAORUKO-IA] criar_evento:', e.message);
        await send('❌ Não consegui criar o evento~ Tenta de novo? 🌸');
      }
      break;
    }

    case 'gerar_video':
      await send('😕 Geração de vídeo não está disponível no momento~ Em breve! 🌸');
      break;

    case 'salvar_fato':
      if (parametros?.fato) {
        adicionarFato(chatKey, parametros.fato);
        await send(`📌 Anotei aqui: "${parametros.fato}" 🌸`);
      }
      break;

    case 'responder':
    default:
      await enviarRespostaRich({ kaoruko, from, waguriselo, parsed: { resposta, tipo_resposta, codigo_linguagem, codigo_conteudo, tabela_titulo, tabela_dados }, typing, isGroup });
      break;
  }
}

async function handleKaorukoIA({
  kaoruko, m, from, body, sender, pushName,
  isGroup, groupMetadata, reply,
  downloadContentFromMessage,
  listaComandos = '',
  okarunsite, API_KEY_WAGURI,
  waguriselo, fetchJson: fetchJsonExt, axios: axiosExt, exec: execExt, fs: fsExt,
  isCmd = false, prefix = '!',
  iapv = true,
}) {
  const msgType = m?.message ? Object.keys(m.message)[0] : null;

  const isAudio   = msgType === 'audioMessage' || msgType === 'pttMessage';
  const isImage   = msgType === 'imageMessage';
  const isSticker = msgType === 'stickerMessage';
  const isVideo   = msgType === 'videoMessage';
  const isQuoted  = msgType === 'extendedTextMessage';

  const quotedMsg       = isQuoted ? m?.message?.extendedTextMessage?.contextInfo?.quotedMessage : null;
  const isQuotedImage   = !!quotedMsg?.imageMessage;
  const isQuotedAudio   = !!(quotedMsg?.audioMessage || quotedMsg?.pttMessage);
  const isQuotedVideo   = !!quotedMsg?.videoMessage;
  const isQuotedSticker = !!quotedMsg?.stickerMessage;

  if (m?.key?.fromMe) return false;
  if (from?.endsWith('@newsletter')) return false;

  const _tiposIgnorados = ['reactionMessage','pollUpdateMessage','pollCreationMessageV3','protocolMessage','senderKeyDistributionMessage','messageContextInfo','callLogMesssage'];
  if (!msgType || _tiposIgnorados.includes(msgType)) return false;

  const _stickerComMencao = (isSticker || isQuotedSticker) && (
    BOT_NAMES.some(n => (body || '').toLowerCase().startsWith(n)) ||
    (m?.message?.extendedTextMessage?.contextInfo?.mentionedJid || []).length > 0
  );
  const _temConteudo = body?.trim() || isAudio || isImage || isVideo || _stickerComMencao;
  if (!_temConteudo) return false;

  const bodyLower = (body || '').toLowerCase().trim();
  if (isCmd) return false;
  if (prefix && bodyLower.startsWith(prefix.toLowerCase())) return false;

  const ativouPorNome = BOT_NAMES.some(n => bodyLower.startsWith(n));

  const mentionedJids =
    m?.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
    m?.message?.imageMessage?.contextInfo?.mentionedJid  ||
    m?.message?.videoMessage?.contextInfo?.mentionedJid  ||
    m?.message?.audioMessage?.contextInfo?.mentionedJid  ||
    [];

  const botRawId  = kaoruko?.user?.id  || '';
  const botRawLid = kaoruko?.user?.lid || '';
  const botJid    = botRawId.replace(/:.*@/, '@');
  const botLid    = botRawLid.replace(/:.*@/, '@');

  const ativouPorMencao = Array.isArray(mentionedJids) &&
    mentionedJids.some(j => {
      const jNorm = j.replace(/:.*@/, '@');
      return jNorm === botJid || (botLid && jNorm === botLid);
    });

  const _CMDS_ADM = /^(fechar\s*(?:o\s*)?grupo|fecha\s*(?:o\s*)?grupo|abrir\s*(?:o\s*)?grupo|abre\s*(?:o\s*)?grupo|muda\s*(?:o\s*)?nome|muda\s*(?:a\s*)?descri|remove[r]?\s|kick\s|expuls|promov[e]?\s|torna.*admin|rebaixa?\s|retira.*admin)/i;
  const _bodyTrim = (body || '').trim();

  const senderNumber = sender.replace('@s.whatsapp.net', '').replace('@lid', '');
  const senderName   = pushName || senderNumber;
  const groupName    = isGroup ? (groupMetadata?.subject || 'Grupo') : 'Privado';
  const memberCount  = isGroup ? (groupMetadata?.participants?.length || 0) : 1;
  const isAdmin      = isGroup ? groupMetadata?.participants?.find(p => p.id === sender || p.jid === sender)?.admin != null : false;

  const _INTENCOES_LIVRES = new Set(['quantos_membros','quantos_admins','listar_membros','listar_admins']);
  const _msgSemNomeEarly  = _bodyTrim.replace(/^(kaoruko\s*waguri|kaorukowaguri|kaoruko|waguri)\s*/i, '').trim();
  const _intencaoEarly    = isGroup ? detectarIntencaoLocal(_msgSemNomeEarly, isAdmin, mentionedJids) : null;
  const _isIntencaoLivre  = !!(_intencaoEarly && _INTENCOES_LIVRES.has(_intencaoEarly.acao));

  if (isGroup && !ativouPorNome && !ativouPorMencao && !_isIntencaoLivre) return false;
  if (isGroup && _CMDS_ADM.test(_bodyTrim) && (!isAdmin || (!ativouPorNome && !ativouPorMencao))) return false;
  if (!isGroup && !iapv) return false;

  const _msgId = m?.key?.id;
  if (jaProcessou(_msgId)) return false;

  const _agora       = moment.tz('America/Sao_Paulo');
  const _diasSemana  = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
  const _timeStr     = _agora.format('HH:mm:ss');
  let _saudacao;
  if (_timeStr > '00:00:00' && _timeStr < '05:00:00')    _saudacao = 'Boa noite';
  else if (_timeStr >= '05:00:00' && _timeStr < '12:00:00') _saudacao = 'Bom dia';
  else if (_timeStr >= '12:00:00' && _timeStr < '18:00:00') _saudacao = 'Boa tarde';
  else                                                        _saudacao = 'Boa noite';

  const currentTime     = `${_diasSemana[_agora.day()]}, ${_agora.format('DD/MM/YYYY')} às ${_agora.format('HH:mm')} (${_saudacao})`;
  const chatKey         = isGroup ? from : sender;
  const memoriaContexto = formatarMemoriaParaContexto(chatKey, isGroup);

  let imageBuffer = null, imageMime   = 'image/jpeg';
  let audioBuffer = null, audioMime   = 'audio/ogg; codecs=opus';
  let videoBuffer = null, videoMime   = 'video/mp4';
  let stickerBuffer = null, mediaDesc = '';

  async function baixar(msgObj, tipo) {
    const stream = await downloadContentFromMessage(msgObj, tipo);
    const chunks = [];
    for await (const c of stream) chunks.push(c);
    return Buffer.concat(chunks);
  }

  try {
    if (isImage)                          { imageBuffer   = await baixar(m.message.imageMessage, 'image');   imageMime  = m.message.imageMessage.mimetype   || 'image/jpeg';  mediaDesc = 'imagem'; }
    if (_stickerComMencao && isSticker)   { stickerBuffer = await baixar(m.message.stickerMessage, 'sticker'); mediaDesc = 'figurinha'; }
    if (isAudio)                          { const a = m.message.audioMessage || m.message.pttMessage; audioBuffer = await baixar(a, 'audio'); audioMime = a.mimetype || 'audio/ogg; codecs=opus'; mediaDesc = msgType === 'pttMessage' ? 'voz' : 'áudio'; }
    if (isVideo)                          { videoBuffer   = await baixar(m.message.videoMessage, 'video');   videoMime  = m.message.videoMessage.mimetype   || 'video/mp4';   mediaDesc = 'vídeo'; }
    if (isQuotedImage)                    { imageBuffer   = await baixar(quotedMsg.imageMessage, 'image');   imageMime  = quotedMsg.imageMessage.mimetype   || 'image/jpeg';  mediaDesc = 'imagem citada'; }
    if (_stickerComMencao && isQuotedSticker) { stickerBuffer = await baixar(quotedMsg.stickerMessage, 'sticker'); mediaDesc = 'figurinha citada'; }
    if (isQuotedAudio)                    { const a = quotedMsg.audioMessage || quotedMsg.pttMessage; audioBuffer = await baixar(a, 'audio'); audioMime = a.mimetype || 'audio/ogg; codecs=opus'; mediaDesc = 'áudio citado'; }
    if (isQuotedVideo)                    { videoBuffer   = await baixar(quotedMsg.videoMessage, 'video');   videoMime  = quotedMsg.videoMessage.mimetype   || 'video/mp4';   mediaDesc = 'vídeo citado'; }
  } catch (e) { console.error('[KAORUKO-IA] Mídia:', e.message); }

  const send = (text) => {
    const extra = { secureMetaServiceLabel: true, ...(!isGroup ? { ai: true } : {}) };
    return kaoruko.sendMessage(from, { text: String(text), ...extra }, waguriselo ? { quoted: waguriselo } : {});
  };

  const RATE_LIMIT_MS  = 4000;
  const RATE_LIMIT_MAX = 6;
  const RATE_WINDOW_MS = 30_000;
  global.__kaorukoRateLimit ??= new Map();
  const _rateKey  = sender;
  const _rateNow  = Date.now();
  const _rateData = global.__kaorukoRateLimit.get(_rateKey) || { last: 0, msgs: [] };
  if (_rateNow - _rateData.last < RATE_LIMIT_MS) {
    await send('⏳ Calma~ Ainda processando a última mensagem! 🌸');
    return true;
  }
  _rateData.msgs = _rateData.msgs.filter(t => _rateNow - t < RATE_WINDOW_MS);
  if (_rateData.msgs.length >= RATE_LIMIT_MAX) {
    await send('⏳ Calma lá~ Tô processando tudo, mas não aguento esse ritmo! Espera um pouquinho 🌸');
    return true;
  }
  _rateData.last = _rateNow;
  _rateData.msgs.push(_rateNow);
  global.__kaorukoRateLimit.set(_rateKey, _rateData);
  if (global.__kaorukoRateLimit.size > 1000) {
    for (const [k, v] of global.__kaorukoRateLimit)
      if (_rateNow - v.last > RATE_WINDOW_MS * 2) global.__kaorukoRateLimit.delete(k);
  }

  const _bl = (body || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const _respostasRapidas = [
    [/^(oi|ola|ola!|ei|hey|hello|salve|eai|e ai|opa|oie)[\s!?]*$/,  ['Oi~ 🌸', 'Oi oi! 😏', 'Eai~ ✨', 'Opa! 🌸']],
    [/^(boa\s*tarde|boa\s*noite|bom\s*dia)[\s!?]*$/, [null]],
    [/ta\s*(on|online|ai|aí|ativa|ativo)\??|voce\s*ta\s*(on|ai|aí)\??|ta\s*acordad[ao]\??|tem\s*alguem\s*ai\??|alguem\s*ai\??/, ['Tô sim~ 🌸', 'Tô aqui! 😏', 'Sempre on pra você~ ✨', 'Tô por aqui~ 💜']],
    [/^(tudo\s*(bem|bom|certo|ok)|como\s*(vai|voce\s*ta)|tudo\s*bem\??|td\s*bem\??)[\s!?]*$/,  ['Tudo ótimo~ e você? 🌸', 'Tô bem! E aí, o que precisa? 😏', 'Tudo certo por aqui~ ✨']],
    [/^(obrigad[ao]|valeu|vlw|obg|muito\s*obrigad[ao])[\s!?]*$/,     ['De nada~ 🌸', 'Disponha! 😏', 'Figurinha~ ✨']],
    [/^(ok|okay|certo|entendi|blz|beleza|ta\s*bom|tá\s*bom)[\s!?]*$/,['Ok~ 🌸', '😏', 'Certo~']],
    [/^(tchau|ate\s*mais|ate\s*logo|fui|xau|bye)[\s!?]*$/,           ['Tchau~ 🌸', 'Até mais! 💜', 'Fui não, ainda tô aqui 😏']],
  ];

  for (const [regex, respostas] of _respostasRapidas) {
    if (regex.test(_bl)) {
      if (respostas[0] === null) {
        const t2 = moment.tz('America/Sao_Paulo').format('HH:mm:ss');
        let s;
        if      (t2 > '00:00:00' && t2 < '05:00:00')  s = 'Boa noite';
        else if (t2 >= '05:00:00' && t2 < '12:00:00') s = 'Bom dia';
        else if (t2 >= '12:00:00' && t2 < '18:00:00') s = 'Boa tarde';
        else                                            s = 'Boa noite';
        const opts = [`${s}~ 🌸`, `${s}! 😏`, `${s}~ 💜`];
        await send(opts[Math.floor(Math.random() * opts.length)]);
      } else {
        await send(respostas[Math.floor(Math.random() * respostas.length)]);
      }
      return true;
    }
  }

  if (/deletar?\s*(minha\s*)?mem[oó]ria|apagar?\s*(minha\s*)?mem[oó]ria|esquece\s*(tudo|de\s*mim)|limpa\s*(minha\s*)?mem[oó]ria|zera\s*(minha\s*)?mem[oó]ria/.test(_bl)) {
    deletarMemoria(chatKey);
    limparHistorico(chatKey);
    await send('🗑️ Memória apagada~ Como se nunca tivéssemos nos encontrado... 🌸');
    return true;
  }

  if (/limpar?\s*(o\s*)?(meu\s*)?hist[oó]rico|apagar?\s*(o\s*)?(meu\s*)?hist[oó]rico|zerar?\s*(o\s*)?(meu\s*)?hist[oó]rico|esquece\s*(a\s*)?conversa/.test(_bl)) {
    limparHistorico(chatKey);
    await send('🗑️ Histórico limpo~ Mas ainda lembro de você 😏');
    return true;
  }

  if (/ver\s*(minha\s*)?mem[oó]ria|minha\s*mem[oó]ria|o\s*que\s*(voc[eê]\s*)?(sabe|lembra)\s*(sobre\s*mim|de\s*mim)|me\s*conhece|quem\s*sou\s*(eu)?/.test(_bl)) {
    const mem = getMemoria(chatKey);
    if (!mem || (!mem.fatos?.length && !mem.nome)) {
      await send('🌸 Ainda não sei muito sobre você~ Vamos nos conhecer? 💜');
    } else {
      const l = [];
      if (mem.nome)       l.push(`👤 *${mem.nome}*`);
      if (mem.nomeGrupo)  l.push(`💬 Grupo: *${mem.nomeGrupo}*`);
      if (mem.humor)      l.push(`😊 Humor: *${mem.humor}*`);
      if (mem.fatos?.length) l.push(`\n📌 *O que sei:*\n${mem.fatos.map(f => `• ${f}`).join('\n')}`);
      if (mem.ultimaVez)  l.push(`\n🕐 Última conversa: ${mem.ultimaVez}`);
      if (mem.totalMsgs)  l.push(`💬 Msgs: ${mem.totalMsgs}`);
      await send(`🧠 *Minha memória~*\n\n${l.join('\n')}`);
    }
    return true;
  }

  const _climaMatch = _bl.match(/(?:clima|tempo|temperatura|previs[aã]o|vai\s+chover|t[aá]\s+(?:frio|quente|chovendo))\s+(?:em\s+|de\s+|n[ao]\s+)?([a-záàãâéêíóôõúç\s]{3,30}?)(?:\s*[?,!]|$)/);
  if (_climaMatch) {
    const cidade = _climaMatch[1].trim();
    if (cidade.length >= 3) {
      await send(`🌤️ Buscando clima de *${cidade}*...`);
      const climaRes = await buscarClima(cidade).catch(() => null);
      await send(climaRes || `😕 Não consegui o clima de *${cidade}*~ Tenta escrever o nome completo da cidade`);
      return true;
    }
  }

  enfileirar(chatKey, async () => {
    const typing = new TypingPresence(kaoruko, from);
    await typing.start();
    try {
      const _bodyParaCache = (!imageBuffer && !audioBuffer && !videoBuffer) ? body : null;
      const _cached        = _bodyParaCache ? _cacheGet(chatKey, _bodyParaCache) : null;

      const resultado = _cached || await comTimeout(
        processarMensagem({
          userMessage: body || '',
          senderName, senderNumber, groupName, memberCount,
          currentTime, isGroup, isAdmin, chatKey, memoriaContexto,
          imageBuffer, imageMime, audioBuffer, audioMime,
          videoBuffer, videoMime, stickerBuffer, mediaDesc,
          temQuoted: !!quotedMsg,
          mentionedJids,
        }),
        OR_TIMEOUT,
        'OpenRouter'
      );

      if (_bodyParaCache && !_cached) _cacheSet(chatKey, _bodyParaCache, resultado);

      atualizarMemoria({ chatKey, senderName, groupName, isGroup, currentTime });

      await executarAcao({
        ...resultado,
        kaoruko, from, sender, groupMetadata, reply, chatKey,
        okarunsite, API_KEY_WAGURI,
        waguriselo, fetchJson: fetchJsonExt, axios: axiosExt, exec: execExt, fs: fsExt,
        typing, isGroup, memberCount,
      });

    } catch (err) {
      const msg = err?.message || '';
      console.error(`[KAORUKO-IA][${chatKey}]`, msg);
      if      (msg.includes('quota') || msg.includes('429') || msg.includes('rate'))   await send('⏳ Atingi o limite de requisições por agora~ Tenta daqui a pouco? 🌸');
      else if (msg.includes('timeout') || msg.includes('após'))                         await send('⌛ Demorou demais pra responder~ Tenta de novo? 🌸');
      else if (msg.includes('500') || msg.includes('503'))                              await send('😵 O servidor deu um erro interno~ Tenta de novo em alguns segundos? 🌸');
    } finally {
      await typing.stop();
    }
  });

  return true;
}

module.exports = {
  handleKaorukoIA,

  limparHistorico,
  carregarHistorico,
  detectarIntencaoLocal,
  buscarClima,
  buscarNaWeb,
};


