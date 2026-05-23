//=============> ======== <==============\\

const {
  axios,
  cheerio,
  unescapeHtml,
  default_criador,
  useragent_1,
  removerAcentos,
  linkfy,
  fs
} = require('./defaults.js')

//==========> Vasco <==========\\
// FIX: vasco.com.br retorna 403 — usando Google News RSS como fonte estável

const Vasco = () => new Promise((resolve, reject) => {
  axios.get(`https://news.google.com/rss/search?q=Vasco+da+Gama+futebol&hl=pt-BR&gl=BR&ceid=BR:pt-419`, {
      headers: {
        ...useragent_1,
        'accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      timeout: 10000
    })
    .then((res) => {
      const $ = cheerio.load(res.data, { xmlMode: true });
      const dados = [];
      $('item').each((i, e) => {
        dados.push({
          noticia: unescapeHtml($(e).find('title').text()),
          imagem: '',
          desc: unescapeHtml($(e).find('description').text()?.replace(/<[^>]+>/g, '').slice(0, 200)),
          link: $(e).find('link').text() || $(e).find('guid').text()
        });
      });
      resolve({
        status: res.status,
        fonte: 'https://news.google.com/ (Vasco)',
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => { reject(e) });
});

//==========> G1 Globo <==========\\

const G1 = () => new Promise((resolve, reject) => {
  axios.get(`https://g1.globo.com/`, {
      headers: { ...useragent_1 }
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      $('.type-materia').each((i, e) => {
        dados.push({
          noticia: $(e).find('a:first').text(),
          imagem: $(e).find('img').attr('src') || '',
          desc: $(e).find('.feed-post-body-resumo:first').text() || '',
          categoria: $(e).find('.feed-post-metadata-section:first').text()?.trim(),
          link: $(e).find('a:first').attr('href'),
          postado: $(e).find('span.feed-post-datetime:first').text()
        });
      });
      resolve({
        status: res.status,
        fonte: 'https://g1.globo.com/',
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => { reject(e) });
});

//==========> Poder 360 <==========\\

const Poder360 = () => new Promise((resolve, reject) => {
  axios.get(`https://www.poder360.com.br/`, {
      headers: { ...useragent_1 }
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      $('.box-news-list__news').each((i, e) => {
        dados.push({
          noticia: $(e).find('h2 > a').text(),
          imagem: $(e).find('img').attr('srcset') || $(e).find('img').attr('src'),
          link: $(e).find('h2 > a').attr('href')
        });
      });
      resolve({
        status: res.status,
        fonte: 'https://www.poder360.com.br/',
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => { reject(e) });
});

//==========> Jovem Pan <==========\\

const JovemPan = () => new Promise((resolve, reject) => {
  axios.get(`https://jovempan.com.br/`, {
      headers: { ...useragent_1 }
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      $('div.featured-news').each((i, e) => {
        dados.push({
          noticia: unescapeHtml($(e).find('p.title').text()?.trim()),
          imagem: $(e).find('img').attr('src'),
          link: $(e).find('a').attr('href')
        });
      });
      $('div.news-small').each((i, e) => {
        if ($(e).find('a').attr('href')) {
          dados.push({
            noticia: unescapeHtml($(e).find('p.title').text() || $(e).find('p.title-edicase').text()),
            imagem: $(e).find('img').attr('src'),
            categoria: $(e).find('h6.category').text()?.trim() || $(e).find('h6.category-edicase').text()?.trim(),
            link: $(e).find('a').attr('href')
          });
        };
      });
      $('a.item').each((i, e) => {
        dados.push({
          noticia: unescapeHtml($(e).find('p.title').text()?.trim()),
          imagem: $(e).find('img').attr('src'),
          categoria: $(e).find('h6.category').text()?.trim(),
          link: $(e).attr('href')
        });
      });
      resolve({
        status: res.status,
        fonte: 'https://jovempan.com.br/',
        criador: default_criador,
        resultado: dados.filter(a => a.noticia && a.link?.includes('jovempan'))
      });
    })
    .catch((e) => { reject(e) });
});

//==========> UOL <==========\\
// FIX: seletor accordion__item não existe mais — usando headlineSub

const Uol = () => new Promise((resolve, reject) => {
  axios.get(`https://www.uol.com.br/`, {
      headers: { ...useragent_1 }
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      const seen = new Set();
      // Seletor primário: headlineSub (novo layout)
      $('a.headlineSub__link').each((i, e) => {
        const link = $(e).attr('href');
        const noticia = unescapeHtml($(e).find('.title__element').text()?.trim());
        const imagem = $(e).find('img').attr('src') || $(e).find('img').attr('data-src') || '';
        if (noticia && link && !seen.has(link)) {
          seen.add(link);
          dados.push({ noticia, imagem, link });
        }
      });
      // Seletor secundário: headlineHorizontalAvatar
      $('a.hyperlink.headlineHorizontalAvatar__link').each((i, e) => {
        const link = $(e).attr('href');
        const noticia = unescapeHtml($(e).find('.headlineHorizontalAvatar__content__title').text()?.trim());
        const imagem = $(e).find('img').attr('src') || '';
        if (noticia && link && !seen.has(link)) {
          seen.add(link);
          dados.push({ noticia, imagem, link });
        }
      });
      // Fallback: accordion__item (layout antigo)
      if (dados.length === 0) {
        $('li.accordion__item').each((i, e) => {
          dados.push({
            noticia: unescapeHtml($(e).find('a').attr('title')),
            imagem: $(e).find('img').attr('src'),
            link: $(e).find('a').attr('href')
          });
        });
      }
      resolve({
        status: res.status,
        fonte: 'https://www.uol.com.br/',
        criador: default_criador,
        resultado: dados.filter(a => a.noticia && a.link)
      });
    })
    .catch((e) => { reject(e) });
});

//==========> CNN Brasil <==========\\
// FIX: site redesenhado com Tailwind — usando h3 a / h2 a como seletores

const CNNBrasil = () => new Promise((resolve, reject) => {
  axios.get(`https://www.cnnbrasil.com.br/`, {
      headers: { ...useragent_1 }
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      const seen = new Set();
      $('h3 a, h2 a').each((i, e) => {
        const link = $(e).attr('href');
        const noticia = unescapeHtml($(e).text()?.trim());
        if (!noticia || !link || !link.includes('cnnbrasil.com.br') || seen.has(link)) return;
        seen.add(link);
        const parent = $(e).closest('section, div.group, li');
        const img = parent.find('img').first();
        dados.push({
          noticia,
          imagem: img.attr('src') || img.attr('data-src') || '',
          link: link.startsWith('http') ? link : 'https://www.cnnbrasil.com.br' + link
        });
      });
      resolve({
        status: res.status,
        fonte: 'https://www.cnnbrasil.com.br/',
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => { reject(e) });
});

//==========> Estadão <==========\\

const Estadao = () => new Promise((resolve, reject) => {
  axios.get(`https://www.estadao.com.br/`, {
      headers: { ...useragent_1 }
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      $('div.noticia-single-block').each((i, e) => {
        dados.push({
          noticia: unescapeHtml($(e).find('a:first').attr('title')),
          imagem: 'https://www.estadao.com.br' + $(e).find('img').attr('src'),
          desc: $(e).find('div.subheadline').text(),
          link: $(e).find('.chapeu > a').attr('href')
        });
      });
      resolve({
        status: res.status,
        fonte: 'https://www.estadao.com.br/',
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => { reject(e) });
});

//==========> Terra <==========\\

const Terra = () => new Promise((resolve, reject) => {
  axios.get(`https://www.terra.com.br/noticias/`, {
      headers: { ...useragent_1 }
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      $('div[class="card card-news card-h-small  card-has-image  "]').each((i, e) => {
        dados.push({
          noticia: unescapeHtml($(e).find('a.card-news__text--title').text()),
          imagem: $(e).find('img').attr('src'),
          link: $(e).find('a.card-news__text--title').attr('href')
        });
      });
      resolve({
        status: res.status,
        fonte: 'https://www.terra.com.br/noticias/',
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => { reject(e) });
});

//==========> Exame <==========\\
// FIX: usando RSS que é estável

const Exame = () => new Promise((resolve, reject) => {
  axios.get(`https://exame.com/feed/`, {
      headers: { ...useragent_1 }
    })
    .then((res) => {
      const $ = cheerio.load(res.data, { xmlMode: true });
      const dados = [];
      $('item').each((i, e) => {
        dados.push({
          noticia: unescapeHtml($(e).find('title').text()),
          imagem: $(e).find('enclosure').attr('url') ||
                  $(e).find('media\\:content, content').attr('url') || '',
          postado: $(e).find('pubDate').text()?.trim(),
          categoria: $(e).find('category').first().text()?.trim() || '',
          link: $(e).find('link').text() || $(e).find('guid').text()
        });
      });
      resolve({
        status: res.status,
        fonte: 'https://exame.com/',
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => { reject(e) });
});

//==========> Notícias Ao Minuto <==========\\
// FIX: usando RSS — estrutura HTML muda frequentemente

const NoticiasAoMinuto = () => new Promise((resolve, reject) => {
  axios.get(`https://www.noticiasaominuto.com.br/rss/ultima-hora`, {
      headers: { ...useragent_1 }
    })
    .then((res) => {
      const $ = cheerio.load(res.data, { xmlMode: true });
      const dados = [];
      $('item').each((i, e) => {
        dados.push({
          noticia: unescapeHtml($(e).find('title').text()),
          imagem: $(e).find('enclosure').attr('url') ||
                  $(e).find('media\\:content').attr('url') || '',
          postado: $(e).find('pubDate').text()?.trim(),
          categoria: $(e).find('category').first().text()?.trim() || '',
          link: $(e).find('link').text() || $(e).find('guid').text()
        });
      });
      resolve({
        status: res.status,
        fonte: 'https://www.noticiasaominuto.com.br/',
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => { reject(e) });
});

//==========> Veja Abril <==========\\

const VejaAbril = () => new Promise((resolve, reject) => {
  axios.get(`https://veja.abril.com.br/`, {
      headers: { ...useragent_1 }
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      $('a[class="card a"]').each((i, e) => {
        dados.push({
          noticia: unescapeHtml($(e).find('.title').text()),
          imagem: $(e).find('img').attr('data-src') || 'https://telegra.ph/file/2003e814c68cf402903cf.jpg',
          categoria: $(e).find('.category:first').text(),
          link: $(e).attr('href')
        });
      });
      resolve({
        status: res.status,
        fonte: 'https://veja.abril.com.br/',
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => { reject(e) });
});

//==========> A Gazeta <==========\\
// FIX: agazeta.com.br/feed retorna 403 — usando Google News RSS como fonte estável

const AGazeta = () => new Promise((resolve, reject) => {
  axios.get(`https://news.google.com/rss/search?q=site:agazeta.com.br&hl=pt-BR&gl=BR&ceid=BR:pt-419`, {
      headers: {
        ...useragent_1,
        'accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      timeout: 10000
    })
    .then((res) => {
      const $ = cheerio.load(res.data, { xmlMode: true });
      const dados = [];
      $('item').each((i, e) => {
        dados.push({
          noticia: unescapeHtml($(e).find('title').text()),
          desc: unescapeHtml($(e).find('description').text()?.replace(/<[^>]+>/g, '').slice(0, 200)),
          imagem: '',
          categoria: $(e).find('category').first().text()?.trim() || '',
          link: $(e).find('link').text() || $(e).find('guid').text()
        });
      });
      resolve({
        status: res.status,
        fonte: 'https://www.agazeta.com.br/',
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => { reject(e) });
});

//==========> BBC <==========\\
// FIX: usando RSS oficial estável

const BBC = () => new Promise((resolve, reject) => {
  axios.get(`https://feeds.bbci.co.uk/portuguese/rss.xml`, {
      headers: { ...useragent_1 }
    })
    .then((res) => {
      const $ = cheerio.load(res.data, { xmlMode: true });
      const dados = [];
      $('item').each((i, e) => {
        dados.push({
          noticia: unescapeHtml($(e).find('title').text()),
          desc: unescapeHtml($(e).find('description').text()?.replace(/<[^>]+>/g, '').trim()),
          imagem: $(e).find('media\\:thumbnail').attr('url') ||
                  $(e).find('media\\:content').attr('url') || '',
          link: $(e).find('link').text() || $(e).find('guid').text()
        });
      });
      resolve({
        status: res.status,
        fonte: 'https://www.bbc.com/portuguese',
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => { reject(e) });
});

//==========> Todas Notícias <==========\\

const TodaNoticias = () => new Promise((resolve, reject) => {
  const fontes = [G1(), Poder360(), JovemPan(), Uol(), CNNBrasil(), Estadao(), Terra(), Exame(), NoticiasAoMinuto(), VejaAbril(), BBC(), AGazeta(), Vasco()];
  Promise.allSettled(fontes)
    .then((results) => {
      const dados = [];
      for (const r of results) {
        if (r.status === 'fulfilled') {
          dados.push(...(r.value.resultado || []).slice(0, 20));
        }
      }
      resolve({
        status: dados.length >= 0,
        criador: default_criador,
        resultado: dados.shuffle()
      });
    })
    .catch((e) => { reject(e) });
});

module.exports = {}
module.exports.BBC = BBC
module.exports.CNNBrasil = CNNBrasil
module.exports.Estadao = Estadao
module.exports.Exame = Exame
module.exports.G1 = G1
module.exports.JovemPan = JovemPan
module.exports.NoticiasAoMinuto = NoticiasAoMinuto
module.exports.Poder360 = Poder360
module.exports.Terra = Terra
module.exports.Uol = Uol
module.exports.VejaAbril = VejaAbril
module.exports.Vasco = Vasco
module.exports.AGazeta = AGazeta
module.exports.TodaNoticias = TodaNoticias
