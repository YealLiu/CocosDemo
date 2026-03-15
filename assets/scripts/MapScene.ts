/**
 * MapScene.ts - 地图场景控制器
 */

import { _decorator, Component, Node, Button, Label, ProgressBar } from 'cc';
import { GameManager } from './GameManager';
import { GameState } from './GameState';
const { ccclass, property } = _decorator;

@ccclass('MapScene')
export class MapScene extends Component {
    // UI引用
    @property(Label)
    hpLabel: Label | null = null;

    @property(ProgressBar)
    hpBar: ProgressBar | null = null;

    @property(Label)
    goldLabel: Label | null = null;

    @property(Label)
    floorLabel: Label | null = null;

    // 地图节点
    @property(Node)
    battleNodes: Node[] = [];

    @property(Node)
    eliteNode: Node | null = null;

    @property(Node)
    shopNode: Node | null = null;

    @property(Node)
    restNode: Node | null = null;

    @property(Node)
    bossNode: Node | null = null;

    onLoad() {
        // 绑定节点点击事件
        this.battleNodes.forEach(node => {
            node.on(Node.EventType.TOUCH_END, () => this.onNodeClick('battle'));
        });
        
        this.eliteNode?.on(Node.EventType.TOUCH_END, () => this.onNodeClick('elite'));
        this.shopNode?.on(Node.EventType.TOUCH_END, () => this.onNodeClick('shop'));
        this.restNode?.on(Node.EventType.TOUCH_END, () => this.onNodeClick('rest'));
        this.bossNode?.on(Node.EventType.TOUCH_END, () => this.onBossClick());
        
        // 更新UI
        this.updateUI();
    }

    onEnable() {
        this.updateUI();
    }

    private updateUI(): void {
        const gameState = GameState.instance;
        const player = gameState.player;
        
        if (!player) return;
        
        // 更新HP
        if (this.hpLabel) {
            this.hpLabel.string = `${player.hp}/${player.maxHp}`;
        }
        if (this.hpBar) {
            this.hpBar.progress = player.hp / player.maxHp;
        }
        
        // 更新金币
        if (this.goldLabel) {
            this.goldLabel.string = player.gold.toString();
        }
        
        // 更新楼层
        if (this.floorLabel) {
            this.floorLabel.string = gameState.map.floor.toString();
        }
    }

    private onNodeClick(nodeType: string): void {
        GameManager.instance?.enterNode(nodeType);
    }

    private onBossClick(): void {
        GameManager.instance?.enterBoss();
    }
}
