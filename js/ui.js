import { getLayerGroups } from './objects.js';
import { switchView } from './camera.js';

let controlsRef = null;

export function initUI(controls) {
    controlsRef = controls;

    const layerGroups = getLayerGroups();

    document.getElementById('layer-buildings').addEventListener('change', (e) => {
        layerGroups.buildings.visible = e.target.checked;
    });
    document.getElementById('layer-roads').addEventListener('change', (e) => {
        layerGroups.roads.visible = e.target.checked;
    });
    document.getElementById('layer-vegetation').addEventListener('change', (e) => {
        layerGroups.vegetation.visible = e.target.checked;
    });
    document.getElementById('layer-facilities').addEventListener('change', (e) => {
        layerGroups.facilities.visible = e.target.checked;
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.view, controlsRef);
        });
    });

    document.getElementById('info-close').addEventListener('click', hideInfoPanel);
    document.getElementById('info-panel').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) hideInfoPanel();
    });
}

export function showInfoPanel(info) {
    const panel = document.getElementById('info-panel');
    document.getElementById('info-title').textContent = info.title;
    document.getElementById('info-desc').textContent = info.desc;
    const img = document.getElementById('info-image');
    if (info.image) {
        img.src = info.image;
        img.style.display = 'block';
    } else {
        img.style.display = 'none';
    }
    panel.classList.remove('hidden');
}

export function hideInfoPanel() {
    document.getElementById('info-panel').classList.add('hidden');
}

export function hideLoading() {
    const loading = document.getElementById('loading');
    loading.classList.add('hidden');
    setTimeout(() => loading.remove(), 600);
}
