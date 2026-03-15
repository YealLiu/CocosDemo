/**
 * 本地PVP对战系统 - 最简版
 * 无需WebSocket，本地模拟对战流程
 * 
 * @author ⚙️后端大牛
 * @version 0.2.0 (紧急版)
 */

// ============ 游戏配置 ============
const GAME_CONFIG = {
  INITIAL_HP: 50,
  INITIAL_HAND: 5,
  INITIAL_ENERGY: 3,
  MAX_ENERGY: 10,
  TURN_TIME: 30,
  MAX_TURNS: 30
};

// ============ 卡牌数据 ============
const CARD_TYPES = {
  attack: { name: '攻击', cost: 2, power: 8, desc: '造成8点伤害' },
  defense: { name: '防御', cost: 2, power: 5, desc: '获得5点护盾' },
  heal: { name: '治疗', cost: 3, power: 10, desc: '恢复10点生命' },
  special: { name: '必杀', cost: 5, power: 15, desc: '造成15点伤害' }
};

// ============ 玩家类 ============
class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.hp = GAME_CONFIG.INITIAL_HP;
    this.maxHp = GAME_CONFIG.INITIAL_HP;
    this.energy = GAME_CONFIG.INITIAL_ENERGY;
    this.maxEnergy = GAME_CONFIG.MAX_ENERGY;
    this.shield = 0;
    this.hand = [];
    this.deck = [];
    this.discard = [];
  }

  // 生成卡组
  generateDeck() {
    this.deck = [];
    const types = ['attack', 'attack', 'attack', 'defense', 'defense', 
                   'heal', 'heal', 'special', 'attack', 'defense'];
    for (let i = 0; i < 30; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      this.deck.push({
        id: `${this.id}_card_${i}`,
        type: type,
        ...CARD_TYPES[type]
      });
    }
    // 洗牌
    this.deck.sort(() => Math.random() - 0.5);
  }

  // 抽牌
  draw(count) {
    for (let i = 0; i < count && this.deck.length > 0; i++) {
      this.hand.push(this.deck.pop());
    }
  }

  // 受到伤害
  takeDamage(damage) {
    // 先扣护盾
    if (this.shield > 0) {
      const absorb = Math.min(this.shield, damage);
      this.shield -= absorb;
      damage -= absorb;
    }
    this.hp = Math.max(0, this.hp - damage);
    return damage;
  }

  // 恢复生命
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  // 获得护盾
  addShield(amount) {
    this.shield += amount;
  }

  // 使用卡牌
  useCard(cardIndex, target) {
    if (cardIndex < 0 || cardIndex >= this.hand.length) {
      return { success: false, error: '无效的手牌索引' };
    }

    const card = this.hand[cardIndex];
    if (this.energy < card.cost) {
      return { success: false, error: '能量不足' };
    }

    // 扣除能量
    this.energy -= card.cost;

    // 执行效果
    let result = { type: card.type, value: 0 };
    switch (card.type) {
      case 'attack':
      case 'special':
        const damage = target.takeDamage(card.power);
        result.value = damage;
        result.message = `${this.name} 使用 ${card.name} 对 ${target.name} 造成 ${damage} 点伤害`;
        break;
      case 'defense':
        this.addShield(card.power);
        result.value = card.power;
        result.message = `${this.name} 使用 ${card.name} 获得 ${card.power} 点护盾`;
        break;
      case 'heal':
        this.heal(card.power);
        result.value = card.power;
        result.message = `${this.name} 使用 ${card.name} 恢复 ${card.power} 点生命`;
        break;
    }

    // 移除手牌
    this.hand.splice(cardIndex, 1);
    this.discard.push(card);

    return { success: true, result, card };
  }

  // 开始新回合
  startTurn() {
    this.energy = Math.min(this.maxEnergy, this.energy + 1);
    this.draw(1);
  }

  // 获取状态
  getStatus() {
    return {
      name: this.name,
      hp: this.hp,
      maxHp: this.maxHp,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      shield: this.shield,
      handCount: this.hand.length,
      deckCount: this.deck.length
    };
  }

  // 显示手牌
  showHand() {
    console.log(`\n${this.name} 的手牌:`);
    this.hand.forEach((card, index) => {
      console.log(`  [${index}] ${card.name} (消耗:${card.cost}) - ${card.desc}`);
    });
  }
}

// ============ 对战管理器 ============
class BattleManager {
  constructor(player1Name, player2Name) {
    this.player1 = new Player('p1', player1Name);
    this.player2 = new Player('p2', player2Name);
    this.currentPlayer = this.player1;
    this.turn = 1;
    this.state = 'ready'; // ready, playing, ended
    this.winner = null;
    this.battleLog = [];
  }

  // 开始对战
  start() {
    console.log('\n========== 对战开始 ==========');
    console.log(`${this.player1.name} VS ${this.player2.name}\n`);

    // 初始化卡组
    this.player1.generateDeck();
    this.player2.generateDeck();

    // 初始抽牌
    this.player1.draw(GAME_CONFIG.INITIAL_HAND);
    this.player2.draw(GAME_CONFIG.INITIAL_HAND);

    this.state = 'playing';
    this.showStatus();
    
    return true;
  }

  // 执行动作
  action(playerId, actionType, data = {}) {
    if (this.state !== 'playing') {
      return { success: false, error: '对战已结束' };
    }

    const player = playerId === 'p1' ? this.player1 : this.player2;
    const opponent = playerId === 'p1' ? this.player2 : this.player1;

    // 检查是否轮到该玩家
    if (player !== this.currentPlayer) {
      return { success: false, error: '不是你的回合' };
    }

    switch (actionType) {
      case 'play_card':
        return this.playCard(player, opponent, data.cardIndex);
      
      case 'end_turn':
        return this.endTurn();
      
      case 'surrender':
        return this.surrender(player);
      
      default:
        return { success: false, error: '未知动作' };
    }
  }

