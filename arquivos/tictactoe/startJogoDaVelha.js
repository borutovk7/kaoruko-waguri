const fs = require('fs');
const { setGame, validmove, generateBoard, delGame } = require('./tictactoe/index');

/* ── Helpers de JID ─────────────────────────────────────── */
function toClean(jid) {
    return convertWhatsAppUser(jid, 'jid').replace('@s.whatsapp.net', '');
}

function toJid(clean) {
    return `${clean}@s.whatsapp.net`;
}

/* ── Envia imagem do tabuleiro (Baileys) ────────────────── */
async function sendBoardImage(buffer, caption, mentionJids = []) {
    await conn.sendMessage(from, {
        image:    buffer,
        caption:  caption,
        mimetype: 'image/png',
        mentions: mentionJids,   // Baileys destaca os @mencionados na legenda
    });
}

/* ── Texto do status (turno / vitória) ──────────────────── */
function statusCaption(boardnow, playerX_Jid, playerO_Jid) {
    if (boardnow.isWin) {
        if (boardnow.winner === 'SERI') return '🤝 Empate! Ninguém venceu desta vez.';
        const w = boardnow.winner === 'X' ? playerX_Jid : playerO_Jid;
        return `🏆 Parabéns @${w}, você venceu! 🎯`;
    }
    const vez = boardnow.turn === 'X' ? playerX_Jid : playerO_Jid;
    return `🎮 Vez de @${vez} — envie um número de 1 a 9.`;
}

/* ══════════════════════════════════════════════════════════
   HANDLER PRINCIPAL
══════════════════════════════════════════════════════════ */
async function startJogoDaVelha() {
    // Verifica participação nos arrays de controle
    if (!joguinhodavelhajs2.includes(from) && !joguinhodavelhajs.includes(sender)) return;

    const cmde        = budy.toLowerCase().split(' ')[0] || '';
    const senderClean = toClean(sender);
    const arrNum      = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    if (!fs.existsSync(`./arquivos/tictactoe/db/${from}.json`)) return;

    const boardnow = setGame(from);
    if (!boardnow) return;

    const playerX_Jid = toClean(boardnow.X);
    const playerO_Jid = toClean(boardnow.O);

    /* ════════════════════════════════════════════════
       ACEITAR / RECUSAR DESAFIO
    ════════════════════════════════════════════════ */
    if (!boardnow.status && playerO_Jid === senderClean) {

        if (['s', 'sim', 'ok'].includes(budy.toLowerCase())) {
            boardnow.status = true;
            fs.writeFileSync(
                `./arquivos/tictactoe/db/${from}.json`,
                JSON.stringify(boardnow, null, 2)
            );

            // Gera imagem inicial do tabuleiro
            const imgBuffer = generateBoard(boardnow._matrix, {
                turn:   boardnow.turn,
                isWin:  false,
            });

            const caption =
                `*🎮 Jogo da Velha iniciado!*\n` +
                `@${playerX_Jid} joga ❌\n` +
                `@${playerO_Jid} joga ⭕\n` +
                `—\n` +
                `Vez de @${playerX_Jid} — envie um número de 1 a 9.`;

            const mentionsStart = [toJid(playerX_Jid), toJid(playerO_Jid)];
            return await sendBoardImage(imgBuffer, caption, mentionsStart);

        } else if (['n', 'não', 'no'].includes(budy.toLowerCase())) {
            await mention(`@${playerX_Jid}, seu oponente não aceitou o desafio! ❌`);
            return resetPartida(from, sender);
        }
    }

    /* ════════════════════════════════════════════════
       JOGADAS (1-9)
    ════════════════════════════════════════════════ */
    if (arrNum.includes(cmde)) {
        if (!boardnow.status) return reply('Seu oponente ainda não aceitou o desafio.');

        // Verifica se é a vez do jogador
        const vezDeJid = boardnow.turn === 'X' ? playerX_Jid : playerO_Jid;
        if (vezDeJid !== senderClean) return;

        const moving = validmove(Number(cmde), from);
        if (!moving || moving.status === false) return reply(moving?.message || 'Jogada inválida.');

        const imgBuffer = generateBoard(moving._matrix, {
            turn:   moving.turn,
            isWin:  moving.isWin,
            winner: moving.winner,
        });

        const mentions = [toJid(playerX_Jid), toJid(playerO_Jid)];

        /* ── Fim de jogo ── */
        if (moving.isWin) {
            const caption = statusCaption(moving, playerX_Jid, playerO_Jid);
            await sendBoardImage(imgBuffer, caption, mentions);

            // Remove arquivo após 5 minutos (mantém histórico visual por um tempo)
            setTimeout(() => delGame(from), 300_000);
            return resetPartida(from, sender);
        }

        /* ── Continua ── */
        const caption =
            `*@${playerX_Jid}* ❌  VS  ⭕ *@${playerO_Jid}*\n` +
            statusCaption(moving, playerX_Jid, playerO_Jid);

        return await sendBoardImage(imgBuffer, caption, mentions);
    }
}

/* ══════════════════════════════════════════════════════════
   RESET DE PARTIDA
══════════════════════════════════════════════════════════ */
function resetPartida(groupId, userSender) {
    delGame(groupId);

    joguinhodavelhajs  = joguinhodavelhajs.filter(id => id !== userSender);
    joguinhodavelhajs2 = joguinhodavelhajs2.filter(id => id !== groupId);

    fs.writeFileSync(
        './database/usuarios/joguinhodavelha.json',
        JSON.stringify(joguinhodavelhajs)
    );
    fs.writeFileSync(
        './database/usuarios/joguinhodavelha2.json',
        JSON.stringify(joguinhodavelhajs2)
    );
}
