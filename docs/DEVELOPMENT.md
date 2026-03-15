# 开发指南

## 1. 快速开始

### 1.1 环境准备

确保已安装以下软件：
- Cocos Creator 3.8+
- Node.js 18+
- TypeScript 支持

### 1.2 打开项目

```bash
# 进入项目目录
cd qimeng-demo-cocos

# 使用 Cocos Creator 打开
cocos creator --path .
```

### 1.3 项目结构说明

```
assets/
├── scripts/          # 游戏逻辑脚本
├── scenes/           # 场景文件
├── resources/        # 游戏资源
└── prefabs/          # 预制体
```

## 2. 开发规范

### 2.1 代码规范

#### 命名规范
- **类名**: PascalCase (如 `BattleSystem`)
- **方法名**: camelCase (如 `startBattle`)
- **常量**: UPPER_SNAKE_CASE (如 `MAX_HP`)
- **接口**: 前缀 I (如 `ICardData`)
- **枚举**: PascalCase (如 `CardType`)

#### 文件组织
```typescript
// 1. 导入
import { _decorator, Component } from 'cc';

// 2. 常量定义
const { ccclass, property } = _decorator;

// 3. 类定义
@ccclass('ClassName')
export class ClassName extends Component {
    // 4. 属性
    @property(Node)
    nodeRef: Node | null = null;
    
    // 5. 生命周期
    onLoad() {}
    start() {}
    update(dt: number) {}
    onDestroy() {}
    
    // 6. 公共方法
    public publicMethod(): void {}
    
    // 7. 私有方法
    private privateMethod(): void {}
}
```

### 2.2 注释规范

```typescript
/**
 * 类/方法说明
 * @param paramName 参数说明
 * @returns 返回值说明
 */

// 单行注释用于简单说明
```

## 3. 添加新功能

### 3.1 添加新卡牌

1. **定义卡牌数据** (`CardDatabase.ts`)

```typescript
export const CardDatabase: Record<string, ICardData> = {
    // ... 现有卡牌
    
    'new_card': {
        id: 'new_card',
        name: '新卡牌',
        cost: 1,
        type: CardType.ATTACK,
        rarity: CardRarity.COMMON,
        description: '造成10点伤害'
    }
};
```

2. **实现卡牌效果** (`CardEffects.executeCardEffect`)

```typescript
static executeCardEffect(cardId: string, gameState: GameState, target?: any): void {
    switch (cardId) {
        // ... 现有效果
        
        case 'new_card':
            this.dealDamage(gameState, target, 10);
            break;
    }
}
```

3. **添加到获取途径**（如敌人掉落、商店等）

### 3.2 添加新敌人

1. **定义敌人数据** (`EnemyDatabase.ts`)

```typescript
export const EnemyDatabase: Record<string, IEnemyData> = {
    // ... 现有敌人
    
    'new_enemy': {
        id: 'new_enemy',
        name: '新敌人',
        hp: 50,
        maxHp: 50,
        intents: [
            { type: 'attack', value: 10, icon: '🔴' },
            { type: 'defend', value: 8, icon: '🔵' }
        ]
    }
};
```

2. **更新敌人生成逻辑**

```typescript
export function getRandomEnemy(floor: number): string {
    const enemies = ['dark_servant', 'new_enemy'];  // 添加新敌人
    return enemies[Math.floor(Math.random() * enemies.length)];
}
```

### 3.3 添加新职业

1. **定义职业数据** (`ClassDatabase.ts`)

```typescript
export const ClassDatabase: Record<string, IClassData> = {
    // ... 现有职业
    
    'new_class': {
        id: 'new_class',
        name: '新职业',
        maxHp: 70,
        startingDeck: [
            'strike', 'strike', 'strike', 'strike',
            'defend', 'defend', 'defend', 'defend'
        ],
        relic: {
            name: '新遗物',
            description: '每回合+2格挡',
            effect: 'start_turn_block',
            value: 2
        }
    }
};
```

2. **添加解锁条件**

```typescript
export const ClassUnlockConditions: Record<string, { required: string; times: number }> = {
    // ... 现有条件
    
    'new_class': { required: 'warrior', times: 2 }
};
```

3. **更新职业选择界面** (`ClassSelectScene.ts`)

