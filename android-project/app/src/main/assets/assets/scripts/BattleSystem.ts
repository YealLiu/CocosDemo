/**
 * BattleSystem.ts - 战斗系统
 * 处理战斗逻辑、回合管理、胜负判定
 */

import { _decorator, Component, Node, EventTarget } from 'cc';
import { GameState, Player, IBattleState } from './GameState';
import { CardDatabase, CardEffects } from './CardDatabase';
import { Enemy } from './EnemyDatabase';

const { ccclass, property } = _decorator;

// 战斗事件
export enum BattleEvent {
    TURN_START = 'turn_start',
    TURN_END = 'turn_end',
    CARD_PLAYED = 'card_played',
    DAMAGE_DEALT = 'damage_dealt',
    BLOCK_GAINED = 'block_gained',
    ENEMY_TURN = 'enemy_turn',
    BATTLE_WON = 'battle_won',
    BATTLE_LOST = 'battle_lost',
    LOG_MESSAGE = 'log_message'
}

// 战斗结果
export interface BattleResult {
    won: boolean;
    rating: string;
    desc: string;
    goldReward: number;
}

@ccclass('BattleSystem')
export class BattleSystem extends Component {
    public static instance: BattleSystem | null = null;
    
    // 事件发射器
    public eventTarget: EventTarget = new EventTarget();
    
    // 当前敌人实例
    public enemy: Enemy | null = null;
    
    // 战斗是否进行中
    public isBattleActive: boolean = false;

    onLoad() {
        if (BattleSystem.instance === null) {
            BattleSystem.instance = this;
        }
    }

    onDestroy() {
        if (BattleSystem.instance === this) {
            BattleSystem.instance = null;
        }
    }

    /**
     * 开始战斗
     */
    public startBattle(enemyId: string): void {
        const gameState = GameState.instance;
        
        // 创建敌人
        this.enemy = new Enemy(enemyId);
        gameState.currentEnemy = this.enemy;
        
        // 重置战斗状态
        gameState.resetBattle();
        
        // 初始抽牌
        gameState.drawCards(5);
        
        // 应用起始遗物效果
        this.applyRelicEffects('battle_start');
        
        this.isBattleActive = true;
        
        // 应用回合开始效果
        this.applyStartTurnEffects();
        
        this.log(`遭遇了 ${this.enemy.name}！`);
        this.eventTarget.emit(BattleEvent.TURN_START);
    }

    /**
     * 打出卡牌
     */
    public playCard(cardIndex: number): boolean {
        const gameState = GameState.instance;
        
        if (!this.isBattleActive || !this.enemy) return false;
        
        const cardId = gameState.battle.hand[cardIndex];
        if (!cardId) return false;
        
        const card = CardDatabase[cardId];
        if (!card) return false;
        
        // 检查能量
        if (gameState.battle.energy < card.cost) {
            this.log('能量不足！');
            return false;
        }
        
        // 消耗能量
        gameState.battle.energy -= card.cost;
        
        // 执行效果
        CardEffects.executeCardEffect(cardId, gameState, this.enemy);
        
        // 从手牌移除
        gameState.battle.hand.splice(cardIndex, 1);
        gameState.battle.discardPile.push(cardId);
        
        this.log(`使用了 ${card.name}`);
        this.eventTarget.emit(BattleEvent.CARD_PLAYED, card);
        
        // 检查敌人死亡
        if (this.enemy.hp <= 0) {
            this.winBattle();
            return true;
        }
        
        this.eventTarget.emit(BattleEvent.TURN_END);
        return true;
    }

    /**
     * 结束回合
     */
    public endTurn(): void {
        if (!this.isBattleActive || !this.enemy) return;
        
        const gameState = GameState.instance;
        
        // 敌人回合
        this.enemyTurn();
        
        // 检查玩家死亡
        if (gameState.player && gameState.player.hp <= 0) {
            // 检查不屈之魂
            let hasDeathDefy = false;
            gameState.player.powers.forEach(power => {
                if (power.effect === 'death_defy' && !power.used) {
                    gameState.player!.hp = power.value;
                    power.used = true;
                    hasDeathDefy = true;
                    this.log('💫 不屈之魂触发！从死亡边缘复活！');
                }
            });
            
            if (!hasDeathDefy) {
                this.loseBattle();
                return;
            }
        }
        
        // 新回合
        gameState.battle.turn++;
        gameState.battle.energy = gameState.battle.maxEnergy;
        
        // 格挡处理
        let keepBlock = false;
        gameState.player?.powers.forEach(power => {
            if (power.effect === 'keep_block') {
                keepBlock = true;
            }
        });
        
        if (!keepBlock) {
            gameState.battle.block = Math.floor(gameState.battle.block * 0.5);
        } else {
            this.log('格挡保留到下一回合！');
        }
        
        // 弃掉手牌
        gameState.battle.discardPile.push(...gameState.battle.hand);
        gameState.battle.hand = [];
        
        // 抽牌
        gameState.drawCards(5);
        
        // 应用回合开始效果
        this.applyStartTurnEffects();
        
        this.log(`--- 第 ${gameState.battle.turn} 回合 ---`);
        this.eventTarget.emit(BattleEvent.TURN_START);
    }

