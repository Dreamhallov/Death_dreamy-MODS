// ==UserScript==
// @name         ✨ MineFun Particles & Env Pro (Custom BGs, Adjustable Night Vision, FPS/CPS/Ping HUD)
// @namespace    http://tampermonkey.net/
// @version      9.0
// @description  The ultimate particles and environment mod. Adjustable Night Vision, Custom Background fixes, 10+ Particle Physics, and RGB HUD.
// @author       Death_dreamy
// @license      SL
// @match        *minefun.io*
// @match        *://*.minefun.io/*
// @grant        none
// @run-at       document-start
// ==/UserScript==
 
(function() {
    'use strict';
 
    console.log('%c[Particles Pro v8.0] Injecting Core Systems...', 'color: #00ffff; font-weight: bold; font-size: 16px;');
 
    // ============ CLEANUP OLD SCRIPTS ============
    const cleanupOldMenus = () => {
        const oldIds =['particle-menu', 'mf-particle-ui', 'ultra-client-ui', 'epic-client-ui', 'ult-bg-overlay', 'ult-dynamic-style', 'ult-canvas', 'ult-client-ui'];
        oldIds.forEach(id => {
            const old = document.getElementById(id);
            if (old) old.remove();
        });
    };
    setInterval(cleanupOldMenus, 2000);
 
    // ============ SETTINGS MANAGER ============
    const DEFAULT_SETTINGS = {
        masterEnable: true,
        weatherType: 'snow',
        weatherDensity: 50,
        customBgUrl: '',
        darkMode: true, // Dark menu background
        menuCanvasOpacity: 0.5, // How visible the 3D character is when using a custom BG
 
        // Adjustable Night Vision
        nightVision: false,
        nightVisionStyle: 'green',
        nvBrightness: 2.5,
        nvContrast: 1.1,
 
        // Particles
        spawnEffect: 'coins',
        killEffectStyle: 'auto',
        winKillsEnabled: true,
        particleSpeed: 4,
        particleSize: 4,
        particleShape: 'star',
    };
 
    const Settings = {
        get(key) {
            try {
                const s = JSON.parse(localStorage.getItem('mf_pt_v7') || '{}');
                return s[key] !== undefined ? s[key] : DEFAULT_SETTINGS[key];
            } catch (e) { return DEFAULT_SETTINGS[key]; }
        },
        set(key, value) {
            try {
                const s = JSON.parse(localStorage.getItem('mf_pt_v7') || '{}');
                s[key] = value;
                localStorage.setItem('mf_pt_v7', JSON.stringify(s));
            } catch (e) { }
        }
    };
 
    // ============ GAME STATE DETECTOR ============
    const GameState = {
        inGame: false,
        justDied: true,
 
        init() {
            // Pointer lock detection
            setInterval(() => {
                const isLocked = !!document.pointerLockElement;
                if (isLocked !== this.inGame) {
                    this.inGame = isLocked;
                    Visuals.updateState();
 
                    if (this.inGame && this.justDied) {
                        this.justDied = false;
                        Engine.triggerSpawn();
                    }
                }
            }, 100);
 
            // Button Click Detection
            document.addEventListener('click', (e) => {
                const text = (e.target.textContent || '').trim().toLowerCase();
                if (['play', 'respawn', 'spawn', 'play again', 'join'].includes(text)) {
                    this.justDied = true;
                    setTimeout(() => { if(GameState.inGame) Engine.triggerSpawn(); }, 800);
                }
            });
 
            const observer = new MutationObserver(() => {
                const text = document.body.innerText.toLowerCase();
                if (text.includes('respawn') || text.includes('you died')) this.justDied = true;
            });
            window.addEventListener('load', () => observer.observe(document.body, { childList: true, subtree: true }));
        }
    };
 
    // ============ HARDWARE-ACCELERATED VISUALS ============
    const Visuals = {
        bgElement: null,
        dynamicStyle: null,
 
        init() {
            // 1. Dedicated Background Image Layer (Guaranteed behind everything)
            if (!this.bgElement) {
                this.bgElement = document.createElement('div');
                this.bgElement.id = 'pt-custom-bg';
                this.bgElement.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    z-index: -999; background-size: cover; background-position: center;
                    background-color: #000; transition: opacity 0.5s ease;
                `;
                document.body.appendChild(this.bgElement);
            }
 
            // 2. CSS Engine (Handles Filters & Canvas Opacity)
            if (!this.dynamicStyle) {
                this.dynamicStyle = document.createElement('style');
                this.dynamicStyle.id = 'pt-dynamic-style';
                document.head.appendChild(this.dynamicStyle);
            }
 
            this.updateState();
            setInterval(() => this.updateState(), 500); // Failsafe tick
        },
 
        updateState() {
            if (!this.bgElement || !this.dynamicStyle) return;
 
            let cssCode = '';
 
            if (GameState.inGame) {
                this.bgElement.style.opacity = '0'; // Hide custom BG in game
 
                // Apply Adjustable Night Vision
                if (Settings.get('nightVision')) {
                    const b = Settings.get('nvBrightness');
                    const c = Settings.get('nvContrast');
                    if (Settings.get('nightVisionStyle') === 'green') {
                        cssCode = `canvas:not(#pt-canvas) { filter: sepia(1) hue-rotate(50deg) saturate(3) brightness(${b}) contrast(${c}) !important; opacity: 1 !important; }`;
                    } else {
                        cssCode = `canvas:not(#pt-canvas) { filter: brightness(${b}) contrast(${c}) saturate(1.2) !important; opacity: 1 !important; }`;
                    }
                } else {
                    cssCode = `canvas:not(#pt-canvas) { filter: none !important; opacity: 1 !important; }`;
                }
            } else {
                // IN MENU
                const bgUrl = Settings.get('customBgUrl');
                const hasCustomBg = bgUrl && bgUrl.length > 5;
 
                if (hasCustomBg) {
                    this.bgElement.style.opacity = '1';
                    this.bgElement.style.backgroundImage = `url(${bgUrl})`;
 
                    if (Settings.get('darkMode')) this.bgElement.style.filter = 'brightness(0.4)';
                    else this.bgElement.style.filter = 'none';
 
                    // Make game canvas slightly transparent so we can see the image behind it
                    const canOpa = Settings.get('menuCanvasOpacity');
                    cssCode = `canvas:not(#pt-canvas) { opacity: ${canOpa} !important; filter: none !important; }`;
                } else {
                    this.bgElement.style.opacity = '0';
                    this.bgElement.style.backgroundImage = 'none';
 
                    if (Settings.get('darkMode')) {
                        cssCode = `canvas:not(#pt-canvas) { filter: brightness(0.35) contrast(1.1) !important; opacity: 1 !important; }`;
                    } else {
                        cssCode = `canvas:not(#pt-canvas) { filter: none !important; opacity: 1 !important; }`;
                    }
                }
            }
 
            if (this.dynamicStyle.innerHTML !== cssCode) {
                this.dynamicStyle.innerHTML = cssCode;
            }
        }
    };
 
    // ============ EXPANDED PARTICLE ENGINE ============
    const Engine = {
        particles:[], weather:[],
        canvas: null, ctx: null, ready: false,
 
        init() {
            if (this.ready) return;
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'pt-canvas';
            this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483645;';
            this.ctx = this.canvas.getContext('2d', { alpha: true });
            document.documentElement.appendChild(this.canvas);
 
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.ready = true;
            this.animate();
        },
        resize() {
            if(this.canvas) {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
        },
 
        triggerSpawn() {
            if (!Settings.get('masterEnable')) return;
            const type = Settings.get('spawnEffect');
            const x = window.innerWidth / 2, y = window.innerHeight / 2 + 50;
 
            if (type === 'coins') {
                for(let i=0; i<40; i++) {
                    this.particles.push({ x, y, vx: (Math.random()-0.5)*12, vy: -Math.random()*15 - 5, age: 0, maxAge: 140, size: 5+Math.random()*3, color: `hsl(${40+Math.random()*15}, 100%, 50%)`, shape: 'coin', bounce: 0.5, gravity: 0.5, spin: Math.random()*0.3 });
                }
            } else if (type === 'fire') {
                for(let i=0; i<60; i++) {
                    this.particles.push({ x: x+(Math.random()-0.5)*50, y: y+Math.random()*20, vx: (Math.random()-0.5)*4, vy: -Math.random()*8 - 2, age: 0, maxAge: 80, size: 6+Math.random()*6, color: `hsl(${Math.random()*40}, 100%, 50%)`, shape: 'circle', gravity: -0.05, shrink: true });
                }
            } else if (type === 'water') {
                for(let i=0; i<60; i++) {
                    this.particles.push({ x, y, vx: (Math.random()-0.5)*15, vy: -Math.random()*10 - 5, age: 0, maxAge: 100, size: 2+Math.random()*4, color: `hsl(${190+Math.random()*30}, 100%, 60%)`, shape: 'drop', gravity: 0.4, shrink: false });
                }
            } else if (type === 'snow_blast') {
                for(let i=0; i<70; i++) {
                    const ang = Math.random() * Math.PI * 2; const v = 5 + Math.random()*10;
                    this.particles.push({ x, y, vx: Math.cos(ang)*v, vy: Math.sin(ang)*v, age: 0, maxAge: 90, size: 2+Math.random()*3, color: '#ffffff', shape: 'circle', gravity: 0.05, friction: 0.92 });
                }
            } else if (type === 'magic') {
                for(let i=0; i<50; i++) {
                    this.particles.push({ x, y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, age: 0, maxAge: 120, size: 4+Math.random()*5, color: `hsl(${260+Math.random()*60}, 100%, 60%)`, shape: 'plasma', gravity: -0.02, shrink: true });
                }
            }
        },
 
        triggerKill(contextText = '') {
            if (!Settings.get('winKillsEnabled') || !Settings.get('masterEnable')) return;
 
            let style = Settings.get('killEffectStyle');
            if (style === 'auto') {
                if (contextText.includes('zombie') || contextText.includes('infected')) style = 'zombie';
                else if (contextText.includes('shot') || contextText.includes('sniped') || contextText.includes('war')) style = 'spark';
                else style = 'normal';
            }
 
            const x = window.innerWidth / 2, y = window.innerHeight / 2;
            const speed = Settings.get('particleSpeed');
 
            if (style === 'war_blood') {
                for(let i=0; i<50; i++) this.particles.push({ x, y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, age: 0, maxAge: 90, size: 3+Math.random()*6, color: `hsl(350, 90%, ${30+Math.random()*20}%)`, shape: 'circle', gravity: 0.3, shrink: true });
            } else if (style === 'zombie') {
                for(let i=0; i<40; i++) this.particles.push({ x, y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, age: 0, maxAge: 80, size: 3+Math.random()*5, color: `hsl(${90+Math.random()*40}, 100%, 40%)`, shape: 'drop', gravity: 0.2 });
            } else if (style === 'spark') {
                for(let i=0; i<40; i++) {
                    const ang = Math.random() * Math.PI * 2; const v = speed * 2 + Math.random()*8;
                    this.particles.push({ x, y, vx: Math.cos(ang)*v, vy: Math.sin(ang)*v, age: 0, maxAge: 40, size: 2+Math.random()*2, color: '#ffffaa', shape: 'spark', gravity: 0.1 });
                }
            } else if (style === 'plasma') {
                for(let i=0; i<30; i++) {
                    const ang = Math.random() * Math.PI * 2; const v = speed + Math.random()*3;
                    this.particles.push({ x, y, vx: Math.cos(ang)*v, vy: Math.sin(ang)*v, age: 0, maxAge: 100, size: 5+Math.random()*5, color: `hsl(${280+Math.random()*60}, 100%, 60%)`, shape: 'plasma', gravity: 0, shrink: true });
                }
            } else {
                const shapeMode = Settings.get('particleShape');
                for (let i = 0; i < 40; i++) {
                    const ang = Math.random() * Math.PI * 2; const v = speed + Math.random()*6;
                    this.particles.push({ x, y, vx: Math.cos(ang)*v, vy: Math.sin(ang)*v, age: 0, maxAge: 100, size: Settings.get('particleSize')+Math.random()*3, color: `hsl(${Math.random()*360}, 100%, 60%)`, shape: shapeMode, gravity: 0.15, spin: Math.random()*0.2 });
                }
            }
        },
 
        updateWeather() {
            if (GameState.inGame) { this.weather =[]; return; }
            const type = Settings.get('weatherType');
            if(type === 'none' || !Settings.get('masterEnable')) { this.weather =[]; return; }
 
            const density = Settings.get('weatherDensity');
            if (this.weather.length < density * 3 && Math.random() < 0.5) {
                if (type === 'snow') this.weather.push({ x: Math.random()*this.canvas.width, y: -10, vx: (Math.random()-0.5)*0.5, vy: 0.5+Math.random()*1.5, size: 1.5+Math.random()*2, type: 'snow', wobble: Math.random()*10 });
                else if (type === 'rain') this.weather.push({ x: Math.random()*this.canvas.width, y: -10, vx: 0.5, vy: 12+Math.random()*8, size: 1.5, type: 'rain' });
                else if (type === 'petals') this.weather.push({ x: Math.random()*this.canvas.width, y: -10, vx: 1+Math.random()*2, vy: 1+Math.random()*1.5, size: 2.5+Math.random()*3, type: 'petal', wobble: Math.random()*10 });
                else if (type === 'leaves') this.weather.push({ x: Math.random()*this.canvas.width, y: -10, vx: (Math.random()-0.5)*2, vy: 1+Math.random()*1, size: 3+Math.random()*4, type: 'leaf', wobble: Math.random()*10, color: `hsl(${30+Math.random()*40}, 80%, 40%)` });
            }
 
            for (let i = this.weather.length - 1; i >= 0; i--) {
                const w = this.weather[i];
                w.y += w.vy; w.x += w.vx;
                if (w.type === 'snow' || w.type === 'petal' || w.type === 'leaf') { w.x += Math.sin(w.wobble)*0.8; w.wobble += 0.03; }
                if (w.y > this.canvas.height+20) this.weather.splice(i, 1);
            }
        },
 
        update() {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.age++;
                if (p.friction) { p.vx *= p.friction; p.vy *= p.friction; }
                p.x += p.vx; p.y += p.vy;
 
                if (p.gravity) p.vy += p.gravity;
                if (p.shrink) p.size = Math.max(0, p.size - 0.15);
 
                if(p.shape === 'coin' && p.y > window.innerHeight - 30) { p.y = window.innerHeight - 30; p.vy *= -p.bounce; }
 
                if (p.age >= p.maxAge || p.size <= 0) this.particles.splice(i, 1);
            }
            this.updateWeather();
        },
 
        draw() {
            if (!this.ctx) return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
 
            for (const w of this.weather) {
                this.ctx.globalAlpha = 0.7;
                if (w.type === 'snow') { this.ctx.fillStyle = '#ffffff'; this.ctx.beginPath(); this.ctx.arc(w.x, w.y, w.size, 0, Math.PI*2); this.ctx.fill(); }
                if (w.type === 'rain') { this.ctx.fillStyle = '#aaddff'; this.ctx.fillRect(w.x, w.y, 1.5, w.size*8); }
                if (w.type === 'petal') { this.ctx.fillStyle = '#ffc0cb'; this.ctx.beginPath(); this.ctx.arc(w.x, w.y, w.size, 0, Math.PI*2); this.ctx.fill(); }
                if (w.type === 'leaf') { this.ctx.fillStyle = w.color; this.ctx.save(); this.ctx.translate(w.x, w.y); this.ctx.rotate(w.wobble); this.ctx.beginPath(); this.ctx.ellipse(0, 0, w.size, w.size/2, 0, 0, Math.PI*2); this.ctx.fill(); this.ctx.restore(); }
            }
 
            for (const p of this.particles) {
                this.ctx.globalAlpha = Math.max(0, 1 - (p.age/p.maxAge));
 
                if (p.shape === 'spark') {
                    this.ctx.strokeStyle = p.color; this.ctx.lineWidth = p.size;
                    this.ctx.beginPath(); this.ctx.moveTo(p.x - p.vx*2, p.y - p.vy*2); this.ctx.lineTo(p.x, p.y); this.ctx.stroke();
                } else if (p.shape === 'plasma') {
                    this.ctx.shadowBlur = 15; this.ctx.shadowColor = p.color;
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); this.ctx.fill();
                    this.ctx.shadowBlur = 0; // Reset
                } else {
                    this.ctx.fillStyle = p.color;
                    if (p.shape === 'coin' || p.shape === 'square') {
                        this.ctx.save(); this.ctx.translate(p.x, p.y); this.ctx.rotate(p.age * p.spin); this.ctx.fillRect(-p.size, -p.size, p.size*2, p.size*2); this.ctx.restore();
                    } else if (p.shape === 'star') {
                        this.ctx.save(); this.ctx.translate(p.x, p.y); this.ctx.rotate(p.age * p.spin); this.ctx.beginPath();
                        for(let k=0; k<5; k++) { this.ctx.lineTo(Math.cos((18+k*72)*Math.PI/180)*p.size, -Math.sin((18+k*72)*Math.PI/180)*p.size); this.ctx.lineTo(Math.cos((54+k*72)*Math.PI/180)*p.size*0.5, -Math.sin((54+k*72)*Math.PI/180)*p.size*0.5); }
                        this.ctx.closePath(); this.ctx.fill(); this.ctx.restore();
                    } else if (p.shape === 'drop') {
                        this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI); this.ctx.lineTo(p.x, p.y - p.size*2); this.ctx.closePath(); this.ctx.fill();
                    } else {
                        this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); this.ctx.fill();
                    }
                }
            }
            this.ctx.globalAlpha = 1;
        },
 
        animate() {
            if (!this.ready) return;
            this.update(); this.draw();
            requestAnimationFrame(() => this.animate());
        }
    };
 
    // ============ UI MENU ============
    const UI = {
        open: false, el: null,
        create() {
            const style = document.createElement('style');
            style.innerHTML = `
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
                #pt-client-ui {
                    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.95);
                    width: 440px; background: rgba(20, 20, 25, 0.95); backdrop-filter: blur(15px);
                    border: 1px solid rgba(0, 255, 255, 0.2); border-radius: 16px;
                    z-index: 2147483647; color: #fff; font-family: 'Poppins', sans-serif;
                    box-shadow: 0 10px 40px rgba(0,255,255,0.15);
                    display: none; opacity: 0; transition: opacity 0.2s, transform 0.2s; user-select: none;
                }
                #pt-client-ui.visible { display: block; opacity: 1; transform: translate(-50%, -50%) scale(1); }
                .p-header { padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
                .p-header h1 { margin: 0; font-size: 18px; font-weight: 800; color: #00ffff; letter-spacing: 0.5px; }
                .p-close { background: none; border: none; color: #888; cursor: pointer; font-size: 22px; padding: 0; transition: color 0.2s; }
                .p-close:hover { color: #ff3366; }
                .p-content { padding: 20px 22px; max-height: 65vh; overflow-y: auto; }
                .p-group { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-bottom: 15px; }
                .p-group h3 { margin: 0 0 15px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; color: #00ffff; }
                .p-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .p-row:last-child { margin-bottom: 0; }
                .p-row span { font-size: 13px; font-weight: 600; color: #ddd; }
 
                .p-toggle { appearance: none; width: 38px; height: 22px; background: #444; border-radius: 20px; position: relative; cursor: pointer; outline: none; transition: 0.3s; }
                .p-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: 0.3s; }
                .p-toggle:checked { background: #00ffff; }
                .p-toggle:checked::after { transform: translateX(16px); }
 
                .p-select { background: #111; color: #fff; border: 1px solid #444; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-family: 'Poppins'; outline: none; cursor: pointer; }
                .p-slider { width: 120px; accent-color: #00ffff; }
                .p-input { background: #111; border: 1px solid #444; color: #fff; padding: 10px; border-radius: 8px; width: 100%; font-size: 12px; margin-top: 8px; box-sizing: border-box;}
 
                /* Scrollbar */
                .p-content::-webkit-scrollbar { width: 6px; }
                .p-content::-webkit-scrollbar-thumb { background: #00ffff; border-radius: 10px; }
            `;
            document.head.appendChild(style);
 
            this.el = document.createElement('div');
            this.el.id = 'pt-client-ui';
            this.el.innerHTML = `
                <div class="p-header">
                    <h1>✨ PARTICLES & ENV PRO <span style="font-size:10px; color:#888;">by Death_dreamy</span></h1>
                    <button class="p-close" id="pc-close">✖</button>
                </div>
                <div class="p-content">
 
                    <div class="p-group">
                        <h3>👁️ Adjustable Night Vision</h3>
                        <div class="p-row">
                            <span>Enable Night Vision</span>
                            <input type="checkbox" class="p-toggle" id="pc-night" ${Settings.get('nightVision')?'checked':''}>
                        </div>
                        <div class="p-row">
                            <span>Vision Filter</span>
                            <select class="p-select" id="pc-nstyle">
                                <option value="green" ${Settings.get('nightVisionStyle')==='green'?'selected':''}>Military Green</option>
                                <option value="bright" ${Settings.get('nightVisionStyle')==='bright'?'selected':''}>Bright White</option>
                            </select>
                        </div>
                        <div class="p-row" style="margin-top: 8px;">
                            <span style="font-size:11px;">Intensity</span>
                            <input type="range" class="p-slider" id="pc-nbright" min="1.0" max="5.0" step="0.1" value="${Settings.get('nvBrightness')}">
                        </div>
                        <div class="p-row">
                            <span style="font-size:11px;">Contrast</span>
                            <input type="range" class="p-slider" id="pc-ncont" min="0.5" max="3.0" step="0.1" value="${Settings.get('nvContrast')}">
                        </div>
                    </div>
 
                    <div class="p-group">
                        <h3>🏞️ Menu Backgrounds</h3>
                        <div class="p-row"><span>Menu Weather</span> <select class="p-select" id="pc-weather">
                            <option value="none" ${Settings.get('weatherType')==='none'?'selected':''}>Clear</option>
                            <option value="snow" ${Settings.get('weatherType')==='snow'?'selected':''}>🌨️ Snow</option>
                            <option value="rain" ${Settings.get('weatherType')==='rain'?'selected':''}>🌧️ Rain</option>
                            <option value="leaves" ${Settings.get('weatherType')==='leaves'?'selected':''}>🍂 Falling Leaves</option>
                            <option value="petals" ${Settings.get('weatherType')==='petals'?'selected':''}>🌸 Cherry Petals</option>
                        </select></div>
                        <div class="p-row" style="margin-top: 10px;">
                            <span>Darken Menu Scene</span> <input type="checkbox" class="p-toggle" id="pc-dark" ${Settings.get('darkMode')?'checked':''}>
                        </div>
                        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
                            <span style="font-size: 12px; color: #aaa;">Custom Background Image URL</span>
                            <input type="text" class="p-input" id="pc-bgurl" placeholder="Paste URL here..." value="${Settings.get('customBgUrl')}">
                        </div>
                        <div class="p-row" style="margin-top: 10px;">
                            <span style="font-size:11px; color:#aaa;">3D Menu Visibility (When using URL)</span>
                            <input type="range" class="p-slider" id="pc-opa" min="0.0" max="1.0" step="0.1" value="${Settings.get('menuCanvasOpacity')}">
                        </div>
                    </div>
 
                    <div class="p-group">
                        <h3>🎆 Advanced Particles</h3>
                        <div class="p-row"><span>Master Particles Toggle</span> <input type="checkbox" class="p-toggle" id="pc-master" ${Settings.get('masterEnable')?'checked':''}></div>
 
                        <div class="p-row" style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                            <span>🚀 Spawn Effect</span> <select class="p-select" id="pc-spawne">
                                <option value="coins" ${Settings.get('spawnEffect')==='coins'?'selected':''}>💰 Gold Coins</option>
                                <option value="fire" ${Settings.get('spawnEffect')==='fire'?'selected':''}>🔥 Fire Eruption</option>
                                <option value="water" ${Settings.get('spawnEffect')==='water'?'selected':''}>💧 Water Splash</option>
                                <option value="snow_blast" ${Settings.get('spawnEffect')==='snow_blast'?'selected':''}>❄️ Snow Blast</option>
                                <option value="magic" ${Settings.get('spawnEffect')==='magic'?'selected':''}>🔮 Magic Plasma</option>
                            </select>
                        </div>
 
                        <div class="p-row">
                            <span>💀 Kill Effect</span> <select class="p-select" id="pc-kille">
                                <option value="auto" ${Settings.get('killEffectStyle')==='auto'?'selected':''}>🤖 Smart Auto</option>
                                <option value="spark" ${Settings.get('killEffectStyle')==='spark'?'selected':''}>⚡ Gun Sparks</option>
                                <option value="war_blood" ${Settings.get('killEffectStyle')==='war_blood'?'selected':''}>🩸 War Blood</option>
                                <option value="zombie" ${Settings.get('killEffectStyle')==='zombie'?'selected':''}>🧟 Toxic Slime</option>
                                <option value="plasma" ${Settings.get('killEffectStyle')==='plasma'?'selected':''}>🟣 Neon Plasma</option>
                                <option value="normal" ${Settings.get('killEffectStyle')==='normal'?'selected':''}>✨ Standard</option>
                            </select>
                        </div>
                    </div>
 
                </div>
            `;
            document.documentElement.appendChild(this.el);
            this.bindEvents();
        },
 
        bindEvents() {
            document.getElementById('pc-close').onclick = () => this.toggle();
 
            // Vision
            document.getElementById('pc-night').onchange = (e) => { Settings.set('nightVision', e.target.checked); Visuals.updateState(); };
            document.getElementById('pc-nstyle').onchange = (e) => { Settings.set('nightVisionStyle', e.target.value); Visuals.updateState(); };
            document.getElementById('pc-nbright').oninput = (e) => { Settings.set('nvBrightness', parseFloat(e.target.value)); Visuals.updateState(); };
            document.getElementById('pc-ncont').oninput = (e) => { Settings.set('nvContrast', parseFloat(e.target.value)); Visuals.updateState(); };
 
            // Menu Visuals
            document.getElementById('pc-weather').onchange = (e) => Settings.set('weatherType', e.target.value);
            document.getElementById('pc-dark').onchange = (e) => { Settings.set('darkMode', e.target.checked); Visuals.updateState(); };
            document.getElementById('pc-bgurl').oninput = (e) => { Settings.set('customBgUrl', e.target.value); Visuals.updateState(); };
            document.getElementById('pc-opa').oninput = (e) => { Settings.set('menuCanvasOpacity', parseFloat(e.target.value)); Visuals.updateState(); };
 
            // Particles
            document.getElementById('pc-master').onchange = (e) => Settings.set('masterEnable', e.target.checked);
            document.getElementById('pc-spawne').onchange = (e) => Settings.set('spawnEffect', e.target.value);
            document.getElementById('pc-kille').onchange = (e) => Settings.set('killEffectStyle', e.target.value);
        },
 
        toggle() {
            this.open = !this.open;
            if (this.open) this.el.classList.add('visible');
            else this.el.classList.remove('visible');
        }
    };
 
    // ============ NEW: RGB INFO HUD (FPS, CPS, TIME, PING) ============
    const InfoHUD = {
        el: null,
        frames: 0, fps: 0, lastFpsTime: performance.now(),
        clicks:[], pingMs: 0,
 
        init() {
            // Setup custom CSS for the RGB Texts
            const style = document.createElement('style');
            style.innerHTML = `
                @keyframes rgb-hud-glow {
                    0%   { color: #ff0000; text-shadow: 0 0 5px #ff0000; }
                    16%  { color: #ff7f00; text-shadow: 0 0 5px #ff7f00; }
                    33%  { color: #ffff00; text-shadow: 0 0 5px #ffff00; }
                    50%  { color: #00ff00; text-shadow: 0 0 5px #00ff00; }
                    66%  { color: #0000ff; text-shadow: 0 0 5px #0000ff; }
                    83%  { color: #4b0082; text-shadow: 0 0 5px #4b0082; }
                    100% { color: #ff0000; text-shadow: 0 0 5px #ff0000; }
                }
                #mf-info-overlay {
                    position: fixed; top: 10px; left: 10px; z-index: 2147483647;
                    background: rgba(10, 10, 15, 0.6); padding: 12px 15px; border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px);
                    font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 800;
                    pointer-events: none; display: flex; flex-direction: column; gap: 4px;
                }
                .rgb-text-anim {
                    animation: rgb-hud-glow 3s linear infinite;
                    margin: 0; padding: 0; line-height: 1.2;
                }
            `;
            document.head.appendChild(style);
 
            // Create Element
            this.el = document.createElement('div');
            this.el.id = 'mf-info-overlay';
            document.documentElement.appendChild(this.el);
 
            // Track user clicks for CPS
            document.addEventListener('mousedown', () => this.clicks.push(performance.now()));
 
            // Launch Tasks
            this.measurePing();
            setInterval(() => this.measurePing(), 3000); // Check Ping every 3 seconds
            setInterval(() => this.updateOverlay(), 100); // Refresh Display
            requestAnimationFrame(() => this.trackFPS());
        },
 
        trackFPS() {
            let now = performance.now();
            this.frames++;
            if (now - this.lastFpsTime >= 1000) {
                this.fps = this.frames;
                this.frames = 0;
                this.lastFpsTime = now;
            }
            requestAnimationFrame(() => this.trackFPS());
        },
 
        async measurePing() {
            let start = performance.now();
            try {
                // We run a fast fetch to the current server to estimate latency
                await fetch(window.location.origin, { method: 'HEAD', cache: 'no-cache' });
                this.pingMs = Math.round(performance.now() - start);
            } catch (e) {
                this.pingMs = 999;
            }
        },
 
        getConnectionStatus() {
            if (this.pingMs < 80) return { text: 'Good', color: '#00ff00' };// Green
            if (this.pingMs < 150) return { text: 'Normal', color: '#ffff00' };// Yellow
            if (this.pingMs < 300) return { text: 'Little bit bad', color: '#ffa500' };// Orange
            return { text: 'Bad', color: '#ff0000' }; // Red
        },
 
        updateOverlay() {
            if (!this.el) return;
 
            // Compute CPS (Clicks happening within the last 1000ms)
            let now = performance.now();
            this.clicks = this.clicks.filter(t => now - t < 1000);
            let currentCps = this.clicks.length;
 
            // Local Time
            let localTime = new Date().toLocaleTimeString();
 
            // Ping Status Color
            let connInfo = this.getConnectionStatus();
 
            this.el.innerHTML = `
                <div class="rgb-text-anim">FPS: ${this.fps}</div>
                <div class="rgb-text-anim">CPS: ${currentCps}</div>
                <div class="rgb-text-anim">Time: ${localTime}</div>
                <div>
                    <span class="rgb-text-anim">Ping: ${this.pingMs}ms </span>
                    <span style="color: ${connInfo.color}; text-shadow: 0 0 5px ${connInfo.color};">(${connInfo.text})</span>
                </div>
            `;
        }
    };
 
    // ============ GAME EVENT HOOKS ============
    const Hooks = {
        init() {
            const observer = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    if (m.addedNodes.length) {
                        m.addedNodes.forEach(node => {
                            const text = (node.textContent || '').toLowerCase();
                            if (!text) return;
 
                            if (text.includes('killed') || text.includes('eliminated') || text.includes('shot')) {
                                Engine.triggerKill(text);
                            }
                        });
                    }
                }
            });
 
            const tryObserve = setInterval(() => {
                if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
                    clearInterval(tryObserve);
                }
            }, 500);
        }
    };
 
    // ============ HOTKEY ============
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'i') {
            const tag = e.target?.tagName?.toLowerCase();
            if (tag !== 'input' && tag !== 'textarea') {
                e.preventDefault();
                UI.toggle();
            }
        }
    }, true);
 
    // ============ INITIALIZE ============
    const Bootloader = setInterval(() => {
        if (document.body && document.documentElement) {
            console.log('%c[Particles Pro v8.0] Loaded Successfully.', 'color: #00ffff;');
            cleanupOldMenus();
            GameState.init();
            Visuals.init();
            Engine.init();
            UI.create();
            InfoHUD.init(); // <-- Trigger the new overlay HUD module
            Hooks.init();
            clearInterval(Bootloader);
        }
    }, 100);
 
})();