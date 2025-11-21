// app.js

// -------------------------------------------------------------------
// I. 初始化与常量 
// -------------------------------------------------------------------
const canvas = document.getElementById('solarCanvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');
const viewTitle = document.getElementById('viewTitle');
const backButton = document.getElementById('backButton');
const sidebarInfo = document.getElementById('sidebar-info'); 

// 加载动画相关DOM
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

// 自定义下拉菜单和重置按钮
const langToggle = document.getElementById('language-toggle');
const langDropdown = document.getElementById('language-dropdown');
const resetButton = document.getElementById('resetButton'); 

const TRANSITION_DURATION = 800;
const DETAIL_SPEED_SCALE = 0.3; 

let transitionStartTime = 0;
let transitionTarget = null; 
let transitionDirection = 0; // 0:无过渡, 1:进入细节, -1:退出细节

const speedSlider = document.getElementById('speedSlider');
const zoomSlider = document.getElementById('zoomSlider');

// 初始值常量 (用于重置)
const INITIAL_SPEED = 100;
const INITIAL_ZOOM = 100;

let globalSpeedFactor = parseFloat(speedSlider.value) / 100;
let globalZoomFactor = parseFloat(zoomSlider.value) / 100; 
let isPausedByHover = false; 
let activePlanet = null; 

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

const planetImages = new Map();
let assetsLoaded = false;

// --- 星星数据 --- 
const stars = [];

/**
 * 根据当前的视口尺寸重新生成星星数据。
 * 在初始化和窗口大小改变时调用，以确保星星背景适配。
 * @param {number} count 星星数量
 */
function generateStars(count = 300) {
    stars.length = 0; // 清空现有星星
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    for (let i = 0; i < count; i++) {
        stars.push({
            // 使用当前视口范围生成星星位置
            baseX: Math.random() * currentWidth,
            baseY: Math.random() * currentHeight,
            size: Math.random() * 1.5,
            opacity: Math.random(),
            twinkleOffset: Math.random() * 0.005 + 0.001 
        });
    }
}

generateStars(); // 初始化时生成星星

// -------------------------------------------------------------------
// II. i18n 语言切换 & 加载动画封装
// -------------------------------------------------------------------

/**
 * 封装加载动画的显示和隐藏逻辑。
 * @param {boolean} show 是否显示加载动画
 * @param {function} callback 动画隐藏后执行的回调函数
 */
function toggleLoadingScreen(show, callback = () => {}) {
    if (show) {
        loadingOverlay.style.display = 'flex';
        // 等待下一帧以确保 display 属性生效
        requestAnimationFrame(() => {
            loadingOverlay.style.opacity = 1;
        });
    } else {
        loadingOverlay.style.opacity = 0;
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            callback();
        }, 300); // 匹配 CSS 中的 transition 动画时间
    }
}


/**
 * 切换语言并更新所有 DOM 元素中的可翻译文本。
 * @param {string} lang 目标语言代码 (e.g., 'zh-CN', 'en')
 * @param {boolean} triggerLoad 是否需要显示加载动画 (语言切换时显示，初始化时不需要)
 */
function setLanguage(lang, triggerLoad = true) {
    if (!translations[lang]) {
        console.error(`Language ${lang} not supported.`);
        return;
    }

    if (currentLanguage === lang && triggerLoad) return; 

    // --- 1. 显示加载屏幕 (如果需要) ---
    if (triggerLoad) {
        toggleLoadingScreen(true);
    }
    
    currentLanguage = lang;
    const langData = translations[lang];

    // 更新按钮显示内容
    const currentLangText = langDropdown.querySelector(`a[data-lang="${lang}"]`).textContent;
    langToggle.textContent = `${langData['lang_label']}: ${currentLangText}`;
    
    // 设置当前激活项
    langDropdown.querySelectorAll('a').forEach(a => a.classList.remove('active'));
    langDropdown.querySelector(`a[data-lang="${lang}"]`).classList.add('active');


    const updateDelay = triggerLoad ? 500 : 0; 
    
    setTimeout(() => {
        // 2. 遍历所有带有 data-i18n-key 的元素，更新文本
        document.querySelectorAll('[data-i18n-key]').forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            if (langData[key]) {
                if (element.id === 'viewTitle') {
                    const isDetail = activePlanet !== null;
                    if (isDetail) {
                        element.textContent = activePlanet.name + ' ' + langData['view_planet_detail'];
                    } else {
                        element.textContent = langData[key];
                    }
                } else if (element.tagName === 'TITLE') {
                    document.title = langData[key];
                }
                else if (element.id !== 'language-toggle'){ // 排除 toggle 按钮
                    element.textContent = langData[key];
                }
            }
        });
        
        // 3. 更新动态内容
        if (activePlanet) {
            updateSidebarContent(activePlanet);
        }
        
        // 4. 隐藏加载屏幕
        if (triggerLoad) {
            toggleLoadingScreen(false);
        }
        
    }, updateDelay);
}


