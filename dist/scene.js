import * as THREE from './vendor/three.module.min.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

const host = document.querySelector('#scene-container');
const visual = document.querySelector('.hero-visual');
const explodeButton = document.querySelector('#explode-scene');
const resetButton = document.querySelector('#reset-scene');
const hint = document.querySelector('#scene-hint');

function fallback() {
  visual.classList.remove('webgl-ready');
  explodeButton.hidden = true;
  resetButton.hidden = true;
  hint.textContent = 'HẠ TẦNG / GÓC NHÌN MINH HỌA';
}

try {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  renderer.setClearColor(0x10131b, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Cụm máy chủ 3D. Kéo ngang hoặc dùng phím mũi tên để xoay. Phím Home đặt lại góc nhìn.');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 80);
  camera.position.set(8, 6.8, 10);
  camera.lookAt(0, -0.05, 0);
  scene.add(new THREE.HemisphereLight(0xd9e6ff, 0x171e2d, 3));
  const keyLight = new THREE.DirectionalLight(0xfff3db, 4.2);
  keyLight.position.set(-5, 9, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -6;
  keyLight.shadow.camera.right = 6;
  keyLight.shadow.camera.top = 6;
  keyLight.shadow.camera.bottom = -6;
  keyLight.shadow.normalBias = 0.04;
  keyLight.shadow.bias = -0.0002;
  keyLight.shadow.radius = 4;
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x819dff, 3.2);
  rimLight.position.set(7, 4, -6);
  scene.add(rimLight);
  const orangeLight = new THREE.PointLight(0xff794a, 10, 8);
  orangeLight.position.set(-2, 2, 1);
  scene.add(orangeLight);

  const palette = {
    dark: new THREE.MeshStandardMaterial({ color: 0x3a4651, roughness: .48, metalness: .45 }),
    darker: new THREE.MeshStandardMaterial({ color: 0x202936, roughness: .55, metalness: .35 }),
    edge: new THREE.MeshStandardMaterial({ color: 0x8493a4, roughness: .42, metalness: .5 }),
    cream: new THREE.MeshStandardMaterial({ color: 0x798a9b, roughness: .65, metalness: .15 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xee693b, roughness: .35, metalness: .23 }),
    black: new THREE.MeshStandardMaterial({ color: 0x0f1816, roughness: .8 }),
    led: new THREE.MeshStandardMaterial({ color: 0xc3e99e, emissive: 0xa7d681, emissiveIntensity: .8, roughness: .5 }),
    orangeLed: new THREE.MeshStandardMaterial({ color: 0xff9e62, emissive: 0xff7a3a, emissiveIntensity: .7 }),
  };
  const world = new THREE.Group();
  scene.add(world);
  const geometryCache = new Map();
  function rounded(width, height, depth, radius = .035) {
    const key = `${width},${height},${depth},${radius}`;
    if (!geometryCache.has(key)) geometryCache.set(key, new RoundedBoxGeometry(width, height, depth, 2, radius));
    return geometryCache.get(key);
  }
  function box(parent, w, h, d, material, x = 0, y = 0, z = 0, radius = .035) {
    const mesh = new THREE.Mesh(rounded(w, h, d, radius), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = w * h * d > .1;
    mesh.receiveShadow = h > .1;
    parent.add(mesh);
    return mesh;
  }
  function line(parent, points, color, opacity = 1) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
    parent.add(mesh);
    return mesh;
  }

  // A matte plinth and etched traces ground the floating cluster.
  box(world, 5.05, .17, 4.3, palette.cream, 0, -1.62, 0, .08);
  box(world, 4.78, .12, 4.04, palette.edge, 0, -1.76, 0, .06);
  const gridY = -1.525;
  for (let n = -2; n <= 2; n += .5) {
    line(world, [[n, gridY, -1.9], [n, gridY, 1.9]], 0x8c9b7a, .3);
    line(world, [[-2.35, gridY, n * .88], [2.35, gridY, n * .88]], 0x8c9b7a, .3);
  }
  [[-2.23, -1.82], [2.23, -1.82], [-2.23, 1.82], [2.23, 1.82]].forEach(([x, z]) => {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .025, 16), palette.edge);
    screw.position.set(x, gridY + .015, z);
    world.add(screw);
  });
  const traceColor = 0xdb7950;
  line(world, [[-2, gridY + .01, 1], [-1.55, gridY + .01, 1], [-1.55, gridY + .01, .2], [-.5, gridY + .01, .2]], traceColor);
  line(world, [[1.2, gridY + .01, -.7], [1.85, gridY + .01, -.7], [1.85, gridY + .01, -1.55]], traceColor);

  // Four detailed server layers can separate to expose the construction.
  const layers = [];
  for (let i = 0; i < 4; i++) {
    const layer = new THREE.Group();
    layer.position.set(.1, -.98 + i * .58, .08);
    layer.userData.baseY = layer.position.y;
    world.add(layer);
    layers.push(layer);
    const material = i === 3 ? palette.orange : palette.dark;
    box(layer, 2.6, .47, 2.06, material, 0, 0, 0, .065);
    box(layer, 2.39, .31, .045, palette.darker, 0, -.005, 1.041, .018);
    // Vent rows, hot-swap drive faces, status lights and side handles.
    for (let v = 0; v < 11; v++) {
      box(layer, .045, .165, .026, palette.edge, -.96 + v * .109, .005, 1.071, .008);
    }
    box(layer, .47, .21, .04, palette.black, .72, 0, 1.08, .013);
    box(layer, .33, .035, .013, palette.edge, .72, .02, 1.109, .006);
    [.6, .72, .84].forEach((x, j) => box(layer, .035, .035, .016, j === 0 ? palette.orangeLed : palette.led, x, -.055, 1.11, .006));
    for (const x of [-1.21, 1.21]) box(layer, .055, .21, .09, palette.edge, x, 0, 1.06, .012);
    for (let v = 0; v < 8; v++) box(layer, .024, .12, .075, i === 3 ? palette.darker : palette.black, 1.302, -.01, -.65 + v * .16, .007);
    box(layer, 2.3, .025, 1.74, i === 3 ? palette.orange : palette.edge, 0, .242, -.01, .02);
    if (i < 3) {
      box(layer, .52, .028, .5, palette.black, -.4, .261, -.15, .025);
      for (let chip = 0; chip < 4; chip++) box(layer, .17, .03, .4, palette.darker, .13 + chip * .22, .263, -.15, .01);
    }
  }
  const topLayer = layers[3];
  box(topLayer, 1.08, .04, .98, palette.darker, 0, .29, -.08, .05);
  box(topLayer, .75, .055, .69, palette.edge, 0, .33, -.08, .035);
  for (let i = 0; i < 7; i++) {
    const p = -.36 + i * .12;
    box(topLayer, .055, .03, .13, palette.cream, p, .307, .48, .008);
    box(topLayer, .055, .03, .13, palette.cream, p, .307, -.64, .008);
    box(topLayer, .13, .03, .055, palette.cream, -.6, .307, p - .08, .008);
    box(topLayer, .13, .03, .055, palette.cream, .6, .307, p - .08, .008);
  }
  const chipGlyph = new THREE.Group();
  chipGlyph.position.set(0, .367, -.08);
  chipGlyph.rotation.x = -Math.PI / 2;
  topLayer.add(chipGlyph);
  const glyphMaterial = new THREE.MeshBasicMaterial({ color: 0xcedfb9 });
  const glyphRing = new THREE.Mesh(new THREE.TorusGeometry(.18, .012, 5, 24), glyphMaterial);
  chipGlyph.add(glyphRing);
  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7;
    line(chipGlyph, [[0, 0, 0], [Math.cos(a) * .26, Math.sin(a) * .26, 0]], 0xcedfb9);
  }

  // A secondary node and a tiny network switch complete the cluster silhouette.
  const satellite = new THREE.Group();
  satellite.position.set(-1.78, -.95, -.65);
  world.add(satellite);
  box(satellite, .67, 1.03, 1.04, palette.cream, 0, 0, 0, .045);
  box(satellite, .51, .87, .045, palette.edge, 0, 0, .54, .02);
  for (let i = 0; i < 6; i++) box(satellite, .35, .045, .03, palette.darker, 0, .29 - i * .1, .57, .007);
  box(satellite, .04, .04, .03, palette.orangeLed, .18, -.33, .57, .007);
  const switchNode = new THREE.Group();
  switchNode.position.set(1.67, -1.25, 1.02);
  world.add(switchNode);
  box(switchNode, .8, .38, .7, palette.orange, 0, 0, 0, .04);
  for (let i = 0; i < 3; i++) {
    box(switchNode, .13, .1, .02, palette.black, -.23 + i * .23, -.02, .36, .01);
    box(switchNode, .04, .02, .02, palette.led, -.23 + i * .23, .07, .36, .003);
  }
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.75, -1.4, .1), new THREE.Vector3(-1.72, -1.44, .8),
    new THREE.Vector3(-1.5, -1.44, 1.35), new THREE.Vector3(-.95, -1.4, 1.36),
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 24, .025, 6, false), palette.orange);
  world.add(cable);

  // Orbital paths and packets are illustrative network activity, not live metrics.
  const orbitGroup = new THREE.Group();
  orbitGroup.position.y = .15;
  orbitGroup.rotation.set(.18, 0, -.24);
  world.add(orbitGroup);
  const orbitPoints = [];
  for (let i = 0; i <= 180; i++) {
    const t = i * Math.PI * 2 / 180;
    orbitPoints.push([Math.cos(t) * 3.05, Math.sin(t) * .38, Math.sin(t) * 2.52]);
  }
  line(orbitGroup, orbitPoints, 0xe87544, .72);
  const orbitPackets = [];
  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(i === 0 ? .09 : .055, 12, 8), i === 0 ? palette.orange : palette.cream);
    orbitGroup.add(mesh);
    orbitPackets.push(mesh);
  }
  const dottedOrbit = new THREE.Group();
  dottedOrbit.position.y = .25;
  dottedOrbit.rotation.set(-.38, .4, .5);
  world.add(dottedOrbit);
  for (let i = 0; i < 72; i++) {
    const t = i * Math.PI * 2 / 72;
    const n = t + .02;
    line(dottedOrbit, [[Math.cos(t) * 2.9, .15, Math.sin(t) * 2.9], [Math.cos(n) * 2.9, .15, Math.sin(n) * 2.9]], 0x829377, .35);
  }

  // Soft contact shadow, independent of the rotating model.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const context = shadowCanvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 10, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0,3,12,.45)');
  gradient.addColorStop(.5, 'rgba(0,3,12,.22)');
  gradient.addColorStop(1, 'rgba(0,3,12,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 7), shadowMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.9;
  scene.add(ground);

  let paused = document.documentElement.classList.contains('motion-paused') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;
  let contextLost = false;
  let frameId = 0;
  let lastTime = 0;
  let elapsed = 0;
  let targetRotation = -.22;
  let exploded = false;
  let expansion = 0;
  let dragging = false;
  let pointerX = 0;
  let lastInteraction = -20;
  world.rotation.y = targetRotation;

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    // Preserve horizontal room for the orbit at every viewport size.
    const halfHeight = Math.max(3.85, 3.95 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    schedule();
  }
  function applyExpansion(amount) {
    layers.forEach((layer, i) => { layer.position.y = layer.userData.baseY + amount * ((i - 1.2) * .42); });
  }
  function render(time = 0) {
    frameId = 0;
    if (contextLost || !visible || document.hidden) return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, .04) : 0;
    lastTime = time;
    if (!paused) elapsed += delta;
    if (!paused && !dragging && elapsed - lastInteraction > 4) targetRotation += delta * .055;
    const smooth = paused ? 1 : 1 - Math.exp(-delta * 8);
    world.rotation.y += (targetRotation - world.rotation.y) * smooth;
    expansion += ((exploded ? 1 : 0) - expansion) * (paused ? 1 : 1 - Math.exp(-delta * 5));
    applyExpansion(expansion);
    world.position.y = paused ? 0 : Math.sin(elapsed * .8) * .055;
    for (let i = 0; i < orbitPackets.length; i++) {
      const t = elapsed * .35 + i * Math.PI * 2 / 3;
      orbitPackets[i].position.set(Math.cos(t) * 3.05, Math.sin(t) * .38, Math.sin(t) * 2.52);
    }
    renderer.render(scene, camera);
    if (!paused) schedule();
  }
  function schedule() { if (!frameId && visible && !document.hidden && !contextLost) frameId = requestAnimationFrame(render); }
  renderer.domElement.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    dragging = true;
    pointerX = event.clientX;
    lastInteraction = elapsed;
    renderer.domElement.setPointerCapture(event.pointerId);
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (!dragging) return;
    targetRotation += (event.clientX - pointerX) * .009;
    pointerX = event.clientX;
    lastInteraction = elapsed;
    schedule();
  });
  function endDrag() { dragging = false; lastInteraction = elapsed; }
  renderer.domElement.addEventListener('pointerup', endDrag);
  renderer.domElement.addEventListener('pointercancel', endDrag);
  renderer.domElement.addEventListener('lostpointercapture', endDrag);
  renderer.domElement.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      targetRotation += event.key === 'ArrowLeft' ? -.2 : .2;
      lastInteraction = elapsed;
      schedule();
    } else if (event.key === 'Home') { event.preventDefault(); resetScene(); }
  });
  function setExploded(value) {
    exploded = value;
    explodeButton.setAttribute('aria-pressed', String(value));
    explodeButton.innerHTML = value ? 'Gộp lớp <span aria-hidden="true">⌘</span>' : 'Tách lớp <span aria-hidden="true">⌘</span>';
    lastInteraction = elapsed;
    schedule();
  }
  function resetScene() {
    targetRotation = -.22;
    if (Math.abs(world.rotation.y) > Math.PI * 2) world.rotation.y %= Math.PI * 2;
    setExploded(false);
  }
  explodeButton.addEventListener('click', () => setExploded(!exploded));
  resetButton.addEventListener('click', resetScene);
  window.addEventListener('portfolio-motion', event => {
    paused = event.detail.paused;
    lastTime = 0;
    schedule();
  });
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { lastTime = 0; schedule(); }
  }, { rootMargin: '100px' }).observe(host);
  document.addEventListener('visibilitychange', () => { lastTime = 0; schedule(); });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    fallback();
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    visual.classList.add('webgl-ready');
    explodeButton.hidden = resetButton.hidden = false;
    hint.textContent = '↔ KÉO ĐỂ XOAY MÔ HÌNH';
    schedule();
  });
  resize();
  renderer.render(scene, camera);
  visual.classList.add('webgl-ready');
  explodeButton.disabled = resetButton.disabled = false;
  schedule();
} catch (error) {
  host.querySelector('canvas')?.remove();
  fallback();
  console.warn('Không thể khởi tạo WebGL; đang hiển thị hình minh họa tĩnh.', error);
}
