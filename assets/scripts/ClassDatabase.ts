/**
 * ClassDatabase.ts - 职业数据库
 * 包含所有职业的定义和初始数据
 */

import { IClassData } from './GameState';

// 职业数据库
export const ClassDatabase: Record<string, IClassData> = {
    'warrior': {
        id: 'warrior',
        name: '战士',
        maxHp: 80,
        startingDeck: [
            'strike', 'strike', 'strike', 'strike', 'strike',
            'defend', 'defend', 'defend', 'defend',
            'bash'
        ],
        relic: {
            name: '塔盾',
            description: '每回合开始时获得4点格挡',
            effect: 'start_turn_block',
            value: 4
        }
    },
    'assassin': {
        id: 'assassin',
        name: '刺客',
        maxHp: 65,
        startingDeck: [
            'strike', 'strike', 'strike', 'strike',
            'defend', 'defend', 'defend',
            'draw', 'draw'
        ],
        relic: {
            name: '暗影匕首',
            description: '每回合第一张攻击卡伤害+3',
            effect: 'first_attack_bonus',
            value: 3
        }
    },
    'mage': {
        id: 'mage',
        name: '法师',
        maxHp: 60,
        startingDeck: [
            'strike', 'strike', 'strike',
            'defend', 'defend',
            'draw', 'draw', 'draw',
            'prepare'
        ],
        relic: {
            name: '元素法典',
            description: '每回合开始抽1张牌',
            effect: 'start_turn_draw',
            value: 1
        }
    }
};

// 职业解锁条件
export const ClassUnlockConditions: Record<string, { required: string; times: number }> = {
    'assassin': { required: 'warrior', times: 1 },
    'mage': { required: 'warrior', times: 1 }
};

// 检查职业是否解锁
export function isClassUnlocked(classId: string, completedRuns: Record<string, number>): boolean {
    if (classId === 'warrior') return true;
    
    const condition = ClassUnlockConditions[classId];
    if (!condition) return false;
    
    return (completedRuns[condition.required] || 0) >= condition.times;
}
