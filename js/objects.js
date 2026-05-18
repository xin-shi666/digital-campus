import * as THREE from 'three';

const layerGroups = {
    buildings: new THREE.Group(),
    roads: new THREE.Group(),
    vegetation: new THREE.Group(),
    facilities: new THREE.Group()
};

export function getLayerGroups() {
    return layerGroups;
}

// ===== 碰撞检测：道路占用区域 =====
const roadZones = [];
const buildingFootprints = [];

// 预注册建筑足迹（在道路创建前使用）
const plannedBuildings = [];

export function planBuilding(x, z, w, d) {
    plannedBuildings.push({
        xmin: x - w / 2, xmax: x + w / 2,
        zmin: z - d / 2, zmax: z + d / 2
    });
}

export function registerBuilding(x, z, w, d) {
    buildingFootprints.push({
        xmin: x - w / 2, xmax: x + w / 2,
        zmin: z - d / 2, zmax: z + d / 2
    });
}

// 检测道路是否与预注册建筑交叉
function roadOverlapsBuildings(x, z, width, length, rotation) {
    let rxmin, rxmax, rzmin, rzmax;
    if (rotation === 0) {
        rxmin = x - width / 2;
        rxmax = x + width / 2;
        rzmin = z - length / 2;
        rzmax = z + length / 2;
    } else {
        rxmin = x - length / 2;
        rxmax = x + length / 2;
        rzmin = z - width / 2;
        rzmax = z + width / 2;
    }
    for (const b of plannedBuildings) {
        if (rxmin < b.xmax && rxmax > b.xmin && rzmin < b.zmax && rzmax > b.zmin) {
            return true;
        }
    }
    return false;
}

// 将被建筑截断的道路拆分为多个不重叠的段落
function splitRoadByBuildings(x, z, width, length, rotation) {
    let alongMin, alongMax, crossMin, crossMax;
    if (rotation === 0) {
        crossMin = x - width / 2;
        crossMax = x + width / 2;
        alongMin = z - length / 2;
        alongMax = z + length / 2;
    } else {
        crossMin = z - width / 2;
        crossMax = z + width / 2;
        alongMin = x - length / 2;
        alongMax = x + length / 2;
    }

    // 收集所有与建筑交叉的区间
    const cuts = [];
    for (const b of plannedBuildings) {
        const bCrossMin = rotation === 0 ? b.xmin : b.zmin;
        const bCrossMax = rotation === 0 ? b.xmax : b.zmax;
        const bAlongMin = rotation === 0 ? b.zmin : b.xmin;
        const bAlongMax = rotation === 0 ? b.zmax : b.xmax;

        if (crossMin < bCrossMax && crossMax > bCrossMin) {
            if (alongMin < bAlongMax && alongMax > bAlongMin) {
                cuts.push({
                    min: Math.max(alongMin, bAlongMin),
                    max: Math.min(alongMax, bAlongMax)
                });
            }
        }
    }

    if (cuts.length === 0) return [{ x, z, width, length }];

    // 合并重叠的切割区间
    cuts.sort((a, b) => a.min - b.min);
    const merged = [cuts[0]];
    for (let i = 1; i < cuts.length; i++) {
        const last = merged[merged.length - 1];
        if (cuts[i].min <= last.max) {
            last.max = Math.max(last.max, cuts[i].max);
        } else {
            merged.push(cuts[i]);
        }
    }

    // 生成不交叉的段落
    const segments = [];
    let start = alongMin;
    const minLen = 1.5;
    for (const cut of merged) {
        if (cut.min - start > minLen) {
            const segCenter = (start + cut.min) / 2;
            const segLength = cut.min - start;
            if (rotation === 0) {
                segments.push({ x, z: segCenter, width, length: segLength });
            } else {
                segments.push({ x: segCenter, z, width, length: segLength });
            }
        }
        start = cut.max;
    }
    if (alongMax - start > minLen) {
        const segCenter = (start + alongMax) / 2;
        const segLength = alongMax - start;
        if (rotation === 0) {
            segments.push({ x, z: segCenter, width, length: segLength });
        } else {
            segments.push({ x: segCenter, z, width, length: segLength });
        }
    }

    return segments;
}

