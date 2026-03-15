# APK 安装问题修复报告

## 问题描述

Jenkins 构建的 APK 文件**无法正常安装**，原因是生成的 APK 是**模拟文件**，不是真正的 Android 应用包。

### 问题根因

1. **Jenkinsfile 中的构建步骤是占位符**：
   ```groovy
   // 这是假的构建！
   echo "APK_PLACEHOLDER_CONTENT" > output/qimeng-demo-${BUILD_NUMBER}.apk
   ```

2. **build-mock-apk.sh 生成的 APK 结构不完整**：
   - `classes.dex` 是空文件（没有字节码）
   - `resources.arsc` 是空文件（没有资源索引）
   - 没有有效的签名

---

## 解决方案

### 方案1: Docker 构建 (推荐用于 Jenkins)

使用预配置的 Android 构建镜像：

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                script {
                    docker.image('mingc/android-build-box:latest').inside {
                        sh '''
                            export ANDROID_SDK_ROOT=/opt/android-sdk
                            chmod +x build-apk-fast.sh
                            ./build-apk-fast.sh debug
                        '''
                    }
                }
            }
        }
        
        stage('Verify') {
            steps {
                sh '''
                    # 验证 APK 不是空文件
                    APK=$(ls output/*.apk | head -1)
                    SIZE=$(stat -c%s "$APK" 2>/dev/null || stat -f%z "$APK" 2>/dev/null)
                    if [ "$SIZE" -lt 10000 ]; then
                        echo "APK 文件太小，构建失败"
                        exit 1
                    fi
                    echo "✅ APK 验证通过，大小: $SIZE bytes"
                '''
            }
        }
        
        stage('Archive') {
            steps {
                archiveArtifacts artifacts: 'output/*.apk', fingerprint: true
            }
        }
    }
}
```

### 方案2: 配置 Android SDK

在 Jenkins 节点上安装 Android SDK：

```bash
# 1. 下载 Android 命令行工具
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip

# 2. 安装到 /opt/android-sdk
sudo mkdir -p /opt/android-sdk
sudo mv cmdline-tools /opt/android-sdk/

# 3. 安装必要组件
export ANDROID_SDK_ROOT=/opt/android-sdk
yes | $ANDROID_SDK_ROOT/cmdline-tools/bin/sdkmanager --sdk_root=$ANDROID_SDK_ROOT \
    "platform-tools" \
    "platforms;android-33" \
    "build-tools;33.0.0"

# 4. 配置 Jenkins 环境变量
# 管理 Jenkins → 系统配置 → 全局属性
# 添加: ANDROID_SDK_ROOT=/opt/android-sdk
```

### 方案3: 使用 Cocos Creator 原生构建

如果需要最佳性能，使用 Cocos Creator 命令行构建：

```bash
# 需要 Cocos Creator 3.x 和 Android SDK
export COCOS_CREATOR_PATH=/path/to/CocosCreator
export ANDROID_SDK_ROOT=/path/to/android-sdk

./build-android.sh debug
```

---

## 构建脚本清单

| 脚本 | 用途 | 环境要求 |
|------|------|----------|
| `build-android.sh` | 本地完整构建 | Cocos Creator + Android SDK |
| `build-apk-fast.sh` | 快速 WebView 构建 | Android SDK |
| `build-android-docker.sh` | Docker 构建 | Docker |
| `build-android-jenkins.sh` | Jenkins CI 脚本 | Cocos Creator + Android SDK |
| `build-mock-apk.sh` | ⚠️ 模拟构建（仅测试） | 无 |

---

## 快速修复步骤

### 对于 Jenkins CI (推荐)

1. **更新 Jenkinsfile**：
   ```bash
   # 使用新的 Jenkinsfile
   cp JENKINS_CI_GUIDE.md Jenkinsfile.new
   # 手动合并或使用提供的 Jenkinsfile
   ```

2. **确保 Jenkins 有 Docker 权限**：
   ```bash
   # 在 Jenkins 服务器上
   sudo usermod -aG docker jenkins
   sudo systemctl restart jenkins
   ```

3. **预拉取构建镜像**（加快构建速度）：
   ```bash
   docker pull mingc/android-build-box:latest
   ```

4. **运行构建**：
   - 在 Jenkins 上触发新构建
   - 检查构建产物中的 APK 大小（应该 > 1MB）

### 验证 APK 有效性

```bash
# 1. 下载 APK
wget ${JENKINS_URL}/job/${JOB_NAME}/${BUILD_NUMBER}/artifact/output/*.apk

# 2. 检查文件大小
ls -lh *.apk  # 应该 > 1MB

# 3. 检查内容
unzip -l *.apk | grep classes.dex  # 应该显示非零大小

# 4. 安装测试
adb install -r *.apk
```

---

## 文件变更

本次修复新增/修改的文件：

1. **Jenkinsfile** - 更新为使用 Docker 构建
2. **build-apk-fast.sh** - 快速构建脚本
3. **build-android-docker.sh** - Docker 构建脚本
4. **build-android-jenkins.sh** - Jenkins CI 专用脚本
5. **JENKINS_CI_GUIDE.md** - 完整的 CI 配置指南
6. **APK_FIX_REPORT.md** - 本报告

---

## 联系支持

如有问题，请联系：
- 前端开发: @🎨前端大佬
- 后端开发: @⚙️后端大牛
- 产品管理: @📋产品大拿

---

## 附录: 最小可工作的 Jenkinsfile

```groovy
pipeline {
    agent any
    
    environment {
        BUILD_TYPE = 'debug'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'mkdir -p output'
            }
        }
        
        stage('Build APK') {
            steps {
                script {
                    // 使用 Android 构建镜像
                    docker.image('mingc/android-build-box:latest').inside {
                        sh '''
                            export ANDROID_SDK_ROOT=/opt/android-sdk
                            export PATH=${PATH}:${ANDROID_SDK_ROOT}/platform-tools
                            
                            # 运行构建
                            chmod +x build-apk-fast.sh
                            ./build-apk-fast.sh ${BUILD_TYPE}
                        '''
                    }
                }
            }
        }
        
        stage('Verify') {
            steps {
                sh '''
                    APK_FILE=$(ls output/*.apk | head -1)
                    if [ ! -f "$APK_FILE" ]; then
                        echo "❌ 未找到 APK 文件"
                        exit 1
                    fi
                    
                    FILE_SIZE=$(stat -c%s "$APK_FILE" 2>/dev/null || stat -f%z "$APK_FILE" 2>/dev/null)
                    echo "APK 大小: $FILE_SIZE bytes"
                    
                    if [ "$FILE_SIZE" -lt 10000 ]; then
                        echo "❌ APK 文件太小，可能无效"
                        exit 1
                    fi
                    
                    echo "✅ APK 验证通过"
                '''
            }
        }
        
        stage('Archive') {
            steps {
                archiveArtifacts artifacts: 'output/*.apk', fingerprint: true
            }
        }
    }
    
    post {
        success {
            echo '✅ 构建成功!'
        }
        failure {
            echo '❌ 构建失败!'
        }
    }
}
```
