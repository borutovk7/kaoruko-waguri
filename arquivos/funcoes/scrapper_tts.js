const axios = require("axios"); 
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const models = {
  miku: { voice_id: "67aee909-5d4b-11ee-a861-00163e2ac61b", voice_name: "Hatsune Miku" },
  fernanda: { voice_id: "439ccb40-6c39-11ef-8dd4-00163e049586", voice_name: "Fer" },
  nahida: { voice_id: "67ae0979-5d4b-11ee-a861-00163e2ac61b", voice_name: "Nahida" },
  goku: { voice_id: "67aed50c-5d4b-11ee-a861-00163e2ac61b", voice_name: "Goku" },
  eminem: { voice_id: "c82964b9-d093-11ee-bfb7-e86f38d7ec1a", voice_name: "Eminem" }
};

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
  "Mozilla/5.0 (Linux; Android 8.0.0)"
];

function getRandomIp() {
  return Array.from({ length: 4 }).map(() => Math.floor(Math.random() * 256)).join('.');
}

async function generateTTS(text, model = "nahida") {
  if (!models[model]) throw new Error(`Modelo "${model}" não encontrado.`);

  const agent = userAgents[Math.floor(Math.random() * userAgents.length)];
  const { voice_id, voice_name } = models[model];

  const payload = {
    raw_text: text,
    url: "https://filme.imyfone.com/text-to-speech/anime-text-to-speech/",
    product_id: "200054",
    convert_data: [{ voice_id, speed: "1", volume: "50", text, pos: 0 }]
  };

  const config = {
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": getRandomIp(),
      "User-Agent": agent
    }
  };

  const res = await axios.post("https://voxbox-tts-api.imyfone.com/pc/v1/voice/tts", payload, config);
  const result = res.data?.data?.convert_result?.[0];
  if (!result?.oss_url) throw new Error("API não retornou uma URL válida.");

  // Baixa o áudio temporário
  const tempMp3 = path.join(__dirname, "temp.mp3");
  const tempOgg = path.join(__dirname, "temp.ogg");
  const audioRes = await axios.get(result.oss_url, { responseType: "arraybuffer" });
  fs.writeFileSync(tempMp3, audioRes.data);

  // Converte para OGG/Opus
  await new Promise((resolve, reject) => {
    exec(`ffmpeg -y -i ${tempMp3} -c:a libopus -b:a 128k ${tempOgg}`, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  const buffer = fs.readFileSync(tempOgg);

  // Limpa arquivos temporários
  fs.unlinkSync(tempMp3);
  fs.unlinkSync(tempOgg);

  return { buffer, voice_name };
}

module.exports = { generateTTS };