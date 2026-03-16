/**
 * ClassSelectScene.ts - 职业选择场景控制器
 * 动态创建UI版本
 */

import { _decorator, Component, Node, Button, Label, Sprite, Color, Vec3, tween, UITransform } from 'cc';
import { GameManager } from './GameManager';
import { ClassDatabase, isClassUnlocked } from './ClassDatabase';
const { ccclass, property } = _decorator;

@ccclass('ClassSelectScene')
export class ClassSelectScene extends Component {
    private completedRuns: Record<string, number> = {};

    onLoad() {
        console.log('[ClassSelectScene] onLoad - 动态创建UI');
        this.createBackground();
        this.createTitle();
        this.createBackButton();
        this.createClassCards();
    }

    private createBackground(): void {
        const bgNode = new Node('Background');
        this.node.addChild(bgNode);
        
        const uiTransform = bgNode.addComponent(UITransform);
        uiTransform.setContentSize(720, 1280);
        
        const sprite = bgNode.addComponent(Sprite);
        sprite.color = new Color(25, 20, 35, 255);
        sprite.type = 0;
        
        bgNode.setPosition(0, 0, 0);
    }

    private createTitle(): void {
        const titleNode = new Node('Title');
        this.node.addChild(titleNode);
        titleNode.setPosition(0, 450, 0);
        
        const uiTransform = titleNode.addComponent(UITransform);
        uiTransform.setContentSize(500, 100);
        
        const label = titleNode.addComponent(Label);
        label.string = '选择你的职业';
        label.fontSize = 56;
        label.fontFamily = 'Arial';
        label.horizontalAlign = 1;
        label.verticalAlign = 1;
        label.color = new Color(255, 215, 100, 255);
        label.isBold = true;
    }

    private createBackButton(): void {
        const btnNode = new Node('BackButton');
        this.node.addChild(btnNode);
        btnNode.setPosition(-250, 550, 0);
        
        const uiTransform = btnNode.addComponent(UITransform);
        uiTransform.setContentSize(120, 60);
        
        const sprite = btnNode.addComponent(Sprite);
        sprite.color = new Color(100, 100, 100, 255);
        sprite.type = 1;
        
        const button = btnNode.addComponent(Button);
        
        const labelNode = new Node('Label');
        btnNode.addChild(labelNode);
        const labelTransform = labelNode.addComponent(UITransform);
        labelTransform.setContentSize(120, 60);
        const label = labelNode.addComponent(Label);
        label.string = '返回';
        label.fontSize = 28;
        label.horizontalAlign = 1;
        label.verticalAlign = 1;
        label.color = new Color(255, 255, 255, 255);
        
        btnNode.on(Node.EventType.TOUCH_END, () => {
            tween(btnNode)
                .to(0.1, { scale: new Vec3(0.95, 0.95, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .call(() => {
                    GameManager.instance?.returnToMainMenu();
                })
                .start();
        }, this);
        
        this.addHoverEffect(btnNode);
    }

    private createClassCards(): void {
        const classes = [
            { id: 'warrior', name: '战士', y: 150, color: new Color(180, 80, 80, 255) },
            { id: 'assassin', name: '刺客', y: 0, color: new Color(80, 80, 120, 255) },
            { id: 'mage', name: '法师', y: -150, color: new Color(80, 80, 120, 255) }
        ];

        classes.forEach((cls, index) => {
            const isLocked = cls.id !== 'warrior' && !isClassUnlocked(cls.id, this.completedRuns);
            this.createClassCard(cls.id, cls.name, cls.y, cls.color, isLocked, index);
        });
    }

    private createClassCard(classId: string, name: string, y: number, bgColor: Color, isLocked: boolean, index: number): void {
        const cardNode = new Node(`${name}Card`);
        this.node.addChild(cardNode);
        cardNode.setPosition(0, y, 0);
        
        const uiTransform = cardNode.addComponent(UITransform);
        uiTransform.setContentSize(400, 120);
        
        const sprite = cardNode.addComponent(Sprite);
        sprite.color = isLocked ? new Color(80, 80, 80, 255) : bgColor;
        sprite.type = 1;
        
        // 名称
        const nameNode = new Node('Name');
        cardNode.addChild(nameNode);
        nameNode.setPosition(0, 20, 0);
        const nameTransform = nameNode.addComponent(UITransform);
        nameTransform.setContentSize(380, 50);
        const nameLabel = nameNode.addComponent(Label);
        nameLabel.string = isLocked ? `🔒 ${name}` : name;
        nameLabel.fontSize = 36;
        nameLabel.horizontalAlign = 1;
        nameLabel.verticalAlign = 1;
        nameLabel.color = new Color(255, 255, 255, 255);
        
        // 描述
        const descNode = new Node('Desc');
        cardNode.addChild(descNode);
        descNode.setPosition(0, -25, 0);
        const descTransform = descNode.addComponent(UITransform);
        descTransform.setContentSize(380, 40);
        const descLabel = descNode.addComponent(Label);
        
        if (isLocked) {
            descLabel.string = classId === 'assassin' ? '通关1次解锁' : '通关3次解锁';
            descLabel.color = new Color(150, 150, 150, 255);
        } else {
            const classData = ClassDatabase[classId];
            descLabel.string = `生命: ${classData.maxHp} | 遗物: ${classData.relic.name}`;
            descLabel.color = new Color(200, 200, 200, 255);
        }
        descLabel.fontSize = 20;
        descLabel.horizontalAlign = 1;
        descLabel.verticalAlign = 1;
        
        // 入场动画
        cardNode.setScale(0, 0, 1);
        tween(cardNode)
            .delay(0.1 * index)
            .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
        
        // 点击事件
        if (!isLocked) {
            cardNode.on(Node.EventType.TOUCH_END, () => {
                tween(cardNode)
                    .to(0.1, { scale: new Vec3(0.95, 0.95, 1) })
                    .to(0.1, { scale: new Vec3(1, 1, 1) })
                    .call(() => {
                        GameManager.instance?.startGame(classId);
                    })
                    .start();
            }, this);
            
            this.addHoverEffect(cardNode);
        }
    }

    private addHoverEffect(node: Node): void {
        node.on(Node.EventType.MOUSE_ENTER, () => {
            tween(node).to(0.1, { scale: new Vec3(1.05, 1.05, 1) }).start();
        }, this);
        node.on(Node.EventType.MOUSE_LEAVE, () => {
            tween(node).to(0.1, { scale: new Vec3(1, 1, 1) }).start();
        }, this);
    }
}
