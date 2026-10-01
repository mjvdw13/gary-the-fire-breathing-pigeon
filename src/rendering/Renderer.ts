import {
  ACESFilmicToneMapping,
  Camera,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PCFSoftShadowMap,
  SRGBColorSpace,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';

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
 */
export class Renderer {
  readonly webgl: WebGLRenderer;
  readonly scene = new Scene();
  private sun: DirectionalLight;
  private hemi: HemisphereLight;
  private sunOffset = new Vector3(18, 30, 12);

  constructor(canvas: HTMLCanvasElement) {
    this.webgl = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.webgl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.webgl.shadowMap.enabled = true;
    this.webgl.shadowMap.type = PCFSoftShadowMap;
    this.webgl.outputColorSpace = SRGBColorSpace;
    this.webgl.toneMapping = ACESFilmicToneMapping;
    this.webgl.toneMappingExposure = 1.05;

    this.hemi = new HemisphereLight(0xcfe8ff, 0x6b5a48, 1.4);
    this.scene.add(this.hemi);

    this.sun = new DirectionalLight(0xfff1dd, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const s = this.sun.shadow.camera;
    s.left = s.bottom = -30;
    s.right = s.top = 30;
    s.near = 1;
    s.far = 120;
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun, this.sun.target);

    this.setSky({ skyColor: '#87c8ff', groundColor: '#6b5a48', fogNear: 60, fogFar: 180 });
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setSky(sky: SkySettings): void {
    this.scene.background = new Color(sky.skyColor);
    this.scene.fog = new Fog(sky.skyColor, sky.fogNear, sky.fogFar);
    this.hemi.groundColor.set(sky.groundColor);
    this.sun.intensity = sky.sunIntensity ?? 2.6;
  }

  /** Keep the sun's shadow area centered on what matters (the player). */
  followWithShadows(focus: Vector3): void {
    this.sun.target.position.copy(focus);
    this.sun.position.copy(focus).add(this.sunOffset);
  }

  render(camera: Camera, scene: Scene = this.scene): void {
    this.webgl.render(scene, camera);
  }

  get aspect(): number {
    return window.innerWidth / window.innerHeight;
  }

  private resize(): void {
    this.webgl.setSize(window.innerWidth, window.innerHeight);
    this.onResize?.(this.aspect);
  }

  /** Set by the game so cameras can update their aspect ratio. */
  onResize?: (aspect: number) => void;
}
