/**
 * ClassSelectScene.ts - 职业选择场景控制器
 * 完善版 - 包含完整的职业展示和交互
 */

import { _decorator, Component, Node, Button, Label, Sprite, tween, Vec3, Color } from 'cc';
import { GameManager } from './GameManager';
import { ClassDatabase, isClassUnlocked } from './ClassDatabase';
const { ccclass, property } = _decorator;

@ccclass('ClassSelectScene')
export class ClassSelectScene extends Component {
    @property(Button)
    backButton: Button | null = null;

    @property(Node)
    warriorCard: Node | null = null;

    @property(Node)
    assassinCard: Node | null = null;

    @property(Node)
    mageCard: Node | null = null;

    @property(Label)
    warriorDescLabel: Label | null = null;

    @property(Label)
    assassinDescLabel: Label | null = null;

    @property(Label)
    mageDescLabel: Label | null = null;

    // 通关记录 (简化版，实际应从存档读取)
    private completedRuns: Record<string, number> = {};

    onLoad() {
        this.bindButtons();
        this.updateUI();
        this.initCardAnimations();
    }

    private bindButtons(): void {
        // 返回按钮
        if (this.backButton) {
            this.backButton.node.on(Button.EventType.CLICK, this.onBackClick, this);
            this.addButtonHoverEffect(this.backButton);
        } else {
            const backBtnNode = this.node.getChildByName('BackButton');
            if (backBtnNode) {
                const btn = backBtnNode.getComponent(Button);
                if (btn) {
                    this.backButton = btn;
                    btn.node.on(Button.EventType.CLICK, this.onBackClick, this);
                    this.addButtonHoverEffect(btn);
                }
            }
        }

        // 职业卡片点击
        this.bindCardClick(this.warriorCard, 'warrior');
        this.bindCardClick(this.assassinCard, 'assassin');
        this.bindCardClick(this.mageCard, 'mage');
    }

    private bindCardClick(cardNode: Node | null, classId: string): void {
        if (!cardNode) {
            // 尝试通过名称查找
            const nodeName = classId === 'warrior' ? 'WarriorCard' : 
                            classId === 'assassin' ? 'AssassinCard' : 'MageCard';
            cardNode = this.node.getChildByName(nodeName);
        }

        if (cardNode) {
            // 点击选择职业
            cardNode.on(Node.EventType.TOUCH_END, () => this.onClassSelect(classId), this);
            
            // 悬停效果
            cardNode.on(Node.EventType.MOUSE_ENTER, () => {
                if (classId === 'warrior' || isClassUnlocked(classId, this.completedRuns)) {
                    tween(cardNode)
                        .to(0.2, { scale: new Vec3(1.05, 1.05, 1) })
                        .start();
                }
            }, this);

            cardNode.on(Node.EventType.MOUSE_LEAVE, () => {
                tween(cardNode)
                    .to(0.2, { scale: new Vec3(1, 1, 1) })
                    .start();
            }, this);
        }
    }

    private addButtonHoverEffect(button: Button): void {
        const node = button.node;
        node.on(Node.EventType.MOUSE_ENTER, () => {
            tween(node).to(0.1, { scale: new Vec3(1.05, 1.05, 1) }).start();
        }, this);
        node.on(Node.EventType.MOUSE_LEAVE, () => {
            tween(node).to(0.1, { scale: new Vec3(1, 1, 1) }).start();
        }, this);
    }

    private initCardAnimations(): void {
        // 卡片入场动画
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

    private updateUI(): void {
        // 战士始终解锁
        this.setCardState(this.warriorCard, this.warriorDescLabel, 'warrior', false);
        
        // 刺客：通关1次解锁
        const assassinUnlocked = isClassUnlocked('assassin', this.completedRuns);
        this.setCardState(this.assassinCard, this.assassinDescLabel, 'assassin', !assassinUnlocked);
        
        // 法师：通关3次解锁
        const mageUnlocked = isClassUnlocked('mage', this.completedRuns);
        this.setCardState(this.mageCard, this.mageDescLabel, 'mage', !mageUnlocked);
    }

    private setCardState(cardNode: Node | null, descLabel: Label | null, classId: string, isLocked: boolean): void {
        if (!cardNode) return;

        const sprite = cardNode.getComponent(Sprite);
        
        if (isLocked) {
            // 锁定状态
            if (sprite) {
                sprite.color = new Color(80, 80, 80, 255);
            }
            
            // 显示锁定信息
            if (descLabel) {
                const unlockRequirement = classId === 'assassin' ? '通关1次解锁' : '通关3次解锁';
                descLabel.string = `🔒 ${unlockRequirement}`;
                descLabel.color = new Color(150, 150, 150, 255);
            }
        } else {
            // 解锁状态
            if (sprite) {
                sprite.color = new Color(255, 255, 255, 255);
            }

            // 显示职业描述
            if (descLabel) {
                const classData = ClassDatabase[classId];
                if (classData) {
                    descLabel.string = `${classData.description}\n初始遗物: ${classData.startingRelic}`;
                    descLabel.color = new Color(200, 200, 200, 255);
                }
            }
        }
    }

    private onBackClick(): void {
        tween(this.backButton!.node)
            .to(0.1, { scale: new Vec3(0.95, 0.95, 1) })
            .to(0.1, { scale: new Vec3(1, 1, 1) })
            .call(() => {
                GameManager.instance?.returnToMainMenu();
            })
            .start();
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
