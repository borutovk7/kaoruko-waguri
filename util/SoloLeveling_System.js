const fs   = require('fs');
const path = require('path');

const CONFIG = {
  BASE_DIR:      path.join(__dirname, 'arquivos/rpg_soleleveling'),
  USERS_DIR:     path.join(__dirname, 'arquivos/rpg_soleleveling/users'),
  BATTLES_DIR:   path.join(__dirname, 'arquivos/rpg_soleleveling/battles'),
  GUILDS_DIR:    path.join(__dirname, 'arquivos/rpg_soleleveling/guilds'),
  HUNTERS_FILE:  path.join(__dirname, 'arquivos/rpg_soleleveling/hunters.json'),
  SHADOWS_FILE:  path.join(__dirname, 'arquivos/rpg_soleleveling/shadows.json'),
  ITEMS_FILE:    path.join(__dirname, 'arquivos/rpg_soleleveling/items.json'),
  DUNGEONS_FILE: path.join(__dirname, 'arquivos/rpg_soleleveling/dungeons.json'),
  SKILLS_FILE:   path.join(__dirname, 'arquivos/rpg_soleleveling/skills.json'),
};

const DEFAULT_IMG   = 'https://res.cloudinary.com/dlmoujcpv/image/upload/v1776733419/trindade-1776733417142.jpg';
const SYSTEM_FOOTER = 'Solo Leveling System • O Despertar';

const RANK_MULTIPLIERS = {
  'E': 1, 'D': 2, 'C': 4, 'B': 8, 'A': 15, 'S': 30, 'S+': 50, 'D (Oculto S)': 20,
};

const RANK_ORDER = ['E', 'D', 'C', 'B', 'A', 'S', 'S+'];

const GUILD_ICONS = { master: '👑', vice: '🥈', member: '🔵' };

const loadJSON = (file) => {
  const p = file.includes('/') || file.includes('\\') ? file : path.join(CONFIG.BASE_DIR, `${file}.json`);
  if (!fs.existsSync(p)) return [];
  try {
    const content = fs.readFileSync(p, 'utf8');
    return content ? JSON.parse(content) : [];
  } catch (e) {
    console.error(`Erro ao ler JSON: ${p}`, e);
    return [];
  }
};

const saveJSON = (file, data) => {
  const p = file.includes('/') || file.includes('\\') ? file : path.join(CONFIG.BASE_DIR, `${file}.json`);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
};

const createUserBase = (id, nome, rank, job, foto, stats, skills, gold) => ({
  id,
  nome,
  rank,
  job,
  foto: foto || DEFAULT_IMG,
  level: 1,
  exp: 0,
  exp_next: 100,
  stats: { forca: 10, agilidade: 10, inteligencia: 10, percepcao: 10, vitalidade: 10, ...stats },
  hp: 1000, hp_max: 1000,
  mp: 500,  mp_max: 500,
  equipamento: { cabeca: null, peito: null, pernas: null, arma: null, acessorio: null },
  skills: skills || ['Ataque Básico', 'Esquiva'],
  shadows: [],
  inventory: [],
  gold: gold || 1000,
  guilda: null,
  daily: { flexoes: 0, abdominais: 0, agachamentos: 0, corrida: 0, date: new Date().toDateString(), completed: false },
  history: [],
  pvp_wins: 0,
  pvp_losses: 0,
  total_kills: 0,
  dungeons_cleared: 0,
});

