# 系统功能文档

## 系统架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        场景层 (Scene)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │MenuScene │ │ClassScene│ │ MapScene │ │BattleSce │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
├───────┼────────────┼────────────┼────────────┼─────────────┤
│       └────────────┴────────────┴────────────┘              │
│                        GameManager                           │
│                    (场景切换/流程控制)                        │
├─────────────────────────────────────────────────────────────┤
│                      核心系统层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  GameState   │  │ BattleSystem │  │  InputMgr    │      │
│  │  (状态管理)   │  │  (战斗逻辑)   │  │  (输入处理)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                      数据层                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ CardDatabase │  │EnemyDatabase │  │ClassDatabase │      │
│  │  (卡牌数据)   │  │  (敌人数据)   │  │  (职业数据)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 1. 场景系统

### 1.1 场景列表

| 场景名称 | 文件 | 功能描述 |
|----------|------|----------|
| 主菜单 | MenuScene | 游戏入口，提供开始游戏、帮助等选项 |
| 职业选择 | ClassSelectScene | 选择职业，显示解锁状态 |
| 地图 | MapScene | 爬塔地图，选择节点进行探索 |
| 战斗 | BattleScene | 回合制战斗核心场景 |

### 1.2 场景切换流程

```typescript
// 场景切换通过 GameManager 统一管理
GameManager.instance.switchScene(ScreenType.BATTLE);

// 场景名称映射
const SceneNames: Record<ScreenType, string> = {
    [ScreenType.MENU]: 'MenuScene',
    [ScreenType.CLASS_SELECT]: 'ClassSelectScene',
    [ScreenType.MAP]: 'MapScene',
    [ScreenType.BATTLE]: 'BattleScene'
};
```

### 1.3 场景生命周期

```
onLoad() → onEnable() → start() → update() → onDisable() → onDestroy()
   ↓           ↓          ↓
初始化      更新UI      游戏逻辑
```

## 2. 游戏状态系统 (GameState)

### 2.1 职责
- 管理全局游戏数据
- 提供数据持久化接口（当前为内存存储）
- 实现单例模式确保数据唯一性

### 2.2 核心数据结构

#### 玩家数据 (Player)
```typescript
class Player {
    class: string;           // 职业ID
    name: string;            // 职业名称
    maxHp: number;           // 最大生命值
    hp: number;              // 当前生命值
    gold: number;            // 金币
    deck: string[];          // 卡组（卡牌ID列表）
    relics: IRelicData[];    // 遗物列表
    powers: IPowerData[];    // 能力列表
    floor: number;           // 当前楼层
}
```

#### 战斗状态 (IBattleState)
```typescript
interface IBattleState {
    turn: number;            // 当前回合数
    hand: string[];          // 手牌（卡牌ID列表）
    drawPile: string[];      // 抽牌堆
    discardPile: string[];   // 弃牌堆
    energy: number;          // 当前能量
    maxEnergy: number;       // 最大能量
    block: number;           // 当前格挡值
}
```

#### 地图状态 (IMapState)
```typescript
interface IMapState {
    floor: number;           // 当前楼层 (1-3)
    currentNode: string | null; // 当前节点ID
}
```

### 2.3 核心方法

| 方法 | 功能 |
|------|------|
| `resetBattle()` | 重置战斗状态，准备新战斗 |
| `shuffleDeck()` | 洗牌（Fisher-Yates算法） |
| `drawCards(count)` | 从抽牌堆抽取指定数量卡牌 |
| `gainBlock(amount)` | 增加格挡值 |
| `nextFloor()` | 进入下一层 |
| `resetGame()` | 重置整个游戏 |

### 2.4 抽牌算法

```typescript
public drawCards(count: number): void {
    for (let i = 0; i < count; i++) {
        // 抽牌堆为空时，弃牌堆洗牌
        if (this.battle.drawPile.length === 0) {
            if (this.battle.discardPile.length === 0) break;
            this.battle.drawPile = [...this.battle.discardPile];
            this.battle.discardPile = [];
            this.shuffleDeck();
        }
        // 抽取一张牌
        if (this.battle.drawPile.length > 0) {
            const cardId = this.battle.drawPile.pop()!;
            this.battle.hand.push(cardId);
        }
    }
}
```

## 3. 战斗系统 (BattleSystem)

