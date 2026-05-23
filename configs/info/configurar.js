const configbot = (prefix) => {
  return `
🌌 *CENTRAL DE CONFIGURAÇÃO - KAORUKO WAGURI* 🌌
_Ajuste o seu bot com a precisão de um astrônomo e a gentileza de uma flor._

✨ *COMO SE TORNAR O DONO:*
Primeiro, ligue o bot no Termux. No WhatsApp do bot, envie os comandos abaixo em uma conversa privada.

🔭 *PASSO 1: IDENTIDADE DO BOT*
Defina o nome que brilhará no seu bot:
\`${prefix}nome-bot [Nome desejado]\`
_Dica: Você pode usar letras modificadas para dar um toque especial!_

🌟 *PASSO 2: SEU NICKNAME*
Defina como você será chamado:
\`${prefix}nick-dono [Seu Nick]\`

🛰️ *PASSO 3: NÚMERO DO DONO (CRUCIAL)*
Configure o número que terá o controle total:
\`${prefix}numero-dono 55xxxxxx\`

⚠️ *IMPORTANTE:*
- O número deve ser digitado tudo junto.
- *NÃO* use o símbolo de + nem -.
- *NÃO* inclua o 9 extra da operadora (use o formato idêntico ao que aparece no WhatsApp).
- *DICA:* Use o próprio WhatsApp do bot para configurar o número do dono inicial.

💠 *PASSO 4: PREFIXO DO BOT*
Mude o símbolo de comando (ex: de ! para #):
\`${prefix}prefixo-bot #\`
_Após mudar, todos os comandos passarão a usar o novo símbolo._

🖼️ *PASSO 5: FOTO DO MENU*
Dê um novo visual ao seu menu:
\`${prefix}fotomenu\`
_Basta enviar uma imagem e responder (marcar) ela com este comando._

🌸 *Lembre-se: O que realmente importa é a atenção aos detalhes. Configure com calma para que tudo floresça perfeitamente!* ✨
`
}

exports.configbot = configbot