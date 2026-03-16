/**
 * MapScene.ts - 地图场景控制器
 * 动态创建UI版本
 */

import { _decorator, Component, Node, Button, Label, Sprite, tween, Vec3, Color, UITransform, ProgressBar } from 'cc';
import { GameManager } from './GameManager';
import { GameState } from './GameState';
const { ccclass, property } = _decorator;

enum NodeType {
    BATTLE = 'battle',
    ELITE = 'elite', 
    SHOP = 'shop',
    REST = 'rest',
    BOSS = 'boss'
}

interface MapNodeData {
    type: NodeType;
    icon: string;
    color: Color;
    y: number;
}

@ccclass('MapScene')
export class MapScene extends Component {
    // UI元素
    private hpLabel: Label | null = null;
    private goldLabel: Label | null = null;
    private floorLabel: Label | null = null;
    private mapNodes: Node[] = [];

    onLoad() {
        console.log('[MapScene] 动态创建UI元素');
        this.createUI();
        this.bindEvents();
    }

    /**
     * 动态创建所有UI元素
     */
    private createUI(): void {
        const canvas = this.node;

        // 1. 创建顶部状态栏
        this.createStatusBar(canvas);

        // 2. 创建地图节点
        this.createMapNodes(canvas);

        // 3. 创建返回按钮
        this.createBackButton(canvas);
    }

    /**
     * 创建顶部状态栏
     */
    private createStatusBar(parent: Node): void {
        const statusBar = new Node('StatusBar');
        parent.addChild(statusBar);
        statusBar.setPosition(0, 550, 0);

        const uiTransform = statusBar.addComponent(UITransform);
        uiTransform.setContentSize(600, 80);

        // HP显示
        this.hpLabel = this.createStatusLabel(statusBar, '❤️ 80/80', -200, new Color(255, 100, 100, 255));

        // 金币显示
        this.goldLabel = this.createStatusLabel(statusBar, '💰 100', 0, new Color(255, 215, 100, 255));

        // 层数显示
        this.floorLabel = this.createStatusLabel(statusBar, '🏰 第1层', 200, new Color(200, 200, 200, 255));

        console.log('[MapScene] 状态栏创建完成');
    }

    /**
     * 创建状态标签
     */
    private createStatusLabel(parent: Node, text: string, x: number, color: Color): Label {
        const labelNode = new Node('StatusLabel');
        parent.addChild(labelNode);
        labelNode.setPosition(x, 0, 0);

        const uiTransform = labelNode.addComponent(UITransform);
        uiTransform.setContentSize(180, 60);

        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 28;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.color = color;

        return label;
    }

    /**
     * 创建地图节点
     */
    private createMapNodes(parent: Node): void {
        const mapData: MapNodeData[] = [
            { type: NodeType.BATTLE, icon: '⚔️', color: new Color(180, 80, 80, 255), y: 300 },
            { type: NodeType.ELITE, icon: '👹', color: new Color(180, 100, 50, 255), y: 150 },
            { type: NodeType.SHOP, icon: '🏪', color: new Color(80, 120, 180, 255), y: 0 },
            { type: NodeType.REST, icon: '🔥', color: new Color(80, 150, 80, 255), y: -150 },
            { type: NodeType.BOSS, icon: '👑', color: new Color(150, 50, 150, 255), y: -300 }
        ];

        mapData.forEach((data, index) => {
            const node = this.createMapNode(parent, data, index);
            this.mapNodes.push(node);
        });

        console.log('[MapScene] 地图节点创建完成');
    }

    /**
     * 创建单个地图节点
     */
    private createMapNode(parent: Node, data: MapNodeData, index: number): Node {
        const node = new Node(`Node_${index}`);
        parent.addChild(node);
        node.setPosition(0, data.y, 0);

        // UI变换
        const uiTransform = node.addComponent(UITransform);
        uiTransform.setContentSize(80, 80);

        // 背景Sprite
        const sprite = node.addComponent(Sprite);
        sprite.color = data.color;
        sprite.type = Sprite.Type.SIMPLE;

        // 图标Label
        const iconNode = new Node('Icon');
        node.addChild(iconNode);
        const iconTransform = iconNode.addComponent(UITransform);
        iconTransform.setContentSize(80, 80);
        const iconLabel = iconNode.addComponent(Label);
        iconLabel.string = data.icon;
        iconLabel.fontSize = 40;
        iconLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        iconLabel.verticalAlign = Label.VerticalAlign.CENTER;

        // 悬停效果
        node.on(Node.EventType.MOUSE_ENTER, () => {
            tween(node).to(0.1, { scale: new Vec3(1.1, 1.1, 1) }).start();
        }, this);
        node.on(Node.EventType.MOUSE_LEAVE, () => {
            tween(node).to(0.1, { scale: new Vec3(1, 1, 1) }).start();
        }, this);

        // 点击事件
        node.on(Node.EventType.TOUCH_END, () => {
            this.onNodeClick(data.type);
        }, this);

        return node;
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
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.color = new Color(255, 255, 255, 255);

        button.node.on(Button.EventType.CLICK, () => {
            GameManager.instance?.returnToMainMenu();
        }, this);

        this.addHoverEffect(buttonNode);

        console.log('[MapScene] 返回按钮创建完成');
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
        // 更新UI
        this.updateUI();
    }

    /**
     * 节点点击处理
     */
    private onNodeClick(nodeType: NodeType): void {
        console.log(`[MapScene] 点击节点: ${nodeType}`);
        
        switch (nodeType) {
            case NodeType.BATTLE:
            case NodeType.ELITE:
                GameManager.instance?.enterBattle(nodeType === NodeType.ELITE);
                break;
            case NodeType.SHOP:
                GameManager.instance?.enterShop();
                break;
            case NodeType.REST:
                GameManager.instance?.enterRest();
                break;
            case NodeType.BOSS:
                GameManager.instance?.enterBoss();
                break;
        }
    }

    /**
     * 更新UI
     */
    private updateUI(): void {
        const gameState = GameState.instance;
        const player = gameState?.player;
        
        if (!player) return;

        if (this.hpLabel) {
            this.hpLabel.string = `❤️ ${player.hp}/${player.maxHp}`;
        }
        if (this.goldLabel) {
            this.goldLabel.string = `💰 ${player.gold}`;
        }
        if (this.floorLabel) {
            this.floorLabel.string = `🏰 第${gameState.map.floor}层`;
        }
    }

    onEnable() {
        this.updateUI();
    }
}
