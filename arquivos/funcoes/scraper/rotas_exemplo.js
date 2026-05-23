const {
  AmazonSearch,
  AmericanasSearch,
  MercadoLivreSearch,
  PlayStoreSearch,
  XvideosSearch,
  SambaPornoSearch,
  HentaisTubeSearch,
  LojaDoMecanicoSearch,
  SubmarinoSearch,
  Horoscopo,
  Dicionario,
  pinterestVideoDownloader,
  instaVideoV1,
  facebookDownloader,
  BBC,
  CNNBrasil,
  Estadao,
  Exame,
  G1,
  JovemPan,
  NoticiasAoMinuto,
  Poder360,
  Terra,
  Uol,
  VejaAbril,
  Vasco,
  AGazeta,
  TodaNoticias,
  memesDroid,
  tiktokurl,
  dl_vidkk,
  ringtone
} = require('./scraper.js');

// ==================== PESQUISAS ====================

app.get('/api/amazon', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const nome = req.query.nome
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!nome) return res.json({ status: false, message: 'Coloque o parametro: nome' })
  AmazonSearch(nome).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/mercadolivre', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const nome = req.query.nome
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!nome) return res.json({ status: false, message: 'Coloque o parametro: nome' })
  MercadoLivreSearch(nome).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/americanas', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const nome = req.query.nome
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!nome) return res.json({ status: false, message: 'Coloque o parametro: nome' })
  AmericanasSearch(nome).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/submarino', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const nome = req.query.nome
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!nome) return res.json({ status: false, message: 'Coloque o parametro: nome' })
  SubmarinoSearch(nome).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/lojadomecanico', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const nome = req.query.nome
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!nome) return res.json({ status: false, message: 'Coloque o parametro: nome' })
  LojaDoMecanicoSearch(nome).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/playstore', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const nome = req.query.nome
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!nome) return res.json({ status: false, message: 'Coloque o parametro: nome' })
  PlayStoreSearch(nome).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/xvideos', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const nome = req.query.nome
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!nome) return res.json({ status: false, message: 'Coloque o parametro: nome' })
  XvideosSearch(nome).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/sambaporno', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const nome = req.query.nome
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!nome) return res.json({ status: false, message: 'Coloque o parametro: nome' })
  SambaPornoSearch(nome).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/hentaistube', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const nome = req.query.nome
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!nome) return res.json({ status: false, message: 'Coloque o parametro: nome' })
  HentaisTubeSearch(nome).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/horoscopo', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const signo = req.query.signo
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!signo) return res.json({ status: false, message: 'Coloque o parametro: signo' })
  Horoscopo(signo).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/dicionario', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const palavra = req.query.palavra
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!palavra) return res.json({ status: false, message: 'Coloque o parametro: palavra' })
  Dicionario(palavra).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

// ==================== DOWNLOADERS ====================

app.get('/api/pinterest', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const url = req.query.url
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!url) return res.json({ status: false, message: 'Coloque o parametro: url' })
  pinterestVideoDownloader(url).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/instagram', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const url = req.query.url
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!url) return res.json({ status: false, message: 'Coloque o parametro: url' })
  instaVideoV1(url).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/facebook', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const url = req.query.url
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!url) return res.json({ status: false, message: 'Coloque o parametro: url' })
  facebookDownloader(url).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/tiktok', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const url = req.query.url
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!url) return res.json({ status: false, message: 'Coloque o parametro: url' })
  tiktokurl(url).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/video', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const url = req.query.url
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!url) return res.json({ status: false, message: 'Coloque o parametro: url' })
  dl_vidkk(url).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

// ==================== NOTICIAS ====================

app.get('/api/noticias/g1', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  G1().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/noticias/poder360', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  Poder360().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/noticias/jovempan', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  JovemPan().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/noticias/uol', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  Uol().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/noticias/cnnbrasil', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  CNNBrasil().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/noticias/estadao', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  Estadao().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/noticias/terra', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  Terra().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/noticias/exame', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  Exame().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/noticias/noticiasaominuto', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  NoticiasAoMinuto().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/noticias/vejaabril', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  VejaAbril().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/noticias/bbc', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  BBC().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/noticias/agazeta', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  AGazeta().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/noticias/vasco', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  Vasco().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

app.get('/api/noticias/todas', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  TodaNoticias().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

// ==================== MEMES ====================

app.get('/api/memes', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  memesDroid().then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})

// ==================== RINGTONE ====================

app.get('/api/ringtone', async (req, res) => {
  userIp = getClientIp(req)
  apikey = req.query.apikey
  const nome = req.query.nome
  if (!apikey) return res.json({ status: false, message: '- Cade o parametro apikey?' })
  if (!await existsApiKey(apikey)) return sendPageNoMoreRequests(res)
  if (await noMoreRequests(apikey)) return sendResJsonNoMoreRequests(res)
  await registerApikeyRQ(apikey, req)
  if (!nome) return res.json({ status: false, message: 'Coloque o parametro: nome' })
  ringtone(nome).then(data => res.json(data)).catch(e => res.json({ message: 'Erro no Servidor Interno', erro: `${e}` }))
})
