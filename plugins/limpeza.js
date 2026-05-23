/**
 * Plugin: limpeza.js
 * Comando: !limpeza
 * Acesso: SoDono apenas
 * 
 * O que faz:
 *  - Lista todos os grupos que a bot está
 *  - Apaga mídias baixadas (./arquivos/temp/, ./temp/, ./downloads/, ./media/)
 *  - Apaga logs antigos (./logs/) opcionalmente
 *  - Retorna relatório com o que foi deletado e quanto espaço liberou
 */

const fs = require('fs');
const path = require('path');

/**
 * Retorna o tamanho de um arquivo em bytes (0 se não existir)
 */
function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

/**
 * Formata bytes em KB / MB / GB legível
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Lê todos os arquivos de um diretório de forma recursiva
 * Retorna array de caminhos absolutos
 */
function getAllFiles(dirPath, resultado = []) {
  if (!fs.existsSync(dirPath)) return resultado;
  try {
    const itens = fs.readdirSync(dirPath);
    for (const item of itens) {
      const fullPath = path.join(dirPath, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          getAllFiles(fullPath, resultado);
        } else {
          resultado.push(fullPath);
        }
      } catch {}
    }
  } catch {}
  return resultado;
}

/**
 * Deleta um arquivo e retorna seu tamanho (para contabilizar espaço liberado)
 * Não lança erro — apenas ignora falhas individuais
 */
function deleteFile(filePath) {
  const size = getFileSize(filePath);
  try {
    fs.unlinkSync(filePath);
    return size;
  } catch {
    return 0;
  }
}

/**
 * Extensões consideradas "mídia" para limpeza
 */
const MEDIA_EXTENSIONS = new Set([
  '.mp4', '.mp3', '.webm', '.mkv', '.avi', '.mov',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.ogg', '.opus', '.wav', '.flac', '.aac',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.apk', '.exe', '.sticker', '.tmp'
]);

/**
 * Diretórios alvo para limpeza de mídias
 * Ajuste conforme sua estrutura de pastas
 */
const DIRETORIOS_MIDIA = [
  './arquivos/temp',
  './temp',
  './downloads',
  './media',
  './tmp',
  './cache',
  './arquivos/downloads',
  './arquivos/cache',
];

/**
 * Diretórios de logs (só limpa se passado o arg 'logs')
 */
const DIRETORIOS_LOGS = [
  './logs',
  './arquivos/logs',
];

/**
 * Função principal exportada como case
 * 
 * Uso dentro do seu switch/case no index.js:
 * 
 *   case 'limpeza':
 *     return await require('./plugins/limpeza.js').executar({ kaoruko, from, sender, SoDono, reply, reagir, args, waguriselo });
 */
async function executar({ kaoruko, from, sender, SoDono, reply, reagir, args, waguriselo }) {
  if (!SoDono) return reply('🔒 Apenas o dono pode usar esse comando.');

  reagir(from, '🧹');

  const incluirLogs = args?.[0]?.toLowerCase() === 'logs';
  const modoInfo    = args?.[0]?.toLowerCase() === 'info';

  // ── Listar grupos ──────────────────────────────────────────────────────────
  let listaGrupos = '';
  let totalGrupos = 0;
  try {
    const chats = await kaoruko.groupFetchAllParticipating();
    const grupos = Object.values(chats);
    totalGrupos = grupos.length;
    if (totalGrupos > 0) {
      listaGrupos = grupos
        .map((g, i) => `  ${i + 1}. ${g.subject || 'Sem nome'} (${g.id.split('@')[0]})`)
        .join('\n');
    } else {
      listaGrupos = '  Nenhum grupo encontrado.';
    }
  } catch (e) {
    listaGrupos = `  Erro ao buscar grupos: ${e.message}`;
  }

  // ── Modo info: só lista sem deletar nada ──────────────────────────────────
  if (modoInfo) {
    let totalArquivos = 0;
    let totalBytes    = 0;

    for (const dir of [...DIRETORIOS_MIDIA, ...DIRETORIOS_LOGS]) {
      const arquivos = getAllFiles(dir);
      for (const f of arquivos) {
        totalArquivos++;
        totalBytes += getFileSize(f);
      }
    }

    const msg =
      `🔍 *RELATÓRIO DE LIMPEZA (modo info)*\n\n` +
      `📁 *Grupos ativos:* ${totalGrupos}\n` +
      listaGrupos + '\n\n' +
      `🗂️ *Arquivos encontrados para limpar:* ${totalArquivos}\n` +
      `💾 *Espaço ocupado:* ${formatBytes(totalBytes)}\n\n` +
      `_Use *!limpeza* para apagar as mídias._\n` +
      `_Use *!limpeza logs* para incluir logs na limpeza._`;

    return kaoruko.sendMessage(from, { text: msg }, { quoted: waguriselo });
  }

  // ── Limpeza real ──────────────────────────────────────────────────────────
  let totalDeletados = 0;
  let totalLiberado  = 0;
  let totalIgnorados = 0;
  const dirsLimpos   = [];

  const dirs = incluirLogs
    ? [...DIRETORIOS_MIDIA, ...DIRETORIOS_LOGS]
    : DIRETORIOS_MIDIA;

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;

    const arquivos = getAllFiles(dir);
    let deletadosNessaDir = 0;
    let liberadosNessaDir = 0;

    for (const arquivo of arquivos) {
      const ext = path.extname(arquivo).toLowerCase();
      if (MEDIA_EXTENSIONS.has(ext)) {
        const liberado = deleteFile(arquivo);
        if (liberado > 0 || fs.existsSync(arquivo) === false) {
          totalDeletados++;
          totalLiberado += liberado;
          deletadosNessaDir++;
          liberadosNessaDir += liberado;
        } else {
          totalIgnorados++;
        }
      } else {
        totalIgnorados++;
      }
    }

    if (deletadosNessaDir > 0) {
      dirsLimpos.push(`  📂 ${dir} — ${deletadosNessaDir} arq. (${formatBytes(liberadosNessaDir)})`);
    }
  }

  // ── Relatório final ───────────────────────────────────────────────────────
  const resumoDirs = dirsLimpos.length > 0
    ? dirsLimpos.join('\n')
    : '  Nenhum diretório com mídias encontrado.';

  const msg =
    `✅ *LIMPEZA CONCLUÍDA*\n\n` +
    `📌 *Grupos que a bot está (${totalGrupos}):*\n` +
    listaGrupos + '\n\n' +
    `🗑️ *Arquivos deletados:* ${totalDeletados}\n` +
    `💾 *Espaço liberado:* ${formatBytes(totalLiberado)}\n` +
    `⏭️ *Ignorados (não são mídia):* ${totalIgnorados}\n\n` +
    `📂 *Diretórios limpos:*\n` +
    resumoDirs +
    (incluirLogs ? '\n\n_Logs também foram incluídos na limpeza._' : '');

  return kaoruko.sendMessage(from, { text: msg }, { quoted: waguriselo });
}

module.exports = { executar, MEDIA_EXTENSIONS, DIRETORIOS_MIDIA, formatBytes };
