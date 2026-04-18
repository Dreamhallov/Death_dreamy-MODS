// ==UserScript==
// @name         Death_dreamy HUD Mod
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A customizable HUD overlay for displaying game stats and information
// @author       Death_dreamy
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Create HUD container
    const hudContainer = document.createElement('div');
    hudContainer.id = 'death-dreamy-hud';
    hudContainer.innerHTML = `
        <div class="hud-header">
            <span class="hud-title">HUD</span>
            <button class="hud-toggle" id="hudToggleBtn">−</button>
        </div>
        <div class="hud-content" id="hudContent">
            <div class="hud-stat">
                <span class="stat-label">FPS:</span>
                <span class="stat-value" id="fpsValue">0</span>
            </div>
            <div class="hud-stat">
                <span class="stat-label">Time:</span>
                <span class="stat-value" id="timeValue">00:00:00</span>
            </div>
            <div class="hud-stat">
                <span class="stat-label">Mouse:</span>
                <span class="stat-value" id="mouseValue">0, 0</span>
            </div>
            <div class="hud-stat">
                <span class="stat-label">Keys:</span>
                <span class="stat-value" id="keysValue">-</span>
            </div>
        </div>
        <div class="hud-settings" id="hudSettings">
            <label>
                <input type="checkbox" id="showFPS" checked> Show FPS
            </label>
            <label>
                <input type="checkbox" id="showTime" checked> Show Time
            </label>
            <label>
                <input type="checkbox" id="showMouse" checked> Show Mouse
            </label>
            <label>
                <input type="checkbox" id="showKeys" checked> Show Keys
            </label>
        </div>
    `;

    // Add styles
    const hudStyles = `
        #death-dreamy-hud {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(5, 5, 5, 0.85);
            border: 2px solid #00ffff;
            border-radius: 5px;
            padding: 15px;
            font-family: 'Segoe UI', sans-serif;
            color: #e0e0e0;
            z-index: 999999;
            min-width: 200px;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
            transition: all 0.3s ease;
        }

        .hud-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            border-bottom: 1px solid #ff00ff;
            padding-bottom: 8px;
        }

        .hud-title {
            font-weight: bold;
            color: #00ffff;
            text-shadow: 0 0 10px #00ffff;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .hud-toggle {
            background: transparent;
            border: 1px solid #ff00ff;
            color: #ff00ff;
            cursor: pointer;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 16px;
            transition: all 0.3s;
        }

        .hud-toggle:hover {
            background: #ff00ff;
            color: #000;
            box-shadow: 0 0 10px #ff00ff;
        }

        .hud-content {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .hud-stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
        }

        .stat-label {
            color: #00ffff;
            font-weight: bold;
            text-shadow: 0 0 5px #00ffff;
        }

        .stat-value {
            color: #fff;
            font-family: 'Courier New', monospace;
        }

        .hud-settings {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #00ffff;
            display: none;
            flex-direction: column;
            gap: 5px;
        }

        .hud-settings label {
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .hud-settings input[type="checkbox"] {
            accent-color: #00ffff;
        }

        #death-dreamy-hud.minimized .hud-content,
        #death-dreamy-hud.minimized .hud-settings {
            display: none;
        }

        #death-dreamy-hud.show-settings .hud-settings {
            display: flex;
        }
    `;

    GM_addStyle(hudStyles);
    document.documentElement.appendChild(hudContainer);

    // State management
    let isMinimized = false;
    let showSettings = false;
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fps = 0;
    let activeKeys = [];

    // Toggle buttons
    const toggleBtn = document.getElementById('hudToggleBtn');
    toggleBtn.addEventListener('click', () => {
        if (!showSettings) {
            isMinimized = !isMinimized;
            hudContainer.classList.toggle('minimized', isMinimized);
            toggleBtn.textContent = isMinimized ? '+' : '−';
        } else {
            showSettings = false;
            hudContainer.classList.remove('show-settings');
        }
    });

    // Right-click to show settings
    hudContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showSettings = !showSettings;
        hudContainer.classList.toggle('show-settings', showSettings);
    });

    // Settings checkboxes
    const settingsMap = {
        showFPS: 'fpsValue',
        showTime: 'timeValue',
        showMouse: 'mouseValue',
        showKeys: 'keysValue'
    };

    Object.keys(settingsMap).forEach(settingId => {
        const checkbox = document.getElementById(settingId);
        const valueElement = document.getElementById(settingsMap[settingId]);
        const statElement = valueElement.closest('.hud-stat');

        checkbox.addEventListener('change', () => {
            statElement.style.display = checkbox.checked ? 'flex' : 'none';
        });
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

    // Mouse position
    document.addEventListener('mousemove', (e) => {
        document.getElementById('mouseValue').textContent = `${e.clientX}, ${e.clientY}`;
    });

    // Key tracking
    document.addEventListener('keydown', (e) => {
        if (!activeKeys.includes(e.key)) {
            activeKeys.push(e.key);
            updateKeysDisplay();
        }
    });

    document.addEventListener('keyup', (e) => {
        activeKeys = activeKeys.filter(key => key !== e.key);
        updateKeysDisplay();
    });

    function updateKeysDisplay() {
        const keysDisplay = activeKeys.length > 0 ? activeKeys.join(' + ') : '-';
        document.getElementById('keysValue').textContent = keysDisplay;
    }

    // Start updates
    updateFPS();
    setInterval(updateTime, 1000);

    // Make draggable
    let isDragging = false;
    let offsetX, offsetY;

    hudContainer.querySelector('.hud-header').addEventListener('mousedown', (e) => {
        if (e.target === toggleBtn) return;
        isDragging = true;
        offsetX = e.clientX - hudContainer.offsetLeft;
        offsetY = e.clientY - hudContainer.offsetTop;
        hudContainer.style.cursor = 'move';
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            hudContainer.style.left = `${e.clientX - offsetX}px`;
            hudContainer.style.top = `${e.clientY - offsetY}px`;
            hudContainer.style.right = 'auto';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        hudContainer.style.cursor = 'default';
    });

    console.log('[Death_dreamy HUD Mod] Loaded successfully!');
})();
