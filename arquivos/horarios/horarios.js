const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function obterHorarioAtual() {
  const agora = moment.tz('America/Sao_Paulo');
  const horas = agora.hours().toString().padStart(2, '0');
  const minutos = agora.minutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
}

function gerarHorariosSequenciais(hora) {
  const horarios = new Set();
  let minutoInicio = 1;
  let minutoFim = 31;

  while (horarios.size < 7) {
    const horarioInicio = `${hora}:${minutoInicio.toString().padStart(2, '0')}`;
    const horarioFim = `${hora}:${minutoFim.toString().padStart(2, '0')}`;
    horarios.add(` ${horarioInicio} - ${horarioFim}`);

    // Incrementa minutos com um pouco de aleatoriedade
    minutoInicio += 4 + Math.floor(Math.random() * 5);
    minutoFim += 4 + Math.floor(Math.random() * 5);

    // Garante que os minutos fiquem dentro do intervalo
    if (minutoInicio > 30) minutoInicio = 1 + (minutoInicio % 30);
    if (minutoFim > 59) minutoFim = 31 + (minutoFim % 30);
  }

  return [...horarios];
}

function gerarHorariosAleatorios(hora, minMinuto = 0, maxMinuto = 59) {
  const plataformas = JSON.parse(fs.readFileSync('./arquivos/horarios/plataformas.json'));
  const resultado = plataformas.map(plataforma => ({
    name: plataforma,
    times: gerarHorariosSequenciais(hora)
  }));
  return resultado;
}

function buscarHorarios(horarioAtual) {
  try {
    const hora = horarioAtual.split(':')[0];
    const plataformasComHorarios = gerarHorariosAleatorios(hora, 0, 59);
    let saida = `🍀 *HORÁRIOS PAGANTES DAS ${hora}* 💰\n\n`;

    plataformasComHorarios.forEach(plataforma => {
      saida += `${plataforma.name}\n`;
      plataforma.times.forEach(horario => {
        saida += `   ${horario}\n`;
      });
      saida += '\n';
    });

    saida += `\nDica: alterne entre os giros entre normal e turbo, se vier um Grande Ganho, PARE e espere a próxima brecha!\n🔞NÃO INDICADO PARA MENORES🔞\nLembrando a todos!\nHorários de probabilidades aumentam muito sua chance de lucrar, mas lembrando que não anula a chance de perda, por mais que seja baixa jogue com responsabilidade...`;

    return saida;
  } catch (erro) {
    console.error('Erro ao buscar os horários:', erro);
    return null;
  }
}

module.exports = {
  gerarHorariosAleatorios,
  obterHorarioAtual,
  buscarHorarios
};