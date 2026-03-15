# 启蒙游戏 Android APK Docker 构建脚本
# 使用 Android 构建环境容器

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_TYPE="${1:-debug}"
BUILD_NUMBER="${BUILD_NUMBER:-1}"
OUTPUT_DIR="$PROJECT_DIR/output"

echo "=========================================="
echo "启蒙游戏 Android APK - Docker 构建"
echo "=========================================="
echo "构建类型: $BUILD_TYPE"
echo "构建编号: $BUILD_NUMBER"
echo ""

# 确保输出目录存在
mkdir -p "$OUTPUT_DIR"

# 检查 Docker 是否可用
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi

echo "✅ Docker 版本: $(docker --version)"

# 准备 Android 项目
echo "📦 准备 Android 项目..."
if [ ! -d "$PROJECT_DIR/android-project" ]; then
    echo "❌ 未找到 android-project 目录，请先运行 build-apk-fast.sh 生成项目结构"
    exit 1
fi

# 创建 Dockerfile
DOCKERFILE_DIR=$(mktemp -d)
cat > "$DOCKERFILE_DIR/Dockerfile" << 'EOF'
FROM openjdk:17-slim

# 安装必要工具
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# 下载并安装 Android SDK
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=${PATH}:${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools

RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools && \
    cd ${ANDROID_SDK_ROOT}/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && \
    unzip -q commandlinetools-linux-11076708_latest.zip && \
    mv cmdline-tools latest && \
    rm commandlinetools-linux-11076708_latest.zip

# 接受许可证并安装必要组件
RUN yes | sdkmanager --licenses || true
RUN sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# 设置工作目录
WORKDIR /project

# 默认命令
CMD ["./gradlew", "assembleDebug"]
EOF

# 构建 Docker 镜像
echo "🔨 构建 Docker 镜像..."
docker build -t qimeng-android-build "$DOCKERFILE_DIR" || {
    echo "⚠️ Docker 镜像构建失败，尝试使用替代方案..."
    rm -rf "$DOCKERFILE_DIR"
    exit 1
}

rm -rf "$DOCKERFILE_DIR"

# 运行构建容器
echo "📱 开始构建 APK..."
docker run --rm \
    -v "$PROJECT_DIR/android-project:/project" \
    -w /project \
    -e BUILD_NUMBER="$BUILD_NUMBER" \
    qimeng-android-build \
    bash -c "
        echo '设置 Gradle...'
        gradle wrapper --gradle-version 8.0 2>/dev/null || true
        
        echo '开始构建...'
        if [ -f './gradlew' ]; then
            chmod +x ./gradlew
            ./gradlew assembleDebug --stacktrace
        else
            echo '使用系统 gradle...'
            gradle assembleDebug --stacktrace
        fi
    " || {
    echo "❌ Docker 构建失败"
    exit 1
}

# 复制生成的 APK
APK_SOURCE="$PROJECT_DIR/android-project/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_SOURCE" ]; then
    FINAL_APK="$OUTPUT_DIR/qimeng-docker-${BUILD_TYPE}-${BUILD_NUMBER}.apk"
    cp "$APK_SOURCE" "$FINAL_APK"
    
    echo ""
    echo "=========================================="
    echo "✅ Docker 构建成功!"
    echo "=========================================="
    echo "📱 APK 文件: $FINAL_APK"
    echo "📦 文件大小: $(du -h "$FINAL_APK" | cut -f1)"
    echo ""
    
    # 验证 APK
    echo "🔍 APK 内容:"
    unzip -l "$FINAL_APK" | tail -10
else
    echo "❌ 未找到生成的 APK 文件"
    exit 1
fi
