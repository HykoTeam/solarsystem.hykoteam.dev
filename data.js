// data.js

// -------------------------------------------------------------------
// I. 多语言翻译包 (i18n)
// -------------------------------------------------------------------

const translations = {
    'zh-CN': {
        app_title: '太阳系视图总揽',
        loading_text: '资源加载中...',
        view_solar_system: '太阳系总览模式',
        view_planet_detail: '卫星系统视图',
        speed_label: '☄ 速度:',
        zoom_label: '☌ 缩放:',
        back_button: '⏎ 返回太阳系总览',
        reset_button: '重置视图',
        lang_label: '语言',
        // 侧边栏/悬浮框通用文本
        prop_official_name: '🌎 官方名称',
        prop_type: '🌑 类型',
        prop_temp: '🌡️ 表面温度',
        prop_mass: '⚖️ 质量',
        prop_orbit_sun: '轨道半径 (相对太阳)',
        prop_orbit_planet: '公转轨道 (相对主星)',
        unit_au: 'AU',
        unit_planet_radius: '倍行星半径',
        fact_label: '💡 科学趣闻',
        click_to_zoom: '** 点击进入细节视图 **',
        detail_base_props: '🛰️ 基本属性',
        detail_orbit: '🔭 轨道与周期',
        detail_params: '✨ 详细参数',
        detail_fact: '💡 科学趣闻',
        detail_diameter: '直径 (赤道)',
        detail_gravity: '重力加速度',
        detail_day_length: '自转周期 (天)',
        detail_moons: '已知卫星数量',
        detail_no_moons: '该行星没有已知的卫星',
        detail_return_prompt: '请点击返回太阳系总览',
        info_system_prompt: '[ 信息系统提示 ]',
    },
    'zh-TW': {
        app_title: '太陽系視圖總覽',
        loading_text: '資源加載中...',
        view_solar_system: '太陽系總覽模式',
        view_planet_detail: '衛星系統視圖',
        speed_label: '☄ 速度:',
        zoom_label: '☌ 縮放:',
        back_button: '⏎ 返回太陽系總覽',
        reset_button: '重置視圖',
        lang_label: '語言',
        // 側邊欄/懸浮框通用文本
        prop_official_name: '🌎 官方名稱',
        prop_type: '🌑 類型',
        prop_temp: '🌡️ 表面溫度',
        prop_mass: '⚖️ 質量',
        prop_orbit_sun: '軌道半徑 (相對太陽)',
        prop_orbit_planet: '公轉軌道 (相對主星)',
        unit_au: 'AU',
        unit_planet_radius: '倍行星半徑',
        fact_label: '💡 科學趣聞',
        click_to_zoom: '** 點擊進入細節視圖 **',
        detail_base_props: '🛰️ 基本屬性',
        detail_orbit: '🔭 軌道與週期',
        detail_params: '✨ 詳細參數',
        detail_fact: '💡 科學趣聞',
        detail_diameter: '直徑 (赤道)',
        detail_gravity: '重力加速度',
        detail_day_length: '自轉週期 (天)',
        detail_moons: '已知衛星數量',
        detail_no_moons: '該行星沒有已知的衛星',
        detail_return_prompt: '請點擊返回太陽系總覽',
        info_system_prompt: '[ 訊息系統提示 ]',
    },
    'en': {
        app_title: 'Solar System Overview',
        loading_text: 'Loading Assets...',
        view_solar_system: 'Solar System Overview',
        view_planet_detail: 'Satellite System View',
        speed_label: '☄ Speed:',
        zoom_label: '☌ Zoom:',
        back_button: '⏎ Back to Overview',
        reset_button: 'Reset View',
        lang_label: 'Language',
        // Sidebar/Tooltip Text
        prop_official_name: '🌎 Official Name',
        prop_type: '🌑 Type',
        prop_temp: '🌡️ Surface Temp',
        prop_mass: '⚖️ Mass',
        prop_orbit_sun: 'Orbital Distance (vs Sun)',
        prop_orbit_planet: 'Orbital Distance (vs Host)',
        unit_au: 'AU',
        unit_planet_radius: 'x Planet Radius',
        fact_label: '💡 Fun Fact',
        click_to_zoom: '** Click to enter detail view **',
        detail_base_props: '🛰️ Basic Properties',
        detail_orbit: '🔭 Orbit & Period',
        detail_params: '✨ Detailed Parameters',
        detail_fact: '💡 Scientific Facts',
        detail_diameter: 'Diameter (Equatorial)',
        detail_gravity: 'Gravity Acceleration',
        detail_day_length: 'Day Length (Earth Days)',
        detail_moons: 'Known Moons Count',
        detail_no_moons: 'This planet has no known moons.',
        detail_return_prompt: 'Click to return to the Solar System Overview',
        info_system_prompt: '[ Information System Prompt ]',
    }
};

let currentLanguage = 'en'; // <-- 默认语言设置为英文

// -------------------------------------------------------------------
// II. 星体数据定义 (数据为占位符，可自行替换为更准确的值) - **已移除 imageSrc**
// -------------------------------------------------------------------

