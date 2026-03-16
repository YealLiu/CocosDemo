/**
 * MapScene.ts - 地图场景控制器
 * 动态创建UI版本
 */

import { _decorator, Component, Node, Button, Label, Sprite, Color, Vec3, tween, UITransform, ProgressBar } from 'cc';
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

    onLoad() {
        console.log('[MapScene] onLoad - 动态创建UI');
        this.createBackground();
        this.createStatusBar();
        this.createTitle();
        this.generateMap();
        this.createMapNodes();
    }

    onEnable() {
        this.updateStatusBar();
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

    private createMapNodes(): void {
        this.mapNodes.forEach((nodeData, index) => {
            const node = this.createNodeUI(nodeData, index);
            this.node.addChild(node);
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
                tween(node).to(0.1, { scale: new Vec3(1.1, 1.1, 1) }).start();
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
}
