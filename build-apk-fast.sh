#!/bin/bash
# 启蒙游戏 Android APK 快速构建脚本
# 使用 Android WebView 包装 Web 游戏，生成真正可安装的 APK

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_TYPE="${1:-debug}"
BUILD_NUMBER="${BUILD_NUMBER:-1}"
OUTPUT_DIR="$PROJECT_DIR/output"
TEMP_DIR=$(mktemp -d)

# 清理函数
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

echo "=========================================="
echo "启蒙游戏 Android APK 构建"
echo "=========================================="
echo "构建类型: $BUILD_TYPE"
echo "构建编号: $BUILD_NUMBER"
echo ""

# 创建 Android 项目结构
mkdir -p "$TEMP_DIR/app/src/main/java/com/qimeng/game"
mkdir -p "$TEMP_DIR/app/src/main/res/layout"
mkdir -p "$TEMP_DIR/app/src/main/res/values"
mkdir -p "$TEMP_DIR/app/src/main/res/mipmap-hdpi"
mkdir -p "$TEMP_DIR/app/src/main/assets"
mkdir -p "$TEMP_DIR/app/libs"

# 复制 Web 游戏资源
echo "📦 复制游戏资源..."
if [ -d "$PROJECT_DIR/build/web-mobile" ]; then
    cp -r "$PROJECT_DIR/build/web-mobile/"* "$TEMP_DIR/app/src/main/assets/"
elif [ -f "$PROJECT_DIR/index.html" ]; then
    cp "$PROJECT_DIR/index.html" "$TEMP_DIR/app/src/main/assets/"
    cp -r "$PROJECT_DIR/assets" "$TEMP_DIR/app/src/main/assets/" 2>/dev/null || true
fi

# 创建 AndroidManifest.xml
cat > "$TEMP_DIR/app/src/main/AndroidManifest.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.qimeng.game"
    android:versionCode="1"
    android:versionName="1.0.0">
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="启蒙"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 创建 MainActivity.java
cat > "$TEMP_DIR/app/src/main/java/com/qimeng/game/MainActivity.java" << 'EOF'
package com.qimeng.game;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        webView = new WebView(this);
        setContentView(webView);
        
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient());
        
        // 加载本地游戏
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
EOF

# 创建 build.gradle (Module: app)
cat > "$TEMP_DIR/app/build.gradle" << EOF
apply plugin: 'com.android.application'

