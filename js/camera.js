import * as THREE from 'three';

const views = {
    perspective: { pos: [40, 35, 50], target: [0, 5, 0] },
    top:        { pos: [0, 65, 2], target: [0, 0, 0] },
    front:      { pos: [0, 10, 60], target: [0, 5, 0] },
    side:       { pos: [60, 10, 0], target: [0, 5, 0] }
};

let camera, cameraTarget;
let animating = false;
let animStart = { x: 0, y: 0, z: 0 };
let animEnd = { x: 0, y: 0, z: 0 };
let animDuration = 1.2;
let animElapsed = 0;

export function createCamera() {
    camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.5,
        300
    );
    camera.position.set(...views.perspective.pos);
    camera.lookAt(...views.perspective.target);
    cameraTarget = new THREE.Vector3(...views.perspective.target);
    return camera;
}

export function getCamera() { return camera; }
export function getCameraTarget() { return cameraTarget; }

export function switchView(viewName, controls) {
    const view = views[viewName];
    if (!view) return;

    cameraTarget.set(...view.target);

    animStart.x = camera.position.x;
    animStart.y = camera.position.y;
    animStart.z = camera.position.z;
    animEnd.x = view.pos[0];
    animEnd.y = view.pos[1];
    animEnd.z = view.pos[2];
    animElapsed = 0;
    animating = true;

    if (controls) {
        controls.target.copy(cameraTarget);
    }

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
}

export function updateCameraAnimation(delta) {
    if (!animating) return;

    animElapsed += delta;
    const t = Math.min(animElapsed / animDuration, 1.0);
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    camera.position.set(
        animStart.x + (animEnd.x - animStart.x) * ease,
        animStart.y + (animEnd.y - animStart.y) * ease,
        animStart.z + (animEnd.z - animStart.z) * ease
    );

    if (t >= 1.0) {
        animating = false;
    }
}
