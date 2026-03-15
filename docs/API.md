# API 接口文档

## 1. GameManager API

### 1.1 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `instance` | `GameManager \| null` | 单例实例 |

### 1.2 方法

#### switchScene(screenType: ScreenType): void
切换场景

**参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| screenType | ScreenType | 目标场景类型 |

**示例:**
```typescript
GameManager.instance?.switchScene(ScreenType.BATTLE);
```

#### startGame(classId: string): void
开始新游戏

**参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| classId | string | 职业ID ('warrior' \| 'assassin' \| 'mage') |

**示例:**
```typescript
GameManager.instance?.startGame('warrior');
```

#### enterNode(nodeType: string): void
进入地图节点

**参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| nodeType | string | 节点类型 ('battle' \| 'elite' \| 'rest' \| 'shop') |

#### enterBoss(): void
进入Boss战

#### returnToMap(): void
战斗胜利后返回地图

#### gameOver(): void
游戏结束，返回主菜单

#### returnToMainMenu(): void
返回主菜单

#### showClassSelect(): void
显示职业选择界面

#### getCurrentFloor(): number
获取当前楼层

**返回:** 当前楼层数 (1-3)

#### getPlayer(): Player | null
获取玩家数据

**返回:** 玩家对象或null

---

## 2. GameState API

### 2.1 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `instance` | `GameState` | 单例实例 |
| `currentScreen` | `ScreenType` | 当前场景 |
| `player` | `Player \| null` | 玩家数据 |
| `currentEnemy` | `IEnemyData \| null` | 当前敌人 |
| `map` | `IMapState` | 地图状态 |
| `battle` | `IBattleState` | 战斗状态 |

### 2.2 方法

#### resetBattle(): void
重置战斗状态

#### shuffleDeck(): void
洗牌（Fisher-Yates算法）

#### drawCards(count: number): void
抽取卡牌

**参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| count | number | 抽取数量 |

#### gainBlock(amount: number): void
获得格挡

**参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| amount | number | 格挡值 |

#### nextFloor(): void
进入下一层

#### resetGame(): void
重置游戏

---

## 3. BattleSystem API

### 3.1 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `instance` | `BattleSystem \| null` | 单例实例 |
| `eventTarget` | `EventTarget` | 事件发射器 |
| `enemy` | `Enemy \| null` | 当前敌人实例 |
| `isBattleActive` | `boolean` | 战斗是否进行中 |

### 3.2 方法

#### startBattle(enemyId: string): void
开始战斗

**参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| enemyId | string | 敌人ID |

**示例:**
```typescript
BattleSystem.instance?.startBattle('dark_servant');
```

#### playCard(cardIndex: number): boolean
打出卡牌

**参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| cardIndex | number | 手牌索引 |

**返回:** 是否成功打出

**示例:**
```typescript
const success = BattleSystem.instance?.playCard(0);
```

#### endTurn(): void
结束回合

#### flee(): void
逃跑（Demo版不可用）

### 3.3 事件

#### BattleEvent 枚举

| 事件 | 说明 | 回调参数 |
|------|------|----------|
| `TURN_START` | 回合开始 | - |
| `TURN_END` | 回合结束 | - |
| `CARD_PLAYED` | 卡牌打出 | card: ICardData |
| `DAMAGE_DEALT` | 造成伤害 | damage: number |
| `BLOCK_GAINED` | 获得格挡 | block: number |
| `ENEMY_TURN` | 敌人回合 | intent: IEnemyIntent |
| `BATTLE_WON` | 战斗胜利 | result: BattleResult |
| `BATTLE_LOST` | 战斗失败 | - |
| `LOG_MESSAGE` | 战斗日志 | message: string |

**事件监听示例:**
```typescript
BattleSystem.instance?.eventTarget.on(
    BattleEvent.TURN_START, 
    this.onTurnStart, 
    this
);
```

---

## 4. CardEffects API

### 4.1 静态方法

#### executeCardEffect(cardId: string, gameState: GameState, target?: any): void
执行卡牌效果

**参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| cardId | string | 卡牌ID |
| gameState | GameState | 游戏状态实例 |
| target | any | 目标对象（可选） |

#### dealDamage(gameState: GameState, target: any, amount: number): void
造成伤害

#### dealDamageIgnoreBlock(gameState: GameState, target: any, amount: number): void
无视格挡造成伤害

#### gainBlock(gameState: GameState, amount: number): void
获得格挡

#### drawCards(gameState: GameState, count: number): void
抽牌

#### addPower(gameState: GameState, powerType: string, value: number, duration: number): void
添加临时力量

---

## 5. 数据库 API

### 5.1 CardDatabase

```typescript
// 获取卡牌数据
const card = CardDatabase['strike'];

// 获取卡牌类型颜色
const color = getCardTypeColor(CardType.ATTACK);  // '#ff4444'
```

### 5.2 EnemyDatabase

