/**
 * MapScene.ts - 地图场景控制器
 * 动态创建UI版本 - 完整版（含连接线）
 */

import { _decorator, Component, Node, Button, Label, Sprite, Color, Vec3, tween, UITransform, ProgressBar, Graphics } from 'cc';
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

interface MapNode {
    type: NodeType;
    position: Vec3;
    connections: number[];
    visited: boolean;
}

@ccclass('MapScene')
export class MapScene extends Component {
    private mapNodes: MapNode[] = [];
    private currentNodeIndex: number = -1;
    private hpLabel: Label | null = null;
    private goldLabel: Label | null = null;
    private floorLabel: Label | null = null;
    private nodeUIs: Node[] = [];
    private graphics: Graphics | null = null;

    onLoad() {
        console.log('[MapScene] onLoad - 动态创建UI');
        this.createBackground();
        this.createStatusBar();
        this.createTitle();
        this.generateMap();
        this.createConnections(); // 先创建连接线
        this.createMapNodes();
    }

    onEnable() {
        this.updateStatusBar();
        this.updateNodeVisuals();
    }

    private createBackground(): void {
        const bgNode = new Node('Background');
        this.node.addChild(bgNode);
        
        const uiTransform = bgNode.addComponent(UITransform);
        uiTransform.setContentSize(720, 1280);
        
        const sprite = bgNode.addComponent(Sprite);
        sprite.color = new Color(20, 20, 30, 255);
        sprite.type = 0;
        
        bgNode.setPosition(0, 0, 0);
    }

    private createStatusBar(): void {
        const statusNode = new Node('StatusBar');
        this.node.addChild(statusNode);
        statusNode.setPosition(0, 550, 0);
        
        const uiTransform = statusNode.addComponent(UITransform);
        uiTransform.setContentSize(600, 80);
        
        const sprite = statusNode.addComponent(Sprite);
        sprite.color = new Color(40, 40, 50, 200);
        sprite.type = 1;
        
        // HP
        this.hpLabel = this.createStatusLabel(statusNode, 'HP', '❤️ 80/80', -200, 0, new Color(255, 100, 100, 255));
        
        // 金币
        this.goldLabel = this.createStatusLabel(statusNode, 'Gold', '💰 99', 0, 0, new Color(255, 215, 0, 255));
        
        // 楼层
        this.floorLabel = this.createStatusLabel(statusNode, 'Floor', '🏰 第1层', 200, 0, new Color(200, 200, 200, 255));
    }

    private createStatusLabel(parent: Node, name: string, text: string, x: number, y: number, color: Color): Label {
        const labelNode = new Node(name);
        parent.addChild(labelNode);
        labelNode.setPosition(x, y, 0);
        
        const uiTransform = labelNode.addComponent(UITransform);
        uiTransform.setContentSize(180, 40);
        
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 24;
        label.horizontalAlign = 1;
        label.verticalAlign = 1;
        label.color = color;
        
        return label;
    }

    private createTitle(): void {
        const titleNode = new Node('Title');
        this.node.addChild(titleNode);
        titleNode.setPosition(0, 450, 0);
        
        const uiTransform = titleNode.addComponent(UITransform);
        uiTransform.setContentSize(300, 60);
        
        const label = titleNode.addComponent(Label);
        label.string = '地图';
        label.fontSize = 48;
        label.horizontalAlign = 1;
        label.verticalAlign = 1;
        label.color = new Color(255, 255, 255, 255);
        label.isBold = true;
    }

