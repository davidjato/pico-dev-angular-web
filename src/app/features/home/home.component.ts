import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  NgZone,
  OnDestroy,
  ViewChild,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

@Component({
  selector: 'feature-home',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements AfterViewInit, OnDestroy {

  // Llamar este método desde la UI cuando cambie cualquier control
  onControlsChange(): void {
    // Actualizar bloom y exposición
    if (this.renderer) {
      this.renderer.toneMappingExposure = this.controls.exposure;
    }
    if (this.bloomPass) {
      this.bloomPass.strength = this.controls.bloomStrength;
      this.bloomPass.radius = this.controls.bloomRadius;
      this.bloomPass.threshold = this.controls.bloomThreshold;
    }
    // Actualizar color neón
    this.applyNeonColor();
    // Actualizar intensidad emisiva
    this.applyEmissiveIntensity(this.controls.baseEmissive);
    // Forzar render inmediato si es necesario
    if (this.composer) {
      this.composer.render();
    }
  }

  neonColorHex = '#ff7300';
  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.initThree();
      // Animación de entrada inicial
      const startZ = 40;
      const endZ = 6.73;
      const startColor = { r: 0.0196, g: 0.0196, b: 0.0196 }; // #050505
      const endColor = { r: 1, g: 0.45098, b: 0 }; // #ff7300
      const startBloom = 0;
      const endBloom = 0.21;
      const startExposure = 0;
      const endExposure = 1.47;
      const duration = 1000; // ms
      const startTime = performance.now();
      const easeIn = (t: number) => t * t;
      const animateAll = (now: number) => {
        const elapsed = now - startTime;
        if (elapsed < duration) {
          let t = elapsed / duration;
          t = Math.min(Math.max(t, 0), 1);
          const eased = easeIn(t);
          this.controls.cameraZ = startZ + (endZ - startZ) * eased;
          this.controls.bloomStrength = startBloom + (endBloom - startBloom) * eased;
          this.controls.exposure = startExposure + (endExposure - startExposure) * eased;
          const r = Math.round(255 * (startColor.r + (endColor.r - startColor.r) * eased));
          const g = Math.round(255 * (startColor.g + (endColor.g - startColor.g) * eased));
          const b = Math.round(255 * (startColor.b + (endColor.b - startColor.b) * eased));
          this.neonColorHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          this.onControlsChange();
          requestAnimationFrame(animateAll);
        } else {
          this.controls.cameraZ = endZ;
          this.controls.bloomStrength = endBloom;
          this.controls.exposure = endExposure;
          this.neonColorHex = '#ff7300';
          this.onControlsChange();
        }
      };
      requestAnimationFrame(animateAll);

      // Efecto scroll: cameraZ va de 6.73 (hero) a 0 (scroll máximo), vuelve a 6.73 al volver arriba
      const heroCameraZ = endZ;
      const minCameraZ = 0;
      const maxScroll = 400; // px para llegar a cameraZ=0
      window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY <= 0) {
          this.controls.cameraZ = heroCameraZ;
        } else if (scrollY >= maxScroll) {
          this.controls.cameraZ = minCameraZ;
        } else {
          // Interpolación lineal
          this.controls.cameraZ = heroCameraZ + (minCameraZ - heroCameraZ) * (scrollY / maxScroll);
        }
        this.onControlsChange();
      });
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onWindowResize, false);
    }
    if (typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }

  private getNeonColor(): THREE.Color {
    return new THREE.Color(this.neonColorHex);
  }

  applyNeonColor(): void {
    const color = this.getNeonColor();
    const root = this.modelRoot ?? this.debugObject;
    if (!root) return;
    root.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat: any) => {
          if (!mat) return;
          if (!mat.emissive) mat.emissive = new THREE.Color();
          mat.emissive.copy(color);
        });
      }
    });
    if (this.glowLight) {
      this.glowLight.color = color;
    }
  }
  @ViewChild('rendererContainer', { static: true })
  rendererContainer!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;

  private clock = new THREE.Clock();
  private animationFrameId = 0;

  private modelRoot?: THREE.Object3D;
  private debugObject?: THREE.Object3D;
  private glowLight?: THREE.PointLight;

  isBlinking = false;
  private isBrowser: boolean;

  // 👇 TUS VALORES POR DEFECTO (copiados del JSON que has enviado)

  controls = {
    bloomStrength: 0.25,
    bloomRadius: 0.8,
    bloomThreshold: 0,
    exposure: 0, // INICIALIZA EN 0
    rotationSpeed: 0, // ahora mismo no se usa, pero lo dejamos por si luego quieres auto-rotación
    baseEmissive: 8,
    blinkSpeed: 10,
    blinkAmount: 2,
    cameraX: 2.7,
    cameraY: -0.3,
    cameraZ: 40, // INICIALIZA EN 40
    cameraRotX: 5,   // grados
    cameraRotY: -2,  // grados
    cameraRotZ: 0,   // grados
    rotationX: 0,
    rotationY: 36,
    rotationZ: 0,
  };

  private applyEmissiveIntensity(intensity: number): void {
    const target = this.modelRoot ?? this.debugObject;
    if (!target) return;

    target.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat: any) => {
          if (mat && 'emissiveIntensity' in mat) {
            mat.emissiveIntensity = intensity;
          }
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Inicialización Three
  // ---------------------------------------------------------------------------

  private initThree(): void {
    const container = this.rendererContainer.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);

    // 👉 Posición + rotación inicial de la cámara según tus valores
    this.camera.position.set(
      this.controls.cameraX,
      this.controls.cameraY,
      this.controls.cameraZ
    );
    this.camera.rotation.set(
      THREE.MathUtils.degToRad(this.controls.cameraRotX),
      THREE.MathUtils.degToRad(this.controls.cameraRotY),
      THREE.MathUtils.degToRad(this.controls.cameraRotZ)
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.controls.exposure;

    container.appendChild(this.renderer.domElement);

    // Luces suaves
    const ambient = new THREE.AmbientLight(0xffffff, 0.1);
    this.scene.add(ambient);

    const fill = new THREE.DirectionalLight(0xffffff, 0.1);
    fill.position.set(2, 4, 2);
    this.scene.add(fill);

    // Luz de glow que sigue al logo
    this.glowLight = new THREE.PointLight(this.getNeonColor(), 30, 10, 2);
    this.glowLight.position.set(0, 0.5, 0);
    this.scene.add(this.glowLight);

    // No añadir geometría de debug: solo mostrar el modelo GLB si carga correctamente

    // Postprocesado (bloom)
    const renderScene = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      this.controls.bloomStrength,
      this.controls.bloomRadius,
      this.controls.bloomThreshold
    );
    const outputPass = new OutputPass();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(outputPass);

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onWindowResize, false);
    }

    // Cargar logo por defecto desde assets
    this.loadModelFromUrl('assets/threejs/logo.glb');

    this.ngZone.runOutsideAngular(() => this.animate());
  }

  // ---------------------------------------------------------------------------
  // Animación
  // ---------------------------------------------------------------------------

  private animate = () => {
    if (!this.isBrowser) return;

    const elapsed = this.clock.getElapsedTime();
    this.clock.getDelta();

    // Cámara: mantiene siempre tus valores (no hay UI que los cambie, pero así queda por si quieres modificarlos en código)
    this.camera.position.set(
      this.controls.cameraX,
      this.controls.cameraY,
      this.controls.cameraZ
    );
    this.camera.rotation.set(
      THREE.MathUtils.degToRad(this.controls.cameraRotX),
      THREE.MathUtils.degToRad(this.controls.cameraRotY),
      THREE.MathUtils.degToRad(this.controls.cameraRotZ)
    );

    // Bloom + exposición desde tus defaults
    this.renderer.toneMappingExposure = this.controls.exposure;
    this.bloomPass.strength = this.controls.bloomStrength;
    this.bloomPass.radius = this.controls.bloomRadius;
    this.bloomPass.threshold = this.controls.bloomThreshold;

    const target = this.modelRoot ?? this.debugObject;

    if (target) {
      // Rotación manual del logo (defaults: rotY = 36)
      target.rotation.x = THREE.MathUtils.degToRad(this.controls.rotationX);
      target.rotation.y = THREE.MathUtils.degToRad(this.controls.rotationY);
      target.rotation.z = THREE.MathUtils.degToRad(this.controls.rotationZ);
    }

    // Luz de glow sigue el logo
    if (this.glowLight && target) {
      const pos = new THREE.Vector3();
      target.getWorldPosition(pos);
      this.glowLight.position.lerp(pos, 0.3);
      this.glowLight.intensity = 30;
    }

    // Parpadeo (si está activado)
    if (this.isBlinking && target) {
      const blink =
        (Math.sin(elapsed * this.controls.blinkSpeed) + 1) / 2;
      const intensity =
        this.controls.baseEmissive + blink * this.controls.blinkAmount * 4;
      this.applyEmissiveIntensity(intensity);

      this.bloomPass.strength =
        this.controls.bloomStrength + blink * this.controls.blinkAmount;
    } else {
      this.applyEmissiveIntensity(this.controls.baseEmissive);
    }

    this.composer.render();

    if (typeof requestAnimationFrame !== 'undefined') {
      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  };

  // ---------------------------------------------------------------------------
  // Carga del GLB
  // ---------------------------------------------------------------------------

  onModelFileSelected(event: Event): void {
    if (!this.isBrowser) return;

    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const url = URL.createObjectURL(file);
    console.log('📦 Cargando GLB desde URL local:', url);

    this.loadModelFromUrl(url, () => URL.revokeObjectURL(url));
  }

  private loadModelFromUrl(url: string, onDone?: () => void): void {
    if (!this.scene) return;

    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        console.log('✅ GLB cargado:', gltf);

        if (this.modelRoot) this.scene.remove(this.modelRoot);
        if (this.debugObject) {
          this.scene.remove(this.debugObject);
          this.debugObject = undefined;
        }

        this.modelRoot = gltf.scene;
        this.scene.add(this.modelRoot);

        // Adaptar materiales existentes al look neón
        this.applyNeonToExistingMaterials(this.modelRoot);
        this.applyNeonColor();
        this.applyEmissiveIntensity(this.controls.baseEmissive);

        if (onDone) onDone();
      },
      (progress) => {
        if (progress.total) {
          const pct = (progress.loaded / progress.total) * 100;
          console.log(`⏳ Cargando GLB: ${pct.toFixed(1)}%`);
        }
      },
      (error) => {
        console.error('❌ Error al cargar GLB:', error);
        if (onDone) onDone();
      }
    );
  }

  private applyNeonToExistingMaterials(root: THREE.Object3D): void {
    const neon = this.getNeonColor();
    let meshCount = 0;

    root.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        meshCount++;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

        mats.forEach((mat: any) => {
          if (!mat) return;

          if (!mat.emissive) {
            mat.emissive = neon.clone();
          } else {
            mat.emissive.copy(neon);
          }
          mat.emissiveIntensity = this.controls.baseEmissive;
          mat.needsUpdate = true;
        });
      }
    });

    console.log('🧩 Meshes en el modelo:', meshCount);
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  toggleBlink(): void {
    this.isBlinking = !this.isBlinking;

    if (!this.isBlinking) {
      this.applyEmissiveIntensity(this.controls.baseEmissive);
    }
  }

  // ---------------------------------------------------------------------------
  // Resize
  // ---------------------------------------------------------------------------

  private onWindowResize = () => {
    if (!this.isBrowser || !this.camera || !this.renderer || !this.composer) {
      return;
    }

    const container = this.rendererContainer.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
  };
}
