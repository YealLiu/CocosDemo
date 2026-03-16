# MenuScene 修复说明

## 修复内容

### 1. 场景文件修复 (MenuScene.scene)
- ✅ 添加了 `MenuScene` 脚本组件到 Canvas 节点
- ✅ 绑定了 `startButton` 属性引用
- ✅ 清理了无效的 ClickEvent 配置
- ✅ 调整了组件ID顺序

### 2. 脚本文件修复 (MenuScene.ts)
- ✅ 添加了备用按钮查找逻辑（通过节点名称）
- ✅ 添加了调试日志便于排查问题
- ✅ 增强了空值检查

## 如何测试

1. **关闭Cocos Creator**（如果已打开）
2. **重新打开项目**
3. **等待资源导入完成**
4. **双击打开 MenuScene**
5. **点击预览按钮**

## 如果仍然报错

如果仍然出现 `_onBatchCreated` 错误，请尝试：

### 方法1：删除Library重新导入
```bash
rm -rf /Users/admin/Documents/cocos/qimeng-demo-cocos/library/*
rm -rf /Users/admin/Documents/cocos/qimeng-demo-cocos/temp/*
```

### 方法2：在Cocos编辑器中重新保存场景
1. 打开 MenuScene
2. 不做任何修改，直接按 Ctrl+S (Cmd+S)
3. 这会触发编辑器重新序列化场景文件

### 方法3：检查Cocos版本
确保使用的是 **Cocos Creator 3.8.8** 版本

## 预期结果

修复后，MenuScene 应该能够：
- ✅ 在编辑器中正常打开
- ✅ 预览时显示主菜单
- ✅ 点击"开始游戏"按钮跳转到职业选择界面

## 调试信息

如果仍有问题，打开浏览器控制台查看日志：
- `[MenuScene] onLoad` - 表示脚本已加载
- `[MenuScene] StartButton event bound` - 表示按钮事件已绑定
- `[MenuScene] StartButton found and bound by name` - 表示通过名称找到了按钮

---
修复时间：2026-03-15