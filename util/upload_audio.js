/**
 * upload-audios.js
 * 
 * Faz upload de todos os áudios da pasta ./database/audios/ para um repositório GitHub
 * e salva o mapeamento nome → URL raw em audio-links.json
 * 
 * USO:
 *   1. Coloque este arquivo na raiz do projeto da bot
 *   2. Configure as variáveis abaixo
 *   3. node upload-audios.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─────────────────────────────────────────
//  CONFIGURAÇÕES — edite aqui
// ─────────────────────────────────────────
const GITHUB_TOKEN  = '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';       // seu token ghp_...
const GITHUB_USER   = 'borutovk7';                 // seu username
const REPO_NAME     = 'kauroko-audios';            // nome do repositório (será criado automaticamente)
const BRANCH        = 'main';
const AUDIOS_DIR    = './database/audios';          // pasta com os áudios
const OUTPUT_JSON   = './audio-links.json';         // onde salvar o mapeamento
// ─────────────────────────────────────────

const EXTENSIONS = ['.mp3', '.mp4', '.ogg', '.opus', '.wav', '.m4a'];

// Requisição HTTPS genérica
function githubRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'kauroko-audio-uploader',
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Cria o repositório se não existir
async function createRepo() {
  console.log(`📦 Verificando repositório "${REPO_NAME}"...`);
  const check = await githubRequest('GET', `/repos/${GITHUB_USER}/${REPO_NAME}`);

  if (check.status === 200) {
    console.log('✅ Repositório já existe.');
    return;
  }

  console.log('🆕 Criando repositório...');
  const res = await githubRequest('POST', '/user/repos', {
    name: REPO_NAME,
    description: 'Áudios da Kauroko Bot',
    private: false,
    auto_init: true   // cria com README para o branch main existir
  });

  if (res.status === 201) {
    console.log('✅ Repositório criado!');
    // Aguarda um pouco para o GitHub inicializar o branch
    await new Promise(r => setTimeout(r, 3000));
  } else {
    throw new Error(`Erro ao criar repositório: ${JSON.stringify(res.body)}`);
  }
}

// Pega o SHA atual do arquivo no repo (necessário para update)
async function getFileSha(filePath) {
  const res = await githubRequest('GET', `/repos/${GITHUB_USER}/${REPO_NAME}/contents/${filePath}?ref=${BRANCH}`);
  if (res.status === 200) return res.body.sha;
  return null;
}

// Faz upload de um arquivo
async function uploadFile(localPath, repoPath) {
  const content = fs.readFileSync(localPath).toString('base64');
  const sha = await getFileSha(repoPath);

  const body = {
    message: `chore: upload ${path.basename(localPath)}`,
    content,
    branch: BRANCH,
    ...(sha ? { sha } : {})   // sha necessário apenas para atualizar
  };

  const res = await githubRequest('PUT', `/repos/${GITHUB_USER}/${REPO_NAME}/contents/${repoPath}`, body);
  
  if (res.status === 201 || res.status === 200) {
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO_NAME}/${BRANCH}/${repoPath}`;
    return rawUrl;
  } else {
    throw new Error(`Erro ao fazer upload de ${repoPath}: ${JSON.stringify(res.body)}`);
  }
}

// ─── MAIN ───────────────────────────────
async function main() {
  console.log('\n🎵 Kauroko Audio Uploader\n');

  if (!fs.existsSync(AUDIOS_DIR)) {
    console.error(`❌ Pasta não encontrada: ${AUDIOS_DIR}`);
    process.exit(1);
  }

  // Carrega mapeamento existente (para não re-fazer uploads desnecessários)
  let links = {};
  if (fs.existsSync(OUTPUT_JSON)) {
    links = JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf8'));
    console.log(`📄 Carregados ${Object.keys(links).length} links existentes de ${OUTPUT_JSON}`);
  }

  await createRepo();

  const files = fs.readdirSync(AUDIOS_DIR)
    .filter(f => EXTENSIONS.includes(path.extname(f).toLowerCase()));

  if (files.length === 0) {
    console.log('⚠️  Nenhum arquivo de áudio encontrado em', AUDIOS_DIR);
    return;
  }

  console.log(`\n📂 ${files.length} arquivo(s) encontrado(s):\n`);

  let uploaded = 0;
  let skipped = 0;

  for (const file of files) {
    const localPath = path.join(AUDIOS_DIR, file);
    const repoPath  = `audios/${file}`;
    const key       = `./database/audios/${file}`;

    // Pula se já foi feito upload (baseado no JSON salvo)
    if (links[key]) {
      console.log(`⏭️  Pulando (já existe): ${file}`);
      skipped++;
      continue;
    }

    try {
      process.stdout.write(`⬆️  Enviando: ${file} ... `);
      const url = await uploadFile(localPath, repoPath);
      links[key] = url;
      console.log('✅');
      uploaded++;

      // Salva progressivamente (não perde progresso se der erro no meio)
      fs.writeFileSync(OUTPUT_JSON, JSON.stringify(links, null, 2));

      // Delay para não estourar rate limit da API do GitHub
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.log(`❌ ERRO: ${err.message}`);
    }
  }

  console.log(`\n✨ Pronto! ${uploaded} enviado(s), ${skipped} pulado(s).`);
  console.log(`📄 Links salvos em: ${OUTPUT_JSON}`);
  console.log('\n👉 Agora rode: node patch-bot.js\n');
}

main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