### 3.1 职责
- 管理战斗流程
- 处理卡牌效果执行
- 实现敌人AI
- 判定战斗胜负

### 3.2 战斗事件

```typescript
export enum BattleEvent {
    TURN_START = 'turn_start',      // 回合开始
    TURN_END = 'turn_end',          // 回合结束
    CARD_PLAYED = 'card_played',    // 卡牌打出
    DAMAGE_DEALT = 'damage_dealt',  // 造成伤害
    BLOCK_GAINED = 'block_gained',  // 获得格挡
    ENEMY_TURN = 'enemy_turn',      // 敌人回合
    BATTLE_WON = 'battle_won',      // 战斗胜利
    BATTLE_LOST = 'battle_lost',    // 战斗失败
    LOG_MESSAGE = 'log_message'     // 战斗日志
}
```

### 3.3 战斗流程

```
开始战斗
    ↓
创建敌人实例
    ↓
重置战斗状态
    ↓
初始抽牌(5张)
    ↓
应用起始遗物效果
    ↓
回合开始 → 玩家回合 → 打出卡牌/结束回合
    ↓
敌人回合 → 执行意图 → 应用效果
    ↓
检查胜负 → 是 → 结束战斗
    ↓
否 → 新回合 → 回合开始
```

### 3.4 敌人AI

敌人使用**意图轮询**系统：

```typescript
// 敌人意图定义
interface IEnemyIntent {
    type: string;    // 意图类型: attack/defend/buff/debuff/special
    value: number;   // 数值
    icon: string;    // 显示图标
    desc?: string;   // 描述
}

// 获取下一个意图
getNextIntent(): IEnemyIntent {
    const intent = this.intents[this.currentIntent];
    this.currentIntent = (this.currentIntent + 1) % this.intents.length;
    return intent;
}
```

#### 意图类型处理

| 意图类型 | 处理逻辑 |
|----------|----------|
| attack | 造成伤害，先扣减玩家格挡 |
| defend | 增加敌人格挡 |
| buff | 敌人获得增益效果 |
| debuff | 对玩家施加减益 |
| special | 特殊行动（蓄力、反击姿态等） |

### 3.5 伤害计算流程

```typescript
// 1. 计算基础伤害
let damage = baseDamage;

// 2. 应用狂战士之血加成
if (hasBerserkerBlood) {
    const hpPercent = 1 - (currentHp / maxHp);
    damage += Math.floor(hpPercent * 10) * powerValue;
}

// 3. 检查狂暴状态
if (enemy.isEnraged()) {
    damage *= 2;
}

// 4. 应用格挡
if (!isArmorBreak) {
    if (block >= damage) {
        block -= damage;
        damage = 0;
    } else {
        damage -= block;
        block = 0;
    }
}

// 5. 扣减生命值
hp -= damage;

// 6. 触发反击
if (hasCounterStance) {
    enemy.hp -= counterDamage;
}
```

## 4. 卡牌系统

### 4.1 卡牌数据结构

```typescript
interface ICardData {
    id: string;              // 唯一标识
    name: string;            // 卡牌名称
    cost: number;            // 能量消耗
    type: CardType;          // 类型: ATTACK/SKILL/POWER
    rarity: CardRarity;      // 稀有度
    description: string;     // 描述文本
}
```

### 4.2 卡牌效果实现

卡牌效果通过 `CardEffects.executeCardEffect()` 统一执行：

```typescript
static executeCardEffect(cardId: string, gameState: GameState, target?: any): void {
    switch (cardId) {
        case 'strike':
            this.dealDamage(gameState, target, 6);
            break;
        case 'defend':
            this.gainBlock(gameState, 5);
            break;
        // ... 其他卡牌
    }
}
```

### 4.3 效果函数列表

| 函数 | 功能 |
|------|------|
| `dealDamage()` | 造成伤害（考虑格挡） |
| `dealDamageIgnoreBlock()` | 无视格挡造成伤害 |
| `gainBlock()` | 获得格挡 |
| `drawCards()` | 抽牌 |
| `addPower()` | 添加临时力量 |
| `addNextTurnEnergy()` | 下回合增加能量 |
| `removeAllDebuffs()` | 移除所有负面状态 |

## 5. 职业系统

### 5.1 职业数据结构

