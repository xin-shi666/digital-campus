import * as THREE from 'three';
import { createScene, getScene, getRenderer, onResize } from './scene.js';
import { createCamera, getCamera, getCameraTarget, updateCameraAnimation } from './camera.js';
import { createControls, getControls, setClickableObjects, onObjectClicked } from './controls.js';
import { getLayerGroups, createBuilding, createFeaturedBuilding, createRoad, createSafeRoad, createTree, createLamp, createBench, createFountain, registerBuilding, planBuilding, isOnRoad, isOnBuilding, isValidPosition } from './objects.js';

// ===== 辅助函数：安全放置对象（避开道路和建筑） =====
function safeCreateTree(x, z, scale) {
    if (isValidPosition(x, z, 1.0, 1.5)) {
        return createTree(x, z, scale);
    }
    return null;
}

function safeCreateLamp(x, z) {
    if (isValidPosition(x, z, 0.3, 1.0)) {
        return createLamp(x, z);
    }
    return null;
}

function safeCreateBench(x, z, rotation) {
    if (isValidPosition(x, z, 0.5, 1.0)) {
        return createBench(x, z, rotation);
    }
    return null;
}
import { loadModel } from './loader.js';
import { initUI, showInfoPanel, hideLoading } from './ui.js';

const buildingInfo = {
    library: {
        title: '图书馆',
        desc: '校图书馆，藏书120万册，设有电子阅览室、自习室和学术报告厅。开放时间：每天 7:00-22:00。',
        image: ''
    },
    teachingA: {
        title: '教学楼 A 栋',
        desc: '信息科技学院主教学楼，配备多媒体教室、计算机实验室和创新工作室。楼高6层，可容纳2000人同时上课。',
        image: ''
    },
    teachingB: {
        title: '教学楼 B 栋',
        desc: '综合教学楼，主要承担公共基础课程教学，内设语音室、物理实验室和数学建模实验室。',
        image: ''
    },
    admin: {
        title: '行政中心',
        desc: '校园行政办公中心，包含校长办公室、教务处、学生处等行政管理部门。',
        image: ''
    },
    canteen: {
        title: '学生食堂',
        desc: '三层学生食堂，提供中西式餐饮服务，可同时容纳3000人就餐。一层为大众餐厅，二层为风味美食，三层为教工餐厅。',
        image: ''
    },
    dormA: {
        title: '学生宿舍 A 区',
        desc: '本科生宿舍区，四人一间，配备空调、独立卫浴和网络接口。楼下设有洗衣房和便利店。',
        image: ''
    },
    dormB: {
        title: '学生宿舍 B 区',
        desc: '研究生及留学生宿舍，二人一间，配备学习桌椅、空调及独立卫浴，环境安静舒适。',
        image: ''
    },
    gym: {
        title: '体育馆',
        desc: '综合体育馆，包含篮球场、羽毛球场、乒乓球室和健身房，可承办校级体育赛事。',
        image: ''
    }
};

