/**
 * 匹配服务 - 简化版
 * 实现玩家排队匹配和段位匹配逻辑
 * 
 * @author ⚙️后端大牛
 * @version 1.0.0
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// 段位配置
const RANK_TIERS = {
  bronze: { min: 0, max: 999, expandAfter: 30000 },
  silver: { min: 1000, max: 1999, expandAfter: 30000 },
  gold: { min: 2000, max: 2999, expandAfter: 30000 },
  platinum: { min: 3000, max: 3999, expandAfter: 30000 },
  diamond: { min: 4000, max: 4999, expandAfter: 30000 },
  master: { min: 5000, max: 5999, expandAfter: 30000 },
  legend: { min: 6000, max: 99999, expandAfter: 30000 }
};

class MatchmakingService {
  constructor() {
    // 等待队列: Map<clientId, matchInfo>
    this.waitingQueue = new Map();
    // 匹配超时时间 30秒
    this.MATCH_TIMEOUT = 30000;
    // 匹配轮询间隔 1秒
    this.MATCH_INTERVAL = 1000;
    // 启动匹配循环
    this.startMatchLoop();
  }

  /**
   * 开始匹配
   * @param {string} clientId - 客户端ID
   * @param {Object} playerData - 玩家数据
   * @param {string} mode - 匹配模式 (ranked/casual)
   * @returns {Object}
   */
  startMatch(clientId, playerData, mode = 'ranked') {
    // 检查是否已在队列中
    if (this.waitingQueue.has(clientId)) {
      return { success: false, error: '已经在匹配队列中' };
    }

    const matchInfo = {
      clientId,
      playerId: playerData.id,
      playerName: playerData.name,
      rank: playerData.rank || 0,
      tier: this.getTierByRank(playerData.rank || 0),
      mode,
      joinTime: Date.now(),
      matchRange: 0 // 匹配范围扩大次数
    };

    this.waitingQueue.set(clientId, matchInfo);
    logger.info(`🎯 玩家加入匹配队列 [${playerData.name}]，段位: ${matchInfo.tier}，模式: ${mode}`);

    return { success: true, message: '已进入匹配队列' };
  }

  /**
   * 取消匹配
   * @param {string} clientId - 客户端ID
   * @returns {boolean}
   */
  cancelMatch(clientId) {
    if (this.waitingQueue.has(clientId)) {
      const info = this.waitingQueue.get(clientId);
      this.waitingQueue.delete(clientId);
      logger.info(`❌ 玩家取消匹配 [${info.playerName}]`);
      return true;
    }
    return false;
  }

  /**
   * 启动匹配循环
   */
  startMatchLoop() {
    setInterval(() => {
      this.processMatchmaking();
    }, this.MATCH_INTERVAL);
    logger.info('🔄 匹配服务已启动');
  }

  /**
   * 处理匹配逻辑
   */
  processMatchmaking() {
    if (this.waitingQueue.size < 2) return;

    const waitingList = Array.from(this.waitingQueue.values());
    const matched = new Set();

    // 按段位分组
    const rankedGroups = this.groupByTier(waitingList.filter(p => p.mode === 'ranked'));
    const casualList = waitingList.filter(p => p.mode === 'casual');

    // 处理排位匹配
    for (const [tier, players] of rankedGroups) {
      this.matchPlayers(players, matched, true);
    }

    // 处理休闲匹配（随机匹配）
    this.matchPlayers(casualList, matched, false);

    // 移除已匹配的玩家
    matched.forEach(clientId => {
      this.waitingQueue.delete(clientId);
    });
  }

  /**
   * 按段位分组
   */
  groupByTier(players) {
    const groups = new Map();
    players.forEach(player => {
      if (!groups.has(player.tier)) {
        groups.set(player.tier, []);
      }
      groups.get(player.tier).push(player);
    });
    return groups;
  }

  /**
   * 匹配玩家
   * @param {Array} players - 玩家列表
   * @param {Set} matched - 已匹配集合
   * @param {boolean} useRank - 是否使用段位匹配
   */
  matchPlayers(players, matched, useRank = true) {
    // 按等待时间排序（等待久的优先）
    players.sort((a, b) => a.joinTime - b.joinTime);

    for (let i = 0; i < players.length; i++) {
      const player1 = players[i];
      if (matched.has(player1.clientId)) continue;

      // 计算匹配范围
      const waitTime = Date.now() - player1.joinTime;
      const rankRange = this.calculateRankRange(waitTime);

      // 寻找匹配对手
      for (let j = i + 1; j < players.length; j++) {
        const player2 = players[j];
        if (matched.has(player2.clientId)) continue;

        // 检查匹配条件
        if (this.canMatch(player1, player2, rankRange, useRank)) {
          this.createMatch(player1, player2);
          matched.add(player1.clientId);
          matched.add(player2.clientId);
          break;
        }
      }

      // 检查匹配超时
      if (waitTime > this.MATCH_TIMEOUT) {
        this.handleMatchTimeout(player1);
        matched.add(player1.clientId);
      }
    }
  }

  /**
   * 检查两个玩家是否可以匹配
   */
  canMatch(player1, player2, rankRange, useRank) {
    // 休闲模式直接匹配
    if (!useRank) return true;

    // 排位模式检查段位差距
    const rankDiff = Math.abs(player1.rank - player2.rank);
    return rankDiff <= rankRange;
  }

  /**
   * 计算匹配段位范围
   * 等待时间越长，匹配范围越大
   */
  calculateRankRange(waitTime) {
    // 基础范围 200分
    // 每等待10秒扩大100分
    const expansion = Math.floor(waitTime / 10000) * 100;
    return Math.min(200 + expansion, 2000); // 最大2000分差距
  }

  /**
   * 创建匹配
   */
  createMatch(player1, player2) {
    const roomId = uuidv4();
    const matchData = {
      roomId,
      player1: {
        clientId: player1.clientId,
        playerId: player1.playerId,
        name: player1.playerName,
        rank: player1.rank
      },
      player2: {
        clientId: player2.clientId,
        playerId: player2.playerId,
        name: player2.playerName,
        rank: player2.rank
      },
      mode: player1.mode,
      createdAt: Date.now()
    };

    logger.info(`✅ 匹配成功！房间 [${roomId}]：${player1.playerName} vs ${player2.playerName}`);

    // 触发匹配成功回调（由MessageHandler设置）
    if (this.onMatchFound) {
      this.onMatchFound(matchData);
    }
  }

  /**
   * 处理匹配超时
   */
  handleMatchTimeout(player) {
    logger.info(`⏱️ 匹配超时 [${player.playerName}]`);
    if (this.onMatchTimeout) {
      this.onMatchTimeout(player.clientId);
    }
  }

  /**
   * 根据积分获取段位
   */
  getTierByRank(rank) {
    for (const [tier, config] of Object.entries(RANK_TIERS)) {
      if (rank >= config.min && rank <= config.max) {
        return tier;
      }
    }
    return 'bronze';
  }

  /**
   * 获取队列信息
   */
  getQueueInfo() {
    return {
      total: this.waitingQueue.size,
      ranked: Array.from(this.waitingQueue.values()).filter(p => p.mode === 'ranked').length,
      casual: Array.from(this.waitingQueue.values()).filter(p => p.mode === 'casual').length
    };
  }

  /**
   * 设置匹配成功回调
   */
  setMatchFoundCallback(callback) {
    this.onMatchFound = callback;
  }

  /**
   * 设置匹配超时回调
   */
  setMatchTimeoutCallback(callback) {
    this.onMatchTimeout = callback;
  }
}

module.exports = MatchmakingService;