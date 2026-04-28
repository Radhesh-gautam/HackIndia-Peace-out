import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';

// ==========================================
// 1. STATE & DOM ELEMENTS
// ==========================================
let arrowGroup = null;
let particleSystem = null;
let isTracking = false;
let compassHeading = 0;
let arrowVisible = false;

const startBtn = document.getElementById('start-btn');
const startScreen = document.getElementById('start-screen');
const webcamVideo = document.getElementById('webcam-video');
const headingValText = document.getElementById('heading-val');
const appContainer = document.getElementById('app');

// Orientation data for camera control
let deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };
let screenOrientation = 0;

// ==========================================
// 2. WEBCAM SETUP
// ==========================================
async function initWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    webcamVideo.srcObject = stream;
    webcamVideo.classList.add('active');
  } catch (err) {
    console.warn("Webcam access denied or unavailable. Running in 3D-only mode.");
  }
}

// ==========================================
// 3. THREE.JS SCENE SETUP
// ==========================================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Camera is at origin in world space
camera.position.set(0, 0, 0); 

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // More realistic PBR lighting
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
appContainer.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.bias = -0.001;
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0x00ffff, 2, 5);
scene.add(pointLight);

// Invisible ground plane to catch shadows
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.ShadowMaterial({ opacity: 0.5 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.5; // About 1.5 meters below camera
ground.receiveShadow = true;
scene.add(ground);

// ==========================================
// 4. POST-PROCESSING (NEON BLOOM)
// ==========================================
const renderScene = new RenderPass(scene, camera);
renderScene.clear = true;

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,  // strength
  0.8,  // radius
  0.4   // threshold - only glow bright things
);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// ==========================================
// 5. ARROW CREATION (PBR MATERIAL)
// ==========================================
function createArrow() {
  arrowGroup = new THREE.Group();

  // PBR Material: Metallic and shiny with glowing edges
  const arrowMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x111111,          // Dark metallic core
    emissive: 0x00ffff,       // Cyan glow
    emissiveIntensity: 0.8,   // Subtle glow by default
    metalness: 0.9,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  // Shaft (Cylinder)
  const shaftGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 32);
  const shaft = new THREE.Mesh(shaftGeometry, arrowMaterial);
  shaft.position.y = 0.75;
  shaft.castShadow = true;

  // Head (Cone)
  const headGeometry = new THREE.ConeGeometry(0.3, 0.8, 32);
  const head = new THREE.Mesh(headGeometry, arrowMaterial);
  head.position.y = 1.9; // Top of the shaft
  head.castShadow = true;

  const arrowMeshGroup = new THREE.Group();
  arrowMeshGroup.add(shaft);
  arrowMeshGroup.add(head);
  arrowMeshGroup.rotation.x = Math.PI / 2; // Point forward

  arrowGroup.add(arrowMeshGroup);

  // Initial State: Hidden
  arrowGroup.visible = false;
  arrowGroup.scale.set(0, 0, 0);

  scene.add(arrowGroup);
}

// ==========================================
// 6. PARTICLE TRAIL
// ==========================================
const maxParticles = 50;
let particleGeometry;
let particlePositions;
let particleAges;

function createParticles() {
  particleGeometry = new THREE.BufferGeometry();
  particlePositions = new Float32Array(maxParticles * 3);
  particleAges = new Float32Array(maxParticles);
  
  for(let i=0; i<maxParticles; i++) {
    particlePositions[i*3] = 0;
    particlePositions[i*3+1] = 0;
    particlePositions[i*3+2] = 100;
    particleAges[i] = 0;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 0.08,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);
}

let particleIndex = 0;
function updateParticles(delta) {
  if (!arrowVisible || !arrowGroup) return;

  const arrowWorldPos = new THREE.Vector3();
  arrowGroup.getWorldPosition(arrowWorldPos);

  const backwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(arrowGroup.quaternion);
  arrowWorldPos.addScaledVector(backwardDir, 1.0); // Emit from back of arrow

  particlePositions[particleIndex * 3] = arrowWorldPos.x + (Math.random() - 0.5) * 0.1;
  particlePositions[particleIndex * 3 + 1] = arrowWorldPos.y + (Math.random() - 0.5) * 0.1;
  particlePositions[particleIndex * 3 + 2] = arrowWorldPos.z + (Math.random() - 0.5) * 0.1;
  particleAges[particleIndex] = 1.0; 

  particleIndex = (particleIndex + 1) % maxParticles;

  const positions = particleGeometry.attributes.position.array;
  for (let i = 0; i < maxParticles; i++) {
    if (particleAges[i] > 0) {
      particleAges[i] -= delta * 0.8;
      // Drift slightly up
      positions[i * 3 + 1] += delta * 0.2;
      if (particleAges[i] <= 0) {
        positions[i * 3 + 2] = 100; 
      }
    }
  }
  
  particleGeometry.attributes.position.needsUpdate = true;
}

// ==========================================
// 7. COMPASS & DEVICE ORIENTATION
// ==========================================
function initOrientation() {
  window.addEventListener('orientationchange', () => {
    screenOrientation = window.orientation || 0;
  });

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientationabsolute', handleOrientation, false);
    window.addEventListener('deviceorientation', handleOrientation, false);
  }
}

