const fs = require('fs');
const path = require('path');
const { successLog, infoLog, warningLog, errorLog } = require('../definicoes.js');

let reloadTimeout = null;
let watchTimeout = null;
let isReloading = false;
let totalReloads = 0;
let successfulReloads = 0;
let failedReloads = 0;
let recentReloads = [];

const DEFAULT_CONFIG = {
debounceDelay: 1000,
maxReloads: 5,
reloadWindow: 10000,
enableLogging: true
};

function startAutoReload(filePath, config = {}) {
const options = { ...DEFAULT_CONFIG, ...config };
const fileName = path.basename(filePath);

successLog(`Sistem de Modificação ativado para ${fileName}`);

fs.watchFile(filePath, (curr, prev) => {
if (curr.mtime === prev.mtime) return;
if (isReloading) {
warningLog(`Reload já em progresso para ${fileName}`);
return;
}
if (!verificarLimiteReload(options.maxReloads, options.reloadWindow)) {
errorLog(`Limite de reloads atingido para ${fileName}`);
return;
}

infoLog(`Arquivo '${fileName}' foi modificado`);
agendarReload(filePath, fileName, options.debounceDelay);
});
}

function agendarReload(filePath, fileName, delay) {
clearTimeout(reloadTimeout);
isReloading = true;

reloadTimeout = setTimeout(() => {
executarReload(filePath, fileName);
}, delay);
}

function executarReload(filePath, fileName) {
try {
const startTime = Date.now();
infoLog(`Recarregando ${fileName}...`);

delete require.cache[require.resolve(filePath)];
require(filePath);

const reloadTime = Date.now() - startTime;

totalReloads++;
successfulReloads++;
recentReloads.push({
time: Date.now(),
success: true,
duration: reloadTime
});

limparReloadsAntigos();

successLog(`${fileName} recarregado com sucesso (${reloadTime}ms)`);
isReloading = false;

} catch (error) {
totalReloads++;
failedReloads++;
recentReloads.push({
time: Date.now(),
success: false,
error: error.message
});

errorLog(`Erro ao recarregar ${fileName}: ${error.message}`);
isReloading = false;
tentarRecuperacao(fileName);
}
}

function verificarLimiteReload(maxReloads, reloadWindow) {
const now = Date.now();
const reloadsRecentes = recentReloads.filter(r => now - r.time < reloadWindow);
return reloadsRecentes.length < maxReloads;
}

function limparReloadsAntigos(reloadWindow = 10000) {
const now = Date.now();
recentReloads = recentReloads.filter(r => now - r.time < reloadWindow);
}

function tentarRecuperacao(fileName) {
warningLog(`Tentando recuperar de erro em ${fileName}...`);
clearTimeout(watchTimeout);
watchTimeout = setTimeout(() => {
isReloading = false;
infoLog(`Sistema pronto para novo reload de ${fileName}`);
}, 5000);
}

function pararAutoReload(filePath) {
fs.unwatchFile(filePath);
clearTimeout(reloadTimeout);
clearTimeout(watchTimeout);
isReloading = false;

const fileName = path.basename(filePath);
successLog(`Auto-reload desativado para ${fileName}`);
}

function obterEstatisticas() {
const successRate = totalReloads > 0 
? Math.round((successfulReloads / totalReloads) * 100) 
: 0;

return {
totalReloads,
successfulReloads,
failedReloads,
successRate,
isReloading,
recentReloads: recentReloads.slice(-10)
};
}

function resetarEstatisticas() {
totalReloads = 0;
successfulReloads = 0;
failedReloads = 0;
recentReloads = [];
successLog(`Estatísticas de reload resetadas`);
}

module.exports = { startAutoReload, pararAutoReload, obterEstatisticas, resetarEstatisticas, agendarReload, executarReload, verificarLimiteReload, tentarRecuperacao };
