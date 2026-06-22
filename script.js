
const roles = ["Full-Stack Web Developer","Frontend Developer","Backend Engineer","Freelance Problem Solver"];
const typedEl = document.getElementById('typed');
let rIdx = 0, cIdx = 0, deleting = false;
function typeLoop(){
  const word = roles[rIdx];
  if(!deleting){
    cIdx++;
    typedEl.textContent = word.slice(0, cIdx);
    if(cIdx === word.length){ deleting = true; setTimeout(typeLoop, 1400); return; }
  } else {
    cIdx--;
    typedEl.textContent = word.slice(0, cIdx);
    if(cIdx === 0){ deleting = false; rIdx = (rIdx + 1) % roles.length; }
  }
  setTimeout(typeLoop, deleting ? 35 : 65);
}
typeLoop();

const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting){
      e.target.classList.add('in');
      io.unobserve(e.target);
      e.target.querySelectorAll('[data-count]').forEach(el => {
        const target = +el.dataset.count;
        let current = 0;
        const step = Math.ceil(target / 30);
        const timer = setInterval(() => {
          current += step;
          if(current >= target){ current = target; clearInterval(timer); }
          el.textContent = current + '+';
        }, 40);
      });
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

const navbar = document.getElementById('navbar');
const floatHire = document.getElementById('floatHire');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  floatHire.classList.toggle('visible', window.scrollY > 500);
});

const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => {
  const open = burger.classList.toggle('open');
  mobileMenu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
  mobileMenu.setAttribute('aria-hidden', !open);
  document.body.style.overflow = open ? 'hidden' : '';
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
});

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if(window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  navLinks.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
});

(function(){
  const canvas = document.getElementById('hero-canvas');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 9;

  function resize(){
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = [0xFF5D73, 0xFFC83D, 0x3DFFC4, 0x6E3AFF];
  const geos = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.TorusGeometry(0.8, 0.28, 16, 60),
    new THREE.BoxGeometry(1.3, 1.3, 1.3),
    new THREE.OctahedronGeometry(1.1, 0),
    new THREE.TorusKnotGeometry(0.7, 0.22, 80, 12),
    new THREE.IcosahedronGeometry(0.7, 0)
  ];

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 1);
  dir.position.set(5, 5, 8);
  scene.add(dir);
  const dir2 = new THREE.DirectionalLight(0x6E3AFF, 0.6);
  dir2.position.set(-5, -3, 2);
  scene.add(dir2);

  const shapes = [];
  const count = 7;
  for(let i = 0; i < count; i++){
    const mesh = new THREE.Mesh(
      geos[i % geos.length],
      new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 0.35, metalness: 0.15, flatShading: true
      })
    );
    const angle = (i / count) * Math.PI * 2;
    const radius = 4.6;
    mesh.position.set(
      Math.cos(angle) * radius * (window.innerWidth > 900 ? 1 : 0.55) + (window.innerWidth > 900 ? 1.6 : 0),
      Math.sin(angle) * 2.6,
      (Math.random() - 0.5) * 3
    );
    mesh.scale.setScalar(0.55 + Math.random() * 0.55);
    mesh.userData = {
      speed: 0.2 + Math.random() * 0.3,
      floatOffset: Math.random() * Math.PI * 2,
      baseY: mesh.position.y,
      baseX: mesh.position.x
    };
    scene.add(mesh);
    shapes.push(mesh);
  }

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    shapes.forEach((mesh, i) => {
      mesh.rotation.x = t * 0.25 * mesh.userData.speed + i;
      mesh.rotation.y = t * 0.32 * mesh.userData.speed;
      mesh.position.y = mesh.userData.baseY + Math.sin(t * mesh.userData.speed + mesh.userData.floatOffset) * 0.4;
      mesh.position.x = mesh.userData.baseX + mouseX * 0.4;
    });
    camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  if(!reduceMotion) animate();
  else renderer.render(scene, camera);
})();
