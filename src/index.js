import {
  Scene,
  Color,
  PerspectiveCamera,
  WebGLRenderer,
  DirectionalLight,
  HemisphereLight,
  Vector3,
  Clock,
  AnimationMixer,
  SphereGeometry,
  MeshStandardMaterial,
  Mesh,
  BoxGeometry,
  Group,
} from "three";
import OrbitControls from "three-orbitcontrols";
import GLTFLoader from "three-gltf-loader";

let container;
let camera;
let renderer;
let scene;
let controls;

const mixers = [];
const clock = new Clock();
const snowflakes = [];
const snowOnGround = [];

function init() {
  container = document.querySelector("#scene-container");

  // Creating the scene
  scene = new Scene();
  scene.background = new Color("skyblue");

  createCamera();
  createLights();
  loadModels();
  createControls();
  createRenderer();

  renderer.setAnimationLoop(() => {
    update();
    render();
  });

  createSnowfall(-1.8);
}

function createCamera() {
  const fov = 35;
  const aspect = container.clientWidth / container.clientHeight;
  const near = 0.1;
  const far = 1000;
  camera = new PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(-1.5, 1.5, 10);
}

function createLights() {
  const mainLight = new DirectionalLight(0xffffff, 5);
  mainLight.position.set(10, 10, 10);

  const hemisphereLight = new HemisphereLight(0xddeeff, 0x202020, 5);
  scene.add(mainLight, hemisphereLight);
}

function createBox(
  width = 1,
  height = 1,
  depth = 1,
  position = new Vector3(0, 0, 0)
) {
  const geometry = new BoxGeometry(width, height, depth);
  const material = new MeshStandardMaterial({ color: 0x8b4513 });
  const box = new Mesh(geometry, material);

  box.position.copy(position);
  scene.add(box);
  return box;
}

function loadModels() {
  const loader = new GLTFLoader();

  const onLoad = (result, position) => {
    const model = result.scene.children[0];
    model.position.copy(position);
    model.rotation.y = Math.PI / 2;
    model.scale.set(20, 20, 20);

    const mixer = new AnimationMixer(model);
    mixers.push(mixer);

    scene.add(model);
  };

  const onProgress = (progress) => {};

  const scenePosition = new Vector3(-1, 0, 0);
  loader.load(
    "./src/models/poly.glb",
    (gltf) => onLoad(gltf, scenePosition),
    onProgress
  );

  //createBox(8, 4, 5, new Vector3(-1.5, -0.1, -2.8));
}

function createRenderer() {
  renderer = new WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.gammaFactor = 2.2;
  renderer.gammaOutput = true;
  renderer.physicallyCorrectLights = true;

  container.appendChild(renderer.domElement);
}

function createControls() {
  controls = new OrbitControls(camera, container);
}

function createSnowfall(groundHeight = 0) {
  const snowflakeCount = 100;

  for (let i = 0; i < snowflakeCount; i++) {
    const geometry = new SphereGeometry(0.05, 8, 8);
    const material = new MeshStandardMaterial({ color: 0xffffff });
    const snowflake = new Mesh(geometry, material);

    snowflake.position.set(
      Math.random() * 20 - 10,
      Math.random() * 10 + 5,
      Math.random() * 20 - 10
    );

    scene.add(snowflake);
    snowflakes.push({ mesh: snowflake, groundHeight });
  }
}

function updateSnowfall() {
  snowflakes.forEach(({ mesh, groundHeight }, index) => {
    mesh.position.y -= Math.random() * 0.1 + 0.05;

    if (mesh.position.y <= groundHeight) {
      const material = new MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
      });
      const snowflakeOnGround = new Mesh(mesh.geometry.clone(), material);
      snowflakeOnGround.position.set(
        mesh.position.x,
        groundHeight,
        mesh.position.z
      );

      scene.add(snowflakeOnGround);
      snowOnGround.push(snowflakeOnGround);

      // Reset snowflake to start falling again
      mesh.position.set(
        Math.random() * 20 - 10,
        Math.random() * 10 + 5,
        Math.random() * 20 - 10
      );
    }
  });

  snowOnGround.forEach((flake, index) => {
    flake.material.opacity -= 0.005;
    if (flake.material.opacity <= 0) {
      scene.remove(flake);
      snowOnGround.splice(index, 1);
    }
  });
}

function update() {
  const delta = clock.getDelta();
  mixers.forEach((mixer) => mixer.update(delta));
  updateSnowfall();
}

function render() {
  renderer.render(scene, camera);
}

init();

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener("resize", onWindowResize, false);
