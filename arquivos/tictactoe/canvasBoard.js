/**
 * canvasBoard.js — Gerador de imagem do tabuleiro de Jogo da Velha
 * Usa: @irithell-js/canvas-termux (drop-in do canvas)
 */

const { createCanvas, registerFont } = require('@irithell-js/canvas-termux');
const path = require('path');

/* ── Dimensões e paleta ─────────────────────────────────── */
const SIZE        = 540;   // canvas quadrado
const PADDING     = 40;    // margem externa
const CELL        = (SIZE - PADDING * 2) / 3;
const LINE_WIDTH  = 6;
const CORNER_R    = 18;    // raio dos cantos das células

const COLORS = {
  bg:         '#0f0f1a',   // fundo escuro roxo-noite
  panel:      '#1a1a2e',   // painel central
  grid:       '#2a2a4a',   // linhas da grade
  cellBg:     '#16213e',   // fundo das células
  cellHover:  '#1f2d50',
  X:          '#ff4d6d',   // X vermelho-rosa neon
  O:          '#4cc9f0',   // O azul ciano neon
  numFg:      '#3a3a6a',   // números de hint (posições livres)
  title:      '#e0e0ff',
  shadow:     'rgba(0,0,0,0.6)',
  glowX:      'rgba(255,77,109,0.35)',
  glowO:      'rgba(76,201,240,0.35)',
  winLine:    '#f8c500',
};

/* ── Helpers ─────────────────────────────────────────────── */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
  ctx.lineTo(x,     y + r);
  ctx.quadraticCurveTo(x,     y,     x + r, y);
  ctx.closePath();
}

/* ── Desenha X ───────────────────────────────────────────── */
function drawX(ctx, cx, cy, radius) {
  const r = radius * 0.55;
  ctx.save();

  // Glow
  ctx.shadowColor  = COLORS.glowX;
  ctx.shadowBlur   = 28;
  ctx.strokeStyle  = COLORS.X;
  ctx.lineWidth    = 10;
  ctx.lineCap      = 'round';

  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r);
  ctx.lineTo(cx + r, cy + r);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + r, cy - r);
  ctx.lineTo(cx - r, cy + r);
  ctx.stroke();

  ctx.restore();
}

/* ── Desenha O ───────────────────────────────────────────── */
function drawO(ctx, cx, cy, radius) {
  const r = radius * 0.52;
  ctx.save();

  ctx.shadowColor  = COLORS.glowO;
  ctx.shadowBlur   = 28;
  ctx.strokeStyle  = COLORS.O;
  ctx.lineWidth    = 10;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/* ── Desenha número hint ─────────────────────────────────── */
function drawHint(ctx, cx, cy, num) {
  ctx.save();
  ctx.fillStyle  = COLORS.numFg;
  ctx.font       = 'bold 28px monospace';
  ctx.textAlign  = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(num), cx, cy);
  ctx.restore();
}

/* ── Converte matriz emoji → tipo interno ────────────────── */
const EMOJI_MAP = {
  '1️⃣': { t: 'hint', n: 1  }, '2️⃣': { t: 'hint', n: 2  }, '3️⃣': { t: 'hint', n: 3  },
  '4️⃣': { t: 'hint', n: 4  }, '5️⃣': { t: 'hint', n: 5  }, '6️⃣': { t: 'hint', n: 6  },
  '7️⃣': { t: 'hint', n: 7  }, '8️⃣': { t: 'hint', n: 8  }, '9️⃣': { t: 'hint', n: 9  },
  '❌': { t: 'X' },
  '⭕': { t: 'O' },
};

/* ── Linha vencedora ─────────────────────────────────────── */
function getWinLine(matrix) {
  const m = matrix.map(row => row.map(v => EMOJI_MAP[v]?.t || '?'));
  const check = (cells) => {
    const [a, b, c] = cells;
    return (a === b && b === c && (a === 'X' || a === 'O')) ? a : null;
  };
  // Horizontais
  for (let r = 0; r < 3; r++) {
    if (check([m[r][0], m[r][1], m[r][2]])) return { type: 'row', idx: r };
  }
  // Verticais
  for (let c = 0; c < 3; c++) {
    if (check([m[0][c], m[1][c], m[2][c]])) return { type: 'col', idx: c };
  }
  if (check([m[0][0], m[1][1], m[2][2]])) return { type: 'diag', idx: 0 };
  if (check([m[0][2], m[1][1], m[2][0]])) return { type: 'diag', idx: 1 };
  return null;
}

