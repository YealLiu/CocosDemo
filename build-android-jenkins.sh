#!/bin/bash
# 启蒙游戏 Android APK 真实构建脚本 (用于 Jenkins CI)
# 此脚本使用 Cocos Creator CLI 构建真正的 APK

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_TYPE="${1:-debug}"
BUILD_NUMBER="${BUILD_NUMBER:-1}"
OUTPUT_DIR="$PROJECT_DIR/output"

# 应用配置
PACKAGE_NAME="com.qimeng.game"
APP_NAME="启蒙"
VERSION_CODE="$BUILD_NUMBER"
VERSION_NAME="1.0.${BUILD_NUMBER}"

echo "=========================================="
echo "启蒙游戏 Android 构建脚本 (Jenkins CI)"
echo "=========================================="
echo "项目路径: $PROJECT_DIR"
echo "构建类型: $BUILD_TYPE"
echo "构建编号: $BUILD_NUMBER"
echo "版本号: $VERSION_NAME"
echo ""

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 检查必要的环境变量
if [ -z "$COCOS_CREATOR_PATH" ]; then
    # 尝试自动查找 Cocos Creator
    if [ -f "/Applications/CocosCreator.app/Contents/MacOS/CocosCreator" ]; then
        COCOS_CREATOR_PATH="/Applications/CocosCreator.app/Contents/MacOS/CocosCreator"
    elif [ -f "/opt/cocos/CocosCreator/CocosCreator" ]; then
        COCOS_CREATOR_PATH="/opt/cocos/CocosCreator/CocosCreator"
    elif command -v cocos >/dev/null 2>&1; then
        COCOS_CREATOR_PATH="cocos"
    fi
fi

if [ -z "$ANDROID_SDK_ROOT" ] && [ -n "$ANDROID_HOME" ]; then
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
fi

echo "🔧 环境检查:"
echo "  COCOS_CREATOR_PATH: ${COCOS_CREATOR_PATH:-未设置}"
echo "  ANDROID_SDK_ROOT: ${ANDROID_SDK_ROOT:-未设置}"
echo "  JAVA_HOME: ${JAVA_HOME:-未设置}"
echo ""

# 检查 Java
if ! command -v java >/dev/null 2>&1; then
    echo "❌ 错误: 未找到 Java，请设置 JAVA_HOME"
    exit 1
fi
echo "✅ Java: $(java -version 2>&1 | head -1)"

# 检查 Android SDK
if [ -z "$ANDROID_SDK_ROOT" ] || [ ! -d "$ANDROID_SDK_ROOT" ]; then
    echo "❌ 错误: 未找到 Android SDK，请设置 ANDROID_SDK_ROOT"
    exit 1
fi
echo "✅ Android SDK: $ANDROID_SDK_ROOT"

# 检查 Cocos Creator
if [ -z "$COCOS_CREATOR_PATH" ] || [ ! -f "$COCOS_CREATOR_PATH" ]; then
    echo "❌ 错误: 未找到 Cocos Creator"
    echo "   请设置 COCOS_CREATOR_PATH 环境变量"
    exit 1
fi
echo "✅ Cocos Creator: $COCOS_CREATOR_PATH"
echo ""

# 构建配置
BUILD_CONFIG="platform=android;debug=$([ "$BUILD_TYPE" = "debug" ] && echo "true" || echo "false");template=default;packageName=$PACKAGE_NAME;name=$APP_NAME;androidStudio=true;buildPath=$PROJECT_DIR/build/android"

echo "=========================================="
echo "开始构建 Android 项目..."
echo "=========================================="
echo "构建配置: $BUILD_CONFIG"
echo ""

# 清理旧构建
if [ -d "$PROJECT_DIR/build/android" ]; then
    echo "🧹 清理旧构建..."
    rm -rf "$PROJECT_DIR/build/android"
fi

# 使用 Cocos Creator 构建
# 注意: 这里假设 Cocos Creator 支持命令行构建
# 如果不支持，需要手动在 Cocos Creator 中构建一次，然后使用 Gradle 直接构建