function handleOrientation(event) {
  let alpha = 0;

  if (event.webkitCompassHeading) {
    alpha = event.webkitCompassHeading;
  } else if (event.absolute && event.alpha !== null) {
    alpha = 360 - event.alpha;
  } else {
    alpha = 360 - (event.alpha || 0);
  }

  compassHeading = alpha;
  headingValText.innerText = Math.round(compassHeading);

  // Store orientation for camera update
  deviceOrientation.alpha = event.alpha ? THREE.MathUtils.degToRad(event.alpha) : 0;
  deviceOrientation.beta = event.beta ? THREE.MathUtils.degToRad(event.beta) : 0;
  deviceOrientation.gamma = event.gamma ? THREE.MathUtils.degToRad(event.gamma) : 0;
}

// Custom function to apply device orientation to camera
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); 
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), Math.sqrt(0.5), 0, 0); 
const zee = new THREE.Vector3(0, 0, 1);

function updateCameraRotation() {
  // If not on mobile/no sensor data, camera stays at default
  if (deviceOrientation.alpha === 0 && deviceOrientation.beta === 0 && deviceOrientation.gamma === 0) {
    return;
  }

  const alpha = deviceOrientation.alpha;
  const beta = deviceOrientation.beta;
  const gamma = deviceOrientation.gamma;
  const orient = screenOrientation ? THREE.MathUtils.degToRad(screenOrientation) : 0;

  euler.set(beta, alpha, -gamma, 'YXZ');
  camera.quaternion.setFromEuler(euler);
  camera.quaternion.multiply(q1);
  camera.quaternion.multiply(q0.setFromAxisAngle(zee, -orient));
}

// ==========================================
// 8. ANIMATION LOOP & ROTATION
// ==========================================
const clock = new THREE.Clock();
let targetArrowRotationY = 0;

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // 1. Update Camera Rotation from phone gyro (3DOF Tracking)
  updateCameraRotation();

  // 2. Update Arrow 
  if (arrowGroup && arrowVisible) {
    // Arrow is anchored in world space.
    // It should point North. The world's North isn't necessarily aligned with ThreeJS -Z 
    // depending on where the user started, but since we map compassHeading directly:
    
    // Convert compass heading to radians (0 is North)
    targetArrowRotationY = THREE.MathUtils.degToRad(compassHeading);
    
    // Smooth lerp for rotation to avoid jitter
    arrowGroup.rotation.y = THREE.MathUtils.lerp(arrowGroup.rotation.y, targetArrowRotationY, delta * 5);
    
    // Gentle hover animation (world space Y axis)
    arrowGroup.position.y = Math.sin(clock.elapsedTime * 2) * 0.1;

    // Place the point light near the arrow for glow effect on ground
    pointLight.position.copy(arrowGroup.position);
    pointLight.position.y += 0.5;
  }

  updateParticles(delta);

  // Render using composer for bloom
  composer.render();
}

// ==========================================
// 9. RESIZE HANDLER
// ==========================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// 10. INTERACTION ("L" KEY)
// ==========================================
window.addEventListener('keydown', (e) => {
  if (e.key === 'l' || e.key === 'L') {
    if (!isTracking) return; 
    
    if (!arrowVisible) {
      arrowVisible = true;
      arrowGroup.visible = true;

      // Spawn arrow 2 meters directly in front of where the camera is CURRENTLY looking
      // This separates camera space and world space: the arrow is placed in the world.
      const forwardDir = new THREE.Vector3(0, 0, -1);
      forwardDir.applyQuaternion(camera.quaternion); // Get camera's looking direction
      forwardDir.y = 0; // Keep it level horizontally
      forwardDir.normalize();

      // Position = Camera Pos (0,0,0) + Forward * 2 meters
      arrowGroup.position.copy(forwardDir).multiplyScalar(2);
      arrowGroup.position.y = 0; // Start at eye level (or ground level relative to camera)

      // Animate in
      arrowGroup.scale.set(0, 0, 0);
      gsap.to(arrowGroup.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: "elastic.out(1, 0.5)" });

      // Pulse emissive material
      const mat = arrowGroup.children[0].children[0].material;
      gsap.fromTo(mat, { emissiveIntensity: 5.0 }, { emissiveIntensity: 0.8, duration: 1.5 });

    } else {
      arrowVisible = false;
      gsap.to(arrowGroup.scale, { x: 0, y: 0, z: 0, duration: 0.5, ease: "back.in(1.5)", onComplete: () => {
        arrowGroup.visible = false;
      }});
    }
  }
});

// ==========================================
// 11. INITIALIZATION
// ==========================================
startBtn.addEventListener('click', async () => {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const permissionState = await DeviceOrientationEvent.requestPermission();
      if (permissionState !== 'granted') {
        alert("Permission to access device orientation was denied.");
      }
    } catch (e) {
      console.error(e);
    }
  }

  initWebcam();
  initOrientation();
  startScreen.style.opacity = '0';
  setTimeout(() => { startScreen.style.display = 'none'; }, 500);
  isTracking = true;
});

createArrow();
createParticles();
animate();
