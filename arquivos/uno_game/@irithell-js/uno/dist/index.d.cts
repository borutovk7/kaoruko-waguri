type CardColor = "Vermelho" | "Amarelo" | "Verde" | "Azul" | "Especial";
type CardValue = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "+2" | "Pular" | "Inverter" | "Curinga" | "Curinga +4";
type PlayerType = "HUMAN" | "AI";
type ActionType = "PLAY_CARD" | "DRAW_CARD";
type GameDirection = 1 | -1;
type Language = "pt-BR" | "en-US";
interface SerializedCard {
    color: CardColor;
    value: CardValue;
    display: string;
    imageFilename: string;
    imageAbsolutePath: string;
    imageRelativePath: string;
    imageCwdPath: string;
}
interface PlayerInfo {
    name: string;
    cardsInHand: number;
    isUno: boolean;
    hand?: SerializedCard[];
    validMoves?: number[];
}
interface TurnLog {
    player: string;
    action: ActionType;
    card?: string;
    quantity?: number;
    effect?: string;
}
interface GameState {
    gameId: string;
    turnLog: TurnLog[];
    turnNumber: number;
    gameOver: boolean;
    winner: string | null;
    currentPlayer: string;
    nextPlayer: string;
    playerOrder: string[];
    currentColor: CardColor;
    topCard: SerializedCard;
    deckCardsRemaining: number;
    players: PlayerInfo[];
}
interface PlayerConfig {
    name: string;
    type: PlayerType;
}
interface GameOptions {
    players: PlayerConfig[];
    language?: Language;
}
interface PlayData {
    action: "play_card" | "draw_card";
    cardIndex?: number;
    chosenColor?: CardColor;
}
interface SavedGameState {
    gameId: string;
    players: SavedPlayerState[];
    discardPile: string[];
    deck: string[];
    currentPlayerIdx: number;
    direction: GameDirection;
    currentColor: CardColor;
    turnNumber: number;
    gameOver: boolean;
    winner: string | null;
}
interface SavedPlayerState {
    name: string;
    hand: string[];
    type: string;
}

declare class Card {
    readonly color: CardColor;
    readonly value: CardValue;
    constructor(color: CardColor, value: CardValue);
    toString(): string;
    getImageFilename(): string;
    toJSON(): SerializedCard;
    private validateCard;
    static fromString(str: string): Card;
}

declare class Deck {
    private cards;
    constructor();
    private createDeck;
    shuffle(): void;
    drawCard(): Card | null;
    refill(discardPile: Card[]): boolean;
    cardsRemaining(): number;
    getCards(): Card[];
    setCards(cards: Card[]): void;
}

declare abstract class Player {
    readonly name: string;
    hand: Card[];
    constructor(name: string, hand?: Card[]);
    drawCard(deck: Deck, quantity?: number): void;
    removeCard(cardIndex: number): Card | null;
    isUno(): boolean;
    hasWon(): boolean;
    abstract chooseColor(): CardColor;
    abstract chooseMove(topCard: Card, currentColor: CardColor, players: Player[], currentPlayerIdx: number, direction: number): Card | "draw";
}

declare class HumanPlayer extends Player {
    chooseColor(): CardColor;
    chooseMove(topCard: Card, currentColor: CardColor, players: Player[], currentPlayerIdx: number, direction: number): Card | "draw";
}

declare class AIPlayer extends Player {
    chooseColor(): CardColor;
    chooseMove(topCard: Card, currentColor: CardColor, players: Player[], currentPlayerIdx: number, direction: number): Card | "draw";
}

interface TurnResult {
    success: boolean;
    log?: TurnLog[];
    error?: string;
}
declare class GameEngine {
    gameId: string;
    id: string;
    players: Player[];
    deck: Deck;
    discardPile: Card[];
    currentPlayerIdx: number;
    direction: GameDirection;
    currentColor: CardColor;
    gameOver: boolean;
    winner: Player | null;
    turnNumber: number;
    constructor(options?: GameOptions, savedState?: SavedGameState);
    private rebuildFromState;
    private dealInitialCards;
    private startDiscardPile;
    private nextPlayer;
    private isValidMove;
    private applyCardEffect;
    processHumanTurn(playerName: string, data: PlayData): TurnResult;
    processAITurn(): TurnLog | null;
    getState(turnLog?: TurnLog[]): GameState;
    toSavedState(): SavedGameState;
}

interface GameInfo {
    gameId: string;
    playerCount: number;
    playerNames: string[];
    currentPlayer: string;
    turnNumber: number;
    gameOver: boolean;
    winner: string | null;
    createdAt: Date;
    updatedAt: Date;
}
declare class GameStorage {
    private storageDir;
    private indexPath;
    constructor(dirPath?: string);
    private initDatabase;
    private readIndex;
    private writeIndex;
    private getGameFilePath;
    saveGame(gameId: string, game: GameEngine): void;
    loadGame(gameId: string): GameEngine | null;
    gameExists(gameId: string): boolean;
    deleteGame(gameId: string): boolean;
    deleteGames(gameIds: string[]): number;
    clearAllGames(): number;
    clearFinishedGames(): number;
    clearOldGames(olderThanDays: number): number;
    listGames(): string[];
    listGamesFiltered(options?: {
        onlyActive?: boolean;
        onlyFinished?: boolean;
        limit?: number;
    }): string[];
    getGameInfo(gameId: string): {
        gameId: string;
        createdAt: Date;
        updatedAt: Date;
    } | null;
    getDetailedGameInfo(gameId: string): GameInfo | null;
    getStats(): {
        totalGames: number;
        activeGames: number;
        finishedGames: number;
        oldestGame: Date | null;
        newestGame: Date | null;
    };
    exportGame(gameId: string): string | null;
    importGame(jsonData: string): boolean;
    close(): void;
}

declare class I18n {
    private currentLanguage;
    setLanguage(language: Language): void;
    getLanguage(): Language;
    getCardColor(cardColor: CardColor): string;
    getCardValue(cardValue: CardValue): string;
    parseColor(input: string): CardColor | null;
    parseValue(input: string): CardValue | null;
    t(key: string, params?: Record<string, string | number>): string;
}
declare const i18n: I18n;

declare class CardImageResolver {
    private static getBaseDir;
    static getAbsolutePath(color: string, value: string): string;
    static getRelativePath(color: string, value: string): string;
    static getCwdRelativePath(color: string, value: string): string;
    static getUrl(color: string, value: string, baseUrl?: string): string;
    static getFilename(color: string, value: string): string;
    private static formatFilename;
    static listImages(): string[];
}

export { AIPlayer, type ActionType, Card, type CardColor, CardImageResolver, type CardValue, Deck, type GameDirection, GameEngine, type GameInfo, type GameOptions, type GameState, GameStorage, HumanPlayer, type Language, type PlayData, Player, type PlayerConfig, type PlayerInfo, type PlayerType, type SavedGameState, type SavedPlayerState, type SerializedCard, type TurnLog, i18n };
