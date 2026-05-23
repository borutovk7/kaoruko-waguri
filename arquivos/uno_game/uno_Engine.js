'use strict';

const fs = require('fs');
const { GameEngine, GameStorage } = require('@irithell-js/uno');

/* ═══════════════════════════════════════════════════════════════════════════
   O módulo @irithell-js/uno já oferece:
     - GameStorage  → save / load / delete / listGames / getStats / getDetailedGameInfo
     - GameEngine   → processHumanTurn / processAITurn / getState / toSavedState
     - CardImageResolver → caminhos e buffers das imagens das cartas

   Este arquivo é APENAS responsável por:
     - Gerenciar sessões de lobby (quem entrou, status waiting/playing)
     - Timers de turno e inatividade
     - Emitir eventos para o bot
   ═══════════════════════════════════════════════════════════════════════════ */

const STORAGE_PATH        = '/games'; 
const TURN_TIMEOUT_MS     = 30_000;
const INACTIVITY_CHECK_MS = 60_000;
const MAX_INACTIVITY_MS   = 300_000;

/**
 * @param {import('@irithell-js/uno').SerializedCard | null | undefined} card
 * @returns {Buffer | null}
 */
function getCardBuffer(card) {
  try {
    const p = card?.imageAbsolutePath;
    if (p && fs.existsSync(p)) return fs.readFileSync(p);
  } catch (_) {}
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TIPOS JSDoc

   @typedef {{ userId: string, name: string, isBot: boolean }} PlayerEntry

   @typedef {{
     channelId    : string,
     engine       : GameEngine | null,
     hostId       : string,
     status       : 'waiting' | 'playing',
     playerMap    : PlayerEntry[],
     onEvent      : Function | null,
     lastActivity : number,
     turnTimer    : ReturnType<typeof setTimeout> | null,
     unoCalled    : Set<string>
   }} Session
   ═══════════════════════════════════════════════════════════════════════════ */

class UnoSystem {
  constructor() {
    /** @type {GameStorage} */
    this.storage = new GameStorage(STORAGE_PATH);

    /** @type {Map<string, Session>} */
    this.sessions = new Map();

    /** @type {Map<string, Object[]>} */
    this.eventQueues = new Map();

    this._startInactivityMonitor();
  }

  /* ── eventos ──────────────────────────────────────────────────────────── */

  /** @param {Session} session  @param {Object | Object[]} ev */
  _emit(session, ev) {
    const events = Array.isArray(ev) ? ev : [ev];
    if (typeof session?.onEvent === 'function') session.onEvent(events);
    if (session?.channelId) {
      const q = this.eventQueues.get(session.channelId) ?? [];
      q.push(...events);
      this.eventQueues.set(session.channelId, q);
    }
  }

  /** @param {string} channelId @returns {Object[]} */
  popEvents(channelId) {
    const events = this.eventQueues.get(channelId) ?? [];
    this.eventQueues.delete(channelId);
    return events;
  }

  /* ── engine via GameStorage ───────────────────────────────────────────── */

  /** @param {string} channelId @returns {GameEngine | null} */
  _engine(channelId) {
    const s = this.sessions.get(channelId);
    if (!s) return null;
    
    // Se já temos a engine em memória, usamos ela
    if (s.engine) return s.engine;

    // Caso contrário, tentamos carregar do storage (ex: após um restart do bot)
    // Nota: Para isso funcionar, precisaríamos de uma forma de mapear channelId -> gameId
    // Como o gameId é gerado na criação, vamos manter a engine na sessão enquanto ativa.
    return null;
  }

  /** @param {string} channelId @param {GameEngine} engine */
  _save(channelId, engine) {
    const s = this.sessions.get(channelId);
    if (s) {
      s.engine = engine;
      this.storage.saveGame(engine.gameId, engine);
    }
  }

  /* ── sessão ───────────────────────────────────────────────────────────── */

  /** @param {string} channelId @param {string} reason */
  _endSession(channelId, reason) {
    const s = this.sessions.get(channelId);
    if (!s) return;
    if (s.turnTimer) clearTimeout(s.turnTimer);
    
    // Se o jogo acabou, podemos deletar do storage ou manter para histórico
    // Aqui vamos apenas remover da memória. O storage mantém o arquivo se quisermos consultar stats depois.
    this.sessions.delete(channelId);
    this._emit(s, { type: 'GAME_END', reason });
  }

  /* ── inatividade ──────────────────────────────────────────────────────── */

  _startInactivityMonitor() {
    this._inactivityTimer = setInterval(() => {
      const now = Date.now();
      for (const [cid, s] of this.sessions)
        if (now - s.lastActivity > MAX_INACTIVITY_MS)
          this._endSession(cid, '⏰ Partida encerrada por inatividade.');
    }, INACTIVITY_CHECK_MS);
  }

  /* ── timer de turno ───────────────────────────────────────────────────── */

  /** @param {string} channelId */
  _startTurnTimer(channelId) {
    const s = this.sessions.get(channelId);
    if (!s) return;
    if (s.turnTimer) clearTimeout(s.turnTimer);

    s.turnTimer = setTimeout(async () => {
      const session = this.sessions.get(channelId);
      if (!session) return;

      const engine = this._engine(channelId);
      if (!engine || engine.gameOver) return;

      const cur = engine.getState().currentPlayer;
      engine.processHumanTurn(cur, { action: 'draw_card' });
      this._save(channelId, engine);
      session.lastActivity = Date.now();

      const st = engine.getState();
      this._emit(session, {
        type      : 'TURN_TIMEOUT',
        message   : `⏰ Tempo de *${cur}* esgotou! Comprou carta.`,
        nextPlayer: st.currentPlayer,
        scoreboard: this._board(st),
      });

      this._startTurnTimer(channelId);
      setTimeout(() => this.processAITurns(channelId), 800);
    }, TURN_TIMEOUT_MS);
  }

  /* ── scoreboard ───────────────────────────────────────────────────────── */

  /** @param {import('@irithell-js/uno').GameState} state @returns {string} */
  _board(state) {
    return state.players
      .map(p => `${p.name}(${p.cardsInHand}${p.isUno ? '🃏' : ''})`)
      .join(' | ');
  }

  /* ══════════════════════════════════════════════════════════════════════
     API — LOBBY
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * Cria um lobby no canal.
   * @param {string}   channelId
   * @param {string}   hostId
   * @param {string}   hostName
   * @param {Function} onEventCallback
   */
  async createGame(channelId, hostId, hostName, onEventCallback) {
    if (this.sessions.has(channelId))
      return { erro: '❌ Já existe uma partida neste canal.' };

    this.sessions.set(channelId, {
      channelId,
      engine      : null,
      hostId,
      status      : 'waiting',
      playerMap   : [{ userId: hostId, name: hostName, isBot: false }],
      onEvent     : onEventCallback,
      lastActivity: Date.now(),
      turnTimer   : null,
      unoCalled   : new Set(),
    });

    return { sucesso: `🎴 Partida criada por *${hostName}*!\nUse !entrar para participar.` };
  }

  /**
   * Entra no lobby.
   * @param {string} channelId
   * @param {string} userId
   * @param {string} name
   */
  async joinGame(channelId, userId, name) {
    const s = this.sessions.get(channelId);
    if (!s)                                         return { erro: '❌ Nenhuma partida ativa neste grupo.' };
    if (s.status !== 'waiting')                     return { erro: '❌ A partida já começou.' };
    if (s.playerMap.find(p => p.userId === userId)) return { erro: '❌ Você já está na partida!' };
    if (s.playerMap.length >= 8)                    return { erro: '❌ Partida cheia (máx 8).' };

    s.playerMap.push({ userId, name, isBot: false });
    s.lastActivity = Date.now();
    return { sucesso: `✅ *${name}* entrou! (${s.playerMap.length}/8)` };
  }

  /** @param {string} channelId */
  addBot(channelId) {
    const s = this.sessions.get(channelId);
    if (!s)                      return { erro: '❌ Nenhuma partida ativa neste grupo.' };
    if (s.status !== 'waiting')  return { erro: '❌ A partida já começou.' };
    if (s.playerMap.length >= 8) return { erro: '❌ Partida cheia (máx 8).' };

    const botName = `🤖 Bot ${s.playerMap.length + 1}`;
    const botId   = `bot_${Math.random().toString(36).slice(2, 7)}`;
    s.playerMap.push({ userId: botId, name: botName, isBot: true });
    s.lastActivity = Date.now();
    return { sucesso: `🤖 *${botName}* adicionado! (${s.playerMap.length}/8)` };
  }

  /**
   * Inicia a partida — cria o GameEngine e salva via GameStorage.
   * @param {string} channelId
   * @param {string} requesterId
   */
  async startGame(channelId, requesterId) {
    const s = this.sessions.get(channelId);
    if (!s)                       return { erro: '❌ Nenhuma partida ativa neste grupo.' };
    if (s.hostId !== requesterId) return { erro: '❌ Apenas o host pode iniciar.' };
    if (s.playerMap.length < 2)   return { erro: '❌ Mínimo 2 jogadores.' };

    const engine = new GameEngine({
      players : s.playerMap.map(p => ({ name: p.name, type: p.isBot ? 'AI' : 'HUMAN' })),
      language: 'pt-BR',
    });

    s.engine       = engine;
    s.status       = 'playing';
    s.lastActivity = Date.now();
    this.storage.saveGame(engine.gameId, engine);

    const state  = engine.getState();
    const topBuf = getCardBuffer(state.topCard);

    this._emit(s, {
      type       : 'GAME_START',
      topCard    : state.topCard.display,
      topCardBuf : topBuf,
      firstPlayer: state.currentPlayer,
      scoreboard : this._board(state),
    });

    this._startTurnTimer(channelId);

    return {
      sucesso     : '🎴 Jogo iniciado!',
      firstPlayer : state.currentPlayer,
      topCard     : state.topCard.display,
      topCardBuf  : topBuf,
      scoreboard  : this._board(state),
    };
  }

  /* ══════════════════════════════════════════════════════════════════════
     API — JOGADAS
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * @param {string}      channelId
   * @param {string}      userId
   * @param {number}      cardIndex   1-based (exibido ao jogador)
   * @param {string|null} chosenColor cor para Curinga / Curinga +4
   */
  async playCard(channelId, userId, cardIndex, chosenColor = null) {
    const s = this.sessions.get(channelId);
    if (!s || s.status !== 'playing') return { erro: '❌ Jogo não está em andamento.' };

    const pe = s.playerMap.find(p => p.userId === userId);
    if (!pe) return { erro: '❌ Você não está nesta partida.' };

    const engine = this._engine(channelId);
    if (!engine) return { erro: '❌ Erro ao carregar partida.' };

    const state = engine.getState();
    if (state.currentPlayer !== pe.name)
      return { erro: `❌ Não é o seu turno! É a vez de *${state.currentPlayer}*.` };

    const result = engine.processHumanTurn(pe.name, {
      action     : 'play_card',
      cardIndex  : cardIndex - 1,
      chosenColor: chosenColor ?? undefined,
    });
    if (!result.success) return { erro: `❌ ${result.error}` };

    this._save(channelId, engine);
    s.lastActivity = Date.now();
    s.unoCalled.delete(userId);

    const newState = engine.getState();
    const topBuf   = getCardBuffer(newState.topCard);

    if (engine.gameOver && engine.winner) {
      this._endSession(channelId, `🏆 *${engine.winner.name}* venceu!`);
      return { vitoria: true, winner: engine.winner.name, topBuf };
    }

    if (s.turnTimer) { clearTimeout(s.turnTimer); s.turnTimer = null; }

    const meInfo     = newState.players.find(p => p.name === pe.name);
    const unoWarning = meInfo?.cardsInHand === 1 && !s.unoCalled.has(userId)
      ? `⚠️ *${pe.name}* ficou com 1 carta e não chamou UNO! Use !uno`
      : null;

    this._emit(s, {
      type      : 'CARD_PLAYED',
      player    : pe.name,
      nextPlayer: newState.currentPlayer,
      topCard   : newState.topCard.display,
      topBuf,
      scoreboard: this._board(newState),
      unoWarning,
    });

    return {
      sucesso   : true,
      nextPlayer: newState.currentPlayer,
      topCard   : newState.topCard.display,
      topBuf,
      scoreboard: this._board(newState),
      unoWarning,
    };
  }

  /** @param {string} channelId @param {string} userId */
  async drawCard(channelId, userId) {
    const s = this.sessions.get(channelId);
    if (!s || s.status !== 'playing') return { erro: '❌ Jogo não está em andamento.' };

    const pe = s.playerMap.find(p => p.userId === userId);
    if (!pe) return { erro: '❌ Você não está nesta partida.' };

    const engine = this._engine(channelId);
    if (!engine) return { erro: '❌ Erro ao carregar partida.' };

    const state = engine.getState();
    if (state.currentPlayer !== pe.name)
      return { erro: `❌ Não é o seu turno! É a vez de *${state.currentPlayer}*.` };

    const result = engine.processHumanTurn(pe.name, { action: 'draw_card' });
    if (!result.success) return { erro: `❌ ${result.error}` };

    this._save(channelId, engine);
    s.lastActivity = Date.now();
    if (s.turnTimer) { clearTimeout(s.turnTimer); s.turnTimer = null; }

    const newState = engine.getState();
    this._emit(s, {
      type      : 'CARD_DRAWN',
      player    : pe.name,
      nextPlayer: newState.currentPlayer,
      scoreboard: this._board(newState),
    });

    return {
      sucesso   : `✅ *${pe.name}* comprou uma carta.`,
      nextPlayer: newState.currentPlayer,
      scoreboard: this._board(newState),
    };
  }

  /** @param {string} channelId @param {string} userId */
  async callUno(channelId, userId) {
    const s = this.sessions.get(channelId);
    if (!s || s.status !== 'playing') return { erro: '❌ Jogo não está em andamento.' };

    const pe = s.playerMap.find(p => p.userId === userId);
    if (!pe) return { erro: '❌ Você não está nesta partida.' };

    const state = this._engine(channelId)?.getState();
    const me    = state?.players.find(p => p.name === pe.name);
    if (!me || me.cardsInHand !== 1)
      return { erro: '❌ Só pode chamar UNO com exatamente 1 carta!' };

    s.unoCalled.add(userId);
    s.lastActivity = Date.now();
    this._emit(s, { type: 'UNO_CALLED', player: pe.name });
    return { sucesso: `🃏 *${pe.name}* chamou UNO!` };
  }

  /* ══════════════════════════════════════════════════════════════════════
     API — IA
     ══════════════════════════════════════════════════════════════════════ */

  /** @param {string} channelId */
  async processAITurns(channelId) {
    const s = this.sessions.get(channelId);
    if (!s || s.status !== 'playing') return;

    const engine = this._engine(channelId);
    if (!engine || engine.gameOver) return;

    const state = engine.getState();
    const cur   = s.playerMap.find(p => p.name === state.currentPlayer);
    if (!cur?.isBot) return;

    if (s.turnTimer) { clearTimeout(s.turnTimer); s.turnTimer = null; }

    const log = engine.processAITurn();   
    this._save(channelId, engine);
    s.lastActivity = Date.now();

    const newState = engine.getState();
    const topBuf   = getCardBuffer(newState.topCard);

    this._emit(s, {
      type      : 'AI_TURN',
      player    : log?.player,
      action    : log?.action,
      card      : log?.card,
      topCard   : newState.topCard.display,
      topBuf,
      scoreboard: this._board(newState),
    });

    if (engine.gameOver && engine.winner) {
      this._endSession(channelId, `🏆 *${engine.winner.name}* venceu!`);
      return;
    }

    const next   = engine.getState();
    const nextPm = s.playerMap.find(p => p.name === next.currentPlayer);
    if (nextPm?.isBot) {
      setTimeout(() => this.processAITurns(channelId), 800);
    } else {
      this._startTurnTimer(channelId);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     API — CONSULTAS (delegadas ao GameStorage / GameEngine)
     ══════════════════════════════════════════════════════════════════════ */

  /** @param {string} channelId @param {string} userId */
  async getMyHand(channelId, userId) {
    const s = this.sessions.get(channelId);
    if (!s) return { erro: '❌ Nenhuma partida ativa neste grupo.' };

    const pe = s.playerMap.find(p => p.userId === userId);
    if (!pe) return { erro: '❌ Você não está nesta partida.' };

    const engine = this._engine(channelId);
    if (!engine) return { erro: '❌ Erro ao carregar partida.' };

    const state = engine.getState();
    const me    = state.players.find(p => p.name === pe.name);
    if (!me?.hand) return { erro: '❌ Suas cartas não estão disponíveis agora.' };

    return {
      sucesso    : true,
      hand       : me.hand,           
      topCard    : state.topCard.display,
      topBuf     : getCardBuffer(state.topCard),
      validMoves : me.validMoves ?? [],
      cardsInHand: me.cardsInHand,
      isMyTurn   : state.currentPlayer === pe.name,
      scoreboard : this._board(state),
    };
  }

  /** @param {string} channelId */
  getGameState(channelId) {
    const s = this.sessions.get(channelId);
    if (!s) return null;

    const engine = this._engine(channelId);
    if (!engine) return { status: s.status, players: s.playerMap.length };

    const state = engine.getState();   
    return {
      status       : s.status,
      players      : s.playerMap.length,
      currentPlayer: state.currentPlayer,
      nextPlayer   : state.nextPlayer,
      topCard      : state.topCard.display,
      currentColor : state.currentColor,
      scoreboard   : this._board(state),
      gameOver     : state.gameOver,
      winner       : state.winner,
      turnNumber   : state.turnNumber,
    };
  }

  /** Estatísticas do storage — GameStorage.getStats() */
  getStorageStats() {
    return this.storage.getStats();
  }

  /**
   * Info detalhada de uma partida — GameStorage.getDetailedGameInfo()
   * @param {string} gameId
   * @returns {import('@irithell-js/uno').GameInfo | null}
   */
  getGameInfo(gameId) {
    return this.storage.getDetailedGameInfo(gameId);
  }

  /** @param {string} userId @returns {boolean} */
  isPlayerInAnyGame(userId) {
    for (const s of this.sessions.values())
      if (s.playerMap.find(p => p.userId === userId)) return true;
    return false;
  }

  /** @param {string} userId @returns {string | null} */
  getPlayerSession(userId) {
    for (const [cid, s] of this.sessions)
      if (s.playerMap.find(p => p.userId === userId)) return cid;
    return null;
  }

  /** @param {string} channelId @param {string} requesterId */
  forceEndGame(channelId, requesterId) {
    const s = this.sessions.get(channelId);
    if (!s)                       return { erro: '❌ Nenhuma partida ativa neste grupo.' };
    if (s.hostId !== requesterId) return { erro: '❌ Apenas o host pode encerrar.' };
    this._endSession(channelId, '🛑 Partida encerrada pelo host.');
    return { sucesso: '🛑 Partida encerrada.' };
  }

  /** Limpa timers e fecha o storage. Chamar ao desligar o bot. */
  destroy() {
    if (this._inactivityTimer) {
      clearInterval(this._inactivityTimer);
      this._inactivityTimer = null;
    }
    for (const s of this.sessions.values())
      if (s.turnTimer) { clearTimeout(s.turnTimer); s.turnTimer = null; }
    this.storage.close();
  }
}

module.exports = { UnoSystem, getCardBuffer };
