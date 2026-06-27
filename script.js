const products = [
  {
    name: 'Aureon X1',
    description: 'Adaptive spatial headphones with brushed alloy and memory leather.',
    price: 1299,
    color: 0x00f0ff,
    accent: 0x7c5cff,
    type: 'headphones',
    specs: ['Brushed aerospace alloy frame', 'Memory leather ear cushions', 'Adaptive spatial audio engine']
  },
  {
    name: 'Prism Fold',
    description: 'Glass-and-ceramic AI phone with holographic display surfaces.',
    price: 2199,
    color: 0xff5f93,
    accent: 0x00f0ff,
    type: 'phone',
    specs: ['Liquid glass folding display', 'Neural camera array', 'Ceramic shield body with AI co-processor']
  },
  {
    name: 'Chronos Air',
    description: 'Sapphire wearable with precision steel, fabric loop, and AI vitals.',
    price: 899,
    color: 0xffcb74,
    accent: 0x3ddc97,
    type: 'watch',
    specs: ['Sapphire crystal lens', 'Precision steel body', 'Woven performance fabric loop']
  }
];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const productScenes = [];
let cartTotal = 0;
let activeProductIndex = 0;
let detailSceneApi = null;

const navbar = document.getElementById('navbar');
const cartButton = document.getElementById('cartButton');
const cartCount = document.getElementById('cartCount');
const cartToast = document.getElementById('cartToast');
const detailShowroom = document.getElementById('detailShowroom');
const detailClose = document.getElementById('detailClose');
const detailTitle = document.getElementById('detailTitle');
const detailDescription = document.getElementById('detailDescription');
const detailSpecs = document.getElementById('detailSpecs');

function clamp(value, min, max){
  return Math.max(min, Math.min(max, value));
}

function createMaterial(color, options = {}){
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: options.roughness ?? 0.22,
    metalness: options.metalness ?? 0.45,
    transmission: options.transmission ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    clearcoat: options.clearcoat ?? 0.72,
    clearcoatRoughness: options.clearcoatRoughness ?? 0.18,
    reflectivity: options.reflectivity ?? 0.6
  });
}

function roundedBox(width, height, depth, radius, smoothness){
  if(THREE.RoundedBoxGeometry){
    return new THREE.RoundedBoxGeometry(width, height, depth, smoothness, radius);
  }
  return new THREE.BoxGeometry(width, height, depth, 12, 12, 12);
}

function addEnvironment(scene){
  scene.fog = new THREE.FogExp2(0x05060b, 0.045);
  scene.add(new THREE.HemisphereLight(0xddeeff, 0x111427, 1.35));

  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(4, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const rim = new THREE.PointLight(0x00f0ff, 2.5, 12);
  rim.position.set(-3, 2.5, 3);
  scene.add(rim);

  const violet = new THREE.PointLight(0x7c5cff, 1.9, 10);
  violet.position.set(3, -1.5, 2.5);
  scene.add(violet);

  return { key, rim, violet };
}

function createStage(scene, radius = 1.55){
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 96),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.38 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.42;
  shadow.receiveShadow = true;
  scene.add(shadow);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.72, 0.012, 12, 160),
    createMaterial(0x00f0ff, { roughness: 0.12, metalness: 0.15 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.36;
  scene.add(ring);
  return ring;
}

function createHeadphones(product){
  const group = new THREE.Group();
  const metal = createMaterial(product.color, { metalness: 0.82, roughness: 0.18 });
  const leather = createMaterial(0x11151f, { metalness: 0.08, roughness: 0.5, clearcoat: 0.3 });
  const glass = createMaterial(product.accent, {
    metalness: 0,
    roughness: 0.03,
    transmission: 0.24,
    transparent: true,
    opacity: 0.72
  });

  const band = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.045, 24, 96, Math.PI), metal);
  band.rotation.z = Math.PI;
  band.position.y = 0.22;
  band.scale.y = 1.28;
  group.add(band);

  [-0.82, 0.82].forEach((x) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.28, 72), metal);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(x, -0.44, 0);
    cup.castShadow = true;
    group.add(cup);

    const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.075, 24, 72), leather);
    cushion.rotation.y = Math.PI / 2;
    cushion.position.set(x * 1.01, -0.44, 0);
    cushion.castShadow = true;
    group.add(cushion);

    const disk = new THREE.Mesh(new THREE.CircleGeometry(0.23, 72), glass);
    disk.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2;
    disk.position.set(x * 1.18, -0.44, 0);
    group.add(disk);
  });

  const bridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 1.56, 12, 24), metal);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.y = -0.05;
  group.add(bridge);

  group.scale.setScalar(1.05);
  return group;
}

