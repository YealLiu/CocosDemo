/**
 * ClassSelectScene.ts - 职业选择场景控制器
 */

import { _decorator, Component, Node, Button, Label, Sprite } from 'cc';
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

    // 通关记录 (简化版，实际应从存档读取)
    private completedRuns: Record<string, number> = {};

    onLoad() {
        this.backButton?.node.on(Button.EventType.CLICK, this.onBackClick, this);
        
        // 绑定职业选择
        this.warriorCard?.on(Node.EventType.TOUCH_END, () => this.onClassSelect('warrior'));
        this.assassinCard?.on(Node.EventType.TOUCH_END, () => this.onClassSelect('assassin'));
        this.mageCard?.on(Node.EventType.TOUCH_END, () => this.onClassSelect('mage'));
        
        // 更新UI状态
        this.updateUI();
    }

    onDestroy() {
        this.backButton?.node.off(Button.EventType.CLICK, this.onBackClick, this);
    }

    private updateUI(): void {
        // 战士始终解锁
        this.setCardLockState(this.warriorCard, false);
        
        // 检查其他职业解锁状态
        this.setCardLockState(this.assassinCard, !isClassUnlocked('assassin', this.completedRuns));
        this.setCardLockState(this.mageCard, !isClassUnlocked('mage', this.completedRuns));
    }

    private setCardLockState(cardNode: Node | null, isLocked: boolean): void {
        if (!cardNode) return;
        
        // 这里可以设置锁定状态的视觉效果
        // 例如：显示锁定图标、降低透明度等
        if (isLocked) {
            cardNode.getComponent(Sprite)!.color.set(100, 100, 100, 255);
        }
    }

    private onBackClick(): void {
        GameManager.instance?.returnToMainMenu();
    }

    private onClassSelect(classId: string): void {
        // 检查是否解锁
        if (classId !== 'warrior' && !isClassUnlocked(classId, this.completedRuns)) {
            console.log('该职业尚未解锁！');
            return;
        }
        
        GameManager.instance?.startGame(classId);
    }
}
