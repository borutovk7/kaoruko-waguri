// FIX: seletor do meloboom era ultra-específico e quebrou — simplificado
const cheerio = require("cheerio");
const axios = require("axios");

function ringtone(title) {
  return new Promise((resolve, reject) => {
    axios.get('https://meloboom.com/en/search/' + encodeURIComponent(title), {
      headers: {
        "user-agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.5195.136 Mobile Safari/537.36"
      }
    })
    .then((get) => {
      const $ = cheerio.load(get.data);
      const hasil = [];
      // FIX: seletor simplificado — pega qualquer <li> com <audio> e <h4>
      $('ul li').each(function(a, b) {
        const titulo = $(b).find('h4').text().trim();
        const audio = $(b).find('audio').attr('src') || $(b).find('audio source').attr('src');
        if (titulo && audio) {
          hasil.push({ titulo, audio });
        }
      });
      resolve({ status: 200, criadorScrapper: '@nezsab-team.exe', resultado: hasil });
    })
    .catch(reject);
  });
}

module.exports = { ringtone };