function createPhone(product){
  const group = new THREE.Group();
  const body = createMaterial(0x111827, { metalness: 0.62, roughness: 0.2 });
  const glass = createMaterial(product.color, {
    metalness: 0,
    roughness: 0.02,
    transmission: 0.32,
    transparent: true,
    opacity: 0.78,
    clearcoat: 1
  });
  const trim = createMaterial(product.accent, { metalness: 0.72, roughness: 0.16 });

  const shell = new THREE.Mesh(roundedBox(1.18, 2.25, 0.12, 0.08, 8), body);
  shell.castShadow = true;
  group.add(shell);

  const screen = new THREE.Mesh(roundedBox(1.05, 2.08, 0.035, 0.07, 8), glass);
  screen.position.z = 0.079;
  group.add(screen);

  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.04, 32), trim);
  hinge.rotation.x = Math.PI / 2;
  hinge.position.x = -0.66;
  group.add(hinge);

  for(let i = 0; i < 3; i++){
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 48), trim);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0.34, 0.62 - i * 0.26, 0.105);
    group.add(lens);
  }

  const holo = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.8), createMaterial(0xffffff, {
    metalness: 0,
    roughness: 0,
    transparent: true,
    opacity: 0.12,
    transmission: 0.12
  }));
  holo.position.z = 0.14;
  group.add(holo);

  group.rotation.z = -0.12;
  return group;
}

function createWatch(product){
  const group = new THREE.Group();
  const steel = createMaterial(product.color, { metalness: 0.82, roughness: 0.17 });
  const glass = createMaterial(0x99f8ff, {
    metalness: 0,
    roughness: 0.02,
    transmission: 0.38,
    transparent: true,
    opacity: 0.64,
    clearcoat: 1
  });
  const fabric = createMaterial(product.accent, { metalness: 0.05, roughness: 0.64, clearcoat: 0.18 });

  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.18, 88), steel);
  face.rotation.x = Math.PI / 2;
  face.castShadow = true;
  group.add(face);

  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.035, 88), glass);
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.11;
  group.add(lens);

  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.012, 12, 96), createMaterial(0x00f0ff, { metalness: 0.2, roughness: 0.08 }));
  inner.position.z = 0.132;
  group.add(inner);

  [-0.74, 0.74].forEach((y) => {
    const strap = new THREE.Mesh(roundedBox(0.38, 0.9, 0.08, 0.05, 8), fabric);
    strap.position.y = y;
    strap.position.z = -0.02;
    strap.castShadow = true;
    group.add(strap);
  });

  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 32), steel);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(0.66, 0, 0);
  group.add(crown);

  group.rotation.z = 0.08;
  return group;
}

function buildProductModel(product){
  if(product.type === 'headphones') return createHeadphones(product);
  if(product.type === 'phone') return createPhone(product);
  return createWatch(product);
}

