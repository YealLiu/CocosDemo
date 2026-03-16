# 代码推送指南

## 状态

✅ 代码已提交到本地 Git 仓库  
❌ 需要 GitHub Token 才能推送到远程仓库

## 提交信息

```
feat: 添加完整的后端服务器代码和 Android 项目

- 添加 WebSocket PVP 对战服务器
- 实现匹配系统、对战服务、消息处理
- 添加连接管理和心跳检测
- 包含完整的 API 文档
- 添加 Android 项目结构和资源文件
```

## 推送方法

### 方法1: 使用 Personal Access Token (推荐)

1. **生成 Token**
   - 访问: https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 选择权限: `repo` (完整仓库访问)
   - 生成并复制 Token

2. **运行推送脚本**
   ```bash
   cd /Users/admin/.openclaw/workspace/agents/product-manager-agent/qimeng-demo-cocos
   ./push-with-token.sh YOUR_GITHUB_TOKEN
   ```

### 方法2: 手动配置 Token

```bash
cd /Users/admin/.openclaw/workspace/agents/product-manager-agent/qimeng-demo-cocos

# 配置远程地址（带 Token）
git remote set-url origin "https://YealLiu:YOUR_TOKEN@github.com/YealLiu/CocosDemo.git"

# 推送
git push -u origin main

# 恢复地址（为了安全）
git remote set-url origin "https://github.com/YealLiu/CocosDemo.git"
```

### 方法3: 使用 GitHub CLI

```bash
# 安装 GitHub CLI (如果未安装)
brew install gh

# 登录 GitHub
gh auth login

# 推送
cd /Users/admin/.openclaw/workspace/agents/product-manager-agent/qimeng-demo-cocos
git push -u origin main
```

## 仓库信息

- **仓库地址**: https://github.com/YealLiu/CocosDemo
- **本地分支**: main
- **提交数量**: 5 个提交
- **最新提交**: a1e99cd - feat: 添加完整的后端服务器代码和 Android 项目

## 推送内容概览

### 后端服务器代码 (server/)
- `src/index.js` - WebSocket 服务器主入口
- `src/services/BattleService.js` - 对战服务
- `src/services/MatchmakingService.js` - 匹配服务
- `src/services/MessageHandler.js` - 消息处理器
- `src/services/ConnectionManager.js` - 连接管理器
- `src/utils/logger.js` - 日志工具
- `API_DOCUMENTATION.md` - API 文档

### Android 项目 (android-project/)
- 完整的 Android 项目结构
- Cocos Creator 场景文件
- 游戏脚本 (TypeScript)
- 资源文件 (图片、图标等)

### 构建脚本
- `build-android.sh` - Android 构建脚本
- `build-apk-docker.sh` - Docker 构建脚本
- `build-apk-fast.sh` - 快速构建脚本

### 文档 (docs/)
- API.md - API 文档
- GAMEPLAY.md - 游戏玩法文档
- SYSTEM.md - 系统架构文档
- DEVELOPMENT.md - 开发文档
- BALANCE.md - 数值平衡文档
