# 启蒙 (Qimeng) - Roguelike卡牌游戏

## 项目概述

**启蒙**是一款受《杀戮尖塔》启发的Roguelike卡牌游戏，采用Cocos Creator 3.x引擎开发，目标平台为Android移动端。

- **项目名称**: 启蒙 (Qimeng)
- **游戏类型**: Roguelike / 卡牌构筑 / 回合制战斗
- **开发引擎**: Cocos Creator 3.8+
- **目标平台**: Android (APK)
- **编程语言**: TypeScript

## 核心玩法

### 游戏目标
玩家选择一名英雄职业，通过爬塔战斗，击败各层的敌人，最终战胜Boss通关。游戏包含3个楼层，每层楼都有普通敌人、精英敌人和Boss等待挑战。

### 游戏流程
1. **主菜单** → 选择开始游戏
2. **职业选择** → 选择战士/刺客/法师（部分职业需解锁）
3. **地图探索** → 在地图上选择战斗、精英、休息或商店节点
4. **回合制战斗** → 使用卡牌击败敌人
5. **爬塔通关** → 击败第3层Boss获得胜利

### 战斗系统
- **能量系统**: 每回合拥有3点能量，打出卡牌消耗能量
- **手牌机制**: 每回合抽取5张牌，弃牌进入弃牌堆，抽牌堆空时洗牌
- **格挡机制**: 技能卡可获得格挡，抵消受到的伤害（部分敌人可破甲）
- **能力系统**: 能力卡提供持续整场战斗的增益效果

## 项目结构

```
qimeng-demo-cocos/
├── assets/                    # 游戏资源
│   ├── scripts/              # TypeScript脚本
│   │   ├── GameManager.ts    # 游戏主管理器（场景切换、流程控制）
│   │   ├── GameState.ts      # 游戏状态管理（玩家数据、战斗状态）
│   │   ├── BattleSystem.ts   # 战斗系统（回合逻辑、胜负判定）
│   │   ├── CardDatabase.ts   # 卡牌数据库与效果实现
│   │   ├── EnemyDatabase.ts  # 敌人数据库与AI行为
│   │   ├── ClassDatabase.ts  # 职业数据库
│   │   ├── MenuScene.ts      # 主菜单场景控制器
│   │   ├── ClassSelectScene.ts # 职业选择场景
│   │   ├── MapScene.ts       # 地图场景控制器
│   │   ├── BattleScene.ts    # 战斗场景控制器
│   │   ├── CardUI.ts         # 卡牌UI组件
│   │   └── InputManager.ts   # 输入管理器
│   ├── scenes/               # 场景文件
│   │   ├── MenuScene.scene   # 主菜单场景
│   │   ├── ClassSelect.scene # 职业选择场景
│   │   ├── MapScene.scene    # 地图场景
│   │   └── BattleScene.scene # 战斗场景
│   ├── resources/            # 动态加载资源
│   │   ├── cards/            # 卡牌图片
│   │   ├── characters/       # 角色图片
│   │   ├── enemies/          # 敌人图片
│   │   ├── ui/               # UI素材
│   │   └── fonts/            # 字体文件
│   └── prefabs/              # 预制体
│       ├── Card.prefab       # 卡牌预制体
│       └── Enemy.prefab      # 敌人预制体
├── build/                    # 构建输出
├── settings/                 # 项目设置
├── package.json              # 项目配置
└── README.md                 # 项目说明
```

## 技术架构

### 设计模式
- **单例模式**: GameManager、GameState、BattleSystem 使用单例管理全局状态
- **状态模式**: 游戏状态通过 ScreenType 枚举管理
- **事件驱动**: 战斗系统使用 EventTarget 进行事件通信
- **数据驱动**: 卡牌、敌人、职业数据使用数据库模式管理

### 核心模块

#### 1. GameManager（游戏管理器）
负责场景切换和游戏流程控制：
- `switchScene()`: 切换场景
- `startGame()`: 开始新游戏
- `enterNode()`: 进入地图节点
- `gameOver()`: 游戏结束处理

#### 2. GameState（游戏状态）
管理所有游戏数据：
- 玩家数据（HP、金币、卡组、遗物、能力）
- 战斗状态（回合、手牌、能量、格挡）
- 地图进度（当前楼层、节点）
- 提供抽牌、洗牌等操作方法

#### 3. BattleSystem（战斗系统）
处理战斗核心逻辑：
- `startBattle()`: 开始战斗
- `playCard()`: 打出卡牌
- `endTurn()`: 结束回合
- `enemyTurn()`: 敌人AI回合
- 战斗胜负判定

#### 4. 数据库模块
- **CardDatabase**: 定义所有卡牌数据和效果
- **EnemyDatabase**: 定义敌人属性、意图和行为
- **ClassDatabase**: 定义职业属性、初始卡组、遗物

## 开发环境

### 必需软件
1. **Cocos Creator 3.8+**
   - 下载地址: https://www.cocos.com/creator-download

2. **Android Studio**
   - 用于 Android SDK 和构建工具

3. **Node.js 18+**
   - 当前版本: v25.8.1

4. **Java JDK 17**
   - Android 构建必需

### 打开项目
```bash
# 使用命令行打开
cocos creator --path ./qimeng-demo-cocos

# 或通过 Cocos Dashboard 打开
```

## 构建发布

### Android APK构建步骤
1. 打开 Cocos Creator
2. 选择 **项目** → **构建发布**
3. 选择 **Android** 平台
4. 配置包名: `com.qimeng.game`
5. 选择构建模板
6. 点击 **构建**
7. 构建完成后点击 **生成**

### APK输出路径
```
build/android/proj/build/outputs/apk/release/qimeng-release.apk
```

## 版本历史

### v1.0.0 (Demo版)
- 基础战斗系统
- 3个可玩职业（战士、刺客、法师）
- 20+张卡牌
- 7种敌人（含Boss）
- 3层爬塔关卡

## 团队

- **产品经理**: @📋产品大拿
- **游戏策划**: @🎮策划大神
- **前端开发**: @🎨前端大佬
- **后端开发**: @⚙️后端大牛
- **测试工程师**: @🧪测试达人
- **游戏美术**: @🎨美术大神

## 许可证

本项目为内部Demo项目，仅供学习交流使用。
