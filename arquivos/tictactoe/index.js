

const fs   = require('fs');
const path = require('path');

const { generateBoard } = require('./canvasBoard.js');

/* ============================================================
   CONFIGURAÇÃO DE DIRETÓRIO
============================================================ */
const DB_PATH = './arquivos/tictactoe/db/';
if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH, { recursive: true });

/* ============================================================
   FUNÇÕES DE PERSISTÊNCIA (SALVAR/LER)
============================================================ */
function defineSave(obj, session) {
    const filePath = path.join(DB_PATH, `${session}.json`);
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
}

function setGame(session) {
    const filePath = path.join(DB_PATH, `${session}.json`);
    if (!fs.existsSync(filePath)) {
        const matrix = [
            ['1️⃣', '2️⃣', '3️⃣'],
            ['4️⃣', '5️⃣', '6️⃣'],
            ['7️⃣', '8️⃣', '9️⃣'],
        ];
        const objtic = {
            status: true,
            session,
            turn: 'X',
            X: null,
            O: null,
            isWin: false,
            winner: null,
            nine_push: [],
            _matrix: matrix,
        };
        defineSave(objtic, session);
        return objtic;
    } else {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch {
            return null;
        }
    }
}

/* ============================================================
   LÓGICA DE VERIFICAÇÃO DE VITÓRIA
============================================================ */
function checkWinner(m) {
    for (let i = 0; i < 3; i++) {
        if (m[i][0] === m[i][1] && m[i][1] === m[i][2]) return m[i][0];
        if (m[0][i] === m[1][i] && m[1][i] === m[2][i]) return m[0][i];
    }
    if (m[0][0] === m[1][1] && m[1][1] === m[2][2]) return m[0][0];
    if (m[0][2] === m[1][1] && m[1][1] === m[2][0]) return m[1][1];
    return false;
}

/* ============================================================
   MOVIMENTAÇÃO E VALIDAÇÃO
============================================================ */
function move(x, y, session) {
    const moving = setGame(session);
    if (!moving) return { status: false, message: 'Erro ao carregar sessão.' };

    if (moving.isWin) {
        return { status: false, message: 'O jogo já foi finalizado.' };
    }

    const currentPos = moving._matrix[x][y];
    if (currentPos === '❌' || currentPos === '⭕') {
        return { status: false, message: `Posição já ocupada por ${currentPos}` };
    }

    const icon = moving.turn === 'X' ? '❌' : '⭕';
    moving._matrix[x][y] = icon;
    moving.nine_push.push(icon);

    const result = checkWinner(moving._matrix);

    if (result === '❌' || result === '⭕') {
        moving.isWin = true;
        moving.winner = result === '❌' ? 'X' : 'O';
    } else if (moving.nine_push.length >= 9) {
        moving.isWin = true;
        moving.winner = 'SERI';
    } else {
        moving.turn = moving.turn === 'X' ? 'O' : 'X';
    }

    defineSave(moving, session);
    return moving;
}

function validmove(number, session) {
    const n = Number(number);
    if (isNaN(n) || n < 1 || n > 9) return false;

    const coords = {
        1: [0, 0], 2: [0, 1], 3: [0, 2],
        4: [1, 0], 5: [1, 1], 6: [1, 2],
        7: [2, 0], 8: [2, 1], 9: [2, 2],
    };
    const [x, y] = coords[n];
    return move(x, y, session);
}

module.exports = {
    setGame,
    validmove,
    generateBoard,  // ← exportado diretamente para uso no bot
    delGame: (session) => {
        const filePath = path.join(DB_PATH, `${session}.json`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    },
};
