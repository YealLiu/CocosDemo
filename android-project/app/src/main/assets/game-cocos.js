// 启蒙游戏 - Web 入口文件
// 适配 Cocos Creator 项目结构

// 游戏配置
const GAME_CONFIG = {
    width: 720,
    height: 1280,
    fps: 60,
    version: '1.0.0'
};

// 游戏状态
let gameState = {
    currentScene: 'menu',
    player: null,
    battle: null,
    map: null
};

// 场景管理器
class SceneManager {
    constructor() {
        this.scenes = {};
        this.currentScene = null;
    }
    
    register(name, scene) {
        this.scenes[name] = scene;
    }
    
    load(name) {
        if (this.currentScene && this.currentScene.onExit) {
            this.currentScene.onExit();
        }
        
        this.currentScene = this.scenes[name];
        
        if (this.currentScene && this.currentScene.onEnter) {
            this.currentScene.onEnter();
        }
        
        gameState.currentScene = name;
        console.log(`[SceneManager] 加载场景: ${name}`);
    }
}

// 画布管理器
class CanvasManager {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.bindEvents();
    }
    
    setupCanvas() {
        const resize = () => {
            const container = document.getElementById('game-container');
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        };
        
        resize();
        window.addEventListener('resize', resize);
    }
    
    bindEvents() {
        // 触摸/鼠标事件
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e, 'start'));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e, 'move'));
        this.canvas.addEventListener('touchend', (e) => this.handleTouch(e, 'end'));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouse(e, 'down'));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouse(e, 'up'));
    }
    
    handleTouch(e, type) {
        e.preventDefault();
        const touches = e.touches.length > 0 ? e.touches : e.changedTouches;
        for (let touch of touches) {
            const x = touch.clientX;
            const y = touch.clientY;
            InputManager.handleInput(type, x, y);
        }
    }
    
    handleMouse(e, type) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        InputManager.handleInput(type, x, y);
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    getContext() {
        return this.ctx;
    }
}

// 输入管理器
class InputManagerClass {
    constructor() {
        this.listeners = [];
    }
    
    handleInput(type, x, y) {
        for (let listener of this.listeners) {
            listener(type, x, y);
        }
    }
    
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
}

const InputManager = new InputManagerClass();

// 资源管理器
class ResourceManager {
    constructor() {
        this.resources = {};
        this.loaded = 0;
        this.total = 0;
    }
    
    async loadImage(name, src) {
        this.total++;
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.resources[name] = img;
                this.loaded++;
                this.updateProgress();
                resolve(img);
            };
            img.onerror = reject;
            img.src = src;
        });
    }
    
    updateProgress() {
        const progress = (this.loaded / this.total) * 100;
        const progressBar = document.getElementById('loading-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }
    
    get(name) {
        return this.resources[name];
    }
    
    async loadAll() {
        // 加载概念图作为占位资源
        const resources = [
            ['bg_menu', 'assets/resources/concept_keyvisual_main.png'],
            ['bg_battle', 'assets/resources/concept_scene_battle.png'],
            ['warrior', 'assets/resources/concept_character_warrior.png'],
            ['mage', 'assets/resources/concept_character_mage.png'],
            ['assassin', 'assets/resources/concept_character_assassin.png'],
            ['enemy_minion', 'assets/resources/concept_enemy_minion.png'],
            ['enemy_elite', 'assets/resources/concept_enemy_elite.png'],
            ['enemy_boss', 'assets/resources/concept_enemy_boss.png']
        ];
        
        for (let [name, src] of resources) {
            try {
                await this.loadImage(name, src);
            } catch (e) {
                console.warn(`[ResourceManager] 加载失败: ${name}`);
            }
        }
        
        // 隐藏加载画面
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 500);
    }
}

const resourceManager = new ResourceManager();

// 场景基类
class Scene {
    constructor(name) {
        this.name = name;
        this.uiElements = [];
    }
    
    onEnter() {
        console.log(`[Scene] 进入: ${this.name}`);
    }
    
    onExit() {
        console.log(`[Scene] 退出: ${this.name}`);
    }
    
    update(dt) {}
    render(ctx) {}
    
    addUI(element) {
        this.uiElements.push(element);
    }
}

