import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let controls, raycaster, mouse;
let clickableObjects = [];
let onObjectClick = null;

export function createControls(camera, renderer) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 5, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 8;
    controls.maxDistance = 90;
    controls.maxPolarAngle = Math.PI / 2 + 0.3;
    controls.minPolarAngle = 0.1;
    controls.update();

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    return controls;
}

export function getControls() { return controls; }

export function setClickableObjects(objects) {
    clickableObjects = objects;
}

export function onObjectClicked(callback) {
    onObjectClick = callback;
}

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, controls.object);
    const intersects = raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj && !obj.userData.info) {
            obj = obj.parent;
        }
        if (obj && obj.userData.info && onObjectClick) {
            onObjectClick(obj.userData.info);
        }
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, controls.object);
    const intersects = raycaster.intersectObjects(clickableObjects, true);

    controls.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
}