    private generateMap(): void {
        this.mapNodes = [];
        const rows = 5;
        
        for (let row = 0; row < rows; row++) {
            let nodeType: NodeType;
            
            if (row === 0) {
                nodeType = NodeType.BATTLE;
            } else if (row === rows - 1) {
                nodeType = NodeType.BOSS;
            } else {
                const rand = Math.random();
                if (rand < 0.5) nodeType = NodeType.BATTLE;
                else if (rand < 0.7) nodeType = NodeType.ELITE;
                else if (rand < 0.85) nodeType = NodeType.SHOP;
                else nodeType = NodeType.REST;
            }
            
            const node: MapNode = {
                type: nodeType,
                position: new Vec3(0, 300 - row * 120, 0),
                connections: row < rows - 1 ? [row + 1] : [],
                visited: false
            };
            
            this.mapNodes.push(node);
        }
        
        this.currentNodeIndex = -1;
    }

    /**
     * 创建节点之间的连接线
     */
    private createConnections(): void {
        // 创建Graphics节点用于绘制线条
        const graphicsNode = new Node('Connections');
        this.node.addChild(graphicsNode);
        graphicsNode.setPosition(0, 0, 0);
        
        this.graphics = graphicsNode.addComponent(Graphics);
        this.graphics.lineWidth = 3;
        
        this.drawConnections();
    }

    /**
     * 绘制连接线
     */
    private drawConnections(): void {
        if (!this.graphics) return;
        
        this.graphics.clear();
        
        this.mapNodes.forEach((node, index) => {
            node.connections.forEach(targetIndex => {
                if (targetIndex < this.mapNodes.length) {
                    const startPos = node.position;
                    const endPos = this.mapNodes[targetIndex].position;
                    
                    // 判断是否是可访问的路径
                    const isAccessible = this.isNodeAccessible(targetIndex);
                    const isVisited = this.mapNodes[targetIndex].visited;
                    
                    // 设置线条颜色
                    if (isVisited) {
                        this.graphics!.strokeColor = new Color(100, 200, 100, 255); // 已访问 - 绿色
                    } else if (isAccessible) {
                        this.graphics!.strokeColor = new Color(255, 215, 100, 255); // 可访问 - 金色
                    } else {
                        this.graphics!.strokeColor = new Color(80, 80, 80, 150); // 不可访问 - 灰色
                    }
                    
                    // 绘制线条
                    this.graphics!.moveTo(startPos.x, startPos.y);
                    this.graphics!.lineTo(endPos.x, endPos.y);
                    this.graphics!.stroke();
                }
            });
        });
    }

    private createMapNodes(): void {
        this.nodeUIs = [];
        this.mapNodes.forEach((nodeData, index) => {
            const node = this.createNodeUI(nodeData, index);
            this.node.addChild(node);
            this.nodeUIs.push(node);
        });
    }

    private createNodeUI(nodeData: MapNode, index: number): Node {
        const node = new Node(`Node_${index}`);
        node.setPosition(nodeData.position);
        
        const uiTransform = node.addComponent(UITransform);
        uiTransform.setContentSize(80, 80);
        
        const sprite = node.addComponent(Sprite);
        sprite.color = this.getNodeColor(nodeData.type);
        sprite.type = 1;

        // 添加光晕效果（可访问节点）
        if (this.isNodeAccessible(index)) {
            const glowNode = new Node('Glow');
            node.addChild(glowNode);
            glowNode.setPosition(0, 0, 0);
            const glowTransform = glowNode.addComponent(UITransform);
            glowTransform.setContentSize(100, 100);
            const glowSprite = glowNode.addComponent(Sprite);
            glowSprite.color = new Color(255, 215, 100, 100);
            
            // 脉冲动画
            tween(glowNode)
                .to(0.8, { scale: new Vec3(1.1, 1.1, 1) })
                .to(0.8, { scale: new Vec3(1, 1, 1) })
                .union()
                .repeatForever()
                .start();
        }
        
        const labelNode = new Node('Label');
        node.addChild(labelNode);
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(80, 80);
        const label = labelNode.addComponent(Label);
        label.string = this.getNodeIcon(nodeData.type);
        label.fontSize = 40;
        label.horizontalAlign = 1;
        label.verticalAlign = 1;
        
        if (this.isNodeAccessible(index)) {
            node.on(Node.EventType.TOUCH_END, () => this.onNodeClick(index), this);
            
            node.on(Node.EventType.MOUSE_ENTER, () => {
                tween(node).to(0.1, { scale: new Vec3(1.15, 1.15, 1) }).start();
            }, this);
            node.on(Node.EventType.MOUSE_LEAVE, () => {
                tween(node).to(0.1, { scale: new Vec3(1, 1, 1) }).start();
            }, this);
        } else {
            sprite.color = new Color(80, 80, 80, 255);
        }
        
        return node;
    }

