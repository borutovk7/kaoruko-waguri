const FormData = require('form-data');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function uppload(buff) {
  const form = new FormData();
  form.append('files[]', fs.createReadStream(buff));
  const { data } = await axios({
    url: 'https://uguu.se/upload.php',
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
      ...form.getHeaders()
    },
    data: form
  });
  return data.files[0];
}

async function webp_mp4(filee) {
  const anu = await uppload(filee);

  const bodyForm = new FormData();
  bodyForm.append('new-image-url', anu.url);
  bodyForm.append('upload', 'Upload!');

  const { data: html1 } = await axios({
    method: 'post',
    url: 'https://ezgif.com/webp-to-mp4',
    data: bodyForm,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${bodyForm._boundary}`,
      'Host': 'ezgif.com',
      'Origin': 'https://ezgif.com',
      'Referer': 'https://ezgif.com/webp-to-mp4',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    }
  });

  const $1 = cheerio.load(html1);
  const file = $1('form.ajax-form input[name="file"]').attr('value');
  if (!file) throw new Error('webp_mp4: não foi possível extrair o file token do ezgif');

  const bodyForm2 = new FormData();
  bodyForm2.append('file', file);
  bodyForm2.append('convert', 'Convert WebP to MP4!');

  const { data: html2 } = await axios({
    method: 'post',
    url: `https://ezgif.com/webp-to-mp4/${file}`,
    data: bodyForm2,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${bodyForm2._boundary}`
    }
  });

  const $2 = cheerio.load(html2);
  const src = $2('div#output > p.outfile > video > source').attr('src');
  if (!src) throw new Error('webp_mp4: não foi possível extrair a URL do resultado');

  return {
    status: true,
    message: 'Created By @Eduh Dev || </> 🩵',
    result: 'https:' + src
  };
}

module.exports = webp_mp4;