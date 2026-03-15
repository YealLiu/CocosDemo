/**
 * CardDatabase.ts - 卡牌数据库
 * 包含所有卡牌的定义和效果
 */

import { CardType, CardRarity, ICardData, GameState, Player } from './GameState';

// 卡牌效果函数类型
type CardEffect = (gameState: GameState, target?: any) => void;

// 卡牌数据库
export const CardDatabase: Record<string, ICardData> = {
    // ========== 攻击卡 ==========
    'strike': {
        id: 'strike',
        name: '打击',
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: '造成6点伤害'
    },
    'heavy_strike': {
        id: 'heavy_strike',
        name: '重击',
        cost: 2,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: '造成14点伤害'
    },
    'double_strike': {
        id: 'double_strike',
        name: '双重打击',
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: '造成2次4点伤害'
    },
    'bash': {
        id: 'bash',
        name: '盾击',
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.RARE,
        description: '造成6点伤害，获得6点格挡'
    },
    'armor_break': {
        id: 'armor_break',
        name: '破甲斩',
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: '造成6点伤害，无视敌人格挡'
    },
    'whirlwind': {
        id: 'whirlwind',
        name: '旋风斩',
        cost: 2,
        type: CardType.ATTACK,
        rarity: CardRarity.RARE,
        description: '对所有敌人造成6点伤害'
    },
    'charge_attack': {
        id: 'charge_attack',
        name: '蓄力一击',
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.RARE,
        description: '造成4点伤害，下回合+3力量'
    },
    'blood_rage': {
        id: 'blood_rage',
        name: '血怒',
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.EPIC,
        description: '失去3HP，造成15点伤害'
    },
    'unyielding_will': {
        id: 'unyielding_will',
        name: '不屈意志',
        cost: 2,
        type: CardType.ATTACK,
        rarity: CardRarity.EPIC,
        description: '造成8点伤害，若HP<50%则再造成8点'
    },

    // ========== 技能卡 ==========
    'defend': {
        id: 'defend',
        name: '防御',
        cost: 1,
        type: CardType.SKILL,
        rarity: CardRarity.COMMON,
        description: '获得5点格挡'
    },
    'iron_wave': {
        id: 'iron_wave',
        name: '铁壁',
        cost: 1,
        type: CardType.SKILL,
        rarity: CardRarity.RARE,
        description: '获得12点格挡'
    },
    'emergency_defend': {
        id: 'emergency_defend',
        name: '紧急防御',
        cost: 0,
        type: CardType.SKILL,
        rarity: CardRarity.COMMON,
        description: '获得3点格挡，抽1张牌'
    },
    'rally': {
        id: 'rally',
        name: '重整旗鼓',
        cost: 2,
        type: CardType.SKILL,
        rarity: CardRarity.RARE,
        description: '获得8点格挡，移除所有负面状态'
    },
    'battle_spirit': {
        id: 'battle_spirit',
        name: '战意高昂',
        cost: 1,
        type: CardType.SKILL,
        rarity: CardRarity.RARE,
        description: '获得5点格挡，下回合+1能量'
    },
    'steel_will': {
        id: 'steel_will',
        name: '钢铁意志',
        cost: 2,
        type: CardType.SKILL,
        rarity: CardRarity.EPIC,
        description: '获得12点格挡，格挡保留到下一回合'
    },
    'draw': {
        id: 'draw',
        name: '抽牌',
        cost: 1,
        type: CardType.SKILL,
        rarity: CardRarity.COMMON,
        description: '抽2张牌'
    },
    'prepare': {
        id: 'prepare',
        name: '准备',
        cost: 0,
        type: CardType.SKILL,
        rarity: CardRarity.RARE,
        description: '抽1张牌，下张牌费用-1'
    },

    // ========== 能力卡 ==========
    'barricade': {
        id: 'barricade',
        name: '壁垒',
        cost: 2,
        type: CardType.POWER,
        rarity: CardRarity.RARE,
        description: '每回合开始时获得2点格挡'
    },
    'toughness': {
        id: 'toughness',
        name: '坚韧',
        cost: 1,
        type: CardType.POWER,
        rarity: CardRarity.COMMON,
        description: '每回合开始时获得2点格挡'
    },
    'berserker_blood': {
        id: 'berserker_blood',
        name: '狂战士之血',
        cost: 2,
        type: CardType.POWER,
        rarity: CardRarity.RARE,
        description: 'HP每降低10%，伤害+1'
    },
    'unyielding_soul': {
        id: 'unyielding_soul',
        name: '不屈之魂',
        cost: 3,
        type: CardType.POWER,
        rarity: CardRarity.LEGENDARY,
        description: 'HP降至0时恢复10HP（每场战斗1次）'
    },
    'counter_stance': {
        id: 'counter_stance',
        name: '反击姿态',
        cost: 1,
        type: CardType.POWER,
        rarity: CardRarity.RARE,
        description: '受到攻击时反击5点伤害'
    }
};

