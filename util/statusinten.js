/* ── Mapa de cores ── */
const coresMapa = {
  preto: '#000000', branco: '#FFFFFF', vermelho: '#FF0000',
  azul: '#1DA1F2', verde: '#25D366', amarelo: '#FFD700',
  roxo: '#7B2FBE', rosa: '#FF69B4', laranja: '#FF8C00',
  cinza: '#808080', ciano: '#00BCD4', marrom: '#795548',
  lilas: '#CE93D8', turquesa: '#00897B', indigo: '#3949AB'
}

/* ── Mapa de fontes ── */
const fontesMapa = {
  '0': 0, 'padrao': 0, 'padrão': 0,
  '1': 1, 'serif': 1,
  '2': 2, 'cursiva': 2,
  '3': 3, 'manuscrita': 3,
  '4': 4, 'grossa': 4,
  '5': 5, 'condensada': 5
}

const parseStatusArgs = (q = '') => {
  let cor = '#000000'
  let fonte = 2
  let texto = q.trim()

  texto = texto.replace(/cor=(\S+)/i, (_, v) => {
    cor = coresMapa[v.toLowerCase()] || (v.startsWith('#') ? v : cor)
    return ''
  })
  texto = texto.replace(/fonte=(\S+)/i, (_, v) => {
    fonte = fontesMapa[v.toLowerCase()] ?? 2
    return ''
  })

  texto = texto.replace(/^(#[0-9a-fA-F]{3,6})\s*/, (_, v) => {
    cor = v; return ''
  })

  const primeiraPalavra = texto.split(' ')[0]?.toLowerCase()
  if (coresMapa[primeiraPalavra]) {
    cor = coresMapa[primeiraPalavra]
    texto = texto.replace(primeiraPalavra, '').trim()
  }

  return { cor, fonte, texto: texto.trim() }
}

module.exports = { fontesMapa, parseStatusArgs, coresMapa };
