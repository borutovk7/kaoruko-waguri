const axios = require("axios");
const FormData = require("form-data");
const Crypto = require("crypto");

const BASE = "https://api.iloveimg.com/v1";

/* Pega o public_key do bundle JS do site */
const getPublicKey = async () => {
    const html = await axios.get("https://www.iloveimg.com/pt/remover-fundo", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    const match = html.data.match(/project_public_[a-f0-9]+/);
    if (!match) throw new Error("public_key não encontrada");
    return match[0];
};

/* Autentica e retorna JWT */
const getToken = async (publicKey) => {
    const res = await axios.post(`${BASE}/auth`, { public_key: publicKey });
    return res.data.token;
};

const removerFundo = async (bufferImagem) => {
    const publicKey = await getPublicKey();
    const token = await getToken(publicKey);

    const headers = { Authorization: `Bearer ${token}` };

    /* 1. Upload */
    const form = new FormData();
    form.append("file", bufferImagem, {
        filename: Crypto.randomBytes(8).toString("hex") + ".png",
        contentType: "image/png"
    });

    const upload = await axios.post(`${BASE}/upload`, form, {
        headers: { ...headers, ...form.getHeaders() },
        maxBodyLength: Infinity
    });

    const { server, task_id, file: serverFile } = upload.data;

    /* 2. Processar */
    await axios.post(`https://${server}/v1/process`, {
        task: task_id,
        tool: "removebackground",
        files: [{ server_filename: serverFile.server_filename, filename: serverFile.filename }]
    }, { headers });

    /* 3. Download */
    const download = await axios.get(`https://${server}/v1/download/${task_id}`, {
        headers,
        responseType: "arraybuffer"
    });

    return Buffer.from(download.data);
};

module.exports = removerFundo;