```typescript
// 获取随机敌人
const enemyId = getRandomEnemy(floor);  // floor: 1-3

// 获取精英敌人
const eliteId = getEliteEnemy();  // 'heavy_knight'

// 获取Boss
const bossId = getBoss();  // 'gatekeeper'

// 创建敌人实例
const enemy = new Enemy('dark_servant');
```

**Enemy 类方法:**
| 方法 | 说明 |
|------|------|
| `getNextIntent()` | 获取并切换到下一个意图 |
| `getCurrentIntent()` | 获取当前意图 |
| `reset()` | 重置敌人状态 |
| `isEnraged()` | 是否处于狂暴状态 |

### 5.3 ClassDatabase

```typescript
// 获取职业数据
const classData = ClassDatabase['warrior'];

// 检查职业是否解锁
const unlocked = isClassUnlocked('assassin', completedRuns);
```

---

## 6. 数据接口定义

### 6.1 ICardData

```typescript
interface ICardData {
    id: string;              // 卡牌ID
    name: string;            // 卡牌名称
    cost: number;            // 能量消耗
    type: CardType;          // 类型
    rarity: CardRarity;      // 稀有度
    description: string;     // 描述
}
```

### 6.2 IEnemyData

```typescript
interface IEnemyData {
    id: string;              // 敌人ID
    name: string;            // 敌人名称
    hp: number;              // 生命值
    maxHp: number;           // 最大生命值
    intents: IEnemyIntent[]; // 意图列表
    isBoss?: boolean;        // 是否为Boss
    isElite?: boolean;       // 是否为精英
    enrageThreshold?: number; // 狂暴阈值
}
```

### 6.3 IClassData

```typescript
interface IClassData {
    id: string;              // 职业ID
    name: string;            // 职业名称
    maxHp: number;           // 最大生命值
    startingDeck: string[];  // 初始卡组
    relic: IRelicData;       // 起始遗物
}
```

### 6.4 IRelicData

```typescript
interface IRelicData {
    name: string;            // 遗物名称
    description: string;     // 描述
    effect: string;          // 效果类型
    value: number;           // 效果数值
}
```

### 6.5 IPowerData

```typescript
interface IPowerData {
    name: string;            // 能力名称
    effect: string;          // 效果类型
    value: number;           // 效果数值
    duration?: number;       // 持续回合
    used?: boolean;          // 是否已使用
}
```

### 6.6 BattleResult

```typescript
interface BattleResult {
    won: boolean;            // 是否胜利
    rating: string;          // 评价等级
    desc: string;            // 评价描述
    goldReward: number;      // 金币奖励
}
```

---

## 7. 枚举定义

### 7.1 ScreenType

```typescript
enum ScreenType {
    MENU = 'menu',
    CLASS_SELECT = 'class-select',
    MAP = 'map',
    BATTLE = 'battle'
}
```

### 7.2 CardType

```typescript
enum CardType {
    ATTACK = 'attack',    // 攻击卡
    SKILL = 'skill',      // 技能卡
    POWER = 'power'       // 能力卡
}
```

### 7.3 CardRarity

```typescript
enum CardRarity {
    COMMON = 'common',      // 普通
    RARE = 'rare',          // 稀有
    EPIC = 'epic',          // 史诗
    LEGENDARY = 'legendary' // 传说
}
```

### 7.4 BattleEvent

```typescript
enum BattleEvent {
    TURN_START = 'turn_start',
    TURN_END = 'turn_end',
    CARD_PLAYED = 'card_played',
    DAMAGE_DEALT = 'damage_dealt',
    BLOCK_GAINED = 'block_gained',
    ENEMY_TURN = 'enemy_turn',
    BATTLE_WON = 'battle_won',
    BATTLE_LOST = 'battle_lost',
    LOG_MESSAGE = 'log_message'
}
```

---

## 8. 使用示例

### 8.1 开始一场战斗

```typescript
import { GameManager } from './GameManager';
import { BattleSystem, BattleEvent } from './BattleSystem';
import { GameState } from './GameState';

// 开始游戏
GameManager.instance?.startGame('warrior');

// 进入战斗
GameManager.instance?.enterNode('battle');

// 监听战斗事件
BattleSystem.instance?.eventTarget.on(
    BattleEvent.BATTLE_WON, 
    (result) => {
        console.log(`战斗胜利！评价: ${result.rating}`);
        console.log(`获得金币: ${result.goldReward}`);
    },
    this
);
```

### 8.2 打出卡牌

```typescript
import { BattleSystem } from './BattleSystem';

// 打出第0张手牌
const success = BattleSystem.instance?.playCard(0);
if (success) {
    console.log('出牌成功');
} else {
    console.log('出牌失败（能量不足或其他原因）');
}
```

### 8.3 获取游戏状态

```typescript
import { GameState } from './GameState';

// 获取当前玩家
const player = GameState.instance.player;
console.log(`HP: ${player?.hp}/${player?.maxHp}`);

// 获取战斗状态
const battle = GameState.instance.battle;
console.log(`能量: ${battle.energy}/${battle.maxEnergy}`);
console.log(`手牌: ${battle.hand.length}张`);
```
