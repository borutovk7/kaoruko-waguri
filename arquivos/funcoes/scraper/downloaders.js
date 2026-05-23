const { axios, cheerio, unescapeHtml, default_criador, useragent_1, removerAcentos, qs } = require('./defaults.js');

//========== Pinterest Video ============\\

const pinterestVideoDownloader = (url) => new Promise((resolve, reject) => {
  axios.get(url, { headers: { ...useragent_1 } })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const json = JSON.parse($('script[data-test-id="video-snippet"]').text());
      resolve({
        status: res.status,
        criador: default_criador,
        titulo: json.name,
        thumb: json.thumbnailUrl,
        video: json.contentUrl
      });
    })
    .catch((e) => reject(e));
});

//========== Instagram Video ============\\
// FIX: igram.world instável — usando fastdl.app como primário + igram como fallback

const instaVideoV1 = (url) => new Promise((resolve, reject) => {
  // Tentativa 1: fastdl.app
  axios.get('https://fastdl.app/', {
      headers: {
        ...useragent_1,
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'pt-BR,pt;q=0.9',
      },
      timeout: 12000
    })
    .then((init) => {
      const $ = cheerio.load(init.data);
      const cookies = init.headers['set-cookie']?.join('; ') || '';
      return axios.post(
        'https://fastdl.app/api/convert',
        qs.stringify({ url }),
        {
          headers: {
            ...useragent_1,
            'content-type': 'application/x-www-form-urlencoded',
            'origin': 'https://fastdl.app',
            'referer': 'https://fastdl.app/',
            'x-requested-with': 'XMLHttpRequest',
            'cookie': cookies
          },
          timeout: 15000
        }
      );
    })
    .then((res) => {
      // fastdl pode retornar JSON ou HTML
      if (res.data?.url || res.data?.medias) {
        const medias = res.data.medias || [{ url: res.data.url }];
        const dados = medias.map((m, i) => ({
          qualidade: m.quality || m.type || `Link ${i + 1}`,
          link_dl: m.url
        })).filter(m => m.link_dl);
        if (dados.length > 0) return resolve({ status: res.status, criador: default_criador, resultado: dados });
      }
      // Parse HTML response
      const html = typeof res.data === 'string' ? res.data : (res.data?.data || '');
      if (html) {
        const $ = cheerio.load(html);
        const dados = [];
        $('a[href*="cdninstagram"], a[href*="fbcdn"], a.download-link, a[class*="download"]').each((i, e) => {
          const href = $(e).attr('href');
          if (href && href.startsWith('http')) {
            dados.push({
              qualidade: $(e).text().trim() || `Link ${i + 1}`,
              link_dl: href
            });
          }
        });
        if (dados.length > 0) return resolve({ status: res.status, criador: default_criador, resultado: dados });
      }
      throw new Error('fastdl sem resultados');
    })
    .catch(() => {
      // Fallback: igram.world
      axios.get('https://igram.world/', {
          headers: {
            ...useragent_1,
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: 12000
        })
        .then((init) => {
          const $ = cheerio.load(init.data);
          const token = $('input[name="_token"], input[name="token"]').val() || '';
          const cookies = init.headers['set-cookie']?.join('; ') || '';
          return axios.post(
            'https://igram.world/api/convert',
            qs.stringify({ url, token }),
            {
              headers: {
                ...useragent_1,
                'content-type': 'application/x-www-form-urlencoded',
                'origin': 'https://igram.world',
                'referer': 'https://igram.world/',
                'x-requested-with': 'XMLHttpRequest',
                'cookie': cookies
              },
              timeout: 15000
            }
          );
        })
        .then((res) => {
          if (res.data?.url || res.data?.medias) {
            const medias = res.data.medias || [{ url: res.data.url }];
            const dados = medias.map((m, i) => ({
              qualidade: m.quality || m.type || `Link ${i + 1}`,
              link_dl: m.url
            })).filter(m => m.link_dl);
            return resolve({ status: res.status, criador: default_criador, resultado: dados });
          }
          const $ = cheerio.load(typeof res.data === 'string' ? res.data : '');
          const dados = [];
          $('a[href*="cdninstagram"], a[href*="fbcdn"], a.download-link, a[class*="download"]').each((i, e) => {
            const href = $(e).attr('href');
            if (href && href.startsWith('http')) {
              dados.push({
                qualidade: $(e).text().trim() || `Link ${i + 1}`,
                link_dl: href
              });
            }
          });
          resolve({ status: res.status, criador: default_criador, resultado: dados });
        })
        .catch((e) => reject(e));
    });
});

//========== Facebook Downloader ============\\
// FIX: fdown.net e getfvid.com com problemas — usando fdownloader.app API

const facebookDownloader = (url) => new Promise((resolve, reject) => {
  // Tentativa 1: fdownloader.app API
  axios.get('https://fdownloader.app/pt', {
      headers: { ...useragent_1 },
      timeout: 10000
    })
    .then((init) => {
      const cookies = init.headers['set-cookie']?.join('; ') || '';
      return axios.post(
        'https://fdownloader.app/api/ajaxSearch',
        qs.stringify({ q: url, lang: 'pt' }),
        {
          headers: {
            ...useragent_1,
            'content-type': 'application/x-www-form-urlencoded',
            'origin': 'https://fdownloader.app',
            'referer': 'https://fdownloader.app/pt',
            'cookie': cookies
          },
          timeout: 15000
        }
      );
    })
    .then((res) => {
      if (res.data?.status === 'ok' && res.data?.data) {
        const $ = cheerio.load(res.data.data);
        const json = {
          status: 200,
          criador: default_criador,
          titulo: $('h3, .video-title').first().text().trim() || res.data?.title || '',
          thumbnail: $('img').first().attr('src') || '',
          video_sd: '',
          video_hd: ''
        };
        // Parse download links from the HTML table
        $('a[href]').each((i, e) => {
          const href = $(e).attr('href');
          const text = $(e).text().trim().toLowerCase();
          if (href && href.startsWith('http')) {
            if (text.includes('hd') || text.includes('1080') || text.includes('720')) {
              if (!json.video_hd) json.video_hd = href;
            } else {
              if (!json.video_sd) json.video_sd = href;
            }
          }
        });
        if (json.video_sd || json.video_hd) return resolve(json);
      }
      throw new Error('fdownloader sem resultados');
    })
    .catch(() => {
      // Fallback: fdown.net
      axios.get('https://fdown.net/', {
          headers: { ...useragent_1 },
          timeout: 10000
        })
        .then((init) => {
          const cookies = init.headers['set-cookie']?.join('; ') || '';
          return axios.post(
            'https://fdown.net/download.php',
            qs.stringify({ URLz: url }),
            {
              headers: {
                ...useragent_1,
                'content-type': 'application/x-www-form-urlencoded',
                'origin': 'https://fdown.net',
                'referer': 'https://fdown.net/',
                'cookie': cookies
              },
              timeout: 15000
            }
          );
        })
        .then((res) => {
          const $ = cheerio.load(res.data);
          const json = {
            status: res.status,
            criador: default_criador,
            titulo: $('h2, .video-title, h3').first().text().trim() || '',
            thumbnail: $('img.thumbnail, img[class*="thumb"]').attr('src') || '',
            video_sd: $('a#sd_link, a[id*="sd"], a:contains("SD")').first().attr('href') || '',
            video_hd: $('a#hd_link, a[id*="hd"], a:contains("HD")').first().attr('href') || ''
          };
          if (!json.video_sd && !json.video_hd) {
            $('a[href*="video"], a[href*="fbcdn"]').each((i, e) => {
              const href = $(e).attr('href');
              if (href?.startsWith('http') && !json.video_sd) json.video_sd = href;
            });
          }
          if (!json.video_sd && !json.video_hd) return reject(new Error('Nenhum vídeo encontrado'));
          resolve(json);
        })
        .catch((e) => reject(e));
    });
});

module.exports = { pinterestVideoDownloader, instaVideoV1, facebookDownloader };
