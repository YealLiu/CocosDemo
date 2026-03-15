# Git 推送指南

## 推送状态

✅ **本地提交已完成**
- 分支: main
- 提交数: 1 (Initial commit)
- 文件数: 54 个文件

❌ **需要身份验证**
GitHub 推送需要用户名和密码/Token

---

## 手动推送步骤

### 方法1: 使用 HTTPS + Personal Access Token

1. **生成 GitHub Token**:
   - 访问: https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 选择权限: `repo` (完整仓库访问)
   - 生成并复制 Token

2. **配置 Git 凭证**:
   ```bash
   cd /Users/admin/.openclaw/workspace/agents/product-manager-agent/qimeng-demo-cocos
   
   # 设置远程仓库 URL (包含 Token)
   git remote set-url origin https://TOKEN@github.com/YealLiu/CocosDemo.git
   
   # 推送
   git push -u origin main
   ```

### 方法2: 使用 SSH 密钥

1. **生成 SSH 密钥** (如果没有):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   cat ~/.ssh/id_ed25519.pub
   ```

2. **添加公钥到 GitHub**:
   - 访问: https://github.com/settings/keys
   - 点击 "New SSH key"
   - 粘贴公钥内容

3. **更改远程 URL 为 SSH**:
   ```bash
   git remote set-url origin git@github.com:YealLiu/CocosDemo.git
   git push -u origin main
   ```

### 方法3: 使用 GitHub CLI

```bash
# 安装 GitHub CLI
brew install gh

# 登录
gh auth login

# 推送
cd /Users/admin/.openclaw/workspace/agents/product-manager-agent/qimeng-demo-cocos
git push -u origin main
```

---

## 项目已准备就绪

本地仓库包含:

```
qimeng-demo-cocos/
├── .gitignore              # Git 忽略配置
├── README.md               # 项目说明
├── BUILD_GUIDE.md          # 构建指南
├── JENKINS_CI_GUIDE.md     # CI 配置指南
├── APK_FIX_REPORT.md       # APK 修复报告
├── Jenkinsfile             # Jenkins 配置
├── package.json            # 项目配置
├── index.html              # Web 入口
├── assets/                 # 游戏资源
│   ├── Main.ts
│   ├── scripts/           # 游戏脚本
│   │   ├── BattleScene.ts
│   │   ├── BattleSystem.ts
│   │   ├── CardDatabase.ts
│   │   ├── CardUI.ts
│   │   ├── ClassDatabase.ts
│   │   ├── ClassSelectScene.ts
│   │   ├── EnemyDatabase.ts
│   │   ├── GameManager.ts
│   │   ├── GameState.ts
│   │   ├── InputManager.ts
│   │   ├── MapScene.ts
│   │   └── MenuScene.ts
│   └── resources/         # 图片资源
├── settings/              # Cocos 设置
│   └── project.json
└── build-*.sh             # 构建脚本
    ├── build-android.sh
    ├── build-apk-fast.sh
    ├── build-android-docker.sh
    ├── build-android-jenkins.sh
    ├── build-mock-apk.sh
    ├── check-env.sh
    └── create-test-apk.sh
```

---

## 推送后通知后端大牛

推送完成后，请通知 ⚙️后端大牛:

1. **仓库地址**: https://github.com/YealLiu/CocosDemo.git
2. **Jenkinsfile 已更新**: 使用 Docker 构建方案
3. **构建脚本已包含**: 7 个构建脚本
4. **文档已完善**: 4 个文档文件

后端大牛需要:
1. 在 Jenkins 中配置 Git 仓库地址
2. 确保 Jenkins 服务器有 Docker 权限
3. 预拉取 Android 构建镜像: `docker pull mingc/android-build-box:latest`
4. 触发首次构建测试

---

## 快速推送命令

```bash
# 进入项目目录
cd /Users/admin/.openclaw/workspace/agents/product-manager-agent/qimeng-demo-cocos

# 检查状态
git status

# 推送 (替换 YOUR_TOKEN 为实际 Token)
git remote set-url origin https://YOUR_TOKEN@github.com/YealLiu/CocosDemo.git
git push -u origin main

# 验证推送
git log --oneline
git remote -v
```
