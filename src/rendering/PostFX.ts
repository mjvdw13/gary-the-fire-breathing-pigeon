import { Camera, HalfFloatType, Scene, Vector2, WebGLRenderer, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GRAPHICS } from '../config/graphics';

/**
 * "Post-processing": the picture is drawn into a hidden image first, then a chain of
 * effects touches it up before it reaches the screen:
 *
 *   sky → level & characters → ambient occlusion → bloom → tone mapping → color grading
 */
export class PostFX {
  private composer: EffectComposer;
  private skyPass: RenderPass;
  private scenePass: RenderPass;
  private ao: GTAOPass;
  private bloom: UnrealBloomPass;
  private grade: ShaderPass;

  constructor(webgl: WebGLRenderer, scene: Scene, skyScene: Scene, camera: Camera) {
    const size = webgl.getDrawingBufferSize(new Vector2());
    // HalfFloat = colors brighter than white survive until the bloom pass. samples = smooth edges.
    const target = new WebGLRenderTarget(size.x, size.y, { type: HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(webgl, target);

    this.skyPass = new RenderPass(skyScene, camera);
    this.scenePass = new RenderPass(scene, camera);
    this.scenePass.clear = false; // draw on top of the sky

    // Ambient occlusion: darkens creases, corners and the ground right under things.
    this.ao = new GTAOPass(scene, camera, size.x, size.y);
    this.ao.blendIntensity = 1;
    this.ao.updateGtaoMaterial({ radius: 2.5, distanceExponent: 2, thickness: 2, scale: 2, samples: 16 });
    this.ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });

    // Bloom: only things brighter than `threshold` glow.
    this.bloom = new UnrealBloomPass(size.clone(), 0.45, 0.4, 1.1);

    this.grade = new ShaderPass(COLOR_GRADE);

    this.composer.addPass(this.skyPass);
    this.composer.addPass(this.scenePass);
    this.composer.addPass(this.ao);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass()); // tone mapping + screen colors
    this.composer.addPass(this.grade);
  }

  render(camera: Camera): void {
    this.skyPass.camera = this.scenePass.camera = this.ao.camera = camera;
    this.ao.enabled = GRAPHICS.ambientOcclusion;
    this.bloom.enabled = GRAPHICS.bloom;
    this.grade.enabled = GRAPHICS.colorGrading;
    this.composer.render();
  }

  setSize(width: number, height: number, pixelRatio: number): void {
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(width, height);
  }
}

/** A little camera-style touch-up: a bit more color, a bit more contrast, darker corners. */
const COLOR_GRADE = {
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 1.06 },
    contrast: { value: 1.04 },
    vignette: { value: 0.35 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float saturation, contrast, vignette;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float grey = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(grey), c, saturation);
      c = (c - 0.5) * contrast + 0.5;
      float edge = distance(vUv, vec2(0.5));
      c *= mix(1.0, smoothstep(0.85, 0.35, edge), vignette);
      gl_FragColor = vec4(c, 1.0);
    }`,
};
