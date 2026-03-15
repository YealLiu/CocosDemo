/**
 * InputManager.ts - 输入管理器
 * 处理触摸输入、手势识别
 */

import { _decorator, Component, Node, EventTouch, Vec2, Vec3, director, Canvas } from 'cc';
const { ccclass, property } = _decorator;

// 手势类型
export enum GestureType {
    TAP = 'tap',
    SWIPE_UP = 'swipe_up',
    SWIPE_DOWN = 'swipe_down',
    SWIPE_LEFT = 'swipe_left',
    SWIPE_RIGHT = 'swipe_right',
    LONG_PRESS = 'long_press'
}

// 手势数据
export interface GestureData {
    type: GestureType;
    startPos: Vec2;
    endPos: Vec2;
    delta: Vec2;
    duration: number;
}

@ccclass('InputManager')
export class InputManager extends Component {
    public static instance: InputManager | null = null;

    // 触摸阈值
    private readonly SWIPE_THRESHOLD = 50;
    private readonly LONG_PRESS_DURATION = 500;

    // 触摸状态
    private isTouching: boolean = false;
    private touchStartTime: number = 0;
    private touchStartPos: Vec2 = new Vec2();
    private longPressTimer: number = -1;

    // 手势回调
    private gestureCallbacks: Map<GestureType, ((data: GestureData) => void)[]> = new Map();

    onLoad() {
        if (InputManager.instance === null) {
            InputManager.instance = this;
        } else {
            this.destroy();
            return;
        }

        // 注册全局触摸事件
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onDestroy() {
        if (InputManager.instance === this) {
            InputManager.instance = null;
        }

        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    /**
     * 注册手势回调
     */
    public onGesture(type: GestureType, callback: (data: GestureData) => void): void {
        if (!this.gestureCallbacks.has(type)) {
            this.gestureCallbacks.set(type, []);
        }
        this.gestureCallbacks.get(type)!.push(callback);
    }

    /**
     * 取消注册手势回调
     */
    public offGesture(type: GestureType, callback: (data: GestureData) => void): void {
        const callbacks = this.gestureCallbacks.get(type);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // ========== 触摸事件处理 ==========

    private onTouchStart(event: EventTouch): void {
        this.isTouching = true;
        this.touchStartTime = Date.now();
        this.touchStartPos = event.getLocation();

        // 启动长按计时器
        this.longPressTimer = setTimeout(() => {
            if (this.isTouching) {
                this.triggerGesture(GestureType.LONG_PRESS, {
                    type: GestureType.LONG_PRESS,
                    startPos: this.touchStartPos,
                    endPos: this.touchStartPos,
                    delta: new Vec2(0, 0),
                    duration: this.LONG_PRESS_DURATION
                });
            }
        }, this.LONG_PRESS_DURATION);
    }

    private onTouchMove(event: EventTouch): void {
        if (!this.isTouching) return;

        // 如果移动距离超过阈值，取消长按
        const currentPos = event.getLocation();
        const delta = currentPos.subtract(this.touchStartPos);
        
        if (delta.length() > this.SWIPE_THRESHOLD && this.longPressTimer !== -1) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = -1;
        }
    }

    private onTouchEnd(event: EventTouch): void {
        if (!this.isTouching) return;

        this.isTouching = false;

        // 清除长按计时器
        if (this.longPressTimer !== -1) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = -1;
        }

        const endPos = event.getLocation();
        const delta = endPos.subtract(this.touchStartPos);
        const duration = Date.now() - this.touchStartTime;

        // 识别手势
        const gestureType = this.recognizeGesture(delta, duration);
        if (gestureType) {
            this.triggerGesture(gestureType, {
                type: gestureType,
                startPos: this.touchStartPos,
                endPos: endPos,
                delta: delta,
                duration: duration
            });
        }
    }

    private onTouchCancel(): void {
        this.isTouching = false;
        
        if (this.longPressTimer !== -1) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = -1;
        }
    }

    /**
     * 识别手势类型
     */
    private recognizeGesture(delta: Vec2, duration: number): GestureType | null {
        const distance = delta.length();

        // 距离太小，视为点击
        if (distance < this.SWIPE_THRESHOLD) {
            return GestureType.TAP;
        }

        // 判断滑动方向
        const absX = Math.abs(delta.x);
        const absY = Math.abs(delta.y);

        if (absY > absX) {
            // 垂直滑动
            return delta.y > 0 ? GestureType.SWIPE_UP : GestureType.SWIPE_DOWN;
        } else {
            // 水平滑动
            return delta.x > 0 ? GestureType.SWIPE_RIGHT : GestureType.SWIPE_LEFT;
        }
    }

    /**
     * 触发手势回调
     */
    private triggerGesture(type: GestureType, data: GestureData): void {
        const callbacks = this.gestureCallbacks.get(type);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }

    /**
     * 震动反馈
     */
    public vibrate(pattern: number | number[] = 50): void {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
}
