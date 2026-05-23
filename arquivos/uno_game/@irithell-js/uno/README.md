# UNO Game Engine

A fully-featured, production-ready UNO card game engine built with TypeScript. Zero dependencies for core gameplay, with modular architecture supporting human players, AI opponents, and persistent game storage.

## Features

- **Complete UNO Rules** - All official rules including +2, +4, Skip, Reverse, and Wild cards
- **AI Opponents** - Intelligent AI players with strategic decision-making
- **Human Player Support** - Interactive gameplay with move validation
- **Game Persistence** - Save and restore games using SQLite3
- **Zero Core Dependencies** - Minimal external libraries for game logic
- **Extensible Design** - Easy to add new player types or storage backends
- **ESM Support** - Modern ES module exports
- **CJS Support** - Full support for CJS uses

## Installation

```bash
npm install @irithell-js/uno
```

## Quick Start

### Basic Usage (ESM)

```typescript
import { GameEngine } from "@irithell-js/uno";

// Create a new game with human and AI players
const game = new GameEngine({
  players: [
    { name: "Irithell", type: "HUMAN" },
    { name: "AI-SkyNet", type: "AI" },
    { name: "AI-R2-D2", type: "AI" },
  ],
  language: "pt-BR", // Portuguese or "en-US" for English
});

// Get game state
const state = game.getState();
console.log(`Current player: ${state.currentPlayer}`);
console.log(`Top card: ${state.topCard.display}`);

// Process player turn
const result = game.processHumanTurn("Player 1", {
  action: "play_card",
  cardIndex: 0,
  chosenColor: "red", // Required for Wild cards
});

if (result.success) {
  console.log("Card played successfully!");
}

// Process AI turns
while (
  !game.gameOver &&
  game.players[game.currentPlayerIdx].name !== "Player 1"
) {
  game.processAITurn();
}
```

### Using GameStorage

```typescript
import { GameEngine, GameStorage } from "@irithell-js/uno";

const storage = new GameStorage();
const game = new GameEngine({
  players: [
    { name: "Irithell", type: "HUMAN" },
    { name: "AI-SkyNet", type: "AI" },
    { name: "AI-R2-D2", type: "AI" },
  ],
});

// Save game
storage.saveGame(game.id, game);

// List saved games
const gameIds = storage.listGames();
console.log("Saved games:", gameIds);

// Load game
const loaded = storage.loadGame(game.id);
if (loaded) {
  console.log("Game restored!");
}

// Get game info
const info = storage.getDetailedGameInfo(game.id);
console.log(`Players: ${info.playerNames.join(", ")}`);
console.log(`Turn: ${info.turnNumber}`);
```

## Architecture

#### GameEngine

Main game logic orchestrator.

```typescript
const game = new GameEngine(options?, savedState?);

// Properties
game.id; // Unique game identifier
game.players; // Array of Player instances
game.deck; // Current deck
game.discardPile; // Cards played
game.currentPlayerIdx; // Current player index
game.direction; // 1 (normal) or -1 (reversed)
game.currentColor; // Active color (for Wild cards)
game.gameOver; // Game status
game.winner; // Winning player or null

// Methods
game.getState(turnLog?); // Get current game state
game.processHumanTurn(playerName, data); // Process human player action
game.processAITurn(); // Process AI player turn
game.toSavedState(); // Serialize for storage
```

#### Player Types

**HumanPlayer** - Receives explicit move commands.

```typescript
const player = new HumanPlayer("Alice");
player.drawCard(deck, 1);
const valid = player.hand[0].isValid(topCard, currentColor);
```

**AIPlayer** - Makes strategic decisions autonomously.

```typescript
const aiPlayer = new AIPlayer("Computer");
const move = aiPlayer.chooseMove(
  topCard,
  currentColor,
  allPlayers,
  idx,
  direction,
);
// Returns either "draw" or a Card object to play
```

#### Card System

```typescript
const card = new Card("red", "5");
card.display; // "5 Vermelho"
card.toString(); // Serialization format
card.toJSON(); // Object representation

// Special cards
new Card("Especial", "Wild"); // Wild card
new Card("Especial", "Wild +4"); // Wild +4
new Card("Red", "+2"); // Draw 2
new Card("Blue", "Pular"); // Skip
new Card("Blue", "reverse"); // Reverse
```

#### Cards assets

```typescript
import { CardImageResolver, Card } from "../dist/index.mjs";
import { existsSync } from "fs";
const card = new Card("Vermelho", "3");
const paths = card.toJSON();
console.log(
  "Absolute:",
  paths.imageAbsolutePath,
  existsSync(paths.imageAbsolutePath),
);
console.log(
  "CWD relative:",
  CardImageResolver.getCwdRelativePath("Vermelho", "3"),
  existsSync("../dist/assets/cards/vermelho_3.png"),
);
console.log(
  "Relative dist:",
  CardImageResolver.getRelativePath("Vermelho", "3"),
);
```

#### Deck Management

```typescript
const deck = new Deck();
deck.shuffle();
const card = deck.drawCard();
deck.cardsRemaining();
deck.refill(discardPile); // Reshuffle used cards
```

#### GameStorage

Persistent storage using SQLite3.

```typescript
const storage = new GameStorage(dbPath?);

// Save game
storage.saveGame(gameId, gameEngine);

// Load game
const loaded = storage.loadGame(gameId);

// List all games
const ids = storage.listGames();

// Get game details
const info = storage.getDetailedGameInfo(gameId);

// Clean up
storage.close();
```

## Game State

The `getState()` method returns comprehensive game information:

