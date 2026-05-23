const fs = require("fs");

//==================ALUGUEL================\\

const {
  groupspath, grupos, saveGroupsRent, addGroupInRent, rmGroupInRent, aluguel,
  saveRent, sendTimeDay, sendTimeHours, sendLetterTime, isGroupInRent,
  addRent, tirarRent, delRent, rentContSystem, addCourtesy, isCourtesyGroup,
  getGroupRent, valoresDeAluguel, getValuesRent, getSaveGroup, isSaveGroup
} = require("./aluguel/aluguel.js");

//================ALL-VIP===================\\

const {
  vip, saveVip, addVip, rmVip, delVip, getUsuVip, isOnlyVip, isAdvencedVip,
  isInfinityVip, vipTime, vipgp, saveGroupVip, addGroupVip, delGroupVip,
  getGroupVip, isOnlyGroupVip, isAdvencedGroupVip, isInfinityGroupVip, vipGroupTime
} = require("../../database/all-vip/systemvip.js");

//================LEVEL-FUNC===================\\

const { addUsuCardXP } = require(`../../database/leveling/level.js`);

//=========================================\\

const {
  sendHours, saveJSON, isJsonIncludes, alerandom, randomLetra,
  obrigadoEXT, sleep, colors
} = require("../../definicoes.js");

const { getname } = require("../../database/users/senderlid.js");

const coinspath = `./database/saldo virtual/moedas.json`;

if (!fs.existsSync(coinspath)) saveJSON([], coinspath);

let moedas = JSON.parse(fs.readFileSync(coinspath));

function saveCoins() {
  saveJSON(moedas, coinspath);
}

function registrarUsuInVirtualBalance(usu) {
  if (typeof usu !== 'string' || usu.trim() === '') return false;
  usu = usu.trim();

  if (moedas.some(user => user.id === usu)) return true;

  const agora = new Date();
  const UID = Math.floor(Math.random() * 900000000000) + 100000000000;

  // FORMATO CORRIGIDO: id, saldo, UID, rg, cortesia, mm, keys
  const novo = {
    id: usu,
    saldo: 0,
    UID: UID,
    rg: `${String(agora.getDate()).padStart(2, '0')}-${String(agora.getMonth() + 1).padStart(2, '0')}-${agora.getFullYear()}`,
    cortesia: 1,
    mm: String(agora.getMonth() + 1),
    keys: []
  };

  moedas.push(novo);
  saveCoins();
  return true;
}

//================== CORTESIA ==================\\

function courtesyGroup() {
  if (grupos.length > 0) {
    let gp = grupos[0];
    if (Number(sendHours("MM")) !== Number(gp.save)) {
      gp.save = sendHours("MM");
      gp.gps = [];
      saveGroupsRent();

      for (let i of moedas) {
        i.cortesia += 1;
      }
      saveCoins();
    }
  }
}

courtesyGroup();

//============== REGISTRAR USUÁRIO =================\\

//================= GETTERS ==================\\

const getSepCoins = (usu) => {
  let AB = moedas.findIndex(i => i.id === usu);
  if (AB === -1) return false;

  let data = moedas[AB];
  let sub = Number(data.saldo).toFixed(2);

  let nmr = data.saldo >= 0
    ? (data.saldo < 10 ? `0${sub}` : sub)
    : (data.saldo > -10 ? `-0${Math.abs(data.saldo).toFixed(2)}` : sub);

  return [getname(data.id), data.id, nmr, data.UID, data.rg, data.cortesia, data.mm];
};

const getCoinsUsu = (usu) => moedas.find(i => i.id === usu);

//================ ADD / REMOVE COINS ===============\\

function addCoinsInVirtualBalance(usu, value) {
  registrarUsuInVirtualBalance(usu);
  let data = getCoinsUsu(usu);
  data.saldo += Number(value);
  saveCoins();
}

function rmCoinsInVirtualBalance(usu, value) {
  registrarUsuInVirtualBalance(usu);
  let data = getCoinsUsu(usu);
  data.saldo -= Number(value);
  saveCoins();
}

//================== KEYGEN ==================\\

const gerarkey = (a, id) => {
  let num = isNaN(a) ? alerandom(9) + 1 : Number(a);
  let [p1, p2] = id.split("|");
  let idks = randomLetra() + String(a) + "-";
  idks += `${Number(p2.replace("-", "").slice(2, 8)) * Number(p1.slice(2, 8))}`;
  idks += `${randomLetra()}${String(num * 2)}${randomLetra()}-`;
  idks += `${Number(sendHours("DDMMYY")) + Number(sendHours("HHmmss"))}${randomLetra()}`;
  return idks;
};

//================ GERAR CHAVE =================\\

