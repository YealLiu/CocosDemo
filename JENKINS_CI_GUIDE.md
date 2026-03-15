# Jenkins CI 构建配置指南

## 问题背景

之前的 Jenkins 构建生成的 APK 是**模拟文件**，无法正常安装。本指南提供正确的构建方案。

---

## 构建方案对比

| 方案 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| **方案1: Docker 构建** | Jenkins CI 环境 | 环境隔离、可复现 | 需要 Docker |
| **方案2: 本地 Android SDK** | 开发机/有 SDK 的环境 | 速度快 | 需要配置 SDK |
| **方案3: Cocos Creator 原生** | 正式发布 | 性能最好 | 需要 Cocos Creator GUI |

---

## 方案1: Docker 构建 (推荐用于 Jenkins)

### 前置要求
- Jenkins 服务器安装 Docker
- Jenkins 用户有 Docker 权限

### Jenkinsfile 配置

```groovy
pipeline {
    agent any
    
    environment {
        PROJECT_NAME = 'qimeng-demo-cocos'
        BUILD_TYPE = 'debug'
        OUTPUT_DIR = 'output'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'mkdir -p output'
            }
        }
        
        stage('Build with Docker') {
            steps {
                script {
                    // 使用 Android 构建镜像
                    docker.image('mingc/android-build-box:latest').inside {
                        sh '''
                            export ANDROID_SDK_ROOT=/opt/android-sdk
                            export PATH=${PATH}:${ANDROID_SDK_ROOT}/tools/bin:${ANDROID_SDK_ROOT}/platform-tools
                            
                            # 构建 APK
                            chmod +x build-apk-fast.sh
                            ./build-apk-fast.sh ${BUILD_TYPE}
                        '''
                    }
                }
            }
        }
        
        stage('Verify APK') {
            steps {
                sh '''
                    APK_FILE=$(ls output/*.apk | head -1)
                    if [ -f "$APK_FILE" ]; then
                        echo "✅ APK 构建成功: $APK_FILE"
                        ls -lh "$APK_FILE"
                        
                        # 验证 APK 不是空文件
                        FILE_SIZE=$(stat -c%s "$APK_FILE" 2>/dev/null || stat -f%z "$APK_FILE" 2>/dev/null)
                        if [ "$FILE_SIZE" -lt 10000 ]; then
                            echo "❌ APK 文件太小，可能无效"
                            exit 1
                        fi
                    else
                        echo "❌ 未找到 APK 文件"
                        exit 1
                    fi
                '''
            }
        }
        
        stage('Archive') {
            steps {
                archiveArtifacts artifacts: 'output/**/*', fingerprint: true
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

---

## 方案2: 预配置 Android SDK

### 在 Jenkins 节点上配置

1. **安装 Android SDK**
   ```bash
   # 下载命令行工具
   wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
   unzip commandlinetools-linux-11076708_latest.zip
   
   # 安装 SDK
   mkdir -p /opt/android-sdk
   mv cmdline-tools /opt/android-sdk/
   
   # 安装必要组件
   yes | /opt/android-sdk/cmdline-tools/bin/sdkmanager --sdk_root=/opt/android-sdk "platform-tools" "platforms;android-33" "build-tools;33.0.0"
   ```

2. **配置 Jenkins 环境变量**
   - 管理 Jenkins → 系统配置 → 全局属性
   - 添加环境变量: `ANDROID_SDK_ROOT=/opt/android-sdk`

3. **使用 build-android.sh 脚本**
   ```groovy
   stage('Build') {
       steps {
           sh '''
               chmod +x build-android.sh
               ./build-android.sh debug
           '''
       }
   }
   ```

---

## 方案3: 使用 Cocos Creator CLI

### 要求
- Jenkins 节点安装 Cocos Creator 3.x
- 配置好 Android SDK 和 NDK

### Jenkinsfile

```groovy
pipeline {
    agent { label 'cocos-creator' }  // 需要配置有 Cocos Creator 的节点
    
    environment {
        COCOS_CREATOR_PATH = '/opt/CocosCreator/CocosCreator'
        ANDROID_SDK_ROOT = '/opt/android-sdk'
    }
    
    stages {
        stage('Build Native') {
            steps {
                sh '''
                    ${COCOS_CREATOR_PATH} --project . --build "platform=android;debug=true"
                '''
            }
        }
        
        stage('Gradle Build') {
            steps {
                sh '''
                    cd build/android/proj
                    ./gradlew assembleDebug
                '''
            }
        }
    }
}
```

---

## 验证 APK 有效性

构建完成后，验证 APK 是否可以安装：

```bash
# 1. 检查 APK 文件大小
ls -lh output/*.apk

# 2. 检查 APK 内容
unzip -l output/*.apk | grep -E "(classes\.dex|AndroidManifest|resources)"

# 3. 使用 aapt 检查
aapt dump badging output/*.apk

# 4. 安装测试
adb install -r output/*.apk
```

---

## 常见问题

### Q: APK 文件只有几百字节？
**A:** 这是模拟 APK，不是真实构建。请使用正确的构建脚本。

### Q: Docker 构建很慢？
**A:** 
- 第一次需要拉取镜像（约 1-2GB）
- 建议在 Jenkins 上预拉取镜像: `docker pull mingc/android-build-box:latest`

### Q: 签名问题？
**A:** 
- Debug 版本使用自动生成的调试签名
- Release 版本需要配置签名密钥

---

## 构建脚本清单

| 脚本 | 用途 |
|------|------|
| `build-android.sh` | 本地构建（需要 Cocos Creator + Android SDK） |
| `build-apk-fast.sh` | 快速构建（WebView 包装方案） |
| `build-android-docker.sh` | Docker 构建 |
| `build-android-jenkins.sh` | Jenkins CI 专用脚本 |
| `build-mock-apk.sh` | ⚠️ 模拟构建（仅用于测试流程） |

---

## 快速开始

对于 Jenkins CI，推荐使用以下配置：

```groovy
// 最简配置
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                script {
                    docker.image('mingc/android-build-box:latest').inside {
                        sh 'chmod +x build-apk-fast.sh && ./build-apk-fast.sh debug'
                    }
                }
            }
        }
    }
    post {
        always {
            archiveArtifacts artifacts: 'output/*.apk'
        }
    }
}
```
