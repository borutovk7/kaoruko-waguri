/* SISTEMA DE FILA DE MENSAGENS - PROCESSAMENTO PARALELO */

const { successLog, infoLog, warningLog, errorLog } = require('../definicoes.js');

class MessageQueue {
  constructor(concurrency = 5) {
    /* Fila de mensagens aguardando processamento */
    this.queue = [];
    
    /* Número de mensagens sendo processadas */
    this.processing = 0;
    
    /* Limite de processamento simultâneo */
    this.concurrency = concurrency;
    
    /* Estatísticas */
    this.stats = {
      total: 0,
      processed: 0,
      failed: 0,
      avgTime: 0
    };
    
    /* Prioridades de processamento */
    this.priorities = {
      HIGH: 1,
      NORMAL: 2,
      LOW: 3
    };
  }

  /* Adiciona mensagem à fila com prioridade */
  async add(message, handler, priority = 'NORMAL') {
    return new Promise((resolve, reject) => {
      const task = {
        message,
        handler,
        priority: this.priorities[priority] || this.priorities.NORMAL,
        timestamp: Date.now(),
        resolve,
        reject
      };

      this.queue.push(task);
      
      /* Ordenar por prioridade (menor número = maior prioridade) */
      this.queue.sort((a, b) => a.priority - b.priority);
      
      this.stats.total++;
      this.process();
    });
  }

  /* Processa mensagens da fila */
  async process() {
    /* Se já está no limite ou fila vazia, não fazer nada */
    if (this.processing >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.processing++;
    const task = this.queue.shift();
    const startTime = Date.now();

    try {
      /* Executar handler da mensagem */
      const result = await task.handler(task.message);
      
      /* Calcular tempo de processamento */
      const processingTime = Date.now() - startTime;
      
      /* Atualizar média de tempo */
      this.stats.avgTime = 
        (this.stats.avgTime * this.stats.processed + processingTime) / 
        (this.stats.processed + 1);
      
      this.stats.processed++;
      
      task.resolve(result);
      
      /* Log de sucesso apenas a cada 10 mensagens */
      if (this.stats.processed % 10 === 0) {
 //       infoLog(`Fila: ${this.stats.processed}/${this.stats.total} processadas (${this.stats.failed} erros)`);
      }
    } catch (error) {
      this.stats.failed++;
      errorLog(`Erro ao processar mensagem: ${error.message}`);
      task.reject(error);
    } finally {
      this.processing--;
      /* Processar próxima mensagem */
      this.process();
    }
  }

  /* Retorna tamanho da fila */
  size() {
    return this.queue.length;
  }

  /* Retorna número de mensagens sendo processadas */
  getProcessing() {
    return this.processing;
  }

  /* Retorna estatísticas */
  getStats() {
    return {
      ...this.stats,
      queueSize: this.queue.length,
      processing: this.processing,
      avgTimeMs: Math.round(this.stats.avgTime)
    };
  }

  /* Limpa a fila */
  clear() {
    this.queue = [];
  }

  /* Reseta estatísticas */
  resetStats() {
    this.stats = {
      total: 0,
      processed: 0,
      failed: 0,
      avgTime: 0
    };
  }

  /* Aumenta concorrência */
  increaseConcurrency(amount = 1) {
    this.concurrency += amount;
    infoLog(`Concorrência aumentada para ${this.concurrency}`);
    this.process();
  }

  /* Diminui concorrência */
  decreaseConcurrency(amount = 1) {
    this.concurrency = Math.max(1, this.concurrency - amount);
    warningLog(`Concorrência reduzida para ${this.concurrency}`);
  }
}


class AdaptiveMessageQueue extends MessageQueue {
  constructor(minConcurrency = 3, maxConcurrency = 20) {
    super(minConcurrency);
    
    /* Limites de concorrência */
    this.minConcurrency = minConcurrency;
    this.maxConcurrency = maxConcurrency;
    
    /* Monitoramento de performance */
    this.performanceMonitor = {
      lastCheck: Date.now(),
      checkInterval: 30000, /* 30 segundos */
      highQueueThreshold: 50,
      lowQueueThreshold: 5
    };

    /* Iniciar monitoramento */
    this.startAutoScaling();
  }

  /* Inicia auto-scaling baseado em performance */
  startAutoScaling() {
    setInterval(() => {
      const stats = this.getStats();
      const queueSize = stats.queueSize;
      const avgTime = stats.avgTimeMs;

      /* Se fila está crescendo e tempo médio está alto, aumentar concorrência */
      if (queueSize > this.performanceMonitor.highQueueThreshold && 
          avgTime < 500 && 
          this.concurrency < this.maxConcurrency) {
        this.increaseConcurrency(2);
      }

      /* Se fila está vazia e concorrência está alta, diminuir */
      if (queueSize < this.performanceMonitor.lowQueueThreshold && 
          this.concurrency > this.minConcurrency) {
        this.decreaseConcurrency(1);
      }

      /* Log periódico de status */
      if (this.stats.processed % 50 === 0) {
   //     infoLog(
//          `Fila Status: ${queueSize} aguardando | ` +
 //         `${this.processing} processando | ` +
  //        `Concorrência: ${this.concurrency} | ` +
//          `Tempo médio: ${Math.round(avgTime)}ms`
//        );
      }
    }, this.performanceMonitor.checkInterval);
  }
}


class PriorityMessageQueue extends AdaptiveMessageQueue {
  constructor(minConcurrency = 3, maxConcurrency = 20) {
    super(minConcurrency, maxConcurrency);
    
    /* Contadores por prioridade */
    this.priorityStats = {
      HIGH: 0,
      NORMAL: 0,
      LOW: 0
    };
  }

  /* Adiciona mensagem com prioridade */
  async add(message, handler, priority = 'NORMAL') {
    this.priorityStats[priority]++;
    return super.add(message, handler, priority);
  }

  /* Retorna estatísticas por prioridade */
  getPriorityStats() {
    return this.priorityStats;
  }
}



module.exports = { MessageQueue,AdaptiveMessageQueue,  PriorityMessageQueue
};
