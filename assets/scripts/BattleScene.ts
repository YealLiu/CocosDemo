/**
 * BattleScene.ts - 战斗场景控制器
 * 动态创建UI版本 - 完整版（含手牌显示）
 */

import { _decorator, Component, Node, Button, Label, Sprite, ProgressBar, tween, Vec3, Color, UITransform, instantiate, Prefab, resources } from 'cc';
import { GameManager } from './GameManager';
import { GameState } from './GameState';
import { BattleSystem, BattleEvent } from './BattleSystem';
import { CardDatabase } from './CardDatabase';
const { ccclass, property } = _decorator;

@ccclass('BattleScene')
export class BattleScene extends Component {
    // UI元素引用
    private playerHpLabel: Label | null = null;
    private playerHpBar: ProgressBar | null = null;
    private playerEnergyLabel: Label | null = null;
    private playerBlockLabel: Label | null = null;
    private enemyNameLabel: Label | null = null;
    private enemyHpLabel: Label | null = null;
    private enemyHpBar: ProgressBar | null = null;
    private enemyIntentLabel: Label | null = null;
    private enemyBlockLabel: Label | null = null;
    private endTurnButton: Button | null = null;
    private battleLogLabel: Label | null = null;
    
    // 手牌区域
    private handArea: Node | null = null;
    private cardNodes: Node[] = [];
    private selectedCardIndex: number = -1;

    // 战斗系统
    private battleSystem: BattleSystem | null = null;

    onLoad() {
        console.log('[BattleScene] 动态创建UI元素');
        this.createUI();
        this.initBattle();
    }

    onEnable() {
        this.bindEvents();
    }

    onDisable() {
        this.unbindEvents();
    }

    /**
     * 动态创建所有UI元素
     */
    private createUI(): void {
        const canvas = this.node;

        // 1. 创建玩家状态区
        this.createPlayerStatus(canvas);

        // 2. 创建敌人区域
        this.createEnemyArea(canvas);

        // 3. 创建手牌区域
        this.createHandArea(canvas);

        // 4. 创建结束回合按钮
        this.createEndTurnButton(canvas);

        // 5. 创建战斗日志
        this.createBattleLog(canvas);

        // 6. 创建返回按钮
        this.createBackButton(canvas);
    }

    /**
     * 创建玩家状态区
     */
    private createPlayerStatus(parent: Node): void {
        const statusNode = new Node('PlayerStatus');
        parent.addChild(statusNode);
        statusNode.setPosition(-180, -420, 0);

        const uiTransform = statusNode.addComponent(UITransform);
        uiTransform.setContentSize(320, 160);

        // 背景
        const sprite = statusNode.addComponent(Sprite);
        sprite.color = new Color(40, 40, 60, 220);

        // HP条
        this.playerHpBar = this.createProgressBar(statusNode, 'HPBar', 0, 50, new Color(200, 50, 50, 255));
        this.playerHpLabel = this.createLabel(statusNode, 'HPLabel', '❤️ 80/80', 0, 50, 24, new Color(255, 100, 100, 255));

        // 能量
        this.playerEnergyLabel = this.createLabel(statusNode, 'EnergyLabel', '⚡ 3/3', -100, 0, 28, new Color(100, 200, 255, 255));

        // 格挡
        this.playerBlockLabel = this.createLabel(statusNode, 'BlockLabel', '🛡️ 0', 0, 0, 28, new Color(150, 150, 150, 255));

        // 金币
        this.createLabel(statusNode, 'GoldLabel', '💰', 100, 0, 28, new Color(255, 215, 0, 255));

        console.log('[BattleScene] 玩家状态区创建完成');
    }

