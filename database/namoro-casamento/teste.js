if (isCmd) {
try {
setTimeout(() => { reagir(from, "🪐") }, 1000);
await sleep(1000);
AB = similarityCmd(command);
notcmd = privateCmd(sender, prefix + command, AB[0].comando, AB[0].porcentagem);
let butao = [];
if (AB[0].porcentagem > 0) { butao.push({
text: `⧽⧽ 🪷 SUGESTÃO 🪷 ⧼⧼`, command: AB[0].comando + (budy.split(prefix + command).length > 1 ? budy.split(prefix + command)[1] : ``)});
}butao.push({ text: `⧽⧽ 🪷 MENU 🪷 ⧼⧼`,command: prefix + `menu` });// envia primeiro os botões
await EnvButton(from, [notcmd, NomeDoBot], kauroko, butao, seloctt);
// pequena pausa para evitar conflito
//await sleep(500);
// só depois envia o áudio
//await sendAudio(from, "./database/audios/mestre.mp3", "ogg/opus", seloctt);
} catch (err) {
console.error("Erro ao executar comando:", err);
await sendText(from, "⚠️ Ocorreu um erro ao processar seu comando. Tente novamente mais tarde.");
}
}