class SoloLevelingSystem {
  static init() {
    [CONFIG.BASE_DIR, CONFIG.USERS_DIR, CONFIG.BATTLES_DIR, CONFIG.GUILDS_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
    const files = [CONFIG.HUNTERS_FILE, CONFIG.SHADOWS_FILE, CONFIG.ITEMS_FILE, CONFIG.DUNGEONS_FILE, CONFIG.SKILLS_FILE];
    files.forEach(f => {
      if (!fs.existsSync(f)) saveJSON(f, []);
    });
  }

  static getUser(id) {
    const p = path.join(CONFIG.USERS_DIR, `${id}.json`);
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
  }

  static saveUser(user) {
    saveJSON(path.join(CONFIG.USERS_DIR, `${user.id}.json`), user);
  }

  static getBattle(id) {
    const p = path.join(CONFIG.BATTLES_DIR, `${id}.json`);
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
  }

  static saveBattle(id, battle) {
    saveJSON(path.join(CONFIG.BATTLES_DIR, `${id}.json`), battle);
  }

  static deleteBattle(id) {
    const p = path.join(CONFIG.BATTLES_DIR, `${id}.json`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  static getGuild(nome) {
    const p = path.join(CONFIG.GUILDS_DIR, `${nome.toLowerCase().replace(/\s+/g, '_')}.json`);
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
  }

  static saveGuild(guild) {
    saveJSON(path.join(CONFIG.GUILDS_DIR, `${guild.nome.toLowerCase().replace(/\s+/g, '_')}.json`), guild);
  }

  static listGuilds() {
    if (!fs.existsSync(CONFIG.GUILDS_DIR)) return [];
    return fs.readdirSync(CONFIG.GUILDS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => JSON.parse(fs.readFileSync(path.join(CONFIG.GUILDS_DIR, f), 'utf8')));
  }

  static calculateDamage(attacker, defender, skillMult = 1.0) {
    const baseAtk = attacker.stats ? attacker.stats.forca * 5 : attacker.ataque;
    const baseDef = defender.stats ? defender.stats.vitalidade * 2 : (defender.defesa || 0);
    const damage  = Math.max(10, (baseAtk - baseDef) * skillMult);
    return Math.floor(damage * (0.85 + Math.random() * 0.3));
  }

  static addExp(user, amount) {
    user.exp += amount;
    let leveledUp = false;
    while (user.exp >= user.exp_next) {
      user.exp      -= user.exp_next;
      user.exp_next  = Math.floor(user.exp_next * 1.2);
      user.level++;
      user.hp_max += 100;
      user.mp_max += 50;
      user.hp      = user.hp_max;
      user.mp      = user.mp_max;
      user.stats.forca        += 2;
      user.stats.vitalidade   += 2;
      user.stats.agilidade    += 2;
      user.stats.inteligencia += 2;
      user.stats.percepcao    += 2;
      leveledUp = true;
    }
    return leveledUp;
  }

  static checkRankUp(user) {
    const thresholds = { 'E': 10, 'D': 25, 'C': 50, 'B': 80, 'A': 120, 'S': 200 };
    const idx = RANK_ORDER.indexOf(user.rank);
    if (idx === -1 || idx >= RANK_ORDER.length - 1) return false;
    const needed = thresholds[user.rank];
    if (user.level >= needed) {
      user.rank = RANK_ORDER[idx + 1];
      return true;
    }
    return false;
  }

  static checkDailyPenalty(user, kaoruko, from, info) {
    const today = new Date().toDateString();
    if (user.daily.date !== today && !user.daily.completed) {
      user.hp     = Math.floor(user.hp_max * 0.1);
      user.daily  = { flexoes: 0, abdominais: 0, agachamentos: 0, corrida: 0, date: today, completed: false };
      this.saveUser(user);
      kaoruko.sendMessage(from, {
        text: '⚠️ *PENALIDADE ATIVADA!*\n\nVocê não completou suas missões diárias ontem.\nSeu HP foi reduzido como punição do Sistema.',
      }, { quoted: info });
    } else if (user.daily.date !== today) {
      user.daily = { flexoes: 0, abdominais: 0, agachamentos: 0, corrida: 0, date: today, completed: false };
      this.saveUser(user);
    }
  }

  static getSkillByName(nome) {
    const skills = loadJSON(CONFIG.SKILLS_FILE);
    return skills.find(s => s.nome.toLowerCase() === nome.toLowerCase()) || null;
  }

  static applyItemEffect(user, item) {
    if (item.tipo === 'Consumível') {
      const s = item.stats || {};
      if (s.hp)  user.hp  = Math.min(user.hp_max, user.hp + s.hp);
      if (s.mp)  user.mp  = Math.min(user.mp_max, user.mp + s.mp);
      if (s.exp) this.addExp(user, s.exp);
      return `🧪 Você usou *${item.nome}*! ${item.efeito}`;
    }
    if (['Arma', 'Armadura', 'Acessório'].includes(item.tipo)) {
      const slot = item.slot || (item.tipo === 'Arma' ? 'arma' : item.tipo === 'Acessório' ? 'acessorio' : 'peito');
      const old  = user.equipamento[slot];
      if (old) {
        const allItems = loadJSON(CONFIG.ITEMS_FILE);
        const oldItem  = allItems.find(i => i.nome === old);
        if (oldItem?.stats) {
          Object.keys(oldItem.stats).forEach(st => {
            if (user.stats[st] !== undefined) user.stats[st] -= oldItem.stats[st];
          });
        }
      }
      user.equipamento[slot] = item.nome;
      if (item.stats) {
        Object.keys(item.stats).forEach(st => {
          if (user.stats[st] !== undefined) user.stats[st] += item.stats[st];
        });
      }
      return `⚔️ Você equipou *${item.nome}*!`;
    }
    return `❓ Não foi possível usar ${item.nome}.`;
  }

  static buildStatusText(user) {
    const rankBar  = '█'.repeat(Math.min(10, Math.floor(user.level / 5))) + '░'.repeat(Math.max(0, 10 - Math.floor(user.level / 5)));
    const hpBar    = '❤️'.repeat(Math.min(5, Math.ceil((user.hp / user.hp_max) * 5)));
    const equip    = user.equipamento;
    const equipStr =
      `🗡️ Arma: ${equip.arma || 'Nenhuma'}\n` +
      `⛑️ Cabeça: ${equip.cabeca || 'Nenhuma'}\n` +
      `🛡️ Peito: ${equip.peito || 'Nenhum'}\n` +
      `👟 Pernas: ${equip.pernas || 'Nenhuma'}\n` +
      `💍 Acessório: ${equip.acessorio || 'Nenhum'}`;

    return (
      `👤 *JANELA DE STATUS*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `*Nome:* ${user.nome}\n` +
      `*Rank:* ${user.rank}  •  *Nível:* ${user.level}\n` +
      `*Classe:* ${user.job}\n` +
      `*Guilda:* ${user.guilda || 'Sem guilda'}\n\n` +
      `${hpBar}\n` +
      `❤️ *HP:* ${user.hp}/${user.hp_max}\n` +
      `🔷 *MP:* ${user.mp}/${user.mp_max}\n` +
      `🌟 *EXP:* ${user.exp}/${user.exp_next}\n` +
      `📊 Progresso: [${rankBar}]\n\n` +
      `⚔️ *Força:* ${user.stats.forca}\n` +
      `🛡️ *Vitalidade:* ${user.stats.vitalidade}\n` +
      `⚡ *Agilidade:* ${user.stats.agilidade}\n` +
      `🧠 *Inteligência:* ${user.stats.inteligencia}\n` +
      `👁️ *Percepção:* ${user.stats.percepcao}\n\n` +
      `💰 *Gold:* ${user.gold.toLocaleString()}G\n` +
      `🏆 *PvP:* ${user.pvp_wins || 0}V / ${user.pvp_losses || 0}D\n` +
      `☠️ *Mortes:* ${user.total_kills || 0}  •  🏟️ *Dungeons:* ${user.dungeons_cleared || 0}\n\n` +
      `📦 *Equipamentos:*\n${equipStr}`
    );
  }

  static async handleCommand(from, sender, body, pushname, kaoruko, info, sendlistbuttons, sendListB, prefix = '.') {
    try {
      this.init();

      const id   = sender.replace('@s.whatsapp.net', '');
      let user   = this.getUser(id);
      const p    = prefix;
      const cmd  = body.split(' ')[0].toLowerCase();
      const args = body.split(' ').slice(1);

      if (cmd === `${p}registrar` || cmd === `${p}rpg`) {
        if (user) {
          return await sendlistbuttons(from, {
            image:   { url: user.foto || DEFAULT_IMG },
            caption: `👋 Olá, Hunter *${user.nome}*!\n\nVocê já está registrado no Sistema. O que deseja fazer agora?`,
            footer:  SYSTEM_FOOTER,
          }, kaoruko, [
            { type: 'cmd', text: '👤 Status',     command: `${p}status`     },
            { type: 'cmd', text: '👾 Caçar',      command: `${p}cacar`      },
            { type: 'cmd', text: '🎒 Inventário', command: `${p}inventario` },
          ], info);
        }
        return await sendlistbuttons(from, {
          image:   { url: DEFAULT_IMG },
          caption: `🌑 *SISTEMA DE DESPERTAR*\n\nBem-vindo ao Sistema, onde apenas os fortes sobrevivem.\nVocê foi escolhido para se tornar um Hunter.\n\nEscolha um Hunter existente ou *crie seu próprio personagem*!`,
          footer:  SYSTEM_FOOTER,
        }, kaoruko, [
          { type: 'cmd', text: '🎭 Ver Hunters',      command: `${p}hunters`     },
          { type: 'cmd', text: '✨ Criar Personagem', command: `${p}criar`       },
          { type: 'cmd', text: '📜 Ajuda',            command: `${p}menurpg`  },
        ], info);
      }

      if (cmd === `${p}criar`) {
        if (user) return kaoruko.sendMessage(from, { text: '⚠️ Você já possui um perfil.' }, { quoted: info });
        return kaoruko.sendMessage(from, {
          text:
            `📝 *CRIAÇÃO DE PERSONAGEM*\n\n` +
            `Use o comando:\n\`${p}registrar_custom Nome | Classe | URL_da_Foto\`\n\n` +
            `*Classes disponíveis:*\n` +
            `• Espadachim  • Mago  • Arqueiro\n` +
            `• Curandeiro  • Guerreiro  • Assassino\n\n` +
            `*Exemplo:*\n\`${p}registrar_custom Arthur | Espadachim | https://link.jpg\``,
        }, { quoted: info });
      }

      if (cmd === `${p}registrar_custom`) {
        if (user) return kaoruko.sendMessage(from, { text: '⚠️ Você já possui um perfil.' }, { quoted: info });
        const parts = args.join(' ').split('|').map(a => a.trim());
        if (parts.length < 2) return kaoruko.sendMessage(from, { text: `❌ Formato inválido. Use: \`${p}registrar_custom Nome | Classe | URL_Foto\`` }, { quoted: info });

        const [nome, classe, foto] = parts;
        const validClasses = ['espadachim', 'mago', 'arqueiro', 'curandeiro', 'guerreiro', 'assassino'];
        const classeNorm   = classe.toLowerCase();

        const classStats = {
          espadachim: { forca: 15, agilidade: 12, inteligencia: 8, percepcao: 10, vitalidade: 12 },
          mago:       { forca: 8,  agilidade: 10, inteligencia: 20, percepcao: 12, vitalidade: 8 },
          arqueiro:   { forca: 10, agilidade: 18, inteligencia: 10, percepcao: 18, vitalidade: 8 },
          curandeiro: { forca: 8,  agilidade: 10, inteligencia: 15, percepcao: 12, vitalidade: 15 },
          guerreiro:  { forca: 18, agilidade: 10, inteligencia: 8,  percepcao: 8,  vitalidade: 18 },
          assassino:  { forca: 12, agilidade: 20, inteligencia: 10, percepcao: 15, vitalidade: 8 },
        };

        const stats = classStats[classeNorm] || {};
        user = createUserBase(id, nome, 'E', classe, foto || DEFAULT_IMG, stats, ['Ataque Básico', 'Esquiva'], 1000);
        user.hunter_id = 'custom_' + Date.now();
        this.saveUser(user);

        return await sendlistbuttons(from, {
          image:   { url: user.foto },
          caption:
            `✨ *PERSONAGEM CRIADO!*\n\n` +
            `Bem-vindo, Hunter *${nome}*.\n` +
            `Classe: *${classe}*  •  Rank: *E*\n\n` +
            `Você começa com 1.000G e as habilidades básicas.\n` +
            `Complete missões diárias para evoluir!`,
          footer:  SYSTEM_FOOTER,
        }, kaoruko, [{ type: 'cmd', text: '👤 Ver Status', command: `${p}status` }], info);
      }

      if (cmd === `${p}hunters`) {
        const hunters   = loadJSON(CONFIG.HUNTERS_FILE);
        const available = hunters.filter(h => h.disponivel);
        if (!available.length) return kaoruko.sendMessage(from, { text: '😔 Todos os hunters já foram escolhidos.' }, { quoted: info });
        return await sendListB(from, {
          image:   { url: DEFAULT_IMG },
          caption: `🎭 *SELEÇÃO DE HUNTERS*\n\nEscolha um dos Hunters abaixo para despertar seus poderes.\nCada Hunter possui atributos e habilidades únicas.`,
          footer:  'Solo Leveling System • Escolha seu Destino',
        }, kaoruko, sender, 'Lista de Hunters', [{
          title:   'Hunters Disponíveis',
          options: available.map(h => ({ title: h.nome, body: `Rank: ${h.rank} | Classe: ${h.classe}`, command: `${p}escolher ${h.nome}` })),
        }], info);
      }

      if (cmd === `${p}escolher`) {
        if (user) return kaoruko.sendMessage(from, { text: '⚠️ Você já possui um perfil.' }, { quoted: info });
        const name    = args.join(' ').trim();
        const hunters = loadJSON(CONFIG.HUNTERS_FILE);
        const hIdx    = hunters.findIndex(h => h.nome.toLowerCase().includes(name.toLowerCase()));

        if (hIdx === -1 || !hunters[hIdx].disponivel)
          return kaoruko.sendMessage(from, { text: '❌ Hunter indisponível ou não encontrado.' }, { quoted: info });

        hunters[hIdx].disponivel = false;
        hunters[hIdx].owner      = id;
        saveJSON(CONFIG.HUNTERS_FILE, hunters);

        const h  = hunters[hIdx];
        user     = createUserBase(id, h.nome, h.rank, h.classe, h.foto, h.stats, h.skills, 10000);
        user.hunter_id = h.id;
        user.level     = h.id === 'sung_jin_woo' ? 1 : 80;
        this.saveUser(user);

        return await sendlistbuttons(from, {
          image:   { url: user.foto },
          caption:
            `✨ *DESPERTAR CONCLUÍDO!*\n\n` +
            `Bem-vindo, Hunter *${h.nome}*.\n` +
            `Rank: *${h.rank}*  •  Classe: *${h.classe}*\n\n` +
            `${h.descricao || ''}\n\n` +
            `O Sistema agora está integrado à sua consciência.`,
          footer:  SYSTEM_FOOTER,
        }, kaoruko, [
          { type: 'cmd', text: '👤 Ver Status',      command: `${p}status` },
          { type: 'cmd', text: '👾 Primeira Caçada', command: `${p}cacar`  },
        ], info);
      }

      if (cmd === `${p}mudar_foto`) {
        if (!user) return kaoruko.sendMessage(from, { text: `❌ Registre-se primeiro com ${p}rpg` }, { quoted: info });
        const newFoto = args[0];
        if (!newFoto || !newFoto.startsWith('http'))
          return kaoruko.sendMessage(from, { text: '❌ Forneça um link de imagem válido.' }, { quoted: info });
        user.foto = newFoto;
        this.saveUser(user);
        return kaoruko.sendMessage(from, { text: '✅ Foto de perfil atualizada!' }, { quoted: info });
      }

      if (cmd === `${p}aprender`) {
        if (!user) return kaoruko.sendMessage(from, { text: `❌ Registre-se primeiro com ${p}rpg` }, { quoted: info });
        const skills    = loadJSON(CONFIG.SKILLS_FILE);
        const skillName = args.join(' ').trim();

        if (!skillName) {
          const learnable = skills.filter(s => {
            const rankIdx = RANK_ORDER.indexOf(s.rank_minimo);
            const userIdx = RANK_ORDER.indexOf(user.rank);
            return (rankIdx === -1 || userIdx >= rankIdx) && s.nivel_minimo <= user.level && !user.skills.includes(s.nome);
          });
          if (!learnable.length) return kaoruko.sendMessage(from, { text: '📚 Não há habilidades disponíveis para aprender no seu nível atual.' }, { quoted: info });
          return await sendListB(from, {
            image:   { url: DEFAULT_IMG },
            caption: `📚 *HABILIDADES DISPONÍVEIS*\n\nSeu Rank: *${user.rank}* | Nível: *${user.level}*`,
            footer:  'Solo Leveling System • Aprendizado',
          }, kaoruko, sender, 'Habilidades', [{
            title:   'Disponíveis para Aprender',
            options: learnable.map(s => ({ title: s.nome, body: `${s.tipo} • MP: ${s.custo_mp}`, command: `${p}aprender ${s.nome}` })),
          }], info);
        }

        const skill = skills.find(s => s.nome.toLowerCase() === skillName.toLowerCase());
        if (!skill) return kaoruko.sendMessage(from, { text: '❌ Habilidade não encontrada.' }, { quoted: info });
        if (user.skills.includes(skill.nome)) return kaoruko.sendMessage(from, { text: '⚠️ Você já conhece esta habilidade.' }, { quoted: info });
        if (skill.nivel_minimo > user.level) return kaoruko.sendMessage(from, { text: `❌ Nível insuficiente. Requer nível ${skill.nivel_minimo}.` }, { quoted: info });

        user.skills.push(skill.nome);
        this.saveUser(user);
        return kaoruko.sendMessage(from, { text: `✅ Você aprendeu: *${skill.nome}*!\n${skill.descricao}` }, { quoted: info });
      }

      if (!user) {
        if ([`${p}status`, `${p}cacar`, `${p}atacar`, `${p}fugir`, `${p}treinar`, `${p}missao`, `${p}loja`, `${p}comprar`, `${p}inventario`, `${p}usar`, `${p}arise`, `${p}arise_extract`, `${p}skills`, `${p}usar_skill`, `${p}guilda`, `${p}criar_guilda`, `${p}entrar_guilda`, `${p}sair_guilda`, `${p}ranking`, `${p}pvp`, `${p}aceitar_pvp`].includes(cmd)) {
          return kaoruko.sendMessage(from, { text: `❌ Você ainda não se registrou!\nUse *${p}rpg* para começar.` }, { quoted: info });
        }
        if (body.startsWith(p)) return null;
        return null;
      }

      this.checkDailyPenalty(user, kaoruko, from, info);

      switch (cmd) {
        case `${p}status`: {
          return await sendlistbuttons(from, {
            image:   { url: user.foto || DEFAULT_IMG },
            caption: this.buildStatusText(user),
            footer:  'Solo Leveling System • Status',
          }, kaoruko, [
            { type: 'cmd', text: '🎒 Inventário', command: `${p}inventario` },
            { type: 'cmd', text: '👾 Caçar',      command: `${p}cacar`      },
            { type: 'cmd', text: '🏪 Loja',       command: `${p}loja`       },
          ], info);
        }

        case `${p}cacar`: {
          if (this.getBattle(id))
            return kaoruko.sendMessage(from, { text: `⚠️ Você já está em batalha! Use *${p}atacar* ou *${p}fugir*.` }, { quoted: info });

          if (user.hp <= user.hp_max * 0.1)
            return kaoruko.sendMessage(from, { text: '❌ Seu HP está muito baixo para caçar! Use uma poção ou descanse.' }, { quoted: info });

          const dungeons = loadJSON(CONFIG.DUNGEONS_FILE);
          if (!dungeons.length) return kaoruko.sendMessage(from, { text: '❌ Nenhuma dungeon disponível.' }, { quoted: info });

          const userRankIdx   = RANK_ORDER.indexOf(user.rank) !== -1 ? RANK_ORDER.indexOf(user.rank) : 0;
          const eligibleDungs = dungeons.filter(d => {
            const dIdx = RANK_ORDER.indexOf(d.rank);
            return dIdx !== -1 && dIdx <= userRankIdx + 1;
          });
          const pool    = eligibleDungs.length ? eligibleDungs : dungeons;
          const dungeon = pool[Math.floor(Math.random() * pool.length)];
          const name    = dungeon.monstros[Math.floor(Math.random() * dungeon.monstros.length)];
          const mult    = RANK_MULTIPLIERS[dungeon.rank] || 1;

          const monster = {
            nome:   name,
            hp:     500 * mult,
            hp_max: 500 * mult,
            ataque: 50  * mult,
            defesa: 20  * mult,
            exp:    100 * mult,
            gold:   200 * mult,
            rank:   dungeon.rank,
            stats:  { forca: 30 * mult, vitalidade: 20 * mult },
          };

          this.saveBattle(id, { user_id: id, monster, dungeon: dungeon.nome, dungeon_rank: dungeon.rank, turn: 1 });

          return await sendlistbuttons(from, {
            image:   { url: DEFAULT_IMG },
            caption:
              `🏟️ *DUNGEON: ${dungeon.nome.toUpperCase()}*\n` +
              `━━━━━━━━━━━━━━━\n` +
              `Um *${name}* (Rank ${dungeon.rank}) bloqueou seu caminho!\n\n` +
              `👾 *HP do Monstro:* ${monster.hp}/${monster.hp_max}\n` +
              `⚔️ *Ataque:* ${monster.ataque}  🛡️ *Defesa:* ${monster.defesa}\n\n` +
              `❤️ *Seu HP:* ${user.hp}/${user.hp_max}`,
            footer:  'Solo Leveling System • Combate',
          }, kaoruko, [
            { type: 'cmd', text: '⚔️ Atacar',       command: `${p}atacar`  },
            { type: 'cmd', text: '✨ Usar Skill',    command: `${p}skills`  },
            { type: 'cmd', text: '🏃 Fugir',         command: `${p}fugir`   },
          ], info);
        }

        case `${p}skills`: {
          const battle = this.getBattle(id);
          if (!battle)
            return kaoruko.sendMessage(from, { text: `❌ Você só pode usar skills em combate.` }, { quoted: info });

          const allSkills    = loadJSON(CONFIG.SKILLS_FILE);
          const learnedSkills = user.skills.map(sn => allSkills.find(s => s.nome === sn)).filter(Boolean).filter(s => s.tipo === 'Ataque' || s.tipo === 'Ataque Mágico' || s.tipo === 'Especial');

          if (!learnedSkills.length)
            return kaoruko.sendMessage(from, { text: '❌ Você não possui skills de ataque.' }, { quoted: info });

          return await sendListB(from, {
            image:   { url: DEFAULT_IMG },
            caption: `✨ *USAR HABILIDADE*\n\nSeu MP: *${user.mp}/${user.mp_max}*\nEscolha uma habilidade para usar:`,
            footer:  'Solo Leveling System • Skills',
          }, kaoruko, sender, 'Habilidades', [{
            title:   'Skills de Ataque',
            options: learnedSkills.map(s => ({
              title:   s.nome,
              body:    `MP: ${s.custo_mp} | Dano: x${s.multiplicador_dano}`,
              command: `${p}usar_skill ${s.nome}`,
            })),
          }], info);
        }

        case `${p}usar_skill`: {
          const battle = this.getBattle(id);
          if (!battle)
            return kaoruko.sendMessage(from, { text: '❌ Você não está em combate.' }, { quoted: info });

          const skillName = args.join(' ');
          if (!user.skills.includes(skillName))
            return kaoruko.sendMessage(from, { text: '❌ Você não possui essa habilidade.' }, { quoted: info });

          const skill = this.getSkillByName(skillName);
          if (!skill)
            return kaoruko.sendMessage(from, { text: '❌ Habilidade não encontrada nos registros.' }, { quoted: info });

          if (user.mp < skill.custo_mp)
            return kaoruko.sendMessage(from, { text: `❌ MP insuficiente. Necessário: ${skill.custo_mp} MP.` }, { quoted: info });

          user.mp -= skill.custo_mp;

          if (skill.efeito === 'curar_hp') {
            const healed = Math.floor(user.hp_max * 0.2);
            user.hp = Math.min(user.hp_max, user.hp + healed);
            this.saveBattle(id, battle);
            this.saveUser(user);
            return kaoruko.sendMessage(from, {
              text: `✨ *${skill.nome}*\n\nVocê recuperou *${healed} HP*!\n❤️ HP: ${user.hp}/${user.hp_max}`,
            }, { quoted: info });
          }

          let log = '';
          const userDmg = this.calculateDamage(user, battle.monster, skill.multiplicador_dano || 1);
          battle.monster.hp -= userDmg;
          log += `✨ *${skill.nome}*\n\n⚔️ Você causou *${userDmg}* de dano!\n`;

          if (battle.monster.hp <= 0) {
            const leveled  = this.addExp(user, battle.monster.exp);
            const rankedUp = this.checkRankUp(user);
            user.gold += battle.monster.gold;
            user.total_kills = (user.total_kills || 0) + 1;
            user.dungeons_cleared = (user.dungeons_cleared || 0) + 1;
            log += `\n🏆 *VITÓRIA!*\nVocê derrotou *${battle.monster.nome}*!\n🌟 EXP: +${battle.monster.exp}\n💰 Gold: +${battle.monster.gold}G`;
            if (leveled)  log += `\n\n✨ *LEVEL UP!* Nível ${user.level}!`;
            if (rankedUp) log += `\n🎖️ *RANK UP!* Você agora é Rank ${user.rank}!`;

            this.deleteBattle(id);
            this.saveUser(user);

            const winBtns = [
              { type: 'cmd', text: '👾 Caçar Novamente', command: `${p}cacar`  },
              { type: 'cmd', text: '👤 Status',          command: `${p}status` },
            ];
            if (user.job === 'Monarca das Sombras' || user.level >= 40)
              winBtns.push({ type: 'cmd', text: '🌑 Erga-se', command: `${p}arise_extract ${battle.monster.nome}` });

            return await sendlistbuttons(from, {
              image:   { url: user.foto },
              caption: log,
              footer:  'Solo Leveling System • Resultado',
            }, kaoruko, winBtns, info);
          }

          const monsterDmg = this.calculateDamage(battle.monster, user);
          user.hp -= monsterDmg;
          log += `👾 O *${battle.monster.nome}* causou *${monsterDmg}* de dano!\n`;

          if (user.hp <= 0) {
            user.hp = Math.floor(user.hp_max * 0.1);
            user.pvp_losses = (user.pvp_losses || 0);
            log += `\n💀 *DERROTA!*\nVocê foi gravemente ferido e recuou.`;
            this.deleteBattle(id);
            this.saveUser(user);
            return kaoruko.sendMessage(from, { text: log }, { quoted: info });
          }

          battle.turn++;
          this.saveBattle(id, battle);
          this.saveUser(user);

          return await sendlistbuttons(from, {
            image:   { url: DEFAULT_IMG },
            caption: `${log}\n❤️ Seu HP: ${user.hp}/${user.hp_max}\n🔷 MP: ${user.mp}/${user.mp_max}\n👾 HP do Monstro: ${battle.monster.hp}/${battle.monster.hp_max}`,
            footer:  `Solo Leveling System • Turno ${battle.turn}`,
          }, kaoruko, [
            { type: 'cmd', text: '⚔️ Atacar',    command: `${p}atacar` },
            { type: 'cmd', text: '✨ Usar Skill', command: `${p}skills` },
            { type: 'cmd', text: '🏃 Fugir',      command: `${p}fugir`  },
          ], info);
        }

        case `${p}atacar`: {
          const battle = this.getBattle(id);
          if (!battle) return kaoruko.sendMessage(from, { text: `❌ Você não está em combate. Use *${p}cacar* para entrar em uma dungeon.` }, { quoted: info });

          let log = '';
          const userDmg = this.calculateDamage(user, battle.monster);
          battle.monster.hp -= userDmg;
          log += `⚔️ Você causou *${userDmg}* de dano ao *${battle.monster.nome}*!\n`;

          if (battle.monster.hp <= 0) {
            const leveled  = this.addExp(user, battle.monster.exp);
            const rankedUp = this.checkRankUp(user);
            user.gold += battle.monster.gold;
            user.total_kills = (user.total_kills || 0) + 1;
            user.dungeons_cleared = (user.dungeons_cleared || 0) + 1;
            log += `\n🏆 *VITÓRIA!*\nVocê derrotou *${battle.monster.nome}*!\n🌟 EXP: +${battle.monster.exp}\n💰 Gold: +${battle.monster.gold}G`;
            if (leveled)  log += `\n\n✨ *LEVEL UP!* Nível ${user.level}!`;
            if (rankedUp) log += `\n🎖️ *RANK UP!* Você agora é Rank ${user.rank}!`;

            this.deleteBattle(id);
            this.saveUser(user);

            const winBtns = [
              { type: 'cmd', text: '👾 Caçar Novamente', command: `${p}cacar`  },
              { type: 'cmd', text: '👤 Status',          command: `${p}status` },
            ];
            if (user.job === 'Monarca das Sombras' || user.level >= 40)
              winBtns.push({ type: 'cmd', text: '🌑 Erga-se', command: `${p}arise_extract ${battle.monster.nome}` });

            return await sendlistbuttons(from, {
              image:   { url: user.foto },
              caption: log,
              footer:  'Solo Leveling System • Resultado',
            }, kaoruko, winBtns, info);
          }

          const monsterDmg = this.calculateDamage(battle.monster, user);
          user.hp -= monsterDmg;
          log += `👾 O *${battle.monster.nome}* atacou e causou *${monsterDmg}* de dano!\n`;

          if (user.hp <= 0) {
            user.hp = Math.floor(user.hp_max * 0.1);
            log += `\n💀 *DERROTA!*\nVocê foi gravemente ferido e forçado a recuar.`;
            this.deleteBattle(id);
            this.saveUser(user);
            return kaoruko.sendMessage(from, { text: log }, { quoted: info });
          }

          battle.turn++;
          this.saveBattle(id, battle);
          this.saveUser(user);

          return await sendlistbuttons(from, {
            image:   { url: DEFAULT_IMG },
            caption: `${log}\n❤️ Seu HP: ${user.hp}/${user.hp_max}\n👾 HP do Monstro: ${battle.monster.hp}/${battle.monster.hp_max}`,
            footer:  `Solo Leveling System • Turno ${battle.turn}`,
          }, kaoruko, [
            { type: 'cmd', text: '⚔️ Atacar',    command: `${p}atacar` },
            { type: 'cmd', text: '✨ Usar Skill', command: `${p}skills` },
            { type: 'cmd', text: '🏃 Fugir',      command: `${p}fugir`  },
          ], info);
        }

        case `${p}fugir`: {
          if (!this.getBattle(id))
            return kaoruko.sendMessage(from, { text: '❌ Você não está em combate.' }, { quoted: info });
          if (Math.random() < 0.3) {
            const battle   = this.getBattle(id);
            const dmg      = this.calculateDamage(battle.monster, user);
            user.hp        = Math.max(1, user.hp - dmg);
            this.saveUser(user);
            return kaoruko.sendMessage(from, {
              text: `😬 Sua fuga foi interceptada!\nO ${battle.monster.nome} causou *${dmg}* de dano antes de você escapar.\n❤️ HP: ${user.hp}/${user.hp_max}`,
            }, { quoted: info });
          }
          this.deleteBattle(id);
          return kaoruko.sendMessage(from, { text: '🏃 Você fugiu da batalha com sucesso!' }, { quoted: info });
        }

        case `${p}treinar`: {
          const type   = args[0]?.toLowerCase();
          const amount = Math.min(parseInt(args[1]) || 10, 100);

          if (!type) {
            return await sendListB(from, {
              image:   { url: DEFAULT_IMG },
              caption: `🏋️ *CENTRO DE TREINAMENTO*\n\nEscolha qual exercício realizar.\nTreino diário completo = 5.000G + 500EXP + HP/MP restaurados.`,
              footer:  'Solo Leveling System • Treinamento',
            }, kaoruko, sender, 'Lista de Exercícios', [{
              title:   'Exercícios Disponíveis',
              options: [
                { title: 'Flexões',      body: 'Treina Força | Meta: 100',         command: `${p}treinar flexoes 10`      },
                { title: 'Abdominais',   body: 'Treina Vitalidade | Meta: 100',    command: `${p}treinar abdominais 10`   },
                { title: 'Agachamentos', body: 'Treina Agilidade | Meta: 100',     command: `${p}treinar agachamentos 10` },
                { title: 'Corrida',      body: 'Treina Percepção | Meta: 10km',    command: `${p}treinar corrida 1`       },
              ],
            }], info);
          }

          const today = new Date().toDateString();
          if (user.daily.date !== today) {
            user.daily = { flexoes: 0, abdominais: 0, agachamentos: 0, corrida: 0, date: today, completed: false };
          }

          const statMap = {
            flexoes:      { field: 'flexoes',      stat: 'forca',       label: 'Força',      div: 20 },
            abdominais:   { field: 'abdominais',   stat: 'vitalidade',  label: 'Vitalidade', div: 20 },
            agachamentos: { field: 'agachamentos', stat: 'agilidade',   label: 'Agilidade',  div: 20 },
            corrida:      { field: 'corrida',      stat: 'percepcao',   label: 'Percepção',  div: 2  },
          };

          const entry = statMap[type];
          if (!entry) return kaoruko.sendMessage(from, { text: '❌ Tipo de exercício inválido. Use: flexoes, abdominais, agachamentos, corrida' }, { quoted: info });

          user.daily[entry.field]  += amount;
          user.stats[entry.stat]   += Math.floor(amount / entry.div);

          const { flexoes, abdominais, agachamentos, corrida, completed } = user.daily;
          if (flexoes >= 100 && abdominais >= 100 && agachamentos >= 100 && corrida >= 10 && !completed) {
            user.daily.completed = true;
            user.gold += 5000;
            this.addExp(user, 500);
            user.hp = user.hp_max;
            user.mp = user.mp_max;
            kaoruko.sendMessage(from, {
              text: `✨ *MISSÃO DIÁRIA CONCLUÍDA!*\n\nRecompensas:\n💰 +5.000 Gold\n🌟 +500 EXP\n❤️ HP/MP Restaurados`,
            }, { quoted: info });
          }

          this.saveUser(user);
          return kaoruko.sendMessage(from, {
            text:
              `🏋️ *${amount} ${type} realizados!*\n` +
              `📊 *${entry.label}* aumentou!\n\n` +
              `📅 Progresso de hoje:\n` +
              `💪 Flexões: ${user.daily.flexoes}/100\n` +
              `🧘 Abdominais: ${user.daily.abdominais}/100\n` +
              `🦵 Agachamentos: ${user.daily.agachamentos}/100\n` +
              `🏃 Corrida: ${user.daily.corrida}/10km`,
          }, { quoted: info });
        }

        case `${p}missao`: {
          const m    = user.daily;
          const text =
            `📜 *MISSÕES DIÁRIAS*\n` +
            `━━━━━━━━━━━━━━━\n` +
            `🏋️ *Flexões:* ${m.flexoes}/100 ${m.flexoes >= 100 ? '✅' : '⏳'}\n` +
            `🧘 *Abdominais:* ${m.abdominais}/100 ${m.abdominais >= 100 ? '✅' : '⏳'}\n` +
            `🦵 *Agachamentos:* ${m.agachamentos}/100 ${m.agachamentos >= 100 ? '✅' : '⏳'}\n` +
            `🏃 *Corrida:* ${m.corrida}/10km ${m.corrida >= 10 ? '✅' : '⏳'}\n\n` +
            `Status: ${m.completed ? '✅ *Concluída*' : '⏳ *Em andamento*'}\n\n` +
            `💰 Recompensa: 5.000G + 500EXP + HP/MP Full`;

          return await sendlistbuttons(from, {
            image:   { url: DEFAULT_IMG },
            caption: text,
            footer:  'Solo Leveling System • Missão Diária',
          }, kaoruko, [{ type: 'cmd', text: '🏋️ Treinar', command: `${p}treinar` }], info);
        }

        case `${p}loja`: {
          const items = loadJSON(CONFIG.ITEMS_FILE);
          const armas       = items.filter(i => i.tipo === 'Arma');
          const armaduras   = items.filter(i => i.tipo === 'Armadura');
          const acessorios  = items.filter(i => i.tipo === 'Acessório' || i.tipo === 'Acessorio');
          const consumiveis = items.filter(i => i.tipo === 'Consumível' || i.tipo === 'Consumivel');

          const sections = [];
          if (armas.length)       sections.push({ title: '⚔️ Armas',       options: armas.map(i => ({ title: i.nome, body: `${i.preco.toLocaleString()}G | ${i.efeito}`, command: `${p}comprar ${i.id}` })) });
          if (armaduras.length)   sections.push({ title: '🛡️ Armaduras',   options: armaduras.map(i => ({ title: i.nome, body: `${i.preco.toLocaleString()}G | ${i.efeito}`, command: `${p}comprar ${i.id}` })) });
          if (acessorios.length)  sections.push({ title: '💍 Acessórios',  options: acessorios.map(i => ({ title: i.nome, body: `${i.preco.toLocaleString()}G | ${i.efeito}`, command: `${p}comprar ${i.id}` })) });
          if (consumiveis.length) sections.push({ title: '🧪 Consumíveis', options: consumiveis.map(i => ({ title: i.nome, body: `${i.preco.toLocaleString()}G | ${i.efeito}`, command: `${p}comprar ${i.id}` })) });

          return await sendListB(from, {
            image:   { url: DEFAULT_IMG },
            caption: `🏪 *LOJA DO SISTEMA*\n\nSeu saldo: *${user.gold.toLocaleString()}G*\nEscolha um item para comprar:`,
            footer:  'Solo Leveling System • Comércio',
          }, kaoruko, sender, 'Categorias da Loja', sections, info);
        }

        case `${p}comprar`: {
          const itemId   = args[0];
          const allItems = loadJSON(CONFIG.ITEMS_FILE);
          const item     = allItems.find(i => i.id === itemId);

          if (!item)        return kaoruko.sendMessage(from, { text: '❌ Item não encontrado.' }, { quoted: info });
          if (user.gold < item.preco) return kaoruko.sendMessage(from, { text: `❌ Gold insuficiente. Você tem *${user.gold.toLocaleString()}G* mas precisa de *${item.preco.toLocaleString()}G*.` }, { quoted: info });

          user.gold -= item.preco;
          const invIdx = user.inventory.findIndex(i => i.id === item.id);
          if (invIdx > -1) user.inventory[invIdx].qtd++;
          else user.inventory.push({ ...item, qtd: 1 });

          this.saveUser(user);
          return kaoruko.sendMessage(from, {
            text: `✅ Você comprou *${item.nome}*!\n💰 Gold restante: ${user.gold.toLocaleString()}G`,
          }, { quoted: info });
        }

        case `${p}inventario`: {
          if (!user.inventory.length) {
            return await sendlistbuttons(from, {
              image:   { url: DEFAULT_IMG },
              caption: `🎒 *INVENTÁRIO DIMENSIONAL*\n\nSeu inventário está vazio.\nVisite a loja para comprar itens!`,
              footer:  'Solo Leveling System • Inventário',
            }, kaoruko, [{ type: 'cmd', text: '🏪 Loja', command: `${p}loja` }], info);
          }
          const armas  = user.inventory.filter(i => i.tipo === 'Arma' || i.tipo === 'Armadura' || i.tipo === 'Acessório' || i.tipo === 'Acessorio');
          const poções = user.inventory.filter(i => i.tipo === 'Consumível' || i.tipo === 'Consumivel');

          let texto = `🎒 *INVENTÁRIO DIMENSIONAL*\n━━━━━━━━━━━━━━━\n`;
          if (armas.length)  texto += `\n⚔️ *Equipamentos:*\n${armas.map(i => `• ${i.nome} x${i.qtd}`).join('\n')}\n`;
          if (poções.length) texto += `\n🧪 *Consumíveis:*\n${poções.map(i => `• ${i.nome} x${i.qtd}`).join('\n')}\n`;
          texto += `\n💰 Gold: *${user.gold.toLocaleString()}G*\nPara usar: \`${p}usar nome do item\``;

          return await sendlistbuttons(from, {
            image:   { url: DEFAULT_IMG },
            caption: texto,
            footer:  'Solo Leveling System • Inventário',
          }, kaoruko, [
            { type: 'cmd', text: '🏪 Loja',   command: `${p}loja`   },
            { type: 'cmd', text: '👤 Status', command: `${p}status` },
          ], info);
        }

        case `${p}usar`: {
          const targetItem = args.join(' ').toLowerCase().trim();
          if (!targetItem) return kaoruko.sendMessage(from, { text: `❌ Informe o nome do item. Ex: \`${p}usar Poção de Vida\`` }, { quoted: info });
          const itemIdx = user.inventory.findIndex(i => i.nome.toLowerCase() === targetItem);

          if (itemIdx === -1)
            return kaoruko.sendMessage(from, { text: `❌ Item não encontrado no inventário.\nUse *${p}inventario* para ver seus itens.` }, { quoted: info });

          const itemToUse = user.inventory[itemIdx];
          const resultado = this.applyItemEffect(user, itemToUse);

          if (itemToUse.tipo === 'Consumível' || itemToUse.tipo === 'Consumivel') {
            itemToUse.qtd--;
            if (itemToUse.qtd <= 0) user.inventory.splice(itemIdx, 1);
          }

          this.saveUser(user);
          return kaoruko.sendMessage(from, { text: resultado }, { quoted: info });
        }

        case `${p}arise`: {
          if (user.job !== 'Monarca das Sombras' && user.level < 40)
            return kaoruko.sendMessage(from, { text: '⚠️ Você precisa ser Rank A (nível 40+) para usar este poder.' }, { quoted: info });

          const shadowList = user.shadows?.length
            ? user.shadows.map(s => `• *${s.nome}* [${s.rank}] — Força: ${s.stats?.forca || '?'}`).join('\n')
            : 'Seu exército de sombras está vazio.\nDerrote inimigos e use `.arise_extract` para expandir suas fileiras.';

          return await sendlistbuttons(from, {
            image:   { url: DEFAULT_IMG },
            caption: `🌑 *EXÉRCITO DE SOMBRAS*\n━━━━━━━━━━━━━━━\n\n${shadowList}`,
            footer:  'Solo Leveling System • Sombras',
          }, kaoruko, [
            { type: 'cmd', text: '👾 Caçar', command: `${p}cacar` },
          ], info);
        }

        case `${p}arise_extract`: {
          if (user.job !== 'Monarca das Sombras' && user.level < 40)
            return kaoruko.sendMessage(from, { text: '⚠️ Você precisa ser Rank A (nível 40+) para extrair sombras.' }, { quoted: info });

          const mName = args.join(' ').trim();
          if (!mName) return kaoruko.sendMessage(from, { text: '❌ Informe o nome do monstro.' }, { quoted: info });

          const chance = user.job === 'Monarca das Sombras' ? 0.7 : 0.4;
          if (Math.random() < chance) {
            const shadowRanks  = ['Soldado', 'Elite', 'Cavaleiro', 'General'];
            const rank         = shadowRanks[Math.floor(Math.random() * shadowRanks.length)];
            const forcaBase    = user.stats.forca * (0.5 + Math.random() * 0.3);
            const shadow = {
              nome:   `Sombra de ${mName}`,
              rank,
              extraida_em: new Date().toLocaleDateString('pt-BR'),
              stats:  { forca: Math.floor(forcaBase), agilidade: Math.floor(forcaBase * 0.8) },
            };
            if (!user.shadows) user.shadows = [];
            user.shadows.push(shadow);
            this.saveUser(user);
            return kaoruko.sendMessage(from, {
              text:
                `🌑 *ERGA-SE!*\n\n` +
                `A sombra de *${mName}* foi extraída!\n` +
                `Rank: *${rank}*\n` +
                `Força: ${shadow.stats.forca}\n\n` +
                `Ela agora serve ao Monarca para sempre.`,
            }, { quoted: info });
          }
          return kaoruko.sendMessage(from, {
            text: `❌ A extração falhou. A alma de *${mName}* se dissipou nas sombras.`,
          }, { quoted: info });
        }

        case `${p}ranking`: {
          try {
            const usersFiles = fs.readdirSync(CONFIG.USERS_DIR).filter(f => f.endsWith('.json'));
            const allUsers   = usersFiles.map(f => JSON.parse(fs.readFileSync(path.join(CONFIG.USERS_DIR, f), 'utf8')));
            allUsers.sort((a, b) => b.level - a.level || b.dungeons_cleared - a.dungeons_cleared);
            const top10 = allUsers.slice(0, 10);
            const rankIcons = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            const rankText  = top10.map((u, i) =>
              `${rankIcons[i]} *${u.nome}* — Nível ${u.level} (${u.rank})\n    ☠️ ${u.dungeons_cleared || 0} dungeons | 💰 ${(u.gold || 0).toLocaleString()}G`
            ).join('\n\n');

            return await sendlistbuttons(from, {
              image:   { url: DEFAULT_IMG },
              caption: `🏆 *RANKING GLOBAL*\n━━━━━━━━━━━━━━━\n\n${rankText || 'Nenhum hunter registrado ainda.'}`,
              footer:  'Solo Leveling System • Ranking',
            }, kaoruko, [{ type: 'cmd', text: '👤 Meu Status', command: `${p}status` }], info);
          } catch (e) {
            return kaoruko.sendMessage(from, { text: '❌ Erro ao carregar ranking.' }, { quoted: info });
          }
        }

        case `${p}pvp`: {
          const target = args[0];
          if (!target) return kaoruko.sendMessage(from, { text: `❌ Mencione um oponente. Ex: \`${p}pvp @usuario\`` }, { quoted: info });

          const targetId = target.replace('@', '').replace(/[^0-9]/g, '');
          if (targetId === id) return kaoruko.sendMessage(from, { text: '❌ Você não pode desafiar a si mesmo.' }, { quoted: info });

          const targetUser = this.getUser(targetId);
          if (!targetUser) return kaoruko.sendMessage(from, { text: '❌ Esse usuário não está registrado no Sistema.' }, { quoted: info });

          const pvpBattle = {
            challenger:    id,
            challenged:    targetId,
            challenger_hp: user.hp,
            challenged_hp: targetUser.hp,
            status:        'pending',
            created_at:    Date.now(),
          };
          this.saveBattle(`pvp_${id}_${targetId}`, pvpBattle);

          return kaoruko.sendMessage(from, {
            text:
              `⚔️ *DESAFIO PvP!*\n\n` +
              `*${user.nome}* (Rank ${user.rank}) desafiou *${targetUser.nome}* (Rank ${targetUser.rank})!\n\n` +
              `@${targetId}, use *${p}aceitar_pvp @${id}* para aceitar o duelo!`,
            mentions: [sender, `${targetId}@s.whatsapp.net`],
          }, { quoted: info });
        }

        case `${p}aceitar_pvp`: {
          const challengerId = args[0]?.replace('@', '').replace(/[^0-9]/g, '');
          if (!challengerId) return kaoruko.sendMessage(from, { text: '❌ Informe quem te desafiou.' }, { quoted: info });

          const pvpBattle = this.getBattle(`pvp_${challengerId}_${id}`);
          if (!pvpBattle || pvpBattle.status !== 'pending')
            return kaoruko.sendMessage(from, { text: '❌ Nenhum desafio pendente desse jogador.' }, { quoted: info });

          const challenger = this.getUser(challengerId);
          if (!challenger) return kaoruko.sendMessage(from, { text: '❌ Desafiante não encontrado.' }, { quoted: info });

          let cHP   = challenger.hp;
          let tHP   = user.hp;
          let turns = 0;
          let log   = `⚔️ *DUELO: ${challenger.nome} vs ${user.nome}*\n━━━━━━━━━━━━━━━\n\n`;

          while (cHP > 0 && tHP > 0 && turns < 20) {
            const dmgC = this.calculateDamage(challenger, user);
            const dmgT = this.calculateDamage(user, challenger);
            cHP  -= dmgT;
            tHP  -= dmgC;
            turns++;
          }

          this.deleteBattle(`pvp_${challengerId}_${id}`);

          if (cHP > tHP) {
            challenger.pvp_wins   = (challenger.pvp_wins   || 0) + 1;
            user.pvp_losses       = (user.pvp_losses       || 0) + 1;
            this.addExp(challenger, 300);
            challenger.gold      += 500;
            this.saveUser(challenger);
            this.saveUser(user);
            log += `🏆 *${challenger.nome}* venceu o duelo!\n+300 EXP e +500G para o vencedor.`;
          } else {
            user.pvp_wins         = (user.pvp_wins         || 0) + 1;
            challenger.pvp_losses = (challenger.pvp_losses || 0) + 1;
            this.addExp(user, 300);
            user.gold            += 500;
            this.saveUser(user);
            this.saveUser(challenger);
            log += `🏆 *${user.nome}* venceu o duelo!\n+300 EXP e +500G para o vencedor.`;
          }

          return kaoruko.sendMessage(from, {
            text: log,
            mentions: [sender, `${challengerId}@s.whatsapp.net`],
          }, { quoted: info });
        }

        case `${p}criar_guilda`: {
          if (user.guilda) return kaoruko.sendMessage(from, { text: '❌ Você já pertence a uma guilda.' }, { quoted: info });
          const guildName = args.join(' ').trim();
          if (!guildName) return kaoruko.sendMessage(from, { text: `❌ Informe o nome da guilda. Ex: \`${p}criar_guilda Caçadores do Norte\`` }, { quoted: info });
          if (guildName.length < 3 || guildName.length > 30) return kaoruko.sendMessage(from, { text: '❌ O nome deve ter entre 3 e 30 caracteres.' }, { quoted: info });
          if (this.getGuild(guildName)) return kaoruko.sendMessage(from, { text: '❌ Já existe uma guilda com esse nome.' }, { quoted: info });
          if (user.gold < 5000) return kaoruko.sendMessage(from, { text: '❌ Criar uma guilda custa 5.000G. Você não tem gold suficiente.' }, { quoted: info });

          user.gold -= 5000;
          user.guilda = guildName;
          const guild = {
            nome:        guildName,
            master:      id,
            master_nome: user.nome,
            membros:     [{ id, nome: user.nome, rank: user.rank, cargo: 'master' }],
            nivel:       1,
            exp:         0,
            gold:        0,
            criada_em:   new Date().toLocaleDateString('pt-BR'),
          };
          this.saveGuild(guild);
          this.saveUser(user);
          return kaoruko.sendMessage(from, {
            text:
              `🏰 *GUILDA CRIADA!*\n\n` +
              `Nome: *${guildName}*\n` +
              `Mestre: *${user.nome}*\n` +
              `Custo: -5.000G\n\n` +
              `Use \`${p}guilda\` para gerenciar sua guilda.`,
          }, { quoted: info });
        }

        case `${p}entrar_guilda`: {
          if (user.guilda) return kaoruko.sendMessage(from, { text: '❌ Você já pertence a uma guilda. Saia primeiro com `.sair_guilda`.' }, { quoted: info });
          const guildName = args.join(' ').trim();
          if (!guildName) {
            const guilds = this.listGuilds();
            if (!guilds.length) return kaoruko.sendMessage(from, { text: '😔 Não há guildas criadas ainda.' }, { quoted: info });
            return await sendListB(from, {
              image:   { url: DEFAULT_IMG },
              caption: `🏰 *LISTA DE GUILDAS*\n\nEscolha uma guilda para entrar:`,
              footer:  'Solo Leveling System • Guildas',
            }, kaoruko, sender, 'Guildas', [{
              title:   'Guildas Disponíveis',
              options: guilds.map(g => ({
                title:   g.nome,
                body:    `Mestre: ${g.master_nome} | ${g.membros.length} membros`,
                command: `${p}entrar_guilda ${g.nome}`,
              })),
            }], info);
          }
          const guild = this.getGuild(guildName);
          if (!guild) return kaoruko.sendMessage(from, { text: '❌ Guilda não encontrada.' }, { quoted: info });

          guild.membros.push({ id, nome: user.nome, rank: user.rank, cargo: 'member' });
          user.guilda = guild.nome;
          this.saveGuild(guild);
          this.saveUser(user);
          return kaoruko.sendMessage(from, {
            text: `✅ Você entrou na guilda *${guild.nome}*!\nBem-vindo, Hunter ${user.nome}!`,
          }, { quoted: info });
        }

        case `${p}sair_guilda`: {
          if (!user.guilda) return kaoruko.sendMessage(from, { text: '❌ Você não está em nenhuma guilda.' }, { quoted: info });
          const guild = this.getGuild(user.guilda);
          if (guild) {
            if (guild.master === id) return kaoruko.sendMessage(from, { text: '❌ Você é o mestre da guilda. Transfira a liderança antes de sair.' }, { quoted: info });
            guild.membros = guild.membros.filter(m => m.id !== id);
            this.saveGuild(guild);
          }
          const guildName = user.guilda;
          user.guilda = null;
          this.saveUser(user);
          return kaoruko.sendMessage(from, { text: `✅ Você saiu da guilda *${guildName}*.` }, { quoted: info });
        }

        case `${p}guilda`: {
          const gName = args.join(' ').trim() || user.guilda;
          if (!gName) return kaoruko.sendMessage(from, { text: `❌ Você não está em nenhuma guilda. Use \`${p}criar_guilda\` ou \`${p}entrar_guilda\`.` }, { quoted: info });
          const guild = this.getGuild(gName);
          if (!guild) return kaoruko.sendMessage(from, { text: '❌ Guilda não encontrada.' }, { quoted: info });

          const membrosStr = guild.membros.map(m =>
            `${GUILD_ICONS[m.cargo] || '🔵'} *${m.nome}* (Rank ${m.rank})`
          ).join('\n');

          return await sendlistbuttons(from, {
            image:   { url: DEFAULT_IMG },
            caption:
              `🏰 *${guild.nome.toUpperCase()}*\n` +
              `━━━━━━━━━━━━━━━\n` +
              `👑 Mestre: *${guild.master_nome}*\n` +
              `📅 Criada: ${guild.criada_em}\n` +
              `👥 Membros: ${guild.membros.length}\n\n` +
              `*Lista de Membros:*\n${membrosStr}`,
            footer:  'Solo Leveling System • Guilda',
          }, kaoruko, [
            { type: 'cmd', text: '👤 Meu Status', command: `${p}status` },
          ], info);
        }

        case `${p}menurpg`: {
          return kaoruko.sendMessage(from, {
            text:
              `📜 *COMANDOS RPG — SOLO LEVELING*\n` +
              `━━━━━━━━━━━━━━━\n\n` +
              `*📋 Cadastro:*\n` +
              `▸ \`${p}rpg\` — Menu principal\n` +
              `▸ \`${p}hunters\` — Ver hunters disponíveis\n` +
              `▸ \`${p}criar\` — Criar personagem custom\n\n` +
              `*👤 Perfil:*\n` +
              `▸ \`${p}status\` — Janela de status\n` +
              `▸ \`${p}mudar_foto URL\` — Trocar foto\n\n` +
              `*⚔️ Combate:*\n` +
              `▸ \`${p}cacar\` — Entrar em dungeon\n` +
              `▸ \`${p}atacar\` — Atacar o monstro\n` +
              `▸ \`${p}skills\` — Usar habilidade em combate\n` +
              `▸ \`${p}fugir\` — Tentar fugir\n\n` +
              `*🏋️ Treino:*\n` +
              `▸ \`${p}treinar\` — Missões de treino\n` +
              `▸ \`${p}missao\` — Ver progresso diário\n\n` +
              `*🏪 Comércio:*\n` +
              `▸ \`${p}loja\` — Ver itens disponíveis\n` +
              `▸ \`${p}comprar ID\` — Comprar item\n` +
              `▸ \`${p}inventario\` — Ver inventário\n` +
              `▸ \`${p}usar ITEM\` — Usar/equipar item\n\n` +
              `*✨ Habilidades:*\n` +
              `▸ \`${p}aprender\` — Ver skills disponíveis\n` +
              `▸ \`${p}aprender SKILL\` — Aprender habilidade\n\n` +
              `*🌑 Sombras (Rank A+):*\n` +
              `▸ \`${p}arise\` — Ver exército de sombras\n` +
              `▸ \`${p}arise_extract NOME\` — Extrair sombra\n\n` +
              `*🏆 Social:*\n` +
              `▸ \`${p}ranking\` — Top 10 hunters\n` +
              `▸ \`${p}pvp @user\` — Desafiar jogador\n` +
              `▸ \`${p}criar_guilda NOME\` — Criar guilda\n` +
              `▸ \`${p}entrar_guilda\` — Listar e entrar em guilda\n` +
              `▸ \`${p}guilda\` — Ver sua guilda`,
          }, { quoted: info });
        }

        default:
          if (body.startsWith(p)) return null;
      }
    } catch (error) {
      console.error('ERRO RPG:', error);
      return kaoruko.sendMessage(from, { text: `❌ Erro interno do Sistema: ${error.message}` }, { quoted: info });
    }
  }
}

module.exports = SoloLevelingSystem;