    /**
     * 创建敌人区域
     */
    private createEnemyArea(parent: Node): void {
        const enemyNode = new Node('EnemyArea');
        parent.addChild(enemyNode);
        enemyNode.setPosition(0, 150, 0);

        const uiTransform = enemyNode.addComponent(UITransform);
        uiTransform.setContentSize(350, 250);

        // 背景
        const sprite = enemyNode.addComponent(Sprite);
        sprite.color = new Color(60, 40, 40, 220);

        // 敌人名称
        this.enemyNameLabel = this.createLabel(enemyNode, 'EnemyName', '👹 黑暗奴仆', 0, 80, 32, new Color(255, 150, 150, 255));

        // HP条
        this.enemyHpBar = this.createProgressBar(enemyNode, 'EnemyHPBar', 0, 30, new Color(200, 50, 50, 255));
        this.enemyHpLabel = this.createLabel(enemyNode, 'EnemyHPLabel', '40/40', 0, 30, 22, new Color(255, 255, 255, 255));

        // 敌人格挡
        this.enemyBlockLabel = this.createLabel(enemyNode, 'EnemyBlock', '', 80, 30, 24, new Color(150, 150, 150, 255));

        // 意图
        this.enemyIntentLabel = this.createLabel(enemyNode, 'EnemyIntent', '🔴 攻击 10', 0, -30, 26, new Color(255, 200, 100, 255));

        console.log('[BattleScene] 敌人区域创建完成');
    }

    /**
     * 创建手牌区域
     */
    private createHandArea(parent: Node): void {
        this.handArea = new Node('HandArea');
        parent.addChild(this.handArea);
        this.handArea.setPosition(0, -250, 0);

        const uiTransform = this.handArea.addComponent(UITransform);
        uiTransform.setContentSize(700, 200);

        // 背景（半透明）
        const sprite = this.handArea.addComponent(Sprite);
        sprite.color = new Color(30, 30, 40, 150);

        console.log('[BattleScene] 手牌区域创建完成');
    }

    /**
     * 创建结束回合按钮
     */
    private createEndTurnButton(parent: Node): void {
        const buttonNode = new Node('EndTurnButton');
        parent.addChild(buttonNode);
        buttonNode.setPosition(250, -420, 0);

        const uiTransform = buttonNode.addComponent(UITransform);
        uiTransform.setContentSize(160, 70);

        const sprite = buttonNode.addComponent(Sprite);
        sprite.color = new Color(80, 120, 80, 255);

        this.endTurnButton = buttonNode.addComponent(Button);

        const labelNode = new Node('Label');
        buttonNode.addChild(labelNode);
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(160, 70);
        const label = labelNode.addComponent(Label);
        label.string = '结束回合';
        label.fontSize = 26;
        label.horizontalAlign = 1;
        label.verticalAlign = 1;
        label.color = new Color(255, 255, 255, 255);

        // 点击事件
        this.endTurnButton.node.on(Button.EventType.CLICK, this.onEndTurnClick, this);

        // 悬停效果
        this.addHoverEffect(buttonNode);

        console.log('[BattleScene] 结束回合按钮创建完成');
    }

    /**
     * 创建战斗日志
     */
    private createBattleLog(parent: Node): void {
        const logNode = new Node('BattleLog');
        parent.addChild(logNode);
        logNode.setPosition(250, 280, 0);

        const uiTransform = logNode.addComponent(UITransform);
        uiTransform.setContentSize(220, 350);

        // 背景
        const sprite = logNode.addComponent(Sprite);
        sprite.color = new Color(30, 30, 30, 200);

        // 标题
        this.createLabel(logNode, 'LogTitle', '📜 战斗记录', 0, 150, 22, new Color(255, 215, 100, 255));

        // 日志内容
        this.battleLogLabel = this.createLabel(logNode, 'LogLabel', '战斗开始！', 0, 0, 18, new Color(200, 200, 200, 255));
        this.battleLogLabel.overflow = 3; // RESIZE_HEIGHT
        this.battleLogLabel.verticalAlign = 0; // TOP

        console.log('[BattleScene] 战斗日志创建完成');
    }

    /**
     * 创建返回按钮
     */
    private createBackButton(parent: Node): void {
        const buttonNode = new Node('BackButton');
        parent.addChild(buttonNode);
        buttonNode.setPosition(-280, 550, 0);

        const uiTransform = buttonNode.addComponent(UITransform);
        uiTransform.setContentSize(100, 50);

        const sprite = buttonNode.addComponent(Sprite);
        sprite.color = new Color(100, 100, 100, 255);

        const button = buttonNode.addComponent(Button);

        const labelNode = new Node('Label');
        buttonNode.addChild(labelNode);
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(100, 50);
        const label = labelNode.addComponent(Label);
        label.string = '返回';
        label.fontSize = 24;
        label.horizontalAlign = 1;
        label.verticalAlign = 1;
        label.color = new Color(255, 255, 255, 255);

        button.node.on(Button.EventType.CLICK, () => {
            GameManager.instance?.returnToMap();
        }, this);

        this.addHoverEffect(buttonNode);
    }

