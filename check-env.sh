#!/bin/bash
# 构建环境检查脚本
# 用于检查本地构建环境是否完整

echo "=========================================="
echo "启蒙游戏 - 构建环境检查"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✅${NC} $1"
}

check_fail() {
    echo -e "${RED}❌${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

echo "【系统环境】"
echo "----------------------------------------"

# 检查操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    check_pass "操作系统: macOS ($(sw_vers -productVersion))"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    check_pass "操作系统: Linux"
else
    check_warn "操作系统: $OSTYPE (未充分测试)"
fi

# 检查 Java
echo ""
echo "【Java 环境】"
echo "----------------------------------------"
if command -v java >/dev/null 2>&1; then
    JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2)
    check_pass "Java 已安装: $JAVA_VERSION"
    
    # 检查版本是否 >= 17
    if [[ "$JAVA_VERSION" =~ ^(1[7-9]|[2-9][0-9]) ]]; then
        check_pass "Java 版本符合要求 (>= 17)"
    else
        check_warn "Java 版本较低，建议升级到 17+"
    fi
else
    check_fail "Java 未安装"
    echo "   安装方法: brew install openjdk@17"
fi

# 检查 Node.js
echo ""
echo "【Node.js 环境】"
echo "----------------------------------------"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js 已安装: $NODE_VERSION"
else
    check_fail "Node.js 未安装"
    echo "   安装方法: brew install node"
fi

# 检查 Git
echo ""
echo "【Git 环境】"
echo "----------------------------------------"
if command -v git >/dev/null 2>&1; then
    GIT_VERSION=$(git --version)
    check_pass "$GIT_VERSION"
else
    check_fail "Git 未安装"
fi

# 检查 Cocos Creator
echo ""
echo "【Cocos Creator】"
echo "----------------------------------------"
COCOS_FOUND=false

# 检查常见路径
COCOS_PATHS=(
    "/Applications/CocosCreator.app/Contents/MacOS/CocosCreator"
    "$HOME/Applications/CocosCreator.app/Contents/MacOS/CocosCreator"
    "/opt/CocosCreator/CocosCreator"
)

for path in "${COCOS_PATHS[@]}"; do
    if [ -f "$path" ]; then
        check_pass "Cocos Creator 已安装: $path"
        COCOS_FOUND=true
        break
    fi
done

if [ "$COCOS_FOUND" = false ]; then
    check_fail "Cocos Creator 未安装"
    echo ""
    echo "   安装步骤:"
    echo "   1. 下载 Cocos Dashboard: https://www.cocos.com/creator-download"
    echo "   2. 安装并启动 Cocos Dashboard"
    echo "   3. 在 Dashboard 中安装 Cocos Creator 3.8+"
    echo ""
fi

# 检查 CocosDashboard
if [ -d "/Applications/CocosDashboard.app" ]; then
    check_pass "CocosDashboard 已安装"
else
    check_warn "CocosDashboard 未安装"
fi

# 检查 Android SDK
echo ""
echo "【Android SDK】"
echo "----------------------------------------"
ANDROID_SDK_FOUND=false

# 检查环境变量
if [ -n "$ANDROID_SDK_ROOT" ]; then
    check_pass "ANDROID_SDK_ROOT 已设置: $ANDROID_SDK_ROOT"
    ANDROID_SDK_FOUND=true
elif [ -n "$ANDROID_HOME" ]; then
    check_pass "ANDROID_HOME 已设置: $ANDROID_HOME"
    ANDROID_SDK_FOUND=true
fi

# 检查常见路径
if [ "$ANDROID_SDK_FOUND" = false ]; then
    ANDROID_PATHS=(
        "$HOME/Library/Android/sdk"
        "/usr/local/android-sdk"
        "/opt/android-sdk"
    )
    
    for path in "${ANDROID_PATHS[@]}"; do
        if [ -d "$path" ]; then
            check_pass "Android SDK 已安装: $path"
            echo "   提示: 请设置环境变量 export ANDROID_SDK_ROOT=$path"
            ANDROID_SDK_FOUND=true
            break
        fi
    done
fi

if [ "$ANDROID_SDK_FOUND" = false ]; then
    check_fail "Android SDK 未安装"
    echo ""
    echo "   安装步骤:"
    echo "   1. 下载 Android Studio: https://developer.android.com/studio"
    echo "   2. 安装并启动 Android Studio"
    echo "   3. 在 SDK Manager 中安装:"
    echo "      - Android SDK Platform 28+"
    echo "      - Android SDK Build-Tools"
    echo "      - Android NDK (可选但推荐)"
    echo ""
fi

# 检查 Android NDK
echo ""
echo "【Android NDK】"
echo "----------------------------------------"
NDK_FOUND=false

if [ -n "$ANDROID_NDK_ROOT" ] && [ -d "$ANDROID_NDK_ROOT" ]; then
    check_pass "ANDROID_NDK_ROOT 已设置: $ANDROID_NDK_ROOT"
    NDK_FOUND=true
elif [ -n "$ANDROID_SDK_ROOT" ] && [ -d "$ANDROID_SDK_ROOT/ndk" ]; then
    NDK_VERSION=$(ls -1 "$ANDROID_SDK_ROOT/ndk" 2>/dev/null | sort -V | tail -1)
    if [ -n "$NDK_VERSION" ]; then
        check_pass "Android NDK 已安装: $NDK_VERSION"
        NDK_FOUND=true
    fi
fi

if [ "$NDK_FOUND" = false ]; then
    check_warn "Android NDK 未安装 (可选但推荐)"
fi

# 检查项目结构
echo ""
echo "【项目结构】"
echo "----------------------------------------"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

check_files=(
    "assets/Main.ts"
    "assets/scripts"
    "assets/scenes"
    "package.json"
    "build-android.sh"
)

for file in "${check_files[@]}"; do
    if [ -e "$PROJECT_DIR/$file" ]; then
        check_pass "$file"
    else
        check_fail "$file (缺失)"
    fi
done

# 总结
echo ""
echo "=========================================="
echo "检查完成"
echo "=========================================="

if [ "$COCOS_FOUND" = true ] && [ "$ANDROID_SDK_FOUND" = true ]; then
    echo -e "${GREEN}✅ 环境完整，可以执行本地构建${NC}"
    echo "   运行: ./build-android.sh debug"
elif [ "$COCOS_FOUND" = false ]; then
    echo -e "${YELLOW}⚠️  缺少 Cocos Creator，无法执行完整构建${NC}"
    echo "   可以使用 Jenkins Docker 环境进行构建"
    echo "   或运行模拟构建: ./build-mock-apk.sh"
else
    echo -e "${YELLOW}⚠️  环境部分缺失${NC}"
fi

echo ""