function buildScene() {
    const scene = getScene();
    const layerGroups = getLayerGroups();

    // ===== 预注册建筑足迹（道路创建前） =====
    planBuilding(0, 0, 4.4, 4.4);                    // 中心喷泉（视为建筑避开）
    planBuilding(-24, -36, 10, 6);                   // 图书馆
    planBuilding(24, -36, 9, 5);                     // 教学楼A
    planBuilding(9, 38, 8, 6);                       // 行政中心
    planBuilding(-24, 31, 9, 5);                     // 教学楼B
    planBuilding(31, -14, 8, 6);                     // 学生食堂
    planBuilding(31, 16, 11, 7);                     // 体育馆
    planBuilding(-33, -14, 6, 5);                    // 学生宿舍A
    planBuilding(-33, 16, 6, 5);                     // 学生宿舍B

    // ===== 道路系统 =====
    // 中央十字主干道
    createSafeRoad(0, 0, 8, 100);                     // 南北主轴 z:-50 ~ z:50
    createSafeRoad(0, 0, 7, 90, Math.PI / 2);         // 东西主轴 x:-45 ~ x:45

    // 内环道路（教学核心区）
    createSafeRoad(0, -24, 5, 60);                    // 北内环横路 x:-30 ~ x:30
    createSafeRoad(0, 24, 5, 60);                     // 南内环横路
    createSafeRoad(-18, 0, 4, 48, Math.PI / 2);       // 西内环纵路 z:-24 ~ z:24
    createSafeRoad(18, 0, 4, 48, Math.PI / 2);        // 东内环纵路

    // 外环道路（校园边界）
    createSafeRoad(0, -42, 4, 75);                    // 北外环横路
    createSafeRoad(0, 42, 4, 75);                     // 南外环横路
    createSafeRoad(-36, 0, 4, 84, Math.PI / 2);       // 西外环纵路 z:-42 ~ z:42
    createSafeRoad(36, 0, 4, 84, Math.PI / 2);        // 东外环纵路

    // 纵向连接道路（内环↔外环）
    createSafeRoad(-27, 0, 3, 84, Math.PI / 2);       // 西侧连接线
    createSafeRoad(27, 0, 3, 84, Math.PI / 2);        // 东侧连接线

    // 横向连接道路
    createSafeRoad(0, -33, 3, 54);                    // 北侧连接横路（内环↔外环之间）
    createSafeRoad(0, 33, 3, 54);                     // 南侧连接横路

    // 建筑入口支路（连接到主干道）
    createSafeRoad(-20, -7, 2.5, 14, Math.PI / 2);    // 通向西区宿舍
    createSafeRoad(-20, 7, 2.5, 14, Math.PI / 2);     // 通向西区宿舍B
    createSafeRoad(28, -6, 2.5, 12, Math.PI / 2);     // 通向食堂
    createSafeRoad(28, 7, 2.5, 14, Math.PI / 2);      // 通向体育馆
    createSafeRoad(-8, -7, 2.5, 14, Math.PI / 2);     // 通向图书馆
    createSafeRoad(8, -7, 2.5, 14, Math.PI / 2);      // 通向教学楼A
    createSafeRoad(-8, 7, 2.5, 14, Math.PI / 2);      // 通向教学楼B
    createSafeRoad(8, 7, 2.5, 14, Math.PI / 2);       // 通向行政中心

    // 中心广场环形路
    createSafeRoad(0, 8, 2, 16, Math.PI / 2);         // 广场北侧通路
    createSafeRoad(0, -8, 2, 16, Math.PI / 2);        // 广场南侧通路
    createSafeRoad(-8, 0, 2, 16);                     // 广场西侧通路
    createSafeRoad(8, 0, 2, 16);                      // 广场东侧通路

    // 沿外环的散步小径
    createSafeRoad(0, -45, 1.5, 72);                  // 北边界小径
    createSafeRoad(0, 45, 1.5, 72);                   // 南边界小径
    createSafeRoad(-39, 0, 1.5, 90, Math.PI / 2);     // 西边界小径
    createSafeRoad(39, 0, 1.5, 90, Math.PI / 2);      // 东边界小径

    // ===== 建筑群（分散布局） =====
    // 中心广场
    createFountain(0, 0);

    // 北区：图书馆 + 教学楼A（避开内环纵路和北外环横路）
    createFeaturedBuilding(-24, -36, 10, 6, 12, 0xd4c5a9, buildingInfo.library);
    registerBuilding(-24, -36, 10, 6);
    createBuilding(24, -36, 9, 5, 10, 0xc4d5e0, buildingInfo.teachingA);
    registerBuilding(24, -36, 9, 5);

    // 南区：行政中心（避开中央主轴 x:[-4,4]）+ 教学楼B
    createFeaturedBuilding(9, 38, 8, 6, 9, 0xe8dcc8, buildingInfo.admin, 0x445588);
    registerBuilding(9, 38, 8, 6);
    createBuilding(-24, 31, 9, 5, 9, 0xd0d8e0, buildingInfo.teachingB);
    registerBuilding(-24, 31, 9, 5);

    // 东区：食堂 + 体育馆（避开东外环纵路和东连接线）
    createBuilding(31, -14, 8, 6, 6, 0xe0d0c0, buildingInfo.canteen);
    registerBuilding(31, -14, 8, 6);
    createFeaturedBuilding(31, 16, 11, 7, 7, 0xccd0d8, buildingInfo.gym, 0x336699);
    registerBuilding(31, 16, 11, 7);

    // 西区：宿舍区（避开西外环纵路）
    createBuilding(-33, -14, 6, 5, 8, 0xe8ddd0, buildingInfo.dormA);
    registerBuilding(-33, -14, 6, 5);
    createBuilding(-33, 16, 6, 5, 8, 0xe0d8cc, buildingInfo.dormB);
    registerBuilding(-33, 16, 6, 5);

    // ===== 植被（分散自然分布，避开道路和建筑） =====
    // 主干道两侧行道树（间距加大，自然偏移但不侵占路面）
    for (let z = -40; z <= 40; z += 5) {
        safeCreateTree(4.5 + (Math.random() - 0.5) * 1.5, z + (Math.random() - 0.5) * 2, 0.7 + Math.random() * 0.6);
        safeCreateTree(-4.5 + (Math.random() - 0.5) * 1.5, z + (Math.random() - 0.5) * 2, 0.7 + Math.random() * 0.6);
    }
    for (let x = -36; x <= 36; x += 6) {
        safeCreateTree(x + (Math.random() - 0.5) * 2, 4.5 + (Math.random() - 0.5) * 1.5, 0.7 + Math.random() * 0.6);
        safeCreateTree(x + (Math.random() - 0.5) * 2, -4.5 + (Math.random() - 0.5) * 1.5, 0.7 + Math.random() * 0.6);
    }

    // 建筑周边绿化（每栋建筑周围散落2-4棵，避开道路）
    const buildingTrees = [
        [-20, -38], [-14, -38], [-26, -38],
        [20, -38], [14, -38], [26, -38],
        [4, 38], [9, 38], [14, 38],
        [-20, 30], [-14, 30], [-26, 30],
        [32, -12], [26, -12], [38, -12],
        [34, 14], [28, 14], [40, 14],
        [-32, -12], [-38, -12], [-26, -12],
        [-32, 14], [-38, 14], [-26, 14]
    ];
    buildingTrees.forEach(([tx, tz]) => {
        safeCreateTree(tx + (Math.random() - 0.5) * 3, tz + (Math.random() - 0.5) * 3, 0.6 + Math.random() * 0.5);
    });

    // 开阔区域散落树木（校园边缘地带，避开道路）
    for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 25 + Math.random() * 25;
        const tx = Math.cos(angle) * dist;
        const tz = Math.sin(angle) * dist;
        safeCreateTree(tx, tz, 0.5 + Math.random() * 0.8);
    }

    // ===== 设施 =====
    // 路灯沿主干道分布（间距加大，避开建筑）
    for (let z = -42; z <= 42; z += 8) {
        safeCreateLamp(5.0, z);
        safeCreateLamp(-5.0, z);
    }
    for (let x = -36; x <= 36; x += 10) {
        safeCreateLamp(x, 5.0);
        safeCreateLamp(x, -5.0);
    }

    // 长椅（在教学楼和图书馆附近，避开道路和建筑）
    const benchPositions = [
        [-14, -34], [14, -34],                     // 北区教学楼附近
        [4, 34], [14, 34],                          // 南区行政楼附近（行政中心已移至x=9）
        [28, -8], [40, -8],                         // 东区食堂附近
        [-26, -8], [-38, -8], [-26, 10], [-38, 10], // 宿舍区
        [-8, 4], [8, 4], [-8, -4], [8, -4],        // 中心广场周边
        [28, 10], [28, 18]                          // 体育馆附近
    ];
    benchPositions.forEach(([bx, bz]) => {
        safeCreateBench(bx, bz, Math.random() * Math.PI);
    });

    // 添加到场景
    Object.values(layerGroups).forEach(group => scene.add(group));

    // 收集可点击对象
    const clickable = [];
    layerGroups.buildings.children.forEach(b => clickable.push(b));
    layerGroups.vegetation.children.forEach(t => clickable.push(t));
    layerGroups.facilities.children.forEach(f => clickable.push(f));
    setClickableObjects(clickable);
}

async function init() {
    const { scene, renderer } = createScene();
    const camera = createCamera();
    const controls = createControls(camera, renderer);

    onResize(camera);
    buildScene();
    initUI(controls);

    // 外部模型加载（放入 GLB 文件后取消注释即可）
    // await loadModel('assets/models/buildings/library.glb', 'library_model');

    onObjectClicked((info) => {
        showInfoPanel(info);
    });

    hideLoading();

    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.1);
        updateCameraAnimation(delta);
        controls.update();

        const sky = scene.getObjectByName('sky');
        if (sky) sky.rotation.y += 0.0001;

        renderer.render(scene, camera);
    }

    animate();
    console.log('校园数字孪生系统初始化完成');
}

init().catch(console.error);
