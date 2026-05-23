const fs   = require('fs');
const path = require('path');

const BASE_DIR    = path.join(__dirname, 'arquivos/rpg_soleleveling');
const USERS_DIR   = path.join(BASE_DIR, 'users');
const RAIDS_DIR   = path.join(BASE_DIR, 'raids');
const MARKET_DIR  = path.join(BASE_DIR, 'market');
const TOURN_DIR   = path.join(BASE_DIR, 'torneios');
const GUILD_DIR   = path.join(BASE_DIR, 'guilds');
const WARS_DIR    = path.join(BASE_DIR, 'wars');

const BOSSES_FILE = path.join(BASE_DIR, 'bosses.json');
const QUESTS_FILE = path.join(BASE_DIR, 'quests.json');
const ITEMS_FILE  = path.join(BASE_DIR, 'items.json');
const SHADOW_FILE = path.join(BASE_DIR, 'shadows.json');

const DEFAULT_IMG   = 'https://res.cloudinary.com/dlmoujcpv/image/upload/v1776733419/trindade-1776733417142.jpg';
const SYSTEM_FOOTER = 'Solo Leveling System • O Despertar';

const dirs = [BASE_DIR, USERS_DIR, RAIDS_DIR, MARKET_DIR, TOURN_DIR, GUILD_DIR, WARS_DIR];
dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const rj = (p) => {
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
};
const wj = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2));

const getUser  = (id)  => rj(path.join(USERS_DIR, `${id}.json`));
const saveUser = (u)   => wj(path.join(USERS_DIR, `${u.id}.json`), u);
const getBoss  = (id)  => (rj(BOSSES_FILE) || []).find(b => b.id === id);
const getItems = ()    => rj(ITEMS_FILE) || [];
const getQuests= ()    => rj(QUESTS_FILE) || [];
const getShadowTemplates = () => rj(SHADOW_FILE) || [];

const getRaid    = (id) => rj(path.join(RAIDS_DIR, `${id}.json`));
const saveRaid   = (id, d) => wj(path.join(RAIDS_DIR, `${id}.json`), d);
const deleteRaid = (id) => { const p = path.join(RAIDS_DIR, `${id}.json`); if (fs.existsSync(p)) fs.unlinkSync(p); };

const getMarket    = () => rj(path.join(MARKET_DIR, 'listings.json')) || [];
const saveMarket   = (d) => wj(path.join(MARKET_DIR, 'listings.json'), d);

const getTournament    = () => rj(path.join(TOURN_DIR, 'active.json'));
const saveTournament   = (d) => wj(path.join(TOURN_DIR, 'active.json'), d);
const deleteTournament = () => { const p = path.join(TOURN_DIR, 'active.json'); if (fs.existsSync(p)) fs.unlinkSync(p); };

const getGuild = (nome) => {
  if (!nome) return null;
  const p = path.join(GUILD_DIR, `${nome.toLowerCase().replace(/\s+/g, '_')}.json`);
  return rj(p);
};
const saveGuild = (g) => wj(path.join(GUILD_DIR, `${g.nome.toLowerCase().replace(/\s+/g, '_')}.json`), g);
const listGuilds = () => {
  if (!fs.existsSync(GUILD_DIR)) return [];
  return fs.readdirSync(GUILD_DIR).filter(f => f.endsWith('.json')).map(f => rj(path.join(GUILD_DIR, f))).filter(Boolean);
};

const getWar  = (id) => rj(path.join(WARS_DIR, `${id}.json`));
const saveWar = (id, d) => wj(path.join(WARS_DIR, `${id}.json`), d);
const deleteWar = (id) => { const p = path.join(WARS_DIR, `${id}.json`); if (fs.existsSync(p)) fs.unlinkSync(p); };

const calcDmg = (atk, def, mult = 1.0) => {
  const base = Math.max(10, (atk.stats.forca * 5 - (def.stats?.vitalidade || 0) * 2) * mult);
  return Math.floor(base * (0.85 + Math.random() * 0.3));
};

const addExp = (user, amount) => {
  user.exp += amount;
  let up = false;
  while (user.exp >= user.exp_next) {
    user.exp      -= user.exp_next;
    user.exp_next  = Math.floor(user.exp_next * 1.2);
    user.level++;
    user.hp_max += 100; user.mp_max += 50;
    user.hp = user.hp_max; user.mp = user.mp_max;
    ['forca','vitalidade','agilidade','inteligencia','percepcao'].forEach(s => user.stats[s] += 2);
    up = true;
  }
  return up;
};

class RPGExtensions {