// -------------------------------------------------------------------
// III. 资源加载函数
// -------------------------------------------------------------------

function loadAssets() {
    const bodiesWithImage = allCelestialBodies.filter(body => body.imageSrc);
    
    const promises = bodiesWithImage.map(body => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                planetImages.set(body.name, img);
                resolve(); 
            };
            img.onerror = () => {
                console.error(`资源加载失败: ${body.name} - ${body.imageSrc}`);
                resolve(); 
            };
            img.src = body.imageSrc;
        });
    });

    Promise.all(promises).then(() => {
        assetsLoaded = true;
        
        setTimeout(() => {
            toggleLoadingScreen(false, animate); 
        }, 300); 
    });
}

// -------------------------------------------------------------------
// IV. 渲染函数 (包含 i18n 引用)
// ... (getTooltipHTML, updateSidebarContent, drawCelestialBody 函数保持不变) ...

function getTooltipHTML(body, isDetailMode) {
    const T = translations[currentLanguage];
    const isMoon = body.type === T['prop_type']; 
    
    const orbitLabelKey = isDetailMode || isMoon ? 'prop_orbit_planet' : 'prop_orbit_sun';
    const orbitUnitKey = isDetailMode || isMoon ? 'unit_planet_radius' : 'unit_au';
    const orbitValue = body.baseDistance ? body.baseDistance.toFixed(0) : 'N/A';
    
    return `
        <strong>${body.name}</strong>
        <p>${T['prop_official_name']}: ${body.officialName || 'N/A'}</p>
        <p>${T['prop_type']}: ${body.type || '未知'}</p>
        <p>${T['prop_temp']}: ${body.temp || '未知'}</p>
        <p>${T['prop_mass']}: ${body.mass || '未知'}</p>
        <p>📏 ${T[orbitLabelKey]}: ${orbitValue} ${T[orbitUnitKey]}</p>
        ${body.fact ? `<p>${T['fact_label']}: ${body.fact}</p>` : ''}
        ${!isDetailMode && body.canZoom ? `<p style="color:#00c8ff;">${T['click_to_zoom']}</p>` : ''}
    `;
}

function updateSidebarContent(planet) {
    if (!planet) {
        sidebarInfo.innerHTML = '';
        return;
    }

    const T = translations[currentLanguage];

    const massDisplay = planet.mass || '未知';
    const typeDisplay = planet.type || '未知';
    const tempDisplay = planet.temp || '未知';
    const factDisplay = planet.fact || '无特殊信息';

    const detailInfo = [
        { labelKey: 'detail_diameter', value: planet.diameter || 'N/A' },
        { labelKey: 'detail_gravity', value: planet.gravity || 'N/A' },
        { labelKey: 'detail_day_length', value: planet.dayLength || 'N/A' },
        { labelKey: 'detail_moons', value: planet.moons ? planet.moons.length : '0' }
    ];

    let html = `
        <h2>${planet.name}</h2>
        <div class="info-section">
            <strong>${T['detail_base_props']}</strong>
            <p><strong>${T['prop_official_name']}:</strong> ${planet.officialName || 'N/A'}</p>
            <p><strong>${T['prop_type']}:</strong> ${typeDisplay}</p>
            <p><strong>${T['prop_mass']}:</strong> ${massDisplay}</p>
            <p><strong>${T['prop_temp']}:</strong> ${tempDisplay}</p>
        </div>
        <div class="info-section">
            <strong>${T['detail_orbit']}</strong>
            <p><strong>${T['prop_orbit_sun']}:</strong> ${planet.baseDistance.toFixed(0)} ${T['unit_au']}</p>
            <p><strong>${T['speed_label']}:</strong> ${planet.speed}</p>
        </div>
        <div class="info-section">
            <strong>${T['detail_params']}</strong>
            ${detailInfo.map(item => `<p><strong>${T[item.labelKey]}:</strong> ${item.value}</p>`).join('')}
        </div>
        <div class="info-section">
            <strong>${T['detail_fact']}</strong>
            <p>${factDisplay}</p>
        </div>
    `;

    sidebarInfo.innerHTML = html;
}

