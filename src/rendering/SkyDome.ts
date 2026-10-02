import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry, Vector3 } from 'three';

/**
 * A big ball around the camera, painted with a sky gradient and a glowing sun.
 * Deep blue straight up, hazy and light at the horizon (that's what real skies do),
 * and the fog uses the horizon color so far-away buildings melt into the haze.
 */
export class SkyDome {
  readonly mesh: Mesh;
  readonly horizon = new Color();
  private groundColor = new Color();
  private material: ShaderMaterial;

  constructor(radius = 450) {
    this.material = new ShaderMaterial({
      uniforms: {
        zenith: { value: new Color() },
        horizon: { value: this.horizon },
        ground: { value: new Color() },
        sunDir: { value: new Vector3(0, 1, 0) },
        sunColor: { value: new Color('#fff1d6') },
        sunStrength: { value: 1 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 zenith, horizon, ground, sunDir, sunColor;
        uniform float sunStrength;
        varying vec3 vDir;
        void main() {
          vec3 dir = normalize(vDir);
          float up = dir.y;
          vec3 color = up > 0.0
            ? mix(horizon, zenith, pow(up, 0.55))
            : mix(horizon, ground, smoothstep(0.0, -0.25, up));
          float sun = max(dot(dir, sunDir), 0.0);
          color += sunColor * sunStrength * (pow(sun, 900.0) * 30.0 + pow(sun, 24.0) * 0.35);
          gl_FragColor = vec4(color, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      side: BackSide,
      depthWrite: false,
      fog: false,
    });
    this.mesh = new Mesh(new SphereGeometry(radius, 32, 16), this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1;
  }

  /** Make the gradient from a level's single sky color. */
  setColors(skyColor: string, groundColor: string, sunDir: Vector3): void {
    const u = this.material.uniforms;
    const base = new Color(skyColor);
    u.zenith.value.copy(base).offsetHSL(0.01, 0.15, -0.18);
    this.horizon.copy(base).lerp(new Color('#ffffff'), 0.3);
    // Below the horizon: a darker haze, a little tinted by the ground.
    u.ground.value.copy(this.horizon).lerp(new Color(groundColor), 0.35).multiplyScalar(0.8);
    u.sunDir.value.copy(sunDir).normalize();
    this.groundColor.set(groundColor);
  }

  /** A copy for lighting reflections: same sky, no blinding sun (the sun light does that). */
  cloneForReflections(radius: number): Mesh {
    const material = this.material.clone();
    const u = material.uniforms;
    u.sunStrength.value = 0.15;
    // Light bouncing up off the warm ground.
    u.ground.value.copy(this.groundColor).lerp(this.horizon, 0.3);
    // Much greyer sky light — a deep blue sky would make every shadow bright blue.
    for (const c of [u.zenith.value, u.horizon.value, u.ground.value] as Color[]) {
      const hsl = c.getHSL({ h: 0, s: 0, l: 0 });
      c.setHSL(hsl.h, hsl.s * 0.3, hsl.l);
    }
    const mesh = new Mesh(new SphereGeometry(radius, 32, 16), material);
    return mesh;
  }
}
