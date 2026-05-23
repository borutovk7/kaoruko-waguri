exports.listLanguages = (prefix) => {
return `Você pode ver a lista de idiomas disponíveis em para usar no tradutor ou gtts aqui: https://cloud.google.com/translate/docs/languages
–
• Exemplificando o uso das funções dos comandos *gtts e tradutor*:
–
↳ *Comando:* ${prefix}gtts pt miwa
*[pt]* - O idioma, o sotaque que ele(a) irá falar no áudio.
*[miwa]* - Vai ser o que será o texto ou frase falado por ele(a).
–
↳ *Comando:* ${prefix}tradutor pt|love you
*[pt]* - O idioma que vai ser realizado a tradução da palavra ou texto.
*[love you]* - O texto/palavra que ele(a) vai fazer a tradução para o idioma.`
}

exports.bemvindo = (prefix) => {
return `Este comando é para informar, como você deve ativar o bem vindo, e lembrando, esse bemvindo, contém uma legenda diferente, a cada grupo que for colocado, o bemvindo2 tem essa função também.
–
• As diferenças entre os bem vindos é que o bemvindo tem foto e o bemvindo2 não contém foto em si somente a mensagem.
–
• Para desativar ou ativar o *bemvindo ou bemvindo2*, use os números 0 ou 1. 
\t• Exemplo de como ativar e desativar o recurso em seu grupo: 
\t\t• *Ativando o recurso:* ${prefix}bemvindo 1 ou ${prefix}bemvindo2 1, ative somente um dos dois para evitar flood em seu grupo.
\t\t• *Desativando o recurso:* ${prefix}bemvindo 0 ou ${prefix}bemvindo2 0, caso um dos 2 esteja ativado.
–
• Para realizar a troca do fundo da imagem do bem vindo, é só mandar uma foto no WhatsApp, retangular e marcar ela com o comando *${prefix}fundobemvindo* ou se quer trocar a do saiu, use *${prefix}fundosaiu*
\t• *Observação:* Os comandos para mudar o fundo é somente disponibilizado o uso ao proprietário(s) do bot.
–
• *Parâmetros usados que podem ser usados para personalizar sua mensagem:*
*#hora#* => Com essa definição inserida em seu argumento, irá mostrar a hora no momento exato que foi realizada a entrada ou saída do integrante do grupo.
*#nomedogp#* => Usada para mostrar o nome do grupo em seu texto de bem-vindo.
*#numerodele#* => Tem a função de mostrar o número do integrante que entrou ou saiu do grupo.
*#prefixo#* => Vai aparecer qual o símbolo que você está utilizando no bot, para fazer ele funcionar.
*#descrição#* => Com essa definição irá mostrar a descrição do grupo ou regras como você preferir chamar.
–
Para definir uma legenda de quando um integrante sair ou entrar em seu grupo, veja os exemplos baixo:
• Adicionar a legenda ou mensagem para dar as saudações ao novo integrante de forma personalizada: 
\t\t• Caso esteja usando o *bem-vindo* (com foto), use: *${prefix}legendabv sua mensagem..*
\t\t• Usando o *bem-vindo2* (sem foto)? Use *${prefix}legendabv2 sua mensagem..*
• Definir uma legenda ou mensagem para a saída de um integrante do grupo:
\t\t• Caso esteja usando o *bem-vindo* (com foto), use: *${prefix}legendasaiu sua mensagem..*
\t\t• Usando o *bem-vindo2* (sem foto)? Use *${prefix}legendasaiu2 sua mensagem..*`
}

exports.infoOwner = (prefix, NickDono, numerodn, NomeDoBot, sender) => {
return `Olá @${sender.split("@")[0]}, aqui está as informações sobre meu dono:
–
• Número do proprietário: wa.me/${numerodn}
• Proprietário: ${NickDono}`
}

exports.configbot = (prefix) => {
return `*COMO CONFIGURAR O BOT, TUTORIAL ABAIXO:*
–
Primeiro ligue o bot no termux, e vá para o WhatsApp do bot em algum privado, utilize os seguintes comandos.
*Obs:* Pode por letras modificadas também se você quiser!
–
• *1)* Para alterar o nome do bot, use o seguinte comando:
\t• ${prefix}Nome-bot Nome que deseja colocar em seu bot
–
• *2)* Para alterar o nick do dono do bot, use o seguinte comando:
\t• ${prefix}Nick-dono Seu nick aqui
–
• *3)* Configure o número do dono, com o seguinte comando:
\t• ${prefix}numero-dono 558288279194
*Obs:* O número tem que ser junto, e não pode conter o símbolo de + nem - e não pode ter o 9 da operadora, tem que ser o número idêntico ao seu do whatsapp.
–
• *4)* Configure o prefixo que você deseja no bot, usando o seguinte comando:
\t• ${prefix}prefixo-bot #
*Obs:* Pode por qualquer símbolo, se o seu símbolo for ${prefix} ele vai passar a ser # de acordo com o que você mudou.
–
Boa sorte! Dúvidas? Entre em contato com o criador, usando: *${prefix}criador*`
}