// 卡牌效果实现
export class CardEffects {
    // 造成伤害
    static dealDamage(gameState: GameState, target: any, amount: number): void {
        let damage = amount;
        
        // 应用狂战士之血效果
        if (gameState.player && gameState.player.powers) {
            gameState.player.powers.forEach(power => {
                if (power.effect === 'berserker_damage') {
                    const hpPercent = 1 - (gameState.player!.hp / gameState.player!.maxHp);
                    const bonus = Math.floor(hpPercent * 10) * power.value;
                    damage += bonus;
                }
            });
        }

        // 先扣减格挡
        let remaining = damage;
        if (target.block > 0) {
            if (target.block >= remaining) {
                target.block -= remaining;
                remaining = 0;
            } else {
                remaining -= target.block;
                target.block = 0;
            }
        }

        // 扣减生命
        if (remaining > 0) {
            target.hp -= remaining;
            
            // 触发反击
            if (target.powers) {
                target.powers.forEach((power: any) => {
                    if (power.effect === 'counter' && gameState.player) {
                        gameState.player.hp -= power.value;
                    }
                });
            }
        }
    }

    // 无视格挡的伤害
    static dealDamageIgnoreBlock(gameState: GameState, target: any, amount: number): void {
        let damage = amount;
        
        if (gameState.player && gameState.player.powers) {
            gameState.player.powers.forEach(power => {
                if (power.effect === 'berserker_damage') {
                    const hpPercent = 1 - (gameState.player!.hp / gameState.player!.maxHp);
                    const bonus = Math.floor(hpPercent * 10) * power.value;
                    damage += bonus;
                }
            });
        }
        
        target.hp -= damage;
    }

    // 获得格挡
    static gainBlock(gameState: GameState, amount: number): void {
        gameState.battle.block += amount;
    }

    // 抽牌
    static drawCards(gameState: GameState, count: number): void {
        gameState.drawCards(count);
    }

    // 添加临时力量
    static addPower(gameState: GameState, powerType: string, value: number, duration: number): void {
        gameState.player?.powers.push({
            name: powerType === 'strength' ? '力量' : powerType,
            effect: powerType,
            value: value,
            duration: duration
        });
    }

    // 添加下回合能量
    static addNextTurnEnergy(gameState: GameState, amount: number): void {
        gameState.battle.maxEnergy += amount;
    }

    // 移除所有负面状态
    static removeAllDebuffs(): void {
        // 简化版实现
    }

    // 执行卡牌效果
    static executeCardEffect(cardId: string, gameState: GameState, target?: any): void {
        switch (cardId) {
            // 攻击卡
            case 'strike':
                this.dealDamage(gameState, target, 6);
                break;
            case 'heavy_strike':
                this.dealDamage(gameState, target, 14);
                break;
            case 'double_strike':
                this.dealDamage(gameState, target, 4);
                this.dealDamage(gameState, target, 4);
                break;
            case 'bash':
                this.dealDamage(gameState, target, 6);
                this.gainBlock(gameState, 6);
                break;
            case 'armor_break':
                this.dealDamageIgnoreBlock(gameState, target, 6);
                break;
            case 'whirlwind':
                this.dealDamage(gameState, target, 6);
                break;
            case 'charge_attack':
                this.dealDamage(gameState, target, 4);
                this.addPower(gameState, 'strength', 3, 1);
                break;
            case 'blood_rage':
                if (gameState.player) {
                    gameState.player.hp = Math.max(1, gameState.player.hp - 3);
                }
                this.dealDamage(gameState, target, 15);
                break;
            case 'unyielding_will':
                this.dealDamage(gameState, target, 8);
                if (gameState.player && gameState.player.hp < gameState.player.maxHp * 0.5) {
                    this.dealDamage(gameState, target, 8);
                }
                break;

            // 技能卡
            case 'defend':
                this.gainBlock(gameState, 5);
                break;
            case 'iron_wave':
                this.gainBlock(gameState, 12);
                break;
            case 'emergency_defend':
                this.gainBlock(gameState, 3);
                this.drawCards(gameState, 1);
                break;
            case 'rally':
                this.gainBlock(gameState, 8);
                this.removeAllDebuffs();
                break;
            case 'battle_spirit':
                this.gainBlock(gameState, 5);
                this.addNextTurnEnergy(gameState, 1);
                break;
            case 'steel_will':
                this.gainBlock(gameState, 12);
                gameState.player?.powers.push({
                    name: '格挡保留',
                    effect: 'keep_block',
                    value: 1
                });
                break;
            case 'draw':
                this.drawCards(gameState, 2);
                break;
            case 'prepare':
                this.drawCards(gameState, 1);
                break;

            // 能力卡
            case 'barricade':
            case 'toughness':
                gameState.player?.powers.push({
                    name: '坚韧',
                    effect: 'start_turn_block',
                    value: 2
                });
                break;
            case 'berserker_blood':
                gameState.player?.powers.push({
                    name: '狂战士之血',
                    effect: 'berserker_damage',
                    value: 1
                });
                break;
            case 'unyielding_soul':
                gameState.player?.powers.push({
                    name: '不屈之魂',
                    effect: 'death_defy',
                    value: 10,
                    used: false
                });
                break;
            case 'counter_stance':
                gameState.player?.powers.push({
                    name: '反击',
                    effect: 'counter',
                    value: 5
                });
                break;
        }
    }
}

// 获取卡牌颜色 (用于UI显示)
export function getCardTypeColor(type: CardType): string {
    switch (type) {
        case CardType.ATTACK:
            return '#ff4444';
        case CardType.SKILL:
            return '#44aaff';
        case CardType.POWER:
            return '#44ff44';
        default:
            return '#ffffff';
    }
}
