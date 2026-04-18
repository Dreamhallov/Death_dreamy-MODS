// ==UserScript==
// @name         Death_dreamy Advanced HUD Pro
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Professional Advanced HUD for Minefun.io with Smart Inventory Detection, RGB Customization, Multiple Fonts & More - Made by Death_dreamy
// @author       Death_dreamy
// @match        *://minefun.io/*
// @match        *://*.minefun.io/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Configuration defaults
    const defaultConfig = {
        position: { x: 20, y: 20 },
        font: 'Cyberpunk',
        primaryColor: '#00ffff',
        secondaryColor: '#ff00ff',
        glowIntensity: 15,
        opacity: 0.9,
        scale: 1,
        showFPS: true,
        showCoords: true,
        showRotation: true,
        showPing: true,
        showTime: true,
        showTPS: true,
        autoHideInventory: true,
        backgroundColor: '#050505'
    };

    // Load saved config or use defaults
    let config = GM_getValue('hudConfig') || defaultConfig;

    // Font options
    const fonts = {
        'Cyberpunk': "'Orbitron', 'Segoe UI', sans-serif",
        'Retro': "'Press Start 2P', 'Courier New', monospace",
        'Clean': "'Roboto', 'Arial', sans-serif",
        'Gaming': "'Rajdhani', 'Segoe UI', sans-serif",
        'Minimal': "'Inter', 'Helvetica', sans-serif"
    };

    // Create HUD container
    const hudContainer = document.createElement('div');
    hudContainer.id = 'death-dreamy-hud-pro';
    hudContainer.innerHTML = `
        <div class="hud-header" id="hudHeader">
            <span class="hud-title">
                <span class="rgb-text">DEATH_DREAMY</span>
                <span class="hud-version">v2.0</span>
            </span>
            <div class="hud-controls">
                <button class="hud-btn hud-settings-btn" id="settingsBtn" title="Settings">⚙</button>
                <button class="hud-btn hud-minimize-btn" id="minimizeBtn" title="Minimize">−</button>
            </div>
        </div>
        <div class="hud-content" id="hudContent">
            <div class="hud-stat-row" id="statFPS" style="display: none;">
                <span class="stat-icon">📊</span>
                <span class="stat-label">FPS:</span>
                <span class="stat-value" id="fpsValue">0</span>
            </div>
            <div class="hud-stat-row" id="statCoords" style="display: none;">
                <span class="stat-icon">📍</span>
                <span class="stat-label">POS:</span>
                <span class="stat-value" id="coordsValue">0, 0, 0</span>
            </div>
            <div class="hud-stat-row" id="statRotation" style="display: none;">
                <span class="stat-icon">🧭</span>
                <span class="stat-label">ROT:</span>
                <span class="stat-value" id="rotationValue">0°</span>
            </div>
            <div class="hud-stat-row" id="statPing" style="display: none;">
                <span class="stat-icon">📶</span>
                <span class="stat-label">PING:</span>
                <span class="stat-value" id="pingValue">0ms</span>
            </div>
            <div class="hud-stat-row" id="statTPS" style="display: none;">
                <span class="stat-icon">⚡</span>
                <span class="stat-label">TPS:</span>
                <span class="stat-value" id="tpsValue">0</span>
            </div>
            <div class="hud-stat-row" id="statTime" style="display: none;">
                <span class="stat-icon">🕐</span>
                <span class="stat-label">TIME:</span>
                <span class="stat-value" id="timeValue">00:00:00</span>
            </div>
        </div>
        <div class="hud-inventory-notice" id="inventoryNotice" style="display: none;">
            📦 Inventory Open
        </div>
    `;

    // Create Settings Panel
    const settingsPanel = document.createElement('div');
    settingsPanel.id = 'death-dreamy-hud-settings';
    settingsPanel.className = 'hidden';
    settingsPanel.innerHTML = `
        <div class="settings-header">
            <h3>⚙️ HUD Settings</h3>
            <button class="close-btn" id="closeSettings">×</button>
        </div>
        <div class="settings-content">
            <div class="setting-group">
                <h4>🎨 Appearance</h4>
                <div class="setting-item">
                    <label>Font Style:</label>
                    <select id="fontSelect">
                        <option value="Cyberpunk" ${config.font === 'Cyberpunk' ? 'selected' : ''}>Cyberpunk</option>
                        <option value="Retro" ${config.font === 'Retro' ? 'selected' : ''}>Retro</option>
                        <option value="Clean" ${config.font === 'Clean' ? 'selected' : ''}>Clean</option>
                        <option value="Gaming" ${config.font === 'Gaming' ? 'selected' : ''}>Gaming</option>
                        <option value="Minimal" ${config.font === 'Minimal' ? 'selected' : ''}>Minimal</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>Primary Color:</label>
                    <input type="color" id="primaryColor" value="${config.primaryColor}">
                </div>
                <div class="setting-item">
                    <label>Secondary Color:</label>
                    <input type="color" id="secondaryColor" value="${config.secondaryColor}">
                </div>
                <div class="setting-item">
                    <label>Glow Intensity:</label>
                    <input type="range" id="glowIntensity" min="0" max="30" value="${config.glowIntensity}">
                    <span id="glowValue">${config.glowIntensity}</span>
                </div>
                <div class="setting-item">
                    <label>Opacity:</label>
                    <input type="range" id="opacity" min="0.3" max="1" step="0.1" value="${config.opacity}">
                    <span id="opacityValue">${config.opacity}</span>
                </div>
                <div class="setting-item">
                    <label>Scale:</label>
                    <input type="range" id="scale" min="0.5" max="2" step="0.1" value="${config.scale}">
                    <span id="scaleValue">${config.scale}</span>
                </div>
            </div>
            <div class="setting-group">
                <h4>📊 Display Options</h4>
                <div class="setting-item checkbox">
                    <input type="checkbox" id="showFPS" ${config.showFPS ? 'checked' : ''}>
                    <label for="showFPS">Show FPS</label>
                </div>
                <div class="setting-item checkbox">
                    <input type="checkbox" id="showCoords" ${config.showCoords ? 'checked' : ''}>
                    <label for="showCoords">Show Coordinates</label>
                </div>
                <div class="setting-item checkbox">
                    <input type="checkbox" id="showRotation" ${config.showRotation ? 'checked' : ''}>
                    <label for="showRotation">Show Rotation</label>
                </div>
                <div class="setting-item checkbox">
                    <input type="checkbox" id="showPing" ${config.showPing ? 'checked' : ''}>
                    <label for="showPing">Show Ping</label>
                </div>
                <div class="setting-item checkbox">
                    <input type="checkbox" id="showTPS" ${config.showTPS ? 'checked' : ''}>
                    <label for="showTPS">Show TPS</label>
                </div>
                <div class="setting-item checkbox">
                    <input type="checkbox" id="showTime" ${config.showTime ? 'checked' : ''}>
                    <label for="showTime">Show Time</label>
                </div>
                <div class="setting-item checkbox">
                    <input type="checkbox" id="autoHideInventory" ${config.autoHideInventory ? 'checked' : ''}>
                    <label for="autoHideInventory">Auto-Hide on Inventory</label>
                </div>
            </div>
            <div class="setting-group">
                <h4>⌨️ Controls</h4>
                <p class="setting-note">Press INSERT or F1 to toggle settings</p>
                <p class="setting-note">Drag header to move HUD</p>
            </div>
            <div class="setting-footer">
                <button class="reset-btn" id="resetConfig">🔄 Reset to Default</button>
                <button class="save-btn" id="saveConfig">💾 Save & Close</button>
            </div>
        </div>
        <div class="branding">Made by Death_dreamy 💜</div>
    `;

    // Add external fonts
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Press+Start+2P&family=Rajdhani:wght@400;600;700&family=Inter:wght@400;600&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // Add styles
    const hudStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Press+Start+2P&family=Rajdhani:wght@400;600;700&family=Inter:wght@400;600&display=swap');

        #death-dreamy-hud-pro {
            position: fixed;
            left: ${config.position.x}px;
            top: ${config.position.y}px;
            background: ${config.backgroundColor};
            border: 2px solid ${config.primaryColor};
            border-radius: 8px;
            padding: 12px;
            font-family: ${fonts[config.font]};
            color: #e0e0e0;
            z-index: 999999;
            min-width: 220px;
            box-shadow: 0 0 ${config.glowIntensity}px ${config.primaryColor}40, 
                        0 0 ${config.glowIntensity * 2}px ${config.secondaryColor}20;
            opacity: ${config.opacity};
            transform: scale(${config.scale});
            transform-origin: top left;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            background: linear-gradient(135deg, ${config.backgroundColor}ee, ${config.backgroundColor}cc);
        }

        #death-dreamy-hud-pro.dragging {
            opacity: 0.7;
            cursor: grabbing;
        }

        .hud-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid ${config.secondaryColor};
            cursor: grab;
            user-select: none;
        }

        .hud-header:active {
            cursor: grabbing;
        }

        .hud-title {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .rgb-text {
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
            background: linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor}, ${config.primaryColor});
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: rgbFlow 3s linear infinite;
            text-shadow: 0 0 ${config.glowIntensity}px ${config.primaryColor}80;
        }

        @keyframes rgbFlow {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
        }

        .hud-version {
            font-size: 10px;
            color: ${config.secondaryColor};
            opacity: 0.8;
            letter-spacing: 1px;
        }

        .hud-controls {
            display: flex;
            gap: 5px;
        }

        .hud-btn {
            background: transparent;
            border: 1px solid ${config.secondaryColor};
            color: ${config.secondaryColor};
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
            transition: all 0.3s;
            font-family: inherit;
        }

        .hud-btn:hover {
            background: ${config.secondaryColor};
            color: #000;
            box-shadow: 0 0 15px ${config.secondaryColor};
            transform: scale(1.1);
        }

        .hud-content {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .hud-stat-row {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            padding: 4px 6px;
            border-radius: 4px;
            background: ${config.primaryColor}10;
            border-left: 3px solid ${config.primaryColor};
            transition: all 0.3s;
        }

        .hud-stat-row:hover {
            background: ${config.primaryColor}20;
            transform: translateX(3px);
        }

        .stat-icon {
            font-size: 14px;
        }

        .stat-label {
            color: ${config.primaryColor};
            font-weight: bold;
            text-shadow: 0 0 8px ${config.primaryColor}60;
            min-width: 50px;
        }

        .stat-value {
            color: #fff;
            font-family: 'Courier New', monospace;
            font-weight: 600;
            margin-left: auto;
        }

        .hud-inventory-notice {
            margin-top: 8px;
            padding: 6px;
            background: ${config.secondaryColor}30;
            border: 1px dashed ${config.secondaryColor};
            border-radius: 4px;
            text-align: center;
            font-size: 12px;
            color: ${config.secondaryColor};
            animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }

        #death-dreamy-hud-pro.minimized .hud-content,
        #death-dreamy-hud-pro.minimized .hud-inventory-notice {
            display: none;
        }

        /* Settings Panel */
        #death-dreamy-hud-settings {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #0a0a0a, #1a1a2e);
            border: 2px solid ${config.primaryColor};
            border-radius: 12px;
            padding: 20px;
            z-index: 1000000;
            min-width: 350px;
            max-width: 450px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 0 40px ${config.primaryColor}60, 
                        0 0 80px ${config.secondaryColor}40;
            font-family: ${fonts[config.font]};
        }

        #death-dreamy-hud-settings.hidden {
            display: none;
        }

        .settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid ${config.secondaryColor};
        }

        .settings-header h3 {
            color: ${config.primaryColor};
            margin: 0;
            font-size: 18px;
            text-shadow: 0 0 10px ${config.primaryColor};
        }

        .close-btn {
            background: transparent;
            border: 2px solid #ff4444;
            color: #ff4444;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            transition: all 0.3s;
        }

        .close-btn:hover {
            background: #ff4444;
            color: #fff;
            box-shadow: 0 0 15px #ff4444;
            transform: rotate(90deg);
        }

        .settings-content {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .setting-group h4 {
            color: ${config.secondaryColor};
            margin: 0 0 10px 0;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding: 8px;
            background: ${config.primaryColor}10;
            border-radius: 6px;
            border-left: 3px solid ${config.primaryColor};
        }

        .setting-item label {
            color: #e0e0e0;
            font-size: 13px;
        }

        .setting-item select,
        .setting-item input[type="color"] {
            background: #1a1a2e;
            border: 1px solid ${config.primaryColor};
            color: #fff;
            padding: 5px;
            border-radius: 4px;
            font-family: inherit;
            cursor: pointer;
        }

        .setting-item input[type="color"] {
            width: 50px;
            height: 30px;
            padding: 2px;
        }

        .setting-item input[type="range"] {
            width: 120px;
            accent-color: ${config.primaryColor};
        }

        .setting-item.checkbox {
            background: transparent;
            border-left: none;
            padding: 5px 8px;
        }

        .setting-item.checkbox input[type="checkbox"] {
            accent-color: ${config.primaryColor};
            width: 16px;
            height: 16px;
            cursor: pointer;
        }

        .setting-note {
            color: #888;
            font-size: 12px;
            margin: 5px 0;
            font-style: italic;
        }

        .setting-footer {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid ${config.secondaryColor};
        }

        .reset-btn,
        .save-btn {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-family: inherit;
            font-weight: bold;
            transition: all 0.3s;
        }

        .reset-btn {
            background: #333;
            color: #fff;
        }

        .reset-btn:hover {
            background: #555;
            transform: scale(1.05);
        }

        .save-btn {
            background: linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor});
            color: #000;
        }

        .save-btn:hover {
            box-shadow: 0 0 20px ${config.primaryColor};
            transform: scale(1.05);
        }

        .branding {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid ${config.secondaryColor};
            color: ${config.secondaryColor};
            font-size: 12px;
            letter-spacing: 1px;
        }

        /* Scrollbar */
        #death-dreamy-hud-settings::-webkit-scrollbar {
            width: 8px;
        }

        #death-dreamy-hud-settings::-webkit-scrollbar-track {
            background: #0a0a0a;
            border-radius: 4px;
        }

        #death-dreamy-hud-settings::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, ${config.primaryColor}, ${config.secondaryColor});
            border-radius: 4px;
        }

        #death-dreamy-hud-settings::-webkit-scrollbar-thumb:hover {
            box-shadow: 0 0 10px ${config.primaryColor};
        }
    `;

    GM_addStyle(hudStyles);
    document.body.appendChild(hudContainer);
    document.body.appendChild(settingsPanel);

    // State management
    let isMinimized = false;
    let isSettingsOpen = false;
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fps = 0;
    let ping = 0;
    let tps = 0;
    let isInventoryOpen = false;

    // Apply initial visibility
    function applyVisibility() {
        document.getElementById('statFPS').style.display = config.showFPS ? 'flex' : 'none';
        document.getElementById('statCoords').style.display = config.showCoords ? 'flex' : 'none';
        document.getElementById('statRotation').style.display = config.showRotation ? 'flex' : 'none';
        document.getElementById('statPing').style.display = config.showPing ? 'flex' : 'none';
        document.getElementById('statTPS').style.display = config.showTPS ? 'flex' : 'none';
        document.getElementById('statTime').style.display = config.showTime ? 'flex' : 'none';
    }

    applyVisibility();

    // Update HUD appearance based on config
    function updateHUDAppearance() {
        const hud = document.getElementById('death-dreamy-hud-pro');
        hud.style.borderColor = config.primaryColor;
        hud.style.boxShadow = `0 0 ${config.glowIntensity}px ${config.primaryColor}40, 0 0 ${config.glowIntensity * 2}px ${config.secondaryColor}20`;
        hud.style.opacity = config.opacity;
        hud.style.transform = `scale(${config.scale})`;
        hud.style.fontFamily = fonts[config.font];
    }

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    settingsBtn.addEventListener('click', () => {
        isSettingsOpen = !isSettingsOpen;
        settingsPanel.classList.toggle('hidden', !isSettingsOpen);
    });

    // Close settings
    document.getElementById('closeSettings').addEventListener('click', () => {
        isSettingsOpen = false;
        settingsPanel.classList.add('hidden');
    });

    // Save configuration
    document.getElementById('saveConfig').addEventListener('click', () => {
        config.font = document.getElementById('fontSelect').value;
        config.primaryColor = document.getElementById('primaryColor').value;
        config.secondaryColor = document.getElementById('secondaryColor').value;
        config.glowIntensity = parseInt(document.getElementById('glowIntensity').value);
        config.opacity = parseFloat(document.getElementById('opacity').value);
        config.scale = parseFloat(document.getElementById('scale').value);
        config.showFPS = document.getElementById('showFPS').checked;
        config.showCoords = document.getElementById('showCoords').checked;
        config.showRotation = document.getElementById('showRotation').checked;
        config.showPing = document.getElementById('showPing').checked;
        config.showTPS = document.getElementById('showTPS').checked;
        config.showTime = document.getElementById('showTime').checked;
        config.autoHideInventory = document.getElementById('autoHideInventory').checked;

        GM_setValue('hudConfig', config);
        updateHUDAppearance();
        applyVisibility();
        
        isSettingsOpen = false;
        settingsPanel.classList.add('hidden');
    });

    // Reset configuration
    document.getElementById('resetConfig').addEventListener('click', () => {
        config = { ...defaultConfig };
        GM_setValue('hudConfig', config);
        
        // Reload page to apply defaults
        location.reload();
    });

    // Update slider displays
    ['glowIntensity', 'opacity', 'scale'].forEach(id => {
        const slider = document.getElementById(id);
        const display = document.getElementById(id.replace('Intensity', '').replace('acity', 'Value').replace('scale', 'scaleValue'));
        if (slider && display) {
            slider.addEventListener('input', () => {
                display.textContent = slider.value;
            });
        }
    });

    // Minimize button
    const minimizeBtn = document.getElementById('minimizeBtn');
    minimizeBtn.addEventListener('click', () => {
        isMinimized = !isMinimized;
        hudContainer.classList.toggle('minimized', isMinimized);
        minimizeBtn.textContent = isMinimized ? '+' : '−';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Insert' || e.key === 'F1') {
            e.preventDefault();
            isSettingsOpen = !isSettingsOpen;
            settingsPanel.classList.toggle('hidden', !isSettingsOpen);
        }
    });

    // Draggable functionality
    let isDragging = false;
    let dragOffsetX, dragOffsetY;
    const header = document.getElementById('hudHeader');

    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.hud-btn')) return;
        isDragging = true;
        dragOffsetX = e.clientX - hudContainer.offsetLeft;
        dragOffsetY = e.clientY - hudContainer.offsetTop;
        hudContainer.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const newX = e.clientX - dragOffsetX;
        const newY = e.clientY - dragOffsetY;
        
        // Boundary checking
        const maxX = window.innerWidth - hudContainer.offsetWidth;
        const maxY = window.innerHeight - hudContainer.offsetHeight;
        
        hudContainer.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
        hudContainer.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
        hudContainer.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            hudContainer.classList.remove('dragging');
            
            // Save position
            config.position.x = hudContainer.offsetLeft;
            config.position.y = hudContainer.offsetTop;
            GM_setValue('hudConfig', config);
        }
    });

    // FPS Counter
    function updateFPS() {
        const currentTime = performance.now();
        frameCount++;

        if (currentTime - lastFrameTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFrameTime = currentTime;
            document.getElementById('fpsValue').textContent = fps;
        }

        requestAnimationFrame(updateFPS);
    }

    // Time display
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });
        document.getElementById('timeValue').textContent = timeString;
    }

    // Simulate coordinates (you can replace with actual game data)
    function updateCoordinates() {
        // This would normally hook into the game's player position
        // For demo purposes, showing placeholder
        if (config.showCoords) {
            // In a real implementation, you'd get this from the game
            // document.getElementById('coordsValue').textContent = `${x}, ${y}, ${z}`;
        }
    }

    // Simulate rotation
    function updateRotation() {
        // This would normally hook into the game's player rotation
        if (config.showRotation) {
            // document.getElementById('rotationValue').textContent = `${rotation}°`;
        }
    }

    // Simulate ping
    function updatePing() {
        // Simulate ping calculation
        const start = performance.now();
        const img = new Image();
        img.onload = () => {
            ping = Math.round(performance.now() - start);
            document.getElementById('pingValue').textContent = `${ping}ms`;
        };
        img.onerror = () => {
            ping = Math.round(performance.now() - start);
            document.getElementById('pingValue').textContent = `${ping}ms`;
        };
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7&t=' + Date.now();
    }

    // Simulate TPS
    function updateTPS() {
        // Simulate server TPS (usually 20 for Minecraft-based games)
        tps = 20;
        document.getElementById('tpsValue').textContent = tps;
    }

    // Inventory detection (simulate)
    function checkInventory() {
        // This would detect actual inventory open/close in the game
        // For now, just a placeholder
        const wasInventoryOpen = isInventoryOpen;
        
        // Detect common inventory selectors in games
        const inventorySelectors = [
            '.inventory', '.inventory-screen', '.player-inventory',
            '[class*="inventory"]', '[id*="inventory"]'
        ];
        
        isInventoryOpen = inventorySelectors.some(selector => 
            document.querySelector(selector) !== null
        );

        if (isInventoryOpen !== wasInventoryOpen) {
            const notice = document.getElementById('inventoryNotice');
            const content = document.getElementById('hudContent');
            
            if (isInventoryOpen) {
                notice.style.display = 'block';
                if (config.autoHideInventory) {
                    content.style.opacity = '0.3';
                }
            } else {
                notice.style.display = 'none';
                if (config.autoHideInventory) {
                    content.style.opacity = '1';
                }
            }
        }
    }

    // Start updates
    updateFPS();
    setInterval(updateTime, 1000);
    setInterval(updatePing, 5000);
    setInterval(updateTPS, 2000);
    setInterval(checkInventory, 500);

    // Initial load message
    console.log('%c[Death_dreamy HUD Pro v2.0] Loaded successfully!', 
        'color: #00ffff; font-size: 14px; font-weight: bold; text-shadow: 0 0 10px #00ffff;');
    console.log('%cPress INSERT or F1 to open settings', 
        'color: #ff00ff; font-size: 12px;');
    console.log('%cMade with 💜 by Death_dreamy', 
        'color: #ff00ff; font-size: 12px; font-style: italic;');
})();
