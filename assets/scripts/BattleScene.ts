/**
 * BattleScene.ts - 战斗场景控制器
 */

import { _decorator, Component, Node, Button, Label, ProgressBar, instantiate, Prefab, Vec3, tween, UIOpacity } from 'cc';
import { GameManager } from './GameManager';
import { GameState, CardType } from './GameState';
import { BattleSystem, BattleEvent, BattleResult } from './BattleSystem';
import { CardDatabase, getCardTypeColor } from './CardDatabase';
import { Enemy } from './EnemyDatabase';
const { ccclass, property } = _decorator;

@ccclass('BattleScene')
export class BattleScene extends Component {
    // 卡牌预制体
    @property(Prefab)
    cardPrefab: Prefab | null = null;

    // UI引用 - 玩家
    @property(Label)
    playerHpLabel: Label | null = null;
    @property(ProgressBar)
    playerHpBar: ProgressBar | null = null;
    @property(Label)
    playerEnergyLabel: Label | null = null;
    @property(Label)
    playerBlockLabel: Label | null = null;

    // UI引用 - 敌人
    @property(Node)
    enemyNode: Node | null = null;
    @property(Label)
    enemyNameLabel: Label | null = null;
    @property(Label)
    enemyHpLabel: Label | null = null;
    @property(ProgressBar)
    enemyHpBar: ProgressBar | null = null;
    @property(Label)
    enemyBlockLabel: Label | null = null;
    @property(Label)
    enemyIntentLabel: Label | null = null;

    // UI引用 - 手牌区域
    @property(Node)
    handArea: Node | null = null;

    // UI引用 - 牌堆
    @property(Label)
    drawPileLabel: Label | null = null;
    @property(Label)
    discardPileLabel: Label | null = null;

    // UI引用 - 回合
    @property(Label)
    turnLabel: Label | null = null;

    // UI引用 - 战斗日志
    @property(Label)
    battleLogLabel: Label | null = null;

    // UI引用 - 按钮
    @property(Button)
    endTurnButton: Button | null = null;

    // UI引用 - 游戏结束面板
    @property(Node)
    gameOverPanel: Node | null = null;
    @property(Label)
    gameOverTitle: Label | null = null;
    @property(Label)
    gameOverDesc: Label | null = null;

    // 战斗系统
    private battleSystem: BattleSystem | null = null;

    // 卡牌节点列表
    private cardNodes: Node[] = [];

    onLoad() {
        // 获取战斗系统
        this.battleSystem = BattleSystem.instance;
        if (!this.battleSystem) {
            console.error('BattleSystem not found!');
            return;
        }

        // 绑定按钮事件
        this.endTurnButton?.node.on(Button.EventType.CLICK, this.onEndTurnClick, this);

        // 绑定战斗事件
        this.battleSystem.eventTarget.on(BattleEvent.TURN_START, this.onTurnStart, this);
        this.battleSystem.eventTarget.on(BattleEvent.CARD_PLAYED, this.onCardPlayed, this);
        this.battleSystem.eventTarget.on(BattleEvent.LOG_MESSAGE, this.onLogMessage, this);
        this.battleSystem.eventTarget.on(BattleEvent.BATTLE_WON, this.onBattleWon, this);
        this.battleSystem.eventTarget.on(BattleEvent.BATTLE_LOST, this.onBattleLost, this);

        // 开始战斗
        const gameState = GameState.instance;
        if (gameState.map.currentNode) {
            this.battleSystem.startBattle(gameState.map.currentNode);
        }
    }

    onDestroy() {
        this.endTurnButton?.node.off(Button.EventType.CLICK, this.onEndTurnClick, this);
        
        if (this.battleSystem) {
            this.battleSystem.eventTarget.off(BattleEvent.TURN_START, this.onTurnStart, this);
            this.battleSystem.eventTarget.off(BattleEvent.CARD_PLAYED, this.onCardPlayed, this);
            this.battleSystem.eventTarget.off(BattleEvent.LOG_MESSAGE, this.onLogMessage, this);
            this.battleSystem.eventTarget.off(BattleEvent.BATTLE_WON, this.onBattleWon, this);
            this.battleSystem.eventTarget.off(BattleEvent.BATTLE_LOST, this.onBattleLost, this);
        }
    }

    // ========== 事件处理 ==========

    private onTurnStart(): void {
        this.updateUI();
        this.updateHandCards();
    }

    private onCardPlayed(card: any): void {
        this.updateUI();
        this.updateHandCards();
    }

    private onLogMessage(message: string): void {
        if (this.battleLogLabel) {
            this.battleLogLabel.string = message;
        }
    }

    private onBattleWon(result: BattleResult): void {
        if (this.gameOverPanel) {
            this.gameOverPanel.active = true;
        }
        if (this.gameOverTitle) {
            this.gameOverTitle.string = result.rating;
        }
        if (this.gameOverDesc) {
            this.gameOverDesc.string = `${result.desc}\n获得 ${result.goldReward} 金币`;
        }
    }

