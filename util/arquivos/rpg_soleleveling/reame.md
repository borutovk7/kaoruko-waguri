# Solo Leveling System — Completo

## Arquivos

```
arquivos/ARQUIVES/rpg/
├── hunters.json        ← 12 hunters
├── dungeons.json       ← 18 dungeons (E a S)
├── skills.json         ← 22 habilidades
├── items.json          ← 28 itens
├── shadows.json        ← 7 sombras com evolução
├── bosses.json         ← 5 bosses para raid
├── quests.json         ← 7 quests (história + diárias)
├── users/              ← dados dos jogadores
├── battles/            ← combates ativos
├── raids/              ← raids ativas
├── market/             ← mercado de jogadores
├── torneios/           ← torneio PvP
├── guilds/             ← dados das guildas
└── wars/               ← guerras entre guildas
```

---

## Integração no Bot

```js
const SoloLevelingSystem = require('./SoloLeveling_System');
const RPGExtensions      = require('./SoloLeveling_Extensions');

const PREFIXO = '.';

const cmdsBase = [
  'rpg','registrar','criar','registrar_custom','hunters','escolher',
  'status','cacar','atacar','fugir','skills','usar_skill','treinar',
  'missao','loja','comprar','inventario','usar','arise','arise_extract',
  'aprender','ranking','pvp','aceitar_pvp','criar_guilda','entrar_guilda',
  'sair_guilda','guilda','ajuda_rpg','mudar_foto',
];

const cmdsExt = [
  'raid','raid_listar','raid_criar','raid_entrar','raid_iniciar','raid_atacar',
  'mercado','vender','comprar_mercado','cancelar_venda',
  'sombras','evoluir_sombra',
  'torneio','torneio_criar','torneio_entrar','torneio_iniciar','torneio_lutar',
  'quest','quest_lista','quest_aceitar','quest_status',
  'guerra_declarar','guerra_atacar','guerra_status',
];

const cmd = body.split(' ')[0].replace(PREFIXO, '').toLowerCase();

if (cmdsBase.includes(cmd)) {
  return SoloLevelingSystem.handleCommand(
    from, sender, body, pushname, sock, info, sendButton, sendListB, PREFIXO
  );
}
if (cmdsExt.includes(cmd)) {
  return RPGExtensions.handleCommand(
    from, sender, body, pushname, sock, info, sendButton, sendListB, PREFIXO
  );
}
```

---

## Comandos

### 🏟️ Boss Raid
| Comando | Descrição |
|---|---|
| `.raid` | Ver bosses disponíveis |
| `.raid_criar BOSS_ID` | Criar sala de raid |
| `.raid_entrar RAID_ID` | Entrar em raid |
| `.raid_iniciar RAID_ID` | Iniciar (líder) |
| `.raid_atacar RAID_ID` | Atacar boss |

### 🏬 Mercado
| Comando | Descrição |
|---|---|
| `.mercado` | Ver itens à venda |
| `.vender Item \| Preço` | Colocar item à venda |
| `.comprar_mercado ID` | Comprar do mercado |
| `.cancelar_venda ID` | Cancelar venda |

### 🌑 Evolução de Sombras
| Comando | Descrição |
|---|---|
| `.sombras` | Ver exército completo |
| `.evoluir_sombra` | Listar sombras |
| `.evoluir_sombra NOME` | Evoluir (custa Pedra da Evolução) |

### 🏆 Torneio PvP
| Comando | Descrição |
|---|---|
| `.torneio` | Ver torneio ativo |
| `.torneio_criar NOME` | Criar torneio |
| `.torneio_entrar` | Inscrever-se |
| `.torneio_iniciar` | Iniciar (criador) |
| `.torneio_lutar` | Disputar confronto |

### 📜 Quests
| Comando | Descrição |
|---|---|
| `.quest` | Ver quest ativa / lista |
| `.quest_aceitar ID` | Aceitar quest |
| `.quest_status` | Checar e coletar recompensa |

### ⚔️ Guerra de Guildas
| Comando | Descrição |
|---|---|
| `.guerra_declarar` | Listar guildas |
| `.guerra_declarar NOME` | Declarar guerra |
| `.guerra_atacar ID` | Atacar |
| `.guerra_status ID` | Ver placar |

---

## Obs

- **Raid**: drops com 40% de chance por membro. Drops configuráveis por boss no bosses.json
- **Mercado**: gold vai direto para o vendedor quando comprado
- **Sombras**: requerem Pedra da Evolução (ID: pedra_evolucao) — 50.000G na loja
- **Torneio**: bracket eliminatório automático com avanço por BYE
- **Quests**: progresso rastreado pelos campos: total_kills, dungeons_cleared, pvp_wins
- **Guerra**: encerra após 10 ataques totais entre as duas guildas