// 安全创建道路：自动避开预注册建筑
export function createSafeRoad(x, z, width, length, rotation = 0) {
    const segments = splitRoadByBuildings(x, z, width, length, rotation);
    for (const seg of segments) {
        createRoad(seg.x, seg.z, seg.width, seg.length, rotation);
    }
}

function registerRoadZone(x, z, width, length, rotation) {
    let xmin, xmax, zmin, zmax;
    if (rotation === 0) {
        xmin = x - width / 2;
        xmax = x + width / 2;
        zmin = z - length / 2;
        zmax = z + length / 2;
    } else {
        xmin = x - length / 2;
        xmax = x + length / 2;
        zmin = z - width / 2;
        zmax = z + width / 2;
    }
    roadZones.push({ xmin, xmax, zmin, zmax });
}

export function isOnRoad(x, z, margin = 0.5) {
    return roadZones.some(r =>
        x >= r.xmin - margin && x <= r.xmax + margin &&
        z >= r.zmin - margin && z <= r.zmax + margin
    );
}

export function isOnBuilding(x, z, margin = 1.0) {
    return buildingFootprints.some(b =>
        x >= b.xmin - margin && x <= b.xmax + margin &&
        z >= b.zmin - margin && z <= b.zmax + margin
    );
}

export function isValidPosition(x, z, roadMargin = 0.8, buildingMargin = 1.5) {
    return !isOnRoad(x, z, roadMargin) && !isOnBuilding(x, z, buildingMargin);
}

export function createBuilding(x, z, w, d, h, color, info) {
    const group = new THREE.Group();
    group.name = info.title;

    const bodyGeom = new THREE.BoxGeometry(w, h, d);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.5,
        metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // 窗户条纹
    const stripeCount = Math.floor(h / 1.5);
    const stripeGeom = new THREE.BoxGeometry(w + 0.1, 0.3, 0.15);
    const stripeMat = new THREE.MeshStandardMaterial({
        color: 0x8899aa,
        roughness: 0.3,
        metalness: 0.6
    });
    for (let i = 1; i < stripeCount - 1; i++) {
        const sf = new THREE.Mesh(stripeGeom, stripeMat);
        sf.position.set(0, i * 1.5, d / 2 + 0.05);
        group.add(sf);
        const sb = new THREE.Mesh(stripeGeom, stripeMat);
        sb.position.set(0, i * 1.5, -d / 2 - 0.05);
        group.add(sb);
    }

    const sideStripeGeom = new THREE.BoxGeometry(0.15, 0.3, d + 0.1);
    for (let i = 1; i < stripeCount - 1; i++) {
        const sl = new THREE.Mesh(sideStripeGeom, stripeMat);
        sl.position.set(-w / 2 - 0.05, i * 1.5, 0);
        group.add(sl);
        const sr = new THREE.Mesh(sideStripeGeom, stripeMat);
        sr.position.set(w / 2 + 0.05, i * 1.5, 0);
        group.add(sr);
    }

    // 屋顶
    const roofGeom = new THREE.BoxGeometry(w + 0.6, 0.4, d + 0.6);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = h + 0.2;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    group.position.set(x, 0, z);
    group.userData.info = info;
    group.userData.layer = 'buildings';
    layerGroups.buildings.add(group);
    return group;
}

