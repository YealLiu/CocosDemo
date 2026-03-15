/**
 * MenuScene.ts - 主菜单场景控制器
 */

import { _decorator, Component, Node, Button, Label, director } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('MenuScene')
export class MenuScene extends Component {
    @property(Button)
    startButton: Button | null = null;

    @property(Button)
    pvpButton: Button | null = null;

    @property(Button)
    helpButton: Button | null = null;

    onLoad() {
        // 绑定按钮事件
        this.startButton?.node.on(Button.EventType.CLICK, this.onStartClick, this);
        this.pvpButton?.node.on(Button.EventType.CLICK, this.onPVPClick, this);
        this.helpButton?.node.on(Button.EventType.CLICK, this.onHelpClick, this);
    }

    onDestroy() {
        this.startButton?.node.off(Button.EventType.CLICK, this.onStartClick, this);
        this.pvpButton?.node.off(Button.EventType.CLICK, this.onPVPClick, this);
        this.helpButton?.node.off(Button.EventType.CLICK, this.onHelpClick, this);
    }

    private onStartClick(): void {
        GameManager.instance?.showClassSelect();
    }

    private onPVPClick(): void {
        // PVP功能暂不实现
        console.log('PVP功能开发中...');
    }

    private onHelpClick(): void {
        // 显示帮助信息
        const helpText = `
游戏说明：

1. 选择职业开始游戏
2. 在地图上选择路线
3. 战斗中打出卡牌击败敌人
4. 获得奖励，继续爬塔
5. 击败最终BOSS通关

卡牌类型：
🔴 攻击卡 - 造成伤害
🔵 技能卡 - 防御、抽牌等
🟢 能力卡 - 持续整场战斗的效果
        `;
        console.log(helpText);
    }
}
