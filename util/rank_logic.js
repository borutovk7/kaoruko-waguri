//By: 𖧄 𝐋𝐔𝐂𝐀𝐒 𝐌𝐎𝐃 𝐃𝐎𝐌𝐈𝐍𝐀 𖧄
//Canal: https://whatsapp.com/channel/0029Vb69bDnAe5VmzSMwBH11

/**
 * Função para determinar e formatar o cargo do usuário com tema Kaoruko Waguri.
 * O resultado é formatado com Markdown para exibição em ambientes como o WhatsApp.
 * 
 * @param {boolean} issupre Indica se o usuário é o criador supremo (Estrela Suprema).
 * @param {boolean} isOwner Indica se o usuário é o dono/mestre (Guardião Celestial).
 * @param {boolean} isGroupAdmins Indica se o usuário é um administrador do grupo (Protetor Estelar).
 * @returns {string} O cargo formatado com o tema e a descrição dinâmica.
 */
function getFormattedRank(issupre, isOwner, isGroupAdmins) {
  let thematicName;
  let description;
  let formatting;

  if (issupre) {
    thematicName = "Estrela Suprema";
    description = "Criador Supremo";
    // Formatação mais forte: Negrito + Itálico
    formatting   = { start: "*_", end: "_*" };   
  } else if (isOwner) {
    thematicName = "Guardião Celestial";
    description = "Mestre";
    // Formatação forte: Negrito
    formatting   = { start: "*", end: "*" };  
  } else if (isGroupAdmins) {
    thematicName = "Protetor Estelar";
    description = "Administrador";
    // Formatação moderada: Itálico
    formatting = { start: "_", end: "_" };
  } else {
    thematicName = "Luz Inicial";
    description = "Usuário";
    // Formatação leve: sem destaque
    formatting = { start: "", end: "" };
  }

  const cargoText = `${thematicName} (${description})`;
  return `${formatting.start}${cargoText}${formatting.end}`;
}

module.exports = { getFormattedRank };