const moonsData = [
    { name: '月球', officialName: 'Moon', radius: 3, baseDistance: 25, speed: 0.1, color: '#C0C0C0', angle: 0, type: '卫星', canZoom: false },
    { name: '木卫一 (Io)', officialName: 'Io', radius: 5, baseDistance: 35, speed: 0.08, color: '#FFD700', angle: 1, type: '卫星', canZoom: false },
    { name: '木卫二 (Europa)', officialName: 'Europa', radius: 4, baseDistance: 50, speed: 0.05, color: '#ADD8E6', angle: 2, type: '卫星', canZoom: false },
    { name: '土卫六 (Titan)', officialName: 'Titan', radius: 6, baseDistance: 45, speed: 0.07, color: '#FFA07A', angle: 3, type: '卫星', canZoom: false },
];

const planets = [
    { name: '水星 (Mercury)', officialName: 'Mercury', radius: 4,  baseDistance: 60,  speed: 0.04,  color: '#A9A9A9', angle: 0.1, mass: '3.3 x 10²³ kg', type: '岩石行星', temp: '430°C', moons: [], canZoom: true, diameter: '4,880 km', gravity: '3.7 m/s²', dayLength: '58.6 地球日' },
    { name: '金星 (Venus)', officialName: 'Venus', radius: 8,  baseDistance: 90,  speed: 0.015, color: '#DEB887', angle: 1.1, mass: '4.8 x 10²⁴ kg', type: '岩石行星', temp: '462°C', moons: [], canZoom: true, diameter: '12,104 km', gravity: '8.87 m/s²', dayLength: '243 地球日' },
    { name: '地球 (Earth)', officialName: 'Earth', radius: 9,  baseDistance: 130, speed: 0.01,  color: '#4169E1', angle: 2.1, mass: '5.9 x 10²⁴ kg', type: '岩石行星', temp: '15°C', fact: '拥有生命和液态水', moons: [moonsData[0]], canZoom: true, diameter: '12,742 km', gravity: '9.8 m/s²', dayLength: '24 小时' },
    { name: '火星 (Mars)', officialName: 'Mars', radius: 6,  baseDistance: 170, speed: 0.008, color: '#CD5C5C', angle: 3.1, mass: '6.4 x 10²³ kg', type: '岩石行星', temp: '-63°C', fact: '红色星球，有极地冰盖', moons: [], canZoom: true, diameter: '6,779 km', gravity: '3.7 m/s²', dayLength: '24.6 小时' },
    { name: '木星 (Jupiter)', officialName: 'Jupiter', radius: 18, baseDistance: 240, speed: 0.002, color: '#D2B48C', angle: 4.1, mass: '1.8 x 10²⁷ kg', type: '气体巨星', temp: '-145°C', fact: '太阳系最大，有大红斑', moons: [moonsData[1], moonsData[2]], canZoom: true, diameter: '142,984 km', gravity: '24.79 m/s²', dayLength: '9.9 小时' },
    { name: '土星 (Saturn)', officialName: 'Saturn', radius: 15, baseDistance: 300, speed: 0.0015,color: '#F4A460', angle: 5.1, mass: '5.6 x 10²⁶ kg', type: '气体巨星', temp: '-178°C', fact: '拥有复杂的行星环系统', moons: [moonsData[3]], canZoom: true, diameter: '120,536 km', gravity: '10.44 m/s²', dayLength: '10.7 小时' },
    { name: '海王星 (Neptune)', officialName: 'Neptune', radius: 12, baseDistance: 380, speed: 0.001, color: '#1E90FF', angle: 6.1, mass: '1.0 x 10²⁶ kg', type: '冰巨星', temp: '-201°C', moons: [], canZoom: true, diameter: '49,244 km', gravity: '11.15 m/s²', dayLength: '16.1 小时' },
];

// 太阳系外围星体
const outerBodies = [
    { name: '冥王星 (Pluto)', officialName: 'Pluto', radius: 5, baseDistance: 450, color: '#8B4513', type: '矮行星', mass: '1.3 x 10²² kg', angle: 1.5, currentX: 0, currentY: 0, canZoom: false, diameter: '2,377 km', gravity: '0.62 m/s²', dayLength: '6.4 地球日' },
    { name: '阋神星 (Eris)', officialName: 'Eris', radius: 4, baseDistance: 550, color: '#DCDCDC', type: '矮行星/TNO', mass: '1.6 x 10²² kg', angle: 4.5, currentX: 0, currentY: 0, canZoom: false, diameter: '2,326 km' },
    { name: '赛德娜 (Sedna)', officialName: 'Sedna', radius: 4, baseDistance: 700, color: '#CD853F', type: 'TNO', mass: '未知', angle: 5.5, currentX: 0, currentY: 0, canZoom: false, diameter: '约 995 km' }
];

// **已移除 imageSrc**
const sun = { name: 'Sun', officialName: 'Sol', radius: 25, color: '#FFD700', glow: 50 };

const allCelestialBodies = [sun, ...planets, ...moonsData];