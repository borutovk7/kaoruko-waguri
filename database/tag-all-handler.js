const { warningLog, errorLog, mess } = require('../definicoes.js');

async function verificarTagAll(info, menc_jid2, groupMembers) {
  try {
    const nonJidMentions = info.message?.extendedTextMessage?.contextInfo?.nonJidMentions;
    const isTagAll = nonJidMentions || (menc_jid2?.length >= groupMembers.length - 1 && menc_jid2?.length > 0);
    
    return {
      isTagAll,
      nonJidMentions,
      mentionCount: menc_jid2?.length || 0,
      totalMembers: groupMembers.length
    };
  } catch (error) {
    errorLog(`Erro ao verificar tag all: ${error.message}`);
    return { isTagAll: false };
  }
}

async function executarAcaoTagAll(kyomi, from, sender, info, isGroupAdmins, SoDono, IS_DELETE, mess) {
  try {
    if (isGroupAdmins || SoDono) {
      await kyomi.sendMessage(from, { 
        text: mess.frasesTagAll(sender) , 
        mentions: [sender] 
      }, { quoted: info });
    } else {
      await kyomi.sendMessage(from, { text: mess.markingAllMember() }, { quoted: info });
      
      if (IS_DELETE) {
        setTimeout(async () => {
          await kyomi.sendMessage(from, { 
            delete: { 
              remoteJid: from, 
              fromMe: false, 
              id: info.key.id, 
              participant: sender 
            } 
          });
        }, 500);
      }
      
      await kyomi.groupParticipantsUpdate(from, [sender], "remove");
    }
  } catch (error) {
    errorLog(`Erro ao executar ação tag all: ${error.message}`);
  }
}

module.exports = {
  verificarTagAll,
  executarAcaoTagAll
};
