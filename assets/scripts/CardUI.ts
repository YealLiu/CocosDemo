/**
 * CardUI.ts - 卡牌UI组件
 * 处理卡牌的显示、动画和交互
 */

import { _decorator, Component, Node, Label, Sprite, Color, Vec3, tween, UITransform, EventTouch, UIOpacity } from 'cc';
import { CardType } from './GameState';
import { CardDatabase, getCardTypeColor } from './CardDatabase';
const { ccclass, property } = _decorator;

@ccclass('CardUI')
export class CardUI extends Component {
    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    costLabel: Label | null = null;

    @property(Label)
    descLabel: Label | null = null;

    @property(Sprite)
    typeIcon: Sprite | null = null;

    @property(Sprite)
    background: Sprite | null = null;

    // 卡牌数据
    private cardId: string = '';
    private cardIndex: number = -1;
    private isDragging: boolean = false;
    private dragStartPos: Vec3 = new Vec3();
    private touchStartY: number = 0;

    // 回调函数
    private onPlayCallback: ((index: number) => void) | null = null;

    onLoad() {
        // 添加触摸事件
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    /**
     * 设置卡牌数据
     */
    public setCardData(cardId: string, index: number): void {
        this.cardId = cardId;
        this.cardIndex = index;

        const cardData = CardDatabase[cardId];
        if (!cardData) return;

        // 更新UI
        if (this.nameLabel) {
            this.nameLabel.string = cardData.name;
        }
        if (this.costLabel) {
            this.costLabel.string = cardData.cost.toString();
        }
        if (this.descLabel) {
            this.descLabel.string = cardData.description;
        }

        // 更新类型颜色
        const color = getCardTypeColor(cardData.type);
        if (this.typeIcon) {
            this.typeIcon.color = new Color(color);
        }
    }

    /**
     * 设置出牌回调
     */
    public setPlayCallback(callback: (index: number) => void): void {
        this.onPlayCallback = callback;
    }

    // ========== 触摸事件处理 ==========

    private onTouchStart(event: EventTouch): void {
        this.isDragging = true;
        this.dragStartPos = this.node.position.clone();
        this.touchStartY = event.getLocationY();

        // 放大动画
        tween(this.node)
            .to(0.1, { scale: new Vec3(1.1, 1.1, 1) })
            .start();
    }

    private onTouchMove(event: EventTouch): void {
        if (!this.isDragging) return;

        const deltaY = event.getLocationY() - this.touchStartY;
        const newY = this.dragStartPos.y + deltaY;

        // 只允许向上拖动
        if (newY > this.dragStartPos.y) {
            this.node.setPosition(this.dragStartPos.x, newY, 0);

            // 透明度变化
            const opacity = Math.max(0.5, 1 - Math.abs(deltaY) / 500);
            const uiOpacity = this.node.getComponent(UIOpacity);
            if (uiOpacity) {
                uiOpacity.opacity = opacity * 255;
            }
        }
    }

    private onTouchEnd(event: EventTouch): void {
        if (!this.isDragging) return;

        const deltaY = event.getLocationY() - this.touchStartY;
        this.isDragging = false;

        // 判断是否出牌（向上滑动超过阈值）
        if (deltaY < -100) {
            // 出牌
            this.playCard();
        } else {
            // 返回原位
            this.returnToOriginal();
        }
    }

    private onTouchCancel(): void {
        this.isDragging = false;
        this.returnToOriginal();
    }

    /**
     * 出牌
     */
    private playCard(): void {
        // 出牌动画
        tween(this.node)
            .to(0.2, { scale: new Vec3(0, 0, 1), position: new Vec3(this.node.position.x, this.node.position.y + 200, 0) })
            .call(() => {
                if (this.onPlayCallback) {
                    this.onPlayCallback(this.cardIndex);
                }
            })
            .start();
    }

    /**
     * 返回原位
     */
    private returnToOriginal(): void {
        tween(this.node)
            .to(0.2, { 
                position: this.dragStartPos,
                scale: new Vec3(1, 1, 1)
            })
            .start();

        // 恢复透明度
        const uiOpacity = this.node.getComponent(UIOpacity);
        if (uiOpacity) {
            uiOpacity.opacity = 255;
        }
    }

    /**
     * 播放选中动画
     */
    public playSelectAnimation(): void {
        tween(this.node)
            .to(0.1, { scale: new Vec3(1.05, 1.05, 1) })
            .to(0.1, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    /**
     * 播放错误动画
     */
    public playErrorAnimation(): void {
        const originalX = this.node.position.x;
        
        tween(this.node)
            .by(0.05, { position: new Vec3(10, 0, 0) })
            .by(0.05, { position: new Vec3(-20, 0, 0) })
            .by(0.05, { position: new Vec3(20, 0, 0) })
            .by(0.05, { position: new Vec3(-10, 0, 0) })
            .call(() => {
                this.node.setPosition(originalX, this.node.position.y, 0);
            })
            .start();
    }
}