```typescript
interface GameState {
  gameId: string;
  turnNumber: number;
  gameOver: boolean;
  winner: string | null;
  currentPlayer: string;
  nextPlayer: string;
  playerOrder: string[];
  currentColor: CardColor;
  topCard: CardJSON;
  deckCardsRemaining: number;
  players: PlayerInfo[];
  turnLog: TurnLog[];
}

interface PlayerInfo {
  name: string;
  cardsInHand: number;
  isUno: boolean;
  hand?: CardJSON[]; // Only for current human player
  validMoves?: number[]; // Indices of playable cards
}
```

## Configuration

### GameOptions

```typescript
interface GameOptions {
  players: Array<{
    name: string;
    type: "HUMAN" | "AI";
  }>;
  language?: "pt-BR" | "en-US"; // Default: "pt-BR"
}

// Create game
const game = new GameEngine({
  players: [
    { name: "Irithell", type: "HUMAN" },
    { name: "AI-SkyNet", type: "AI" },
    { name: "AI-R2-D2", type: "AI" },
  ],
  language: "en-US",
});
```

### Storage Configuration

```typescript
// Use default database (./uno_games.db)
const storage = new GameStorage();

// Specify custom database path
const storage = new GameStorage("./my-games.db");
```

## Turn Processing

### Human Turn

```typescript
const result = game.processHumanTurn("Player Name", {
  action: "play_card",
  cardIndex: 0,
  chosenColor: "red", // Only for Wild cards
});

// Or draw card
const result = game.processHumanTurn("Player Name", {
  action: "draw_card",
});

// Result structure
interface TurnResult {
  success: boolean;
  log?: TurnLog[];
  error?: string;
}
```

### AI Turn

```typescript
const log = game.processAITurn();

if (log) {
  console.log(`${log.player} played: ${log.card || "drew card"}`);
}

// Result
interface TurnLog {
  player: string;
  action: "PLAY_CARD" | "DRAW_CARD";
  card?: string;
  quantity?: number;
}
```

## Game Rules Implementation

### Card Effects

- **+2 (Draw 2)** - Next player draws 2 cards and skips turn
- **Curinga +4 (Wild +4)** - Player chooses color, next player draws 4 cards and skips turn
- **Pular (Skip)** - Skip next player's turn
- **Inverter (Reverse)** - Reverse play direction
- **Curinga (Wild)** - Player chooses any valid color

### Valid Moves

A card is valid if:

- It matches the current card's **color**, OR
- It matches the current card's **value**, OR
- It is a **Wild card**

### Win Condition

Player wins when they play their last card and no cards remain in hand.

### Deck Management

- Initial deck: 108 cards (4 colors × 25 cards + 4 Wilds + 4 Wild+4)
- Discard pile reshuffled into deck when empty
- Game continues until winner found

## API Reference

### GameEngine

#### `constructor(options?: GameOptions, savedState?: SavedGameState)`

Create new game or restore from saved state.

#### `getState(turnLog?: TurnLog[]): GameState`

Get current game state snapshot.

#### `processHumanTurn(playerName: string, data: PlayData): TurnResult`

Process human player action. Returns success/error result.

#### `processAITurn(): TurnLog | null`

Process AI player's automatic turn. Returns action log or null if game over.

#### `toSavedState(): SavedGameState`

Serialize game for storage.

### GameStorage

#### `constructor(dbPath?: string)`

Initialize storage with optional custom database path.

#### `saveGame(gameId: string, game: GameEngine): void`

Save game state to database.

#### `loadGame(gameId: string): GameEngine | null`

Load game from database or null if not found.

#### `listGames(): string[]`

Get array of all saved game IDs.

#### `getDetailedGameInfo(gameId: string): GameInfo`

Get metadata about saved game (players, turn, winner, dates).

#### `close(): void`

Close database connection.

## Supported Languages

- **pt-BR** - Portuguese (Brazil) - Default
- **en-US** - English (US)

All card names, error messages, and prompts are translated.

## Database Schema

SQLite3 database with `games` table:

```sql
CREATE TABLE games (
  game_id TEXT PRIMARY KEY,
  game_state TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)
```

**Query saved games:**

```bash
sqlite3 uno_games.db "SELECT * FROM games;"
```

## Performance

Typical operation times:

| Operation                  | Time    |
| -------------------------- | ------- |
| Create new game            | <1ms    |
| Get game state             | <1ms    |
| Save game                  | 2-5ms   |
| Load game                  | 3-8ms   |
| AI turn decision           | 5-20ms  |
| Batch AI turns (3 players) | 15-60ms |

## Error Handling

```typescript
try {
  const result = game.processHumanTurn("Player", {
    action: "play_card",
    cardIndex: 0,
  });

  if (!result.success) {
    console.error(result.error);
  }
} catch (error) {
  console.error("Fatal error:", error.message);
}
```

Common errors:

- `"errors.playerRequired"` - No players provided
- `"errors.notYourTurn"` - Wrong player attempted move
- `"errors.invalidCardIndex"` - Card index out of range
- `"errors.invalidMove"` - Card cannot be played
- `"errors.colorRequired"` - Wild card color not specified
- `"errors.notEnoughCardsToRefill"` - Deck empty and cannot refill

## Troubleshooting

### Database File Not Found

````bash
# Check database location
ls -la uno_games.db

### Games Not Persisting

Ensure database directory is writable:

```bash
chmod 755 .
````

### AI Takes Too Long

## License

MIT

## Changelog

### 1.0.0 (Latest)

- Initial release
- Complete UNO game implementation
- AI player system with strategic decision-making
- SQLite3 persistent storage
- Full TypeScript support
- Full CJS and ESM support
- Portuguese and English translations
- Comprehensive debug logging