    /**
     * 创建进度条
     */
    private createProgressBar(parent: Node, name: string, x: number, y: number, color: Color): ProgressBar {
        const barNode = new Node(name);
        parent.addChild(barNode);
        barNode.setPosition(x, y, 0);

        const uiTransform = barNode.addComponent(UITransform);
        uiTransform.setContentSize(200, 20);

        const bar = barNode.addComponent(ProgressBar);
        bar.progress = 1;

        // 背景
        const bgSprite = barNode.addComponent(Sprite);
        bgSprite.color = new Color(50, 50, 50, 255);

        // 进度条填充
        const fillNode = new Node('Fill');
        barNode.addChild(fillNode);
        const fillTransform = fillNode.addComponent(UITransform);
        fillTransform.setContentSize(200, 20);
        const fillSprite = fillNode.addComponent(Sprite);
        fillSprite.color = color;
        bar.totalLength = 200;

        return bar;
    }

    /**
     * 创建标签
     */
    private createLabel(parent: Node, name: string, text: string, x: number, y: number, fontSize: number, color: Color): Label {
        const labelNode = new Node(name);
        parent.addChild(labelNode);
        labelNode.setPosition(x, y, 0);

        const uiTransform = labelNode.addComponent(UITransform);
        uiTransform.setContentSize(200, 40);

        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.horizontalAlign = 1;
        label.verticalAlign = 1;
        label.color = color;

        return label;
    }

    /**
     * 添加悬停效果
     */
    private addHoverEffect(node: Node): void {
        node.on(Node.EventType.MOUSE_ENTER, () => {
            tween(node).to(0.1, { scale: new Vec3(1.05, 1.05, 1) }).start();
        }, this);
        node.on(Node.EventType.MOUSE_LEAVE, () => {
            tween(node).to(0.1, { scale: new Vec3(1, 1, 1) }).start();
        }, this);
    }

    /**
     * 绑定事件
     */
    private bindEvents(): void {
        this.battleSystem = BattleSystem.instance;
        if (this.battleSystem) {
            this.battleSystem.eventTarget.on(BattleEvent.TURN_START, this.onTurnStart, this);
            this.battleSystem.eventTarget.on(BattleEvent.CARD_PLAYED, this.onCardPlayed, this);
            this.battleSystem.eventTarget.on(BattleEvent.DAMAGE_DEALT, this.onDamageDealt, this);
            this.battleSystem.eventTarget.on(BattleEvent.BATTLE_WON, this.onBattleWon, this);
            this.battleSystem.eventTarget.on(BattleEvent.BATTLE_LOST, this.onBattleLost, this);
            this.battleSystem.eventTarget.on(BattleEvent.LOG_MESSAGE, this.onLogMessage, this);
        }
    }

    /**
     * 解绑事件
     */
    private unbindEvents(): void {
        if (this.battleSystem) {
            this.battleSystem.eventTarget.off(BattleEvent.TURN_START, this.onTurnStart, this);
            this.battleSystem.eventTarget.off(BattleEvent.CARD_PLAYED, this.onCardPlayed, this);
            this.battleSystem.eventTarget.off(BattleEvent.DAMAGE_DEALT, this.onDamageDealt, this);
            this.battleSystem.eventTarget.off(BattleEvent.BATTLE_WON, this.onBattleWon, this);
            this.battleSystem.eventTarget.off(BattleEvent.BATTLE_LOST, this.onBattleLost, this);
            this.battleSystem.eventTarget.off(BattleEvent.LOG_MESSAGE, this.onLogMessage, this);
        }
    }

    /**
     * 初始化战斗
     */
    private initBattle(): void {
        console.log('[BattleScene] 初始化战斗');
        const gameState = GameState.instance;
        
        if (gameState.currentEnemy && this.battleSystem) {
            this.battleSystem.startBattle(gameState.currentEnemy.id);
        }
        
        this.updateUI();
        this.updateHandCards();
    }

