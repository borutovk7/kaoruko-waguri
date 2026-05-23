const acrcloud = require('acrcloud');
const fs = require('fs');

const acr = new acrcloud({
  host: 'identify-us-west-2.acrcloud.com', // fix: sem trailing slash
  access_key: '5fa558ba9eebbab70db053014f283431',
  access_secret: '4zblfTHO0JNtvRVggdamzuvABy9TKN9FPjyz0f3w'
});

const arcloud = async (Aud64) => {
  try {
    const audd = Buffer.from(Aud64, 'base64');
    const data = await acr.identify(audd);

    if (data?.status?.code !== 0) {
      throw new Error(data?.status?.msg || 'Música não reconhecida');
    }

    const music = data.metadata.music[0];
    return {
      artista: music.artists[0].name,
      album: music.album.name,
      titulo: music.title,
      rotulo: music.label
    };
  } catch (err) {
    throw new Error('ACRCloud erro: ' + err.message);
  }
};

module.exports = { arcloud };