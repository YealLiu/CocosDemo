# CocosDemo 项目构建说明

## 项目概述
- **项目名称**: 启蒙 (Qimeng) - Roguelike卡牌游戏
- **引擎版本**: Cocos Creator 3.8.0
- **目标平台**: Android (APK)
- **GitHub仓库**: https://github.com/YealLiu/CocosDemo.git

## 项目结构

```
qimeng-demo-cocos/
├── assets/
│   ├── Main.ts                    # 主入口文件
│   ├── scenes/                    # 场景文件
│   │   ├── MenuScene.scene        # 主菜单场景
│   │   ├── ClassSelectScene.scene # 职业选择场景
│   │   ├── MapScene.scene         # 地图场景
│   │   └── BattleScene.scene      # 战斗场景
│   ├── scripts/                   # TypeScript脚本
│   │   ├── GameManager.ts         # 游戏主管理器
│   │   ├── GameState.ts           # 游戏状态管理
│   │   ├── BattleSystem.ts        # 战斗系统
│   │   ├── CardDatabase.ts        # 卡牌数据库
│   │   ├── EnemyDatabase.ts       # 敌人数据库
│   │   ├── ClassDatabase.ts       # 职业数据库
│   │   ├── MenuScene.ts           # 菜单场景控制器
│   │   ├── ClassSelectScene.ts    # 职业选择控制器
│   │   ├── MapScene.ts            # 地图场景控制器
│   │   ├── BattleScene.ts         # 战斗场景控制器
│   │   ├── CardUI.ts              # 卡牌UI组件
│   │   └── InputManager.ts        # 输入管理器
│   ├── resources/                 # 游戏资源
│   └── prefabs/                   # 预制体
├── build/                         # 构建输出
├── settings/                      # 项目设置
├── Jenkinsfile                    # Jenkins CI配置
├── package.json                   # 项目配置
└── README.md                      # 项目说明
```

## 本地构建步骤

### 1. 环境要求
- Cocos Creator 3.8.0+
- Node.js 18+
- Android Studio (用于Android构建)
- Java JDK 17

### 2. 使用 Cocos Creator 构建

```bash
# 打开项目
cocos creator --path ./qimeng-demo-cocos

# 或使用 Cocos Dashboard 打开
```

在 Cocos Creator 中:
1. 选择 "项目" -> "构建发布"
2. 选择 Android 平台
3. 配置包名: `com.qimeng.game`
4. 点击 "构建"
5. 构建完成后点击 "生成"

### 3. 使用命令行构建

```bash
# 构建 Web 版本
npm run build:web

# 构建 Android 版本 (需要配置 Android SDK)
npm run build:android
```

### 4. 使用快速构建脚本

```bash
# 快速构建 APK (使用 WebView 包装)
./build-apk-fast.sh debug

# 或
./build-apk-fast.sh release
```

## Jenkins CI/CD 构建

### Jenkins 配置

1. **新建 Pipeline 项目**
   - 项目名: `qimeng-demo-cocos`
   - 类型: Pipeline

2. **配置源码管理**
   - Repository URL: `https://github.com/YealLiu/CocosDemo.git`
   - Branch: `*/main`

3. **Pipeline 配置**
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Script Path: `Jenkinsfile`

### 构建触发器

- SCM轮询: 每5分钟检查一次变更
- 手动触发
- Webhook触发 (推荐)

### 构建产物

构建成功后，APK文件位于:
```
output/qimeng-debug-{BUILD_NUMBER}.apk
output/qimeng-release-{BUILD_NUMBER}.apk
```

## Git 推送指南

### 配置 Git 远程仓库

```bash
# 使用 HTTPS
git remote set-url origin https://github.com/YealLiu/CocosDemo.git

# 或使用 SSH (需要配置 SSH Key)
git remote set-url origin git@github.com:YealLiu/CocosDemo.git
```

### 推送代码

```bash
# 添加所有更改
git add .

# 提交
git commit -m "你的提交信息"

# 推送到 GitHub
git push origin main
```

### 使用 GitHub CLI (推荐)

```bash
# 登录 GitHub
gh auth login

# 推送
git push origin main
```

## 游戏功能

### 已实现功能
- ✅ 主菜单场景
- ✅ 职业选择系统
- ✅ 地图探索系统
- ✅ 战斗系统
- ✅ 卡牌系统 (攻击/技能/能力)
- ✅ 敌人AI
- ✅ 遗物系统
- ✅ 能量系统
- ✅ 格挡系统

### 职业
1. **战士** - 高生命值，防御型
2. **法师** - 高能量，法术型
3. **刺客** - 高暴击，敏捷型

### 卡牌类型
- 🔴 攻击卡 - 造成伤害
- 🔵 技能卡 - 防御、抽牌等
- 🟢 能力卡 - 持续整场战斗的效果

## 开发团队

- **产品经理**: @📋产品大拿
- **游戏策划**: @🎮策划大神
- **前端开发**: @🎨前端大佬
- **后端开发**: ⚙️后端大牛
- **测试工程师**: @🧪测试达人
- **美术设计**: @🎨美术大神

## 许可证

MIT License