function drawCelestialBody(body, x, y, radius, isSun = false, opacity = 1) {
    ctx.save(); 
    ctx.globalAlpha = opacity;

    if (isSun || body.glow) {
        let glowAmount = body.glow || (isSun ? 10 : 0);
        ctx.shadowBlur = glowAmount;
        ctx.shadowColor = (body.name === 'Sun' ? "#FFD700" : (body.color || "#FFFFFF"));
    }
    
    const image = planetImages.get(body.name);
    
    if (image && assetsLoaded) {
        ctx.save(); 
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2, true);
        ctx.clip(); 
        ctx.drawImage(image, x - radius, y - radius, radius * 2, radius * 2);
        ctx.restore(); 
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();

    } else {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = body.color;
        ctx.fill();
    }
    
    ctx.restore(); 
}

function drawSolarSystem(opacity = 1) {
    const T = translations[currentLanguage];
    if (opacity === 1 && transitionDirection === 0) viewTitle.textContent = T['view_solar_system'];
    
    const centerX = width / 2;
    const centerY = height / 2;
    const speedMultiplier = isPausedByHover ? 0 : globalSpeedFactor;
    
    const sunRadius = sun.radius * globalZoomFactor;
    drawCelestialBody(sun, centerX, centerY, sunRadius, true, opacity);

    planets.forEach(planet => {
        const actualDistance = planet.baseDistance * globalZoomFactor;
        const actualRadius = planet.radius * globalZoomFactor;

        ctx.globalAlpha = opacity * 0.5;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.arc(centerX, centerY, actualDistance, 0, Math.PI * 2);
        ctx.stroke();

        planet.angle += planet.speed * speedMultiplier;

        const x = centerX + Math.cos(planet.angle) * actualDistance;
        const y = centerY + Math.sin(planet.angle) * actualDistance;
        
        planet.currentX = x;
        planet.currentY = y;
        planet.currentRadius = actualRadius; 

        drawCelestialBody(planet, x, y, actualRadius, false, opacity);

        if (planet.name.includes('土星')) {
            ctx.globalAlpha = opacity * 0.5;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
            ctx.lineWidth = 2 * globalZoomFactor;
            ctx.ellipse(x, y, actualRadius * 2, actualRadius * 0.5, planet.angle + Math.PI/2, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
    
    outerBodies.forEach(body => {
        const actualDistance = body.baseDistance * globalZoomFactor;
        
        const radiusScale = Math.max(1.0, globalZoomFactor); 
        const actualRadius = body.radius * radiusScale * 1.5; 
        
        body.angle = body.angle || Math.random() * Math.PI * 2;
        body.angle += 0.0005 * speedMultiplier; 
        
        const x = centerX + Math.cos(body.angle) * actualDistance;
        const y = centerY + Math.sin(body.angle) * actualDistance;
        
        body.currentX = x;
        body.currentY = y;
        body.currentRadius = actualRadius;
        
        ctx.globalAlpha = opacity * 0.7;
        ctx.beginPath();
        ctx.arc(x, y, actualRadius, 0, Math.PI * 2);
        ctx.fillStyle = body.color;
        ctx.fill();
    });
}

function drawPlanetDetail(planet, opacity = 1) {
    const T = translations[currentLanguage];
    if (opacity === 1 && transitionDirection === 0) {
         viewTitle.textContent = planet.name + ' ' + T['view_planet_detail'];
         updateSidebarContent(planet); 
    }

    backButton.style.display = 'block'; 

    const centerX = width / 2;
    const centerY = height / 2;
    
    const detailZoomFactor = globalZoomFactor * 5; 
    const mainRadius = planet.radius * detailZoomFactor; 
    
    drawCelestialBody(planet, centerX, centerY, mainRadius, true, opacity);

    const moonSpeedMultiplier = (isPausedByHover ? 0 : globalSpeedFactor) * DETAIL_SPEED_SCALE;
    
    if (planet.moons.length > 0) {
        planet.moons.forEach(moon => {
            const actualDistance = moon.baseDistance * detailZoomFactor;
            const actualRadius = moon.radius * detailZoomFactor;

            ctx.globalAlpha = opacity * 0.5;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.arc(centerX, centerY, actualDistance, 0, Math.PI * 2);
            ctx.stroke();

            moon.angle = moon.angle || Math.random() * Math.PI * 2; 
            moon.angle += moon.speed * moonSpeedMultiplier;

            const x = centerX + Math.cos(moon.angle) * actualDistance;
            const y = centerY + Math.sin(moon.angle) * actualDistance;
            
            moon.currentX = x;
            moon.currentY = y;
            moon.currentRadius = actualRadius; 
            
            drawCelestialBody(moon, x, y, actualRadius, false, opacity);
        });
    } else {
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#00c8ff';
        ctx.font = '24px "Consolas", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(T['info_system_prompt'], centerX, centerY + mainRadius + 40);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px "Consolas", monospace';
        ctx.fillText(`(${planet.name}) ${T['detail_no_moons']}`, centerX, centerY + mainRadius + 70);
        ctx.fillText(T['detail_return_prompt'], centerX, centerY + mainRadius + 100);
    }
    
    planet.currentX = centerX;
    planet.currentY = centerY;
    planet.currentRadius = mainRadius;
}


// -------------------------------------------------------------------
// V. 动画主循环
// -------------------------------------------------------------------

function animate() {
    if (!assetsLoaded) {
        requestAnimationFrame(animate); 
        return; 
    }

    ctx.fillStyle = '#080b10';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const currentTime = Date.now();
    
    // 绘制背景星星
    stars.forEach(star => {
        // 星星位置不再依赖于 centerX/Y，它们基于视口坐标
        const twinkle = Math.sin(currentTime * star.twinkleOffset) * 0.5 + 0.5; 
        const finalOpacity = star.opacity * twinkle;

        // 星星的位置直接使用 base 坐标，不进行缩放或位移
        const x = star.baseX;
        const y = star.baseY;
        const size = star.size;

        if (x > 0 && x < width && y > 0 && y < height && size > 0.1) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // --- 过渡动画逻辑 ---
    let isTransitioning = false;

    if (transitionDirection !== 0) {
        const timeElapsed = Date.now() - transitionStartTime;
        const progress = Math.min(1, timeElapsed / TRANSITION_DURATION);
        const easedProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI); 
        isTransitioning = true;
        
        if (transitionDirection === 1) { 
            const opacitySolar = 1 - easedProgress;
            const opacityDetail = easedProgress;
            
            if (opacitySolar > 0.05) drawSolarSystem(opacitySolar);
            if (opacityDetail > 0.05) drawPlanetDetail(transitionTarget, opacityDetail);
            
            if (progress >= 1) {
                transitionDirection = 0; 
                activePlanet = transitionTarget;
                transitionTarget = null;
                sidebarInfo.classList.add('visible'); 
                viewTitle.textContent = activePlanet.name + ' ' + translations[currentLanguage]['view_planet_detail'];
            }
        } else if (transitionDirection === -1) { 
            const opacityDetail = 1 - easedProgress;
            const opacitySolar = easedProgress;

            sidebarInfo.classList.remove('visible'); 
            
            if (opacityDetail > 0.05) drawPlanetDetail(transitionTarget, opacityDetail);
            if (opacitySolar > 0.05) drawSolarSystem(opacitySolar);

            if (progress >= 1) {
                transitionDirection = 0; 
                activePlanet = null;
                transitionTarget = null;
                backButton.style.display = 'none'; 
                updateSidebarContent(null); 
                viewTitle.textContent = translations[currentLanguage]['view_solar_system'];
            }
        }
    } 
    
    if (!isTransitioning) {
        if (activePlanet === null) {
            drawSolarSystem();
            sidebarInfo.classList.remove('visible'); 
        } else {
            drawPlanetDetail(activePlanet);
        }
    }

    requestAnimationFrame(animate);
}

// -------------------------------------------------------------------
// VI. 事件处理与初始化
// -------------------------------------------------------------------

// --- 交互事件 ---
canvas.addEventListener('mousemove', handleInteraction);
canvas.addEventListener('click', handleInteraction);
document.getElementById('backButton').addEventListener('click', handleBack);

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    generateStars(); // 视口变化时重新生成星星
});

// --- 控制器事件 (速度和缩放) ---
speedSlider.addEventListener('input', () => {
    globalSpeedFactor = parseFloat(speedSlider.value) / 100;
    document.getElementById('speedValue').textContent = `${globalSpeedFactor.toFixed(2)}x`;
});
zoomSlider.addEventListener('input', () => {
    globalZoomFactor = parseFloat(zoomSlider.value) / 100;
    document.getElementById('zoomValue').textContent = `${globalZoomFactor.toFixed(2)}x`;
});

// --- 重置功能 ---
/**
 * 将缩放和速度重置为初始值，并退出细节视图，显示加载动画。
 */
function resetViewState() {
    toggleLoadingScreen(true); // 显示加载动画

    setTimeout(() => {
        // 1. 重置缩放和速度变量
        globalSpeedFactor = INITIAL_SPEED / 100;
        globalZoomFactor = INITIAL_ZOOM / 100;
        
        // 2. 更新滑动条的DOM显示
        speedSlider.value = INITIAL_SPEED;
        zoomSlider.value = INITIAL_ZOOM;
        document.getElementById('speedValue').textContent = `${globalSpeedFactor.toFixed(2)}x`;
        document.getElementById('zoomValue').textContent = `${globalZoomFactor.toFixed(2)}x`;

        // 3. 退出细节视图 (如果处于细节视图)
        if (activePlanet !== null) {
            // 使用 handleBack 会触发过渡动画，这里直接重置状态
            activePlanet = null;
            transitionDirection = 0;
            backButton.style.display = 'none'; 
            updateSidebarContent(null);
            viewTitle.textContent = translations[currentLanguage]['view_solar_system'];
        }
        
        // 4. 重置星星的位置（可选，但有助于响应式）
        generateStars(); 
        
        // 5. 隐藏加载动画
        toggleLoadingScreen(false);
    }, 500); // 预留 500ms 观看加载动画
}

resetButton.addEventListener('click', resetViewState);


// --- 语言切换事件 (自定义下拉菜单) ---

// 1. 切换菜单显示/隐藏
langToggle.addEventListener('click', () => {
    const isVisible = langDropdown.style.display === 'block';
    langDropdown.style.display = isVisible ? 'none' : 'block';
});

// 2. 监听选项点击事件
langDropdown.addEventListener('click', (event) => {
    const target = event.target;
    if (target.tagName === 'A') {
        event.preventDefault(); 
        const newLang = target.getAttribute('data-lang');
        
        setLanguage(newLang, true); 

        langDropdown.style.display = 'none';
    }
});

// 3. 点击外部关闭菜单
document.addEventListener('click', (event) => {
    if (!document.getElementById('language-switcher-container').contains(event.target)) {
        langDropdown.style.display = 'none';
    }
});


function handleBack() {
    if (activePlanet !== null) {
        transitionTarget = activePlanet;
        activePlanet = null; 
        transitionDirection = -1; 
        transitionStartTime = Date.now();
        tooltip.style.opacity = 0;
    }
}

function handleInteraction(event) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const isClick = event.type === 'click';
    
    if (transitionDirection !== 0) {
        tooltip.style.opacity = 0;
        return;
    }
    
    let targetBodies = [];
    let isDetailMode = activePlanet !== null; 
    
    if (!isDetailMode) {
        targetBodies = [...planets, ...outerBodies];
    } else {
        targetBodies = [activePlanet, ...activePlanet.moons];
    }

    let hoveredBody = null;
    
    for (const body of targetBodies) {
        if (body.currentX && body.currentY) {
            const dx = body.currentX - mouseX;
            const dy = body.currentY - mouseY;
            const hitTolerance = isDetailMode && body === activePlanet ? 20 : 5; 
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < body.currentRadius + hitTolerance) {
                hoveredBody = body;
                break;
            }
        }
    }
    
    if (isClick && hoveredBody && !isDetailMode) {
        if (hoveredBody.canZoom) {
            transitionTarget = hoveredBody;
            transitionDirection = 1; 
            transitionStartTime = Date.now();
            tooltip.style.opacity = 0;
        }
        return; 
    }

    isPausedByHover = (hoveredBody !== null);

    if (hoveredBody) { 
        tooltip.style.opacity = 1;
        tooltip.style.left = `${mouseX}px`;
        tooltip.style.top = `${mouseY}px`;
        
        tooltip.innerHTML = getTooltipHTML(hoveredBody, isDetailMode);
        
    } else {
        tooltip.style.opacity = 0;
    }
}

// 首次加载时：设置默认语言并启动资源加载
const initialLangElement = langDropdown.querySelector(`a[data-lang="${currentLanguage}"]`);
langToggle.textContent = `${translations[currentLanguage]['lang_label']}: ${initialLangElement.textContent}`; 
setLanguage(currentLanguage, false); // 初始化时，不显示加载屏
loadAssets();