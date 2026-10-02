import {
  ACESFilmicToneMapping,
  Camera,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PCFShadowMap,
  PMREMGenerator,
  SRGBColorSpace,
  Scene,
  Texture,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GRAPHICS } from '../config/graphics';
import { PostFX } from './PostFX';
import { SkyDome } from './SkyDome';

export interface SkySettings {
  skyColor: string;
  groundColor: string;
  fogNear: number;
  fogFar: number;
  sunIntensity?: number;
}

/**
 * Owns the WebGL renderer, the 3D scene, the sky and the lights.
 * The sun's shadow box follows the player so shadows stay sharp anywhere in the level.
 * The fancy effects (ambient occlusion, bloom...) live in PostFX.ts; switches in config/graphics.ts.
 */
export class Renderer {
  readonly webgl: WebGLRenderer;
  readonly scene = new Scene();
  private sun: DirectionalLight;
  private hemi: HemisphereLight;
  /** Where the sun sits compared to the player (also where the sun is drawn in the sky). */
  private sunOffset = new Vector3(20, 26, 10);
  private sky = new SkyDome();
  private skyScene = new Scene();
  /** The sky, blurred, used for soft lighting and reflections. */
  private skyLight: Texture | null = null;
  private pmrem: PMREMGenerator;
  private postFX: PostFX | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.webgl = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.webgl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.webgl.shadowMap.enabled = true;
    this.webgl.shadowMap.type = PCFShadowMap;
    this.webgl.outputColorSpace = SRGBColorSpace;
    this.webgl.toneMapping = ACESFilmicToneMapping;
    this.webgl.toneMappingExposure = 1.05;

    this.hemi = new HemisphereLight(0xcfe8ff, 0x6b5a48, 1.4);
    this.scene.add(this.hemi);

    this.sun = new DirectionalLight(0xffeccc, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const s = this.sun.shadow.camera;
    s.left = s.bottom = -30;
    s.right = s.top = 30;
    s.near = 1;
    s.far = 120;
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.02;
    this.sun.shadow.radius = 3; // soft shadow edges
    this.scene.add(this.sun, this.sun.target);

    this.skyScene.add(this.sky.mesh);
    this.pmrem = new PMREMGenerator(this.webgl);

    this.setSky({ skyColor: '#87c8ff', groundColor: '#6b5a48', fogNear: 60, fogFar: 180 });
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setSky(sky: SkySettings): void {
    this.sky.setColors(sky.skyColor, sky.groundColor, this.sunOffset);
    // Fog fades into the hazy horizon color, so far things blend into the sky.
    this.scene.fog = new Fog(this.sky.horizon.clone(), sky.fogNear, sky.fogFar);
    this.hemi.groundColor.set(sky.groundColor);
    this.sun.intensity = sky.sunIntensity ?? 2.6;

    // Take a blurry 360° photo of the sky to light the world with.
    const reflectionScene = new Scene();
    reflectionScene.add(this.sky.cloneForReflections(50));
    this.skyLight?.dispose();
    this.skyLight = this.pmrem.fromScene(reflectionScene, 0.04).texture;
  }

  /** Keep the sun's shadow area centered on what matters (the player). */
  followWithShadows(focus: Vector3): void {
    this.sun.target.position.copy(focus);
    this.sun.position.copy(focus).add(this.sunOffset);
  }

  render(camera: Camera, scene: Scene = this.scene): void {
    if (scene !== this.scene) {
      this.webgl.render(scene, camera); // the menu showcase: no effects needed
      return;
    }
    this.sky.mesh.position.copy(camera.position);
    const fancy = GRAPHICS.effects;
    const skyLighting = fancy && GRAPHICS.skyLighting;
    this.scene.environment = skyLighting ? this.skyLight : null;
    this.scene.environmentIntensity = 0.55;
    this.hemi.intensity = skyLighting ? 0.35 : 1.4;

    if (fancy) {
      this.postFX ??= new PostFX(this.webgl, this.scene, this.skyScene, camera);
      this.postFX.render(camera);
    } else {
      this.webgl.render(this.skyScene, camera);
      this.webgl.autoClear = false;
      this.webgl.render(this.scene, camera);
      this.webgl.autoClear = true;
    }
  }

  get aspect(): number {
    return window.innerWidth / window.innerHeight;
  }

  private resize(): void {
    this.webgl.setSize(window.innerWidth, window.innerHeight);
    this.postFX?.setSize(window.innerWidth, window.innerHeight, this.webgl.getPixelRatio());
    this.onResize?.(this.aspect);
  }

  /** Set by the game so cameras can update their aspect ratio. */
  onResize?: (aspect: number) => void;
}
