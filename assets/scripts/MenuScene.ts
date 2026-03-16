/**
 * MenuScene.ts - 主菜单场景控制器
 * 动态创建UI版本 - 解决场景文件黑屏问题
 */

import { _decorator, Component, Node, Button, Label, Sprite, Color, Vec3, tween, UITransform } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('MenuScene')
export class MenuScene extends Component {
    onLoad() {
        console.log('[MenuScene] onLoad - 动态创建UI');
        this.createBackground();
        this.createTitle();
        this.createStartButton();
        this.createHelpButton();
    }

    /**
     * 创建背景
     */
    private createBackground(): void {
        const bgNode = new Node('Background');
        this.node.addChild(bgNode);
        
        // 设置全屏大小
        const uiTransform = bgNode.addComponent(UITransform);
        uiTransform.setContentSize(720, 1280);
        
        // 添加颜色背景（不使用Sprite，避免spriteFrame问题）
        const sprite = bgNode.addComponent(Sprite);
        sprite.color = new Color(30, 30, 50, 255);
        sprite.type = 0; // SIMPLE
        
        // 放到最底层
        bgNode.setPosition(0, 0, 0);
        
        console.log('[MenuScene] 背景创建完成');
    }

    /**
     * 创建标题
     */
    private createTitle(): void {
        const titleNode = new Node('Title');
        this.node.addChild(titleNode);
        titleNode.setPosition(0, 300, 0);
        
        const uiTransform = titleNode.addComponent(UITransform);
        uiTransform.setContentSize(400, 120);
        
        const label = titleNode.addComponent(Label);
        label.string = '启蒙';
        label.fontSize = 80;
        label.fontFamily = 'Arial';
        label.horizontalAlign = 1; // CENTER
        label.verticalAlign = 1; // CENTER
        label.color = new Color(255, 215, 100, 255);
        label.isBold = true;
        
        // 标题动画
        tween(titleNode)
            .to(0.5, { scale: new Vec3(1.05, 1.05, 1) })
            .to(0.5, { scale: new Vec3(1, 1, 1) })
            .union()
            .repeatForever()
            .start();
        
        console.log('[MenuScene] 标题创建完成');
    }

    /**
     * 创建开始游戏按钮
     */
    private createStartButton(): void {
        const btnNode = new Node('StartButton');
        this.node.addChild(btnNode);
        btnNode.setPosition(0, 50, 0);
        
        // UI大小
        const uiTransform = btnNode.addComponent(UITransform);
        uiTransform.setContentSize(300, 80);
        
        // 按钮背景
        const sprite = btnNode.addComponent(Sprite);
        sprite.color = new Color(80, 120, 200, 255);
        sprite.type = 1; // SLICED
        
        // 按钮组件
        const button = btnNode.addComponent(Button);
        button.interactable = true;
        
        // 按钮文字
        const labelNode = new Node('Label');
        btnNode.addChild(labelNode);
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(300, 80);
        const label = labelNode.addComponent(Label);
        label.string = '开始游戏';
        label.fontSize = 36;
        label.horizontalAlign = 1;
        label.verticalAlign = 1;
        label.color = new Color(255, 255, 255, 255);
        
        // 点击事件
        btnNode.on(Node.EventType.TOUCH_END, () => {
            tween(btnNode)
                .to(0.1, { scale: new Vec3(0.95, 0.95, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .call(() => {
                    console.log('[MenuScene] 开始游戏');
                    GameManager.instance?.showClassSelect();
                })
                .start();
        }, this);
        
        // 悬停效果
        this.addHoverEffect(btnNode);
        
        console.log('[MenuScene] 开始按钮创建完成');
    }

    /**
     * 创建帮助按钮
     */
    private createHelpButton(): void {
        const btnNode = new Node('HelpButton');
        this.node.addChild(btnNode);
        btnNode.setPosition(0, -80, 0);
        
        const uiTransform = btnNode.addComponent(UITransform);
        uiTransform.setContentSize(250, 70);
        
        const sprite = btnNode.addComponent(Sprite);
        sprite.color = new Color(100, 100, 120, 255);
        sprite.type = 1;
        
        const button = btnNode.addComponent(Button);
        
        const labelNode = new Node('Label');
        btnNode.addChild(labelNode);
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(250, 70);
        const label = labelNode.addComponent(Label);
        label.string = '游戏说明';
        label.fontSize = 32;
        label.horizontalAlign = 1;
        label.verticalAlign = 1;
        label.color = new Color(255, 255, 255, 255);
        
        btnNode.on(Node.EventType.TOUCH_END, () => {
            tween(btnNode)
                .to(0.1, { scale: new Vec3(0.95, 0.95, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .call(() => {
                    console.log('[MenuScene] 显示游戏说明');
                    this.showHelpInConsole();
                })
                .start();
        }, this);
        
        this.addHoverEffect(btnNode);
        
        console.log('[MenuScene] 帮助按钮创建完成');
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
     * 在控制台显示帮助
     */
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
╚══════════════════════════════════════════╝
        `;
        console.log(helpText);
    }
}
