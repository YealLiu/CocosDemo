pipeline {
    agent any
    
    environment {
        PROJECT_NAME = 'qimeng-demo-cocos'
        BUILD_TYPE = 'debug'
        OUTPUT_DIR = 'output'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }
    
    triggers {
        // Poll SCM every 5 minutes for changes
        pollSCM('H/5 * * * *')
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '📥 检出源代码...'
                checkout scm
                
                script {
                    echo "分支: ${env.BRANCH_NAME ?: 'main'}"
                    echo "构建编号: ${env.BUILD_NUMBER}"
                    echo "工作空间: ${env.WORKSPACE}"
                }
                
                // 显示项目结构
                sh '''
                    echo "📁 项目结构:"
                    ls -la
                    echo ""
                    echo "📦 项目信息:"
                    cat package.json 2>/dev/null || echo "未找到 package.json"
                '''
            }
        }
        
        stage('Setup Environment') {
            steps {
                echo '🔧 设置构建环境...'
                sh '''
                    echo "Java 版本:"
                    java -version 2>&1 || echo "未找到 Java"
                    
                    echo ""
                    echo "Node.js 版本:"
                    node --version 2>/dev/null || echo "未找到 Node.js"
                    
                    echo ""
                    echo "Git 版本:"
                    git --version
                    
                    echo ""
                    echo "Android SDK:"
                    echo "ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-未设置}"
                    echo "ANDROID_HOME=${ANDROID_HOME:-未设置}"
                    
                    # 创建输出目录
                    mkdir -p output
                '''
            }
        }
        
        stage('Build Web Assets') {
            steps {
                echo '🎮 构建 Web 资源...'
                sh '''
                    # 检查 Web 资源是否存在
                    if [ -d "build/web-mobile" ]; then
                        echo "✅ 找到 Web 资源: build/web-mobile"
                        ls -la build/web-mobile/
                    elif [ -f "index.html" ]; then
                        echo "✅ 找到入口文件: index.html"
                    else
                        echo "⚠️ 未找到 Web 资源，APK 将只包含基本框架"
                    fi
                '''
            }
        }
        
        stage('Build Android APK') {
            steps {
                echo '📱 构建 Android APK...'
                sh '''
                    echo "构建开始时间: $(date)"
                    echo "项目: ${PROJECT_NAME}"
                    echo "构建类型: ${BUILD_TYPE}"
                    echo "构建编号: ${BUILD_NUMBER}"
                    
                    # 检查可用的构建脚本
                    if [ -f "build-apk-fast.sh" ]; then
                        echo "使用快速构建脚本..."
                        chmod +x build-apk-fast.sh
                        ./build-apk-fast.sh ${BUILD_TYPE}
                    elif [ -f "build-android.sh" ]; then
                        echo "使用标准构建脚本..."
                        chmod +x build-android.sh
                        ./build-android.sh ${BUILD_TYPE}
                    else
                        echo "❌ 错误: 未找到构建脚本"
                        exit 1
                    fi
                '''
            }
        }
        
        stage('Verify APK') {
            steps {
                echo '🔍 验证 APK...'
                sh '''
                    echo "检查生成的 APK 文件..."
                    ls -la output/
                    
                    APK_FILE=$(ls output/*.apk 2>/dev/null | head -1)
                    if [ -n "$APK_FILE" ]; then
                        echo "✅ 找到 APK: $APK_FILE"
                        echo "📦 文件大小: $(du -h "$APK_FILE" | cut -f1)"
                        
                        # 验证 APK 结构
                        echo ""
                        echo "APK 内容验证:"
                        unzip -l "$APK_FILE" | grep -E "(AndroidManifest|classes\.dex|resources)" || echo "⚠️ APK 结构可能不完整"
                        
                        # 检查 APK 是否有效 (非空文件)
                        FILE_SIZE=$(stat -f%z "$APK_FILE" 2>/dev/null || stat -c%s "$APK_FILE" 2>/dev/null || echo "0")
                        if [ "$FILE_SIZE" -lt 1000 ]; then
                            echo "❌ 错误: APK 文件太小 (${FILE_SIZE} bytes)，可能是无效的"
                            exit 1
                        fi
                        
                        echo ""
                        echo "✅ APK 验证通过"
                    else
                        echo "❌ 错误: 未找到 APK 文件"
                        exit 1
                    fi
                '''
            }
        }
        
        stage('Test') {
            steps {
                echo '🧪 运行测试...'
                sh '''
                    echo "测试阶段占位符"
                    echo "在此处添加单元测试和集成测试"
                '''
            }
        }
        
        stage('Archive Artifacts') {
            steps {
                echo '📦 归档构建产物...'
                archiveArtifacts(
                    artifacts: 'output/**/*',
                    fingerprint: true,
                    allowEmptyArchive: false
                )
            }
        }
    }
    
    post {
        always {
            echo '📊 构建完成'
            echo "构建 URL: ${env.BUILD_URL}"
            
            // 显示构建摘要
            sh '''
                echo ""
                echo "========================================"
                echo "构建摘要"
                echo "========================================"
                echo "项目: ${PROJECT_NAME}"
                echo "构建编号: ${BUILD_NUMBER}"
                echo "构建时间: $(date)"
                echo ""
                echo "输出文件:"
                ls -la output/ 2>/dev/null || echo "无输出文件"
                echo "========================================"
            '''
        }
        success {
            echo '✅ 构建成功!'
            echo "构建产物: ${env.BUILD_URL}artifact/"
            
            // 可以添加通知步骤，如发送邮件或飞书消息
            // emailext subject: "构建成功: ${PROJECT_NAME} #${BUILD_NUMBER}", ...
        }
        failure {
            echo '❌ 构建失败!'
            echo "查看控制台输出: ${env.BUILD_URL}console"
        }
        unstable {
            echo '⚠️ 构建不稳定'
        }
    }
}
