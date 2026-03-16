#!/bin/bash
# GitHub 推送脚本 - 需要配置 Token
# 使用方法: ./push-with-token.sh YOUR_GITHUB_TOKEN

set -e

TOKEN=$1

if [ -z "$TOKEN" ]; then
    echo "❌ 错误: 请提供 GitHub Personal Access Token"
    echo ""
    echo "使用方法:"
    echo "  ./push-with-token.sh YOUR_GITHUB_TOKEN"
    echo ""
    echo "获取 Token 方法:"
    echo "  1. 访问: https://github.com/settings/tokens"
    echo "  2. 点击 'Generate new token (classic)'"
    echo "  3. 选择权限: repo"
    echo "  4. 生成并复制 Token"
    exit 1
fi

cd /Users/admin/.openclaw/workspace/agents/product-manager-agent/qimeng-demo-cocos

# 配置远程地址（带 Token）
git remote set-url origin "https://YealLiu:${TOKEN}@github.com/YealLiu/CocosDemo.git"

# 推送代码
echo "🚀 正在推送到 GitHub..."
git push -u origin main

# 恢复远程地址（移除 Token，为了安全）
git remote set-url origin "https://github.com/YealLiu/CocosDemo.git"

echo ""
echo "✅ 推送成功!"
echo ""
echo "仓库地址: https://github.com/YealLiu/CocosDemo"
