#!/bin/bash
# 启蒙游戏 Android APK Docker 构建脚本
# 使用 Android 构建容器进行构建

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_TYPE="${1:-debug}"
BUILD_NUMBER="${BUILD_NUMBER:-1}"
OUTPUT_DIR="$PROJECT_DIR/output"

echo "=========================================="
echo "启蒙游戏 Android Docker 构建"
echo "=========================================="
echo "构建类型: $BUILD_TYPE"
echo "构建编号: $BUILD_NUMBER"
echo ""

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 检查 Docker
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ 错误: 未找到 Docker"
    echo "请安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker 版本: $(docker --version)"
echo ""

# 使用 Android 构建镜像
# 可选镜像:
# - mingc/android-build-box (包含 Android SDK + NDK)
# - thyrlian/android-sdk (轻量级)
# - runmymind/docker-android-sdk (社区维护)

ANDROID_IMAGE="mingc/android-build-box:latest"

echo "📦 使用镜像: $ANDROID_IMAGE"
echo ""

# 检查镜像是否存在
if ! docker image inspect "$ANDROID_IMAGE" >/dev/null 2>&1; then
    echo "📥 拉取构建镜像..."
    docker pull "$ANDROID_IMAGE" || {
        echo "⚠️ 无法拉取镜像，尝试使用备用镜像..."
        ANDROID_IMAGE="thyrlian/android-sdk:latest"
        docker pull "$ANDROID_IMAGE" || {
            echo "❌ 无法拉取任何 Android 构建镜像"
            exit 1
        }
    }
fi

# 创建临时构建目录
BUILD_TEMP=$(mktemp -d)
trap "rm -rf $BUILD_TEMP" EXIT

# 准备构建上下文
cp -r "$PROJECT_DIR"/* "$BUILD_TEMP/"

# 创建 Dockerfile
cat > "$BUILD_TEMP/Dockerfile.build" << 'DOCKERFILE'
FROM mingc/android-build-box:latest

WORKDIR /project

# 复制项目文件
COPY . /project/

# 设置环境变量
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=${PATH}:${ANDROID_SDK_ROOT}/tools/bin:${ANDROID_SDK_ROOT}/platform-tools

# 构建 APK
RUN mkdir -p output && \
    chmod +x build-apk-fast.sh && \
    ./build-apk-fast.sh debug || \
    (echo "快速构建失败，尝试备用方案..." && \
     chmod +x build-android.sh && \
     ./build-android.sh debug)

# 输出构建结果
CMD ["ls", "-la", "/project/output/"]
DOCKERFILE

# 使用 Docker 构建
echo "🔨 开始 Docker 构建..."
echo ""

docker run --rm \
    -v "$PROJECT_DIR:/project" \
    -v "$OUTPUT_DIR:/project/output" \
    -e BUILD_NUMBER="$BUILD_NUMBER" \
    -e BUILD_TYPE="$BUILD_TYPE" \
    -w /project \
    "$ANDROID_IMAGE" \
    bash -c "
        echo '在 Docker 容器中构建...'
        export ANDROID_SDK_ROOT=/opt/android-sdk
        export PATH=\${PATH}:\${ANDROID_SDK_ROOT}/tools/bin:\${ANDROID_SDK_ROOT}/platform-tools
        
        # 显示环境信息
        echo 'Android SDK:'
        ls -la \$ANDROID_SDK_ROOT 2>/dev/null | head -10
        
        # 运行构建脚本
        if [ -f 'build-apk-fast.sh' ]; then
            chmod +x build-apk-fast.sh
            ./build-apk-fast.sh $BUILD_TYPE
        else
            echo '未找到构建脚本'
            exit 1
        fi
    " || {
    echo ""
    echo "❌ Docker 构建失败"
    exit 1
}

echo ""
echo "=========================================="
echo "✅ Docker 构建完成!"
echo "=========================================="
echo ""
echo "输出文件:"
ls -la "$OUTPUT_DIR/"