// 菜单场景
class MenuScene extends Scene {
    constructor() {
        super('menu');
        this.title = '启蒙';
        this.buttons = [
            { text: '开始游戏', x: 0.5, y: 0.5, width: 200, height: 60, action: 'start' },
            { text: '设置', x: 0.5, y: 0.65, width: 200, height: 60, action: 'settings' }
        ];
    }
    
    onEnter() {
        super.onEnter();
        InputManager.addListener(this.handleInput.bind(this));
    }
    
    onExit() {
        super.onExit();
        InputManager.removeListener(this.handleInput.bind(this));
    }
    
    handleInput(type, x, y) {
        if (type !== 'end' && type !== 'up') return;
        
        const canvas = document.getElementById('game-canvas');
        const scaleX = canvas.width / GAME_CONFIG.width;
        const scaleY = canvas.height / GAME_CONFIG.height;
        
        for (let btn of this.buttons) {
            const bx = btn.x * canvas.width - btn.width * scaleX / 2;
            const by = btn.y * canvas.height - btn.height * scaleY / 2;
            const bw = btn.width * scaleX;
            const bh = btn.height * scaleY;
            
            if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
                if (btn.action === 'start') {
                    sceneManager.load('classSelect');
                }
                break;
            }
        }
    }
    
    render(ctx) {
        const canvas = document.getElementById('game-canvas');
        
        // 背景
        const bg = resourceManager.get('bg_menu');
        if (bg) {
            ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#2a1f3d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // 标题
        ctx.fillStyle = '#ffd564';
        ctx.font = `bold ${Math.min(canvas.width / 8, 80)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(this.title, canvas.width / 2, canvas.height * 0.25);
        
        // 按钮
        for (let btn of this.buttons) {
            const bx = btn.x * canvas.width - btn.width / 2;
            const by = btn.y * canvas.height - btn.height / 2;
            
            // 按钮背景
            ctx.fillStyle = 'rgba(80, 120, 200, 0.9)';
            ctx.fillRect(bx, by, btn.width, btn.height);
            
            // 按钮文字
            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.text, btn.x * canvas.width, btn.y * canvas.height);
        }
    }
}

// 职业选择场景
class ClassSelectScene extends Scene {
    constructor() {
        super('classSelect');
        this.classes = [
            { id: 'warrior', name: '战士', desc: '高生命值，防御型', color: '#ff6b6b' },
            { id: 'mage', name: '法师', desc: '高能量，法术型', color: '#4ecdc4' },
            { id: 'assassin', name: '刺客', desc: '高暴击，敏捷型', color: '#95e1d3' }
        ];
    }
    
    onEnter() {
        super.onEnter();
        InputManager.addListener(this.handleInput.bind(this));
    }
    
    onExit() {
        super.onExit();
        InputManager.removeListener(this.handleInput.bind(this));
    }
    
    handleInput(type, x, y) {
        if (type !== 'end' && type !== 'up') return;
        
        const canvas = document.getElementById('game-canvas');
        const cardWidth = Math.min(200, canvas.width / 4);
        const cardHeight = 280;
        const startX = (canvas.width - this.classes.length * (cardWidth + 20)) / 2 + cardWidth / 2;
        const centerY = canvas.height / 2;
        
        for (let i = 0; i < this.classes.length; i++) {
            const cx = startX + i * (cardWidth + 20);
            const cy = centerY;
            
            if (Math.abs(x - cx) < cardWidth / 2 && Math.abs(y - cy) < cardHeight / 2) {
                gameState.player = { class: this.classes[i].id };
                sceneManager.load('map');
                break;
            }
        }
    }
    
    render(ctx) {
        const canvas = document.getElementById('game-canvas');
        
        // 背景
        ctx.fillStyle = '#1a1225';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 标题
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.min(canvas.width / 12, 48)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('选择职业', canvas.width / 2, canvas.height * 0.15);
        
        // 职业卡片
        const cardWidth = Math.min(200, canvas.width / 4);
        const cardHeight = 280;
        const startX = (canvas.width - this.classes.length * (cardWidth + 20)) / 2 + cardWidth / 2;
        const centerY = canvas.height / 2;
        
        for (let i = 0; i < this.classes.length; i++) {
            const cls = this.classes[i];
            const cx = startX + i * (cardWidth + 20);
            
            // 卡片背景
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(cx - cardWidth / 2, centerY - cardHeight / 2, cardWidth, cardHeight);
            
            // 边框
            ctx.strokeStyle = cls.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(cx - cardWidth / 2, centerY - cardHeight / 2, cardWidth, cardHeight);
            
            // 角色图
            const img = resourceManager.get(cls.id);
            if (img) {
                ctx.drawImage(img, cx - 60, centerY - 100, 120, 120);
            }
            
            // 职业名
            ctx.fillStyle = cls.color;
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(cls.name, cx, centerY + 40);
            
            // 描述
            ctx.fillStyle = '#aaa';
            ctx.font = '14px Arial';
            ctx.fillText(cls.desc, cx, centerY + 70);
        }
    }
}

// 地图场景
class MapScene extends Scene {
    constructor() {
        super('map');
        this.nodes = this.generateMap();
    }
    
    generateMap() {
        const nodes = [];
        const rows = 5;
        const cols = 4;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                nodes.push({
                    x: col,
                    y: row,
                    type: Math.random() > 0.7 ? 'elite' : (Math.random() > 0.9 ? 'boss' : 'battle'),
                    cleared: false
                });
            }
        }
        
        return nodes;
    }
    
    onEnter() {
        super.onEnter();
        InputManager.addListener(this.handleInput.bind(this));
    }
    
    onExit() {
        super.onExit();
        InputManager.removeListener(this.handleInput.bind(this));
    }
    
    handleInput(type, x, y) {
        if (type !== 'end' && type !== 'up') return;
        
        const canvas = document.getElementById('game-canvas');
        const nodeSize = 50;
        const padding = 80;
        const mapWidth = canvas.width - padding * 2;
        const mapHeight = canvas.height - padding * 2;
        
        for (let node of this.nodes) {
            const nx = padding + (node.x / 3) * mapWidth;
            const ny = padding + (node.y / 4) * mapHeight;
            
            if (Math.abs(x - nx) < nodeSize && Math.abs(y - ny) < nodeSize) {
                sceneManager.load('battle');
                break;
            }
        }
    }
    
    render(ctx) {
        const canvas = document.getElementById('game-canvas');
        
        // 背景
        ctx.fillStyle = '#1a1225';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 标题
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('冒险地图', canvas.width / 2, 50);
        
        // 地图节点
        const nodeSize = 50;
        const padding = 80;
        const mapWidth = canvas.width - padding * 2;
        const mapHeight = canvas.height - padding * 2;
        
        // 连接线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        for (let i = 0; i < this.nodes.length - 1; i++) {
            const n1 = this.nodes[i];
            const n2 = this.nodes[i + 1];
            ctx.beginPath();
            ctx.moveTo(padding + (n1.x / 3) * mapWidth, padding + (n1.y / 4) * mapHeight);
            ctx.lineTo(padding + (n2.x / 3) * mapWidth, padding + (n2.y / 4) * mapHeight);
            ctx.stroke();
        }
        
        // 节点
        for (let node of this.nodes) {
            const nx = padding + (node.x / 3) * mapWidth;
            const ny = padding + (node.y / 4) * mapHeight;
            
            const colors = {
                battle: '#4ecdc4',
                elite: '#ff6b6b',
                boss: '#ffd564'
            };
            
            ctx.fillStyle = colors[node.type] || '#fff';
            ctx.beginPath();
            ctx.arc(nx, ny, node.cleared ? 15 : 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 战斗场景
class BattleScene extends Scene {
    constructor() {
        super('battle');
        this.turn = 1;
        this.playerHP = 80;
        this.playerMaxHP = 80;
        this.playerEnergy = 3;
        this.playerMaxEnergy = 3;
        this.playerBlock = 0;
        this.enemyHP = 50;
        this.enemyMaxHP = 50;
        this.enemyIntent = 'attack';
    }
    
    onEnter() {
        super.onEnter();
        InputManager.addListener(this.handleInput.bind(this));
    }
    
    onExit() {
        super.onExit();
        InputManager.removeListener(this.handleInput.bind(this));
    }
    
    handleInput(type, x, y) {
        if (type !== 'end' && type !== 'up') return;
        
        const canvas = document.getElementById('game-canvas');
        
        // 结束回合按钮
        const btnX = canvas.width - 100;
        const btnY = canvas.height - 50;
        if (Math.abs(x - btnX) < 60 && Math.abs(y - btnY) < 25) {
            this.endTurn();
        }
    }
    
    endTurn() {
        this.turn++;
        this.playerEnergy = this.playerMaxEnergy;
        this.playerBlock = 0;
        
        // 敌人回合
        if (this.enemyIntent === 'attack') {
            const damage = Math.max(0, 10 - this.playerBlock);
            this.playerHP = Math.max(0, this.playerHP - damage);
        }
    }
    
    render(ctx) {
        const canvas = document.getElementById('game-canvas');
        
        // 背景
        const bg = resourceManager.get('bg_battle');
        if (bg) {
            ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#2a1f3d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // 玩家区域
        const playerX = canvas.width * 0.25;
        const playerY = canvas.height * 0.6;
        
        // 玩家角色
        const playerImg = resourceManager.get(gameState.player?.class || 'warrior');
        if (playerImg) {
            ctx.drawImage(playerImg, playerX - 75, playerY - 100, 150, 150);
        }
        
        // 玩家血条
        const barWidth = 150;
        const barHeight = 20;
        ctx.fillStyle = '#333';
        ctx.fillRect(playerX - barWidth / 2, playerY + 60, barWidth, barHeight);
        ctx.fillStyle = '#4ecdc4';
        ctx.fillRect(playerX - barWidth / 2, playerY + 60, barWidth * (this.playerHP / this.playerMaxHP), barHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.playerHP}/${this.playerMaxHP}`, playerX, playerY + 75);
        
        // 能量显示
        ctx.fillStyle = '#ffd564';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`⚡ ${this.playerEnergy}/${this.playerMaxEnergy}`, playerX, playerY + 110);
        
        // 敌人区域
        const enemyX = canvas.width * 0.75;
        const enemyY = canvas.height * 0.4;
        
        // 敌人角色
        const enemyImg = resourceManager.get('enemy_minion');
        if (enemyImg) {
            ctx.drawImage(enemyImg, enemyX - 75, enemyY - 100, 150, 150);
        }
        
        // 敌人血条
        ctx.fillStyle = '#333';
        ctx.fillRect(enemyX - barWidth / 2, enemyY + 60, barWidth, barHeight);
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(enemyX - barWidth / 2, enemyY + 60, barWidth * (this.enemyHP / this.enemyMaxHP), barHeight);
        ctx.fillStyle = '#fff';
        ctx.fillText(`${this.enemyHP}/${this.enemyMaxHP}`, enemyX, enemyY + 75);
        
        // 敌人意图
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '16px Arial';
        ctx.fillText(this.enemyIntent === 'attack' ? '⚔️ 攻击' : '🛡️ 防御', enemyX, enemyY - 120);
        
        // 回合数
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`回合 ${this.turn}`, canvas.width / 2, 50);
        
        // 结束回合按钮
        const btnX = canvas.width - 100;
        const btnY = canvas.height - 50;
        ctx.fillStyle = 'rgba(80, 120, 200, 0.9)';
        ctx.fillRect(btnX - 60, btnY - 25, 120, 50);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('结束回合', btnX, btnY + 5);
    }
}