    /**
     * 更新手牌显示
     */
    private updateHandCards(): void {
        // 清除旧的手牌
        this.cardNodes.forEach(node => node.destroy());
        this.cardNodes = [];

        const gameState = GameState.instance;
        const hand = gameState.battle.hand;

        if (!this.handArea) return;

        // 计算卡牌位置
        const cardWidth = 100;
        const cardHeight = 140;
        const spacing = 20;
        const totalWidth = hand.length * cardWidth + (hand.length - 1) * spacing;
        const startX = -totalWidth / 2 + cardWidth / 2;

        hand.forEach((cardId, index) => {
            const cardNode = this.createCardNode(cardId, index);
            cardNode.setPosition(startX + index * (cardWidth + spacing), 0, 0);
            this.handArea!.addChild(cardNode);
            this.cardNodes.push(cardNode);
        });
    }

    /**
     * 创建卡牌节点
     */
    private createCardNode(cardId: string, index: number): Node {
        const cardData = CardDatabase[cardId];
        if (!cardData) return new Node();

        const cardNode = new Node(`Card_${index}`);
        
        const uiTransform = cardNode.addComponent(UITransform);
        uiTransform.setContentSize(100, 140);

        // 卡牌背景
        const bgSprite = cardNode.addComponent(Sprite);
        const typeColors: Record<string, Color> = {
            'attack': new Color(180, 80, 80, 255),
            'skill': new Color(80, 120, 180, 255),
            'power': new Color(80, 180, 80, 255)
        };
        bgSprite.color = typeColors[cardData.type] || new Color(128, 128, 128, 255);

        // 费用
        const costNode = new Node('Cost');
        cardNode.addChild(costNode);
        costNode.setPosition(-35, 55, 0);
        const costTransform = costNode.addComponent(UITransform);
        costTransform.setContentSize(25, 25);
        const costSprite = costNode.addComponent(Sprite);
        costSprite.color = new Color(255, 215, 0, 255);
        const costLabel = this.createLabel(costNode, 'CostLabel', cardData.cost.toString(), 0, 0, 18, new Color(0, 0, 0, 255));

        // 名称
        const nameLabel = this.createLabel(cardNode, 'NameLabel', cardData.name, 0, 40, 18, new Color(255, 255, 255, 255));
        nameLabel.getComponent(UITransform)?.setContentSize(90, 30);

        // 描述
        const descLabel = this.createLabel(cardNode, 'DescLabel', cardData.description, 0, -10, 14, new Color(220, 220, 220, 255));
        descLabel.getComponent(UITransform)?.setContentSize(90, 80);
        descLabel.overflow = 3; // RESIZE_HEIGHT

        // 点击事件
        cardNode.on(Node.EventType.TOUCH_END, () => this.onCardClick(index), this);

        // 悬停效果
        cardNode.on(Node.EventType.MOUSE_ENTER, () => {
            tween(cardNode).to(0.1, { scale: new Vec3(1.1, 1.1, 1), position: new Vec3(cardNode.position.x, 20, 0) }).start();
        }, this);
        cardNode.on(Node.EventType.MOUSE_LEAVE, () => {
            tween(cardNode).to(0.1, { scale: new Vec3(1, 1, 1), position: new Vec3(cardNode.position.x, 0, 0) }).start();
        }, this);

        return cardNode;
    }

    /**
     * 卡牌点击
     */
    private onCardClick(index: number): void {
        console.log(`[BattleScene] 点击卡牌 ${index}`);
        
        if (this.battleSystem) {
            const success = this.battleSystem.playCard(index);
            if (success) {
                // 播放出牌动画
                const cardNode = this.cardNodes[index];
                if (cardNode) {
                    tween(cardNode)
                        .to(0.2, { scale: new Vec3(1.3, 1.3, 1), position: new Vec3(0, 200, 0) })
                        .to(0.1, { scale: new Vec3(0, 0, 1) })
                        .call(() => {
                            this.updateHandCards();
                            this.updateUI();
                        })
                        .start();
                }
            } else {
                // 播放错误动画
                const cardNode = this.cardNodes[index];
                if (cardNode) {
                    const originalX = cardNode.position.x;
                    tween(cardNode)
                        .by(0.05, { position: new Vec3(10, 0, 0) })
                        .by(0.05, { position: new Vec3(-20, 0, 0) })
                        .by(0.05, { position: new Vec3(20, 0, 0) })
                        .by(0.05, { position: new Vec3(-10, 0, 0) })
                        .call(() => {
                            cardNode.setPosition(originalX, cardNode.position.y, 0);
                        })
                        .start();
                }
            }
        }
    }

