let scene, camera, renderer, particles;
let audioContext, analyser, dataArray;
let isAudioInitialized = false;
let uniforms;
let init =()=> {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#000000")
  

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
  );
  renderer = new THREE.WebGLRenderer({ antialias: true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  uniforms = {
    uTime: { value: 0 },
    uAudioLow: { value: 0 },
    uAudioMid: { value: 0 },
    uAudioHigh: { value: 0 }
  };
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const particleCount = 100000;
  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.cbrt(Math.random()) * 2;
    positions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  const vertexShader = document.getElementById("vertexShader").textContent;
  const fragmentShader = document.getElementById("fragmentShader").textContent;
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    depthWrite: false,
    // blending: THREE.AdditiveBlending
  });
  particles = new THREE.Points(geometry, material);
  scene.add(particles);
  camera.position.z = 1;
  
}
let onMouseMove =(event)=> {
  const rotationSpeed = 0.001;
  camera.position.x = Math.sin(event.clientX * rotationSpeed) * 5;
  camera.position.z = Math.cos(event.clientX * rotationSpeed) * 5;
  camera.lookAt(scene.position);
}
let onTouchMove=(event)=> {
  event.preventDefault();
  const touch = event.touches[0];
  const rotationSpeed = 0.001;
  camera.position.x = Math.sin(touch.clientX * rotationSpeed) * 5;
  camera.position.z = Math.cos(touch.clientX * rotationSpeed) * 5;
  camera.lookAt(scene.position);
}
async function initAudio() {
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    isAudioInitialized = true;
  } catch (error) {
    console.error("Error accessing microphone:", error);
  }
}
let getAverageFrequencyRange=(start, end)=> {
  let sum = 0;
  for (let i = start; i < end; i++) {
    sum += dataArray[i];
  }
  return sum / (end - start) / 255;
}
let animate=()=> {
  requestAnimationFrame(animate);
  uniforms.uTime.value = performance.now() * 0.001;
  if (isAudioInitialized) {
        analyser.getByteFrequencyData(dataArray);
        const low = getAverageFrequencyRange(0, 20)*0.7;
        const mid = getAverageFrequencyRange(20, 50)*0.7;
        const high = getAverageFrequencyRange(50, 100)*0.7;
        
        uniforms.uAudioLow.value = low;
        uniforms.uAudioMid.value = mid;
        uniforms.uAudioHigh.value = high;
        
        document.getElementById('lowFreq').textContent = low.toFixed(3);
        document.getElementById('midFreq').textContent = mid.toFixed(3);
        document.getElementById('highFreq').textContent = high.toFixed(3);
    }
  renderer.render(scene, camera);
}
let onWindowResize=()=> {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);
document.addEventListener("click", () => {
  if (!isAudioInitialized) {
    initAudio();
      document.querySelector("#info").classList.add("hide");
  }
});
init();
animate();