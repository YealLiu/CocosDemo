/**
 * ClassSelectScene.ts - 职业选择场景控制器
 * 动态创建UI版本 - 自动创建所有UI元素
 */

import { _decorator, Component, Node, Button, Label, Sprite, tween, Vec3, Color, UITransform } from 'cc';
import { GameManager } from './GameManager';
import { ClassDatabase, isClassUnlocked } from './ClassDatabase';
const { ccclass, property } = _decorator;

@ccclass('ClassSelectScene')
export class ClassSelectScene extends Component {
    // UI元素引用
    private backButton: Button | null = null;
    private warriorCard: Node | null = null;
    private assassinCard: Node | null = null;
    private mageCard: Node | null = null;

    // 通关记录
    private completedRuns: Record<string, number> = {};

    onLoad() {
        console.log('[ClassSelectScene] 动态创建UI元素');
        this.createUI();
        this.bindEvents();
        this.initAnimations();
    }

    /**
     * 动态创建所有UI元素
     */
    private createUI(): void {
        const canvas = this.node;

        // 1. 创建返回按钮
        this.backButton = this.createBackButton(canvas);

        // 2. 创建职业卡片
        this.warriorCard = this.createClassCard(canvas, 'warrior', '🛡️ 战士', '铁壁防线\n高防御、格挡流\n初始遗物: 塔盾', false, 200);
        this.assassinCard = this.createClassCard(canvas, 'assassin', '🗡️ 刺客', '🔒 通关1次解锁', true, 0);
        this.mageCard = this.createClassCard(canvas, 'mage', '🔮 法师', '🔒 通关3次解锁', true, -200);
    }

    /**
     * 创建返回按钮
     */
    private createBackButton(parent: Node): Button {
        const buttonNode = new Node('BackButton');
        parent.addChild(buttonNode);

        // 设置位置和大小
        buttonNode.setPosition(-250, 500, 0);
        const uiTransform = buttonNode.addComponent(UITransform);
        uiTransform.setContentSize(120, 60);

        // 添加背景Sprite
        const sprite = buttonNode.addComponent(Sprite);
        sprite.color = new Color(100, 100, 100, 255);
        sprite.type = Sprite.Type.SIMPLE;

        // 添加Button组件
        const button = buttonNode.addComponent(Button);
        button.interactable = true;

        // 创建Label
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

        console.log('[ClassSelectScene] 返回按钮创建完成');
        return button;
    }

    /**
     * 创建职业卡片
     */
    private createClassCard(parent: Node, classId: string, title: string, desc: string, isLocked: boolean, yPos: number): Node {
        const cardNode = new Node(`${classId}Card`);
        parent.addChild(cardNode);

        // 设置位置
        cardNode.setPosition(0, yPos, 0);

        // 添加UI变换
        const uiTransform = cardNode.addComponent(UITransform);
        uiTransform.setContentSize(300, 180);

        // 添加背景Sprite
        const sprite = cardNode.addComponent(Sprite);
        if (isLocked) {
            sprite.color = new Color(80, 80, 80, 255); // 灰色-锁定
        } else {
            sprite.color = new Color(60, 80, 120, 255); // 蓝色-可用
        }
        sprite.type = Sprite.Type.SIMPLE;

        // 创建标题Label
        const titleNode = new Node('Title');
        cardNode.addChild(titleNode);
        const titleTransform = titleNode.addComponent(UITransform);
        titleTransform.setContentSize(280, 60);
        titleNode.setPosition(0, 50, 0);
        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = title;
        titleLabel.fontSize = 40;
        titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        titleLabel.verticalAlign = Label.VerticalAlign.CENTER;
        titleLabel.color = isLocked ? new Color(150, 150, 150, 255) : new Color(255, 200, 100, 255);

        // 创建描述Label
        const descNode = new Node('Desc');
        cardNode.addChild(descNode);
        const descTransform = descNode.addComponent(UITransform);
        descTransform.setContentSize(280, 100);
        descNode.setPosition(0, -30, 0);
        const descLabel = descNode.addComponent(Label);
        descLabel.string = desc;
        descLabel.fontSize = 22;
        descLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        descLabel.verticalAlign = Label.VerticalAlign.CENTER;
        descLabel.color = new Color(200, 200, 200, 255);

        console.log(`[ClassSelectScene] ${classId}卡片创建完成`);
        return cardNode;
    }

    /**
     * 绑定事件
     */
    private bindEvents(): void {
        // 返回按钮
        if (this.backButton) {
            this.backButton.node.on(Button.EventType.CLICK, this.onBackClick, this);
            this.addHoverEffect(this.backButton.node);
        }

        // 职业卡片
        this.bindCardEvents(this.warriorCard, 'warrior');
        this.bindCardEvents(this.assassinCard, 'assassin');
        this.bindCardEvents(this.mageCard, 'mage');
    }

    /**
     * 绑定卡片事件
     */
    private bindCardEvents(cardNode: Node | null, classId: string): void {
        if (!cardNode) return;

        // 点击事件
        cardNode.on(Node.EventType.TOUCH_END, () => {
            this.onClassSelect(classId);
        }, this);

        // 悬停效果
        cardNode.on(Node.EventType.MOUSE_ENTER, () => {
            if (classId === 'warrior' || isClassUnlocked(classId, this.completedRuns)) {
                tween(cardNode).to(0.2, { scale: new Vec3(1.05, 1.05, 1) }).start();
            }
        }, this);

        cardNode.on(Node.EventType.MOUSE_LEAVE, () => {
            tween(cardNode).to(0.2, { scale: new Vec3(1, 1, 1) }).start();
        }, this);
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
     * 初始化动画
     */
    private initAnimations(): void {
        const cards = [this.warriorCard, this.assassinCard, this.mageCard];
        cards.forEach((card, index) => {
            if (card) {
                card.setScale(0, 0, 1);
                tween(card)
                    .delay(0.1 * index)
                    .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                    .start();
            }
        });
    }

    onDestroy() {
        this.backButton?.node.off(Button.EventType.CLICK, this.onBackClick, this);
    }

    private onBackClick(): void {
        if (this.backButton) {
            tween(this.backButton.node)
                .to(0.1, { scale: new Vec3(0.95, 0.95, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .call(() => {
                    GameManager.instance?.returnToMainMenu();
                })
                .start();
        }
    }

    private onClassSelect(classId: string): void {
        // 检查是否解锁
        if (classId !== 'warrior' && !isClassUnlocked(classId, this.completedRuns)) {
            console.log(`[ClassSelectScene] ${classId} 职业尚未解锁！`);
            return;
        }

        console.log(`[ClassSelectScene] 选择职业: ${classId}`);
        
        // 选中动画
        const cardNode = classId === 'warrior' ? this.warriorCard : 
                        classId === 'assassin' ? this.assassinCard : this.mageCard;
        
        if (cardNode) {
            tween(cardNode)
                .to(0.1, { scale: new Vec3(0.95, 0.95, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .call(() => {
                    GameManager.instance?.startGame(classId);
                })
                .start();
        } else {
            GameManager.instance?.startGame(classId);
        }
    }
}
