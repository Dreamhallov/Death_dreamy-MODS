// ==UserScript==
// @name         Minefun.io Custom Keystrokes & CPS Tracker 
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description Advance Level Keystrokes and Cps With more Improve settings And You have facility to change key blinds too.. Best Keystroke Type '\' To open menu.
// @author       Death_dreamy
// @license      SL
// @match        *://minefun.io/*
// @match        *://*.minefun.io/*
// @grant        none
// @run-at       document-end
// ==/UserScript==
 
(function() {
    'use strict';
 
    // --- DEFAULT CONFIGURATION ---
    const defaultConfig = {
        // Key Mapping
        upKey: "w", leftKey: "a", downKey: "s", rightKey: "d", pKey: "p", cKey: "c", rshiftKey: "Shift", spaceKey: " ",
        upText: "W", leftText: "A", downText: "S", rightText: "D", pText: "P", cText: "C", rshiftText: "R-SH", spaceText: "―――",
        
        // Style
        fontFamily: "'Inter', sans-serif",
        idleColor: "#18181b",
        pressColor: "#ffffff",
        keyAlpha: 0.85, 
        opacity: 1.0,   
        scale: 1.0,
        borderRadius: 12, 
        
        // Background Image
        bgUrl: "",
        bgMode: "none",
        
        // Advanced RGB & New Features
        rgbTheme: "theme-1",
        rgbText: false, 
        rgbBackground: false, 
        rgbGlow: true, 
        rgbSpeed: 5,
        glowSpread: 14,
        textShadow: false,
        showInfo: true,
        
        // Particle Engine
        particles: true,
        particleType: "snow", // snow, rain, stars, matrix, bubbles, fire
        particleCount: 35,
        particleSpeed: 1.0,
        
        posX: "20px", posY: "20px"
    };
 
    let config = { ...defaultConfig, ...JSON.parse(localStorage.getItem('keystrokes_config_v8') || '{}') };
 
    // --- STATE VARIABLES ---
    let lmbClicks =[]; let rmbClicks =[];
    const keyElements = {};
    let isMenuOpen = false;
    let maxCps = 0;
    
    // FPS & Particle tracking variables
    let lastTime = performance.now();
    let frames = 0;
    let canvas, ctx, particlesArray =[];
 
    // Helper
    function hexToRgb(hex) {
        let r = 0, g = 0, b = 0;
        if(hex.length === 4) { r=parseInt(hex[1]+hex[1],16); g=parseInt(hex[2]+hex[2],16); b=parseInt(hex[3]+hex[3],16); }
        else if(hex.length === 7) { r=parseInt(hex.substring(1,3),16); g=parseInt(hex.substring(3,5),16); b=parseInt(hex.substring(5,7),16); }
        return `${r}, ${g}, ${b}`;
    }
 
    // --- CSS STYLES ---
    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@800&family=VT323&family=Poppins:wght@800&family=Oswald:wght@700&display=swap');
        
        :root {
            --ks-font: ${config.fontFamily};
            --ks-idle-rgb: ${hexToRgb(config.idleColor)};
            --ks-press: ${config.pressColor};
            --ks-alpha: ${config.keyAlpha};
            --ks-opacity: ${config.opacity};
            --ks-scale: ${config.scale};
            --ks-radius: ${config.borderRadius}px;
            --ks-img: ${config.bgUrl ? `url("${config.bgUrl}")` : 'none'};
            --ks-rgb-speed: ${config.rgbSpeed}s;
            --ks-glow-spread: ${config.glowSpread}px;
            --theme-grad: linear-gradient(124deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000);
        }
 
        @keyframes ksRainbowBg { 0% {background-position: 0% 50%;} 50% {background-position: 100% 50%;} 100% {background-position: 0% 50%;} }
 
        /* Overlay Container */
        .keystrokes-container {
            position: fixed; width: 316px; height: 228px; font-family: var(--ks-font);
            user-select: none; z-index: 9998; cursor: grab; transform-origin: top left;
            transform: scale(var(--ks-scale)); opacity: var(--ks-opacity);
            transition: opacity 0.2s, transform 0.2s; color: white; border-radius: 12px;
        }
        .keystrokes-container.dragging { cursor: grabbing; }
 
        .keystrokes-container.bg-container {
            background-image: var(--ks-img); background-size: cover; background-position: center;
        }
 
        /* FPS & Peak CPS Info Bar */
        .ks-info-bar {
            position: absolute; top: -24px; left: 0; width: 100%; text-align: center;
            font-size: 13px; font-weight: 800; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.8);
            pointer-events: none; letter-spacing: 0.5px; z-index: 10;
        }
        .ks-info-bar span { color: #4caf50; }
 
        /* Base Keys */
        .key-element {
            position: absolute; text-align: center; vertical-align: middle; 
            background-color: rgba(var(--ks-idle-rgb), var(--ks-alpha));
            border-radius: var(--ks-radius); 
            transition: background-color 0.05s ease, transform 0.05s ease, border-radius 0.2s ease, box-shadow 0.1s;
            font-weight: 800; pointer-events: none; border: 1px solid rgba(255,255,255,0.05);
            display: flex; align-items: center; justify-content: center; z-index: 1;
        }
        
        .has-text-shadow .ks-text { text-shadow: 2px 2px 4px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; }
 
        .keystrokes-container.bg-keys .key-element {
            background-image: linear-gradient(rgba(var(--ks-idle-rgb), var(--ks-alpha)), rgba(var(--ks-idle-rgb), var(--ks-alpha))), var(--ks-img);
            background-size: auto, 316px 228px; background-position: center, var(--ks-bg-pos);
        }
 
        .key-pressed { background: var(--ks-press) !important; transform: scale(0.90); color: #111; box-shadow: 0 0 15px rgba(255,255,255,0.8); }
 
        /* COMPACT MATHEMATICAL GRID (52px keys, 4px gaps) */
        .wasd { width: 52px; height: 52px; font-size: 20px; }
        .mouse { font-size: 13px; height: 36px; }
        
        #k-up { --ks-bg-pos: -76px -20px; top: 20px; left: 76px; }
        #k-p { --ks-bg-pos: -132px -20px; top: 20px; left: 132px; }
        
        #k-left { --ks-bg-pos: -20px -76px; top: 76px; left: 20px; }
        #k-down { --ks-bg-pos: -76px -76px; top: 76px; left: 76px; }
        #k-right { --ks-bg-pos: -132px -76px; top: 76px; left: 132px; }
        #k-c { --ks-bg-pos: -188px -76px; top: 76px; left: 188px; }
        #k-rshift { --ks-bg-pos: -244px -76px; top: 76px; left: 244px; font-size: 12px; }
        
        #k-lmb { --ks-bg-pos: -20px -132px; top: 132px; left: 20px; width: 136px; }
        #k-rmb { --ks-bg-pos: -160px -132px; top: 132px; left: 160px; width: 136px; }
        
        #k-space { --ks-bg-pos: -20px -172px; top: 172px; left: 20px; width: 276px; height: 36px; font-size: 16px; font-weight: 900; letter-spacing: -2px;}
 
        /* --- THE 10 RGB THEMES ENGINE --- */
        .rgb-bg .key-element { background: var(--theme-grad) !important; background-size: 400% 400% !important; animation: ksRainbowBg var(--ks-rgb-speed) ease infinite !important; color: white; border: none; box-shadow: inset 0px 4px 6px rgba(255,255,255,0.2); }
        .rgb-glow .key-element::after { content: ""; position: absolute; inset: -3px; z-index: -1; background: var(--theme-grad); background-size: 400% 400%; filter: blur(var(--ks-glow-spread)); border-radius: inherit; animation: ksRainbowBg var(--ks-rgb-speed) ease infinite; opacity: 0.95; }
        .rgb-glow .key-pressed::after { filter: blur(calc(var(--ks-glow-spread) + 6px)) brightness(1.3); opacity: 1; }
        .rgb-text .ks-text { background: var(--theme-grad); background-size: 400% 400%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: ksRainbowBg var(--ks-rgb-speed) ease infinite; display: inline-block; }
        .rgb-bg.rgb-text .ks-text { -webkit-text-fill-color: white; background: none; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
 
        /* --- SETTINGS MENU WITH RGB OUTLINE --- */
        .ks-menu-wrapper { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); z-index: 99999; display: none; align-items: center; justify-content: center; font-family: "Inter", sans-serif; }
        .ks-menu-wrapper.active { display: flex; }
        
        .ks-menu-rgb-wrap {
            position: relative; padding: 3px; border-radius: 18px; 
            background: linear-gradient(124deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000);
            background-size: 300% 300%; animation: ksRainbowBg 4s linear infinite; box-shadow: 0 25px 60px rgba(0,0,0,0.6);
        }
 
        .ks-menu { background: rgba(18, 18, 20, 0.95); border-radius: 15px; width: 400px; max-height: 88vh; display: flex; flex-direction: column; color: #eee; overflow: hidden; }
        .ks-header { padding: 20px; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 18px; color: #4caf50; }
        .ks-close-icon { cursor: pointer; color: #888; font-size: 24px; transition: color 0.2s; line-height: 18px; }
        .ks-close-icon:hover { color: #f44336; }
        .ks-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; }
        .ks-body::-webkit-scrollbar { width: 6px; }
        .ks-body::-webkit-scrollbar-thumb { background: #555; border-radius: 10px; }
        .ks-section { display: flex; flex-direction: column; gap: 10px; }
        .ks-section-title { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; }
        .ks-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; background: rgba(0,0,0,0.3); padding: 10px 14px; border-radius: 10px; }
        .ks-row span { font-weight: 600; color: #ddd; }
        
        /* Menu Inputs */
        .ks-row-inputs { display: flex; gap: 6px; }
        .ks-row input[type="text"] { width: 45px; text-align: center; background: #111; color: white; border: 1px solid #444; border-radius: 6px; padding: 6px; font-weight: bold; outline: none; transition: 0.2s; text-transform: uppercase; }
        .ks-row input[type="text"]:focus { border-color: #4caf50; }
        .ks-row input[type="color"] { background: none; border: none; cursor: pointer; height: 32px; width: 44px; padding: 0; border-radius: 6px; }
        .ks-row select { background: #111; color: white; border: 1px solid #444; border-radius: 6px; padding: 8px; font-weight: bold; outline: none; cursor: pointer; width: 140px; }
        .ks-slider-container { display: flex; align-items: center; gap: 10px; }
        input[type="range"] { -webkit-appearance: none; width: 120px; background: transparent; }
        input[type="range"]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; background: #333; border-radius: 10px; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #4caf50; cursor: pointer; margin-top: -5px; box-shadow: 0 0 5px rgba(0,0,0,0.5); }
        .ks-switch { position: relative; display: inline-block; width: 42px; height: 24px; }
        .ks-switch input { opacity: 0; width: 0; height: 0; }
        .ks-toggle-bg { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: .3s; border-radius: 24px; }
        .ks-toggle-bg:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
        .ks-switch input:checked + .ks-toggle-bg { background-color: #4caf50; box-shadow: 0 0 10px rgba(76, 175, 80, 0.5); }
        .ks-switch input:checked + .ks-toggle-bg:before { transform: translateX(18px); }
 
        .ks-footer { padding: 15px 20px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.08); }
        .ks-btn { width: 100%; background: linear-gradient(135deg, #4caf50, #2e7d32); color: white; border: none; padding: 14px; border-radius: 8px; cursor: pointer; font-weight: 800; font-size: 15px; transition: filter 0.2s, transform 0.1s; }
        .ks-btn:hover { filter: brightness(1.2); }
        .ks-btn:active { transform: scale(0.98); }
    `;
 
    // --- HTML TEMPLATES ---
    const overlayHtml = `
        <div class="ks-info-bar" id="ks-info-bar">FPS: <span id="ks-fps">0</span> &nbsp;|&nbsp; PEAK CPS: <span id="ks-peak">0</span></div>
        <canvas id="ks-particles" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; border-radius: inherit;"></canvas>
        <div class="key-element wasd key-up" id="k-up"><span class="ks-text"></span></div>
        <div class="key-element wasd key-p" id="k-p"><span class="ks-text"></span></div>
        <div class="key-element wasd key-left" id="k-left"><span class="ks-text"></span></div>
        <div class="key-element wasd key-down" id="k-down"><span class="ks-text"></span></div>
        <div class="key-element wasd key-right" id="k-right"><span class="ks-text"></span></div>
        <div class="key-element wasd key-c" id="k-c"><span class="ks-text"></span></div>
        <div class="key-element wasd key-rshift" id="k-rshift"><span class="ks-text"></span></div>
        <div class="key-element mouse key-lmb" id="k-lmb"><span class="ks-text">LMB: 0</span></div>
        <div class="key-element mouse key-rmb" id="k-rmb"><span class="ks-text">RMB: 0</span></div>
        <div class="key-element key-space" id="k-space"><span class="ks-text"></span></div>
    `;
 
    const menuHtml = `
        <div class="ks-menu-rgb-wrap">
            <div class="ks-menu">
                <div class="ks-header">
                    <div>KeyStroke Menu</div>
                    <div class="ks-close-icon" id="ks-xBtn">&times;</div>
                </div>
                <div class="ks-body">
                    
                    <div class="ks-section">
                        <div class="ks-section-title">Particle Engine</div>
                        <div class="ks-row"><span>Enable Particles</span> <label class="ks-switch"><input type="checkbox" id="ks-particlesToggle"><span class="ks-toggle-bg"></span></label></div>
                        <div class="ks-row">
                            <span>Particle Style</span>
                            <select id="ks-particleType">
                                <option value="snow">Snow</option>
                                <option value="rain">Rain</option>
                                <option value="stars">Stars</option>
                                <option value="matrix">Matrix</option>
                                <option value="bubbles">Bubbles</option>
                                <option value="fire">Fire</option>
                            </select>
                        </div>
                        <div class="ks-row"><span>Particle Count</span> <div class="ks-slider-container"><input type="range" id="ks-particleCount" min="10" max="150" step="5"></div></div>
                        <div class="ks-row"><span>Particle Speed</span> <div class="ks-slider-container"><input type="range" id="ks-particleSpeed" min="0.1" max="3" step="0.1"></div></div>
                    </div>
 
                    <div class="ks-section">
                        <div class="ks-section-title">Background Images</div>
                        <div class="ks-row" style="flex-direction:column; align-items:flex-start; gap:8px;">
                            <span style="width:100%">Image URL</span>
                            <input type="text" id="ks-bgUrl" placeholder="https://..." style="width:96%; text-align:left; text-transform:none;">
                        </div>
                        <div class="ks-row">
                            <span>Apply Image To</span>
                            <select id="ks-bgMode">
                                <option value="none">Off</option>
                                <option value="keys">Keys (Puzzle Wrap)</option>
                                <option value="container">Entire Container</option>
                            </select>
                        </div>
                    </div>
 
                    <div class="ks-section">
                        <div class="ks-section-title">Advanced Extras</div>
                        <div class="ks-row"><span>Show FPS & Peak CPS</span> <label class="ks-switch"><input type="checkbox" id="ks-showInfo"><span class="ks-toggle-bg"></span></label></div>
                        <div class="ks-row"><span>Heavy Text Shadow</span> <label class="ks-switch"><input type="checkbox" id="ks-textShadow"><span class="ks-toggle-bg"></span></label></div>
                    </div>
 
                    <div class="ks-section">
                        <div class="ks-section-title">The 10 RGB Themes</div>
                        <div class="ks-row" style="background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3);">
                            <span style="color:#4caf50;">Select Theme</span>
                            <select id="ks-rgbTheme">
                                <option value="theme-1">1. Classic Rainbow</option>
                                <option value="theme-2">2. Vaporwave</option>
                                <option value="theme-3">3. Ocean Depth</option>
                                <option value="theme-4">4. Firestorm</option>
                                <option value="theme-5">5. Aurora</option>
                                <option value="theme-6">6. Cyberpunk</option>
                                <option value="theme-7">7. Galactic</option>
                                <option value="theme-8">8. Sunset</option>
                                <option value="theme-9">9. Toxic Slime</option>
                                <option value="theme-10">10. Monochrome</option>
                            </select>
                        </div>
                        <div class="ks-row"><span>Apply To Keys (Background)</span> <label class="ks-switch"><input type="checkbox" id="ks-rgbBg"><span class="ks-toggle-bg"></span></label></div>
                        <div class="ks-row"><span>Apply To Underglow</span> <label class="ks-switch"><input type="checkbox" id="ks-rgbGlow"><span class="ks-toggle-bg"></span></label></div>
                        <div class="ks-row"><span>Apply To Text</span> <label class="ks-switch"><input type="checkbox" id="ks-rgbText"><span class="ks-toggle-bg"></span></label></div>
                        <div class="ks-row"><span>RGB Speed</span> <div class="ks-slider-container"><input type="range" id="ks-rgbSpeed" min="1" max="15" step="0.5" style="direction: rtl;"></div></div>
                        <div class="ks-row"><span>Glow Spread</span> <div class="ks-slider-container"><input type="range" id="ks-glowSpread" min="4" max="30" step="1"></div></div>
                    </div>
 
                    <div class="ks-section">
                        <div class="ks-section-title">Keybinds</div>
                        <div class="ks-row"><span>W & P Key</span> <div class="ks-row-inputs"><input type="text" id="ks-upKey" maxlength="5"> <input type="text" id="ks-pKey" maxlength="5"></div></div>
                        <div class="ks-row"><span>A, S, D</span> <div class="ks-row-inputs"><input type="text" id="ks-leftKey" maxlength="5"> <input type="text" id="ks-downKey" maxlength="5"> <input type="text" id="ks-rightKey" maxlength="5"></div></div>
                        <div class="ks-row"><span>C & R-Shift</span> <div class="ks-row-inputs"><input type="text" id="ks-cKey" maxlength="5"> <input type="text" id="ks-rshiftKey" maxlength="10"></div></div>
                    </div>
                    
                    <div class="ks-section">
                        <div class="ks-section-title">Shape & Colors</div>
                        <div class="ks-row"><span>Key Shape (Roundness)</span> <div class="ks-slider-container"><input type="range" id="ks-shape" min="0" max="26" step="1"></div></div>
                        <div class="ks-row"><span>Key Alpha (Transparency)</span> <div class="ks-slider-container"><input type="range" id="ks-alpha" min="0" max="1" step="0.05"></div></div>
                        <div class="ks-row"><span>Idle Color</span> <input type="color" id="ks-idleColor"></div>
                        <div class="ks-row"><span>Press Color</span> <input type="color" id="ks-pressColor"></div>
                    </div>
                </div>
                <div class="ks-footer">
                    <button class="ks-btn" id="ks-saveBtn">Save & Apply Settings</button>
                </div>
            </div>
        </div>
    `;
 
    // --- 10 THEME COLORS ---
    const themes = {
        'theme-1': 'linear-gradient(124deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)',
        'theme-2': 'linear-gradient(124deg, #ff71ce, #01cdfe, #05ffa1, #b967ff, #ff71ce)',
        'theme-3': 'linear-gradient(124deg, #020024, #00d4ff, #090979, #020024)',
        'theme-4': 'linear-gradient(124deg, #ff0000, #ff5a00, #ff9a00, #ff0000)',
        'theme-5': 'linear-gradient(124deg, #00ff87, #60efff, #0061ff, #00ff87)',
        'theme-6': 'linear-gradient(124deg, #fce043, #ff007f, #00f0ff, #fce043)',
        'theme-7': 'linear-gradient(124deg, #4b0082, #0000ff, #8a2be2, #ff1493, #4b0082)',
        'theme-8': 'linear-gradient(124deg, #ff5e62, #ff9966, #ffb347, #ff5e62)',
        'theme-9': 'linear-gradient(124deg, #39ff14, #ccff00, #00ff00, #39ff14)',
        'theme-10': 'linear-gradient(124deg, #ffffff, #888888, #000000, #888888, #ffffff)'
    };
 
    // --- NEW ADVANCED PARTICLE CLASS ---
    class Particle {
        constructor(w, h, type, speedMult) {
            this.w = w; this.h = h;
            this.type = type;
            this.speedMult = speedMult;
            this.init();
            if(this.type === 'bubbles' || this.type === 'fire') {
                this.y = Math.random() * this.h;
            }
        }
        init() {
            this.x = Math.random() * this.w;
            this.y = (this.type === 'bubbles' || this.type === 'fire') ? this.h + Math.random() * 20 : Math.random() * this.h - this.h;
            this.size = Math.random() * 2 + 0.5;
            if(this.type === 'fire') this.size = Math.random() * 4 + 2;
            
            this.speedY = (Math.random() * 1.5 + 0.5) * this.speedMult;
            if(this.type === 'rain') this.speedY = (Math.random() * 5 + 5) * this.speedMult;
            if(this.type === 'matrix') this.speedY = (Math.random() * 2 + 1.5) * this.speedMult;
            
            this.speedX = (Math.random() - 0.5) * 0.5 * this.speedMult;
            this.opacity = Math.random() * 0.5 + 0.3;
            
            if(this.type === 'fire') {
                this.color =['#ff0000', '#ff5a00', '#ff9a00'][Math.floor(Math.random()*3)];
            } else if(this.type === 'matrix') {
                this.color = '#0f0';
            } else if(this.type === 'bubbles') {
                this.color = 'rgba(255,255,255,0.5)';
            } else if(this.type === 'rain') {
                this.color = 'rgba(150, 200, 255, 0.6)';
            } else {
                this.color = `rgba(255, 255, 255, ${this.opacity})`;
            }
        }
        update() {
            if(this.type === 'bubbles' || this.type === 'fire') {
                this.y -= this.speedY;
                this.x += this.speedX;
                if(this.type === 'fire') {
                    this.size -= 0.05 * this.speedMult;
                    if(this.size <= 0.2) this.init();
                }
                if(this.y < -10) this.init();
            } else {
                this.y += this.speedY;
                this.x += this.speedX;
                if (this.y > this.h) this.init();
            }
            if (this.x > this.w || this.x < 0) this.speedX *= -1;
            
            if(this.type === 'stars') {
                this.opacity += (Math.random() - 0.5) * 0.1;
                if(this.opacity < 0.1) this.opacity = 0.1;
                if(this.opacity > 1) this.opacity = 1;
                this.color = `rgba(255, 255, 255, ${this.opacity})`;
            }
        }
        draw(ctx) {
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.color;
            if(this.type === 'rain') {
                ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + this.speedX, this.y + this.speedY * 2); ctx.stroke();
            } else if(this.type === 'matrix') {
                ctx.font = `${Math.floor(this.size*5)}px monospace`; ctx.fillText(Math.floor(Math.random()*2), this.x, this.y);
            } else if (this.type === 'bubbles') {
                ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
 
    function generateParticles() {
        particlesArray =[];
        for(let i=0; i<config.particleCount; i++) {
            particlesArray.push(new Particle(canvas.width, canvas.height, config.particleType, config.particleSpeed));
        }
    }
 
    function init() {
        const styleSheet = document.createElement("style");
        styleSheet.innerText = css;
        document.head.appendChild(styleSheet);
 
        const container = document.createElement("div");
        container.className = "keystrokes-container";
        container.innerHTML = overlayHtml;
        document.body.appendChild(container);
 
        const menuWrapper = document.createElement("div");
        menuWrapper.className = "ks-menu-wrapper";
        menuWrapper.innerHTML = menuHtml;
        document.body.appendChild(menuWrapper);
 
        Object.assign(keyElements, {
            up: document.getElementById('k-up'), left: document.getElementById('k-left'),
            down: document.getElementById('k-down'), right: document.getElementById('k-right'),
            p: document.getElementById('k-p'), c: document.getElementById('k-c'), rshift: document.getElementById('k-rshift'),
            lmb: document.getElementById('k-lmb'), rmb: document.getElementById('k-rmb'),
            space: document.getElementById('k-space')
        });
 
        // Initialize Particles Engine
        canvas = document.getElementById('ks-particles');
        ctx = canvas.getContext('2d');
        canvas.width = 316; canvas.height = 228;
        generateParticles();
 
        applySettings(container);
        setupEventListeners(container, menuWrapper);
        setupDragging(container);
 
        setInterval(updateCPS, 50);
        requestAnimationFrame(renderLoop);
    }
 
    function applySettings(container) {
        keyElements.up.querySelector('.ks-text').innerText = config.upText;
        keyElements.left.querySelector('.ks-text').innerText = config.leftText;
        keyElements.down.querySelector('.ks-text').innerText = config.downText;
        keyElements.right.querySelector('.ks-text').innerText = config.rightText;
        keyElements.p.querySelector('.ks-text').innerText = config.pText;
        keyElements.c.querySelector('.ks-text').innerText = config.cText;
        keyElements.rshift.querySelector('.ks-text').innerText = config.rshiftText;
        keyElements.space.querySelector('.ks-text').innerText = config.spaceText;
 
        container.style.left = config.posX;
        container.style.top = config.posY;
 
        document.documentElement.style.setProperty('--ks-font', config.fontFamily);
        document.documentElement.style.setProperty('--ks-idle-rgb', hexToRgb(config.idleColor));
        document.documentElement.style.setProperty('--ks-press', config.pressColor);
        document.documentElement.style.setProperty('--ks-alpha', config.keyAlpha);
        document.documentElement.style.setProperty('--ks-scale', config.scale);
        document.documentElement.style.setProperty('--ks-radius', `${config.borderRadius}px`);
        document.documentElement.style.setProperty('--ks-rgb-speed', `${config.rgbSpeed}s`);
        document.documentElement.style.setProperty('--ks-glow-spread', `${config.glowSpread}px`);
        document.documentElement.style.setProperty('--theme-grad', themes[config.rgbTheme] || themes['theme-1']);
        document.documentElement.style.setProperty('--ks-img', config.bgUrl ? `url("${config.bgUrl}")` : 'none');
 
        // Apply Image Modes
        container.classList.remove('bg-keys', 'bg-container');
        if(config.bgMode === 'keys') container.classList.add('bg-keys');
        else if(config.bgMode === 'container') container.classList.add('bg-container');
 
        // Apply Toggles
        container.classList.toggle('rgb-text', config.rgbText);
        container.classList.toggle('rgb-bg', config.rgbBackground);
        container.classList.toggle('rgb-glow', config.rgbGlow);
        container.classList.toggle('has-text-shadow', config.textShadow);
        document.getElementById('ks-info-bar').style.display = config.showInfo ? 'block' : 'none';
 
        // Populate Menu
        document.getElementById('ks-upKey').value = config.upKey;
        document.getElementById('ks-leftKey').value = config.leftKey;
        document.getElementById('ks-downKey').value = config.downKey;
        document.getElementById('ks-rightKey').value = config.rightKey;
        document.getElementById('ks-pKey').value = config.pKey;
        document.getElementById('ks-cKey').value = config.cKey;
        document.getElementById('ks-rshiftKey').value = config.rshiftKey;
        
        document.getElementById('ks-bgUrl').value = config.bgUrl;
        document.getElementById('ks-bgMode').value = config.bgMode;
        
        document.getElementById('ks-rgbTheme').value = config.rgbTheme;
        document.getElementById('ks-shape').value = config.borderRadius;
        document.getElementById('ks-idleColor').value = config.idleColor;
        document.getElementById('ks-pressColor').value = config.pressColor;
        document.getElementById('ks-alpha').value = config.keyAlpha;
        document.getElementById('ks-rgbSpeed').value = config.rgbSpeed;
        document.getElementById('ks-glowSpread').value = config.glowSpread;
 
        document.getElementById('ks-rgbText').checked = config.rgbText;
        document.getElementById('ks-rgbBg').checked = config.rgbBackground;
        document.getElementById('ks-rgbGlow').checked = config.rgbGlow;
        document.getElementById('ks-textShadow').checked = config.textShadow;
        document.getElementById('ks-showInfo').checked = config.showInfo;
        
        document.getElementById('ks-particlesToggle').checked = config.particles;
        document.getElementById('ks-particleType').value = config.particleType;
        document.getElementById('ks-particleCount').value = config.particleCount;
        document.getElementById('ks-particleSpeed').value = config.particleSpeed;
    }
 
    function setupEventListeners(container, menuWrapper) {
        const getKeyMap = () => ({[config.upKey.toLowerCase()]: 'up',[config.leftKey.toLowerCase()]: 'left',[config.downKey.toLowerCase()]: 'down',[config.rightKey.toLowerCase()]: 'right',[config.spaceKey.toLowerCase()]: 'space',[config.pKey.toLowerCase()]: 'p',[config.cKey.toLowerCase()]: 'c',[config.rshiftKey.toLowerCase()]: 'rshift'
        });
 
        window.addEventListener("keydown", e => {
            if (document.activeElement.tagName === "INPUT" && document.activeElement.type === "text") return;
            if (e.key === '\\') { isMenuOpen = !isMenuOpen; menuWrapper.classList.toggle('active', isMenuOpen); return; }
 
            const map = getKeyMap();
            const keyName = map[e.key.toLowerCase()] || map[e.code.toLowerCase()];
            if (keyName) keyElements[keyName].classList.add("key-pressed");
        });
 
        window.addEventListener("keyup", e => {
            const map = getKeyMap();
            const keyName = map[e.key.toLowerCase()] || map[e.code.toLowerCase()];
            if (keyName) keyElements[keyName].classList.remove("key-pressed");
        });
 
        window.addEventListener("mousedown", e => {
            if (e.button === 0) { lmbClicks.push(Date.now()); keyElements.lmb.classList.add("key-pressed"); } 
            else if (e.button === 2) { rmbClicks.push(Date.now()); keyElements.rmb.classList.add("key-pressed"); }
        });
 
        window.addEventListener("mouseup", e => {
            if (e.button === 0) keyElements.lmb.classList.remove("key-pressed");
            else if (e.button === 2) keyElements.rmb.classList.remove("key-pressed");
        });
 
        // Live Real-Time Previews (CSS)
        document.getElementById('ks-rgbTheme').addEventListener('change', e => document.documentElement.style.setProperty('--theme-grad', themes[e.target.value]));
        document.getElementById('ks-shape').addEventListener('input', e => document.documentElement.style.setProperty('--ks-radius', `${e.target.value}px`));
        document.getElementById('ks-alpha').addEventListener('input', e => document.documentElement.style.setProperty('--ks-alpha', e.target.value));
        document.getElementById('ks-idleColor').addEventListener('input', e => document.documentElement.style.setProperty('--ks-idle-rgb', hexToRgb(e.target.value)));
        document.getElementById('ks-pressColor').addEventListener('input', e => document.documentElement.style.setProperty('--ks-press', e.target.value));
        document.getElementById('ks-rgbSpeed').addEventListener('input', e => document.documentElement.style.setProperty('--ks-rgb-speed', `${e.target.value}s`));
        document.getElementById('ks-glowSpread').addEventListener('input', e => document.documentElement.style.setProperty('--ks-glow-spread', `${e.target.value}px`));
        
        // Live Real-Time Previews (Particles)
        document.getElementById('ks-particlesToggle').addEventListener('change', e => { config.particles = e.target.checked; });
        document.getElementById('ks-particleType').addEventListener('change', e => { config.particleType = e.target.value; generateParticles(); });
        document.getElementById('ks-particleCount').addEventListener('input', e => { config.particleCount = parseInt(e.target.value); generateParticles(); });
        document.getElementById('ks-particleSpeed').addEventListener('input', e => { config.particleSpeed = parseFloat(e.target.value); generateParticles(); });
 
        // Save
        document.getElementById('ks-saveBtn').addEventListener('click', () => {
            config.upKey = document.getElementById('ks-upKey').value || 'w';
            config.leftKey = document.getElementById('ks-leftKey').value || 'a';
            config.downKey = document.getElementById('ks-downKey').value || 's';
            config.rightKey = document.getElementById('ks-rightKey').value || 'd';
            config.pKey = document.getElementById('ks-pKey').value || 'p';
            config.cKey = document.getElementById('ks-cKey').value || 'c';
            config.rshiftKey = document.getElementById('ks-rshiftKey').value || 'Shift';
            
            config.upText = config.upKey.length === 1 ? config.upKey.toUpperCase() : config.upKey;
            config.leftText = config.leftKey.length === 1 ? config.leftKey.toUpperCase() : config.leftKey;
            config.downText = config.downKey.length === 1 ? config.downKey.toUpperCase() : config.downKey;
            config.rightText = config.rightKey.length === 1 ? config.rightKey.toUpperCase() : config.rightKey;
            config.pText = config.pKey.length === 1 ? config.pKey.toUpperCase() : config.pKey;
            config.cText = config.cKey.length === 1 ? config.cKey.toUpperCase() : config.cKey;
            config.rshiftText = "R-SH";
 
            config.bgUrl = document.getElementById('ks-bgUrl').value.trim();
            config.bgMode = document.getElementById('ks-bgMode').value;
 
            config.rgbTheme = document.getElementById('ks-rgbTheme').value;
            config.borderRadius = parseInt(document.getElementById('ks-shape').value);
            config.idleColor = document.getElementById('ks-idleColor').value;
            config.pressColor = document.getElementById('ks-pressColor').value;
            config.keyAlpha = parseFloat(document.getElementById('ks-alpha').value);
            config.rgbSpeed = parseFloat(document.getElementById('ks-rgbSpeed').value);
            config.glowSpread = parseInt(document.getElementById('ks-glowSpread').value);
 
            config.rgbText = document.getElementById('ks-rgbText').checked;
            config.rgbBackground = document.getElementById('ks-rgbBg').checked;
            config.rgbGlow = document.getElementById('ks-rgbGlow').checked;
            config.textShadow = document.getElementById('ks-textShadow').checked;
            config.showInfo = document.getElementById('ks-showInfo').checked;
 
            localStorage.setItem('keystrokes_config_v8', JSON.stringify(config));
            applySettings(container);
            
            isMenuOpen = false;
            menuWrapper.classList.remove('active');
        });
 
        const closeMenu = () => { isMenuOpen = false; menuWrapper.classList.remove('active'); applySettings(container); };
        document.getElementById('ks-xBtn').addEventListener('click', closeMenu);
        menuWrapper.addEventListener('click', e => { if(e.target === menuWrapper) closeMenu(); });
    }
 
    function updateCPS() {
        const now = Date.now();
        lmbClicks = lmbClicks.filter(t => now - t < 1000);
        rmbClicks = rmbClicks.filter(t => now - t < 1000);
        
        const currentLeft = lmbClicks.length;
        keyElements.lmb.querySelector('.ks-text').textContent = `LMB: ${currentLeft}`;
        keyElements.rmb.querySelector('.ks-text').textContent = `RMB: ${rmbClicks.length}`;
        
        if (currentLeft > maxCps) {
            maxCps = currentLeft;
            document.getElementById('ks-peak').textContent = maxCps;
        }
    }
    
    // Unified graphics loop
    function renderLoop() {
        frames++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
            document.getElementById('ks-fps').textContent = frames;
            frames = 0;
            lastTime = now;
        }
 
        if (config.particles && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for(let i=0; i<particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw(ctx);
            }
        } else if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
 
        requestAnimationFrame(renderLoop);
    }
 
    function setupDragging(element) {
        let isDragging = false, startX, startY, initLeft, initTop;
 
        const move = e => {
            if (!isDragging) return;
            element.style.left = `${initLeft + (e.clientX - startX)}px`;
            element.style.top = `${initTop + (e.clientY - startY)}px`;
        };
        const stop = () => {
            if (!isDragging) return;
            isDragging = false;
            element.classList.remove('dragging');
            config.posX = element.style.left;
            config.posY = element.style.top;
            localStorage.setItem('keystrokes_config_v8', JSON.stringify(config));
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', stop);
        };
 
        element.addEventListener('mousedown', e => {
            if (e.button !== 0 || isMenuOpen) return;
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            initLeft = element.offsetLeft; initTop = element.offsetTop;
            element.classList.add('dragging');
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', stop);
        });
    }
 
    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);
})();
