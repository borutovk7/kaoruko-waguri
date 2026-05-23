/* MÓDULO DE OTIMIZAÇÃO PARA BOT BAILEYS */

const http = require('http');
const https = require('https');
const axios = require('axios');

/* Importar sistema de logs */
const { sayLog, inputLog, infoLog, successLog, errorLog, warningLog } = require('../definicoes.js');

/* ============================================================
   1. CACHE MANAGER - CACHE EM MEMÓRIA COM TTL
   ============================================================ */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /* Adiciona um item ao cache com tempo de expiração */
  set(key, value, ttl = 60000) {
    if (this.timers.has(key)) clearTimeout(this.timers.get(key));
    this.cache.set(key, value);
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl);
    this.timers.set(key, timer);
  }

  /* Recupera um item do cache */
  get(key) {
    return this.cache.get(key);
  }

  /* Verifica se um item existe no cache */
  has(key) {
    return this.cache.has(key);
  }

  /* Remove um item do cache */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  /* Limpa todo o cache */
  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  /* Retorna o número de itens no cache */
  size() {
    return this.cache.size;
  }
}

const cacheManager = new CacheManager();

/* ============================================================
   2. RATE LIMITER - PROTEÇÃO CONTRA SPAM
   ============================================================ */

class RateLimiter {
  constructor() {
    this.limits = new Map();
  }

  /* Verifica se o usuário excedeu o limite */
  check(userId, limit = 5, window = 60000) {
    const now = Date.now();
    const userLimit = this.limits.get(userId) || [];
    const filtered = userLimit.filter(t => now - t < window);

    if (filtered.length >= limit) {
      return false;
    }

    filtered.push(now);
    this.limits.set(userId, filtered);
    return true;
  }

  /* Reseta o limite de um usuário */
  reset(userId) {
    this.limits.delete(userId);
  }

  /* Limpa todos os limites */
  clear() {
    this.limits.clear();
  }
}

const rateLimiter = new RateLimiter();

/* ============================================================
   3. TASK QUEUE - FILA DE PROCESSAMENTO
   ============================================================ */

class TaskQueue {
  constructor(concurrency = 5) {
    this.queue = [];
    this.running = 0;
    this.concurrency = concurrency;
  }

  /* Adiciona uma tarefa à fila */
  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  /* Processa tarefas da fila */
  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { task, resolve, reject } = this.queue.shift();

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }

  /* Retorna o tamanho da fila */
  size() {
    return this.queue.length;
  }

  /* Limpa toda a fila */
  clear() {
    this.queue = [];
  }
}

const taskQueue = new TaskQueue(10);

/* ============================================================
   4. CONNECTION POOL - POOL DE CONEXÕES HTTP
   ============================================================ */

function setupConnectionPool() {
  /* Configurar agent HTTP com keep-alive */
  const httpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 30000,
    freeSocketTimeout: 30000
  });

  /* Configurar agent HTTPS com keep-alive */
  const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 30000,
    freeSocketTimeout: 30000
  });

  /* Aplicar configurações ao axios */
  axios.defaults.httpAgent = httpAgent;
  axios.defaults.httpsAgent = httpsAgent;
  axios.defaults.timeout = 30000;
}

/* ============================================================
   5. MEMORY MONITOR - MONITORAMENTO DE MEMÓRIA
   ============================================================ */

class MemoryMonitor {
  constructor() {
    this.maxMemory = 500 * 1024 * 1024;
    this.checkInterval = 60000;
  }

  /* Inicia o monitoramento de memória */
  start() {
    setInterval(() => {
      const used = process.memoryUsage();
      const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);

   //   infoLog(`Memória: ${heapUsedMB}MB / ${heapTotalMB}MB`);

      /* Se usar mais de 80% da memória, fazer limpeza */
      if (used.heapUsed > this.maxMemory * 0.8) {
        warningLog(`Memória alta! Limpando cache...`);
        cacheManager.clear();
        rateLimiter.clear();
        global.gc?.();
      }
    }, this.checkInterval);
  }
}

const memoryMonitor = new MemoryMonitor();

/* ============================================================
   6. TRATAMENTO DE ERROS GLOBAL
   ============================================================ */

/* Captura promises rejeitadas não tratadas */
process.on('unhandledRejection', (reason) => {
  errorLog(`Promise rejeitada: ${reason}`);
});

/* Captura exceções não tratadas */
process.on('uncaughtException', (error) => {
  errorLog(`Exceção não capturada: ${error.message}`);
});

/* ============================================================
   7. FETCH WITH RETRY - REQUISIÇÕES COM RETRY AUTOMÁTICO
   ============================================================ */

/* Tenta fazer requisição novamente se falhar */
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, options);
      return response.data;
    } catch (error) {
      if (i === retries - 1) {
        errorLog(`Falha na requisição após ${retries} tentativas: ${url}`);
        throw error;
      }
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

/* ============================================================
   8. DEBOUNCE - EVITAR MÚLTIPLAS CHAMADAS
   ============================================================ */

/* Aguarda um tempo antes de executar função */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/* ============================================================
   9. THROTTLE - LIMITAR FREQUÊNCIA
   ============================================================ */

/* Executa função no máximo a cada X milissegundos */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/* ============================================================
   10. INICIALIZAÇÃO - ATIVAR TODAS AS OTIMIZAÇÕES
   ============================================================ */

/* Função principal que ativa todo o sistema de otimização */
function init() {
//  successLog(`Iniciando sistema de otimizações...`);

  setupConnectionPool();
//  successLog(`Pool de conexões HTTP configurado`);

//  successLog(`Tratamento de erros global ativo`);

  memoryMonitor.start();
//  successLog(`Monitor de memória iniciado`);

  /* Limpeza periódica de cache */
  setInterval(() => {
    const size = cacheManager.size();
    if (size > 1000) {
      warningLog(`Cache grande (${size} itens), limpando...`);
      cacheManager.clear();
    }
  }, 5 * 60 * 1000);

//  successLog(`Sistema de otimização totalmente ativo!`);
}

/* ============================================================
   EXPORTAÇÃO
   ============================================================ */

module.exports = {
  initOptimization: init,
  cacheManager,
  rateLimiter,
  taskQueue,
  fetchWithRetry,
  debounce,
  throttle,
  memoryMonitor
};
