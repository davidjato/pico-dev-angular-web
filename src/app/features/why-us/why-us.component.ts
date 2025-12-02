import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { ChangeDetectorRef } from '@angular/core';
import { Component, AfterViewInit, ElementRef, ViewChild, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

@Component({
  selector: 'feature-why-us',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './why-us.component.html',
  styleUrls: ['./why-us.component.scss']
})
export class WhyUsComponent implements AfterViewInit {
    neonColor: string = '#ff7a00';
    bloomRadius: number = 0.10;
    bloomThreshold: number = 0.85;
  bloomStrength: number = 0.16;
  exposure: number = 0.9;
  composer!: EffectComposer;
  renderer!: THREE.WebGLRenderer;
  bloomPass!: UnrealBloomPass;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  controls!: OrbitControls;
  initialized = false;
  @ViewChild('threeBg', { static: true }) threeBg!: ElementRef<HTMLDivElement>;
  constructor(@Inject(PLATFORM_ID) private platformId: Object, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Adaptación del ejemplo Three.js columnas neón
      const container = this.threeBg.nativeElement;
      // Panel de controles lil-gui
      const guiParams = {
        neonColor: this.neonColor,
        bloomStrength: this.bloomStrength,
        bloomRadius: this.bloomRadius,
        bloomThreshold: this.bloomThreshold
      };
      const gui = new GUI();
      container.appendChild(gui.domElement);
      gui.title('Ajustes columnas neón');
      gui.domElement.style.position = '';
      gui.domElement.style.top = '';
      gui.domElement.style.left = '';
      gui.domElement.style.zIndex = '';
      gui.addColor(guiParams, 'neonColor').name('Color Neón').onChange((v: string) => {
        this.neonColor = v;
      });
      const bloomFolder = gui.addFolder('Bloom');
      bloomFolder.add(guiParams, 'bloomStrength', 0, 5, 0.01).name('Fuerza').onChange((v: number) => {
        this.onBloomChange(v);
      });
      bloomFolder.add(guiParams, 'bloomRadius', 0, 2, 0.01).name('Radio').onChange((v: number) => {
        this.bloomRadius = v;
        if (this.bloomPass) this.bloomPass.radius = v;
      });
      bloomFolder.add(guiParams, 'bloomThreshold', 0, 1, 0.01).name('Umbral').onChange((v: number) => {
        this.bloomThreshold = v;
        if (this.bloomPass) this.bloomPass.threshold = v;
      });
      bloomFolder.open();
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = this.exposure;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x000000, 1);
      container.appendChild(this.renderer.domElement);

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      this.scene.environment = envTex;
      this.scene.fog = new THREE.FogExp2(0x000000, 0.06);

      this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
      this.camera.position.set(14, 16, 18);

      // OrbitControls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.target.set(0, 0, 0);

      // Neon color and lights
      let NEON_COLOR = new THREE.Color(this.neonColor);
      const glowLights: THREE.PointLight[] = [];
      const MAX_LIGHTS = 6;
      for (let i = 0; i < MAX_LIGHTS; i++) {
        const pl = new THREE.PointLight(NEON_COLOR, 0, 14, 2);
        pl.visible = false;
        this.scene.add(pl);
        glowLights.push(pl);
      }

      // Lights
      const ambient = new THREE.AmbientLight(0x020408, 0.05);
      this.scene.add(ambient);
      const keyLight = new THREE.DirectionalLight(0x0a2a33, 0.15);
      keyLight.position.set(10, 18, 10);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 80;
      keyLight.shadow.radius = 4;
      this.scene.add(keyLight);

      // Plane
      const PLANE_SIZE = 80;
      const planeGeo = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, 1, 1);
      const planeMat = new THREE.MeshPhysicalMaterial({ color: 0x050a0c, roughness: 0.22, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.4, envMapIntensity: 0.02 });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.rotation.x = -Math.PI / 2;
      plane.receiveShadow = true;
      this.scene.add(plane);

      // Grid
      const grid = new THREE.GridHelper(PLANE_SIZE, 40, 0x071015, 0x050d13);
      grid.position.y = 0.002;
      this.scene.add(grid);
      if (Array.isArray(grid.material)) {
        grid.material.forEach((m: any) => { m.opacity = 0.08; m.transparent = true; m.depthWrite = false; });
      } else {
        (grid.material as any).opacity = 0.08; (grid.material as any).transparent = true; (grid.material as any).depthWrite = false;
      }

      // Columns
      const COLS = 16;
      const ROWS = 16;
      const GAP = 1.4;
      const BASE_H = 0.3;
      let AMP = 6.0;
      const THRESHOLD = 0.62;
      const TOTAL = COLS * ROWS;
      const columns: any[] = [];
      const boxGeo = new THREE.BoxGeometry(1, 1, 1);
      const startX = -((COLS - 1) * GAP) / 2;
      const startZ = -((ROWS - 1) * GAP) / 2;
      for (let i = 0; i < COLS; i++) {
        for (let j = 0; j < ROWS; j++) {
          const mat = new THREE.MeshPhysicalMaterial({
            color: 0x0e1a20,
            roughness: 0.28,
            metalness: 0.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.18,
            emissive: 0x000000,
            emissiveIntensity: 0.0,
            envMapIntensity: 0.03
          });
          const m = new THREE.Mesh(boxGeo, mat);
          m.castShadow = true;
          m.receiveShadow = true;
          m.position.set(startX + i * GAP, BASE_H / 2, startZ + j * GAP);
          m.scale.set(0.9, BASE_H, 0.9);
          m.userData = {
            active: false,
            start: 0,
            duration: 1.1 + Math.random() * 0.6,
            lightIndex: -1,
            amp: AMP
          };
          this.scene.add(m);
          columns.push(m);
        }
      }

      // Postprocesado: solo UnrealBloomPass (simplificado)
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(renderPass);
      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.bloomStrength, 0.10, 0.85);
      this.composer.addPass(this.bloomPass);

      // Animación
      const clock = new THREE.Clock();
      const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
      const animate = () => {
        const t = clock.getElapsedTime();
        let activeCount = 0;
        for (let k = 0; k < columns.length; k++) {
          const c = columns[k];
          const ud = c.userData;
          let h = c.scale.y;
          if (ud.active) {
            activeCount++;
            const elapsed = t - ud.start;
            const p = Math.min(elapsed / ud.duration, 1);
            const e = easeInOutCubic(p);
            h = BASE_H + (ud.amp ?? AMP) * e;
            c.scale.y = h;
            c.position.y = h / 2;
            const above = e > THRESHOLD;
            // Intensidad de emisión mucho mayor para bloom visible
            const targetIntensity = (above && p < 1 ? (3.5 + 2.5 * (e - THRESHOLD) / (1 - THRESHOLD)) : 0.0);
            c.material.emissiveIntensity += (targetIntensity - c.material.emissiveIntensity) * 0.18;
            if (targetIntensity > 0.001) {
              // Solo la emisión es neón, el color base permanece oscuro
              NEON_COLOR.set(this.neonColor);
              c.material.emissive.copy(NEON_COLOR);
              c.material.color.set(0x0e1a20); // color base oscuro
            } else {
              c.material.emissive.set(0x000000);
              c.material.color.set(0x0e1a20);
            }
            if (ud.lightIndex >= 0) {
              const pl = glowLights[ud.lightIndex];
              pl.visible = true;
              pl.position.set(c.position.x, h + 0.35, c.position.z);
              const desired = (above ? (1.5 + 12 * (e - THRESHOLD) / (1 - THRESHOLD)) : 0.0);
              pl.intensity += (desired - pl.intensity) * 0.2;
            }
            if (p >= 1) {
              ud.active = false;
              if (ud.lightIndex >= 0) {
                const pl = glowLights[ud.lightIndex];
                pl.visible = false;
                pl.intensity = 0;
                ud.lightIndex = -1;
              }
            }
          } else {
            h += (BASE_H - h) * 0.18;
            c.scale.y = h;
            c.position.y = h / 2;
            c.material.emissiveIntensity += (0 - c.material.emissiveIntensity) * 0.25;
            if (c.material.emissiveIntensity < 0.01) {
              c.material.emissive.set(0x000000);
            }
          }
        }
        const targetActive = Math.max(1, Math.round(TOTAL * 0.1));
        let deficit = targetActive - activeCount;
        if (deficit > 0) {
          const available: number[] = [];
          for (let i = 0; i < columns.length; i++) if (!columns[i].userData.active) available.push(i);
          for (let i = available.length - 1; i > 0; i--) {
            const r = Math.floor(Math.random() * (i + 1));
            [available[i], available[r]] = [available[r], available[i]];
          }
          const toActivate = available.slice(0, Math.min(deficit, available.length));
          toActivate.forEach(idx => {
            const c = columns[idx];
            const ud = c.userData;
            ud.active = true;
            ud.start = t;
            ud.duration = 0.8 + Math.random() * 1.3;
            ud.amp = AMP * (0.55 + Math.random() * 1.0);
            const li = (() => { for (let i = 0; i < glowLights.length; i++) { if (!glowLights[i].visible) return i; } return -1; })();
            ud.lightIndex = li;
            if (li >= 0) {
              const pl = glowLights[li];
              pl.visible = true;
              pl.position.set(c.position.x, c.position.y + c.scale.y + 0.35, c.position.z);
              pl.intensity = 0;
            }
          });
        }
        // Auto orbit
        const angle = t * 0.06;
        const r = 26;
        this.camera.position.x = Math.cos(angle) * r;
        this.camera.position.z = Math.sin(angle) * r;
        this.camera.position.y = 14 + 2 * Math.sin(angle * 0.5);
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
        this.composer.render();
        requestAnimationFrame(animate);
      };
      window.addEventListener('resize', () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      });
      animate();
      this.initialized = true;
      this.cdr.detectChanges();
    }
  }

  onBloomChange(value: number) {
    this.bloomStrength = value;
    if (this.bloomPass) {
      this.bloomPass.strength = value;
    }
  }

  onExposureChange(value: number) {
    this.exposure = value;
    if (this.renderer) {
      this.renderer.toneMappingExposure = value;
    }
  }
}