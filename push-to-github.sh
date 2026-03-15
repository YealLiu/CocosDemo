#!/bin/bash
# GitHub 推送脚本
# 此脚本指导用户完成 GitHub 推送

set -e

PROJECT_DIR="/Users/admin/.openclaw/workspace/agents/product-manager-agent/qimeng-demo-cocos"
REPO_URL="https://github.com/YealLiu/CocosDemo.git"

cd "$PROJECT_DIR"

echo "=========================================="
echo "GitHub 推送助手"
echo "=========================================="
echo ""
echo "仓库地址: $REPO_URL"
echo "本地分支: $(git branch --show-current)"
echo "提交数量: $(git rev-list --count HEAD)"
echo ""

# 检查 GitHub CLI
echo "检查 GitHub CLI..."
if command -v gh >/dev/null 2>&1; then
    echo "✅ GitHub CLI 已安装"
    
    # 检查登录状态
    if gh auth status >/dev/null 2>&1; then
        echo "✅ 已登录 GitHub"
        
        echo ""
        echo "正在推送到 GitHub..."
        git push -u origin main
        
        echo ""
        echo "=========================================="
        echo "✅ 推送成功!"
        echo "=========================================="
        echo ""
        echo "仓库地址: $REPO_URL"
        echo ""
        exit 0
    else
        echo "⚠️  未登录 GitHub"
        echo ""
        echo "请运行以下命令登录:"
        echo "  gh auth login"
        echo ""
        echo "登录后重新运行此脚本"
        exit 1
    fi
else
    echo "❌ GitHub CLI 未安装"
    echo ""
    echo "安装方法:"
    echo "  brew install gh"
    echo ""
fi

# 备选方案: 使用 HTTPS + Token
echo "=========================================="
echo "备选方案: 使用 Personal Access Token"
echo "=========================================="
echo ""
echo "步骤1: 生成 GitHub Token"
echo "  1. 访问: https://github.com/settings/tokens"
echo "  2. 点击 'Generate new token (classic)'"
echo "  3. 选择权限: repo"
echo "  4. 生成并复制 Token"
echo ""
echo "步骤2: 配置 Git 远程地址"
echo "  git remote set-url origin https://TOKEN@github.com/YealLiu/CocosDemo.git"
echo ""
echo "步骤3: 推送"
echo "  git push -u origin main"
echo ""
echo "=========================================="
echo "当前 Git 状态"
echo "=========================================="
git status
git log --oneline -3
