/**
 * MapScene.ts - 地图场景控制器
 * 完善版 - 包含完整的地图节点系统和状态栏
 */

import { _decorator, Component, Node, Button, Label, ProgressBar, tween, Vec3, Color, Sprite } from 'cc';
import { GameManager } from './GameManager';
import { GameState } from './GameState';
const { ccclass, property } = _decorator;

// 节点类型
enum NodeType {
    BATTLE = 'battle',
    ELITE = 'elite',
    SHOP = 'shop',
    REST = 'rest',
    BOSS = 'boss'
}

// 地图节点数据
interface MapNode {
    type: NodeType;
    position: Vec3;
    connections: number[];
    visited: boolean;
}

@ccclass('MapScene')
export class MapScene extends Component {
    // UI引用 - 顶部状态栏
    @property(Label)
    hpLabel: Label | null = null;

    @property(ProgressBar)
    hpBar: ProgressBar | null = null;

    @property(Label)
    goldLabel: Label | null = null;

    @property(Label)
    floorLabel: Label | null = null;

    // 地图节点容器
    @property(Node)
    mapContainer: Node | null = null;

    // 地图数据
    private mapNodes: MapNode[] = [];
    private currentNodeIndex: number = -1;

    onLoad() {
        this.generateMap();
        this.createMapNodes();
        this.updateUI();
    }

    onEnable() {
        this.updateUI();
    }

    /**
     * 生成地图数据
     */
    private generateMap(): void {
        this.mapNodes = [];
        
        // 第1层地图结构（简化版）
        // 共5行，每行1-3个节点
        const rows = 5;
        
        for (let row = 0; row < rows; row++) {
            let nodeType: NodeType;
            
            // 根据行数决定节点类型
            if (row === 0) {
                nodeType = NodeType.BATTLE; // 起始战斗
            } else if (row === rows - 1) {
                nodeType = NodeType.BOSS; // BOSS
            } else {
                // 随机生成其他类型
                const rand = Math.random();
                if (rand < 0.5) {
                    nodeType = NodeType.BATTLE;
                } else if (rand < 0.7) {
                    nodeType = NodeType.ELITE;
                } else if (rand < 0.85) {
                    nodeType = NodeType.SHOP;
                } else {
                    nodeType = NodeType.REST;
                }
            }
            
            const node: MapNode = {
                type: nodeType,
                position: new Vec3(0, 300 - row * 150, 0),
                connections: row < rows - 1 ? [row + 1] : [],
                visited: false
            };
            
            this.mapNodes.push(node);
        }
        
        this.currentNodeIndex = -1;
    }

    /**
     * 创建地图节点UI
     */
    private createMapNodes(): void {
        if (!this.mapContainer) {
            // 如果没有容器，尝试创建一个
            this.mapContainer = new Node('MapContainer');
            this.node.addChild(this.mapContainer);
        }

        // 清除旧节点
        this.mapContainer.removeAllChildren();

        // 创建节点
        this.mapNodes.forEach((nodeData, index) => {
            const node = this.createNodeUI(nodeData, index);
            this.mapContainer!.addChild(node);
        });
    }

    /**
     * 创建单个节点UI
     */
    private createNodeUI(nodeData: MapNode, index: number): Node {
        const node = new Node(`Node_${index}`);
        
        // 设置位置
        node.setPosition(nodeData.position);
        
        // 添加UI变换组件
        const uiTransform = node.addComponent(cc.UITransform);
        uiTransform.setContentSize(80, 80);
        
        // 添加Sprite
        const sprite = node.addComponent(cc.Sprite);
        sprite.color = this.getNodeColor(nodeData.type);
        sprite.type = Sprite.Type.SIMPLE;
        
        // 添加按钮
        const button = node.addComponent(cc.Button);
        button.interactable = this.isNodeAccessible(index);
        
        // 添加标签显示节点类型
        const labelNode = new Node('Label');
        node.addChild(labelNode);
        const labelTransform = labelNode.addComponent(cc.UITransform);
        labelTransform.setContentSize(80, 80);
        const label = labelNode.addComponent(cc.Label);
        label.string = this.getNodeIcon(nodeData.type);
        label.fontSize = 40;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        
        // 绑定点击事件
        node.on(Node.EventType.TOUCH_END, () => this.onNodeClick(index), this);
        
        // 添加悬停效果
        if (this.isNodeAccessible(index)) {
            node.on(Node.EventType.MOUSE_ENTER, () => {
                tween(node).to(0.1, { scale: new Vec3(1.1, 1.1, 1) }).start();
            }, this);
            node.on(Node.EventType.MOUSE_LEAVE, () => {
                tween(node).to(0.1, { scale: new Vec3(1, 1, 1) }).start();
            }, this);
        }
        
        return node;
    }

    /**
     * 获取节点颜色
     */
    private getNodeColor(type: NodeType): Color {
        switch (type) {
            case NodeType.BATTLE:
                return new Color(180, 80, 80, 255); // 红色
            case NodeType.ELITE:
                return new Color(180, 100, 50, 255); // 橙色
            case NodeType.SHOP:
                return new Color(80, 120, 180, 255); // 蓝色
            case NodeType.REST:
                return new Color(80, 150, 80, 255); // 绿色
            case NodeType.BOSS:
                return new Color(150, 50, 150, 255); // 紫色
            default:
                return new Color(128, 128, 128, 255);
        }
    }

    /**
     * 获取节点图标
     */
    private getNodeIcon(type: NodeType): string {
        switch (type) {
            case NodeType.BATTLE:
                return '⚔️';
            case NodeType.ELITE:
                return '👹';
            case NodeType.SHOP:
                return '🏪';
            case NodeType.REST:
                return '🔥';
            case NodeType.BOSS:
                return '👑';
            default:
                return '❓';
        }
    }

    /**
     * 检查节点是否可访问
     */
    private isNodeAccessible(index: number): boolean {
        if (this.currentNodeIndex === -1) {
            return index === 0; // 第一个节点
        }
        const currentNode = this.mapNodes[this.currentNodeIndex];
        return currentNode.connections.includes(index);
    }

    /**
     * 节点点击处理
     */
    private onNodeClick(index: number): void {
        if (!this.isNodeAccessible(index)) {
            console.log('[MapScene] 该节点尚未解锁');
            return;
        }

        const nodeData = this.mapNodes[index];
        console.log(`[MapScene] 点击节点: ${nodeData.type}`);

        // 标记为已访问
        this.mapNodes[index].visited = true;
        this.currentNodeIndex = index;

        // 进入对应场景
        switch (nodeData.type) {
            case NodeType.BATTLE:
            case NodeType.ELITE:
                GameManager.instance?.enterBattle(nodeData.type === NodeType.ELITE);
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
        const player = gameState.player;
        
        if (!player) return;
        
        // 更新HP
        if (this.hpLabel) {
            this.hpLabel.string = `❤️ ${player.hp}/${player.maxHp}`;
        }
        if (this.hpBar) {
            this.hpBar.progress = player.hp / player.maxHp;
        }
        
        // 更新金币
        if (this.goldLabel) {
            this.goldLabel.string = `💰 ${player.gold}`;
        }
        
        // 更新楼层
        if (this.floorLabel) {
            this.floorLabel.string = `🏰 第${gameState.map.floor}层`;
        }
    }
}
