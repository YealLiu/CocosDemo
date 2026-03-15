#!/bin/bash
# 启蒙游戏 Android APK 打包脚本 (增强版)
# 支持本地构建和 Jenkins CI 构建

set -e

# 配置
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_TYPE="${1:-debug}"
APK_OUTPUT_DIR="$PROJECT_DIR/build/android/proj/build/outputs/apk"
PACKAGE_NAME="com.qimeng.game"
APP_NAME="启蒙"

echo "=========================================="
echo "启蒙游戏 Android 构建脚本"
echo "=========================================="
echo "项目路径: $PROJECT_DIR"
echo "构建类型: $BUILD_TYPE"
echo ""

# 检查环境
command -v java >/dev/null 2>&1 || { echo "❌ 错误: 需要 Java JDK"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ 错误: 需要 Node.js"; exit 1; }

echo "✅ Java 版本:"
java -version 2>&1 | head -1
echo ""

# 检查 Cocos Creator
COCOS_CREATOR_PATH=""
if [ -d "/Applications/CocosCreator.app" ]; then
    COCOS_CREATOR_PATH="/Applications/CocosCreator.app/Contents/MacOS/CocosCreator"
elif [ -d "$HOME/Applications/CocosCreator.app" ]; then
    COCOS_CREATOR_PATH="$HOME/Applications/CocosCreator.app/Contents/MacOS/CocosCreator"
fi

# 如果找不到 Cocos Creator，尝试 Dashboard 路径
if [ -z "$COCOS_CREATOR_PATH" ] || [ ! -f "$COCOS_CREATOR_PATH" ]; then
    # 尝试从 CocosDashboard 查找已安装的 Creator
    COCOS_DASHBOARD_PATH="/Applications/CocosDashboard.app/Contents/MacOS/CocosDashboard"
    if [ -f "$COCOS_DASHBOARD_PATH" ]; then
        echo "ℹ️  找到 CocosDashboard，但未找到 Cocos Creator"
        echo "   请通过 CocosDashboard 安装 Cocos Creator 3.x"
    fi
fi

# 检查 Android SDK
ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
if [ -z "$ANDROID_SDK_ROOT" ]; then
    if [ -d "$HOME/Library/Android/sdk" ]; then
        ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
        export ANDROID_SDK_ROOT
        echo "✅ 找到 Android SDK: $ANDROID_SDK_ROOT"
    else
        echo "⚠️  警告: 未找到 Android SDK"
        echo "   请安装 Android Studio 或设置 ANDROID_SDK_ROOT 环境变量"
    fi
else
    echo "✅ Android SDK: $ANDROID_SDK_ROOT"
fi

# 检查 Android NDK
if [ -n "$ANDROID_SDK_ROOT" ] && [ -d "$ANDROID_SDK_ROOT/ndk" ]; then
    NDK_VERSION=$(ls -1 "$ANDROID_SDK_ROOT/ndk" 2>/dev/null | sort -V | tail -1)
    if [ -n "$NDK_VERSION" ]; then
        export ANDROID_NDK_ROOT="$ANDROID_SDK_ROOT/ndk/$NDK_VERSION"
        echo "✅ Android NDK: $ANDROID_NDK_ROOT"
    fi
fi

echo ""
echo "=========================================="
echo "开始构建..."
echo "=========================================="

# 创建构建目录
mkdir -p "$PROJECT_DIR/build/android"

# 检查是否存在预构建的 Android 项目
ANDROID_PROJECT_DIR="$PROJECT_DIR/build/android/proj"

if [ -d "$ANDROID_PROJECT_DIR" ] && [ -f "$ANDROID_PROJECT_DIR/gradlew" ]; then
    echo "✅ 找到现有 Android 项目"
else
    echo "ℹ️  Android 项目不存在，需要先生成"
    
    # 尝试使用 Cocos Creator 构建
    if [ -n "$COCOS_CREATOR_PATH" ] && [ -f "$COCOS_CREATOR_PATH" ]; then
        echo "🔨 使用 Cocos Creator 构建 Android 项目..."
        "$COCOS_CREATOR_PATH" --project "$PROJECT_DIR" --build \
            "platform=android;debug=false;template=default;packageName=$PACKAGE_NAME;name=$APP_NAME;androidStudio=true"
    else
        echo "❌ 错误: 未找到 Cocos Creator"
        echo ""
        echo "请按以下步骤操作:"
        echo "1. 下载并安装 Cocos Dashboard: https://www.cocos.com/creator-download"
        echo "2. 通过 Cocos Dashboard 安装 Cocos Creator 3.8+"
        echo "3. 打开本项目并执行构建: 项目 -> 构建发布 -> Android"
        echo ""
        echo "或者使用 Jenkins 构建环境 (已配置 Docker)"
        exit 1
    fi
fi

# 使用 Gradle 构建 APK
if [ -d "$ANDROID_PROJECT_DIR" ]; then
    echo ""
    echo "🔨 使用 Gradle 构建 APK..."
    
    cd "$ANDROID_PROJECT_DIR"
    
    # 确保 gradlew 可执行
    if [ -f "./gradlew" ]; then
        chmod +x ./gradlew
        
        if [ "$BUILD_TYPE" = "release" ]; then
            # 检查签名配置
            if [ -f "app/keystore.properties" ]; then
                echo "🔐 使用发布签名构建..."
                ./gradlew assembleRelease
            else
                echo "⚠️  警告: 未找到签名配置，使用调试签名构建..."
                ./gradlew assembleDebug
                BUILD_TYPE="debug"
            fi
        else
            echo "🔧 构建调试版本..."
            ./gradlew assembleDebug
        fi
        
        echo ""
        echo "=========================================="
        echo "构建完成!"
        echo "=========================================="
        
        # 显示 APK 路径
        if [ "$BUILD_TYPE" = "release" ]; then
            APK_PATH="$APK_OUTPUT_DIR/release/app-release.apk"
        else
            APK_PATH="$APK_OUTPUT_DIR/debug/app-debug.apk"
        fi
        
        if [ -f "$APK_PATH" ]; then
            echo "✅ APK 路径: $APK_PATH"
            echo "📦 APK 大小: $(du -h "$APK_PATH" | cut -f1)"
            
            # 复制到项目根目录
            OUTPUT_APK="$PROJECT_DIR/Qimeng-$BUILD_TYPE.apk"
            cp "$APK_PATH" "$OUTPUT_APK"
            echo "📋 已复制到: $OUTPUT_APK"
            
            # 验证 APK
            echo ""
            echo "🔍 验证 APK..."
            if command -v aapt >/dev/null 2>&1; then
                aapt dump badging "$OUTPUT_APK" | head -5
            elif command -v unzip >/dev/null 2>&1; then
                echo "✅ APK 文件结构正常"
                unzip -l "$OUTPUT_APK" | tail -5
            fi
            
            echo ""
            echo "=========================================="
            echo "✅ 构建成功!"
            echo "=========================================="
            echo "📱 APK 文件: $OUTPUT_APK"
            echo ""
            echo "安装方法:"
            echo "  adb install -r Qimeng-$BUILD_TYPE.apk"
            echo ""
            exit 0
        else
            echo "❌ 错误: 未找到生成的 APK 文件"
            echo "请检查: $APK_OUTPUT_DIR"
            exit 1
        fi
    else
        echo "❌ 错误: 未找到 gradlew 脚本"
        echo "Android 项目可能未正确生成"
        exit 1
    fi
else
    echo "❌ 错误: 未找到 Android 项目目录"
    echo "请先使用 Cocos Creator 构建项目"
    exit 1
fi
