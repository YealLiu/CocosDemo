/**
 * 启蒙 - Roguelike卡牌游戏
 * Cocos Creator 3.x 项目
 * 
 * 项目结构:
 * - assets/scripts/  TypeScript脚本
 * - assets/scenes/   场景文件
 * - assets/resources/ 资源文件
 * - assets/prefabs/  预制体
 */

// 主入口文件
import { GameState } from './scripts/GameState';
import { GameManager } from './scripts/GameManager';
import { BattleSystem } from './scripts/BattleSystem';
import { InputManager } from './scripts/InputManager';

// 导出主要类
export {
    GameState,
    GameManager,
    BattleSystem,
    InputManager
};