    /**
     * 敌人回合
     */
    private enemyTurn(): void {
        if (!this.enemy) return;
        
        const gameState = GameState.instance;
        const intent = this.enemy.getNextIntent();
        
        this.log(`${this.enemy.name} 使用了 ${intent.icon} ${intent.desc || intent.type}`);
        this.eventTarget.emit(BattleEvent.ENEMY_TURN, intent);
        
        // 检查狂暴状态
        let damageMultiplier = 1;
        if (this.enemy.isEnraged()) {
            damageMultiplier = 2;
            this.log(`${this.enemy.name} 进入狂暴状态！伤害翻倍！`);
        }
        
        switch (intent.type) {
            case 'attack':
                let damage = intent.value * damageMultiplier;
                
                // 破甲攻击无视格挡
                if (intent.desc === '破甲' && gameState.player) {
                    gameState.player.hp -= damage;
                    this.log('破甲攻击无视了你的格挡！');
                } else {
                    // 先扣减玩家格挡
                    if (gameState.battle.block > 0) {
                        if (gameState.battle.block >= damage) {
                            gameState.battle.block -= damage;
                            damage = 0;
                        } else {
                            damage -= gameState.battle.block;
                            gameState.battle.block = 0;
                        }
                    }
                    if (gameState.player) {
                        gameState.player.hp -= damage;
                    }
                }
                
                // 触发反击
                gameState.player?.powers.forEach(power => {
                    if (power.effect === 'counter') {
                        this.enemy!.hp -= power.value;
                        this.log(`反击 ${power.value} 点伤害！`);
                    }
                });
                break;
                
            case 'defend':
                this.enemy.block += intent.value;
                break;
                
            case 'buff':
                this.log(`${this.enemy.name} 获得了强化！`);
                break;
                
            case 'debuff':
                this.log(`${this.enemy.name} 施加了虚弱！`);
                break;
                
            case 'special':
                if (intent.desc === '反击姿态') {
                    this.enemy.powers.push({
                        name: '反击',
                        effect: 'counter',
                        value: 8
                    });
                    this.log(`${this.enemy.name} 进入反击姿态！`);
                } else {
                    this.log(`${this.enemy.name} 正在蓄力...`);
                }
                break;
        }
        
        // 检查敌人死亡（反击导致）
        if (this.enemy.hp <= 0) {
            this.winBattle();
        }
    }

    /**
     * 应用回合开始效果
     */
    private applyStartTurnEffects(): void {
        const gameState = GameState.instance;
        
        // 遗物效果
        gameState.player?.relics.forEach(relic => {
            if (relic.effect === 'start_turn_block') {
                gameState.battle.block += relic.value;
                this.log(`${relic.name} 提供了 ${relic.value} 点格挡`);
            }
        });
        
        // 能力效果
        gameState.player?.powers.forEach(power => {
            if (power.effect === 'start_turn_block') {
                gameState.battle.block += power.value;
            }
        });
    }

    /**
     * 应用遗物效果
     */
    private applyRelicEffects(trigger: string): void {
        // 简化版实现
    }

    /**
     * 战斗胜利
     */
    private winBattle(): void {
        if (!this.enemy) return;
        
        const gameState = GameState.instance;
        
        this.log(`击败了 ${this.enemy.name}！`);
        
        // 奖励
        const goldReward = this.enemy.isBoss ? 50 : (this.enemy.isElite ? 25 : 15);
        if (gameState.player) {
            gameState.player.gold += goldReward;
        }
        
        // 计算评价
        const result = this.calculateBattleRating();
        
        this.isBattleActive = false;
        
        this.eventTarget.emit(BattleEvent.BATTLE_WON, {
            ...result,
            goldReward
        });
    }

    /**
     * 战斗失败
     */
    private loseBattle(): void {
        this.isBattleActive = false;
        this.eventTarget.emit(BattleEvent.BATTLE_LOST);
    }

    /**
     * 计算战斗评价
     */
    private calculateBattleRating(): { rating: string; desc: string } {
        const gameState = GameState.instance;
        if (!gameState.player) return { rating: '胜利', desc: '成功击败敌人！' };
        
        const maxHp = gameState.player.maxHp;
        const currentHp = gameState.player.hp;
        const damageTaken = maxHp - currentHp;
        
        if (damageTaken === 0) return { rating: '完美胜利', desc: '无伤通关，太厉害了！' };
        if (damageTaken <= 10) return { rating: '精彩胜利', desc: '只受了轻伤，表现优秀！' };
        if (damageTaken <= 20) return { rating: '胜利', desc: '成功击败敌人！' };
        if (currentHp / maxHp > 0.3) return { rating: '险胜', desc: '好险，差点就输了！' };
        return { rating: '惨胜', desc: '勉强活下来...' };
    }

    /**
     * 添加战斗日志
     */
    private log(message: string): void {
        this.eventTarget.emit(BattleEvent.LOG_MESSAGE, message);
    }

    /**
     * 逃跑 (Demo版不允许)
     */
    public flee(): void {
        this.log('无法逃跑！');
    }
}
