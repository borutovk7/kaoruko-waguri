/**
 * ===============================
 *  KAORUKO WAGURI — PAINEL DO DONO
 * ===============================
 */

const KAORUKO_QUOTES = [
  "Mesmo que o mundo te ignore, eu sempre vou te ver.",
  "Você não precisa ser forte o tempo todo. Eu estou aqui.",
  "Meu coração acelera só de saber que você está por perto.",
  "Não importa o que aconteça, eu nunca vou te abandonar.",
  "Você é a pessoa mais importante que já apareceu na minha vida.",
  "Às vezes basta um sorriso seu para o meu dia mudar completamente.",
  "Eu não sei expressar bem, mas sinto muito por você.",
  "Você me faz querer ser uma versão melhor de mim mesma.",
  "Mesmo em silêncio, estar ao seu lado já é o suficiente.",
  "Não precisa de palavras bonitas. Só fique.",
  "Eu guardo cada memória nossa como se fosse um tesouro.",
  "Você apareceu e de repente tudo fez sentido.",
  "Meu sorriso mais verdadeiro é aquele que você provoca.",
  "Não sei se é coragem ou loucura, mas eu escolho você.",
  "Você transforma lugares comuns em lugares especiais.",
  "Cada vez que penso em você, algo floresce aqui dentro.",
  "Não preciso de aventuras se você estiver do meu lado.",
  "Você é aquele tipo de pessoa que fica na memória para sempre.",
  "Me sinto em casa quando estou perto de você.",
  "Às vezes o coração sabe antes da cabeça.",
  "Você me faz sentir coisas que eu nem sabia que existiam.",
  "Prefiro um momento real com você a mil sonhos sozinha.",
  "Você não percebe, mas ilumina tudo ao seu redor.",
  "Fico nervosa, fico quieta, mas nunca consigo te ignorar.",
  "Você é o tipo de pessoa que inspira só de existir.",
  "Não preciso que o mundo inteiro me entenda. Só você.",
  "Com você aprendi que vulnerabilidade pode ser bonita.",
  "Você é a exceção para quase todas as minhas regras.",
  "Não sei o que o futuro guarda, mas espero que você esteja nele.",
  "Você chegou quietinho e ocupou um espaço enorme em mim.",
  "Mesmo com tudo errado ao redor, você me acalma.",
  "Você é difícil de descrever, mas impossível de esquecer.",
  "Quando estou com você, até o silêncio tem cor.",
  "Não preciso de um conto de fadas. Só preciso de você.",
  "Você é o tipo raro que faz o coração bater diferente.",
  "Às vezes um olhar seu vale mais que mil palavras.",
  "Você é a razão pela qual eu ainda acredito nas pessoas.",
  "Me perco nos meus pensamentos e sempre termino em você.",
  "Você tem um jeito de aparecer bem quando eu mais preciso.",
  "Não me arrependo de nada que senti por você.",
  "Cada detalhe seu ficou gravado em mim sem eu perceber.",
  "Você faz parte dos momentos que eu nunca quero esquecer.",
  "Com você até as coisas simples se tornam especiais.",
  "Você é a calmaria e a tempestade ao mesmo tempo.",
  "Não quero te impressionar. Só quero que você fique.",
  "Você transformou minha rotina em algo que vale a pena.",
]

const getRandomKaorukoQuote = () => {
  return KAORUKO_QUOTES[Math.floor(Math.random() * KAORUKO_QUOTES.length)]
}

/**
 * Painel do Dono — Kaoruko Waguri
 */
const infodono = (
  tempo,
  tempoEmoji,
  sender,
  ownerName,
  numeroDono,
  nomeBot,
  prefix
) => {
  const userId = sender.split("@")[0]
  const donoId = numeroDono.split("@")[0]
  const quote = getRandomKaorukoQuote()

  return `
「 🪷 𝐊𝐀𝐎𝐑𝐔𝐊𝐎 𝐖𝐀𝐆𝐔𝐑𝐈 🪷 」

╭┈ׅׄ┉ׅ-━━ׁ𑁁━፝֟━̷━ׁ۫━━┈ׅׄ┉ׅ-╮
┃֪࣪᥀·࣭࣪🪷 ${tempo} ${tempoEmoji} @${userId}
╰ׅ┈ׅׄ┉-ׅ━━ׁ━፝֟━̷━ׁ۫━━┈ׅׄ┉ׅ-╯

「 🪷 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐂̧𝐎̃𝐄𝐒 🪷 」

╭┈ׅׄ┉ׅ-━━ׁ𑁁━፝֟━̷━ׁ۫━━┈ׅׄ┉ׅ-╮
᥀·࣭࣪̇˖🪷◗ 𝐃𝐎𝐍𝐎: ${ownerName}
᥀·࣭࣪̇˖🪷◗ 𝐂𝐎𝐍𝐓𝐀𝐓𝐎: wa.me/${donoId}
᥀·࣭࣪̇˖🪷◗ 𝐁𝐎𝐓: ${nomeBot}
᥀·࣭࣪̇˖🪷◗ 𝐏𝐑𝐄𝐅𝐈𝐗𝐎: ${prefix}
╰ׅ┈ׅׄ┉-ׅ━━ׁ━፝֟━̷━ׁ۫━━┈ׅׄ┉ׅ-╯

「 🪷 𝐊𝐀𝐎𝐑𝐔𝐊𝐎 𝐃𝐈𝐙 🪷 」

╭┈ׅׄ┉ׅ-━━ׁ𑁁━፝֟━̷━ׁ۫━━┈ׅׄ┉ׅ-╮
᥀·࣭    "${quote}"
╰ׅ┈ׅׄ┉-ׅ━━ׁ━፝֟━̷━ׁ۫━━┈ׅׄ┉ׅ-╯

𝐊𝐀𝐎𝐑𝐔𝐊𝐎 𝐖𝐀𝐆𝐔𝐑𝐈 🪷
`
}

module.exports = {
  infodono,
  getRandomKaorukoQuote
}