    /**
     * 结束回合点击
     */
    private onEndTurnClick(): void {
        console.log('[BattleScene] 结束回合');
        if (this.endTurnButton) {
            tween(this.endTurnButton.node)
                .to(0.1, { scale: new Vec3(0.95, 0.95, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .call(() => {
                    this.battleSystem?.endTurn();
                })
                .start();
        }
    }

    /**
     * 更新UI
     */
    private updateUI(): void {
        const gameState = GameState.instance;
        const player = gameState?.player;
        const battle = gameState?.battle;
        const enemy = this.battleSystem?.enemy;

        // 更新玩家状态
        if (player && battle) {
            if (this.playerHpLabel) {
                this.playerHpLabel.string = `❤️ ${player.hp}/${player.maxHp}`;
            }
            if (this.playerHpBar) {
                this.playerHpBar.progress = player.hp / player.maxHp;
            }
            if (this.playerEnergyLabel) {
                this.playerEnergyLabel.string = `⚡ ${battle.energy}/${battle.maxEnergy}`;
            }
            if (this.playerBlockLabel) {
                this.playerBlockLabel.string = battle.block > 0 ? `🛡️ ${battle.block}` : '';
            }
        }

        // 更新敌人状态
        if (enemy) {
            if (this.enemyNameLabel) {
                this.enemyNameLabel.string = `👹 ${enemy.name}`;
            }
            if (this.enemyHpLabel) {
                this.enemyHpLabel.string = `${enemy.hp}/${enemy.maxHp}`;
            }
            if (this.enemyHpBar) {
                this.enemyHpBar.progress = enemy.hp / enemy.maxHp;
            }
            if (this.enemyBlockLabel) {
                this.enemyBlockLabel.string = enemy.block > 0 ? `🛡️ ${enemy.block}` : '';
            }
            
            // 更新敌人意图
            const intent = enemy.getNextIntent();
            if (this.enemyIntentLabel && intent) {
                const intentText: Record<string, string> = {
                    'attack': `🔴 ${intent.desc || '攻击'} ${intent.value}`,
                    'defend': `🔵 防御 ${intent.value}`,
                    'buff': `🟢 强化`,
                    'debuff': `🟣 削弱`,
                    'special': `⚪ ${intent.desc || '特殊'}`
                };
                this.enemyIntentLabel.string = intentText[intent.type] || '❓ 未知';
            }
        }
    }

    // ========== 事件回调 ==========

    private onTurnStart(): void {
        console.log('[BattleScene] 回合开始');
        this.updateUI();
        this.updateHandCards();
    }

    private onCardPlayed(): void {
        console.log('[BattleScene] 卡牌已打出');
        this.updateUI();
    }

    private onDamageDealt(): void {
        this.updateUI();
    }

    private onBattleWon(result: any): void {
        console.log('[BattleScene] 战斗胜利', result);
        this.addBattleLog(`🎉 ${result.rating}！获得${result.goldReward}金币`);
        
        // 延迟返回地图
        this.scheduleOnce(() => {
            GameManager.instance?.returnToMap();
        }, 2);
    }

    private onBattleLost(): void {
        console.log('[BattleScene] 战斗失败');
        this.addBattleLog('💀 战斗失败...');
        
        this.scheduleOnce(() => {
            GameManager.instance?.gameOver();
        }, 2);
    }

    private onLogMessage(message: string): void {
        this.addBattleLog(message);
    }

    /**
     * 添加战斗日志
     */
    private addBattleLog(message: string): void {
        if (this.battleLogLabel) {
            const currentText = this.battleLogLabel.string;
            const lines = currentText.split('\n');
            lines.push(message);
            // 只保留最近10条
            if (lines.length > 10) {
                lines.shift();
            }
            this.battleLogLabel.string = lines.join('\n');
        }
        console.log(`[Battle] ${message}`);
    }
}
