/**
 * BattleScene.ts - 战斗场景控制器
 * 动态创建UI版本
 */

import { _decorator, Component, Node, Button, Label, Sprite, ProgressBar, tween, Vec3, Color, UITransform } from 'cc';
import { GameManager } from './GameManager';
import { GameState } from './GameState';
import { BattleSystem } from './BattleSystem';
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
    private endTurnButton: Button | null = null;
    private battleLogLabel: Label | null = null;

    // 战斗系统
    private battleSystem: BattleSystem | null = null;

    onLoad() {
        console.log('[BattleScene] 动态创建UI元素');
        this.createUI();
        this.bindEvents();
        this.initBattle();
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

        // 3. 创建结束回合按钮
        this.createEndTurnButton(canvas);

        // 4. 创建战斗日志
        this.createBattleLog(canvas);

        // 5. 创建返回按钮
        this.createBackButton(canvas);
    }

    /**
     * 创建玩家状态区
     */
    private createPlayerStatus(parent: Node): void {
        const statusNode = new Node('PlayerStatus');
        parent.addChild(statusNode);
        statusNode.setPosition(-200, -400, 0);

        const uiTransform = statusNode.addComponent(UITransform);
        uiTransform.setContentSize(300, 150);

        // 背景
        const sprite = statusNode.addComponent(Sprite);
        sprite.color = new Color(40, 40, 60, 200);
        sprite.type = 1; // SLICED

        // HP条
        this.playerHpBar = this.createProgressBar(statusNode, 'HPBar', 0, 40, new Color(200, 50, 50, 255));
        this.playerHpLabel = this.createLabel(statusNode, 'HPLabel', '❤️ 80/80', 0, 40, 24, new Color(255, 100, 100, 255));

        // 能量
        this.playerEnergyLabel = this.createLabel(statusNode, 'EnergyLabel', '⚡ 3/3', -80, -10, 28, new Color(100, 200, 255, 255));

        // 格挡
        this.playerBlockLabel = this.createLabel(statusNode, 'BlockLabel', '🛡️ 0', 80, -10, 28, new Color(150, 150, 150, 255));

        console.log('[BattleScene] 玩家状态区创建完成');
    }

    /**
     * 创建敌人区域
     */
    private createEnemyArea(parent: Node): void {
        const enemyNode = new Node('EnemyArea');
        parent.addChild(enemyNode);
        enemyNode.setPosition(0, 200, 0);

        const uiTransform = enemyNode.addComponent(UITransform);
        uiTransform.setContentSize(300, 200);

        // 背景
        const sprite = enemyNode.addComponent(Sprite);
        sprite.color = new Color(60, 40, 40, 200);
        sprite.type = 1; // SLICED

        // 敌人名称
        this.enemyNameLabel = this.createLabel(enemyNode, 'EnemyName', '👹 黑暗奴仆', 0, 60, 32, new Color(255, 150, 150, 255));

        // HP条
        this.enemyHpBar = this.createProgressBar(enemyNode, 'EnemyHPBar', 0, 20, new Color(200, 50, 50, 255));
        this.enemyHpLabel = this.createLabel(enemyNode, 'EnemyHPLabel', '40/40', 0, 20, 22, new Color(255, 255, 255, 255));

        // 意图
        this.enemyIntentLabel = this.createLabel(enemyNode, 'EnemyIntent', '🔴 攻击 10', 0, -40, 26, new Color(255, 200, 100, 255));

        console.log('[BattleScene] 敌人区域创建完成');
    }

    /**
     * 创建结束回合按钮
     */
    private createEndTurnButton(parent: Node): void {
        const buttonNode = new Node('EndTurnButton');
        parent.addChild(buttonNode);
        buttonNode.setPosition(200, -400, 0);

        const uiTransform = buttonNode.addComponent(UITransform);
        uiTransform.setContentSize(150, 80);

        const sprite = buttonNode.addComponent(Sprite);
        sprite.color = new Color(80, 120, 80, 255);

        this.endTurnButton = buttonNode.addComponent(Button);

        const labelNode = new Node('Label');
        buttonNode.addChild(labelNode);
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(150, 80);
        const label = labelNode.addComponent(Label);
        label.string = '结束回合';
        label.fontSize = 28;
        label.horizontalAlign = 1; // CENTER
        label.verticalAlign = 1; // CENTER
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
        logNode.setPosition(220, 300, 0);

        const uiTransform = logNode.addComponent(UITransform);
        uiTransform.setContentSize(250, 300);

        // 背景
        const sprite = logNode.addComponent(Sprite);
        sprite.color = new Color(30, 30, 30, 200);
        sprite.type = 1; // SLICED

        // 日志标签
        this.battleLogLabel = this.createLabel(logNode, 'LogLabel', '战斗开始！', 0, 120, 20, new Color(200, 200, 200, 255));
        this.battleLogLabel.overflow = 1; // SHRINK
        this.battleLogLabel.verticalAlign = 0; // TOP

        console.log('[BattleScene] 战斗日志创建完成');
    }

    /**
     * 创建返回按钮
     */
    private createBackButton(parent: Node): void {
        const buttonNode = new Node('BackButton');
        parent.addChild(buttonNode);
        buttonNode.setPosition(-250, 500, 0);

        const uiTransform = buttonNode.addComponent(UITransform);
        uiTransform.setContentSize(120, 60);

        const sprite = buttonNode.addComponent(Sprite);
        sprite.color = new Color(100, 100, 100, 255);

        const button = buttonNode.addComponent(Button);

        const labelNode = new Node('Label');
        buttonNode.addChild(labelNode);
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(120, 60);
        const label = labelNode.addComponent(Label);
        label.string = '返回';
        label.fontSize = 28;
        label.horizontalAlign = 1; // CENTER
        label.verticalAlign = 1; // CENTER
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
        label.horizontalAlign = 1; // CENTER
        label.verticalAlign = 1; // CENTER
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
            // 绑定战斗事件
        }
    }

    /**
     * 初始化战斗
     */
    private initBattle(): void {
        console.log('[BattleScene] 初始化战斗');
        this.updateUI();
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
        // 更新玩家状态
        const gameState = GameState.instance;
        const player = gameState?.player;
        
        if (player) {
            if (this.playerHpLabel) {
                this.playerHpLabel.string = `❤️ ${player.hp}/${player.maxHp}`;
            }
            if (this.playerHpBar) {
                this.playerHpBar.progress = player.hp / player.maxHp;
            }
            if (this.playerEnergyLabel) {
                this.playerEnergyLabel.string = `⚡ 3/3`;
            }
            if (this.playerBlockLabel) {
                this.playerBlockLabel.string = `🛡️ 0`;
            }
        }
    }

    /**
     * 添加战斗日志
     */
    public addBattleLog(message: string): void {
        if (this.battleLogLabel) {
            this.battleLogLabel.string += `\n${message}`;
        }
        console.log(`[Battle] ${message}`);
    }
}