  static async handleCommand(from, sender, body, pushname, sock, info, sendlistbuttons, sendListB, prefix = '.') {
    const id   = sender.replace('@s.whatsapp.net', '');
    const cmd  = body.split(' ')[0].toLowerCase();
    const args = body.split(' ').slice(1);
    const user = getUser(id);
    const p    = prefix;

    const needUser = [
      `${p}raid`, `${p}raid_entrar`, `${p}raid_iniciar`, `${p}raid_atacar`, `${p}raid_listar`,
      `${p}mercado`, `${p}vender`, `${p}comprar_mercado`, `${p}cancelar_venda`,
      `${p}evoluir_sombra`, `${p}sombras`,
      `${p}torneio`, `${p}torneio_entrar`, `${p}torneio_iniciar`, `${p}torneio_lutar`,
      `${p}quest`, `${p}quest_aceitar`, `${p}quest_status`,
      `${p}guerra_declarar`, `${p}guerra_atacar`, `${p}guerra_status`,
    ];

    if (needUser.includes(cmd) && !user)
      return sock.sendMessage(from, { text: `❌ Registre-se primeiro com *${p}rpg*.` }, { quoted: info });

    switch (cmd) {

      case `${p}raid`:
      case `${p}raid_listar`: {
        const bosses = rj(BOSSES_FILE) || [];
        return await sendListB(from, {
          image:   { url: DEFAULT_IMG },
          caption: `⚔️ *RAID DE BOSS*\n\nEnfrentem poderosos bosses em grupo!\nMínimo de 2 jogadores para iniciar.\n\nSeu HP: *${user.hp}/${user.hp_max}*`,
          footer:  'Solo Leveling System • Raid',
        }, sock, sender, 'Lista de Bosses', [{
          title:   'Bosses Disponíveis',
          options: bosses.map(b => ({
            title:   `${b.nome} [${b.rank}]`,
            body:    `HP: ${b.hp_base.toLocaleString()} | ${b.min_players}-${b.max_players} players`,
            command: `${p}raid_criar ${b.id}`,
          })),
        }], info);
      }

      case `${p}raid_criar`: {
        const bossId = args[0];
        const boss   = getBoss(bossId);
        if (!boss) return sock.sendMessage(from, { text: '❌ Boss inválido.' }, { quoted: info });
        if (user.hp < user.hp_max * 0.3)
          return sock.sendMessage(from, { text: '❌ HP muito baixo para iniciar uma raid.' }, { quoted: info });

        const raidId = `raid_${id}_${Date.now()}`;
        const raid = {
          id:        raidId,
          boss_id:   boss.id,
          boss_nome: boss.nome,
          boss_rank: boss.rank,
          boss_hp:   boss.hp_base,
          boss_hp_max: boss.hp_base,
          boss_fase: 1,
          boss_fases_max: boss.fases,
          lider:     id,
          lider_nome: user.nome,
          membros:   [{ id, nome: user.nome, rank: user.rank, dano_total: 0 }],
          max_membros: boss.max_players,
          min_membros: boss.min_players,
          status:    'aguardando',
          drops:     boss.drops || [],
          exp_reward: boss.exp_reward,
          gold_reward: boss.gold_reward,
          criada_em: Date.now(),
        };
        saveRaid(raidId, raid);

        return await sendlistbuttons(from, {
          image:   { url: DEFAULT_IMG },
          caption:
            `⚔️ *RAID CRIADA!*\n\n` +
            `Boss: *${boss.nome}* [${boss.rank}]\n` +
            `HP: ${boss.hp_base.toLocaleString()}\n` +
            `Fases: ${boss.fases}\n` +
            `Jogadores: 1/${boss.max_players} (mín: ${boss.min_players})\n\n` +
            `ID da Raid: \`${raidId}\`\n` +
            `Compartilhe o ID para outros entrarem com:\n*${p}raid_entrar ${raidId}*`,
          footer:  'Solo Leveling System • Raid',
        }, sock, [
          { type: 'cmd', text: '▶️ Iniciar Raid', command: `${p}raid_iniciar ${raidId}` },
        ], info);
      }

      case `${p}raid_entrar`: {
        const raidId = args[0];
        if (!raidId) return sock.sendMessage(from, { text: `❌ Informe o ID da raid. Ex: \`${p}raid_entrar raid_xxx\`` }, { quoted: info });
        const raid = getRaid(raidId);
        if (!raid) return sock.sendMessage(from, { text: '❌ Raid não encontrada.' }, { quoted: info });
        if (raid.status !== 'aguardando') return sock.sendMessage(from, { text: '❌ Esta raid já começou ou foi encerrada.' }, { quoted: info });
        if (raid.membros.find(m => m.id === id)) return sock.sendMessage(from, { text: '⚠️ Você já está nesta raid.' }, { quoted: info });
        if (raid.membros.length >= raid.max_membros) return sock.sendMessage(from, { text: '❌ Raid lotada.' }, { quoted: info });

        raid.membros.push({ id, nome: user.nome, rank: user.rank, dano_total: 0 });
        saveRaid(raidId, raid);
        return sock.sendMessage(from, {
          text:
            `✅ *${user.nome}* entrou na raid!\n\n` +
            `Boss: *${raid.boss_nome}* [${raid.boss_rank}]\n` +
            `Jogadores: ${raid.membros.length}/${raid.max_membros}\n\n` +
            `Aguardando o líder iniciar...`,
        }, { quoted: info });
      }

      case `${p}raid_iniciar`: {
        const raidId = args[0];
        if (!raidId) return sock.sendMessage(from, { text: `❌ Informe o ID da raid.` }, { quoted: info });
        const raid = getRaid(raidId);
        if (!raid) return sock.sendMessage(from, { text: '❌ Raid não encontrada.' }, { quoted: info });
        if (raid.lider !== id) return sock.sendMessage(from, { text: '❌ Apenas o líder pode iniciar a raid.' }, { quoted: info });
        if (raid.membros.length < raid.min_membros)
          return sock.sendMessage(from, { text: `❌ Jogadores insuficientes. Mínimo: ${raid.min_membros}. Atual: ${raid.membros.length}` }, { quoted: info });
        if (raid.status !== 'aguardando') return sock.sendMessage(from, { text: '❌ Raid já foi iniciada.' }, { quoted: info });

        raid.status = 'ativa';
        saveRaid(raidId, raid);

        const nomes = raid.membros.map(m => `⚔️ ${m.nome} (${m.rank})`).join('\n');
        return await sendlistbuttons(from, {
          image:   { url: DEFAULT_IMG },
          caption:
            `🏟️ *RAID INICIADA!*\n\n` +
            `Boss: *${raid.boss_nome}* [${raid.boss_rank}]\n` +
            `HP do Boss: ${raid.boss_hp.toLocaleString()}/${raid.boss_hp_max.toLocaleString()}\n` +
            `Fase: ${raid.boss_fase}/${raid.boss_fases_max}\n\n` +
            `*Equipe:*\n${nomes}\n\n` +
            `Cada membro usa *${p}raid_atacar ${raidId}* para atacar!`,
          footer:  'Solo Leveling System • Raid Ativa',
        }, sock, [
          { type: 'cmd', text: '⚔️ Atacar Boss', command: `${p}raid_atacar ${raidId}` },
        ], info);
      }

      case `${p}raid_atacar`: {
        const raidId = args[0];
        if (!raidId) return sock.sendMessage(from, { text: `❌ Informe o ID da raid.` }, { quoted: info });
        const raid = getRaid(raidId);
        if (!raid) return sock.sendMessage(from, { text: '❌ Raid não encontrada.' }, { quoted: info });
        if (raid.status !== 'ativa') return sock.sendMessage(from, { text: '❌ Raid não está ativa.' }, { quoted: info });
        const membroIdx = raid.membros.findIndex(m => m.id === id);
        if (membroIdx === -1) return sock.sendMessage(from, { text: '❌ Você não está nesta raid.' }, { quoted: info });

        if (user.hp <= 0)
          return sock.sendMessage(from, { text: '💀 Você está incapacitado. Aguarde ser revivido.' }, { quoted: info });

        const dano = Math.floor((user.stats.forca * 8) * (0.85 + Math.random() * 0.3));
        raid.boss_hp -= dano;
        raid.membros[membroIdx].dano_total += dano;

        const bossCounterDmg = Math.floor(Math.random() * 200 + 100);
        user.hp = Math.max(0, user.hp - bossCounterDmg);
        saveUser(user);

        if (raid.boss_hp <= 0 && raid.boss_fase < raid.boss_fases_max) {
          raid.boss_fase++;
          raid.boss_hp = Math.floor(raid.boss_hp_max * (0.4 + raid.boss_fase * 0.15));
          saveRaid(raidId, raid);
          return sock.sendMessage(from, {
            text:
              `⚡ *NOVA FASE!*\n\n` +
              `*${user.nome}* causou ${dano} de dano!\n` +
              `O boss entrou na fase ${raid.boss_fase}/${raid.boss_fases_max}!\n` +
              `HP Renovado: ${raid.boss_hp.toLocaleString()}\n\n` +
              `Seu HP: ${user.hp}/${user.hp_max}`,
          }, { quoted: info });
        }

        if (raid.boss_hp <= 0) {
          const mvp = raid.membros.reduce((a, b) => a.dano_total > b.dano_total ? a : b);
          const rewardLog = [];

          for (const membro of raid.membros) {
            const u = getUser(membro.id);
            if (!u) continue;
            const expGained  = Math.floor(raid.exp_reward  * (membro.dano_total / (raid.boss_hp_max || 1) + 0.5));
            const goldGained = Math.floor(raid.gold_reward * (membro.dano_total / (raid.boss_hp_max || 1) + 0.5));
            addExp(u, expGained);
            u.gold += goldGained;
            u.dungeons_cleared = (u.dungeons_cleared || 0) + 1;
            if (raid.drops?.length && Math.random() < 0.4) {
              const drop = raid.drops[Math.floor(Math.random() * raid.drops.length)];
              const allItems = getItems();
              const dropItem = allItems.find(i => i.id === drop);
              if (dropItem) {
                const idx = u.inventory.findIndex(i => i.id === dropItem.id);
                if (idx > -1) u.inventory[idx].qtd++;
                else u.inventory.push({ ...dropItem, qtd: 1 });
                rewardLog.push(`🎁 Drop para *${u.nome}*: ${dropItem.nome}`);
              }
            }
            saveUser(u);
          }

          deleteRaid(raidId);
          const dropStr = rewardLog.length ? `\n\n${rewardLog.join('\n')}` : '';
          return sock.sendMessage(from, {
            text:
              `🏆 *BOSS DERROTADO!*\n\n` +
              `*${raid.boss_nome}* foi eliminado!\n` +
              `👑 MVP: *${mvp.nome}* (${mvp.dano_total.toLocaleString()} dano total)\n\n` +
              `🌟 EXP e Gold distribuídos para todos!\n` +
              `Base EXP: +${raid.exp_reward} | Gold: +${raid.gold_reward}G${dropStr}`,
          }, { quoted: info });
        }

        saveRaid(raidId, raid);
        return await sendlistbuttons(from, {
          image:   { url: DEFAULT_IMG },
          caption:
            `⚔️ *${user.nome}* causou *${dano}* de dano!\n` +
            `👾 Boss reagiu com *${bossCounterDmg}* de dano!\n\n` +
            `💀 HP do Boss: ${Math.max(0, raid.boss_hp).toLocaleString()}/${raid.boss_hp_max.toLocaleString()}\n` +
            `❤️ Seu HP: ${user.hp}/${user.hp_max}\n` +
            `Fase: ${raid.boss_fase}/${raid.boss_fases_max}`,
          footer:  'Solo Leveling System • Raid',
        }, sock, [
          { type: 'cmd', text: '⚔️ Atacar Novamente', command: `${p}raid_atacar ${raidId}` },
        ], info);
      }

      case `${p}mercado`: {
        const listings = getMarket();
        if (!listings.length)
          return await sendlistbuttons(from, {
            image:   { url: DEFAULT_IMG },
            caption: `🏬 *MERCADO DE HUNTERS*\n\nNenhum item à venda no momento.\nVenda seus itens com:\n\`${p}vender ITEM | PREÇO\``,
            footer:  'Solo Leveling System • Mercado',
          }, sock, [{ type: 'cmd', text: '🎒 Meu Inventário', command: `${p}inventario` }], info);

        const sections = [];
        const tipos = [...new Set(listings.map(l => l.item.tipo || 'Outros'))];
        for (const tipo of tipos) {
          const group = listings.filter(l => (l.item.tipo || 'Outros') === tipo);
          sections.push({
            title:   `${tipo}`,
            options: group.slice(0, 10).map(l => ({
              title:   l.item.nome,
              body:    `${l.preco.toLocaleString()}G | Vendedor: ${l.vendedor_nome}`,
              command: `${p}comprar_mercado ${l.id}`,
            })),
          });
        }

        return await sendListB(from, {
          image:   { url: DEFAULT_IMG },
          caption: `🏬 *MERCADO DE HUNTERS*\n\nItens disponíveis: *${listings.length}*\nSeu Gold: *${user.gold.toLocaleString()}G*`,
          footer:  'Solo Leveling System • Mercado',
        }, sock, sender, 'Categorias', sections, info);
      }

      case `${p}vender`: {
        const parts    = args.join(' ').split('|').map(s => s.trim());
        const itemName = parts[0]?.toLowerCase();
        const preco    = parseInt(parts[1]);

        if (!itemName || isNaN(preco) || preco < 1)
          return sock.sendMessage(from, { text: `❌ Formato: \`${p}vender Nome do Item | Preço\`\nEx: \`${p}vender Espada de Ferro | 3000\`` }, { quoted: info });

        const itemIdx = user.inventory.findIndex(i => i.nome.toLowerCase() === itemName);
        if (itemIdx === -1)
          return sock.sendMessage(from, { text: '❌ Item não encontrado no inventário.' }, { quoted: info });

        const item = user.inventory[itemIdx];
        if (item.qtd > 1) item.qtd--;
        else user.inventory.splice(itemIdx, 1);

        const listings  = getMarket();
        const listingId = `listing_${id}_${Date.now()}`;
        listings.push({
          id:           listingId,
          vendedor_id:  id,
          vendedor_nome: user.nome,
          item:         { ...item, qtd: 1 },
          preco,
          criada_em:    Date.now(),
        });
        saveMarket(listings);
        saveUser(user);

        return sock.sendMessage(from, {
          text: `✅ *${item.nome}* colocado à venda por *${preco.toLocaleString()}G* no mercado!`,
        }, { quoted: info });
      }

      case `${p}comprar_mercado`: {
        const listingId = args[0];
        if (!listingId) return sock.sendMessage(from, { text: '❌ ID do anúncio não informado.' }, { quoted: info });

        const listings  = getMarket();
        const lIdx      = listings.findIndex(l => l.id === listingId);
        if (lIdx === -1) return sock.sendMessage(from, { text: '❌ Anúncio não encontrado.' }, { quoted: info });

        const listing = listings[lIdx];
        if (listing.vendedor_id === id) return sock.sendMessage(from, { text: '❌ Você não pode comprar seu próprio item.' }, { quoted: info });
        if (user.gold < listing.preco)
          return sock.sendMessage(from, { text: `❌ Gold insuficiente. Necessário: *${listing.preco.toLocaleString()}G*` }, { quoted: info });

        user.gold -= listing.preco;
        const invIdx = user.inventory.findIndex(i => i.id === listing.item.id);
        if (invIdx > -1) user.inventory[invIdx].qtd++;
        else user.inventory.push({ ...listing.item, qtd: 1 });

        const vendedor = getUser(listing.vendedor_id);
        if (vendedor) {
          vendedor.gold += listing.preco;
          saveUser(vendedor);
        }

        listings.splice(lIdx, 1);
        saveMarket(listings);
        saveUser(user);

        return sock.sendMessage(from, {
          text:
            `✅ Você comprou *${listing.item.nome}* por *${listing.preco.toLocaleString()}G*!\n` +
            `Vendedor: ${listing.vendedor_nome}`,
        }, { quoted: info });
      }

      case `${p}cancelar_venda`: {
        const listingId = args[0];
        if (!listingId) return sock.sendMessage(from, { text: `❌ Use: \`${p}cancelar_venda ID\`` }, { quoted: info });

        const listings = getMarket();
        const lIdx     = listings.findIndex(l => l.id === listingId && l.vendedor_id === id);
        if (lIdx === -1) return sock.sendMessage(from, { text: '❌ Anúncio não encontrado ou não pertence a você.' }, { quoted: info });

        const item = listings[lIdx].item;
        const invIdx = user.inventory.findIndex(i => i.id === item.id);
        if (invIdx > -1) user.inventory[invIdx].qtd++;
        else user.inventory.push({ ...item, qtd: 1 });

        listings.splice(lIdx, 1);
        saveMarket(listings);
        saveUser(user);
        return sock.sendMessage(from, { text: `✅ Venda cancelada. *${item.nome}* devolvido ao inventário.` }, { quoted: info });
      }

      case `${p}sombras`: {
        if (!user.shadows?.length)
          return sock.sendMessage(from, { text: `🌑 Você ainda não possui sombras.\nDerrote monstros e use *${p}arise_extract*.` }, { quoted: info });

        const lista = user.shadows.map((s, i) =>
          `${i + 1}. *${s.nome}* [${s.rank}] Nv.${s.nivel || 1}\n   💪 Força: ${s.stats.forca} | ⚡ Agi: ${s.stats.agilidade}`
        ).join('\n\n');

        return await sendlistbuttons(from, {
          image:   { url: DEFAULT_IMG },
          caption: `🌑 *EXÉRCITO DE SOMBRAS*\n━━━━━━━━━━━━━━━\n\n${lista}`,
          footer:  'Solo Leveling System • Sombras',
        }, sock, [
          { type: 'cmd', text: '⬆️ Evoluir Sombra', command: `${p}evoluir_sombra` },
        ], info);
      }

      case `${p}evoluir_sombra`: {
        if (!user.shadows?.length)
          return sock.sendMessage(from, { text: '❌ Você não possui sombras.' }, { quoted: info });

        const shadowName = args.join(' ').trim();

        if (!shadowName) {
          return await sendListB(from, {
            image:   { url: DEFAULT_IMG },
            caption:
              `⬆️ *EVOLUÇÃO DE SOMBRAS*\n\n` +
              `Custo: *1 Pedra da Evolução* por evolução\n` +
              `Nível máximo: 5\n\n` +
              `Pedras no inventário: *${user.inventory.filter(i => i.id === 'pedra_evolucao').reduce((a, i) => a + i.qtd, 0)}*`,
            footer:  'Solo Leveling System • Evolução',
          }, sock, sender, 'Suas Sombras', [{
            title:   'Sombras Disponíveis',
            options: user.shadows.map(s => ({
              title:   `${s.nome} [Nv.${s.nivel || 1}]`,
              body:    `Força: ${s.stats.forca} | ${(s.nivel || 1) >= 5 ? 'NÍVEL MAX' : 'Pode evoluir'}`,
              command: `${p}evoluir_sombra ${s.nome}`,
            })),
          }], info);
        }

        const sIdx = user.shadows.findIndex(s => s.nome.toLowerCase() === shadowName.toLowerCase());
        if (sIdx === -1) return sock.sendMessage(from, { text: '❌ Sombra não encontrada.' }, { quoted: info });

        const shadow = user.shadows[sIdx];
        shadow.nivel = shadow.nivel || 1;
        if (shadow.nivel >= 5) return sock.sendMessage(from, { text: `⚠️ *${shadow.nome}* já está no nível máximo!` }, { quoted: info });

        const pedraIdx = user.inventory.findIndex(i => i.id === 'pedra_evolucao');
        if (pedraIdx === -1 || user.inventory[pedraIdx].qtd < 1)
          return sock.sendMessage(from, { text: `❌ Você precisa de uma *Pedra da Evolução*.\nCompre na loja com *${p}loja*.` }, { quoted: info });

        user.inventory[pedraIdx].qtd--;
        if (user.inventory[pedraIdx].qtd <= 0) user.inventory.splice(pedraIdx, 1);

        const templates = getShadowTemplates();
        const tmpl      = templates.find(t => shadow.nome.toLowerCase().includes(t.id.split('_')[0]));
        const porNivel  = tmpl?.stats_por_nivel || { forca: 20, agilidade: 15, defesa: 10 };

        shadow.nivel++;
        shadow.stats.forca    += porNivel.forca    || 20;
        shadow.stats.agilidade += porNivel.agilidade || 15;
        if (shadow.stats.defesa !== undefined) shadow.stats.defesa += porNivel.defesa || 10;

        const nomeAnt = shadow.nome;
        if (tmpl?.evolucoes?.[shadow.nivel - 2]) {
          shadow.nome = tmpl.evolucoes[shadow.nivel - 2];
        }

        user.shadows[sIdx] = shadow;
        saveUser(user);

        return sock.sendMessage(from, {
          text:
            `🌑 *EVOLUÇÃO CONCLUÍDA!*\n\n` +
            `${nomeAnt} → *${shadow.nome}*\n` +
            `Nível: ${shadow.nivel - 1} → *${shadow.nivel}*\n\n` +
            `💪 Força: +${porNivel.forca || 20}\n` +
            `⚡ Agilidade: +${porNivel.agilidade || 15}`,
        }, { quoted: info });
      }

      case `${p}torneio`: {
        const t = getTournament();
        if (!t) {
          return await sendlistbuttons(from, {
            image:   { url: DEFAULT_IMG },
            caption:
              `🏆 *TORNEIO PvP*\n\n` +
              `Nenhum torneio ativo no momento.\n\n` +
              `Apenas administradores podem criar torneios.\nUse: \`${p}torneio_criar NOME\`\n\n` +
              `Inscreva-se quando um torneio estiver aberto!`,
            footer:  'Solo Leveling System • Torneio',
          }, sock, [], info);
        }

        const status   = t.status === 'inscricoes' ? '📋 Inscrições Abertas' : t.status === 'ativo' ? '⚔️ Em Andamento' : '🏆 Finalizado';
        const inscritos = t.participantes?.map(p => `• ${p.nome} (${p.rank})`).join('\n') || 'Nenhum ainda';

        return await sendlistbuttons(from, {
          image:   { url: DEFAULT_IMG },
          caption:
            `🏆 *TORNEIO: ${t.nome.toUpperCase()}*\n` +
            `Status: ${status}\n` +
            `Participantes: ${t.participantes?.length || 0}/${t.max_participantes}\n\n` +
            `*Inscritos:*\n${inscritos}`,
          footer:  'Solo Leveling System • Torneio',
        }, sock, [
          { type: 'cmd', text: '📋 Inscrever-se', command: `${p}torneio_entrar` },
        ], info);
      }

      case `${p}torneio_criar`: {
        if (getTournament())
          return sock.sendMessage(from, { text: '❌ Já existe um torneio ativo.' }, { quoted: info });

        const nome = args.join(' ').trim() || 'Grande Torneio dos Hunters';
        const t = {
          nome,
          status:          'inscricoes',
          participantes:   [],
          max_participantes: 8,
          bracket:         [],
          rodada:          0,
          vencedor:        null,
          criado_por:      id,
          criado_por_nome: user.nome,
          criado_em:       Date.now(),
        };
        saveTournament(t);
        return sock.sendMessage(from, {
          text:
            `🏆 *TORNEIO CRIADO!*\n\n` +
            `Nome: *${nome}*\n` +
            `Vagas: 8 participantes\n\n` +
            `Use *${p}torneio_entrar* para se inscrever!\n` +
            `Quando tiver participantes suficientes, use *${p}torneio_iniciar* para começar.`,
        }, { quoted: info });
      }

      case `${p}torneio_entrar`: {
        const t = getTournament();
        if (!t) return sock.sendMessage(from, { text: '❌ Nenhum torneio aberto.' }, { quoted: info });
        if (t.status !== 'inscricoes') return sock.sendMessage(from, { text: '❌ As inscrições estão encerradas.' }, { quoted: info });
        if (t.participantes.find(p => p.id === id)) return sock.sendMessage(from, { text: '⚠️ Você já está inscrito.' }, { quoted: info });
        if (t.participantes.length >= t.max_participantes) return sock.sendMessage(from, { text: '❌ Torneio lotado.' }, { quoted: info });

        t.participantes.push({ id, nome: user.nome, rank: user.rank, vitorias: 0, eliminado: false });
        saveTournament(t);
        return sock.sendMessage(from, {
          text:
            `✅ *${user.nome}* inscrito no torneio!\n` +
            `Participantes: ${t.participantes.length}/${t.max_participantes}`,
        }, { quoted: info });
      }

      case `${p}torneio_iniciar`: {
        const t = getTournament();
        if (!t) return sock.sendMessage(from, { text: '❌ Nenhum torneio ativo.' }, { quoted: info });
        if (t.criado_por !== id) return sock.sendMessage(from, { text: '❌ Apenas o criador pode iniciar.' }, { quoted: info });
        if (t.participantes.length < 2) return sock.sendMessage(from, { text: '❌ Mínimo 2 participantes.' }, { quoted: info });
        if (t.status !== 'inscricoes') return sock.sendMessage(from, { text: '❌ Torneio já iniciado.' }, { quoted: info });

        const partics = [...t.participantes].sort(() => Math.random() - 0.5);
        const bracket = [];
        for (let i = 0; i < partics.length - 1; i += 2) {
          bracket.push({ p1: partics[i], p2: partics[i + 1] || null, vencedor: null });
        }
        t.bracket = bracket;
        t.rodada  = 1;
        t.status  = 'ativo';
        saveTournament(t);

        const confrontos = bracket.map((m, i) =>
          `⚔️ *${m.p1.nome}* vs *${m.p2?.nome || 'BYE'}*`
        ).join('\n');

        return sock.sendMessage(from, {
          text:
            `🏆 *TORNEIO INICIADO!*\n\n` +
            `*Rodada 1 — Confrontos:*\n${confrontos}\n\n` +
            `Use *${p}torneio_lutar* para disputar sua luta!`,
        }, { quoted: info });
      }

      case `${p}torneio_lutar`: {
        const t = getTournament();
        if (!t || t.status !== 'ativo') return sock.sendMessage(from, { text: '❌ Nenhum torneio ativo.' }, { quoted: info });

        const matchIdx = t.bracket.findIndex(m =>
          (m.p1.id === id || m.p2?.id === id) && m.vencedor === null
        );
        if (matchIdx === -1) return sock.sendMessage(from, { text: '❌ Você não possui confronto pendente nesta rodada.' }, { quoted: info });

        const match = t.bracket[matchIdx];
        if (match.p2 === null) {
          match.vencedor = match.p1;
          saveTournament(t);
          return sock.sendMessage(from, { text: `✅ Você avançou automaticamente (adversário ausente)!` }, { quoted: info });
        }

        const p1User = getUser(match.p1.id);
        const p2User = getUser(match.p2.id);

        if (!p1User || !p2User) return sock.sendMessage(from, { text: '❌ Um dos participantes não foi encontrado.' }, { quoted: info });

        let p1Hp = p1User.hp_max;
        let p2Hp = p2User.hp_max;
        let turn = 0;

        while (p1Hp > 0 && p2Hp > 0 && turn < 30) {
          const dmg12 = Math.floor(p1User.stats.forca * 5 * (0.85 + Math.random() * 0.3));
          const dmg21 = Math.floor(p2User.stats.forca * 5 * (0.85 + Math.random() * 0.3));
          p2Hp -= dmg12;
          p1Hp -= dmg21;
          turn++;
        }

        const vencedorPartic = p1Hp > p2Hp ? match.p1 : match.p2;
        const perdedorPartic  = p1Hp > p2Hp ? match.p2 : match.p1;
        match.vencedor = vencedorPartic;

        const vUser = getUser(vencedorPartic.id);
        if (vUser) { addExp(vUser, 500); vUser.gold += 2000; vUser.pvp_wins = (vUser.pvp_wins || 0) + 1; saveUser(vUser); }
        const pUser = getUser(perdedorPartic.id);
        if (pUser) { pUser.pvp_losses = (pUser.pvp_losses || 0) + 1; saveUser(pUser); }

        const pendentes = t.bracket.filter(m => m.vencedor === null);
        let finalMsg = `\n\n⏳ Aguardando outros confrontos...`;

        if (pendentes.length === 0) {
          const vencedores = t.bracket.map(m => m.vencedor).filter(Boolean);
          if (vencedores.length === 1) {
            t.status    = 'finalizado';
            t.vencedor  = vencedores[0];
            finalMsg    = `\n\n🏆 *TORNEIO FINALIZADO!*\nCampeão: *${vencedores[0].nome}*`;
            const camp  = getUser(vencedores[0].id);
            if (camp) { addExp(camp, 3000); camp.gold += 15000; saveUser(camp); }
          } else {
            t.bracket = [];
            for (let i = 0; i < vencedores.length - 1; i += 2) {
              t.bracket.push({ p1: vencedores[i], p2: vencedores[i + 1] || null, vencedor: null });
            }
            t.rodada++;
            finalMsg = `\n\n⚔️ *Rodada ${t.rodada} iniciada!*\nUse *${p}torneio_lutar* para continuar.`;
          }
        }

        saveTournament(t);
        return sock.sendMessage(from, {
          text:
            `⚔️ *RESULTADO DO DUELO*\n\n` +
            `🏆 Vencedor: *${vencedorPartic.nome}*\n` +
            `💀 Eliminado: *${perdedorPartic.nome}*\n\n` +
            `Recompensa ao vencedor: +500 EXP e +2.000G${finalMsg}`,
        }, { quoted: info });
      }

      case `${p}quest`:
      case `${p}quest_lista`: {
        const quests    = getQuests();
        const userQuest = user.quest_ativa;
        const concluidas = user.quests_concluidas || [];

        if (userQuest) {
          const q = quests.find(q => q.id === userQuest.id);
          if (!q) return sock.sendMessage(from, { text: '❌ Quest ativa não encontrada.' }, { quoted: info });

          const progresso = q.objetivos.map(obj => {
            const atual = user[obj.campo] || 0;
            const pct   = Math.min(100, Math.floor((atual / obj.quantidade) * 100));
            return `• ${obj.descricao}\n  Progresso: ${Math.min(atual, obj.quantidade)}/${obj.quantidade} (${pct}%)`;
          }).join('\n');

          return await sendlistbuttons(from, {
            image:   { url: DEFAULT_IMG },
            caption:
              `📜 *QUEST ATIVA*\n\n` +
              `*${q.titulo}* [${q.rank}]\n\n` +
              `${q.historia}\n\n` +
              `*Objetivos:*\n${progresso}\n\n` +
              `*Recompensas:* ${q.recompensas.exp} EXP | ${q.recompensas.gold}G${q.recompensas.item ? ` | ${q.recompensas.item}` : ''}`,
            footer:  'Solo Leveling System • Quest',
          }, sock, [
            { type: 'cmd', text: '✅ Checar Conclusão', command: `${p}quest_status` },
          ], info);
        }

        const disponiveis = quests.filter(q =>
          q.nivel_minimo <= user.level &&
          !concluidas.includes(q.id) &&
          q.tipo !== 'diaria'
        );

        if (!disponiveis.length)
          return sock.sendMessage(from, { text: '📜 Nenhuma quest disponível no momento. Continue evoluindo!' }, { quoted: info });

        return await sendListB(from, {
          image:   { url: DEFAULT_IMG },
          caption: `📜 *MISSÕES DISPONÍVEIS*\n\nNível: *${user.level}* | Quests concluídas: *${concluidas.length}*`,
          footer:  'Solo Leveling System • Quests',
        }, sock, sender, 'Missões', [{
          title:   'Quests Disponíveis',
          options: disponiveis.map(q => ({
            title:   `${q.titulo} [${q.rank}]`,
            body:    `Recompensa: ${q.recompensas.exp} EXP + ${q.recompensas.gold}G`,
            command: `${p}quest_aceitar ${q.id}`,
          })),
        }], info);
      }

      case `${p}quest_aceitar`: {
        if (user.quest_ativa) return sock.sendMessage(from, { text: '❌ Você já possui uma quest ativa. Conclua ou abandone ela primeiro.' }, { quoted: info });

        const questId = args[0];
        const quests  = getQuests();
        const q       = quests.find(q => q.id === questId);

        if (!q) return sock.sendMessage(from, { text: '❌ Quest não encontrada.' }, { quoted: info });
        if (user.level < q.nivel_minimo) return sock.sendMessage(from, { text: `❌ Nível insuficiente. Requer nível ${q.nivel_minimo}.` }, { quoted: info });
        if ((user.quests_concluidas || []).includes(q.id)) return sock.sendMessage(from, { text: '❌ Quest já concluída.' }, { quoted: info });

        user.quest_ativa = { id: q.id, aceita_em: Date.now(), kills_hoje: 0, dungeons_hoje: 0 };
        saveUser(user);

        return sock.sendMessage(from, {
          text:
            `📜 *QUEST ACEITA!*\n\n` +
            `*${q.titulo}*\n\n` +
            `${q.historia}\n\n` +
            `*Objetivos:*\n${q.objetivos.map(o => `• ${o.descricao}`).join('\n')}\n\n` +
            `Use *${p}quest* para acompanhar o progresso.`,
        }, { quoted: info });
      }

      case `${p}quest_status`: {
        if (!user.quest_ativa) return sock.sendMessage(from, { text: `❌ Você não possui quest ativa. Use *${p}quest* para aceitar uma.` }, { quoted: info });

        const quests = getQuests();
        const q      = quests.find(q => q.id === user.quest_ativa.id);
        if (!q) { user.quest_ativa = null; saveUser(user); return sock.sendMessage(from, { text: '❌ Quest inválida removida.' }, { quoted: info }); }

        const concluida = q.objetivos.every(obj => (user[obj.campo] || 0) >= obj.quantidade);

        if (concluida) {
          if (!user.quests_concluidas) user.quests_concluidas = [];
          user.quests_concluidas.push(q.id);

          addExp(user, q.recompensas.exp);
          user.gold += q.recompensas.gold;

          if (q.recompensas.item) {
            const allItems = getItems();
            const rewardItem = allItems.find(i => i.id === q.recompensas.item);
            if (rewardItem) {
              const idx = user.inventory.findIndex(i => i.id === rewardItem.id);
              if (idx > -1) user.inventory[idx].qtd++;
              else user.inventory.push({ ...rewardItem, qtd: 1 });
            }
          }

          user.quest_ativa = null;
          if (q.proxima_quest) user.proxima_quest_hint = q.proxima_quest;

          saveUser(user);
          return sock.sendMessage(from, {
            text:
              `🎉 *QUEST CONCLUÍDA!*\n\n` +
              `*${q.titulo}*\n\n` +
              `*Recompensas recebidas:*\n` +
              `🌟 +${q.recompensas.exp} EXP\n` +
              `💰 +${q.recompensas.gold}G\n` +
              (q.recompensas.item ? `🎁 Item: ${q.recompensas.item}\n` : '') +
              (q.proxima_quest ? `\n📜 Nova quest disponível! Use *${p}quest* para ver.` : '\n✨ Você completou todas as missões da história!'),
          }, { quoted: info });
        }

        const progresso = q.objetivos.map(obj => {
          const atual = user[obj.campo] || 0;
          return `• ${obj.descricao}: ${Math.min(atual, obj.quantidade)}/${obj.quantidade}`;
        }).join('\n');

        return sock.sendMessage(from, {
          text: `📜 *PROGRESSO DA QUEST*\n\n*${q.titulo}*\n\n${progresso}\n\nContinue caçando para completar!`,
        }, { quoted: info });
      }

      case `${p}guerra_declarar`: {
        if (!user.guilda) return sock.sendMessage(from, { text: '❌ Você não pertence a nenhuma guilda.' }, { quoted: info });
        const meuGuild = getGuild(user.guilda);
        if (!meuGuild || meuGuild.master !== id) return sock.sendMessage(from, { text: '❌ Apenas o mestre da guilda pode declarar guerra.' }, { quoted: info });

        const alvoNome = args.join(' ').trim();
        if (!alvoNome) {
          const guilds = listGuilds().filter(g => g.nome !== meuGuild.nome);
          if (!guilds.length) return sock.sendMessage(from, { text: '😔 Não há outras guildas para desafiar.' }, { quoted: info });
          return await sendListB(from, {
            image:   { url: DEFAULT_IMG },
            caption: `⚔️ *DECLARAR GUERRA*\n\nEscolha uma guilda para desafiar:`,
            footer:  'Solo Leveling System • Guerra de Guildas',
          }, sock, sender, 'Guildas', [{
            title:   'Guildas Disponíveis',
            options: guilds.map(g => ({
              title:   g.nome,
              body:    `Mestre: ${g.master_nome} | ${g.membros.length} membros`,
              command: `${p}guerra_declarar ${g.nome}`,
            })),
          }], info);
        }

        const alvoGuild = getGuild(alvoNome);
        if (!alvoGuild) return sock.sendMessage(from, { text: '❌ Guilda alvo não encontrada.' }, { quoted: info });
        if (alvoNome.toLowerCase() === meuGuild.nome.toLowerCase()) return sock.sendMessage(from, { text: '❌ Você não pode declarar guerra contra sua própria guilda.' }, { quoted: info });

        const warId = `war_${meuGuild.nome.replace(/\s/g,'_')}_vs_${alvoGuild.nome.replace(/\s/g,'_')}`;
        if (getWar(warId)) return sock.sendMessage(from, { text: '❌ Já existe uma guerra entre essas guildas.' }, { quoted: info });

        const war = {
          id:        warId,
          atacante:  { nome: meuGuild.nome, master: id, pontos: 0 },
          defensor:  { nome: alvoGuild.nome, master: alvoGuild.master, pontos: 0 },
          status:    'ativa',
          duracao_turnos: 10,
          turno_atual:   0,
          ataques: [],
          iniciada_em: Date.now(),
        };
        saveWar(warId, war);

        return sock.sendMessage(from, {
          text:
            `⚔️ *GUERRA DECLARADA!*\n\n` +
            `*${meuGuild.nome}* declarou guerra contra *${alvoGuild.nome}*!\n\n` +
            `Membros de ambas as guildas podem atacar usando:\n*${p}guerra_atacar ${warId}*\n\n` +
            `A guilda com mais pontos ao fim dos 10 ataques vence!`,
        }, { quoted: info });
      }

      case `${p}guerra_atacar`: {
        if (!user.guilda) return sock.sendMessage(from, { text: '❌ Você não pertence a nenhuma guilda.' }, { quoted: info });
        const warId = args[0];
        if (!warId) return sock.sendMessage(from, { text: `❌ Informe o ID da guerra. Ex: \`${p}guerra_atacar ID\`` }, { quoted: info });

        const war = getWar(warId);
        if (!war) return sock.sendMessage(from, { text: '❌ Guerra não encontrada.' }, { quoted: info });
        if (war.status !== 'ativa') return sock.sendMessage(from, { text: '❌ Esta guerra já foi encerrada.' }, { quoted: info });

        const isAtacante = war.atacante.nome === user.guilda;
        const isDefensor = war.defensor.nome === user.guilda;
        if (!isAtacante && !isDefensor) return sock.sendMessage(from, { text: '❌ Você não faz parte desta guerra.' }, { quoted: info });

        const jaAtacou = war.ataques.filter(a => a.id === id && a.lado === (isAtacante ? 'atacante' : 'defensor'));
        if (jaAtacou.length >= 2) return sock.sendMessage(from, { text: '⚠️ Você já realizou seus ataques nesta guerra.' }, { quoted: info });

        const pontos = Math.floor(user.stats.forca * 3 + user.level * 10 + Math.random() * 200);
        if (isAtacante) war.atacante.pontos += pontos;
        else war.defensor.pontos += pontos;

        war.ataques.push({ id, nome: user.nome, lado: isAtacante ? 'atacante' : 'defensor', pontos });
        war.turno_atual++;

        let finalMsg = '';
        if (war.turno_atual >= war.duracao_turnos) {
          war.status = 'encerrada';
          const vencedor = war.atacante.pontos >= war.defensor.pontos ? war.atacante : war.defensor;
          const perdedor = vencedor.nome === war.atacante.nome ? war.defensor : war.atacante;
          war.vencedor   = vencedor.nome;
          finalMsg =
            `\n\n🏆 *GUERRA ENCERRADA!*\n` +
            `Vencedor: *${vencedor.nome}* (${vencedor.pontos} pontos)\n` +
            `Derrotado: *${perdedor.nome}* (${perdedor.pontos} pontos)`;

          const vGuild = getGuild(vencedor.nome);
          if (vGuild) { vGuild.guerras_vencidas = (vGuild.guerras_vencidas || 0) + 1; saveGuild(vGuild); }
        }

        saveWar(warId, war);
        return sock.sendMessage(from, {
          text:
            `⚔️ *ATAQUE NA GUERRA!*\n\n` +
            `*${user.nome}* contribuiu *${pontos}* pontos para *${user.guilda}*!\n\n` +
            `📊 *Placar atual:*\n` +
            `${war.atacante.nome}: ${war.atacante.pontos} pts\n` +
            `${war.defensor.nome}: ${war.defensor.pontos} pts\n\n` +
            `Ataques: ${war.turno_atual}/${war.duracao_turnos}${finalMsg}`,
        }, { quoted: info });
      }

      case `${p}guerra_status`: {
        const warId = args[0];
        if (!warId) return sock.sendMessage(from, { text: `❌ Informe o ID da guerra.` }, { quoted: info });
        const war = getWar(warId);
        if (!war) return sock.sendMessage(from, { text: '❌ Guerra não encontrada.' }, { quoted: info });

        const statusStr = war.status === 'ativa' ? '⚔️ Em andamento' : '🏆 Encerrada';
        return sock.sendMessage(from, {
          text:
            `⚔️ *GUERRA DE GUILDAS*\n\n` +
            `Status: ${statusStr}\n\n` +
            `📊 *Placar:*\n` +
            `${war.atacante.nome}: *${war.atacante.pontos} pts*\n` +
            `${war.defensor.nome}: *${war.defensor.pontos} pts*\n\n` +
            `Ataques: ${war.turno_atual}/${war.duracao_turnos}\n` +
            (war.vencedor ? `🏆 Vencedor: *${war.vencedor}*` : `Use *${p}guerra_atacar ${warId}* para atacar!`),
        }, { quoted: info });
      }

      default:
        return false;
    }
  }
}

module.exports = RPGExtensions;
