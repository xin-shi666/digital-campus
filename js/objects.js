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
