import * as THREE from 'three';

let scene, renderer;
let ambientLight, directionalLight;

export function createScene() {
    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 60, 200);

    // 渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 环境光
    ambientLight = new THREE.AmbientLight(0x404060, 1.2);
    scene.add(ambientLight);

    // 主方向光（模拟太阳）
    directionalLight = new THREE.DirectionalLight(0xfff0dd, 3.5);
    directionalLight.position.set(40, 60, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);

    // 补光
    const fillLight = new THREE.DirectionalLight(0x8899cc, 0.8);
    fillLight.position.set(-20, 10, -15);
    scene.add(fillLight);

    // 地面
    const groundGeom = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x3d5a3c,
        roughness: 0.9,
        metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    ground.name = 'ground';
    scene.add(ground);

    // 地面网格辅助线
    const gridHelper = new THREE.GridHelper(120, 40, 0x444444, 0x333333);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // 天空球
    const skyGeom = new THREE.SphereGeometry(100, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: {
            topColor: { value: new THREE.Color(0x0077ff) },
            bottomColor: { value: new THREE.Color(0xffffff) },
            offset: { value: 20 },
            exponent: { value: 0.6 }
        },
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `,
        side: THREE.BackSide,
        depthWrite: false
    });
    const sky = new THREE.Mesh(skyGeom, skyMat);
    sky.name = 'sky';
    scene.add(sky);

    return { scene, renderer };
}

export function getScene() { return scene; }
export function getRenderer() { return renderer; }

export function onResize(camera) {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