/* ── Função principal exportada ──────────────────────────── */
/**
 * Gera o buffer PNG do tabuleiro.
 *
 * @param {string[][]} matrix   - Matriz 3×3 com emojis do jogo
 * @param {object}     opts
 * @param {string}     [opts.turn]    - 'X' | 'O' — turno atual
 * @param {boolean}    [opts.isWin]   - se há vencedor
 * @param {string}     [opts.winner]  - 'X' | 'O' | 'SERI'
 * @returns {Buffer}  PNG buffer pronto para enviar como sticker/imagem
 */
function generateBoard(matrix, opts = {}) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx    = canvas.getContext('2d');

  /* --- Fundo ------------------------------------------------ */
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Painel central arredondado
  ctx.fillStyle = COLORS.panel;
  roundRect(ctx, PADDING - 10, PADDING - 10, SIZE - (PADDING - 10) * 2, SIZE - (PADDING - 10) * 2, 24);
  ctx.fill();

  /* --- Células ---------------------------------------------- */
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = PADDING + col * CELL;
      const y = PADDING + row * CELL;

      // Fundo da célula
      ctx.fillStyle = COLORS.cellBg;
      roundRect(ctx, x + 6, y + 6, CELL - 12, CELL - 12, CORNER_R);
      ctx.fill();
    }
  }

  /* --- Linhas da grade ------------------------------------- */
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth   = LINE_WIDTH;
  ctx.lineCap     = 'round';

  for (let i = 1; i < 3; i++) {
    const x = PADDING + i * CELL;
    const y = PADDING + i * CELL;

    // Vertical
    ctx.beginPath();
    ctx.moveTo(x, PADDING + 10);
    ctx.lineTo(x, SIZE - PADDING - 10);
    ctx.stroke();

    // Horizontal
    ctx.beginPath();
    ctx.moveTo(PADDING + 10, y);
    ctx.lineTo(SIZE - PADDING - 10, y);
    ctx.stroke();
  }

  /* --- Peças ----------------------------------------------- */
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cx = PADDING + col * CELL + CELL / 2;
      const cy = PADDING + row * CELL + CELL / 2;
      const cell = EMOJI_MAP[matrix[row][col]];
      if (!cell) continue;

      if      (cell.t === 'X')    drawX(ctx, cx, cy, CELL / 2);
      else if (cell.t === 'O')    drawO(ctx, cx, cy, CELL / 2);
      else if (cell.t === 'hint') drawHint(ctx, cx, cy, cell.n);
    }
  }

  /* --- Linha vencedora -------------------------------------- */
  if (opts.isWin && opts.winner !== 'SERI') {
    const wl = getWinLine(matrix);
    if (wl) {
      ctx.save();
      ctx.strokeStyle = COLORS.winLine;
      ctx.lineWidth   = 8;
      ctx.lineCap     = 'round';
      ctx.shadowColor = COLORS.winLine;
      ctx.shadowBlur  = 20;

      const start = PADDING + CELL / 2;
      const end   = SIZE - PADDING - CELL / 2;

      ctx.beginPath();
      if (wl.type === 'row') {
        const cy = PADDING + wl.idx * CELL + CELL / 2;
        ctx.moveTo(PADDING + 10, cy);
        ctx.lineTo(SIZE - PADDING - 10, cy);
      } else if (wl.type === 'col') {
        const cx = PADDING + wl.idx * CELL + CELL / 2;
        ctx.moveTo(cx, PADDING + 10);
        ctx.lineTo(cx, SIZE - PADDING - 10);
      } else if (wl.type === 'diag' && wl.idx === 0) {
        ctx.moveTo(PADDING + 10, PADDING + 10);
        ctx.lineTo(SIZE - PADDING - 10, SIZE - PADDING - 10);
      } else {
        ctx.moveTo(SIZE - PADDING - 10, PADDING + 10);
        ctx.lineTo(PADDING + 10, SIZE - PADDING - 10);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  /* --- Banner de status no topo ---------------------------- */
  let statusText = '';
  let statusColor = COLORS.title;

  if (opts.isWin) {
    if (opts.winner === 'SERI') {
      statusText  = '🤝 EMPATE!';
      statusColor = '#f8c500';
    } else {
      statusText  = `${opts.winner === 'X' ? '❌' : '⭕'} VENCEU!`;
      statusColor = opts.winner === 'X' ? COLORS.X : COLORS.O;
    }
  } else if (opts.turn) {
    statusText  = `Vez de ${opts.turn === 'X' ? '❌ X' : '⭕ O'}`;
    statusColor = opts.turn === 'X' ? COLORS.X : COLORS.O;
  }

  if (statusText) {
    // Fundo da barra
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, PADDING, 6, SIZE - PADDING * 2, 30, 10);
    ctx.fill();

    ctx.fillStyle = statusColor;
    ctx.font      = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(statusText, SIZE / 2, 21);
  }

  return canvas.toBuffer('image/png');
}

module.exports = { generateBoard };
