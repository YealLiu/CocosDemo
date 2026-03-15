/**
 * 对战服务 - 简化版
 * 管理对战房间、回合逻辑、战斗结算
 * 
 * @author ⚙️后端大牛
 * @version 1.0.0
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// 游戏配置
const GAME_CONFIG = {
  INITIAL_HP: 50,
  INITIAL_HAND: 5,
  INITIAL_ENERGY: 3,
  MAX_ENERGY: 10,
  TURN_TIME: 30, // 回合时间30秒
  MAX_TURNS: 30, // 最大回合数
  DISCONNECT_TIMEOUT: 60 // 断线重连时间60秒
};

class BattleService {
  constructor() {
    // 对战房间: Map<roomId, roomData>
    this.rooms = new Map();
    // 断线玩家: Map<clientId, {roomId, disconnectTime}>
    this.disconnectedPlayers = new Map();
    
    // 启动游戏循环
    this.startGameLoop();
  }

  /**
   * 创建对战房间
   * @param {Object} matchData - 匹配数据
   * @returns {Object}
   */
  createRoom(matchData) {
    const roomId = matchData.roomId;
    const room = {
      id: roomId,
      mode: matchData.mode,
      players: {
        [matchData.player1.clientId]: {
          ...matchData.player1,
          hp: GAME_CONFIG.INITIAL_HP,
          maxHp: GAME_CONFIG.INITIAL_HP,
          energy: GAME_CONFIG.INITIAL_ENERGY,
          maxEnergy: GAME_CONFIG.MAX_ENERGY,
          hand: [], // 手牌
          deck: [], // 卡组
          field: [], // 场上卡牌
          shield: 0, // 护盾
          isFirst: true // 先手
        },
        [matchData.player2.clientId]: {
          ...matchData.player2,
          hp: GAME_CONFIG.INITIAL_HP,
          maxHp: GAME_CONFIG.INITIAL_HP,
          energy: GAME_CONFIG.INITIAL_ENERGY,
          maxEnergy: GAME_CONFIG.MAX_ENERGY,
          hand: [],
          deck: [],
          field: [],
          shield: 0,
          isFirst: false
        }
      },
      state: 'waiting', // waiting, playing, ended
      currentTurn: 1,
      currentPlayer: matchData.player1.clientId, // 先手玩家
      turnStartTime: null,
      turnTimeout: null,
      winner: null,
      disconnectTimer: null,
      battleLog: []
    };

    this.rooms.set(roomId, room);
    logger.info(`🏟️ 对战房间创建 [${roomId}]`);
    
    return room;
  }

  /**
   * 开始对战
   * @param {string} roomId - 房间ID
   */
  startBattle(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.state = 'playing';
    room.turnStartTime = Date.now();
    
    // 初始化玩家卡组（简化版，随机生成）
    Object.keys(room.players).forEach(clientId => {
      const player = room.players[clientId];
      player.deck = this.generateDeck();
      player.hand = this.drawCards(player.deck, GAME_CONFIG.INITIAL_HAND);
    });

    logger.info(`⚔️ 对战开始 [${roomId}]`);

    // 通知双方玩家
    this.broadcastToRoom(roomId, {
      type: 'battle_start',
      data: {
        roomId,
        players: Object.values(room.players).map(p => ({
          id: p.playerId,
          name: p.name,
          rank: p.rank,
          hp: p.hp,
          isFirst: p.isFirst
        })),
        currentTurn: room.currentTurn,
        currentPlayer: room.currentPlayer,
        turnTime: GAME_CONFIG.TURN_TIME
      }
    });

    // 启动回合计时
    this.startTurnTimer(roomId);
  }

  /**
   * 执行玩家动作
   * @param {string} roomId - 房间ID
   * @param {string} clientId - 客户端ID
   * @param {Object} action - 动作数据
   * @returns {Object}
   */
  executeAction(roomId, clientId, action) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'playing') {
      return { success: false, error: '房间不存在或对战未开始' };
    }

    // 检查是否轮到该玩家
    if (room.currentPlayer !== clientId) {
      return { success: false, error: '不是你的回合' };
    }

    const player = room.players[clientId];
    const opponent = this.getOpponent(room, clientId);

    // 处理不同动作类型
    switch (action.type) {
      case 'play_card':
        return this.playCard(room, player, opponent, action.cardId);
      
      case 'use_skill':
        return this.useSkill(room, player, opponent, action.skillId);
      
      case 'end_turn':
        return this.endTurn(room, clientId);
      
      case 'surrender':
        return this.surrender(room, clientId);
      
      default:
        return { success: false, error: '未知动作类型' };
    }
  }

  /**
   * 出牌
   */
  playCard(room, player, opponent, cardId) {
    const card = player.hand.find(c => c.id === cardId);
    if (!card) {
      return { success: false, error: '手牌中没有这张卡' };
    }

    if (player.energy < card.cost) {
      return { success: false, error: '能量不足' };
    }

    // 扣除能量
    player.energy -= card.cost;
    
    // 从手牌移除
    player.hand = player.hand.filter(c => c.id !== cardId);
    
    // 执行卡牌效果（简化版）
    const effect = this.executeCardEffect(card, player, opponent);

    // 记录日志
    room.battleLog.push({
      turn: room.currentTurn,
      player: player.playerId,
      action: 'play_card',
      card: card.name,
      effect
    });

    // 检查胜负
    this.checkBattleEnd(room);

    return { 
      success: true, 
      data: { card, effect, playerState: this.getPlayerState(player) }
    };
  }

  /**
   * 使用技能
   */
  useSkill(room, player, opponent, skillId) {
    // 简化版：技能消耗2能量，造成5伤害
    const skillCost = 2;
    const skillDamage = 5;

    if (player.energy < skillCost) {
      return { success: false, error: '能量不足' };
    }

    player.energy -= skillCost;
    
    // 计算伤害
    const actualDamage = this.calculateDamage(skillDamage, player, opponent);
    opponent.hp = Math.max(0, opponent.hp - actualDamage);

    // 记录日志
    room.battleLog.push({
      turn: room.currentTurn,
      player: player.playerId,
      action: 'use_skill',
      skillId,
      damage: actualDamage
    });

    // 广播动作
    this.broadcastToRoom(room.id, {
      type: 'action_result',
      data: {
        playerId: player.playerId,
        action: 'use_skill',
        damage: actualDamage,
        targetHp: opponent.hp
      }
    });

    // 检查胜负
    this.checkBattleEnd(room);

    return { success: true };
  }

  /**
   * 结束回合
   */
  endTurn(room, clientId) {
    if (room.currentPlayer !== clientId) {
      return { success: false, error: '不是你的回合' };
    }

    // 切换到下一个玩家
    const nextPlayer = this.getOpponent(room, clientId);
    room.currentPlayer = Object.keys(room.players).find(id => id !== clientId);
    
    // 新回合开始
    room.currentTurn++;
    
    // 检查是否达到最大回合数
    if (room.currentTurn > GAME_CONFIG.MAX_TURNS) {
      this.endBattle(room, 'draw');
      return { success: true, data: { gameEnd: true, result: 'draw' } };
    }

    // 新回合初始化
    nextPlayer.energy = Math.min(nextPlayer.maxEnergy, nextPlayer.energy + 1);
    const newCards = this.drawCards(nextPlayer.deck, 1);
    nextPlayer.hand.push(...newCards);

    room.turnStartTime = Date.now();

    // 广播回合切换
    this.broadcastToRoom(room.id, {
      type: 'turn_change',
      data: {
        currentTurn: room.currentTurn,
        currentPlayer: room.currentPlayer,
        playerState: this.getPlayerState(nextPlayer)
      }
    });

    // 重置回合计时器
    this.startTurnTimer(room.id);

    return { success: true };
  }

  /**
   * 投降
   */
  surrender(room, clientId) {
    const winner = this.getOpponent(room, clientId);
    this.endBattle(room, 'surrender', winner.playerId);
    return { success: true };
  }

  /**
   * 结束对战
   */
  endBattle(room, reason, winnerId = null) {
    room.state = 'ended';
    room.winner = winnerId;

    // 清除计时器
    if (room.turnTimeout) {
      clearTimeout(room.turnTimeout);
    }

    logger.info(`🏁 对战结束 [${room.id}]，原因: ${reason}，胜者: ${winnerId || '平局'}`);

    // 广播对战结果
    this.broadcastToRoom(room.id, {
      type: 'battle_end',
      data: {
        reason,
        winner: winnerId,
        battleLog: room.battleLog
      }
    });

    // 延迟清理房间
    setTimeout(() => {
      this.rooms.delete(room.id);
      logger.info(`🗑️ 房间已清理 [${room.id}]`);
    }, 60000); // 1分钟后清理
  }

  /**
   * 处理玩家断线
   */
  handleDisconnect(clientId, roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.state === 'ended') return;

    logger.info(`🔌 玩家断线 [${clientId}]，房间 [${roomId}]`);

    // 记录断线
    this.disconnectedPlayers.set(clientId, {
      roomId,
      disconnectTime: Date.now()
    });

    // 广播断线信息
    this.broadcastToRoom(roomId, {
      type: 'player_disconnected',
      data: { clientId, reconnectTime: GAME_CONFIG.DISCONNECT_TIMEOUT }
    });

    // 启动断线计时器
    setTimeout(() => {
      if (this.disconnectedPlayers.has(clientId)) {
        // 玩家未重连，判负
        const opponent = this.getOpponent(room, clientId);
        this.endBattle(room, 'disconnect', opponent.playerId);
        this.disconnectedPlayers.delete(clientId);
      }
    }, GAME_CONFIG.DISCONNECT_TIMEOUT * 1000);
  }

  /**
   * 处理玩家重连
   */
  handleReconnect(clientId, roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return { success: false, error: '房间不存在' };

    if (this.disconnectedPlayers.has(clientId)) {
      this.disconnectedPlayers.delete(clientId);
      
      logger.info(`🔌 玩家重连成功 [${clientId}]，房间 [${roomId}]`);

      // 广播重连信息
      this.broadcastToRoom(roomId, {
        type: 'player_reconnected',
        data: { clientId }
      });

      return { 
        success: true, 
        data: {
          roomState: this.getRoomState(room),
          playerState: this.getPlayerState(room.players[clientId])
        }
      };
    }

    return { success: false, error: '未找到断线记录' };
  }

  /**
   * 启动回合计时器
   */
  startTurnTimer(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'playing') return;

    // 清除旧计时器
    if (room.turnTimeout) {
      clearTimeout(room.turnTimeout);
    }

    // 设置新计时器
    room.turnTimeout = setTimeout(() => {
      this.handleTurnTimeout(roomId);
    }, GAME_CONFIG.TURN_TIME * 1000);
  }

  /**
   * 处理回合超时
   */
  handleTurnTimeout(roomId) {
    const room = this.rooms.get(roomId);
    if (!room || room.state !== 'playing') return;

    logger.info(`⏱️ 回合超时 [${roomId}]，玩家 [${room.currentPlayer}]`);

    // 自动结束回合
    this.endTurn(room, room.currentPlayer);
  }

  /**
   * 检查对战是否结束
   */
  checkBattleEnd(room) {
    const players = Object.values(room.players);
    
    for (const player of players) {
      if (player.hp <= 0) {
        const winner = players.find(p => p !== player);
        this.endBattle(room, 'hp_zero', winner.playerId);
        return;
      }
    }
  }

  /**
   * 获取对手
   */
  getOpponent(room, clientId) {
    const opponentId = Object.keys(room.players).find(id => id !== clientId);
    return room.players[opponentId];
  }

  /**
   * 生成卡组（简化版）
   */
  generateDeck() {
    const cards = [];
    const cardTypes = ['attack', 'defense', 'skill', 'special'];
    
    for (let i = 0; i < 30; i++) {
      const type = cardTypes[Math.floor(Math.random() * cardTypes.length)];
      cards.push({
        id: uuidv4(),
        name: `${type}_${i + 1}`,
        type,
        cost: Math.floor(Math.random() * 5) + 1,
        power: Math.floor(Math.random() * 10) + 5
      });
    }
    
    return cards;
  }

  /**
   * 抽牌
   */
  drawCards(deck, count) {
    const drawn = [];
    for (let i = 0; i < count && deck.length > 0; i++) {
      const index = Math.floor(Math.random() * deck.length);
      drawn.push(deck.splice(index, 1)[0]);
    }
    return drawn;
  }

  /**
   * 执行卡牌效果
   */
  executeCardEffect(card, player, opponent) {
    // 简化版效果
    const effects = [];
    
    if (card.type === 'attack') {
      const damage = this.calculateDamage(card.power, player, opponent);
      opponent.hp = Math.max(0, opponent.hp - damage);
      effects.push({ type: 'damage', value: damage });
    } else if (card.type === 'defense') {
      player.shield += card.power;
      effects.push({ type: 'shield', value: card.power });
    } else if (card.type === 'skill') {
      // 特殊技能效果
      effects.push({ type: 'skill', value: card.power });
    }

    return effects;
  }

  /**
   * 计算伤害
   */
  calculateDamage(baseDamage, attacker, defender) {
    // 考虑护盾
    let damage = baseDamage;
    if (defender.shield > 0) {
      const shieldAbsorb = Math.min(defender.shield, damage);
      defender.shield -= shieldAbsorb;
      damage -= shieldAbsorb;
    }
    return damage;
  }

  /**
   * 获取玩家状态
   */
  getPlayerState(player) {
    return {
      playerId: player.playerId,
      hp: player.hp,
      maxHp: player.maxHp,
      energy: player.energy,
      maxEnergy: player.maxEnergy,
      shield: player.shield,
      handCount: player.hand.length,
      deckCount: player.deck.length
    };
  }

  /**
   * 获取房间状态
   */
  getRoomState(room) {
    return {
      id: room.id,
      state: room.state,
      currentTurn: room.currentTurn,
      currentPlayer: room.currentPlayer,
      players: Object.values(room.players).map(p => this.getPlayerState(p))
    };
  }

  /**
   * 广播消息到房间
   */
  broadcastToRoom(roomId, message) {
    // 由ConnectionManager实现
    if (this.broadcastCallback) {
      this.broadcastCallback(roomId, message);
    }
  }

  /**
   * 设置广播回调
   */
  setBroadcastCallback(callback) {
    this.broadcastCallback = callback;
  }

  /**
   * 启动游戏循环
   */
  startGameLoop() {
    logger.info('🎮 对战服务已启动');
  }
}

module.exports = BattleService;