function setupProductScene(canvas, product, index, isDetail = false){
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(isDetail ? 42 : 38, 1, 0.1, 100);
  camera.position.set(0, isDetail ? 0.3 : 0.18, isDetail ? 4.6 : 5.2);
  const lights = addEnvironment(scene);
  const ring = createStage(scene, isDetail ? 2 : 1.45);
  const model = buildProductModel(product);
  model.traverse((child) => {
    if(child.isMesh){
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(model);

  const particles = new THREE.Group();
  const particleMaterial = createMaterial(product.accent, { roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.68 });
  for(let i = 0; i < (isDetail ? 42 : 18); i++){
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012 + Math.random() * 0.018, 8, 8), particleMaterial);
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.3 + Math.random() * (isDetail ? 1.5 : 0.9);
    dot.position.set(Math.cos(angle) * radius, -0.5 + Math.random() * 1.6, Math.sin(angle) * radius * 0.45);
    dot.userData = { angle, radius, speed: 0.12 + Math.random() * 0.24, baseY: dot.position.y };
    particles.add(dot);
  }
  scene.add(particles);

  const state = {
    hover: false,
    pointerX: 0,
    pointerY: 0,
    targetZoom: isDetail ? 4.1 : 5.2,
    exploded: false,
    materialMode: 0,
    colorMode: 0
  };
  const originalPositions = [];
  model.children.forEach((child) => originalPositions.push(child.position.clone()));

  function resize(){
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width || canvas.clientWidth || 320);
    const height = Math.max(1, rect.height || canvas.clientHeight || 320);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function setHover(value){
    state.hover = value;
    state.targetZoom = value ? (isDetail ? 3.55 : 4.35) : (isDetail ? 4.1 : 5.2);
  }

  function setPointer(clientX, clientY){
    const rect = canvas.getBoundingClientRect();
    state.pointerX = ((clientX - rect.left) / rect.width - 0.5) * 2;
    state.pointerY = ((clientY - rect.top) / rect.height - 0.5) * 2;
  }

  function toggleExploded(){
    state.exploded = !state.exploded;
    model.children.forEach((child, childIndex) => {
      const original = originalPositions[childIndex] || new THREE.Vector3();
      const direction = original.clone();
      if(direction.length() < 0.1){
        direction.set(Math.sin(childIndex), Math.cos(childIndex), Math.sin(childIndex * 1.7));
      }
      direction.normalize().multiplyScalar(state.exploded ? 0.42 : 0);
      gsap.to(child.position, {
        x: original.x + direction.x,
        y: original.y + direction.y,
        z: original.z + direction.z,
        duration: 0.95,
        ease: 'power3.inOut'
      });
    });
  }

  function switchMaterial(){
    state.materialMode = (state.materialMode + 1) % 3;
    model.traverse((child) => {
      if(child.isMesh && child.material && child.material.color){
        child.material.metalness = state.materialMode === 0 ? child.material.metalness : state.materialMode === 1 ? 0.9 : 0.05;
        child.material.roughness = state.materialMode === 2 ? 0.62 : 0.16;
        child.material.needsUpdate = true;
      }
    });
  }

  function morphColor(){
    state.colorMode = (state.colorMode + 1) % 3;
    const palette = [product.color, product.accent, 0xffffff];
    model.traverse((child) => {
      if(child.isMesh && child.material && child.material.color){
        gsap.to(child.material.color, {
          r: new THREE.Color(palette[state.colorMode]).r,
          g: new THREE.Color(palette[state.colorMode]).g,
          b: new THREE.Color(palette[state.colorMode]).b,
          duration: 0.8,
          ease: 'power2.out'
        });
      }
    });
  }

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const speed = reduceMotion ? 0 : 1;

    model.rotation.y += (0.006 + (state.hover ? 0.002 : 0.004)) * speed;
    model.rotation.x += ((state.pointerY * 0.16) - model.rotation.x) * 0.05;
    model.rotation.z += ((-state.pointerX * 0.12) - model.rotation.z) * 0.05;
    model.position.y = Math.sin(t * 1.25 + index) * (state.hover ? 0.12 : 0.18) + (state.hover ? 0.18 : 0);

    particles.rotation.y += 0.0025 * speed;
    particles.children.forEach((dot) => {
      dot.userData.angle += dot.userData.speed * 0.01 * speed;
      dot.position.x = Math.cos(dot.userData.angle) * dot.userData.radius;
      dot.position.z = Math.sin(dot.userData.angle) * dot.userData.radius * 0.45;
      dot.position.y = dot.userData.baseY + Math.sin(t + dot.userData.angle) * 0.08;
    });

    ring.rotation.z += 0.01 * speed;
    ring.scale.setScalar(1 + Math.sin(t * 2) * 0.025);

    camera.position.x += (state.pointerX * (isDetail ? 0.55 : 0.36) - camera.position.x) * 0.055;
    camera.position.y += ((-state.pointerY * (isDetail ? 0.34 : 0.22)) + (isDetail ? 0.25 : 0.12) - camera.position.y) * 0.055;
    camera.position.z += (state.targetZoom - camera.position.z) * 0.055;
    camera.lookAt(0, 0, 0);

    lights.rim.position.x += (state.pointerX * 3.5 - lights.rim.position.x) * 0.08;
    lights.rim.position.y += (-state.pointerY * 2.2 + 1.4 - lights.rim.position.y) * 0.08;
    lights.key.intensity += ((state.hover ? 4.4 : 3.2) - lights.key.intensity) * 0.06;

    renderer.render(scene, camera);
  }

  resize();
  animate();
  window.addEventListener('resize', resize);

  return {
    renderer,
    scene,
    camera,
    model,
    resize,
    setHover,
    setPointer,
    toggleExploded,
    switchMaterial,
    morphColor
  };
}

