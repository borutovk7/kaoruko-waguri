const fs = require('fs');
const path = require('path');
const moment = require('moment');

// Caminho dos arquivos de dados
const COMPROVANTES_DIR = './database/comprovantes';
const COMPROVANTES_FILE = path.join(COMPROVANTES_DIR, 'comprovantes.json');
const ESTATISTICAS_FILE = path.join(COMPROVANTES_DIR, 'estatisticas.json');
const TENTATIVAS_FILE = path.join(COMPROVANTES_DIR, 'tentativas.json');

// Garantir que os diretórios existem
function garantirDiretorio() {
if (!fs.existsSync(COMPROVANTES_DIR)) {
fs.mkdirSync(COMPROVANTES_DIR, { recursive: true });
}
}

// Inicializar arquivos JSON se não existirem
function inicializarArquivos() {
garantirDiretorio();

if (!fs.existsSync(COMPROVANTES_FILE)) {
fs.writeFileSync(COMPROVANTES_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(ESTATISTICAS_FILE)) {
fs.writeFileSync(ESTATISTICAS_FILE, JSON.stringify({
total_arrecadado: 0,
total_transacoes: 0,
total_taxa: 0,
total_creditado: 0,
por_usuario: {},
por_data: {},
ultima_atualizacao: new Date().toISOString()
}, null, 2));
}

if (!fs.existsSync(TENTATIVAS_FILE)) {
fs.writeFileSync(TENTATIVAS_FILE, JSON.stringify({
total_tentativas: 0,
por_usuario: {},
nao_pagaram: [],
ultima_atualizacao: new Date().toISOString()
}, null, 2));
}
}

// Ler comprovantes
function lerComprovantes() {
try {
inicializarArquivos();
const dados = fs.readFileSync(COMPROVANTES_FILE, 'utf8');
return JSON.parse(dados);
} catch (error) {
console.error('Erro ao ler comprovantes:', error);
return [];
}
}

// Salvar comprovantes
function salvarComprovantes(comprovantes) {
try {
garantirDiretorio();
fs.writeFileSync(COMPROVANTES_FILE, JSON.stringify(comprovantes, null, 2));
} catch (error) {
console.error('Erro ao salvar comprovantes:', error);
}
}

// Ler estatísticas
function lerEstatisticas() {
try {
inicializarArquivos();
const dados = fs.readFileSync(ESTATISTICAS_FILE, 'utf8');
return JSON.parse(dados);
} catch (error) {
console.error('Erro ao ler estatísticas:', error);
return {
total_arrecadado: 0,
total_transacoes: 0,
total_taxa: 0,
total_creditado: 0,
por_usuario: {},
por_data: {},
ultima_atualizacao: new Date().toISOString()
};
}
}

// Salvar estatísticas
function salvarEstatisticas(stats) {
try {
garantirDiretorio();
stats.ultima_atualizacao = new Date().toISOString();
fs.writeFileSync(ESTATISTICAS_FILE, JSON.stringify(stats, null, 2));
} catch (error) {
console.error('Erro ao salvar estatísticas:', error);
}
}

// Ler tentativas
function lerTentativas() {
try {
inicializarArquivos();
const dados = fs.readFileSync(TENTATIVAS_FILE, 'utf8');
return JSON.parse(dados);
} catch (error) {
console.error('Erro ao ler tentativas:', error);
return {
total_tentativas: 0,
por_usuario: {},
nao_pagaram: [],
ultima_atualizacao: new Date().toISOString()
};
}
}

// Salvar tentativas
function salvarTentativas(tentativas) {
try {
garantirDiretorio();
tentativas.ultima_atualizacao = new Date().toISOString();
fs.writeFileSync(TENTATIVAS_FILE, JSON.stringify(tentativas, null, 2));
} catch (error) {
console.error('Erro ao salvar tentativas:', error);
}
}

// Registrar tentativa de pagamento (quando o usuário usa o comando)
function registrarTentativa(numero_usuario, nome_usuario, valor) {
const tentativas = lerTentativas();
const numero_limpo = numero_usuario.split('@')[0];

// Incrementar total de tentativas
tentativas.total_tentativas++;

// Registrar por usuário
if (!tentativas.por_usuario[numero_limpo]) {
tentativas.por_usuario[numero_limpo] = {
nome: nome_usuario,
total_tentativas: 0,
pagamentos_concluidos: 0,
tentativas_nao_pagas: 0,
valor_total_tentado: 0,
valor_total_pago: 0
};
}

tentativas.por_usuario[numero_limpo].total_tentativas++;
tentativas.por_usuario[numero_limpo].tentativas_nao_pagas++;
tentativas.por_usuario[numero_limpo].valor_total_tentado += valor;

// Registrar na lista de não pagadores
const tentativaObj = {
numero: numero_limpo,
nome: nome_usuario,
valor: valor,
data: new Date().toISOString(),
status: 'PENDENTE'
};

tentativas.nao_pagaram.push(tentativaObj);

salvarTentativas(tentativas);
return tentativaObj;
}

// Armazenar comprovante de pagamento
function armazenarComprovante(txid, numero_usuario, nome_usuario, valor, taxa = 0) {
const comprovantes = lerComprovantes();
const stats = lerEstatisticas();
const tentativas = lerTentativas();
const numero_limpo = numero_usuario.split('@')[0];
const data_atual = moment().format('YYYY-MM-DD');

// Verificar se já existe
const existe = comprovantes.find(c => c.txid === txid);
if (existe) {
return { sucesso: false, mensagem: 'Este comprovante já foi registrado' };
}

const total = valor - taxa;

// Criar comprovante
const comprovante = {
id: comprovantes.length + 1,
txid,
numero_usuario: numero_limpo,
nome_usuario,
valor,
taxa,
total,
status: 'CONCLUIDA',
data_pagamento: new Date().toISOString(),
data_criacao: new Date().toISOString()
};

comprovantes.push(comprovante);
salvarComprovantes(comprovantes);

// Atualizar estatísticas
stats.total_arrecadado += valor;
stats.total_transacoes++;
stats.total_taxa += taxa;
stats.total_creditado += total;

// Por usuário
if (!stats.por_usuario[numero_limpo]) {
stats.por_usuario[numero_limpo] = {
nome: nome_usuario,
total_pagamentos: 0,
valor_total: 0,
taxa_total: 0,
total_creditado: 0
};
}

stats.por_usuario[numero_limpo].total_pagamentos++;
stats.por_usuario[numero_limpo].valor_total += valor;
stats.por_usuario[numero_limpo].taxa_total += taxa;
stats.por_usuario[numero_limpo].total_creditado += total;

// Por data
if (!stats.por_data[data_atual]) {
stats.por_data[data_atual] = {
total_transacoes: 0,
valor_total: 0,
taxa_total: 0,
total_creditado: 0
};
}

stats.por_data[data_atual].total_transacoes++;
stats.por_data[data_atual].valor_total += valor;
stats.por_data[data_atual].taxa_total += taxa;
stats.por_data[data_atual].total_creditado += total;

salvarEstatisticas(stats);

// Atualizar tentativas - marcar como pago
if (tentativas.por_usuario[numero_limpo]) {
tentativas.por_usuario[numero_limpo].pagamentos_concluidos++;
tentativas.por_usuario[numero_limpo].tentativas_nao_pagas--;
tentativas.por_usuario[numero_limpo].valor_total_pago += valor;

// Remover da lista de não pagadores
tentativas.nao_pagaram = tentativas.nao_pagaram.filter(t => 
!(t.numero === numero_limpo && t.valor === valor && t.status === 'PENDENTE')
);

// Marcar como pago se existir
const tentativaIndex = tentativas.nao_pagaram.findIndex(t => 
t.numero === numero_limpo && t.valor === valor
);
if (tentativaIndex !== -1) {
tentativas.nao_pagaram[tentativaIndex].status = 'PAGO';
}
}

salvarTentativas(tentativas);

return {
sucesso: true,
mensagem: 'Comprovante armazenado com sucesso',
comprovante
};
}

// Obter comprovante por TXID
function obterComprovante(txid) {
const comprovantes = lerComprovantes();
return comprovantes.find(c => c.txid === txid) || null;
}

// Obter comprovantes de um usuário
function obterComprovantesUsuario(numero_usuario) {
const comprovantes = lerComprovantes();
const numero_limpo = numero_usuario.split('@')[0];
return comprovantes.filter(c => c.numero_usuario === numero_limpo);
}

// Obter estatísticas gerais
function obterEstatisticas() {
return lerEstatisticas();
}

// Obter estatísticas de um usuário
function obterEstatisticasUsuario(numero_usuario) {
const stats = lerEstatisticas();
const numero_limpo = numero_usuario.split('@')[0];
return stats.por_usuario[numero_limpo] || null;
}

// Obter estatísticas de uma data
function obterEstatisticasData(data) {
const stats = lerEstatisticas();
return stats.por_data[data] || null;
}

// Obter tentativas
function obterTentativas() {
return lerTentativas();
}

// Obter usuários que não pagaram
function obterNaoPagadores() {
const tentativas = lerTentativas();
return tentativas.nao_pagaram.filter(t => t.status === 'PENDENTE');
}

// Obter estatísticas de inadimplência
function obterEstatisticasInadimplencia() {
const tentativas = lerTentativas();
const stats = {
total_tentativas: tentativas.total_tentativas,
total_nao_pagadores: Object.keys(tentativas.por_usuario).length,
total_tentativas_nao_pagas: 0,
valor_total_nao_pago: 0,
usuarios_inadimplentes: []
};

Object.entries(tentativas.por_usuario).forEach(([numero, dados]) => {
stats.total_tentativas_nao_pagas += dados.tentativas_nao_pagas;
stats.valor_total_nao_pago += (dados.valor_total_tentado - dados.valor_total_pago);

if (dados.tentativas_nao_pagas > 0) {
stats.usuarios_inadimplentes.push({
numero,
nome: dados.nome,
tentativas_nao_pagas: dados.tentativas_nao_pagas,
valor_nao_pago: dados.valor_total_tentado - dados.valor_total_pago,
taxa_pagamento: dados.pagamentos_concluidos > 0 
? ((dados.pagamentos_concluidos / dados.total_tentativas) * 100).toFixed(2) + '%'
: '0%'
});
}
});

return stats;
}

// Formatar moeda
function formatarMoeda(valor) {
return new Intl.NumberFormat('pt-BR', {
style: 'currency',
currency: 'BRL'
}).format(valor);
}

module.exports = { inicializarArquivos,
registrarTentativa, armazenarComprovante, obterComprovante, obterComprovantesUsuario, obterEstatisticas, obterEstatisticasUsuario, obterEstatisticasData, obterTentativas, obterNaoPagadores, obterEstatisticasInadimplencia, formatarMoeda, lerComprovantes, lerEstatisticas, lerTentativas
};