export function createFeaturedBuilding(x, z, w, d, h, color, info, roofColor = 0xcc3333) {
    const group = new THREE.Group();
    group.name = info.title;

    const bodyGeom = new THREE.BoxGeometry(w, h, d);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.4,
        metalness: 0.15
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // 窗户
    const stripeCount = Math.floor(h / 1.5);
    const stripeGeom = new THREE.BoxGeometry(w + 0.1, 0.25, 0.1);
    const stripeMat = new THREE.MeshStandardMaterial({
        color: 0xaabbcc,
        roughness: 0.2,
        metalness: 0.7
    });
    for (let i = 1; i < stripeCount - 1; i++) {
        const s1 = new THREE.Mesh(stripeGeom, stripeMat);
        s1.position.set(0, i * 1.5, d / 2 + 0.05);
        group.add(s1);
        const s2 = new THREE.Mesh(stripeGeom, stripeMat);
        s2.position.set(0, i * 1.5, -d / 2 - 0.05);
        group.add(s2);
    }

    // 尖顶
    const roofH = 3;
    const roofGeom = new THREE.ConeGeometry(Math.max(w, d) * 0.75, roofH, 4);
    const roofMat = new THREE.MeshStandardMaterial({
        color: roofColor,
        roughness: 0.5,
        metalness: 0.1
    });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = h + roofH / 2 - 0.4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // 入口台阶
    const stepGeom = new THREE.BoxGeometry(w * 0.35, 0.2, 2);
    const stepMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.6 });
    for (let i = 0; i < 3; i++) {
        const step = new THREE.Mesh(stepGeom, stepMat);
        step.position.set(0, 0.2 + i * 0.2, d / 2 + 0.5 + i * 0.5);
        step.receiveShadow = true;
        group.add(step);
    }

    group.position.set(x, 0, z);
    group.userData.info = info;
    group.userData.layer = 'buildings';
    layerGroups.buildings.add(group);
    return group;
}

export function createRoad(x, z, width, length, rotation = 0) {
    const group = new THREE.Group();

    const roadGeom = new THREE.PlaneGeometry(width, length);
    const roadMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.9,
        metalness: 0.0
    });
    const road = new THREE.Mesh(roadGeom, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.02;
    road.receiveShadow = true;
    group.add(road);

    // 中心虚线
    if (length > 5) {
        const dashCount = Math.floor(length / 2);
        const dashGeom = new THREE.PlaneGeometry(0.3, 1.2);
        const dashMat = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            roughness: 0.5,
            emissive: 0x332200
        });
        for (let i = 0; i < dashCount; i++) {
            const dash = new THREE.Mesh(dashGeom, dashMat);
            dash.rotation.x = -Math.PI / 2;
            dash.position.set(0, 0.03, -length / 2 + 1.5 + i * 2);
            dash.receiveShadow = true;
            group.add(dash);
        }
    }

    // 人行道边缘
    const edgeGeom = new THREE.BoxGeometry(width + 1, 0.12, 0.4);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7 });
    const edge1 = new THREE.Mesh(edgeGeom, edgeMat);
    edge1.position.set(0, 0.06, -length / 2 - 0.2);
    edge1.receiveShadow = true;
    group.add(edge1);
    const edge2 = new THREE.Mesh(edgeGeom, edgeMat);
    edge2.position.set(0, 0.06, length / 2 + 0.2);
    edge2.receiveShadow = true;
    group.add(edge2);

    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    group.userData.layer = 'roads';
    layerGroups.roads.add(group);

    registerRoadZone(x, z, width, length, rotation);
    return group;
}