exports.infoTinderSabs = (prefix) => {
return `🌟😼 - Aprenda a como se registrar no tinder da Sab's, a ideia do tinder é você encontrar um(a) parceiro(a) ou um(a) amigo(a) rainbow, sabe? O projeto foi elaborado e estruturado por *@Matheus*.
—
• *${prefix}rgtinder* -> Registre-se no tinder da Sab's através deste comando, ele vai te explicar o que você deve retornar ou não.
—
• *${prefix}meutinder* -> Veja como está seu perfil atualmente no Tinder Sab's.
—
• *${prefix}rolar ou ${prefix}tinder* -> Veja os participantes com este comando aqui!
—
• *${prefix}tindernome* -> Troque seu nome no nosso sistema, realizamos na hora.
—
• *${prefix}tinderidade* -> Completou ano ou quer mudar? Alteramos na mesma hora.
—
• *${prefix}setgene* -> Mudar o seu gênero que está atualmente no sistema.
—
• *${prefix}setfiltro* -> Coloque o filtro que você deseja atualmente, explicando: 1 para homens, 2 para mulheres e 3 para todos.
—
• *${prefix}setsex* -> Mude a sua sexualidade, caso ouver um erro ou você mudou...
—
• *${prefix}tinderbio* -> (Digitar a sua biografia que você deseja atualmente.
—
• *${prefix}tinderfoto* -> Marque a sua foto que você deseja para mudar no sistema.
—
• *${prefix}sairtinder* -> Caso você desejar deixar de ser incluído no tinder.`
}

exports.infoRent = (valoresDeAluguel) => {
return `📌 Olá, viajante! Está em dúvida sobre como funciona o aluguel da *Anny*? Vou lhe explicar de forma clara e objetiva. 🧐
  
Na tabela acima você encontra os valores de aluguel mensal. O preço varia conforme a quantidade de meses contratados, sendo o valor aplicado por grupo. 😃

Por exemplo:
- Se alugar dois grupos por 1 mês, o cálculo será ${valoresDeAluguel[1].valor}+${valoresDeAluguel[1].valor} = ${valoresDeAluguel[1].valor + valoresDeAluguel[1].valor}$.
- Se alugar dois grupos por 2 meses, o cálculo será ${valoresDeAluguel[2].valor}+${valoresDeAluguel[2].valor} = ${valoresDeAluguel[2].valor + valoresDeAluguel[2].valor}$. 💵

Caso tenha interesse em contratar a *Anny* ou queira mais informações detalhadas, entre em contato diretamente com meu administrador no privado. 👑`
}

exports.infoPremium = (prefix) => {
return `• INFORMAÇÕES SOBRE O PREMIUM:
–
O sistema de premium foi atualizado, agora você pode definir o tempo que a pessoa atua como usuário premium e também é claro nós não esquecemos de colocar com os dias infinitos sem limite! *Leia abaixo:*
–
~ O comando *1.1* ele é liberado a todos os usuários, já o *1.2* não é:
–
*1.1)* Para consultar o tempo de expiração ou até mesmo se está na lista do mesmo, a partir do comando: *${prefix}consultar_premium*
–
*1.2)* O comando ${prefix}premiumlist é disponibilizado a todos os usuários da lista, então os premium pode consultar todos os usuários que estão na lista também.
–
~ Lembre-se que os comandos abaixo, somente o(a) proprietário(a) pode utilizar:
–
*2.1)* Comando: ${prefix}Addpremium @mencione-número/quantidade - Adiciona a pessoa da lista de usuários premiuns.
↳ Explicando para o leigos é para mencionar o usuário no grupo ou colocar o número da pessoa que você deseja executa a ação. Exemplo do número 558288279194, já mencionando você deve usar no grupo pois no pv não possível mencionar usuário... Já a quantidade, são os dias que você quer colocar para usuário ficar como premium, se colocar 30, será 30 dias, se colocar 0 o usuário(a) será agraciado com o infinito sem validade de expiração.
–
*2.2)* Comando: ${prefix}Delpremium @mencione-número - Remove a pessoa da lista de usuários premiuns.
↳ Nessa parte é somente o número ou @ da pessoa, caso esteja no grupo é claro. Se estiver no pv é o número sem o @... Como você viu no exemplo 2.1, já sabe né?
–
Entendeu? =) Dúvidas entre em contato com criador do bot, ele poderá está lhe ajudando.`
}

exports.infoCmdPremium = (prefix) => {
return `• INFORMAÇÕES SOBRE OS COMANDOS PREMIUM:
–
Adicione e remova seus próprios comandos da lista, para somente aqueles que atuam como premium no momento usarem... Lembrando que somente o(a) proprietário(a), pode usar estes comandos, beijos!

*1.1)* Para adicionar o comando, você deve usar esse: ${prefix}addcmdprem comando
↳ Você deve olhar o menu principal, entre os outros menus e escolha os comandos... Depois disso você dá o comando acima, para colocar ele na lista, mas deve-se se lembrar escreva do jeito que está no menu.
–
*1.2)* Para remover o comando do uso somente para os usuários premium, use: ${prefix}delcmdprem comando
↳ Este comando só irá remover da lista falada acima. Automaticamente, o comando é apagado do ${prefix}menupremium e do ${prefix}cmdpremlist.
–
*1.3)* Conferir os comandos que estão atualmente na lista, use: ${prefix}cmdpremlist
↳ Este comando vai lhe informar todos os comandos que estão na lista atualmente. Lembrando que todos os usuários podem usar este comando...`
}