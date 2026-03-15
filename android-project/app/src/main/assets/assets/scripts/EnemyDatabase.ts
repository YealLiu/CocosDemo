/**
 * EnemyDatabase.ts - 敌人数据库
 * 包含所有敌人的定义和行为
 */

import { IEnemyData, IEnemyIntent } from './GameState';

// 敌人数据库
export const EnemyDatabase: Record<string, IEnemyData> = {
    'dark_servant': {
        id: 'dark_servant',
        name: '黑暗奴仆',
        hp: 40,
        maxHp: 40,
        intents: [
            { type: 'attack', value: 8, icon: '🔴' },
            { type: 'defend', value: 6, icon: '🔵' },
            { type: 'attack', value: 12, icon: '🔴' }
        ]
    },
    'cursed_mage': {
        id: 'cursed_mage',
        name: '诅咒法师',
        hp: 35,
        maxHp: 35,
        intents: [
            { type: 'attack', value: 6, icon: '🔴' },
            { type: 'debuff', value: 2, icon: '🟡', desc: '虚弱' },
            { type: 'attack', value: 10, icon: '🔴' }
        ]
    },
    'shadow_hunter': {
        id: 'shadow_hunter',
        name: '暗影猎手',
        hp: 45,
        maxHp: 45,
        intents: [
            { type: 'attack', value: 10, icon: '🔴' },
            { type: 'attack', value: 15, icon: '🔴' },
            { type: 'buff', value: 3, icon: '🟡', desc: '力量' }
        ]
    },
    'gatekeeper': {
        id: 'gatekeeper',
        name: '守门者',
        hp: 80,
        maxHp: 80,
        intents: [
            { type: 'attack', value: 10, icon: '🔴' },
            { type: 'defend', value: 10, icon: '🔵' },
            { type: 'attack', value: 15, icon: '🔴' },
            { type: 'special', value: 0, icon: '⚡', desc: '蓄力' }
        ],
        isBoss: true
    },
    'corrupted_guard': {
        id: 'corrupted_guard',
        name: '腐化守卫',
        hp: 50,
        maxHp: 50,
        intents: [
            { type: 'defend', value: 10, icon: '🔵' },
            { type: 'attack', value: 12, icon: '🔴', desc: '破甲' },
            { type: 'attack', value: 8, icon: '🔴' }
        ]
    },
    'berserk_orc': {
        id: 'berserk_orc',
        name: '狂暴兽人',
        hp: 60,
        maxHp: 60,
        intents: [
            { type: 'special', value: 0, icon: '⚡', desc: '蓄力' },
            { type: 'attack', value: 18, icon: '🔴' },
            { type: 'attack', value: 12, icon: '🔴' }
        ],
        enrageThreshold: 0.3
    },
    'heavy_knight': {
        id: 'heavy_knight',
        name: '重装骑士',
        hp: 100,
        maxHp: 100,
        intents: [
            { type: 'defend', value: 15, icon: '🔵' },
            { type: 'special', value: 0, icon: '🟡', desc: '反击姿态' },
            { type: 'attack', value: 20, icon: '🔴' }
        ],
        isElite: true
    }
};

// 敌人类 (运行时实例)
export class Enemy {
    id: string;
    name: string;
    maxHp: number;
    hp: number;
    intents: IEnemyIntent[];
    currentIntent: number = 0;
    block: number = 0;
    isBoss: boolean = false;
    isElite: boolean = false;
    enrageThreshold?: number;
    powers: any[] = [];

    constructor(enemyId: string) {
        const data = EnemyDatabase[enemyId];
        this.id = enemyId;
        this.name = data.name;
        this.maxHp = data.hp;
        this.hp = data.hp;
        this.intents = [...data.intents];
        this.isBoss = data.isBoss || false;
        this.isElite = data.isElite || false;
        this.enrageThreshold = data.enrageThreshold;
    }

    // 获取下一个意图
    getNextIntent(): IEnemyIntent {
        const intent = this.intents[this.currentIntent];
        this.currentIntent = (this.currentIntent + 1) % this.intents.length;
        return intent;
    }

    // 获取当前意图
    getCurrentIntent(): IEnemyIntent {
        return this.intents[this.currentIntent];
    }

    // 重置
    reset(): void {
        const data = EnemyDatabase[this.id];
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.block = 0;
        this.currentIntent = 0;
        this.powers = [];
    }

    // 是否处于狂暴状态
    isEnraged(): boolean {
        if (!this.enrageThreshold) return false;
        return this.hp / this.maxHp < this.enrageThreshold;
    }
}

// 根据楼层获取随机敌人
export function getRandomEnemy(floor: number): string {
    if (floor === 1) {
        const enemies = ['dark_servant', 'cursed_mage'];
        return enemies[Math.floor(Math.random() * enemies.length)];
    } else {
        const enemies = ['dark_servant', 'cursed_mage', 'shadow_hunter', 'corrupted_guard', 'berserk_orc'];
        return enemies[Math.floor(Math.random() * enemies.length)];
    }
}

// 获取精英敌人
export function getEliteEnemy(): string {
    return 'heavy_knight';
}

// 获取Boss
export function getBoss(): string {
    return 'gatekeeper';
}