    private onBattleLost(): void {
        if (this.gameOverPanel) {
            this.gameOverPanel.active = true;
        }
        if (this.gameOverTitle) {
            this.gameOverTitle.string = '失败...';
        }
        if (this.gameOverDesc) {
            this.gameOverDesc.string = '你的旅程到此结束...';
        }
    }

    private onEndTurnClick(): void {
        this.battleSystem?.endTurn();
    }

    // ========== UI更新 ==========

    private updateUI(): void {
        const gameState = GameState.instance;
        const battle = gameState.battle;
        const player = gameState.player;
        const enemy = this.battleSystem?.enemy;

        // 更新玩家状态
        if (player) {
            if (this.playerHpLabel) {
                this.playerHpLabel.string = `${player.hp}/${player.maxHp}`;
            }
            if (this.playerHpBar) {
                this.playerHpBar.progress = player.hp / player.maxHp;
            }
        }

        if (this.playerEnergyLabel) {
            this.playerEnergyLabel.string = `${battle.energy}/${battle.maxEnergy}`;
        }

        if (this.playerBlockLabel) {
            this.playerBlockLabel.string = battle.block > 0 ? battle.block.toString() : '';
            this.playerBlockLabel.node.parent!.active = battle.block > 0;
        }

        // 更新敌人状态
        if (enemy) {
            if (this.enemyNameLabel) {
                this.enemyNameLabel.string = enemy.name;
            }
            if (this.enemyHpLabel) {
                this.enemyHpLabel.string = `${enemy.hp}/${enemy.maxHp}`;
            }
            if (this.enemyHpBar) {
                this.enemyHpBar.progress = enemy.hp / enemy.maxHp;
            }
            if (this.enemyBlockLabel) {
                this.enemyBlockLabel.string = enemy.block > 0 ? enemy.block.toString() : '';
                this.enemyBlockLabel.node.parent!.active = enemy.block > 0;
            }

            // 更新敌人意图
            const intent = enemy.getCurrentIntent();
            if (this.enemyIntentLabel) {
                this.enemyIntentLabel.string = `${intent.icon} ${intent.desc || intent.type} ${intent.value > 0 ? intent.value : ''}`;
            }
        }

        // 更新牌堆
        if (this.drawPileLabel) {
            this.drawPileLabel.string = battle.drawPile.length.toString();
        }
        if (this.discardPileLabel) {
            this.discardPileLabel.string = battle.discardPile.length.toString();
        }

        // 更新回合
        if (this.turnLabel) {
            this.turnLabel.string = battle.turn.toString();
        }
    }

    private updateHandCards(): void {
        const gameState = GameState.instance;
        const hand = gameState.battle.hand;

        // 清除现有卡牌
        this.cardNodes.forEach(node => node.destroy());
        this.cardNodes = [];

        // 创建新手牌
        if (!this.handArea || !this.cardPrefab) return;

        hand.forEach((cardId, index) => {
            const cardData = CardDatabase[cardId];
            if (!cardData) return;

            const cardNode = instantiate(this.cardPrefab);
            cardNode.parent = this.handArea;
            
            // 设置卡牌数据
            const nameLabel = cardNode.getChildByName('Name')?.getComponent(Label);
            const costLabel = cardNode.getChildByName('Cost')?.getComponent(Label);
            const descLabel = cardNode.getChildByName('Desc')?.getComponent(Label);
            const typeSprite = cardNode.getChildByName('Type')?.getComponent(Sprite);

            if (nameLabel) nameLabel.string = cardData.name;
            if (costLabel) costLabel.string = cardData.cost.toString();
            if (descLabel) descLabel.string = cardData.description;

            // 绑定点击事件
            cardNode.on(Node.EventType.TOUCH_END, () => this.onCardClick(index));

            this.cardNodes.push(cardNode);
        });
    }

    private onCardClick(index: number): void {
        // 播放卡牌动画
        const cardNode = this.cardNodes[index];
        if (cardNode) {
            tween(cardNode)
                .to(0.1, { scale: new Vec3(1.1, 1.1, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .start();
        }

        // 执行出牌
        const success = this.battleSystem?.playCard(index);
        if (!success) {
            // 出牌失败动画
            if (cardNode) {
                tween(cardNode)
                    .by(0.05, { position: new Vec3(10, 0, 0) })
                    .by(0.05, { position: new Vec3(-20, 0, 0) })
                    .by(0.05, { position: new Vec3(20, 0, 0) })
                    .by(0.05, { position: new Vec3(-10, 0, 0) })
                    .start();
            }
        }
    }

    // 继续按钮（战斗胜利后）
    public onContinueClick(): void {
        GameManager.instance?.returnToMap();
    }

    // 返回主菜单（战斗失败后）
    public onReturnMenuClick(): void {
        GameManager.instance?.gameOver();
    }
}