```typescript
@property(Node)
newClassCard: Node | null = null;

onLoad() {
    // ... 现有绑定
    this.newClassCard?.on(Node.EventType.TOUCH_END, () => this.onClassSelect('new_class'));
}
```

## 4. 场景开发

### 4.1 创建新场景

1. 在 `assets/scenes/` 创建 `.scene` 文件
2. 创建对应的场景控制器脚本
3. 在 `GameManager` 中添加场景映射

```typescript
const SceneNames: Record<ScreenType, string> = {
    // ... 现有场景
    [ScreenType.NEW_SCENE]: 'NewScene'
};
```

### 4.2 场景控制器模板

```typescript
import { _decorator, Component, Node, Button } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('NewScene')
export class NewScene extends Component {
    @property(Button)
    backButton: Button | null = null;

    onLoad() {
        this.backButton?.node.on(Button.EventType.CLICK, this.onBackClick, this);
    }

    onDestroy() {
        this.backButton?.node.off(Button.EventType.CLICK, this.onBackClick, this);
    }

    private onBackClick(): void {
        GameManager.instance?.returnToMainMenu();
    }
}
```

## 5. UI开发

### 5.1 创建UI组件

1. 在场景中创建UI节点
2. 绑定节点引用

```typescript
@property(Label)
hpLabel: Label | null = null;

@property(ProgressBar)
hpBar: ProgressBar | null = null;
```

3. 在编辑器中拖拽绑定

### 5.2 更新UI

```typescript
private updateUI(): void {
    const player = GameState.instance.player;
    
    if (this.hpLabel) {
        this.hpLabel.string = `${player?.hp}/${player?.maxHp}`;
    }
    
    if (this.hpBar) {
        this.hpBar.progress = (player?.hp || 0) / (player?.maxHp || 1);
    }
}
```

## 6. 事件系统

### 6.1 发送事件

```typescript
BattleSystem.instance?.eventTarget.emit('custom_event', data);
```

### 6.2 监听事件

```typescript
onLoad() {
    BattleSystem.instance?.eventTarget.on('custom_event', this.onCustomEvent, this);
}

onDestroy() {
    BattleSystem.instance?.eventTarget.off('custom_event', this.onCustomEvent, this);
}

private onCustomEvent(data: any): void {
    // 处理事件
}
```

## 7. 调试技巧

### 7.1 控制台输出

```typescript
console.log('普通日志');
console.warn('警告');
console.error('错误');
```

### 7.2 断点调试

在 Cocos Creator 中：
1. 点击行号设置断点
2. 使用 Chrome DevTools 调试
3. 或直接在编辑器控制台查看

### 7.3 性能分析

```typescript
// 计时
console.time('operation');
// ... 执行操作
console.timeEnd('operation');
```

## 8. 构建发布

### 8.1 Web预览

```bash
# Cocos Creator 内置预览
# 点击编辑器上方的预览按钮
```

### 8.2 Android构建

1. 项目 → 构建发布
2. 选择 Android 平台
3. 配置包名: `com.qimeng.game`
4. 点击构建
5. 点击生成

### 8.3 常见问题

| 问题 | 解决方案 |
|------|----------|
| 构建失败 | 检查Android SDK路径配置 |
| 场景黑屏 | 检查场景相机设置 |
| 脚本报错 | 检查TypeScript编译错误 |
| 资源丢失 | 检查资源路径和引用 |

## 9. 版本管理

### 9.1 Git工作流

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 提交更改
git add .
git commit -m "feat: 添加新功能"

# 合并到主分支
git checkout main
git merge feature/new-feature
```

### 9.2 版本号规范

使用语义化版本：
- `v1.0.0` - 主版本.次版本.修订号
- `v1.1.0` - 新增功能
- `v1.1.1` - Bug修复

## 10. 最佳实践

### 10.1 性能优化

- 使用对象池管理频繁创建销毁的对象
- 避免在 `update` 中执行复杂计算
- 使用图集减少Draw Call
- 及时释放不用的资源

### 10.2 代码组织

- 单一职责原则：一个类只负责一件事
- 避免循环依赖
- 使用接口定义数据结构
- 保持方法简短（<50行）

### 10.3 可维护性

- 写清晰的注释
- 使用有意义的命名
- 保持代码格式一致
- 及时重构坏代码
