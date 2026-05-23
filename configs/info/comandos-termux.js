const cmd_termux = (prefix) => {
  return `
🌌 *GUIA DE INSTALAÇÃO - KAORUKO SYSTEM* 🌌
_Prepare seu ambiente com a calma de quem observa as estrelas._

✨ *PASSO 1: O INÍCIO*
Primeiro, instale o Termux (versão recomendada):
🔗 https://www.mediafire.com/file/0npdmv51pnttps0/com.termux_0.119.1-119_minAPI21(arm64-v8a,armeabi-v7a,x86,x86_64)(nodpi)_apkmirror.com.apk/file

🔭 *PASSO 2: CONFIGURANDO O REPOSITÓRIO*
Abra o Termux e digite:
\`termux-change-repo\`
_Dica: Confirme, marque a terceira opção (Mirror by Grimler), confirme e prossiga._

🚀 *PASSO 3: ATUALIZAÇÃO DO SISTEMA*
Execute os comandos abaixo para alinhar seu sistema:
\`apt-get update && apt-get upgrade -y\`
_Nota: Se o sistema perguntar algo, digite 'y' e confirme._

📦 *PASSO 4: INSTALANDO AS FERRAMENTAS*
Copie e cole este comando único para instalar tudo o que é necessário:
\`pkg upgrade -y && pkg update -y && pkg install nodejs-lts ffmpeg wget git -y\`

📂 *PASSO 5: ACESSO AOS ARQUIVOS*
Dê permissão para o Termux acessar sua memória:
\`termux-setup-storage\`
_Confirme a permissão na tela do seu celular._

🌸 *PASSO 6: INICIANDO O BOT*
Agora, entre na pasta do projeto e inicie a jornada:
\`cd /sdcard/KAORUKO && sh start.sh\`

_Caso não tenha os arquivos, você pode encontrá-los em:_
🌐 Não disponível Gratuitamente ainda.

*Lembre-se: Cada passo é importante, assim como cada estrela no céu. Faça com atenção e gentileza!* ✨
`
}

exports.cmd_termux = cmd_termux