android {
    compileSdkVersion 33
    
    defaultConfig {
        applicationId "com.qimeng.game"
        minSdkVersion 21
        targetSdkVersion 33
        versionCode $BUILD_NUMBER
        versionName "1.0.$BUILD_NUMBER"
    }
    
    buildTypes {
        debug {
            minifyEnabled false
        }
        release {
            minifyEnabled false
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
}
EOF

# 创建 build.gradle (Project)
cat > "$TEMP_DIR/build.gradle" << 'EOF'
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
EOF

# 创建 settings.gradle
cat > "$TEMP_DIR/settings.gradle" << 'EOF'
include ':app'
EOF

# 创建 gradle.properties
cat > "$TEMP_DIR/gradle.properties" << 'EOF'
org.gradle.jvmargs=-Xmx2048m
android.useAndroidX=true
android.enableJetifier=true
EOF

# 创建 strings.xml
cat > "$TEMP_DIR/app/src/main/res/values/strings.xml" << 'EOF'
<resources>
    <string name="app_name">启蒙</string>
</resources>
EOF

# 创建 styles.xml
cat > "$TEMP_DIR/app/src/main/res/values/styles.xml" << 'EOF'
<resources>
    <style name="AppTheme" parent="android:Theme.NoTitleBar.Fullscreen">
    </style>
</resources>
EOF

# 创建简单的图标（使用 base64 编码的 PNG）
echo "🎨 创建应用图标..."
# 创建一个 1x1 像素的透明 PNG 作为占位符
echo -n -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\xdac\xf8\x00\x00\x00\x01\x01\x00\x05\xfe\x02\xfe\x00\x00\x00\x00IEND\xaeB`\x82' > "$TEMP_DIR/app/src/main/res/mipmap-hdpi/ic_launcher.png"

echo ""
echo "=========================================="
echo "构建 APK..."
echo "=========================================="

# 检查是否有 Android SDK
if [ -z "$ANDROID_SDK_ROOT" ] && [ -d "$HOME/Library/Android/sdk" ]; then
    export ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"
fi

if [ -z "$ANDROID_SDK_ROOT" ] || [ ! -d "$ANDROID_SDK_ROOT" ]; then
    echo "⚠️  未找到 Android SDK，尝试使用在线构建服务或 Docker..."
    echo ""
    echo "本地构建需要:"
    echo "  1. Android SDK (设置 ANDROID_SDK_ROOT)"
    echo "  2. Gradle"
    echo ""
    echo "替代方案:"
    echo "  1. 使用 Docker: docker run -v $(pwd):/project android-build-env"
    echo "  2. 使用在线 APK 构建服务"
    echo "  3. 在 Android Studio 中手动导入项目构建"
    
    # 保存项目结构供手动构建
    MANUAL_BUILD_DIR="$PROJECT_DIR/android-project"
    rm -rf "$MANUAL_BUILD_DIR"
    cp -r "$TEMP_DIR" "$MANUAL_BUILD_DIR"
    echo ""
    echo "📁 Android 项目已保存到: $MANUAL_BUILD_DIR"
    echo "   可以用 Android Studio 打开此项目手动构建"
    exit 1
fi

echo "✅ 使用 Android SDK: $ANDROID_SDK_ROOT"

# 创建 local.properties
echo "sdk.dir=$ANDROID_SDK_ROOT" > "$TEMP_DIR/local.properties"

# 下载并使用 Gradle Wrapper
echo "🔧 设置 Gradle..."
cd "$TEMP_DIR"

# 尝试使用系统 gradle 或下载 wrapper
if command -v gradle >/dev/null 2>&1; then
    gradle wrapper --gradle-version 8.0
elif [ -f "$PROJECT_DIR/gradlew" ]; then
    cp "$PROJECT_DIR/gradlew" .
    cp -r "$PROJECT_DIR/gradle" . 2>/dev/null || true
else
    echo "📥 下载 Gradle Wrapper..."
    curl -L -o gradle-wrapper.jar https://raw.githubusercontent.com/gradle/gradle/v8.0.0/gradle/wrapper/gradle-wrapper.jar 2>/dev/null || {
        echo "❌ 无法下载 Gradle Wrapper"
        exit 1
    }
fi

# 构建 APK
echo "🔨 开始构建..."
if [ -f "./gradlew" ]; then
    chmod +x ./gradlew
    if [ "$BUILD_TYPE" = "release" ]; then
        ./gradlew assembleRelease
        APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
    else
        ./gradlew assembleDebug
        APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    fi
else
    echo "❌ 未找到 Gradle Wrapper"
    exit 1
fi

# 检查 APK 是否生成
if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK 构建失败"
    exit 1
fi

# 复制到输出目录
mkdir -p "$OUTPUT_DIR"
FINAL_APK="$OUTPUT_DIR/qimeng-${BUILD_TYPE}-${BUILD_NUMBER}.apk"
cp "$APK_PATH" "$FINAL_APK"

echo ""
echo "=========================================="
echo "✅ 构建成功!"
echo "=========================================="
echo "📱 APK 文件: $FINAL_APK"
echo "📦 文件大小: $(du -h "$FINAL_APK" | cut -f1)"
echo ""

# 验证 APK
echo "🔍 APK 内容:"
unzip -l "$FINAL_APK" | tail -10

# 创建构建信息
cat > "$OUTPUT_DIR/build-info.txt" << EOF
========================================
启蒙游戏 - 构建信息
========================================
构建编号: $BUILD_NUMBER
构建类型: $BUILD_TYPE
版本号: 1.0.${BUILD_NUMBER}
构建时间: $(date)
APK 文件: qimeng-${BUILD_TYPE}-${BUILD_NUMBER}.apk

安装命令:
  adb install -r qimeng-${BUILD_TYPE}-${BUILD_NUMBER}.apk

注意:
  这是一个 WebView 包装的 APK，适用于快速测试。
  生产环境建议使用 Cocos Creator 原生构建。
========================================
EOF

echo ""
echo "📋 构建信息:"
cat "$OUTPUT_DIR/build-info.txt"
