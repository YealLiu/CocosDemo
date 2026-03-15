# 启蒙PVP对战服务器 - API接口文档

## 概述

WebSocket服务器地址: `ws://localhost:8080`

所有消息格式为JSON，包含 `type` 和 `data` 字段：
```json
{
  "type": "message_type",
  "data": { ... }
}
```

---

## 1. 连接管理

### 1.1 连接建立

连接成功后，服务器会发送：
```json
{
  "type": "connection_established",
  "data": {
    "clientId": "uuid",
    "timestamp": 1234567890
  }
}
```

### 1.2 认证

客户端发送：
```json
{
  "type": "auth",
  "data": {
    "playerId": "player_001",
    "playerName": "玩家名称",
    "rank": 1500,
    "token": "jwt_token"
  }
}
```

服务器响应：
```json
{
  "type": "auth_success",
  "data": {
    "playerId": "player_001",
    "playerName": "玩家名称",
    "rank": 1500
  }
}
```

### 1.3 心跳

客户端发送：
```json
{
  "type": "ping",
  "data": {}
}
```

服务器响应：
```json
{
  "type": "pong",
  "data": {
    "timestamp": 1234567890
  }
}
```

---

## 2. 匹配系统

### 2.1 开始匹配

客户端发送：
```json
{
  "type": "match_start",
  "data": {
    "mode": "ranked"  // ranked: 排位, casual: 休闲
  }
}
```

服务器响应：
```json
{
  "type": "match_started",
  "data": {
    "mode": "ranked",
    "message": "正在寻找对手..."
  }
}
```

### 2.2 取消匹配

客户端发送：
```json
{
  "type": "match_cancel",
  "data": {}
}
```

服务器响应：
```json
{
  "type": "match_cancelled",
  "data": {
    "message": "已取消匹配"
  }
}
```

### 2.3 匹配成功

服务器主动推送：
```json
{
  "type": "match_found",
  "data": {
    "roomId": "uuid",
    "opponent": {
      "name": "对手名称",
      "rank": 1600
    },
    "mode": "ranked"
  }
}
```

### 2.4 匹配超时

服务器主动推送：
```json
{
  "type": "match_timeout",
  "data": {
    "message": "匹配超时，请重试"
  }
}
```

---

## 3. 对战系统

### 3.1 准备就绪

客户端发送：
```json
{
  "type": "battle_ready",
  "data": {
    "roomId": "uuid"
  }
}
```

### 3.2 对战开始

服务器主动推送（双方准备后）：
```json
{
  "type": "battle_start",
  "data": {
    "roomId": "uuid",
    "players": [
      {
        "id": "player_001",
        "name": "玩家1",
        "rank": 1500,
        "hp": 50,
        "isFirst": true
      },
      {
        "id": "player_002",
        "name": "玩家2",
        "rank": 1600,
        "hp": 50,
        "isFirst": false
      }
    ],
    "currentTurn": 1,
    "currentPlayer": "client_id_of_first_player",
    "turnTime": 30
  }
}
```

### 3.3 执行动作

#### 出牌
```json
{
  "type": "battle_action",
  "data": {
    "roomId": "uuid",
    "action": {
      "type": "play_card",
      "cardId": "card_uuid"
    }
  }
}
```

#### 使用技能
```json
{
  "type": "battle_action",
  "data": {
    "roomId": "uuid",
    "action": {
      "type": "use_skill",
      "skillId": "skill_001"
    }
  }
}
```

#### 结束回合
```json
{
  "type": "battle_action",
  "data": {
    "roomId": "uuid",
    "action": {
      "type": "end_turn"
    }
  }
}
```

#### 投降
```json
{
  "type": "battle_action",
  "data": {
    "roomId": "uuid",
    "action": {
      "type": "surrender"
    }
  }
}
```

### 3.4 动作结果

服务器广播：
```json
{
  "type": "action_result",
  "data": {
    "playerId": "player_001",
    "action": "use_skill",
    "damage": 5,
    "targetHp": 45
  }
}
```

### 3.5 回合切换

服务器广播：
```json
{
  "type": "turn_change",
  "data": {
    "currentTurn": 2,
    "currentPlayer": "client_id",
    "playerState": {
      "playerId": "player_001",
      "hp": 50,
      "maxHp": 50,
      "energy": 4,
      "maxEnergy": 10,
      "shield": 0,
      "handCount": 6,
      "deckCount": 24
    }
  }
}
```

### 3.6 对战结束

服务器广播：
```json
{
  "type": "battle_end",
  "data": {
    "reason": "hp_zero",  // hp_zero, surrender, disconnect, draw
    "winner": "player_001",
    "battleLog": [...]
  }
}
```

### 3.7 玩家断线

服务器广播：
```json
{
  "type": "player_disconnected",
  "data": {
    "clientId": "uuid",
    "reconnectTime": 60
  }
}
```

### 3.8 玩家重连

客户端发送：
```json
{
  "type": "battle_reconnect",
  "data": {
    "roomId": "uuid"
  }
}
```

服务器响应：
```json
{
  "type": "battle_reconnect_success",
  "data": {
    "roomState": { ... },
    "playerState": { ... }
  }
}
```

服务器广播：
```json
{
  "type": "player_reconnected",
  "data": {
    "clientId": "uuid"
  }
}
```

---

## 4. 错误处理

错误消息格式：
```json
{
  "type": "error",
  "data": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

### 错误码列表

| 错误码 | 描述 |
|--------|------|
| INVALID_MESSAGE | 消息格式错误 |
| UNKNOWN_MESSAGE_TYPE | 未知消息类型 |
| NOT_AUTHENTICATED | 未认证 |
| MATCH_START_FAILED | 匹配启动失败 |
| ROOM_NOT_FOUND | 房间不存在 |
| ACTION_FAILED | 动作执行失败 |
| RECONNECT_FAILED | 重连失败 |

---

## 5. 游戏配置

### 5.1 初始状态
- 初始生命值: 50 HP
- 初始手牌: 5张
- 初始能量: 3点（每回合+1，上限10）

### 5.2 回合规则
- 回合时间: 30秒
- 最大回合数: 30回合
- 超时自动结束回合

### 5.3 匹配规则
- 匹配超时: 30秒
- 优先匹配同段位玩家
- 等待30秒后扩大匹配范围

### 5.4 断线处理
- 断线重连时间: 60秒
- 超时未重连判负

---

## 6. 段位系统

| 段位 | 积分范围 |
|------|----------|
| 青铜 | 0-999 |
| 白银 | 1000-1999 |
| 黄金 | 2000-2999 |
| 铂金 | 3000-3999 |
| 钻石 | 4000-4999 |
| 大师 | 5000-5999 |
| 传说 | 6000+ |

---

**文档版本**: v1.0.0  
**作者**: ⚙️后端大牛  
**日期**: 2026-03-15