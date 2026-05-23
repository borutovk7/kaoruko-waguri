// ./src/eununca-handler.js
const { decryptPollVote } = require('@boruto_vk7/baileys');

const eununca = require('../database/eununca.json');
const frases = eununca.iNever;

// Map: pollMsgId -> { from, encKey, pollCreatorLid }
const partidasAtivas = new Map();
const timeouts = new Map();
const INATIVIDADE_MS = 15 * 60 * 1000;

function _resetTimeout(kaoruko, from) {
  if (timeouts.has(from)) clearTimeout(timeouts.get(from));
  timeouts.set(from, setTimeout(async () => {
    for (const [id, d] of partidasAtivas.entries()) {
      if (d.from === from) partidasAtivas.delete(id);
    }
    timeouts.delete(from);
    await kaoruko.sendMessage(from, { text: '🎲 *Eu Nunca* encerrado por inatividade!' });
  }, INATIVIDADE_MS));
}

async function enviarNovaRodada(kaoruko, from) {
  const pergunta = frases[Math.floor(Math.random() * frases.length)];

  const sent = await kaoruko.sendMessage(from, {
    poll: {
      name: pergunta,
      values: ['Eu já 😏', 'Eu nunca 😇'],
      selectableCount: 1
    }
  });

  const msgId = sent.key.id;

  // Pega a encKey da poll criada — fica dentro de pollCreationMessageV3
  const pollMsg = sent.message?.pollCreationMessageV3 || sent.message?.pollCreationMessage;
  const encKey = pollMsg?.encKey;

  // pollCreatorLid = JID do bot (participante LID no grupo)
  const pollCreatorLid = sent.key?.participant || kaoruko.user?.id;

  console.log('[eununca] nova rodada:', msgId, '| encKey:', !!encKey, '| creator:', pollCreatorLid);

  partidasAtivas.set(msgId, {
    from,
    encKey,        // Buffer — chave pra descriptografar votos
    pollCreatorLid,
    pergunta
  });

  _resetTimeout(kaoruko, from);
  return msgId;
}

function pararPartida(from) {
  for (const [id, d] of partidasAtivas.entries()) {
    if (d.from === from) partidasAtivas.delete(id);
  }
  if (timeouts.has(from)) {
    clearTimeout(timeouts.get(from));
    timeouts.delete(from);
  }
}

async function processEununca(kaoruko, m) {
  const pollUpdate = m.message?.pollUpdateMessage;
  if (!pollUpdate) return;

  // ID da poll original que gerou esse voto
  const pollMsgId = pollUpdate.pollCreationMessageKey?.id;
  if (!pollMsgId) return;

  console.log('[eununca] voto recebido para poll:', pollMsgId, '| partidas ativas:', [...partidasAtivas.keys()]);

  if (!partidasAtivas.has(pollMsgId)) return;

  const { from, encKey, pollCreatorLid } = partidasAtivas.get(pollMsgId);

  // Voter — pode vir como LID ou @s.whatsapp.net
  // participantAlt tem o número real
  const voterLid = m.key?.participant;
  const voterNum = m.key?.participantAlt || voterLid;
  const mention  = (voterNum || voterLid || '').split('@')[0];

  const vote = pollUpdate.vote;
  if (!vote?.encPayload || !vote?.encIv) {
    console.log('[eununca] voto sem payload/iv');
    return;
  }

  // Descriptografa o voto
  let decrypted;
  try {
    decrypted = decryptPollVote(vote, {
      pollEncKey: encKey,
      // voterJid precisa ser o LID do voter
      voterJid: voterLid,
      // pollCreatorJid = LID do bot (criador da poll)
      pollCreatorJid: pollCreatorLid,
    });
  } catch (e) {
    console.error('[eununca] erro decryptPollVote:', e.message);
    // Fallback: responde sem saber a opção
    partidasAtivas.delete(pollMsgId);
    await kaoruko.sendMessage(from, {
      text: `🎲 @${mention} votou! _(não consegui ler a opção)_`,
      mentions: [voterNum || voterLid]
    });
    await new Promise(r => setTimeout(r, 1500));
    await enviarNovaRodada(kaoruko, from);
    return;
  }

  // selectedOptions tem os hashes das opções votadas
  const selectedHashes = decrypted?.selectedOptions || [];
  console.log('[eununca] opcoes selecionadas (hashes):', selectedHashes.length);

  // Sem seleção = desmarcou o voto, ignora
  if (!selectedHashes.length) return;

  // Compara com hash das opções originais
  // O Baileys hasheia o nome da opção com SHA256 — mas decryptPollVote já retorna os nomes
  // Se retornar nomes direto:
  const opcaoNome = decrypted?.selectedOptions?.[0];
  const votouJa = typeof opcaoNome === 'string'
    ? opcaoNome.includes('já') || opcaoNome === 'Eu já 😏'
    : false;

  const reacoes_ja    = ['kkkk 💀', 'admitiu! 👀', 'confessou rsrs 😂', 'sem vergonha 😂'];
  const reacoes_nunca = ['será mesmo? 🤔', 'tá bom... 😒', 'jura né 👀', 'acredito não 😂'];

  const msg = votouJa
    ? `😏 @${mention} *já fez isso!* ${reacoes_ja[Math.floor(Math.random() * reacoes_ja.length)]}`
    : `😇 @${mention} *nunca fez isso!* ${reacoes_nunca[Math.floor(Math.random() * reacoes_nunca.length)]}`;

  partidasAtivas.delete(pollMsgId);

  await kaoruko.sendMessage(from, {
    text: msg,
    mentions: [voterNum || voterLid]
  });

  await new Promise(r => setTimeout(r, 1500));
  await enviarNovaRodada(kaoruko, from);
}

module.exports = { processEununca, enviarNovaRodada, pararPartida };
