/**
 * GameManager.ts - 游戏主管理器
 * 负责场景切换、游戏流程控制
 */

import { _decorator, Component, Node, director, Director } from 'cc';
import { GameState, Player, ScreenType } from './GameState';
import { ClassDatabase } from './ClassDatabase';
import { getRandomEnemy, getEliteEnemy, getBoss } from './EnemyDatabase';

const { ccclass, property } = _decorator;

// 场景名称映射
const SceneNames: Record<ScreenType, string> = {
    [ScreenType.MENU]: 'MenuScene',
    [ScreenType.CLASS_SELECT]: 'ClassSelectScene',
    [ScreenType.MAP]: 'MapScene',
    [ScreenType.BATTLE]: 'BattleScene'
};

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager | null = null;

    // 场景加载中
    private isLoading: boolean = false;

    onLoad() {
        if (GameManager.instance === null) {
            GameManager.instance = this;
            director.addPersistRootNode(this.node);
        } else {
            this.destroy();
            return;
        }
    }

    onDestroy() {
        if (GameManager.instance === this) {
            GameManager.instance = null;
        }
    }

    /**
     * 切换到指定场景
     */
    public switchScene(screenType: ScreenType): void {
        if (this.isLoading) return;
        
        const gameState = GameState.instance;
        gameState.currentScreen = screenType;
        
        const sceneName = SceneNames[screenType];
        if (sceneName) {
            this.isLoading = true;
            director.loadScene(sceneName, () => {
                this.isLoading = false;
            });
        }
    }

    /**
     * 开始新游戏
     */
    public startGame(classId: string): void {
        const gameState = GameState.instance;
        const classData = ClassDatabase[classId];
        
        if (!classData) {
            console.error(`Class ${classId} not found`);
            return;
        }
        
        // 创建玩家
        gameState.player = new Player(classId, classData);
        gameState.map.floor = 1;
        
        // 切换到地图场景
        this.switchScene(ScreenType.MAP);
    }

    /**
     * 进入地图节点
     */
    public enterNode(nodeType: string): void {
        const gameState = GameState.instance;
        
        switch (nodeType) {
            case 'battle':
                const enemyId = getRandomEnemy(gameState.map.floor);
                this.enterBattle(enemyId);
                break;
            case 'elite':
                this.enterBattle(getEliteEnemy());
                break;
            case 'rest':
                this.rest();
                break;
            case 'shop':
                // 商店功能暂不实现
                console.log('商店功能在完整版中开放！');
                break;
        }
    }

    /**
     * 进入Boss战
     */
    public enterBoss(): void {
        this.enterBattle(getBoss());
    }

    /**
     * 进入战斗
     */
    private enterBattle(enemyId: string): void {
        const gameState = GameState.instance;
        // 保存当前节点信息
        gameState.map.currentNode = enemyId;
        // 切换到战斗场景
        this.switchScene(ScreenType.BATTLE);
    }

    /**
     * 休息恢复
     */
    private rest(): void {
        const gameState = GameState.instance;
        if (!gameState.player) return;
        
        const healAmount = Math.floor(gameState.player.maxHp * 0.3);
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
        
        // 显示恢复提示
        console.log(`在篝火旁休息，恢复了${healAmount}点生命！`);
    }

    /**
     * 战斗胜利后返回地图
     */
    public returnToMap(): void {
        const gameState = GameState.instance;
        
        // 检查是否是Boss战
        if (gameState.currentEnemy?.isBoss) {
            gameState.nextFloor();
            
            // 检查通关
            if (gameState.map.floor > 3) {
                this.gameComplete();
                return;
            }
        }
        
        this.switchScene(ScreenType.MAP);
    }

    /**
     * 游戏通关
     */
    private gameComplete(): void {
        console.log('恭喜！你通关了《启蒙》Demo版！');
        this.returnToMainMenu();
    }

    /**
     * 游戏结束
     */
    public gameOver(): void {
        const gameState = GameState.instance;
        gameState.resetGame();
        this.returnToMainMenu();
    }

    /**
     * 返回主菜单
     */
    public returnToMainMenu(): void {
        this.switchScene(ScreenType.MENU);
    }

    /**
     * 显示职业选择
     */
    public showClassSelect(): void {
        this.switchScene(ScreenType.CLASS_SELECT);
    }

    /**
     * 获取当前楼层
     */
    public getCurrentFloor(): number {
        return GameState.instance.map.floor;
    }

    /**
     * 获取玩家数据
     */
    public getPlayer(): Player | null {
        return GameState.instance.player;
    }
}