function setupHeroScene(){
  const canvas = document.getElementById('heroCanvas');
  if(!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);
  addEnvironment(scene);

  const group = new THREE.Group();
  scene.add(group);
  const geometries = [
    new THREE.IcosahedronGeometry(0.9, 1),
    new THREE.TorusKnotGeometry(0.45, 0.14, 96, 16),
    new THREE.OctahedronGeometry(0.7),
    new THREE.TorusGeometry(0.72, 0.08, 18, 96)
  ];
  const colors = [0x00f0ff, 0x7c5cff, 0xff5f93, 0xffcb74, 0x3ddc97];
  for(let i = 0; i < 22; i++){
    const mesh = new THREE.Mesh(
      geometries[i % geometries.length],
      createMaterial(colors[i % colors.length], { roughness: 0.18, metalness: 0.46, transparent: true, opacity: 0.72 })
    );
    const angle = i / 22 * Math.PI * 2;
    mesh.position.set(Math.cos(angle) * (3.2 + Math.random() * 3.2), Math.sin(angle * 1.4) * 2.6, -Math.random() * 4);
    mesh.scale.setScalar(0.35 + Math.random() * 0.7);
    mesh.userData = { angle, speed: 0.1 + Math.random() * 0.25, baseY: mesh.position.y };
    group.add(mesh);
  }

  let pointerX = 0;
  let pointerY = 0;
  window.addEventListener('mousemove', (event) => {
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  function resize(){
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const scroll = window.scrollY * 0.0008;
    group.children.forEach((mesh, i) => {
      mesh.rotation.x += 0.002 + mesh.userData.speed * 0.004;
      mesh.rotation.y += 0.003 + mesh.userData.speed * 0.005;
      mesh.position.y = mesh.userData.baseY + Math.sin(t * mesh.userData.speed + i) * 0.28 - scroll * 2;
      mesh.position.x += (pointerX * 0.018 * (i % 3 + 1));
    });
    group.rotation.y += ((pointerX * 0.16) - group.rotation.y) * 0.04;
    group.rotation.x += ((-pointerY * 0.08) - group.rotation.x) * 0.04;
    renderer.render(scene, camera);
  }
  if(!reduceMotion) animate();
  else renderer.render(scene, camera);
}

function animatePrice(priceEl){
  const target = Number(priceEl.dataset.price);
  if(priceEl.dataset.animated === 'true') return;
  priceEl.dataset.animated = 'true';
  const counter = { value: 0 };
  gsap.to(counter, {
    value: target,
    duration: 1.1,
    ease: 'power2.out',
    onUpdate: () => {
      priceEl.textContent = `$${Math.round(counter.value).toLocaleString()}`;
    }
  });
}

function setupProductCards(){
  document.querySelectorAll('.product-card').forEach((card, index) => {
    const product = products[index];
    const canvas = card.querySelector('.product-canvas');
    const sceneApi = setupProductScene(canvas, product, index);
    productScenes[index] = sceneApi;

    card.addEventListener('mousemove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
      card.style.setProperty('--tilt-x', `${(x - 0.5) * 7}deg`);
      card.style.setProperty('--tilt-y', `${-(y - 0.5) * 7}deg`);
      sceneApi.setPointer(event.clientX, event.clientY);
    });

    card.addEventListener('mouseenter', () => {
      sceneApi.setHover(true);
      animatePrice(card.querySelector('.price'));
      if(window.gsap){
        gsap.fromTo(card.querySelectorAll('.spec-list span'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, ease: 'power2.out' });
        gsap.fromTo(card.querySelectorAll('.btn-card'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.42, stagger: 0.08, ease: 'power3.out' });
      }
    });

    card.addEventListener('mouseleave', () => {
      sceneApi.setHover(false);
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });

    card.querySelector('.inspect-btn').addEventListener('click', (event) => {
      event.stopPropagation();
      openDetail(index, card);
    });

    card.querySelector('.add-btn').addEventListener('click', (event) => {
      event.stopPropagation();
      addToCart(card);
    });

    card.addEventListener('click', () => openDetail(index, card));
  });
}

function openDetail(index, sourceCard){
  activeProductIndex = index;
  const product = products[index];
  detailTitle.textContent = product.name;
  detailDescription.textContent = product.description;
  detailSpecs.innerHTML = product.specs.map((spec) => `<li>${spec}</li>`).join('');
  detailShowroom.classList.add('open');
  detailShowroom.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  if(window.gsap && sourceCard){
    const rect = sourceCard.getBoundingClientRect();
    const clone = document.createElement('div');
    clone.className = 'fly-clone';
    clone.style.left = `${rect.left + rect.width / 2 - 27}px`;
    clone.style.top = `${rect.top + rect.height / 2 - 27}px`;
    document.body.appendChild(clone);
    gsap.to(clone, {
      left: '50%',
      top: '48%',
      scale: 8,
      opacity: 0,
      duration: 0.85,
      ease: 'power4.in',
      onComplete: () => clone.remove()
    });
    gsap.fromTo('.detail-content', { scale: 0.9, y: 70, rotateX: 8 }, { scale: 1, y: 0, rotateX: 0, duration: 0.9, ease: 'power3.out' });
    gsap.fromTo('#detailCanvas', { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 1, delay: 0.16, ease: 'power3.out' });
  }

  const canvas = document.getElementById('detailCanvas');
  if(detailSceneApi){
    detailSceneApi.renderer.dispose();
  }
  detailSceneApi = setupProductScene(canvas, product, index, true);
  setTimeout(() => detailSceneApi.resize(), 80);
}

function closeDetail(){
  detailShowroom.classList.remove('open');
  detailShowroom.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function addToCart(sourceCard){
  cartTotal += 1;
  cartCount.textContent = cartTotal;
  cartButton.classList.remove('bump');
  void cartButton.offsetWidth;
  cartButton.classList.add('bump');

  const source = sourceCard.querySelector('.model-stage').getBoundingClientRect();
  const target = cartButton.getBoundingClientRect();
  const clone = document.createElement('div');
  clone.className = 'fly-clone';
  clone.style.left = `${source.left + source.width / 2 - 27}px`;
  clone.style.top = `${source.top + source.height / 2 - 27}px`;
  document.body.appendChild(clone);

  if(window.gsap){
    gsap.to(clone, {
      left: target.left + target.width / 2 - 27,
      top: target.top + target.height / 2 - 27,
      scale: 0.26,
      rotation: 420,
      duration: 0.85,
      ease: 'power3.inOut',
      onComplete: () => clone.remove()
    });
  } else {
    clone.remove();
  }

  cartToast.classList.add('show');
  clearTimeout(addToCart.toastTimer);
  addToCart.toastTimer = setTimeout(() => cartToast.classList.remove('show'), 2200);
}

function setupScrollAndNav(){
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });
  document.querySelectorAll('.reveal-depth').forEach((el) => revealObserver.observe(el));

  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  function onScroll(){
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    let active = '';
    sections.forEach((section) => {
      if(window.scrollY >= section.offsetTop - 180) active = section.id;
    });
    navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${active}`));
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if(window.gsap && window.ScrollTrigger && !reduceMotion){
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.story-card').forEach((card, i) => {
      gsap.to(card, {
        y: i % 2 ? -32 : 32,
        rotateY: i % 2 ? -4 : 4,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
    gsap.to('.ambient-field', {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true
      }
    });
  }
}

function setupMagneticButtons(){
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('mousemove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

function setupCheckoutPreview(){
  const button = document.getElementById('checkoutButton');
  const demo = document.getElementById('checkoutDemo');
  button.addEventListener('click', () => {
    demo.classList.remove('success');
    void demo.offsetWidth;
    demo.classList.add('success');
  });
}

function setupDetailControls(){
  detailClose.addEventListener('click', closeDetail);
  detailShowroom.addEventListener('click', (event) => {
    if(event.target === detailShowroom || event.target.classList.contains('detail-backdrop')) closeDetail();
  });
  document.addEventListener('keydown', (event) => {
    if(event.key === 'Escape' && detailShowroom.classList.contains('open')) closeDetail();
  });
  document.getElementById('explodeButton').addEventListener('click', () => detailSceneApi?.toggleExploded());
  document.getElementById('materialButton').addEventListener('click', () => detailSceneApi?.switchMaterial());
  document.getElementById('colorButton').addEventListener('click', () => detailSceneApi?.morphColor());
  document.getElementById('detailCanvas').addEventListener('mousemove', (event) => detailSceneApi?.setPointer(event.clientX, event.clientY));
}

function boot(){
  if(!window.THREE){
    document.body.classList.add('no-webgl');
    return;
  }
  setupHeroScene();
  setupProductCards();
  setupScrollAndNav();
  setupMagneticButtons();
  setupCheckoutPreview();
  setupDetailControls();
}

window.addEventListener('DOMContentLoaded', boot);
