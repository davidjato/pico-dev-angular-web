import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { ChangeDetectorRef } from '@angular/core';
import { Component, AfterViewInit, ElementRef, ViewChild, Inject, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { GuiControlsService } from '../../shared/gui-controls.service';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';

@Component({
  selector: 'feature-why-us',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './why-us.component.html',
  styleUrls: ['./why-us.component.scss']
})
export class WhyUsComponent implements AfterViewInit {
  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  controls!: OrbitControls;
  composer!: EffectComposer;
  bloomPass!: UnrealBloomPass;
  ssaoPass!: SSAOPass;
  ssrPass!: SSRPass;
  vignettePass!: ShaderPass;
  initialized = false;
  isPointHovered = false;
  private guiService = inject(GuiControlsService);
  private guiInitialized = false;

  // Referencias
  private columns: THREE.Mesh[] = [];
  private floor!: THREE.Mesh;
  private grid!: THREE.GridHelper;
  private ambient!: THREE.AmbientLight;
  private keyLight!: THREE.DirectionalLight;
  private glowLights: THREE.PointLight[] = [];

  // Parámetros del código HTML
  private NEON_COLOR = new THREE.Color('#FF7A00');
  private COLS = 16;
  private ROWS = 10;
  private GAP = 1.4;
  private BASE_H = 0.3;
  private AMP = 3.6;
  private THRESHOLD = 0.62;
  private MAX_LIGHTS = 6;
  private columnTransmission = 0.8;
  private columnRoughness = 0.72;

  @ViewChild('threeBg', { static: true }) threeBg!: ElementRef<HTMLDivElement>;
  constructor(@Inject(PLATFORM_ID) private platformId: Object, private cdr: ChangeDetectorRef) { }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const container = this.threeBg.nativeElement;

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.32;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x000000, 1);
      container.appendChild(this.renderer.domElement);

      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      this.scene.environment = envTex;
      this.scene.fog = new THREE.FogExp2(0x000000, 0.076);

      // Camera
      this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
      this.camera.position.set(16.53754532207137, 5.237344298357206, 12.310601179453185);

      // Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.target.set(-13, 1, 0);

      // Luces de glow
      for (let i = 0; i < this.MAX_LIGHTS; i++) {
        const pl = new THREE.PointLight(this.NEON_COLOR, 0, 19, 2);
        pl.visible = false;
        this.scene.add(pl);
        this.glowLights.push(pl);
      }

      // Luces
      this.ambient = new THREE.AmbientLight(0x020408, 0.05);
      this.scene.add(this.ambient);

      this.keyLight = new THREE.DirectionalLight(0x0a2a33, 0.15);
      this.keyLight.position.set(10, 18, 10);
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.set(1024, 1024);
      this.keyLight.shadow.camera.near = 1;
      this.keyLight.shadow.camera.far = 80;
      this.keyLight.shadow.radius = 4;
      this.scene.add(this.keyLight);

      // Plano
      const PLANE_SIZE = 80;
      const planeGeo = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, 1, 1);
      const planeMat = new THREE.MeshPhysicalMaterial({
        color: 0x000000,
        roughness: 0.0,
        metalness: 1.0,
        clearcoat: 0.0,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.02
      });
      this.floor = new THREE.Mesh(planeGeo, planeMat);
      this.floor.rotation.x = -Math.PI / 2;
      this.floor.receiveShadow = true;
      this.scene.add(this.floor);

      // Grid
      this.grid = new THREE.GridHelper(PLANE_SIZE, 40, 0x071015, 0x050d13);
      this.grid.position.y = 0.002;
      this.scene.add(this.grid);
      if (Array.isArray(this.grid.material)) {
        this.grid.material.forEach((m: any) => { m.opacity = 0.08; m.transparent = true; m.depthWrite = false; });
      } else {
        (this.grid.material as any).opacity = 0.08;
        (this.grid.material as any).transparent = true;
        (this.grid.material as any).depthWrite = false;
      }

      // Columnas
      this.createColumns();

      // Postprocesado
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(renderPass);

      // SSAO
      this.ssaoPass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight);
      this.ssaoPass.kernelRadius = 14;
      this.ssaoPass.minDistance = 0.035;
      this.ssaoPass.maxDistance = 0.6;
      this.composer.addPass(this.ssaoPass);

      // SSR
      this.ssrPass = new SSRPass({
        renderer: this.renderer,
        scene: this.scene,
        camera: this.camera,
        width: window.innerWidth,
        height: window.innerHeight,
        selects: null,
        groundReflector: null
      });
      this.ssrPass.maxDistance = 2.0;
      this.ssrPass.thickness = 0.096;
      this.ssrPass.opacity = 1.0;
      this.composer.addPass(this.ssrPass);

      // Bloom
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.42, // strength
        0.68, // radius
        0.36  // threshold
      );
      this.composer.addPass(this.bloomPass);

      // Vignette
      this.vignettePass = new ShaderPass(VignetteShader);
      this.vignettePass.uniforms["offset"].value = 0.5;
      this.vignettePass.uniforms["darkness"].value = 2.78;
      this.composer.addPass(this.vignettePass);

      // Animación
      const clock = new THREE.Clock();
      const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

      const params = {
        activeRatio: 0.09,
        neonScale: 2.65,
        autoOrbit: false,
        orbitSpeed: 0.06,
        orbitRadius: 26,
      };

      const animate = () => {
        const t = clock.getElapsedTime();
        let activeCount = 0;
        const TOTAL = this.COLS * this.ROWS;

        for (let k = 0; k < this.columns.length; k++) {
          const c = this.columns[k];
          const ud = c.userData;
          const mat = c.material as THREE.MeshPhysicalMaterial;
          let h = c.scale.y;

          if (ud['active']) {
            activeCount++;
            const elapsed = t - ud['start'];
            const p = Math.min(elapsed / ud['duration'], 1);
            const e = easeInOutCubic(p);

            h = this.BASE_H + (ud['amp'] ?? this.AMP) * e;
            c.scale.y = h;
            c.position.y = h / 2;

            // Encendido neón
            const above = e > this.THRESHOLD;
            const targetIntensity = (above && p < 1 ? (0.9 + 0.7 * (e - this.THRESHOLD) / (1 - this.THRESHOLD)) : 0.0) * params.neonScale;
            mat.emissiveIntensity += (targetIntensity - mat.emissiveIntensity) * 0.08; // Transición más lenta

            if (targetIntensity > 0.001) {
              mat.emissive.copy(this.NEON_COLOR);
              mat.color.lerpColors(new THREE.Color(0x0e1a20), this.NEON_COLOR, 0.08); // Más lento
            } else {
              mat.emissive.set(0x000000);
            }

            // Luz puntual
            if (ud['lightIndex'] >= 0) {
              const pl = this.glowLights[ud['lightIndex']];
              pl.visible = true;
              pl.position.set(c.position.x, h + 0.35, c.position.z);
              const desired = (above ? (1.5 + 12 * (e - this.THRESHOLD) / (1 - this.THRESHOLD)) : 0.0) * params.neonScale;
              pl.intensity += (desired - pl.intensity) * 0.08; // Transición más suave
            }

            if (p >= 1) {
              ud['active'] = false;
              if (ud['lightIndex'] >= 0) {
                const pl = this.glowLights[ud['lightIndex']];
                pl.visible = false;
                pl.intensity = 0;
                ud['lightIndex'] = -1;
              }
            }
          } else {
            // Relajación
            h += (this.BASE_H - h) * 0.06; // Bajada más lenta
            c.scale.y = h;
            c.position.y = h / 2;

            mat.emissiveIntensity += (0 - mat.emissiveIntensity) * 0.12; // Fade out más lento
            if (mat.emissiveIntensity < 0.01) {
              mat.emissive.set(0x000000);
            }
          }
        }

        // Activar columnas
        const targetActive = Math.max(1, Math.round(TOTAL * params.activeRatio));
        let deficit = targetActive - activeCount;
        if (deficit > 0) {
          const available: number[] = [];
          for (let i = 0; i < this.columns.length; i++) {
            if (!this.columns[i].userData['active']) available.push(i);
          }
          for (let i = available.length - 1; i > 0; i--) {
            const r = Math.floor(Math.random() * (i + 1));
            [available[i], available[r]] = [available[r], available[i]];
          }
          const toActivate = available.slice(0, Math.min(deficit, available.length));
          toActivate.forEach(idx => {
            const c = this.columns[idx];
            const ud = c.userData;
            ud['active'] = true;
            ud['start'] = t;
            ud['duration'] = 7.5 + Math.random() * 3.3;
            ud['amp'] = this.AMP * (0.55 + Math.random() * 1.0);
            const li = this.findAvailableLight();
            ud['lightIndex'] = li;
            if (li >= 0) {
              const pl = this.glowLights[li];
              pl.visible = true;
              pl.position.set(c.position.x, c.position.y + c.scale.y + 0.35, c.position.z);
              pl.intensity = 0;
            }
          });
        }

        // Auto orbit
        if (params.autoOrbit) {
          const angle = t * params.orbitSpeed;
          const r = params.orbitRadius;
          this.camera.position.x = Math.cos(angle) * r;
          this.camera.position.z = Math.sin(angle) * r;
          this.camera.position.y = 14 + 2 * Math.sin(angle * 0.5);
          this.camera.lookAt(0, 0, 0);
        }

        this.controls.update();
        this.composer.render();
        requestAnimationFrame(animate);
      };

      // Resize
      window.addEventListener('resize', () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.ssaoPass.setSize(window.innerWidth, window.innerHeight);
        this.ssrPass.setSize(window.innerWidth, window.innerHeight);
      });

      animate();
      this.initialized = true;
      this.cdr.detectChanges();

      // GUI
      this.initGUI(params);
    }
  }

  private createColumns() {
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const startX = -((this.COLS - 1) * this.GAP) / 2;
    const startZ = -((this.ROWS - 1) * this.GAP) / 2;

    for (let i = 0; i < this.COLS; i++) {
      for (let j = 0; j < this.ROWS; j++) {
        const mat = new THREE.MeshPhysicalMaterial({
          color: 0x0e1a20,
          roughness: this.columnRoughness,
          metalness: 0.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.18,
          emissive: 0x000000,
          emissiveIntensity: 0.0,
          envMapIntensity: 0.03,
          transmission: this.columnTransmission,
          transparent: this.columnTransmission > 0,
          ior: 1.5,
          thickness: 0.5
        });

        const m = new THREE.Mesh(boxGeo, mat);
        m.castShadow = true;
        m.receiveShadow = true;
        m.position.set(startX + i * this.GAP, this.BASE_H / 2, startZ + j * this.GAP);
        m.scale.set(0.9, this.BASE_H, 0.9);

        m.userData = {
          active: false,
          start: 0,
          duration: 1.1 + Math.random() * 0.6,
          lightIndex: -1,
          amp: this.AMP
        };

        this.scene.add(m);
        this.columns.push(m);
      }
    }
  }

  private findAvailableLight(): number {
    for (let i = 0; i < this.glowLights.length; i++) {
      if (!this.glowLights[i].visible) return i;
    }
    return -1;
  }

  private initGUI(params: any) {
    // GUI deshabilitado
    this.guiInitialized = true;
  }

  onPointHover(isHovered: boolean) {
    this.isPointHovered = isHovered;
  }

  private recreateColumns() {
    // Eliminar columnas existentes de la escena
    this.columns.forEach(c => {
      this.scene.remove(c);
      c.geometry.dispose();
      (c.material as THREE.Material).dispose();
    });
    this.columns = [];
    // Recrear columnas con nuevos parámetros
    this.createColumns();
  }
}