  // 出牌
  playCard(player, opponent, cardIndex) {
    const result = player.useCard(cardIndex, opponent);
    
    if (result.success) {
      console.log(`\n>>> ${result.result.message}`);
      this.battleLog.push({
        turn: this.turn,
        player: player.name,
        action: 'play_card',
        card: result.card.name,
        result: result.result
      });

      // 检查胜负
      this.checkWinCondition();
      
      if (this.state !== 'ended') {
        this.showStatus();
      }
    }

    return result;
  }

  // 结束回合
  endTurn() {
    console.log(`\n>>> ${this.currentPlayer.name} 结束回合`);
    
    // 切换玩家
    this.currentPlayer = this.currentPlayer === this.player1 ? this.player2 : this.player1;
    
    // 如果是玩家1的回合，回合数+1
    if (this.currentPlayer === this.player1) {
      this.turn++;
      
      // 检查最大回合
      if (this.turn > GAME_CONFIG.MAX_TURNS) {
        return this.endByTurnLimit();
      }
    }

    // 新回合开始
    this.currentPlayer.startTurn();
    
    console.log(`\n========== 第 ${this.turn} 回合 - ${this.currentPlayer.name} ==========`);
    this.showStatus();

    return { success: true, message: '回合切换' };
  }

  // 投降
  surrender(player) {
    this.winner = player === this.player1 ? this.player2 : this.player1;
    this.state = 'ended';
    console.log(`\n>>> ${player.name} 投降！`);
    console.log(`\n🏆 胜者: ${this.winner.name}`);
    return { success: true, winner: this.winner.name };
  }

  // 检查胜负条件
  checkWinCondition() {
    if (this.player1.hp <= 0) {
      this.winner = this.player2;
      this.state = 'ended';
      console.log(`\n🏆 ${this.player1.name} 生命值归零！`);
      console.log(`🏆 胜者: ${this.winner.name}`);
    } else if (this.player2.hp <= 0) {
      this.winner = this.player1;
      this.state = 'ended';
      console.log(`\n🏆 ${this.player2.name} 生命值归零！`);
      console.log(`🏆 胜者: ${this.winner.name}`);
    }
  }

  // 回合限制结束
  endByTurnLimit() {
    this.state = 'ended';
    if (this.player1.hp > this.player2.hp) {
      this.winner = this.player1;
    } else if (this.player2.hp > this.player1.hp) {
      this.winner = this.player2;
    } else {
      this.winner = null; // 平局
    }
    
    console.log(`\n>>> 达到最大回合数！`);
    if (this.winner) {
      console.log(`🏆 胜者: ${this.winner.name}`);
    } else {
      console.log(`🤝 平局！`);
    }
    
    return { success: true, winner: this.winner?.name || 'draw' };
  }

  // 显示状态
  showStatus() {
    console.log('\n---------- 当前状态 ----------');
    console.log(`${this.player1.name}: HP ${this.player1.hp}/${this.player1.maxHp} | 能量 ${this.player1.energy}/${this.player1.maxEnergy} | 护盾 ${this.player1.shield} | 手牌 ${this.player1.hand.length}`);
    console.log(`${this.player2.name}: HP ${this.player2.hp}/${this.player2.maxHp} | 能量 ${this.player2.energy}/${this.player2.maxEnergy} | 护盾 ${this.player2.shield} | 手牌 ${this.player2.hand.length}`);
    console.log(`当前回合: ${this.turn} | 当前玩家: ${this.currentPlayer.name}`);
    console.log('------------------------------');
  }

  // 显示当前玩家手牌
  showCurrentHand() {
    this.currentPlayer.showHand();
  }

  // 获取游戏状态（用于前端）
  getGameState() {
    return {
      state: this.state,
      turn: this.turn,
      currentPlayer: this.currentPlayer.id,
      player1: this.player1.getStatus(),
      player2: this.player2.getStatus(),
      winner: this.winner?.name || null
    };
  }
}

// ============ 命令行演示 ============
function demo() {
  console.log('\n🎮 启蒙PVP对战系统 - 本地演示版\n');
  
  const battle = new BattleManager('玩家1', '玩家2');
  battle.start();

  // 模拟对战流程
  let turnCount = 0;
  const maxDemoTurns = 10;

  function nextAction() {
    if (battle.state === 'ended' || turnCount >= maxDemoTurns) {
      console.log('\n========== 对战结束 ==========\n');
      return;
    }

    const player = battle.currentPlayer;
    const opponent = player === battle.player1 ? battle.player2 : battle.player1;

    // AI逻辑：优先使用可支付的攻击牌
    let cardIndex = -1;
    for (let i = 0; i < player.hand.length; i++) {
      if (player.hand[i].cost <= player.energy && player.hand[i].type === 'attack') {
        cardIndex = i;
        break;
      }
    }

    // 如果没有可支付的攻击牌，找任意可支付的牌
    if (cardIndex === -1) {
      for (let i = 0; i < player.hand.length; i++) {
        if (player.hand[i].cost <= player.energy) {
          cardIndex = i;
          break;
        }
      }
    }

    if (cardIndex !== -1) {
      battle.action(player.id, 'play_card', { cardIndex });
    } else {
      battle.action(player.id, 'end_turn');
      turnCount++;
    }

    // 延迟执行下一个动作
    setTimeout(nextAction, 1000);
  }

  nextAction();
}

// ============ 导出模块 ============
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BattleManager, Player, GAME_CONFIG, CARD_TYPES };
}

// 如果是直接运行
if (require.main === module) {
  demo();
}