// 游戏循环
class GameLoop {
    constructor() {
        this.lastTime = 0;
        this.canvasManager = new CanvasManager();
        this.running = false;
    }
    
    start() {
        this.running = true;
        requestAnimationFrame(this.loop.bind(this));
    }
    
    loop(timestamp) {
        if (!this.running) return;
        
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // 更新
        if (sceneManager.currentScene) {
            sceneManager.currentScene.update(dt);
        }
        
        // 渲染
        this.canvasManager.clear();
        if (sceneManager.currentScene) {
            sceneManager.currentScene.render(this.canvasManager.getContext());
        }
        
        requestAnimationFrame(this.loop.bind(this));
    }
}

// 初始化
const sceneManager = new SceneManager();
const gameLoop = new GameLoop();

// 注册场景
sceneManager.register('menu', new MenuScene());
sceneManager.register('classSelect', new ClassSelectScene());
sceneManager.register('map', new MapScene());
sceneManager.register('battle', new BattleScene());

// 启动游戏
window.onload = async () => {
    console.log('[Game] 启蒙游戏启动中...');
    
    // 加载资源
    await resourceManager.loadAll();
    
    // 加载初始场景
    sceneManager.load('menu');
    
    // 启动游戏循环
    gameLoop.start();
    
    console.log('[Game] 游戏启动完成');
};
