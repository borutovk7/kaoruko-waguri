// FIX: aleacrapper.js (memesDroid) não estava sendo exportado
module.exports = {
  ...(require('./pesquisas.js')),
  ...(require('./downloaders.js')),
  ...(require('./noticias.js')),
  ...(require('./aleacrapper.js')),
  ...(require('./kiriticc.js')),
  ...(require('./ringtone.js'))
};
