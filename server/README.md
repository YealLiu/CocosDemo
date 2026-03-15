# 启蒙PVP对战服务器

WebSocket实时对战服务器，支持匹配系统和回合制战斗。

## 快速开始

### 安装依赖

```bash
cd server
npm install
```

### 启动服务器

```bash
npm start
```

或开发模式（热重载）：
```bash
npm run dev
```

服务器默认运行在 `ws://localhost:8080`

## 项目结构

```
server/
├── src/
│   ├── index.js                 # 服务器入口
│   ├── services/
│   │   ├── ConnectionManager.js # 连接管理
│   │   ├── MatchmakingService.js # 匹配服务
│   │   ├── BattleService.js     # 对战服务
│   │   └── MessageHandler.js    # 消息处理器
│   └── utils/
│       └── logger.js            # 日志工具
├── package.json
├── API_DOCUMENTATION.md         # API接口文档
└── README.md
```

## 核心功能

### 1. WebSocket服务器
- 实时双向通信
- 心跳检测（30秒间隔）
- 连接管理
- 自动重连支持

### 2. 匹配系统
- 排位/休闲模式
- 段位匹配算法
- 匹配超时处理（30秒）
- 匹配范围动态扩大

### 3. 对战系统
- 回合制战斗
- 30秒回合限时
- 断线重连（60秒）
- 自动胜负判定

## 配置

在 `src/index.js` 中修改：

```javascript
const CONFIG = {
  PORT: 8080,              // 服务器端口
  HEARTBEAT_INTERVAL: 30000,  // 心跳间隔（毫秒）
  HEARTBEAT_TIMEOUT: 60000    // 心跳超时（毫秒）
};
```

## API文档

详见 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 开发计划

- [x] WebSocket服务器搭建
- [x] 连接管理和心跳检测
- [x] 匹配服务（排位/休闲）
- [x] 对战服务（回合制）
- [x] 断线重连
- [ ] 数据库集成
- [ ] 排名积分系统
- [ ] 观战功能

## 技术栈

- Node.js
- ws (WebSocket库)
- uuid (UUID生成)

## 作者

⚙️后端大牛