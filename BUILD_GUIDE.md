# 启蒙游戏 - Android 构建指南

## 环境要求

### 必需软件

1. **Cocos Creator 3.8+**
   - 下载: https://www.cocos.com/creator-download
   - 安装后配置引擎路径

2. **Android Studio** (推荐) 或 **Android SDK + NDK**
   - Android SDK API Level 28+
   - Android NDK r21+
   - Gradle 7.0+

3. **Java JDK 17**
   ```bash
   # macOS (使用 Homebrew)
   brew install openjdk@17
   
   # 添加到 ~/.zshrc
   export JAVA_HOME=/opt/homebrew/opt/openjdk@17
   export PATH=$JAVA_HOME/bin:$PATH
   ```

4. **Node.js 18+** (已安装 ✓)

## 项目结构

```
qimeng-demo-cocos/
├── assets/
│   ├── scripts/          # TypeScript 游戏脚本
│   │   ├── GameState.ts      # 游戏状态管理
│   │   ├── CardDatabase.ts   # 卡牌数据
│   │   ├── EnemyDatabase.ts  # 敌人数据
│   │   ├── ClassDatabase.ts  # 职业数据
│   │   ├── BattleSystem.ts   # 战斗系统
│   │   ├── GameManager.ts    # 游戏管理器
│   │   ├── MenuScene.ts      # 菜单场景
│   │   ├── ClassSelectScene.ts
│   │   ├── MapScene.ts
│   │   ├── BattleScene.ts
│   │   ├── CardUI.ts
│   │   └── InputManager.ts
│   ├── scenes/           # 场景文件 (.scene)
│   ├── resources/        # 游戏资源
│   │   └── *.png         # 美术资源
│   └── Main.ts           # 主入口
├── build/                # 构建输出
├── build-android.sh      # Android 构建脚本
└── README.md
```

## 构建步骤

### 方法一: 使用 Cocos Creator (推荐)

1. **打开项目**
   ```bash
   # 使用 Cocos Dashboard 打开项目
   # 或通过命令行
   /Applications/CocosCreator.app/Contents/MacOS/CocosCreator --path ./qimeng-demo-cocos
   ```

2. **配置构建面板**
   - 点击菜单: `项目` -> `构建发布`
   - 选择平台: `Android`
   - 配置选项:
     - 包名: `com.qimeng.game`
     - 屏幕方向: `Portrait` (竖屏)
     - 目标 API Level: 28+
     - 构建模板: `Default`

3. **构建项目**
   - 点击 `构建` 按钮
   - 等待构建完成

4. **生成 APK**
   - 构建完成后点击 `生成`
   - 或使用 Android Studio 打开项目构建

### 方法二: 使用命令行脚本

```bash
cd qimeng-demo-cocos

# 构建调试版本
./build-android.sh debug

# 构建发布版本
./build-android.sh release
```

### 方法三: 使用 Android Studio

1. 在 Cocos Creator 中构建项目
2. 打开 `build/android/proj` 目录
3. 使用 Android Studio 打开项目
4. 点击 `Build` -> `Generate Signed Bundle / APK`

## 签名配置 (发布版本)

创建 `build/android/proj/app/keystore.properties`:

```properties
storeFile=my-release-key.keystore
storePassword=your-store-password
keyAlias=my-key-alias
keyPassword=your-key-password
```

生成签名密钥:
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

## 安装 APK

```bash
# 连接 Android 设备
adb devices

# 安装 APK
adb install -r Qimeng-release.apk

# 或安装调试版本
adb install -r Qimeng-debug.apk
```

## 常见问题

### 1. 找不到 Android SDK
```bash
# 设置环境变量
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export ANDROID_NDK_ROOT=$ANDROID_SDK_ROOT/ndk/21.4.7075529
```

### 2. Gradle 构建失败
```bash
# 清理构建缓存
cd build/android/proj
./gradlew clean
./gradlew assembleDebug
```

### 3. Cocos Creator 构建失败
- 确保项目路径没有中文
- 检查 Node.js 版本 (需要 18+)
- 重新安装依赖: `rm -rf node_modules && npm install`

## APK 输出路径

构建完成后 APK 位于:
```
# 调试版本
build/android/proj/build/outputs/apk/debug/app-debug.apk

# 发布版本
build/android/proj/build/outputs/apk/release/app-release.apk

# 脚本会自动复制到项目根目录
Qimeng-debug.apk
Qimeng-release.apk
```

## 性能优化建议

1. **纹理压缩**: 使用 ETC2/ASTC 格式
2. **图集合并**: 使用 Sprite Atlas
3. **代码分割**: 按需加载场景
4. **资源压缩**: 压缩图片和音频
5. **对象池**: 复用卡牌和特效对象

## 游戏操作

- **点击卡牌**: 查看详情
- **向上滑动卡牌**: 出牌
- **点击结束回合**: 结束当前回合
- **竖屏游玩**: 支持手机竖屏模式
