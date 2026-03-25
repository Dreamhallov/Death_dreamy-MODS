// ==UserScript==
// @name         Minefun.io With Better Textures and Shader types
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Free Visuals To minefun.io 
// @author       Death_dreamy
// @license      SL
// @match        *://minefun.io/*
// @match        *://*.minefun.io/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=minefun.io
// ==/UserScript==
 
(function () {
    'use strict';
 
    const SCRIPT_KEY = 'minefun_pro_client-Death_dreamy';
    const DEFAULT_CONFIG = {
        enableFpsBoost: true,
        disableAA: true,
        lowLatency: true,
        targetFps: 600,
        renderDistance: 12,
        
        shaderType: 'none',
        brightness: 100,
        contrast: 100,
        saturation: 100,
        sepia: 0,
        hueRotate: 0,
        invert: 0,
        blur: 0,
        texturePack: 'vanilla',
        shadowsEnabled: false,
        ambientLighting: 100,
        bloomStrength: 0,
        
        crosshairEnabled: true,
        crosshairType: 'dot',
        crosshairSize: 10,
        crosshairRGB: true,
        
        showHUD: true,
        hudTheme: 'rgb',
        hudPosition: 'top-left',
        hudFontSize: 14,
        hudFontFamily: 'Inter',
        hudFontWeight: '800',
        hudRgbAnimation: true,
        
        particleRain: 'stardust',
        weatherDensity: 60,
        particleSpeed: 1.0,
        
        menuPos: { left: 100, top: 100 }
    };
 
    let config = Object.assign({}, DEFAULT_CONFIG);
    let uiState = { 
        fps: 0, 
        fpsHistory:[], 
        ping: 0, 
        pingArray:[], 
        jitter: 0, 
        cps: 0, 
        networkQuality: '🟢 Good',
        rgbHueOffset: 0
    };
    
    let frames = 0;
    let lastFpsTime = performance.now();
    let clicks =[];
    let cachedGameCanvas = null;
    let lastAppliedFilter = null;
    let filterCheckInterval = null;
 
    try {
        const saved = GM_getValue(SCRIPT_KEY, {});
        config = Object.assign({}, DEFAULT_CONFIG, saved);
    } catch (e) {
        config = DEFAULT_CONFIG;
    }
 
    function saveConfig() {
        try {
            GM_setValue(SCRIPT_KEY, config);
        } catch (e) {}
    }
 
    // ==========================================
    // GAME STATE DETECTOR
    // ==========================================
    const GameState = {
        inGame: false,
        init() {
            setInterval(() => {
                const isLocked = !!document.pointerLockElement;
                if (isLocked !== this.inGame) {
                    this.inGame = isLocked;
                    updateParticleVisibility();
                }
            }, 500);
        }
    };
 
    // ==========================================
    // BACKGROUND PARTICLE ENGINE (Menu Only)
    // ==========================================
    const ParticleEngine = {
        weather:[],
        canvas: null,
        ctx: null,
        ready: false,
        
        init() {
            if (this.ready) return;
            try {
                this.canvas = document.createElement('canvas');
                this.canvas.id = 'pt-bg-particles';
                this.canvas.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    pointer-events: none;
                    z-index: 50;
                `;
                this.ctx = this.canvas.getContext('2d', { alpha: true, willReadFrequently: false });
                document.documentElement.appendChild(this.canvas);
                this.resize();
                window.addEventListener('resize', () => this.resize());
                this.ready = true;
                this.animate();
            } catch (e) {}
        },
        
        resize() {
            if (this.canvas && this.ctx) {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
        },
        
        updateWeather() {
            if (GameState.inGame) {
                this.weather =[];
                return;
            }
            
            const type = config.particleRain;
            if (type === 'none') {
                this.weather =[];
                return;
            }
            
            const density = config.weatherDensity;
            const spd = config.particleSpeed;
 
            if (this.weather.length < density * 3 && Math.random() < 0.5) {
                if (type === 'snow') {
                    this.weather.push({
                        x: Math.random() * this.canvas.width,
                        y: -10,
                        vx: (Math.random() - 0.5) * 0.5 * spd,
                        vy: (0.5 + Math.random() * 1.5) * spd,
                        size: 1.5 + Math.random() * 2,
                        type: 'snow',
                        wobble: Math.random() * 10
                    });
                } else if (type === 'rain') {
                    this.weather.push({
                        x: Math.random() * this.canvas.width,
                        y: -10,
                        vx: 0.5 * spd,
                        vy: (12 + Math.random() * 8) * spd,
                        size: 1.5,
                        type: 'rain'
                    });
                } else if (type === 'stardust') {
                    this.weather.push({
                        x: Math.random() * this.canvas.width,
                        y: -10,
                        vx: (1 + Math.random() * 2) * spd,
                        vy: (1 + Math.random() * 1.5) * spd,
                        size: 2.5 + Math.random() * 3,
                        type: 'stardust',
                        wobble: Math.random() * 10,
                        hue: Math.random() * 60
                    });
                } else if (type === 'sakura') {
                    this.weather.push({
                        x: Math.random() * this.canvas.width,
                        y: -10,
                        vx: (Math.random() - 0.5) * 2 * spd,
                        vy: (1 + Math.random() * 1) * spd,
                        size: 3 + Math.random() * 4,
                        type: 'sakura',
                        wobble: Math.random() * 10,
                        color: `hsl(${330 + Math.random() * 30}, 100%, 50%)`
                    });
                } else if (type === 'fireflies') {
                    this.weather.push({
                        x: Math.random() * this.canvas.width,
                        y: this.canvas.height + 10,
                        vx: (Math.random() - 0.5) * 1.5 * spd,
                        vy: -(0.5 + Math.random() * 1.5) * spd,
                        size: 1.5 + Math.random() * 2,
                        type: 'fireflies',
                        wobble: Math.random() * 10
                    });
                } else if (type === 'matrix') {
                    this.weather.push({
                        x: Math.floor(Math.random() * this.canvas.width / 20) * 20,
                        y: -20,
                        vx: 0,
                        vy: (3 + Math.random() * 4) * spd,
                        size: 14,
                        type: 'matrix',
                        char: String.fromCharCode(0x30A0 + Math.random() * 96)
                    });
                } else if (type === 'aurora') {
                    this.weather.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height * 0.3,
                        vx: spd * 0.5,
                        vy: 0,
                        size: 50 + Math.random() * 100,
                        type: 'aurora',
                        hue: Math.random() * 360,
                        life: 1
                    });
                }
            }
 
            for (let i = this.weather.length - 1; i >= 0; i--) {
                const w = this.weather[i];
                w.y += w.vy;
                w.x += w.vx;
                
                if (['snow', 'stardust', 'sakura'].includes(w.type)) {
                    w.x += Math.sin(w.wobble) * 0.8;
                    w.wobble += 0.03;
                }
                if (w.type === 'fireflies') w.wobble += 0.02;
                if (w.type === 'aurora') {
                    w.life -= 0.005;
                    if (w.life < 0) this.weather.splice(i, 1);
                    continue;
                }
                if (w.type === 'matrix' && Math.random() < 0.05) {
                    w.char = String.fromCharCode(0x30A0 + Math.random() * 96);
                }
                
                if ((w.vy > 0 && w.y > this.canvas.height + 20) || (w.vy < 0 && w.y < -20)) {
                    this.weather.splice(i, 1);
                }
            }
        },
        
        draw() {
            if (!this.ctx || !this.ready) return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            for (const w of this.weather) {
                this.ctx.globalAlpha = 0.85;
                
                switch (w.type) {
                    case 'snow':
                        this.ctx.fillStyle = '#ffffff';
                        this.ctx.beginPath();
                        this.ctx.arc(w.x, w.y, w.size, 0, Math.PI * 2);
                        this.ctx.fill();
                        break;
                        
                    case 'rain':
                        this.ctx.fillStyle = '#aaddff';
                        this.ctx.fillRect(w.x, w.y, 1.5, w.size * 8);
                        break;
                        
                    case 'stardust':
                        this.ctx.fillStyle = `hsl(${60 + w.hue}, 100%, 60%)`;
                        this.ctx.shadowBlur = 15;
                        this.ctx.shadowColor = `hsl(${60 + w.hue}, 100%, 60%)`;
                        this.ctx.beginPath();
                        this.ctx.arc(w.x, w.y, w.size, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.shadowBlur = 0;
                        break;
                        
                    case 'sakura':
                        this.ctx.fillStyle = w.color;
                        this.ctx.save();
                        this.ctx.translate(w.x, w.y);
                        this.ctx.rotate(w.wobble);
                        this.ctx.beginPath();
                        this.ctx.ellipse(0, 0, w.size, w.size / 2, 0, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.restore();
                        break;
                        
                    case 'fireflies':
                        this.ctx.fillStyle = '#ccff00';
                        this.ctx.shadowBlur = 15;
                        this.ctx.shadowColor = '#ccff00';
                        this.ctx.beginPath();
                        this.ctx.arc(w.x + Math.sin(w.wobble) * 20, w.y, w.size, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.shadowBlur = 0;
                        break;
                        
                    case 'matrix':
                        this.ctx.font = 'bold 14px monospace';
                        this.ctx.fillStyle = '#00ff44';
                        this.ctx.fillText(w.char, w.x, w.y);
                        break;
                        
                    case 'aurora':
                        this.ctx.fillStyle = `hsla(${w.hue}, 100%, 50%, ${w.life * 0.3})`;
                        this.ctx.fillRect(0, w.y, this.canvas.width, w.size);
                        break;
                }
            }
            
            this.ctx.globalAlpha = 1;
        },
        
        animate() {
            if (!this.ready) return;
            this.updateWeather();
            this.draw();
            requestAnimationFrame(() => this.animate());
        }
    };
 
    function updateParticleVisibility() {
        if (ParticleEngine.canvas) {
            ParticleEngine.canvas.style.display = GameState.inGame ? 'none' : 'block';
        }
    }
 
    // ==========================================
    // TRUE FPS BOOST ENGINE (FIXED GLITCHES)
    // ==========================================
    
    if (config.enableFpsBoost) {
        Object.defineProperty(document, 'hidden', { value: false, writable: false });
        Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: false });
    }
 
    // WebGL Hardware Optimization
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attribs) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
            attribs = attribs || {};
            // Add performance hints WITHOUT breaking game's texture engine or UI (removed bugged attributes)
            if (config.enableFpsBoost) {
                attribs.powerPreference = "high-performance";
                if (config.disableAA !== undefined) attribs.antialias = !config.disableAA;
                if (config.lowLatency) attribs.desynchronized = true;
            }
        }
        return origGetContext.call(this, type, attribs);
    };
 
    // ==========================================
    // SHADER & VISUAL SYSTEM (FIXED FOR IN-GAME)
    // ==========================================
    
    const SHADER_PRESETS = {
        none:[],
        bloom:['brightness(110%)', 'contrast(115%)'],
        vibrant:['saturate(160%)', 'contrast(110%)'],
        cinematic:['contrast(125%)', 'brightness(90%)', 'saturate(80%)'],
        noir:['grayscale(100%)', 'contrast(150%)', 'brightness(90%)'],
        thermal:['hue-rotate(180deg)', 'saturate(250%)', 'brightness(120%)'],
        retro:['saturate(130%)', 'contrast(120%)', 'sepia(30%)'],
        acid:['hue-rotate(90deg)', 'saturate(200%)', 'contrast(150%)'],
        cyberpunk:['hue-rotate(270deg)', 'saturate(180%)', 'contrast(140%)', 'brightness(110%)'],
        neon:['saturate(200%)', 'contrast(130%)', 'brightness(115%)'],
        dreamscape:['saturate(150%)', 'hue-rotate(15deg)', 'brightness(105%)', 'contrast(110%)'],
        matrix:['saturate(200%)', 'hue-rotate(120deg)', 'contrast(125%)'],
        underwater:['hue-rotate(200deg)', 'saturate(140%)', 'brightness(90%)'],
        sunset:['hue-rotate(15deg)', 'saturate(180%)', 'brightness(110%)', 'contrast(115%)'],
        frost:['hue-rotate(200deg)', 'saturate(50%)', 'brightness(120%)', 'contrast(110%)'],
        vintage:['sepia(40%)', 'saturate(70%)', 'contrast(110%)', 'brightness(95%)']
    };
 
    const TEXTURE_PRESETS = {
        vanilla: [],
        faithful:['brightness(95%)', 'contrast(105%)'],
        neon:['saturate(200%)', 'brightness(120%)', 'contrast(115%)'],
        dark:['brightness(60%)', 'contrast(130%)'],
        minimal:['brightness(105%)', 'saturate(70%)', 'contrast(90%)'],
        vivid:['saturate(180%)', 'contrast(125%)', 'brightness(105%)'],
        soft:['brightness(110%)', 'contrast(85%)', 'saturate(90%)'],
        hd:['contrast(120%)', 'brightness(105%)', 'saturate(110%)'],
        cold:['hue-rotate(200deg)', 'saturate(80%)', 'brightness(95%)'],
        warm:['hue-rotate(15deg)', 'saturate(120%)', 'brightness(105%)']
    };
 
    function getShaderFilter() {
        let filters =[];
        
        // Custom adjustments
        if (config.brightness !== 100) filters.push(`brightness(${config.brightness}%)`);
        if (config.contrast !== 100) filters.push(`contrast(${config.contrast}%)`);
        if (config.saturation !== 100) filters.push(`saturate(${config.saturation}%)`);
        if (config.sepia !== 0) filters.push(`sepia(${config.sepia}%)`);
        if (config.hueRotate !== 0) filters.push(`hue-rotate(${config.hueRotate}deg)`);
        if (config.invert !== 0) filters.push(`invert(${config.invert}%)`);
        if (config.blur !== 0) filters.push(`blur(${config.blur}px)`);
        
        // Shader preset
        if (config.shaderType && SHADER_PRESETS[config.shaderType]) {
            filters.push(...SHADER_PRESETS[config.shaderType]);
        }
        
        // Texture preset
        if (config.texturePack && TEXTURE_PRESETS[config.texturePack]) {
            filters.push(...TEXTURE_PRESETS[config.texturePack]);
        }
        
        if (config.ambientLighting !== 100) {
            filters.push(`brightness(${(config.ambientLighting / 100) * 100}%)`);
        }
        
        if (config.shadowsEnabled) {
            filters.push('drop-shadow(0 4px 12px rgba(0,0,0,0.6))');
        }
        
        if (config.bloomStrength > 0) {
            filters.push(`brightness(${100 + config.bloomStrength * 0.5}%)`);
        }
 
        return filters.length > 0 ? filters.join(' ') : 'none';
    }
 
    // Safely retrieves ONLY the main playing canvas, avoiding glitching hidden engine textures
    function getMainGameCanvas() {
        if (cachedGameCanvas && document.body.contains(cachedGameCanvas) && cachedGameCanvas.clientWidth > 100) {
            return cachedGameCanvas;
        }
 
        const allCanvases = Array.from(document.querySelectorAll('canvas')).filter(c => {
            return c.id !== 'pt-bg-particles' && !c.id.includes('pt-bg');
        });
        
        if (allCanvases.length > 0) {
            cachedGameCanvas = allCanvases.reduce((largest, current) => {
                const largestArea = largest.clientWidth * largest.clientHeight;
                const currentArea = current.clientWidth * current.clientHeight;
                return currentArea > largestArea ? current : largest;
            });
            return cachedGameCanvas;
        }
        return null;
    }
 
    // FIXED: Apply filters continuously while in-game without causing UI/Gameplay glitches
    function applyCanvasFilters() {
        const gameCanvas = getMainGameCanvas();
        
        if (gameCanvas) {
            const newFilter = getShaderFilter();
            
            // Apply filter if it changed
            if (newFilter !== lastAppliedFilter) {
                lastAppliedFilter = newFilter;
                gameCanvas.style.filter = newFilter;
                gameCanvas.style.transform = 'translateZ(0)'; // hardware acceleration for the css shader
            }
        }
    }
 
    // Start continuous filter checking when in-game
    function startFilterMonitoring() {
        if (filterCheckInterval) clearInterval(filterCheckInterval);
        
        filterCheckInterval = setInterval(() => {
            applyCanvasFilters();
        }, 100);
    }
 
    // ==========================================
    // RGB ANIMATION SYSTEM
    // ==========================================
    let rgbAnimationId = null;
    
    function startRGBAnimation() {
        if (rgbAnimationId) cancelAnimationFrame(rgbAnimationId);
        
        const animate = () => {
            uiState.rgbHueOffset = (uiState.rgbHueOffset + 2) % 360;
            updateHUDText();
            rgbAnimationId = requestAnimationFrame(animate);
        };
        
        animate();
    }
 
    function stopRGBAnimation() {
        if (rgbAnimationId) {
            cancelAnimationFrame(rgbAnimationId);
            rgbAnimationId = null;
        }
    }
 
    // ==========================================
    // CPS, PING & FPS TRACKING
    // ==========================================
    
    window.addEventListener('pointerdown', (e) => {
        if (e.isTrusted) {
            clicks.push(performance.now());
            updateCPS();
        }
    }, true);
 
    function updateCPS() {
        const now = performance.now();
        clicks = clicks.filter(t => now - t < 1000);
        uiState.cps = clicks.length;
        updateHUDText();
    }
    
    setInterval(updateCPS, 100);
 
    function measurePing() {
        const pingStart = performance.now();
        fetch(window.location.origin, { 
            method: 'GET', 
            mode: 'no-cors', 
            cache: 'no-store' 
        }).finally(() => {
            const ping = performance.now() - pingStart;
            if (ping > 0 && ping < 2000) {
                uiState.pingArray.push(ping);
                if (uiState.pingArray.length > 30) uiState.pingArray.shift();
                uiState.ping = Math.round(
                    uiState.pingArray.reduce((a, b) => a + b, 0) / uiState.pingArray.length
                );
                updateHUDText();
            }
        });
    }
    
    setInterval(measurePing, 2500);
    measurePing();
 
    function clientLoop() {
        frames++;
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
            uiState.fps = frames;
            frames = 0;
            lastFpsTime = now;
            updateHUDText();
        }
        requestAnimationFrame(clientLoop);
    }
 
    // ==========================================
    // CROSSHAIR SYSTEM
    // ==========================================
    let crosshairElement;
    let rgbIntervalId = null;
 
    const CROSSHAIR_DESIGNS = {
        dot: '<div style="width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 12px currentColor;"></div>',
        cross: '<div style="position:absolute;width:1px;height:12px;background:currentColor;left:50%;top:50%;transform:translate(-50%,-50%);box-shadow:0 0 6px currentColor;"></div><div style="position:absolute;width:12px;height:1px;background:currentColor;left:50%;top:50%;transform:translate(-50%,-50%);box-shadow:0 0 6px currentColor;"></div>',
        plus: '<div style="position:absolute;width:2px;height:16px;background:currentColor;left:50%;top:50%;transform:translate(-50%,-50%);box-shadow:0 0 8px currentColor;"></div><div style="position:absolute;width:16px;height:2px;background:currentColor;left:50%;top:50%;transform:translate(-50%,-50%);box-shadow:0 0 8px currentColor;"></div>',
        x: '<div style="position:absolute;width:2px;height:14px;background:currentColor;left:50%;top:50%;transform:translate(-50%,-50%) rotate(45deg);box-shadow:0 0 8px currentColor;"></div><div style="position:absolute;width:2px;height:14px;background:currentColor;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-45deg);box-shadow:0 0 8px currentColor;"></div>',
        triangle: '<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:12px solid currentColor;filter:drop-shadow(0 0 6px currentColor);"></div>',
        diamond: '<div style="width:10px;height:10px;background:currentColor;transform:rotate(45deg);box-shadow:0 0 8px currentColor;"></div>',
        circle: '<div style="width:12px;height:12px;border:2px solid currentColor;border-radius:50%;box-shadow:0 0 8px currentColor;"></div>',
        brackets: '<div style="position:absolute;width:2px;height:8px;background:currentColor;left:1px;top:1px;box-shadow:0 0 4px currentColor;"></div><div style="position:absolute;width:2px;height:8px;background:currentColor;right:1px;top:1px;box-shadow:0 0 4px currentColor;"></div><div style="position:absolute;width:2px;height:8px;background:currentColor;left:1px;bottom:1px;box-shadow:0 0 4px currentColor;"></div><div style="position:absolute;width:2px;height:8px;background:currentColor;right:1px;bottom:1px;box-shadow:0 0 4px currentColor;"></div>',
        star: '<div style="position:absolute;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:9px solid currentColor;left:50%;top:30%;transform:translate(-50%,-50%);filter:drop-shadow(0 0 6px currentColor);"></div>',
        heart: '<div style="width:14px;height:13px;position:relative;filter:drop-shadow(0 0 6px currentColor);"><svg viewBox="0 0 14 13" width="14" height="13" style="fill:currentColor;"><path d="M7,13 C7,13 1,8 1,5 C1,2 3,1 5,1 C6,1 7,2 7,2 C7,2 8,1 9,1 C11,1 13,2 13,5 C13,8 7,13 7,13 Z"/></svg></div>'
    };
 
    function renderCrosshair() {
        if (crosshairElement) crosshairElement.remove();
        if (rgbIntervalId) clearInterval(rgbIntervalId);
        if (!config.crosshairEnabled) return;
 
        crosshairElement = document.createElement('div');
        crosshairElement.id = 'pro-crosshair';
        crosshairElement.innerHTML = CROSSHAIR_DESIGNS[config.crosshairType] || CROSSHAIR_DESIGNS.dot;
        crosshairElement.style.cssText = `
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            z-index: 999998; 
            pointer-events: none; 
            color: #00ffaa; 
            font-size: ${config.crosshairSize}px;
        `;
        document.body.appendChild(crosshairElement);
 
        if (config.crosshairRGB && crosshairElement) {
            let rgbHue = 0;
            rgbIntervalId = setInterval(() => {
                if (config.crosshairRGB && crosshairElement) {
                    rgbHue = (rgbHue + 4) % 360;
                    crosshairElement.style.color = `hsl(${rgbHue}, 100%, 50%)`;
                }
            }, 30);
        }
    }
 
    // ==========================================
    // UI MENU RENDERER
    // ==========================================
    let hudElement, menuElement;
 
    function initUI() {
        hudElement = document.createElement('div');
        hudElement.id = 'pro-client-hud';
        document.body.appendChild(hudElement);
 
        menuElement = document.createElement('div');
        menuElement.id = 'pro-client-menu';
        menuElement.innerHTML = `
            <div class="menu-header">
                <div class="menu-title">Minefun Pro <span>v8.4.2</span></div>
            </div>
            <div class="menu-tabs">
                <div class="tab active" data-target="tab-fps">⚡ Performance</div>
                <div class="tab" data-target="tab-shaders">✨ Visuals</div>
                <div class="tab" data-target="tab-particles">🌸 Particles</div>
                <div class="tab" data-target="tab-hud">📊 HUD</div>
            </div>
            <div class="menu-body">
                <!-- TAB 1: PERFORMANCE -->
                <div class="tab-content active" id="tab-fps">
                    <div class="section-title">⚡ Engine Boost</div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info"><span class="setting-name">FPS & WebGL Boost</span><span class="setting-desc">Maximum performance mode</span></div>
                            <label class="switch"><input type="checkbox" id="set-fps-boost" ${config.enableFpsBoost ? 'checked' : ''}><span class="slider round"></span></label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info"><span class="setting-name">Disable Anti-Alias</span><span class="setting-desc">Reduces render load</span></div>
                            <label class="switch"><input type="checkbox" id="set-noaa" ${config.disableAA ? 'checked' : ''}><span class="slider round"></span></label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info"><span class="setting-name">Ultra Low Latency</span><span class="setting-desc">Bypass compositor</span></div>
                            <label class="switch"><input type="checkbox" id="set-latency" ${config.lowLatency ? 'checked' : ''}><span class="slider round"></span></label>
                        </div>
                    </div>
                </div>
 
                <!-- TAB 2: SHADERS & VISUALS -->
                <div class="tab-content" id="tab-shaders">
                    <div class="section-title">✨ Shader Presets (IN-GAME ONLY)</div>
                    <div class="menu-hint">✅ Shaders apply IN-GAME! Enter game to see effects. Background stays clean.</div>
                    <div class="settings-grid">
                        <div class="setting-item full-width">
                            <div class="slider-header"><span>Shader Preset</span></div>
                            <select id="set-shader" class="modern-select">
                                <option value="none" ${config.shaderType === 'none' ? 'selected' : ''}>None</option>
                                <option value="bloom" ${config.shaderType === 'bloom' ? 'selected' : ''}>✨ Bloom - Bright & Glowing</option>
                                <option value="vibrant" ${config.shaderType === 'vibrant' ? 'selected' : ''}>🎨 Vibrant - High Saturation</option>
                                <option value="cinematic" ${config.shaderType === 'cinematic' ? 'selected' : ''}>🎬 Cinematic - Movie Feel</option>
                                <option value="noir" ${config.shaderType === 'noir' ? 'selected' : ''}>🎭 Noir - Black & White</option>
                                <option value="thermal" ${config.shaderType === 'thermal' ? 'selected' : ''}>🔥 Thermal - Heat Vision</option>
                                <option value="retro" ${config.shaderType === 'retro' ? 'selected' : ''}>🕹️ Retro - Vintage Look</option>
                                <option value="acid" ${config.shaderType === 'acid' ? 'selected' : ''}>⚗️ Acid - Trippy Effects</option>
                                <option value="cyberpunk" ${config.shaderType === 'cyberpunk' ? 'selected' : ''}>🤖 Cyberpunk - Neon Future</option>
                                <option value="neon" ${config.shaderType === 'neon' ? 'selected' : ''}>💡 Neon - Bright & Bold</option>
                                <option value="dreamscape" ${config.shaderType === 'dreamscape' ? 'selected' : ''}>💫 Dreamscape - Dreamy</option>
                                <option value="matrix" ${config.shaderType === 'matrix' ? 'selected' : ''}>💻 Matrix - Green Code</option>
                                <option value="underwater" ${config.shaderType === 'underwater' ? 'selected' : ''}>🌊 Underwater - Deep Blue</option>
                                <option value="sunset" ${config.shaderType === 'sunset' ? 'selected' : ''}>🌅 Sunset - Warm Glow</option>
                                <option value="frost" ${config.shaderType === 'frost' ? 'selected' : ''}>❄️ Frost - Cold Blue</option>
                                <option value="vintage" ${config.shaderType === 'vintage' ? 'selected' : ''}>📷 Vintage - Old Photo</option>
                            </select>
                        </div>
 
                        <div class="setting-item full-width">
                            <div class="slider-header"><span>Texture Preset</span></div>
                            <select id="set-texture" class="modern-select">
                                <option value="vanilla" ${config.texturePack === 'vanilla' ? 'selected' : ''}>Vanilla - Default</option>
                                <option value="faithful" ${config.texturePack === 'faithful' ? 'selected' : ''}>Faithful - Classic</option>
                                <option value="neon" ${config.texturePack === 'neon' ? 'selected' : ''}>Neon - Bright</option>
                                <option value="dark" ${config.texturePack === 'dark' ? 'selected' : ''}>Dark - Low Brightness</option>
                                <option value="minimal" ${config.texturePack === 'minimal' ? 'selected' : ''}>Minimal - Simple</option>
                                <option value="vivid" ${config.texturePack === 'vivid' ? 'selected' : ''}>Vivid - Saturated</option>
                                <option value="soft" ${config.texturePack === 'soft' ? 'selected' : ''}>Soft - Smooth</option>
                                <option value="hd" ${config.texturePack === 'hd' ? 'selected' : ''}>HD - High Detail</option>
                                <option value="cold" ${config.texturePack === 'cold' ? 'selected' : ''}>Cold - Blue Tones</option>
                                <option value="warm" ${config.texturePack === 'warm' ? 'selected' : ''}>Warm - Orange Tones</option>
                            </select>
                        </div>
 
                        <div class="setting-slider">
                            <div class="slider-header"><span>🔆 Brightness</span><span id="val-bri">${config.brightness}%</span></div>
                            <input type="range" id="set-bri" min="30" max="200" step="5" value="${config.brightness}">
                        </div>
 
                        <div class="setting-slider">
                            <div class="slider-header"><span>⬆️ Contrast</span><span id="val-con">${config.contrast}%</span></div>
                            <input type="range" id="set-con" min="30" max="200" step="5" value="${config.contrast}">
                        </div>
 
                        <div class="setting-slider">
                            <div class="slider-header"><span>🎨 Saturation</span><span id="val-sat">${config.saturation}%</span></div>
                            <input type="range" id="set-sat" min="0" max="300" step="10" value="${config.saturation}">
                        </div>
 
                        <div class="setting-slider">
                            <div class="slider-header"><span>📸 Sepia</span><span id="val-sepia">${config.sepia}%</span></div>
                            <input type="range" id="set-sepia" min="0" max="100" step="5" value="${config.sepia}">
                        </div>
 
                        <div class="setting-slider">
                            <div class="slider-header"><span>🌈 Hue Rotate</span><span id="val-hue">${config.hueRotate}°</span></div>
                            <input type="range" id="set-hue" min="0" max="360" step="15" value="${config.hueRotate}">
                        </div>
 
                        <div class="setting-slider">
                            <div class="slider-header"><span>👁️ Invert</span><span id="val-invert">${config.invert}%</span></div>
                            <input type="range" id="set-invert" min="0" max="100" step="10" value="${config.invert}">
                        </div>
 
                        <div class="setting-slider">
                            <div class="slider-header"><span>🌫️ Blur</span><span id="val-blur">${config.blur}px</span></div>
                            <input type="range" id="set-blur" min="0" max="20" step="1" value="${config.blur}">
                        </div>
 
                        <div class="setting-item">
                            <div class="setting-info"><span class="setting-name">Enable Shadows</span></div>
                            <label class="switch"><input type="checkbox" id="set-shadows" ${config.shadowsEnabled ? 'checked' : ''}><span class="slider round"></span></label>
                        </div>
 
                        <div class="setting-slider">
                            <div class="slider-header"><span>💥 Bloom Strength</span><span id="val-bloom">${config.bloomStrength}%</span></div>
                            <input type="range" id="set-bloom" min="0" max="100" step="10" value="${config.bloomStrength}">
                        </div>
                    </div>
                </div>
 
                <!-- TAB 3: PARTICLES -->
                <div class="tab-content" id="tab-particles">
                    <div class="section-title">🌸 Menu Background Effects</div>
                    <div class="menu-hint">Only visible on main menu - Hidden in-game</div>
                    <div class="settings-grid">
                        <div class="setting-item full-width">
                            <div class="slider-header"><span>Particle Effect</span></div>
                            <select id="set-particles" class="modern-select">
                                <option value="none" ${config.particleRain === 'none' ? 'selected' : ''}>None</option>
                                <option value="snow" ${config.particleRain === 'snow' ? 'selected' : ''}>❄️ Snow - Falling</option>
                                <option value="rain" ${config.particleRain === 'rain' ? 'selected' : ''}>🌧️ Rain - Heavy</option>
                                <option value="stardust" ${config.particleRain === 'stardust' ? 'selected' : ''}>✨ Stardust - Magical</option>
                                <option value="sakura" ${config.particleRain === 'sakura' ? 'selected' : ''}>🌸 Sakura - Cherry Blossoms</option>
                                <option value="fireflies" ${config.particleRain === 'fireflies' ? 'selected' : ''}>🌟 Fireflies - Floating Lights</option>
                                <option value="matrix" ${config.particleRain === 'matrix' ? 'selected' : ''}>💻 Matrix - Digital Rain</option>
                                <option value="aurora" ${config.particleRain === 'aurora' ? 'selected' : ''}>🌌 Aurora - Northern Lights</option>
                            </select>
                        </div>
 
                        <div class="setting-slider">
                            <div class="slider-header"><span>Particle Density</span><span id="val-density">${config.weatherDensity}</span></div>
                            <input type="range" id="set-density" min="10" max="200" step="10" value="${config.weatherDensity}">
                        </div>
 
                        <div class="setting-slider">
                            <div class="slider-header"><span>Particle Speed</span><span id="val-speed">${config.particleSpeed.toFixed(1)}x</span></div>
                            <input type="range" id="set-speed" min="0.3" max="3" step="0.1" value="${config.particleSpeed}">
                        </div>
                    </div>
                </div>
 
                <!-- TAB 4: HUD -->
                <div class="tab-content" id="tab-hud">
                    <div class="section-title">🎯 Crosshair Settings</div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info"><span class="setting-name">Enable Crosshair</span></div>
                            <label class="switch"><input type="checkbox" id="set-cross-enable" ${config.crosshairEnabled ? 'checked' : ''}><span class="slider round"></span></label>
                        </div>
 
                        <div class="setting-item full-width">
                            <div class="slider-header"><span>Crosshair Type</span></div>
                            <select id="set-cross-type" class="modern-select">
                                <option value="dot" ${config.crosshairType === 'dot' ? 'selected' : ''}>● Dot - Classic</option>
                                <option value="cross" ${config.crosshairType === 'cross' ? 'selected' : ''}>+ Cross - Plus</option>
                                <option value="plus" ${config.crosshairType === 'plus' ? 'selected' : ''}>✚ Plus - Thick</option>
                                <option value="x" ${config.crosshairType === 'x' ? 'selected' : ''}>✕ X - Diagonal</option>
                                <option value="triangle" ${config.crosshairType === 'triangle' ? 'selected' : ''}>▲ Triangle - Arrow</option>
                                <option value="diamond" ${config.crosshairType === 'diamond' ? 'selected' : ''}>◆ Diamond - Gem</option>
                                <option value="circle" ${config.crosshairType === 'circle' ? 'selected' : ''}>◯ Circle - Ring</option>
                                <option value="brackets" ${config.crosshairType === 'brackets' ? 'selected' : ''}>[ ] Brackets - Square</option>
                                <option value="star" ${config.crosshairType === 'star' ? 'selected' : ''}>★ Star - Sparkle</option>
                                <option value="heart" ${config.crosshairType === 'heart' ? 'selected' : ''}>♥ Heart - Love</option>
                            </select>
                        </div>
 
                        <div class="setting-slider">
                            <div class="slider-header"><span>Crosshair Size</span><span id="val-cross-size">${config.crosshairSize}px</span></div>
                            <input type="range" id="set-cross-size" min="5" max="40" step="1" value="${config.crosshairSize}">
                        </div>
 
                        <div class="setting-item">
                            <div class="setting-info"><span class="setting-name">RGB Animation</span></div>
                            <label class="switch"><input type="checkbox" id="set-cross-rgb" ${config.crosshairRGB ? 'checked' : ''}><span class="slider round"></span></label>
                        </div>
                    </div>
 
                    <div class="section-title">📊 HUD Display Settings</div>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <div class="setting-info"><span class="setting-name">Show HUD (Permanent)</span></div>
                            <label class="switch"><input type="checkbox" id="set-showhud" ${config.showHUD ? 'checked' : ''}><span class="slider round"></span></label>
                        </div>
 
                        <div class="setting-item full-width">
                            <div class="slider-header"><span>HUD Position</span></div>
                            <select id="set-hud-pos" class="modern-select">
                                <option value="top-left" ${config.hudPosition === 'top-left' ? 'selected' : ''}>↖ Top Left</option>
                                <option value="top-right" ${config.hudPosition === 'top-right' ? 'selected' : ''}>↗ Top Right</option>
                                <option value="bottom-left" ${config.hudPosition === 'bottom-left' ? 'selected' : ''}>↙ Bottom Left</option>
                                <option value="bottom-right" ${config.hudPosition === 'bottom-right' ? 'selected' : ''}>↘ Bottom Right</option>
                            </select>
                        </div>
 
                        <div class="setting-item">
                            <div class="setting-info"><span class="setting-name">RGB HUD Animation</span></div>
                            <label class="switch"><input type="checkbox" id="set-hud-rgb" ${config.hudRgbAnimation ? 'checked' : ''}><span class="slider round"></span></label>
                        </div>
 
                        <div class="setting-slider">
                            <div class="slider-header"><span>HUD Font Size</span><span id="val-hud-size">${config.hudFontSize}px</span></div>
                            <input type="range" id="set-hud-size" min="10" max="24" step="1" value="${config.hudFontSize}">
                        </div>
 
                        <div class="setting-item full-width">
                            <div class="slider-header"><span>Font Family</span></div>
                            <select id="set-hud-font" class="modern-select">
                                <option value="Inter" ${config.hudFontFamily === 'Inter' ? 'selected' : ''}>Inter</option>
                                <option value="Arial" ${config.hudFontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                                <option value="Courier" ${config.hudFontFamily === 'Courier' ? 'selected' : ''}>Courier Mono</option>
                                <option value="Verdana" ${config.hudFontFamily === 'Verdana' ? 'selected' : ''}>Verdana</option>
                                <option value="monospace" ${config.hudFontFamily === 'monospace' ? 'selected' : ''}>Monospace</option>
                            </select>
                        </div>
 
                        <div class="setting-item full-width">
                            <div class="slider-header"><span>Font Weight</span></div>
                            <select id="set-hud-weight" class="modern-select">
                                <option value="400" ${config.hudFontWeight === '400' ? 'selected' : ''}>Normal</option>
                                <option value="600" ${config.hudFontWeight === '600' ? 'selected' : ''}>Semi-Bold</option>
                                <option value="700" ${config.hudFontWeight === '700' ? 'selected' : ''}>Bold</option>
                                <option value="800" ${config.hudFontWeight === '800' ? 'selected' : ''}>Extra Bold</option>
                                <option value="900" ${config.hudFontWeight === '900' ? 'selected' : ''}>Black</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
 
            <div class="menu-footer">Press <b>[</b> to open/close | ✅ Shaders Work In-Game</div>
        `;
        document.body.appendChild(menuElement);
 
        applyStyles();
        bindUIEvents();
        renderCrosshair();
        if (config.hudRgbAnimation) startRGBAnimation();
        updateHUDText();
    }
 
    function updateHUDText() {
        if (!hudElement) return;
        
        hudElement.style.display = config.showHUD ? 'flex' : 'none'; 
        hudElement.className = `hud-theme-${config.hudTheme} hud-pos-${config.hudPosition}`;
        hudElement.style.fontSize = `${config.hudFontSize}px`;
        hudElement.style.fontFamily = config.hudFontFamily;
        hudElement.style.fontWeight = config.hudFontWeight;
        
        let fpsColor = `hsl(${config.hudRgbAnimation ? (uiState.rgbHueOffset) % 360 : 160}, 100%, 50%)`;
        let pingColor = `hsl(${config.hudRgbAnimation ? (uiState.rgbHueOffset + 120) % 360 : 160}, 100%, 50%)`;
        let cpsColor = `hsl(${config.hudRgbAnimation ? (uiState.rgbHueOffset + 240) % 360 : 160}, 100%, 50%)`;
        
        hudElement.innerHTML = `
            <div class="hud-item"><span class="hud-lbl">FPS</span> <span class="hud-val" style="color: ${fpsColor}">${uiState.fps}</span></div>
            <div class="hud-item"><span class="hud-lbl">PING</span> <span class="hud-val" style="color: ${pingColor}">${uiState.ping}<small>ms</small></span></div>
            <div class="hud-item"><span class="hud-lbl">CPS</span> <span class="hud-val" style="color: ${cpsColor}">${uiState.cps}</span></div>
        `;
    }
 
    function bindUIEvents() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.getAttribute('data-target')).classList.add('active');
            });
        });
 
        // FIXED: Menu open/close with[ key ONLY and made completely reliable
        window.addEventListener('keydown', (e) => {
            if (e.key === '[') {
                // Ignore the keypress if the user is typing in chat/inputs
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                
                e.preventDefault();
                e.stopPropagation(); // Forces game not to interrupt the keystroke
 
                if (menuElement.classList.contains('open')) {
                    menuElement.classList.remove('open');
                } else {
                    menuElement.classList.add('open');
                }
            }
        }, true);
 
        // Draggable menu
        const header = menuElement.querySelector('.menu-header');
        let isDragging = false, offsetX = 0, offsetY = 0;
 
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - menuElement.offsetLeft;
            offsetY = e.clientY - menuElement.offsetTop;
        });
 
        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                menuElement.style.left = `${Math.max(0, e.clientX - offsetX)}px`;
                menuElement.style.top = `${Math.max(0, e.clientY - offsetY)}px`;
            }
        });
 
        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                config.menuPos = { left: menuElement.offsetLeft, top: menuElement.offsetTop };
                saveConfig();
            }
        });
 
        menuElement.style.left = `${config.menuPos.left}px`;
        menuElement.style.top = `${config.menuPos.top}px`;
 
        // Switch bindings
        const bindSwitch = (id, key) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('change', (e) => {
                config[key] = e.target.checked;
                saveConfig();
                if (key === 'crosshairEnabled') renderCrosshair();
                if (key === 'hudRgbAnimation') {
                    config.hudRgbAnimation ? startRGBAnimation() : stopRGBAnimation();
                }
                updateHUDText();
                applyCanvasFilters();
                startFilterMonitoring();
            });
        };
 
        // Slider bindings
        const bindSlider = (id, lblId, key, suffix = '') => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', (e) => {
                let val = e.target.value;
                config[key] = key.includes('Speed') || key.includes('particleSpeed') ? parseFloat(val) : parseInt(val);
                const lbl = document.getElementById(lblId);
                if (lbl) {
                    if (suffix === '%') lbl.innerText = val + '%';
                    else if (suffix === 'px') lbl.innerText = val + 'px';
                    else if (suffix === 'x') lbl.innerText = parseFloat(val).toFixed(1) + 'x';
                    else if (suffix === '°') lbl.innerText = val + '°';
                    else lbl.innerText = val;
                }
                saveConfig();
                updateHUDText();
                applyCanvasFilters();
                startFilterMonitoring();
            });
        };
 
        // Select bindings
        const bindSelect = (id, key) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('change', (e) => {
                config[key] = e.target.value;
                saveConfig();
                if (key === 'crosshairType') renderCrosshair();
                updateHUDText();
                applyCanvasFilters();
                startFilterMonitoring();
            });
        };
 
        // Performance tab
        bindSwitch('set-fps-boost', 'enableFpsBoost');
        bindSwitch('set-noaa', 'disableAA');
        bindSwitch('set-latency', 'lowLatency');
 
        // Shaders tab
        bindSlider('set-bri', 'val-bri', 'brightness', '%');
        bindSlider('set-con', 'val-con', 'contrast', '%');
        bindSlider('set-sat', 'val-sat', 'saturation', '%');
        bindSlider('set-sepia', 'val-sepia', 'sepia', '%');
        bindSlider('set-hue', 'val-hue', 'hueRotate', '°');
        bindSlider('set-invert', 'val-invert', 'invert', '%');
        bindSlider('set-blur', 'val-blur', 'blur', 'px');
        bindSlider('set-bloom', 'val-bloom', 'bloomStrength', '%');
        bindSwitch('set-shadows', 'shadowsEnabled');
 
        bindSelect('set-shader', 'shaderType');
        bindSelect('set-texture', 'texturePack');
 
        // Particles tab
        bindSelect('set-particles', 'particleRain');
        bindSlider('set-density', 'val-density', 'weatherDensity');
        bindSlider('set-speed', 'val-speed', 'particleSpeed', 'x');
 
        // HUD tab
        bindSwitch('set-showhud', 'showHUD');
        bindSwitch('set-cross-enable', 'crosshairEnabled');
        bindSwitch('set-cross-rgb', 'crosshairRGB');
        bindSwitch('set-hud-rgb', 'hudRgbAnimation');
 
        bindSelect('set-cross-type', 'crosshairType');
        bindSelect('set-hud-pos', 'hudPosition');
        bindSelect('set-hud-font', 'hudFontFamily');
        bindSelect('set-hud-weight', 'hudFontWeight');
 
        bindSlider('set-cross-size', 'val-cross-size', 'crosshairSize', 'px');
        bindSlider('set-hud-size', 'val-hud-size', 'hudFontSize', 'px');
    }
 
    function applyStyles() {
        const style = document.createElement('style');
        style.id = 'mf-ui-styles';
        style.innerHTML = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
            * { box-sizing: border-box; }
            
            /* HUD */
            #pro-client-hud {
                position: fixed; 
                display: flex; 
                gap: 16px; 
                z-index: 2147483647; 
                font-family: 'Inter', sans-serif; 
                pointer-events: none;
                background: rgba(8, 8, 15, 0.90); 
                backdrop-filter: blur(10px);
                padding: 14px 20px; 
                border-radius: 14px; 
                border: 1px solid rgba(0, 255, 170, 0.6);
                box-shadow: 0 8px 32px rgba(0, 255, 170, 0.15);
                will-change: contents;
            }
            
            #pro-client-hud.hud-pos-top-left { top: 15px; left: 15px; }
            #pro-client-hud.hud-pos-top-right { top: 15px; right: 15px; left: auto; }
            #pro-client-hud.hud-pos-bottom-left { bottom: 15px; left: 15px; top: auto; }
            #pro-client-hud.hud-pos-bottom-right { bottom: 15px; right: 15px; top: auto; left: auto; }
            
            .hud-item { 
                display: flex; 
                align-items: baseline; 
                gap: 6px; 
                will-change: color;
            }
            
            .hud-lbl { 
                font-size: 10px; 
                font-weight: 900; 
                color: #999; 
                letter-spacing: 2px; 
                text-transform: uppercase;
            }
            
            .hud-val { 
                font-size: 15px; 
                font-weight: 800; 
                color: #00ffaa; 
                text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9), 0 0 12px currentColor;
            }
            
            .hud-val small { 
                font-size: 9px; 
                opacity: 0.75; 
                margin-left: 2px; 
            }
 
            /* Menu */
            #pro-client-menu {
                position: fixed; 
                width: 520px; 
                max-height: 750px; 
                display: flex; 
                flex-direction: column;
                background: linear-gradient(135deg, rgba(10, 10, 20, 0.98), rgba(15, 15, 30, 0.95));
                backdrop-filter: blur(25px);
                border: 1px solid rgba(0, 255, 170, 0.4); 
                border-radius: 16px;
                box-shadow: 0 0 60px rgba(0, 255, 170, 0.12), inset 0 0 30px rgba(0, 255, 170, 0.05);
                font-family: 'Inter', sans-serif;
                color: #eee; 
                z-index: 2147483646; 
                display: none;
            }
            
            #pro-client-menu.open { 
                display: flex; 
                animation: slideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); 
            }
            
            @keyframes slideIn { 
                from { opacity: 0; transform: scale(0.92) translateY(-20px); } 
                to { opacity: 1; transform: scale(1) translateY(0); } 
            }
            
            .menu-header { 
                padding: 18px 22px; 
                border-bottom: 1px solid rgba(0, 255, 170, 0.2); 
                cursor: grab; 
                display: flex; 
                align-items: center; 
                justify-content: center; /* Centered since close button is removed */
                background: linear-gradient(135deg, rgba(0, 255, 170, 0.2), transparent);
                border-radius: 16px 16px 0 0;
            }
            
            .menu-title { 
                font-size: 17px; 
                font-weight: 900; 
                color: #fff; 
                letter-spacing: 1px;
            }
            
            .menu-title span { 
                color: #00ffaa; 
                font-size: 11px; 
                margin-left: 8px; 
                font-weight: 600;
            }
            
            .menu-tabs { 
                display: flex; 
                background: rgba(0, 0, 0, 0.4); 
                overflow-x: auto; 
                border-bottom: 1px solid rgba(0, 255, 170, 0.15);
            }
            
            .tab { 
                flex: 1; 
                text-align: center; 
                padding: 13px 8px; 
                font-size: 11px; 
                font-weight: 800; 
                color: #888; 
                cursor: pointer; 
                transition: 0.25s; 
                border-bottom: 2px solid transparent; 
                white-space: nowrap;
            }
            
            .tab:hover { 
                color: #00ffaa; 
            }
            
            .tab.active { 
                color: #00ffaa; 
                border-bottom: 2px solid #00ffaa; 
                background: rgba(0, 255, 170, 0.08);
            }
            
            .menu-body { 
                padding: 20px; 
                overflow-y: auto; 
                max-height: 620px; 
            }
            
            .menu-body::-webkit-scrollbar { 
                width: 8px; 
            }
            
            .menu-body::-webkit-scrollbar-track { 
                background: rgba(0, 0, 0, 0.3);
            }
            
            .menu-body::-webkit-scrollbar-thumb { 
                background: rgba(0, 255, 170, 0.4); 
                border-radius: 4px;
            }
            
            .menu-body::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 255, 170, 0.6);
            }
            
            .tab-content { 
                display: none; 
            }
            
            .tab-content.active { 
                display: block; 
                animation: fadeIn 0.25s;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .section-title { 
                font-size: 11px; 
                font-weight: 900; 
                color: #00ffaa; 
                margin: 0 0 14px 0; 
                text-transform: uppercase; 
                letter-spacing: 2px; 
                border-bottom: 1.5px dashed rgba(0, 255, 170, 0.3); 
                padding-bottom: 8px;
            }
            
            .settings-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 13px; 
            }
            
            .full-width { 
                grid-column: 1 / -1; 
            }
            
            .setting-item, .setting-slider { 
                background: rgba(0, 0, 0, 0.35); 
                padding: 12px 14px; 
                border-radius: 10px; 
                border: 1px solid rgba(255, 255, 255, 0.06);
                transition: 0.2s;
            }
            
            .setting-item:hover, .setting-slider:hover {
                background: rgba(0, 0, 0, 0.45);
                border-color: rgba(0, 255, 170, 0.2);
            }
            
            .setting-item { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
            }
            
            .setting-slider { 
                display: flex; 
                flex-direction: column; 
            }
            
            .setting-info { 
                display: flex; 
                flex-direction: column;
                gap: 2px;
            }
            
            .setting-name { 
                font-size: 12px; 
                font-weight: 800; 
                color: #fff; 
            }
            
            .setting-desc {
                font-size: 9px;
                color: #777;
                font-weight: 500;
            }
            
            .slider-header { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 9px; 
                font-size: 11px; 
                font-weight: 800; 
                color: #ddd; 
            }
            
            .slider-header span:last-child { 
                color: #00ffaa; 
                font-family: 'Courier New', monospace; 
                font-size: 10px;
            }
            
            input[type=range] { 
                width: 100%; 
                height: 7px; 
                border-radius: 8px; 
                background: linear-gradient(to right, #1a1a28, #252535); 
                outline: none; 
                cursor: pointer; 
                -webkit-appearance: none;
            }
            
            input[type=range]::-webkit-slider-thumb { 
                -webkit-appearance: none; 
                width: 16px; 
                height: 16px; 
                border-radius: 50%; 
                background: linear-gradient(135deg, #00ffaa, #00cc88);
                cursor: grab;
                box-shadow: 0 0 12px rgba(0, 255, 170, 0.7);
                transition: 0.1s;
            }
            
            input[type=range]::-webkit-slider-thumb:active {
                cursor: grabbing;
                box-shadow: 0 0 20px rgba(0, 255, 170, 0.9);
            }
            
            input[type=range]::-moz-range-thumb { 
                width: 16px; 
                height: 16px; 
                border-radius: 50%; 
                background: linear-gradient(135deg, #00ffaa, #00cc88);
                cursor: grab;
                border: none;
                box-shadow: 0 0 12px rgba(0, 255, 170, 0.7);
            }
            
            .modern-select { 
                width: 100%; 
                padding: 10px 12px; 
                background: rgba(0, 0, 0, 0.5); 
                border: 1px solid rgba(0, 255, 170, 0.2); 
                color: #fff; 
                border-radius: 8px; 
                font-family: 'Inter', sans-serif; 
                font-size: 11px; 
                cursor: pointer;
                transition: 0.2s;
            }
            
            .modern-select:hover {
                border-color: rgba(0, 255, 170, 0.4);
                background: rgba(0, 0, 0, 0.6);
            }
            
            .modern-select:focus { 
                outline: none; 
                border-color: #00ffaa; 
                box-shadow: 0 0 12px rgba(0, 255, 170, 0.4); 
            }
            
            .switch { 
                position: relative; 
                width: 42px; 
                height: 23px; 
            }
            
            .switch input { 
                opacity: 0; 
                width: 0; 
                height: 0; 
            }
            
            .slider { 
                position: absolute; 
                cursor: pointer; 
                top: 0; 
                left: 0; 
                right: 0; 
                bottom: 0; 
                background: #2a2a38; 
                border-radius: 23px; 
                transition: 0.35s;
            }
            
            .slider:before { 
                position: absolute; 
                content: ""; 
                height: 17px; 
                width: 17px; 
                left: 3px; 
                bottom: 3px; 
                background: #999; 
                border-radius: 50%; 
                transition: 0.35s;
            }
            
            input:checked + .slider { 
                background: rgba(0, 255, 170, 0.3); 
            }
            
            input:checked + .slider:before { 
                transform: translateX(19px); 
                background: #00ffaa; 
                box-shadow: 0 0 10px rgba(0, 255, 170, 0.9);
            }
            
            .menu-hint { 
                text-align: center; 
                border-radius: 8px; 
                font-size: 10px; 
                padding: 10px; 
                color: #888; 
                background: rgba(0, 255, 170, 0.08);
                margin-bottom: 13px;
                border: 1px dashed rgba(0, 255, 170, 0.15);
            }
            
            .menu-footer { 
                text-align: center; 
                padding: 12px; 
                font-size: 10px; 
                color: #555; 
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 0 0 16px 16px;
                background: rgba(0, 0, 0, 0.3);
            }
            
            .menu-footer b { 
                color: #00ffaa; 
            }
        `;
        document.head.appendChild(style);
    }
 
    // ==========================================
    // INITIALIZATION
    // ==========================================
    window.addEventListener('load', () => {
        GameState.init();
        ParticleEngine.init();
        initUI();
        clientLoop();
        startFilterMonitoring(); // Start continuous filter application
    });
 
    setTimeout(() => {
        if (!ParticleEngine.ready) {
            GameState.init();
            ParticleEngine.init();
            initUI();
            clientLoop();
            startFilterMonitoring(); // Start continuous filter application
        }
    }, 2500);
 
})();