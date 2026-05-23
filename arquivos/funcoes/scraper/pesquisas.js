//=============> ======== <==============\\

const {
  axios,
  cheerio,
  encodeUrl,
  fs,
  linkfy,
  qs,
  randomIntFromInterval,
  removerAcentos,
  useragent_1,
  default_criador
} = require('./defaults.js');

//=============> Amazon <==============\\

const AmazonSearch = (q) => new Promise((resolve, reject) => {
  axios.get(`https://www.amazon.com.br/s?k=${removerAcentos(q)}&ref=nb_sb_noss`, {
      headers: {
        ...useragent_1
      }
    })
    .then((res) => {
      const dados = [];
      const $ = cheerio.load(res.data)
      $('div[data-component-type="s-search-result"]').each((i, e) => {
        dados.push({
          titulo: $(e).find('span[class="a-size-small a-color-base a-text-normal"]').text(),
          valor: $(e).find('span[class="a-offscreen"]:first').text(),
          imagem: $(e).find('img.s-image').attr('srcset') ? (linkfy.find($(e).find('img.s-image').attr('srcset'))?.pop()?.href || $(e).find('img.s-image').attr('src')) : $(e).find('img.s-image').attr('src'),
          link: 'https://www.amazon.com.br' + $(e).find('a:first').attr('href')
        });
      });
      resolve({
        status: res.status,
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => {
      reject(e)
    });
});

//=============> Play Store <==============\\

const PlayStoreSearch = (q) => new Promise((resolve, reject) => {
  axios.get(`https://play.google.com/store/search?q=${removerAcentos(q)}&c=apps`, {
      headers: {
        ...useragent_1
      }
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      $('.VfPpkd-aGsRMb').each((i, e) => {
        dados.push({
          nome: $(e).find('.DdYX5:first').text().trim(),
          imagem: (($(e).find('img:first').attr('srcset') ? (linkfy.find($(e).find('img:first').attr('srcset'))?.pop()?.href || $(e).find('img:first').attr('src')) : $(e).find('img:first').attr('srcset')) || $(e).find('img:last').attr('srcset') ? (linkfy.find($(e).find('img:last').attr('srcset'))?.pop()?.href || $(e).find('img:last').attr('src')) : $(e).find('img:last').attr('srcset')).trim(),
          desenvolvedor: $(e).find('.wMUdtb:first').text().trim(),
          estrelas: $(e).find('.w2kbF:first').text().trim(),
          link: 'https://play.google.com' + $(e).find('a:first').attr('href')
        });
      });
      resolve({
        status: res.status,
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => {
      reject(e)
    });
});


//=============> Mercado Livre <==============\\
// FIX: MercadoLivre bloqueia com captcha — usando Buscapé como alternativa

const MercadoLivreSearch = (q) => new Promise((resolve, reject) => {
  axios.get(`https://www.buscape.com.br/search?q=${encodeURIComponent(removerAcentos(q))}`, {
      headers: {
        ...useragent_1
      },
      timeout: 10000
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      $('[data-testid="product-card"]').each((i, e) => {
        const nome = $(e).find('[data-testid="product-card::name"]').text().trim();
        const preco = $(e).find('[data-testid="product-card::price"]').text().trim();
        const img = $(e).find('[data-testid="product-card::image"] img').attr('src') || $(e).find('img').first().attr('src');
        const linkEl = $(e).find('a').first().attr('href');
        const link = linkEl ? (linkEl.startsWith('http') ? linkEl : 'https://www.buscape.com.br' + linkEl) : '';
        if (nome) dados.push({ produto: nome, imagem: img || '', valor: preco, link });
      });
      resolve({
        status: res.status,
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => {
      reject(e)
    });
});

//=============> Xvideos <==============\\

const XvideosSearch = (q) => new Promise((resolve, reject) => {
  axios.get(`https://www.xvideos.com/?k=${removerAcentos(q).replaceAll(' ', '+')}`, {
      headers: {
        ...useragent_1
      }
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      $('div[class*="thumb-block"]').each((i, e) => {
        dados.push({
          titulo: $(e).find('.thumb-under > p > a').attr('title'),
          duracao: $(e).find('.thumb-under > p > a > span').text(),
          imagem: $(e).find('img').attr('data-src'),
          link: 'https://www.xvideos.com' + $(e).find('.thumb-under > p > a').attr('href')
        });
      });
      resolve({
        status: res.status,
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => {
      reject(e)
    });
});

//=============> Samba Porno <==============\\
// FIX: site redesenhado com Tailwind — seletores atualizados

const SambaPornoSearch = (q) => new Promise((resolve, reject) => {
  axios.get(`https://www.sambaporno.com/search/${removerAcentos(q)}`, {
      headers: {
        ...useragent_1
      }
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      $('.cards-container > div.card').each((i, e) => {
        const titleText = $(e).find('[class*="item-title"]').text().trim().replace(/^Não há nenhum vídeo disponível/i, '').trim();
        const img = $(e).find('img[class*="item-image"]').attr('src') || $(e).find('img').first().attr('src');
        const link = $(e).find('a[class*="item-title"], a[class*="rate-link"]').attr('href') || $(e).find('a').first().attr('href');
        const dur = $(e).find('[class*="item-meta"]').text().trim();
        if (titleText && link) {
          dados.push({
            nome: titleText,
            imagem: img ? img.trim() : '',
            likes: dur.match(/\d+%/)?.[0] || '',
            duracao: '',
            link: link.startsWith('http') ? link : 'https://www.sambaporno.com' + link
          });
        }
      });
      resolve({
        status: res.status,
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => {
      reject(e)
    });
});

//=============> Hentai Tube <==============\\

const HentaisTubeSearch = (q) => new Promise((resolve, reject) => {
  axios.get(`https://www.hentaistube.com/buscar/?s=${removerAcentos(q)}`, {
      headers: {
        ...useragent_1
      }
    })
    .then((res) => {
      const $ = cheerio.load(res.data)
      const dados = []
      $('.epiItem').each((i, e) => {
        dados.push({
          nome: $(e).find('a').attr('title'),
          imagem: $(e).find('img').attr('src'),
          link: $(e).find('a').attr('href')
        });
      });
      resolve({
        status: res.status,
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => {
      reject(e)
    });
});

//=============> Loja do Mecânico <==============\\
// FIX: busca.lojadomecanico.com.br usa captcha Radware — usando Buscapé como fallback

const LojaDoMecanicoSearch = (q) => new Promise((resolve, reject) => {
  axios.get(`https://busca.lojadomecanico.com.br/busca?q=${removerAcentos(q)}`, {
      headers: {
        ...useragent_1
      },
      timeout: 10000
    })
    .then((res) => {
      const dados = [];
      const $ = cheerio.load(res.data);
      $(`li[class*="nm-product-item"], li[class*="product-box"], li.product-item`).each((i, e) => {
        dados.push({
          nome: $(e).attr('data-name'),
          preco: "R$ " + $(e).attr('data-price'),
          marca: $(e).attr('data-brand'),
          categoria: $(e).attr('data-category'),
          imagem: "https:" + $(e).find('div > div > a > img').attr('src'),
          link: "https:" + $(e).find('div > div > a').attr('href'),
        });
      });
      // Se captcha bloqueou, fallback para Buscapé com termos de ferramentas
      if (dados.length === 0) {
        return axios.get(`https://www.buscape.com.br/search?q=${encodeURIComponent(removerAcentos(q) + ' ferramenta')}`, {
          headers: { ...useragent_1 },
          timeout: 10000
        }).then((res2) => {
          const $2 = cheerio.load(res2.data);
          $2('[data-testid="product-card"]').each((i, e) => {
            const nome = $2(e).find('[data-testid="product-card::name"]').text().trim();
            const preco = $2(e).find('[data-testid="product-card::price"]').text().trim();
            const img = $2(e).find('[data-testid="product-card::image"] img').attr('src') || $2(e).find('img').first().attr('src');
            const linkEl = $2(e).find('a').first().attr('href');
            const link = linkEl ? (linkEl.startsWith('http') ? linkEl : 'https://www.buscape.com.br' + linkEl) : '';
            if (nome) dados.push({ nome, preco, marca: '', categoria: '', imagem: img || '', link });
          });
          resolve({
            status: res2.status,
            criador: default_criador,
            resultado: dados
          });
        });
      }
      resolve({
        status: res.status,
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => {
      reject(e)
    });
});

//=============> Loja Americanas <==============\\
// FIX: API B2W morta — usando Buscapé como alternativa

const AmericanasSearch = (nome) => new Promise((resolve, reject) => {
  axios.get(`https://www.buscape.com.br/search?q=${encodeURIComponent(removerAcentos(nome))}`, {
      headers: {
        ...useragent_1
      },
      timeout: 10000
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      $('[data-testid="product-card"]').each((i, e) => {
        const produto = $(e).find('[data-testid="product-card::name"]').text().trim();
        const valor = $(e).find('[data-testid="product-card::price"]').text().trim();
        const img = $(e).find('[data-testid="product-card::image"] img').attr('src') || $(e).find('img').first().attr('src');
        const linkEl = $(e).find('a').first().attr('href');
        const link = linkEl ? (linkEl.startsWith('http') ? linkEl : 'https://www.buscape.com.br' + linkEl) : '';
        if (produto) dados.push({ produto, imagem: img || '', valor, link });
      });
      resolve({
        status: res.status,
        criador: default_criador,
        ajuda: `@Tobi`,
        resultado: dados
      });
    })
    .catch((e) => { reject(e) });
});

//=============> Submarino <==============\\
// FIX: API B2W morta — usando Buscapé como alternativa

const SubmarinoSearch = (q) => new Promise((resolve, reject) => {
  axios.get(`https://www.buscape.com.br/search?q=${encodeURIComponent(removerAcentos(q))}`, {
      headers: {
        ...useragent_1
      },
      timeout: 10000
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      $('[data-testid="product-card"]').each((i, e) => {
        const produto = $(e).find('[data-testid="product-card::name"]').text().trim();
        const valor = $(e).find('[data-testid="product-card::price"]').text().trim();
        const img = $(e).find('[data-testid="product-card::image"] img').attr('src') || $(e).find('img').first().attr('src');
        const linkEl = $(e).find('a').first().attr('href');
        const link = linkEl ? (linkEl.startsWith('http') ? linkEl : 'https://www.buscape.com.br' + linkEl) : '';
        if (produto) dados.push({ produto, imagem: img || '', valor, link });
      });
      resolve({
        status: res.status,
        criador: default_criador,
        resultado: dados
      });
    })
    .catch((e) => { reject(e) });
});

//========== Horoscopo ===========\\

const Horoscopo = (signo) => new Promise((resolve, reject) => {
  axios.get(`https://www.somostodosum.com.br/horoscopo/signo/${removerAcentos(signo)}.html`, {
      headers: {
        ...useragent_1
      }
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = []
                    dados.push({ 
               previsao: $('body > div > div > div.container > div.col-lg-9 > article > article').text().split(/Dica de oráculo para hoje/gi)[0]?.trim()
                      });
      resolve({
        status: res.status,
        criador: default_criador,
        infoDoSigno: signo,
        resultado: dados
      });
    })
    .catch((e) => {
      reject(e)
    });
});

//========== Dicionário ===========\\

const Dicionario = (q) => new Promise((resolve, reject) => {
  axios.get(`https://www.dicio.com.br/${q}/`, {
      headers: {
        ...useragent_1
      }
    })
    .then((res) => {
      const $ = cheerio.load(res.data);
      const dados = [];
      $('#content > div.col-xs-12.col-sm-7.col-md-8.p0.mb20 > div.card.card-main.mb10 > p > span').map((i, e) => dados.push($(e).text().trim() + '\n'))
      resolve({
        status: res.status,
        criador: default_criador,
        imagem: $('#content > div.col-xs-12.col-sm-7.col-md-8.p0.mb20 > div.card.card-main.mb10 > picture > img').attr('src'),
        significado: dados.join('\n').trim()
      });
    })
    .catch((e) => {
      reject(e)
    });
});

module.exports = {}
module.exports.PlayStoreSearch = PlayStoreSearch
module.exports.AmazonSearch = AmazonSearch
module.exports.MercadoLivreSearch = MercadoLivreSearch
module.exports.XvideosSearch = XvideosSearch
module.exports.SambaPornoSearch = SambaPornoSearch
module.exports.HentaisTubeSearch = HentaisTubeSearch
module.exports.LojaDoMecanicoSearch = LojaDoMecanicoSearch
module.exports.AmericanasSearch = AmericanasSearch
module.exports.SubmarinoSearch = SubmarinoSearch
module.exports.Horoscopo = Horoscopo
module.exports.Dicionario = Dicionario