export function createTree(x, z, scale = 1) {
    const group = new THREE.Group();

    const trunkH = 2 * scale;
    const trunkGeom = new THREE.CylinderGeometry(0.15 * scale, 0.22 * scale, trunkH, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    const crownColors = [0x2d7d2d, 0x3a8c3a, 0x4a9c4a];
    for (let i = 0; i < 3; i++) {
        const crownH = 1.2 * scale;
        const crownR = 0.9 * scale - i * 0.15;
        const crownGeom = new THREE.ConeGeometry(crownR, crownH, 10);
        const crownMat = new THREE.MeshStandardMaterial({
            color: crownColors[i],
            roughness: 0.7
        });
        const crown = new THREE.Mesh(crownGeom, crownMat);
        crown.position.y = trunkH + i * 0.6 * scale;
        crown.castShadow = true;
        crown.receiveShadow = true;
        group.add(crown);
    }

    group.position.set(x, 0, z);
    group.userData.info = {
        title: '树木',
        desc: '校园绿化植被，美化校园环境，净化空气。',
        image: ''
    };
    group.userData.layer = 'vegetation';
    layerGroups.vegetation.add(group);
    return group;
}

export function createLamp(x, z) {
    const group = new THREE.Group();

    const poleGeom = new THREE.CylinderGeometry(0.12, 0.16, 5, 8);
    const poleMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.3,
        metalness: 0.8
    });
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.y = 2.5;
    pole.castShadow = true;
    group.add(pole);

    const armGeom = new THREE.BoxGeometry(1.5, 0.1, 0.1);
    const arm = new THREE.Mesh(armGeom, poleMat);
    arm.position.set(0.6, 4.9, 0);
    group.add(arm);

    const shadeGeom = new THREE.SphereGeometry(0.35, 8, 4);
    const shadeMat = new THREE.MeshStandardMaterial({
        color: 0xffffcc,
        roughness: 0.2,
        emissive: 0xffffee,
        emissiveIntensity: 0.3
    });
    const shade = new THREE.Mesh(shadeGeom, shadeMat);
    shade.position.set(1.2, 4.8, 0);
    group.add(shade);

    const pointLight = new THREE.PointLight(0xffffee, 3, 8);
    pointLight.position.set(1.2, 4.8, 0);
    group.add(pointLight);

    group.position.set(x, 0, z);
    group.userData.info = {
        title: '路灯',
        desc: '校园路灯，提供夜间照明，保障校园安全。',
        image: ''
    };
    group.userData.layer = 'facilities';
    layerGroups.facilities.add(group);
    return group;
}

export function createBench(x, z, rotationY = 0) {
    const group = new THREE.Group();

    const seatGeom = new THREE.BoxGeometry(2.5, 0.12, 0.6);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.7 });
    const seat = new THREE.Mesh(seatGeom, seatMat);
    seat.position.y = 0.55;
    seat.castShadow = true;
    seat.receiveShadow = true;
    group.add(seat);

    const legGeom = new THREE.BoxGeometry(0.15, 0.5, 0.5);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.6 });
    for (let lx of [-1, 1]) {
        for (let lz of [-0.15, 0.15]) {
            const leg = new THREE.Mesh(legGeom, legMat);
            leg.position.set(lx * 1.05, 0.25, lz);
            leg.castShadow = true;
            group.add(leg);
        }
    }

    const backGeom = new THREE.BoxGeometry(2.5, 0.5, 0.1);
    const back = new THREE.Mesh(backGeom, seatMat);
    back.position.set(0, 0.8, -0.3);
    back.rotation.x = 0.15;
    back.castShadow = true;
    group.add(back);

    group.position.set(x, 0, z);
    group.rotation.y = rotationY;
    group.userData.info = {
        title: '长椅',
        desc: '校园休憩长椅，供师生休息交流使用。',
        image: ''
    };
    group.userData.layer = 'facilities';
    layerGroups.facilities.add(group);
    return group;
}

export function createFountain(x, z) {
    const group = new THREE.Group();

    const baseGeom = new THREE.CylinderGeometry(2, 2.2, 0.6, 24);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x999999,
        roughness: 0.4,
        metalness: 0.3
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.3;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const waterGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 24);
    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x4488cc,
        roughness: 0.1,
        metalness: 0.5,
        transparent: true,
        opacity: 0.7
    });
    const water = new THREE.Mesh(waterGeom, waterMat);
    water.position.y = 0.6;
    group.add(water);

    const pillarGeom = new THREE.CylinderGeometry(0.2, 0.3, 2.5, 8);
    const pillar = new THREE.Mesh(pillarGeom, baseMat);
    pillar.position.y = 1.2;
    pillar.castShadow = true;
    group.add(pillar);

    group.position.set(x, 0, z);
    group.userData.info = {
        title: '中心喷泉',
        desc: '校园中心广场喷泉，校园地标性景观，寓意知识的源泉。',
        image: ''
    };
    group.userData.layer = 'facilities';
    layerGroups.facilities.add(group);
    return group;
}
