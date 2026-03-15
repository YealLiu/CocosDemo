# Cocos Creator 项目搭建与 APK 打包文档

## 项目概述
- **项目名称**: 启蒙 (Qimeng) - Roguelike卡牌游戏
- **项目路径**: `/Users/admin/.openclaw/workspace/agents/product-manager-agent/qimeng-demo-cocos/`
- **目标平台**: Android (APK)
- **开发框架**: Cocos Creator 3.x

## 环境要求

### 必需软件
1. **Cocos Creator 3.8+**
   - 下载地址: https://www.cocos.com/creator-download
   - 安装后配置引擎路径

2. **Android Studio**
   - 用于 Android SDK 和构建工具
   - 或单独安装 Android SDK + NDK

3. **Node.js 18+** (已安装 ✓)
   - 当前版本: v25.8.1

4. **Java JDK 17**
   - Android 构建必需

5. **Python 3.x**
   - 某些构建脚本需要

## 项目结构

```
qimeng-demo-cocos/
├── assets/                    # 游戏资源
│   ├── scripts/              # TypeScript/JavaScript 脚本
│   │   ├── GameState.ts      # 游戏状态管理
│   │   ├── CardSystem.ts     # 卡牌系统
│   │   ├── BattleSystem.ts   # 战斗系统
│   │   ├── EnemySystem.ts    # 敌人系统
│   │   ├── UIManager.ts      # UI管理器
│   │   └── GameManager.ts    # 游戏主管理器
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
│       ├── Enemy.prefab      # 敌人预制体
│       └── UIComponents/     # UI组件预制体
├── build/                    # 构建输出
├── native/                   # 原生平台代码
├── profiles/                 # 构建配置
├── settings/                 # 项目设置
├── package.json              # 项目配置
└── README.md                 # 项目说明
```

## 迁移计划

### 第一阶段: 项目初始化
1. 安装 Cocos Creator
2. 创建新项目
3. 配置项目设置

### 第二阶段: 资源迁移
1. 导入美术资源 (media/ 目录)
2. 创建 UI 预制体
3. 设置场景布局

### 第三阶段: 代码迁移
1. 将 game.js 拆分为 TypeScript 模块
2. 实现游戏管理器
3. 实现 UI 管理器
4. 实现战斗系统

### 第四阶段: Android 打包
1. 配置 Android 构建设置
2. 设置签名密钥
3. 构建 APK

## 代码迁移对照表

| 原文件 | 新文件 | 说明 |
|--------|--------|------|
| game.js | scripts/GameState.ts | 游戏状态 |
| game.js | scripts/CardSystem.ts | 卡牌数据库和逻辑 |
| game.js | scripts/BattleSystem.ts | 战斗逻辑 |
| game.js | scripts/EnemySystem.ts | 敌人数据和AI |
| index.html | scenes/*.scene | UI场景 |
| style.css | assets/styles/ | UI样式(通过节点属性实现) |
| mobile.js | scripts/InputManager.ts | 触摸输入处理 |

## 构建步骤

### 1. 安装 Cocos Creator
```bash
# 下载并安装 Cocos Dashboard
# https://download.cocos.com/CocosDashboard/v2.2.0/CocosDashboard-v2.2.0-mac.dmg

# 通过 Dashboard 安装 Cocos Creator 3.8.1
```

### 2. 打开项目
```bash
# 使用命令行打开
cocos creator --path ./qimeng-demo-cocos

# 或通过 Dashboard 打开
```

### 3. 配置 Android 构建
```bash
# 在项目设置中配置:
# - Android SDK 路径
# - Android NDK 路径
# - Java JDK 路径
```

### 4. 构建 APK
```bash
# 通过 Cocos Creator 构建面板:
# 1. 选择 "项目" -> "构建发布"
# 2. 选择 Android 平台
# 3. 配置包名: com.qimeng.game
# 4. 选择构建模板
# 5. 点击 "构建"
# 6. 构建完成后点击 "生成"
```

## 注意事项

### 性能优化
- 使用对象池管理卡牌和特效
- 纹理压缩 (ETC2/ASTC)
- 限制同时显示的粒子数量
- 使用 Sprite Atlas 合并图集

### 适配
- 参考原 mobile.js 的竖屏适配
- 安全区域处理 (刘海屏/灵动岛)
- 多分辨率适配

### 输入处理
- 原滑动出牌手势需要重新实现
- 添加触摸反馈 (震动)
- 支持多点触控

## APK 输出路径
构建完成后 APK 位于:
```
build/android/proj/build/outputs/apk/release/qimeng-release.apk
```
