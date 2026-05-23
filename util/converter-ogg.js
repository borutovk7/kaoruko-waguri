const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const TEMP_DIR = path.resolve('./database/midia/temp_audio');

async function limparTemp() {
  try {
    await fsPromises.mkdir(TEMP_DIR, { recursive: true });
    const arquivos = await fsPromises.readdir(TEMP_DIR);
    for (const arquivo of arquivos) {
      const filePath = path.join(TEMP_DIR, arquivo);
      await fsPromises.unlink(filePath).catch(() => {});
    }
  } catch (err) {
    console.error('Erro ao limpar diretório temporário:', err);
  }
}

function baixar(url, destino, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects === 0) return reject(new Error('Redirecionamentos demais'));

    const lib = url.startsWith('https') ? https : http;

    const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        res.resume();
        return baixar(res.headers.location, destino, redirects - 1)
          .then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      const file = fs.createWriteStream(destino);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', e => { fs.unlink(destino, () => {}); reject(e); });
    });

    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout 30s')); });
    req.on('error', e => { fs.unlink(destino, () => {}); reject(e); });
  });
}

function esc(p) {
  return `"${p.replace(/"/g, '\\"')}"`;
}

async function getAudioChannels(filePath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams a:0 -show_entries stream=channels -of csv=p=0 ${esc(filePath)}`
    );
    return parseInt(stdout.trim(), 10) || 1;
  } catch {
    return 1;
  }
}

async function converterOgg(id, link) {
  await fsPromises.mkdir(TEMP_DIR, { recursive: true });

  const ts         = Date.now();
  const inputFile  = path.join(TEMP_DIR, `in_${id}_${ts}`);
  const outputFile = path.join(TEMP_DIR, `out_${id}_${ts}.ogg`);

  try {
    if (/^https?:\/\//.test(link)) {
      await baixar(link, inputFile);
    } else {
      if (!fs.existsSync(link)) throw new Error(`Arquivo não encontrado: ${link}`);
      await fsPromises.copyFile(link, inputFile);
    }

    const channels = await getAudioChannels(inputFile);

    // WhatsApp suporta até 2 canais — preserva estéreo se o original for estéreo
    const ac = channels >= 2 ? 2 : 1;

    const cmd = [
      'ffmpeg -y',
      `-i ${esc(inputFile)}`,
      '-vn',
      '-acodec libopus',
      `-ac ${ac}`,
      '-ar 48000',
      '-b:a 128k',
      '-application audio',   // perfil otimizado pra música (não altera timbre/voz)
      '-map_metadata -1',
      '-loglevel error',
      esc(outputFile),
    ].join(' ');

    await execAsync(cmd, { timeout: 60000 });

    if (!fs.existsSync(outputFile)) throw new Error('Falha ao gerar .ogg');

    return outputFile;
  } finally {
    if (fs.existsSync(inputFile)) await fsPromises.unlink(inputFile).catch(() => {});
  }
}

setInterval(limparTemp, 5 * 60 * 1000);

module.exports = converterOgg;