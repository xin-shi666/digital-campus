import * as THREE from 'three';
import { createScene, getScene, getRenderer, onResize } from './scene.js';
import { createCamera, getCamera, getCameraTarget, updateCameraAnimation } from './camera.js';
import { createControls, getControls, setClickableObjects, onObjectClicked } from './controls.js';
import { getLayerGroups, createBuilding, createFeaturedBuilding, createRoad, createTree, createLamp, createBench, createFountain } from './objects.js';
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

    // 道路系统
    createRoad(0, 0, 6, 50);
    createRoad(0, 0, 4, 30, Math.PI / 2);
    createRoad(0, -12, 3, 20);
    createRoad(0, 12, 3, 20);
    createRoad(-10, 0, 3, 22, Math.PI / 2);
    createRoad(10, 0, 3, 22, Math.PI / 2);

    // 建筑群
    createFountain(0, 0);
    createFeaturedBuilding(-8, -18, 8, 5, 9, 0xd4c5a9, buildingInfo.library);
    createBuilding(6, -18, 7, 4, 8, 0xc4d5e0, buildingInfo.teachingA);
    createFeaturedBuilding(0, 18, 7, 5, 7, 0xe8dcc8, buildingInfo.admin, 0x445588);
    createBuilding(-10, 14, 7, 4, 7, 0xd0d8e0, buildingInfo.teachingB);
    createBuilding(14, -6, 6, 5, 5, 0xe0d0c0, buildingInfo.canteen);
    createFeaturedBuilding(16, 8, 9, 6, 6, 0xccd0d8, buildingInfo.gym, 0x336699);
    createBuilding(-14, -6, 5, 4, 7, 0xe8ddd0, buildingInfo.dormA);
    createBuilding(-14, 6, 5, 4, 7, 0xe0d8cc, buildingInfo.dormB);

    // 植被
    const treePositions = [
        [3.5, -18], [3.5, -14], [3.5, -10], [3.5, -6], [3.5, -2],
        [3.5, 2], [3.5, 6], [3.5, 10], [3.5, 14], [3.5, 18],
        [-3.5, -18], [-3.5, -14], [-3.5, -10], [-3.5, -6], [-3.5, -2],
        [-3.5, 2], [-3.5, 6], [-3.5, 10], [-3.5, 14], [-3.5, 18],
        [-12, 3], [-8, 3], [-6, 3], [6, 3], [8, 3], [12, 3],
        [-12, -3], [-8, -3], [-6, -3], [6, -3], [8, -3], [12, -3],
        [-16, -16], [-16, -10], [-16, 10], [-16, 16],
        [16, -16], [16, -10], [16, 16],
        [0, 22], [-6, 22], [6, 22]
    ];
    treePositions.forEach(([tx, tz]) => {
        const scale = 0.7 + Math.random() * 0.7;
        createTree(tx + (Math.random() - 0.5) * 1.5, tz + (Math.random() - 0.5) * 1.5, scale);
    });

    // 设施
    for (let z = -22; z <= 22; z += 7) {
        createLamp(3.8, z);
        createLamp(-3.8, z);
    }
    for (let x = -12; x <= 12; x += 8) {
        createLamp(x, 3.5);
        createLamp(x, -3.5);
    }

    const benchPositions = [
        [-5, 4], [5, 4], [-5, -4], [5, -4],
        [-18, -14], [-18, 0], [18, 0], [10, 14], [-12, 18]
    ];
    benchPositions.forEach(([bx, bz]) => {
        createBench(bx, bz, Math.random() * Math.PI);
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