echo "🔨 步骤 1: 构建原生项目..."
if [ -f "$COCOS_CREATOR_PATH" ]; then
    # 尝试使用 Cocos Creator CLI 构建
    "$COCOS_CREATOR_PATH" --project "$PROJECT_DIR" --build "$BUILD_CONFIG" 2>&1 || {
        echo "⚠️  Cocos Creator CLI 构建失败，尝试备用方案..."
        echo ""
        echo "说明: Cocos Creator 命令行构建需要特定的环境配置。"
        echo "请确保:"
        echo "  1. Cocos Creator 已正确安装"
        echo "  2. 已配置好 Android SDK 和 NDK"
        echo "  3. 在 Cocos Creator 中手动构建过一次 Android 项目"
        exit 1
    }
else
    echo "❌ Cocos Creator 路径无效"
    exit 1
fi

# 检查 Android 项目是否生成
ANDROID_PROJ_DIR="$PROJECT_DIR/build/android/proj"
if [ ! -d "$ANDROID_PROJ_DIR" ]; then
    echo "❌ 错误: Android 项目未生成"
    exit 1
fi

echo ""
echo "🔨 步骤 2: 使用 Gradle 构建 APK..."
cd "$ANDROID_PROJ_DIR"

# 确保 gradlew 可执行
chmod +x ./gradlew

# 构建 APK
if [ "$BUILD_TYPE" = "release" ]; then
    echo "构建 Release APK..."
    ./gradlew assembleRelease
    APK_SOURCE="$ANDROID_PROJ_DIR/app/build/outputs/apk/release/app-release.apk"
else
    echo "构建 Debug APK..."
    ./gradlew assembleDebug
    APK_SOURCE="$ANDROID_PROJ_DIR/app/build/outputs/apk/debug/app-debug.apk"
fi

# 检查 APK 是否生成
if [ ! -f "$APK_SOURCE" ]; then
    echo "❌ 错误: APK 构建失败，未找到输出文件"
    echo "搜索路径: $APK_SOURCE"
    exit 1
fi

# 复制到输出目录
APK_NAME="qimeng-${BUILD_TYPE}-${BUILD_NUMBER}.apk"
APK_DEST="$OUTPUT_DIR/$APK_NAME"

cp "$APK_SOURCE" "$APK_DEST"

echo ""
echo "=========================================="
echo "✅ 构建成功!"
echo "=========================================="
echo "📱 APK 文件: $APK_DEST"
echo "📦 文件大小: $(du -h "$APK_DEST" | cut -f1)"
echo ""

# 验证 APK
echo "🔍 APK 信息:"
if command -v aapt >/dev/null 2>&1; then
    aapt dump badging "$APK_DEST" | head -10
elif [ -f "$ANDROID_SDK_ROOT/build-tools/*/aapt" ]; then
    AAPT=$(find "$ANDROID_SDK_ROOT/build-tools" -name "aapt" | head -1)
    "$AAPT" dump badging "$APK_DEST" | head -10
fi

# 创建构建信息
cat > "$OUTPUT_DIR/build-info.txt" << EOF
========================================
启蒙游戏 - 构建信息
========================================
构建编号: $BUILD_NUMBER
构建类型: $BUILD_TYPE
版本号: $VERSION_NAME
构建时间: $(date)
构建机器: $(hostname)
APK 文件: $APK_NAME

文件校验:
  MD5: $(md5sum "$APK_DEST" 2>/dev/null | cut -d' ' -f1 || echo 'N/A')
  SHA1: $(shasum "$APK_DEST" 2>/dev/null | cut -d' ' -f1 || echo 'N/A')

安装命令:
  adb install -r $APK_NAME
========================================
EOF

echo ""
echo "📋 构建信息已保存到: $OUTPUT_DIR/build-info.txt"
echo ""
ls -la "$OUTPUT_DIR/"
