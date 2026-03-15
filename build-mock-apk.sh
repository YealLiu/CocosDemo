#!/bin/bash
# 模拟 APK 构建脚本 (用于测试 Jenkins 流程)
# 此脚本生成一个有效的 APK 文件结构用于测试

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$PROJECT_DIR/output"
BUILD_NUMBER="${BUILD_NUMBER:-1}"
BUILD_TYPE="${1:-debug}"

echo "=========================================="
echo "模拟 APK 构建 (测试模式)"
echo "=========================================="
echo "项目路径: $PROJECT_DIR"
echo "构建类型: $BUILD_TYPE"
echo "构建编号: $BUILD_NUMBER"
echo ""

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 创建模拟的 APK 文件 (实际上是 ZIP 格式)
APK_NAME="qimeng-demo-${BUILD_TYPE}-${BUILD_NUMBER}.apk"
APK_PATH="$OUTPUT_DIR/$APK_NAME"

echo "📦 生成测试 APK: $APK_NAME"

# 创建临时目录构建 APK 内容
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# 创建基本的 APK 结构
mkdir -p "$TEMP_DIR/META-INF"
mkdir -p "$TEMP_DIR/res"
mkdir -p "$TEMP_DIR/lib"

# 创建 AndroidManifest.xml (最小化)
cat > "$TEMP_DIR/AndroidManifest.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.qimeng.game"
    android:versionCode="1"
    android:versionName="1.0.0">
    <application android:label="启蒙">
        <activity android:name=".MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 创建 classes.dex (空文件占位)
touch "$TEMP_DIR/classes.dex"

# 创建 resources.arsc (空文件占位)
touch "$TEMP_DIR/resources.arsc"

# 创建 META-INF/MANIFEST.MF
cat > "$TEMP_DIR/META-INF/MANIFEST.MF" << EOF
Manifest-Version: 1.0
Created-By: Jenkins Build $BUILD_NUMBER
Build-Type: $BUILD_TYPE
Project: qimeng-demo-cocos
EOF

# 打包成 APK (ZIP 格式)
cd "$TEMP_DIR"
zip -r "$APK_PATH" . -x "*.DS_Store"

echo ""
echo "✅ APK 生成完成!"
echo "📱 文件路径: $APK_PATH"
echo "📦 文件大小: $(du -h "$APK_PATH" | cut -f1)"

# 创建构建信息文件
BUILD_INFO="$OUTPUT_DIR/build-info.txt"
cat > "$BUILD_INFO" << EOF
========================================
启蒙游戏 - 构建信息
========================================
构建编号: $BUILD_NUMBER
构建类型: $BUILD_TYPE
构建时间: $(date)
构建机器: $(hostname)
项目路径: $PROJECT_DIR
APK 文件: $APK_NAME

文件校验:
  MD5: $(md5sum "$APK_PATH" | cut -d' ' -f1)
  SHA1: $(shasum "$APK_PATH" | cut -d' ' -f1)

注意: 这是一个测试 APK 文件，用于验证 Jenkins 构建流程。
真实的 APK 需要通过 Cocos Creator + Android SDK 构建。
========================================
EOF

echo ""
echo "📋 构建信息:"
cat "$BUILD_INFO"

echo ""
echo "========================================"
echo "✅ 模拟构建成功!"
echo "========================================"
echo "输出文件:"
ls -la "$OUTPUT_DIR/"