```typescript
interface IClassData {
    id: string;              // 职业ID
    name: string;            // 职业名称
    maxHp: number;           // 最大生命值
    startingDeck: string[];  // 初始卡组
    relic: IRelicData;       // 起始遗物
}
```

### 5.2 职业解锁系统

```typescript
// 解锁条件定义
const ClassUnlockConditions: Record<string, { required: string; times: number }> = {
    'assassin': { required: 'warrior', times: 1 },
    'mage': { required: 'warrior', times: 1 }
};

// 检查解锁状态
export function isClassUnlocked(classId: string, completedRuns: Record<string, number>): boolean {
    if (classId === 'warrior') return true;
    const condition = ClassUnlockConditions[classId];
    return (completedRuns[condition.required] || 0) >= condition.times;
}
```

## 6. 敌人系统

### 6.1 敌人数据结构

```typescript
interface IEnemyData {
    id: string;              // 敌人ID
    name: string;            // 敌人名称
    hp: number;              // 生命值
    maxHp: number;           // 最大生命值
    intents: IEnemyIntent[]; // 意图列表
    isBoss?: boolean;        // 是否为Boss
    isElite?: boolean;       // 是否为精英
    enrageThreshold?: number; // 狂暴阈值（血量百分比）
}
```

### 6.2 敌人分类

| 类型 | 特点 | 生成规则 |
|------|------|----------|
| 普通敌人 | 较弱，基础奖励 | 根据楼层随机生成 |
| 精英敌人 | 较强，更好奖励 | 固定为"重装骑士" |
| Boss | 每层最终挑战 | 固定为"守门者" |

### 6.3 敌人生成

```typescript
// 根据楼层获取随机敌人
export function getRandomEnemy(floor: number): string {
    if (floor === 1) {
        return randomPick(['dark_servant', 'cursed_mage']);
    } else {
        return randomPick([
            'dark_servant', 'cursed_mage', 'shadow_hunter', 
            'corrupted_guard', 'berserk_orc'
        ]);
    }
}
```

## 7. UI系统

### 7.1 战斗场景UI组件

| 组件 | 类型 | 功能 |
|------|------|------|
| playerHpLabel | Label | 显示玩家HP |
| playerHpBar | ProgressBar | 玩家血条 |
| playerEnergyLabel | Label | 显示能量 |
| playerBlockLabel | Label | 显示格挡 |
| enemyNameLabel | Label | 敌人名称 |
| enemyHpLabel | Label | 敌人HP |
| enemyHpBar | ProgressBar | 敌人血条 |
| enemyIntentLabel | Label | 敌人意图 |
| handArea | Node | 手牌容器 |
| cardPrefab | Prefab | 卡牌预制体 |
| battleLogLabel | Label | 战斗日志 |
| gameOverPanel | Node | 游戏结束面板 |

### 7.2 卡牌UI

卡牌预制体包含以下子节点：
- **Name**: 卡牌名称标签
- **Cost**: 费用标签
- **Desc**: 描述标签
- **Type**: 类型图标（颜色区分）

## 8. 事件系统

战斗系统使用 Cocos Creator 的 EventTarget 进行组件间通信：

```typescript
// 绑定事件
battleSystem.eventTarget.on(BattleEvent.TURN_START, this.onTurnStart, this);

// 触发事件
this.eventTarget.emit(BattleEvent.TURN_START);

// 解绑事件
battleSystem.eventTarget.off(BattleEvent.TURN_START, this.onTurnStart, this);
```

## 9. 扩展性设计

### 9.1 添加新卡牌

1. 在 `CardDatabase.ts` 中添加卡牌数据
2. 在 `CardEffects.executeCardEffect()` 中实现效果
3. 更新卡牌获取途径（敌人掉落、商店等）

### 9.2 添加新敌人

1. 在 `EnemyDatabase.ts` 中添加敌人数据
2. 定义意图列表
3. 更新 `getRandomEnemy()` 函数

### 9.3 添加新职业

1. 在 `ClassDatabase.ts` 中添加职业数据
2. 定义初始卡组和遗物
3. 在 `ClassUnlockConditions` 中添加解锁条件
4. 更新职业选择界面

## 10. 性能优化

### 10.1 已实施的优化
- 使用对象池管理卡牌节点（可扩展）
- 单例模式减少重复创建
- 事件驱动减少轮询

### 10.2 待优化项
- 纹理图集合并
- 卡牌对象池
- 场景预加载
