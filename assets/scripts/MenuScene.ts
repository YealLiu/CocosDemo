/**
 * MenuScene.ts - 主菜单场景控制器
 * 完善版 - 包含完整的UI交互
 */

import { _decorator, Component, Node, Button, Label, director, Animation, tween, Vec3 } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('MenuScene')
export class MenuScene extends Component {
    @property(Button)
    startButton: Button | null = null;

    @property(Button)
    helpButton: Button | null = null;

    @property(Button)
    closeHelpButton: Button | null = null;

    @property(Node)
    helpPanel: Node | null = null;

    @property(Node)
    titleNode: Node | null = null;

    @property(Node)
    subtitleNode: Node | null = null;

    private isHelpShowing: boolean = false;

    onLoad() {
        console.log('[MenuScene] onLoad');
        this.bindButtons();
        this.initAnimations();
        this.hideHelpPanel();
    }

    private bindButtons(): void {
        // 绑定开始游戏按钮
        if (this.startButton) {
            this.startButton.node.on(Button.EventType.CLICK, this.onStartClick, this);
            this.addButtonHoverEffect(this.startButton);
        } else {
            const startBtnNode = this.node.getChildByName('StartButton');
            if (startBtnNode) {
                const btn = startBtnNode.getComponent(Button);
                if (btn) {
                    this.startButton = btn;
                    btn.node.on(Button.EventType.CLICK, this.onStartClick, this);
                    this.addButtonHoverEffect(btn);
                }
            }
        }

        // 绑定游戏说明按钮
        if (this.helpButton) {
            this.helpButton.node.on(Button.EventType.CLICK, this.onHelpClick, this);
            this.addButtonHoverEffect(this.helpButton);
        } else {
            const helpBtnNode = this.node.getChildByName('HelpButton');
            if (helpBtnNode) {
                const btn = helpBtnNode.getComponent(Button);
                if (btn) {
                    this.helpButton = btn;
                    btn.node.on(Button.EventType.CLICK, this.onHelpClick, this);
                    this.addButtonHoverEffect(btn);
                }
            }
        }

        // 绑定关闭帮助按钮
        if (this.closeHelpButton) {
            this.closeHelpButton.node.on(Button.EventType.CLICK, this.onCloseHelpClick, this);
        } else {
            const closeBtnNode = this.node.getChildByName('CloseHelpButton');
            if (closeBtnNode) {
                const btn = closeBtnNode.getComponent(Button);
                if (btn) {
                    this.closeHelpButton = btn;
                    btn.node.on(Button.EventType.CLICK, this.onCloseHelpClick, this);
                }
            }
        }
    }

    private addButtonHoverEffect(button: Button): void {
        const node = button.node;
        
        node.on(Node.EventType.MOUSE_ENTER, () => {
            tween(node)
                .to(0.1, { scale: new Vec3(1.05, 1.05, 1) })
                .start();
        }, this);

        node.on(Node.EventType.MOUSE_LEAVE, () => {
            tween(node)
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .start();
        }, this);
    }

    private initAnimations(): void {
        // 标题动画
        if (this.titleNode) {
            tween(this.titleNode)
                .to(0.5, { scale: new Vec3(1.05, 1.05, 1) })
                .to(0.5, { scale: new Vec3(1, 1, 1) })
                .union()
                .repeatForever()
                .start();
        }

        // 副标题淡入
        if (this.subtitleNode) {
            this.subtitleNode.setScale(0.8, 0.8, 1);
            tween(this.subtitleNode)
                .to(0.8, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }

    private hideHelpPanel(): void {
        if (this.helpPanel) {
            this.helpPanel.active = false;
        }
    }

    onDestroy() {
        this.startButton?.node.off(Button.EventType.CLICK, this.onStartClick, this);
        this.helpButton?.node.off(Button.EventType.CLICK, this.onHelpClick, this);
        this.closeHelpButton?.node.off(Button.EventType.CLICK, this.onCloseHelpClick, this);
    }

    private onStartClick(): void {
        console.log('[MenuScene] 开始游戏');
        // 按钮点击动画
        if (this.startButton) {
            tween(this.startButton.node)
                .to(0.1, { scale: new Vec3(0.95, 0.95, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .call(() => {
                    GameManager.instance?.showClassSelect();
                })
                .start();
        } else {
            GameManager.instance?.showClassSelect();
        }
    }

    private onHelpClick(): void {
        console.log('[MenuScene] 显示游戏说明');
        if (this.isHelpShowing) return;
        
        this.isHelpShowing = true;
        
        if (this.helpPanel) {
            this.helpPanel.active = true;
            this.helpPanel.setScale(0.5, 0.5, 1);
            tween(this.helpPanel)
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .start();
        } else {
            // 如果没有帮助面板，在控制台输出
            this.showHelpInConsole();
        }
    }

    private onCloseHelpClick(): void {
        console.log('[MenuScene] 关闭游戏说明');
        if (!this.isHelpShowing) return;

        if (this.helpPanel) {
            tween(this.helpPanel)
                .to(0.2, { scale: new Vec3(0.5, 0.5, 1) })
                .call(() => {
                    this.helpPanel!.active = false;
                    this.isHelpShowing = false;
                })
                .start();
        }
    }

    private showHelpInConsole(): void {
        const helpText = `
╔══════════════════════════════════════════╗
║             《启蒙》游戏说明              ║
╠══════════════════════════════════════════╣
║                                          ║
║  核心玩法：                              ║
║  1. 选择战士职业开始游戏                 ║
║  2. 在地图上选择路线前进                 ║
║  3. 战斗中打出卡牌击败敌人               ║
║  4. 获得金币和卡牌奖励                   ║
║  5. 击败第1层BOSS通关                   ║
║                                          ║
║  卡牌类型：                              ║
║  🔴 攻击卡 - 造成伤害                   ║
║  🔵 技能卡 - 防御、抽牌等               ║
║  🟢 能力卡 - 持续整场战斗的效果         ║
║                                          ║
║  战斗机制：                              ║
║  ⚡ 能量 - 每回合3点，打出卡牌消耗      ║
║  🛡️ 格挡 - 抵消下回合受到的伤害        ║
║                                          ║
╚══════════════════════════════════════════╝
        `;
        console.log(helpText);
    }
}
