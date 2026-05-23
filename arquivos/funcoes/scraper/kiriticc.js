const { axios, default_criador } = require('./defaults.js');

// FIX: shinoa.us.kg estava fora do ar — usando APIs alternativas confiáveis

const tiktokurl = async (url) => {
  // Tentativa 1: tikwm.com (API pública mais estável para TikTok)
  try {
    const res = await axios.post(
      'https://www.tikwm.com/api/',
      new URLSearchParams({ url, count: 12, cursor: 0, web: 1, hd: 1 }),
      { headers: { 'content-type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
    );
    if (res.data?.code === 0) return res.data.data;
    throw new Error('tikwm sem dados');
  } catch (_) {}

  // Tentativa 2: ssstik via form
  try {
    const cheerio = require('cheerio');
    const cookieRes = await axios.get('https://ssstik.io/pt', {
      timeout: 8000,
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(cookieRes.data);
    const tt = $('input[name="tt"]').val();
    const res2 = await axios.post(
      'https://ssstik.io/abc?url=dl',
      new URLSearchParams({ id: url, locale: 'pt', tt }),
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'origin': 'https://ssstik.io',
          'referer': 'https://ssstik.io/pt',
          'user-agent': 'Mozilla/5.0',
          'cookie': cookieRes.headers['set-cookie']?.join('; ') || ''
        },
        timeout: 15000
      }
    );
    const $2 = cheerio.load(res2.data);
    const videoUrl = $2('a.pure-button').first().attr('href');
    if (videoUrl) return { video_url: videoUrl, source: 'ssstik' };
    throw new Error('ssstik sem link');
  } catch (error) {
    throw new Error(`Erro ao baixar TikTok: ${error.message}`);
  }
};

const dl_vidkk = async (url) => {
  // Tentativa 1: tikwm para TikTok URLs
  if (url.includes('tiktok.com')) {
    try {
      const res = await axios.post(
        'https://www.tikwm.com/api/',
        new URLSearchParams({ url, count: 12, cursor: 0, web: 1, hd: 1 }),
        { headers: { 'content-type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
      );
      if (res.data?.code === 0) return res.data.data;
    } catch (_) {}
  }

  // Tentativa 2: ssyoutube.com para YouTube URLs
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    try {
      const cheerio = require('cheerio');
      const videoId = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (videoId) {
        const res = await axios.get(`https://ssyoutube.com/watch?v=${videoId}`, {
          headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
          },
          timeout: 15000,
          maxRedirects: 5
        });
        const $ = cheerio.load(res.data);
        const links = [];
        $('a[href*="download"], a[href*="mp4"], a[href*="mp3"]').each((i, e) => {
          const href = $(e).attr('href');
          if (href && href.startsWith('http')) {
            links.push({ quality: $(e).text().trim() || `Link ${i+1}`, url: href });
          }
        });
        if (links.length > 0) return { status: 'ok', links, source: 'ssyoutube' };
      }
    } catch (_) {}
  }

  // Tentativa 3: 9xbuddy como fallback genérico
  try {
    const cheerio = require('cheerio');
    const res = await axios.get(`https://9xbuddy.in/process?url=${encodeURIComponent(url)}`, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });
    if (typeof res.data === 'object' && (res.data?.url || res.data?.urls || res.data?.links)) {
      return res.data;
    }
    // Parse HTML
    const $ = cheerio.load(typeof res.data === 'string' ? res.data : '');
    const links = [];
    $('a[href*="download"], a[href*="mp4"]').each((i, e) => {
      const href = $(e).attr('href');
      if (href && href.startsWith('http')) links.push({ quality: $(e).text().trim(), url: href });
    });
    if (links.length > 0) return { status: 'ok', links, source: '9xbuddy' };
    // Return page info as fallback
    return { status: 'ok', info: 'Acesse 9xbuddy.in para baixar', redirect: `https://9xbuddy.in/process?url=${encodeURIComponent(url)}`, source: '9xbuddy' };
  } catch (error) {
    throw new Error(`Erro ao baixar vídeo: ${error.message}`);
  }
};

module.exports = { tiktokurl, dl_vidkk };
