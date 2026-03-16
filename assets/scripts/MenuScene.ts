/**
 * MenuScene.ts - 主菜单场景控制器
 * 场景UI已在编辑器中配置，此脚本只处理交互逻辑
 */

import { _decorator, Component, Node, Button, director } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('MenuScene')
export class MenuScene extends Component {
    @property(Button)
    startButton: Button | null = null;

    @property(Button)
    helpButton: Button | null = null;

    onLoad() {
        console.log('[MenuScene] onLoad');
        this.bindEvents();
    }

    private bindEvents(): void {
        if (this.startButton) {
            this.startButton.node.on(Node.EventType.TOUCH_END, this.onStartGame, this);
        }
        if (this.helpButton) {
            this.helpButton.node.on(Node.EventType.TOUCH_END, this.onShowHelp, this);
        }
    }

    private onStartGame(): void {
        console.log('[MenuScene] 开始游戏');
        GameManager.instance?.showClassSelect();
    }

    private onShowHelp(): void {
        console.log('[MenuScene] 显示帮助');
        // 显示游戏说明
        alert('《启蒙》游戏说明：\n\n1. 选择战士职业开始游戏\n2. 在地图上选择路线前进\n3. 战斗中打出卡牌击败敌人\n4. 获得金币和卡牌奖励\n5. 击败BOSS通关');
    }
}