    private getNodeColor(type: NodeType): Color {
        switch (type) {
            case NodeType.BATTLE: return new Color(180, 80, 80, 255);
            case NodeType.ELITE: return new Color(180, 100, 50, 255);
            case NodeType.SHOP: return new Color(80, 120, 180, 255);
            case NodeType.REST: return new Color(80, 150, 80, 255);
            case NodeType.BOSS: return new Color(150, 50, 150, 255);
            default: return new Color(128, 128, 128, 255);
        }
    }

    private getNodeIcon(type: NodeType): string {
        switch (type) {
            case NodeType.BATTLE: return '⚔️';
            case NodeType.ELITE: return '👹';
            case NodeType.SHOP: return '🏪';
            case NodeType.REST: return '🔥';
            case NodeType.BOSS: return '👑';
            default: return '❓';
        }
    }

    private isNodeAccessible(index: number): boolean {
        if (this.currentNodeIndex === -1) return index === 0;
        return this.mapNodes[this.currentNodeIndex].connections.includes(index);
    }

    private onNodeClick(index: number): void {
        if (!this.isNodeAccessible(index)) return;

        const nodeData = this.mapNodes[index];
        this.mapNodes[index].visited = true;
        this.currentNodeIndex = index;

        // 播放点击动画
        const nodeUI = this.nodeUIs[index];
        if (nodeUI) {
            tween(nodeUI)
                .to(0.1, { scale: new Vec3(0.9, 0.9, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .start();
        }

        switch (nodeData.type) {
            case NodeType.BATTLE:
            case NodeType.ELITE:
                GameManager.instance?.enterNode(nodeData.type);
                break;
            case NodeType.SHOP:
                console.log('商店功能暂不开放');
                break;
            case NodeType.REST:
                this.rest();
                break;
            case NodeType.BOSS:
                GameManager.instance?.enterBoss();
                break;
        }
    }

    private rest(): void {
        const gameState = GameState.instance;
        if (gameState.player) {
            const healAmount = Math.floor(gameState.player.maxHp * 0.3);
            gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
            console.log(`恢复${healAmount}点生命！`);
            this.updateStatusBar();
            this.updateNodeVisuals();
        }
    }

    private updateStatusBar(): void {
        const gameState = GameState.instance;
        const player = gameState?.player;
        
        if (player) {
            if (this.hpLabel) this.hpLabel.string = `❤️ ${player.hp}/${player.maxHp}`;
            if (this.goldLabel) this.goldLabel.string = `💰 ${player.gold}`;
            if (this.floorLabel) this.floorLabel.string = `🏰 第${gameState.map.floor}层`;
        }
    }

    /**
     * 更新节点视觉效果
     */
    private updateNodeVisuals(): void {
        // 重新绘制连接线
        this.drawConnections();
        
        // 更新节点UI
        this.nodeUIs.forEach((nodeUI, index) => {
            const sprite = nodeUI.getComponent(Sprite);
            if (sprite) {
                if (this.isNodeAccessible(index)) {
                    sprite.color = this.getNodeColor(this.mapNodes[index].type);
                } else if (this.mapNodes[index].visited) {
                    sprite.color = new Color(100, 150, 100, 255); // 已访问 - 淡绿色
                } else {
                    sprite.color = new Color(80, 80, 80, 255); // 不可访问 - 灰色
                }
            }
        });
    }
}
