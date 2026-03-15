/** 
 * GameState.ts - 游戏状态管理
 * 管理全局游戏状态、玩家数据、地图进度等
 */

import { _decorator, Component, Node, director } from 'cc';
const { ccclass, property } = _decorator;

// 游戏状态枚举
export enum ScreenType {
    MENU = 'menu',
    CLASS_SELECT = 'class-select',
    MAP = 'map',
    BATTLE = 'battle'
}

// 卡牌类型
export enum CardType {
    ATTACK = 'attack',
    SKILL = 'skill',
    POWER = 'power'
}

// 卡牌稀有度
export enum CardRarity {
    COMMON = 'common',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary'
}

// 卡牌数据接口
export interface ICardData {
    id: string;
    name: string;
    cost: number;
    type: CardType;
    rarity: CardRarity;
    description: string;
    effect?: Function;
}

// 敌人意图接口
export interface IEnemyIntent {
    type: string;
    value: number;
    icon: string;
    desc?: string;
}

// 敌人数据接口
export interface IEnemyData {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    intents: IEnemyIntent[];
    isBoss?: boolean;
    isElite?: boolean;
    enrageThreshold?: number;
}

// 职业数据接口
export interface IClassData {
    id: string;
    name: string;
    maxHp: number;
    startingDeck: string[];
    relic: IRelicData;
}

// 遗物数据接口
export interface IRelicData {
    name: string;
    description: string;
    effect: string;
    value: number;
}

// 能力效果接口
export interface IPowerData {
    name: string;
    effect: string;
    value: number;
    duration?: number;
    used?: boolean;
}

// 玩家类
export class Player {
    class: string = '';
    name: string = '';
    maxHp: number = 80;
    hp: number = 80;
    gold: number = 99;
    deck: string[] = [];
    relics: IRelicData[] = [];
    powers: IPowerData[] = [];
    floor: number = 1;

    constructor(classId: string, classData: IClassData) {
        this.class = classId;
        this.name = classData.name;
        this.maxHp = classData.maxHp;
        this.hp = classData.maxHp;
        this.deck = [...classData.startingDeck];
        this.relics = [classData.relic];
    }
}

// 战斗状态
export interface IBattleState {
    turn: number;
    hand: string[];
    drawPile: string[];
    discardPile: string[];
    energy: number;
    maxEnergy: number;
    block: number;
}

// 地图状态
export interface IMapState {
    floor: number;
    currentNode: string | null;
}

@ccclass('GameState')
export class GameState extends Component {
    // 单例实例
    private static _instance: GameState | null = null;
    public static get instance(): GameState {
        return GameState._instance!;
    }

    // 当前屏幕
    public currentScreen: ScreenType = ScreenType.MENU;

    // 玩家数据
    public player: Player | null = null;

    // 当前敌人
    public currentEnemy: IEnemyData | null = null;

    // 地图状态
    public map: IMapState = {
        floor: 1,
        currentNode: null
    };

    // 战斗状态
    public battle: IBattleState = {
        turn: 1,
        hand: [],
        drawPile: [],
        discardPile: [],
        energy: 3,
        maxEnergy: 3,
        block: 0
    };

    onLoad() {
        if (GameState._instance === null) {
            GameState._instance = this;
            director.addPersistRootNode(this.node);
        } else {
            this.destroy();
        }
    }

    // 重置战斗状态
    public resetBattle(): void {
        this.battle = {
            turn: 1,
            hand: [],
            drawPile: [...this.player!.deck],
            discardPile: [],
            energy: 3,
            maxEnergy: 3,
            block: 0
        };
        this.shuffleDeck();
    }

    // 洗牌
    public shuffleDeck(): void {
        const pile = this.battle.drawPile;
        for (let i = pile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pile[i], pile[j]] = [pile[j], pile[i]];
        }
    }

    // 抽牌
    public drawCards(count: number): void {
        for (let i = 0; i < count; i++) {
            if (this.battle.drawPile.length === 0) {
                if (this.battle.discardPile.length === 0) break;
                this.battle.drawPile = [...this.battle.discardPile];
                this.battle.discardPile = [];
                this.shuffleDeck();
            }
            if (this.battle.drawPile.length > 0) {
                const cardId = this.battle.drawPile.pop()!;
                this.battle.hand.push(cardId);
            }
        }
    }

    // 获取格挡
    public gainBlock(amount: number): void {
        this.battle.block += amount;
    }

    // 下一层
    public nextFloor(): void {
        this.map.floor++;
        if (this.player) {
            this.player.floor = this.map.floor;
        }
    }

    // 重置游戏
    public resetGame(): void {
        this.player = null;
        this.currentEnemy = null;
        this.map.floor = 1;
        this.map.currentNode = null;
        this.currentScreen = ScreenType.MENU;
    }
}
