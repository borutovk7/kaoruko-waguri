// FIX: memedroid.com retorna 403 com user-agent simples
// Usando headers mais completos + fallback para meme-api (reddit memes)
const axios = require('axios');
const cheerio = require('cheerio');

const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

async function memesDroid() {
  // Tentativa 1: memedroid com headers completos
  try {
    const res = await axios.get(
      'https://pt.memedroid.com/memes/latest?ts=' + randomIntFromInterval(1567359809, 1667395806),
      {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "accept-language": "pt-BR,pt;q=0.9,en;q=0.8",
          "accept-encoding": "gzip, deflate, br",
          "connection": "keep-alive",
          "upgrade-insecure-requests": "1"
        },
        timeout: 10000
      }
    );
    const $ = cheerio.load(res.data);
    const dados = [];
    $('.gallery-item').each((i, e) => {
      const json = {
        criadorScrapper: '@nezsab-team.exe',
        titulo: $(e).find('a[class="item-header-title dyn-link"]').text()?.trim() || '',
        imagem: $(e).find('img:first').attr('src'),
        link: 'https://pt.memedroid.com' + $(e).find('a[class="item-header-title dyn-link"]').attr('href')
      };
      if (json.imagem && json.imagem.includes("memedroid")) dados.push(json);
    });
    if (dados.length > 0) return { status: res.status, resultado: dados };
    throw new Error('0 itens do memedroid');
  } catch (_) {}

  // Fallback: meme-api (Reddit memes, sempre funciona)
  const res = await axios.get('https://meme-api.com/gimme/programmerhumor/10', { timeout: 10000 });
  const dados = (res.data.memes || []).map(m => ({
    criadorScrapper: '@nezsab-team.exe',
    titulo: m.title,
    imagem: m.url,
    link: m.postLink
  }));
  return { status: 200, resultado: dados };
}

module.exports = { memesDroid };
