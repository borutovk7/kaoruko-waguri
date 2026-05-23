const colors = require('colors');

exports.sayLog = (message) => {
  console.log(colors.bold.bgCyan.white("[KAORUKO BOT  | TALK]"), message);
};

exports.inputLog = (message) => {
  console.log(colors.bold.bgMagenta.white("[KAORUKO BOT  | INPUT]"), message);
};

exports.infoLog = (message) => {
  console.log(colors.bold.bgBlue.white("[KAORUKO BOT  | INFO]"), message);
};

exports.successLog = (message) => {
  console.log(colors.bold.bgGreen.white("[KAORUKO BOT  | SUCCESS]"), message); 
}

exports.errorLog = (message) => {
  console.log(colors.bold.bgRed.white("[KAORUKO BOT  | ERROR]"), message);
};

exports.warningLog = (message) => {
  console.log(colors.bold.bgYellow.black("[KAORUKO BOT  | WARNING]"), message); 
};

exports.eventLog = (type, { user, group, isGroup, date, time, content, messageType }) => {
  const eventType = colors.bold.bgBlue.white(`[ ${type.toUpperCase()} ]`);
  const location = isGroup ? `${colors.white('Grupo')}: ${colors.bold.cyan(group || 'Desconhecido')}` : `${colors.white('Privado')}`;
  const userDisplay = colors.magenta('Usuário') + `: ${colors.bold(user || 'Desconhecido')}`;
  const contentDisplay = colors.white('Conteúdo') + `: ${colors.dim(content || "N/A")}`;
  const typeDisplay = messageType ? colors.gray(`(${messageType || "Desconhecido"})`) : '';
  const dateTime = colors.white(`${date} às ${time}`);
  console.log(`${eventType} ${dateTime} | ${userDisplay} | ${location} | ${contentDisplay} ${typeDisplay}`);
};