async function gerarTypeKey(usu, dados, restart = true) {
  registrarUsuInVirtualBalance(usu);
  let type = dados.type;
  let keys = getCoinsUsu(usu).keys;
  let tempo = dados?.tempo || `1h`;
  let transf = dados?.transf;
  let nmr, multiplicador, idks;

  if (type == 1) {
    nmr = Number(tempo.slice(0, -1));
    let letra = tempo.slice(-1).toLowerCase();
    multiplicador = letra === 'd' ? 24 : 1;
    nmr *= multiplicador;
    idks = gerarkey(nmr, `${usu}|${dados?.grupo || usu}`);
    keys.push({ key: idks, tipo: type, tempo: nmr, valor: dados?.valor || 0, transf });
    saveCoins();
  }

  if (type == 2) {
    nmr = 24;
    idks = gerarkey(nmr, `${usu}|${dados?.grupo || usu}`);
    keys.push({ key: idks, tipo: type, tempo: nmr, valor: dados?.valor || 0 });
    saveCoins();
  }

  if (type == 3 || type == 4) {
    nmr = tempo;
    idks = gerarkey(nmr, `${usu}|${dados?.grupo || usu}`);
    keys.push({ key: idks, tipo: type, tempo: nmr, valor: dados?.valor || 0, mod: dados?.mod });
    saveCoins();
  }

  if (type == 5) {
    let velocidade = dados.velocidade;
    let dias = dados.tempo;
    nmr = Number(dias.slice(0, -1));
    multiplicador = dias.endsWith("d") ? 24 : 1;
    nmr *= multiplicador;
    idks = gerarkey(nmr, `${usu}|${dados?.grupo || usu}`);
    keys.push({ key: idks, tipo: type, tempo: nmr, velocidade: Number(velocidade.slice(0, -1)), valor: dados?.valor || 0 });
    saveCoins();
  }

  if (restart) {
    console.log(colors.red(`Restart necessário para save de arquivos`));
    await sleep(3000);
    process.exit();
  }
}

//================== REMOVER KEY ==================\\

async function rmTypeKey(txt) {
  let caixa = [];
  for (let a of moedas) {
    let n = 0;
    for (let b of a.keys) {
      if (txt === b.key) caixa.push({ id: a.id, mapa: n });
      n++;
    }
  }
  if (caixa.length > 0) {
    let AB = moedas.findIndex(i => i.id === caixa[0].id);
    moedas[AB].keys.splice(caixa[0].mapa, 1);
    saveCoins();
    console.log(colors.red(`Restart necessário para save de arquivos`));
    await sleep(3000);
    process.exit();
  }
}

//============== ALL KEYS DINÂMICO =================\\

const getallkeys = () => {
  let caixa = [];
  for (let a of moedas) {
    for (let b of a.keys) {
      caixa.push({ ...b, cliente: a.id });
    }
  }
  return caixa;
};

const existKeyRentSystem = (txt) => getallkeys().some(k => k.key === txt);
const getClientKey = (txt) => getallkeys().find(k => k.key === txt);

//================== VALIDAÇÃO DE KEY ==================\\

async function validarKey(from, sender, prefix, blackmd, reply, isGroup, chave) {
  let keys = getallkeys();
  let dados = keys.find(k => k.key === chave);
  if (!dados) return;
  let type = dados.tipo;
  let cliente = dados.cliente;
  let isInfinity = dados.tempo <= 0;
  let ok = 0;

  if (type == 1 && isGroup) {
    if (!isInfinity) {
      addRent(from, cliente, dados.tempo, dados?.transf);
      reply(`*Grupo adicionado ao aluguel com sucesso* ✅`);
      ok++;
    } else {
      addGroupInRent(from, true);
      reply(`Grupo salvo na pasta com sucesso 📂`);
      ok++;
    }
  }

  if (type == 2 && isGroup) {
    if (!isCourtesyGroup(from)) {
      addCourtesy(reply, from);
      ok++;
    } else reply("Já foi validada neste mês uma cortesia neste grupo 🤨");
  }

  if (type == 3) {
    if (!isInfinityVip(sender)) {
      addVip(sender, dados.tempo, dados?.mod);
      ok++;
    } else reply(`Usuário já possui *VIP infinito*`);
  }

  if (type == 4) {
    if (!isInfinityGroupVip(from)) {
      addGroupVip(from, dados.tempo, dados?.mod);
      ok++;
    } else reply(`Grupo já possui *INFINITY GROUP VIP*`);
  }

  if (type == 5) {
    addUsuCardXP(reply, prefix, sender, `${dados.velocidade}x`, `${dados.tempo}h`);
    ok++;
  }

  if (ok > 0) rmTypeKey(dados.key);
}

//================== EXPORTS ==================\\

module.exports = {
  moedas, saveCoins, registrarUsuInVirtualBalance, addCoinsInVirtualBalance,
  rmCoinsInVirtualBalance, getSepCoins, getCoinsUsu, gerarkey, gerarTypeKey,
  validarKey, rmTypeKey, existKeyRentSystem, getClientKey,
  groupspath, grupos, saveGroupsRent, courtesyGroup, addGroupInRent,
  rmGroupInRent, aluguel, saveRent, sendTimeDay, sendTimeHours,
  sendLetterTime, isGroupInRent, getGroupRent, addRent, tirarRent,
  delRent, rentContSystem, addCourtesy, isCourtesyGroup, valoresDeAluguel,
  getValuesRent, getSaveGroup, isSaveGroup, getallkeys
};
