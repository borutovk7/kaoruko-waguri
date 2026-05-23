//=============> Pichau Scraper Corrigido <==============\\
// A Pichau utiliza Cloudflare e Magento 2 com GraphQL.
// Para evitar o erro 403 (Forbidden), é necessário enviar headers que simulem um navegador real.

const axios = require('axios');

const UA = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'accept': 'application/json, text/plain, */*',
  'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'content-type': 'application/json',
  'origin': 'https://www.pichau.com.br',
  'referer': 'https://www.pichau.com.br/',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'x-requested-with': 'XMLHttpRequest'
};

const GQL_URL = 'https://www.pichau.com.br/api/pichau/graphql';

// Monta preço formatado
const formatPrice = (price) => {
  if (price === undefined || price === null) return 'R$ 0,00';
  return `R$ ${Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Monta URL do produto
const buildUrl = (url_key) =>
  url_key ? `https://www.pichau.com.br/${url_key}` : '';

//=============> Busca de Produtos <=============\\

const PichauSearch = async (q, pageSize = 20, currentPage = 1) => {
  const query = `query getProducts($search: String, $pageSize: Int, $currentPage: Int) {
    products(
      search: $search
      pageSize: $pageSize
      currentPage: $currentPage
      sort: { relevance: DESC }
    ) {
      total_count
      items {
        name
        sku
        url_key
        price_range {
          minimum_price {
            regular_price { value currency }
            final_price { value currency }
            discount { amount_off percent_off }
          }
        }
        image { url label }
        stock_status
        rating_summary
        review_count
      }
      page_info {
        page_size
        current_page
        total_pages
      }
    }
  }`;

  const variables = {
    search: q.replace(/"/g, ''),
    pageSize,
    currentPage
  };

  try {
    const res = await axios.post(GQL_URL, { query, variables }, { headers: UA, timeout: 15000 });
    const data = res.data?.data?.products;
    if (!data) throw new Error('Resposta inesperada da API da Pichau ou bloqueio por Cloudflare');

    return {
      status: res.status,
      criador: '@nezsab-team.exe',
      fonte: 'https://www.pichau.com.br',
      total: data.total_count,
      pagina: currentPage,
      totalPaginas: data.page_info?.total_pages,
      resultado: (data.items || []).map(p => ({
        nome: p.name,
        sku: p.sku,
        imagem: p.image?.url || '',
        preco: formatPrice(p.price_range?.minimum_price?.final_price?.value),
        precoOriginal: formatPrice(p.price_range?.minimum_price?.regular_price?.value),
        desconto: p.price_range?.minimum_price?.discount?.percent_off
          ? `${Math.round(p.price_range.minimum_price.discount.percent_off)}% OFF`
          : '',
        estoque: p.stock_status === 'IN_STOCK' ? 'Disponível' : 'Indisponível',
        avaliacao: p.rating_summary || 0,
        numAvaliacoes: p.review_count || 0,
        link: buildUrl(p.url_key)
      }))
    };
  } catch (error) {
    if (error.response && error.response.status === 403) {
        throw new Error('Acesso negado pela Pichau (Cloudflare 403). Tente usar um Proxy ou atualizar os Cookies/User-Agent.');
    }
    throw error;
  }
};

//=============> Busca por Categoria <=============\\

const PichauCategoria = async (urlKey, pageSize = 20, currentPage = 1) => {
  const query = `query getCategory($urlKey: String, $pageSize: Int, $currentPage: Int) {
    categoryList(filters: { url_key: { eq: $urlKey } }) {
      id
      name
      url_key
      products(pageSize: $pageSize, currentPage: $currentPage) {
        total_count
        items {
          name
          sku
          url_key
          price_range {
            minimum_price {
              regular_price { value }
              final_price { value }
              discount { percent_off }
            }
          }
          image { url label }
          stock_status
        }
        page_info { current_page total_pages page_size }
      }
    }
  }`;

  const variables = { urlKey, pageSize, currentPage };

  const res = await axios.post(GQL_URL, { query, variables }, { headers: UA, timeout: 15000 });
  const cats = res.data?.data?.categoryList;
  if (!cats || !cats.length) throw new Error('Categoria não encontrada');
  const cat = cats[0];
  const data = cat.products;

  return {
    status: res.status,
    criador: '@nezsab-team.exe',
    fonte: 'https://www.pichau.com.br',
    categoria: cat.name,
    total: data.total_count,
    pagina: currentPage,
    totalPaginas: data.page_info?.total_pages,
    resultado: (data.items || []).map(p => ({
      nome: p.name,
      sku: p.sku,
      imagem: p.image?.url || '',
      preco: formatPrice(p.price_range?.minimum_price?.final_price?.value),
      precoOriginal: formatPrice(p.price_range?.minimum_price?.regular_price?.value),
      desconto: p.price_range?.minimum_price?.discount?.percent_off
        ? `${Math.round(p.price_range.minimum_price.discount.percent_off)}% OFF`
        : '',
      estoque: p.stock_status === 'IN_STOCK' ? 'Disponível' : 'Indisponível',
      link: buildUrl(p.url_key)
    }))
  };
};

//=============> Detalhes de Produto <=============\\

const PichauProduto = async (urlKey) => {
  const query = `query getProductDetail($urlKey: String) {
    products(filter: { url_key: { eq: $urlKey } }) {
      items {
        name
        sku
        url_key
        meta_description
        description { html }
        price_range {
          minimum_price {
            regular_price { value currency }
            final_price { value currency }
            discount { amount_off percent_off }
          }
        }
        image { url label }
        media_gallery { url label position }
        stock_status
        rating_summary
        review_count
        ... on ConfigurableProduct {
          variants {
            attributes { label value_index uid }
            product {
              name sku stock_status
              price_range {
                minimum_price {
                  final_price { value }
                }
              }
            }
          }
          configurable_options {
            label
            values { label value_index uid }
          }
        }
      }
    }
  }`;

  const variables = { urlKey };

  const res = await axios.post(GQL_URL, { query, variables }, { headers: UA, timeout: 15000 });
  const items = res.data?.data?.products?.items;
  if (!items || !items.length) throw new Error('Produto não encontrado');
  const p = items[0];

  return {
    status: res.status,
    criador: '@nezsab-team.exe',
    fonte: buildUrl(p.url_key),
    nome: p.name,
    sku: p.sku,
    descricao: p.meta_description || '',
    imagem: p.image?.url || '',
    galeria: (p.media_gallery || []).map(m => m.url),
    preco: formatPrice(p.price_range?.minimum_price?.final_price?.value),
    precoOriginal: formatPrice(p.price_range?.minimum_price?.regular_price?.value),
    desconto: p.price_range?.minimum_price?.discount?.percent_off
      ? `${Math.round(p.price_range.minimum_price.discount.percent_off)}% OFF`
      : '',
    estoque: p.stock_status === 'IN_STOCK' ? 'Disponível' : 'Indisponível',
    avaliacao: p.rating_summary || 0,
    numAvaliacoes: p.review_count || 0,
    variantes: (p.variants || []).map(v => ({
      nome: v.product?.name,
      sku: v.product?.sku,
      preco: formatPrice(v.product?.price_range?.minimum_price?.final_price?.value),
      estoque: v.product?.stock_status === 'IN_STOCK' ? 'Disponível' : 'Indisponível',
      atributos: (v.attributes || []).map(a => ({ label: a.label }))
    }))
  };
};

//=============> Ofertas / Destaques <=============\\

const PichauOfertas = async (pageSize = 20) => {
  // Nota: category_uid para ofertas pode mudar. "Mg==" é comum para "Ofertas".
  const query = `query getOffers($pageSize: Int) {
    products(
      filter: { category_uid: { eq: "Mg==" } }
      pageSize: $pageSize
      sort: { price: ASC }
    ) {
      total_count
      items {
        name
        sku
        url_key
        price_range {
          minimum_price {
            regular_price { value }
            final_price { value }
            discount { percent_off amount_off }
          }
        }
        image { url label }
        stock_status
      }
    }
  }`;

  const variables = { pageSize };

  const res = await axios.post(GQL_URL, { query, variables }, { headers: UA, timeout: 15000 });
  const data = res.data?.data?.products;
  if (!data) throw new Error('Resposta inesperada');

  return {
    status: res.status,
    criador: '@nezsab-team.exe',
    fonte: 'https://www.pichau.com.br',
    total: data.total_count,
    resultado: (data.items || [])
      .filter(p => p.price_range?.minimum_price?.discount?.percent_off > 0)
      .map(p => ({
        nome: p.name,
        sku: p.sku,
        imagem: p.image?.url || '',
        preco: formatPrice(p.price_range?.minimum_price?.final_price?.value),
        precoOriginal: formatPrice(p.price_range?.minimum_price?.regular_price?.value),
        desconto: `${Math.round(p.price_range.minimum_price.discount.percent_off)}% OFF`,
        economia: formatPrice(p.price_range?.minimum_price?.discount?.amount_off),
        estoque: p.stock_status === 'IN_STOCK' ? 'Disponível' : 'Indisponível',
        link: buildUrl(p.url_key)
      }))
  };
};

module.exports = {
  PichauSearch,
  PichauCategoria,
  PichauProduto,
  PichauOfertas
};
