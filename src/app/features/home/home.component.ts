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
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { GuiControlsService } from '../../shared/gui-controls.service';

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
  neonColorHex = '#FF7A00';
  private guiService = inject(GuiControlsService);
  private guiInitialized = false;

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
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
  private glowLight?: THREE.PointLight;

  isBlinking = false;
  private isBrowser: boolean;

  private isMobileView = false;
  private scrollHandler?: () => void;

  private resizeObserver?: ResizeObserver;

  // ✅ throttle para iOS (evita cascadas de resize al hacer scroll con la barra del navegador)
  private resizeRaf = 0;

  controls = {
    bloomStrength: 0.25,
    bloomRadius: 0.8,
    bloomThreshold: 0,
    exposure: 0, // desktop lo anima; mobile lo forzamos
    rotationSpeed: 0,
    baseEmissive: 8,
    blinkSpeed: 10,
    blinkAmount: 2,
    cameraX: 2.7,
    cameraY: -0.3,
    cameraZ: 40,
    cameraRotX: 5,
    cameraRotY: -2,
    cameraRotZ: 0,
    rotationX: 0,
    rotationY: 36,
    rotationZ: 0,
  };

  onControlsChange(): void {
    if (this.renderer) this.renderer.toneMappingExposure = this.controls.exposure;
    if (this.bloomPass) {
      this.bloomPass.strength = this.controls.bloomStrength;
      this.bloomPass.radius = this.controls.bloomRadius;
      this.bloomPass.threshold = this.controls.bloomThreshold;
    }
    this.applyNeonColor();
    this.applyEmissiveIntensity(this.controls.baseEmissive);
    this.composer?.render();
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.initThree();
    this.initGUI();

    // Desktop: animación entrada + scroll
    if (!this.isMobileView) {
      const startZ = 40;
      const endZ = 6.73;
      const startColor = { r: 0.0196, g: 0.0196, b: 0.0196 };
      const endColor = { r: 1, g: 0.47843, b: 0 };
      const startBloom = 0;
      const endBloom = 0.21;
      const startExposure = 0;
      const endExposure = 1.47;
      const duration = 1000;
      const startTime = performance.now();
      const easeIn = (t: number) => t * t;

      const animateAll = (now: number) => {
        const elapsed = now - startTime;
        if (elapsed < duration) {
          const t = Math.min(Math.max(elapsed / duration, 0), 1);
          const eased = easeIn(t);

          this.controls.cameraZ = startZ + (endZ - startZ) * eased;
          this.controls.bloomStrength =
            startBloom + (endBloom - startBloom) * eased;
          this.controls.exposure =
            startExposure + (endExposure - startExposure) * eased;

          const r = Math.round(
            255 * (startColor.r + (endColor.r - startColor.r) * eased)
          );
          const g = Math.round(
            255 * (startColor.g + (endColor.g - startColor.g) * eased)
          );
          const b = Math.round(
            255 * (startColor.b + (endColor.b - startColor.b) * eased)
          );
          this.neonColorHex = `#${r
            .toString(16)
            .padStart(2, '0')}${g
              .toString(16)
              .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

          this.onControlsChange();
          requestAnimationFrame(animateAll);
        } else {
          this.controls.cameraZ = endZ;
          this.controls.bloomStrength = endBloom;
          this.controls.exposure = endExposure;
          this.neonColorHex = '#FF7A00';
          this.onControlsChange();
        }
      };
      requestAnimationFrame(animateAll);

      const heroCameraZ = endZ;
      const heroCameraY = this.controls.cameraY;
      const minCameraZ = 0;
      const minCameraY = -2.2;
      const maxScroll = 400;

      this.scrollHandler = () => {
        const scrollY = window.scrollY;
        if (scrollY <= 0) {
          this.controls.cameraZ = heroCameraZ;
          this.controls.cameraY = heroCameraY;
        } else if (scrollY >= maxScroll) {
          this.controls.cameraZ = minCameraZ;
          this.controls.cameraY = minCameraY;
        } else {
          const p = scrollY / maxScroll;
          this.controls.cameraZ = heroCameraZ + (minCameraZ - heroCameraZ) * p;
          this.controls.cameraY = heroCameraY + (minCameraY - heroCameraY) * p;
        }
        this.onControlsChange();
      };

      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    }
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;

    // listeners
    window.removeEventListener('resize', this.requestResize);
    window.visualViewport?.removeEventListener('resize', this.requestResize);
    window.visualViewport?.removeEventListener('scroll', this.requestResize);

    if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);

    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;

    if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
    this.resizeRaf = 0;

    cancelAnimationFrame(this.animationFrameId);

    if (this.renderer?.domElement?.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    this.composer?.dispose?.();
    this.renderer?.dispose();
  }

  private initGUI(): void {
    this.guiInitialized = true;
  }

  private getNeonColor(): THREE.Color {
    return new THREE.Color(this.neonColorHex);
  }

  private applyNeonColor(): void {
    const color = this.getNeonColor();
    if (!this.modelRoot) return;

    this.modelRoot.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat: any) => {
          if (!mat) return;
          if (!mat.emissive) mat.emissive = new THREE.Color();
          mat.emissive.copy(color);
        });
      }
    });

    if (this.glowLight) this.glowLight.color = color;
  }

  private applyEmissiveIntensity(intensity: number): void {
    if (!this.modelRoot) return;

    this.modelRoot.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat: any) => {
          if (mat && 'emissiveIntensity' in mat) mat.emissiveIntensity = intensity;
        });
      }
    });
  }

  // ✅ Resize throttled (iOS scroll = visualViewport resize/scroll events)
  private requestResize = () => {
    if (this.resizeRaf) return;
    this.resizeRaf = requestAnimationFrame(() => {
      this.resizeRaf = 0;
      this.onWindowResize();
    });
  };

  // ✅ Medición robusta iOS: visualViewport durante scroll
  private getContainerSize(): { width: number; height: number } {
    const el = this.rendererContainer.nativeElement;
    const rect = el.getBoundingClientRect();

    const vv = window.visualViewport;
    const vw = vv?.width ?? window.innerWidth;
    const vh = vv?.height ?? window.innerHeight;

    const width = Math.max(1, Math.floor(rect.width || vw));
    const height = Math.max(1, Math.floor(rect.height || vh));

    return { width, height };
  }

  private initThree(): void {
    if (!this.isBrowser) return;

    const { width, height } = this.getContainerSize();
    this.isMobileView = width < 900;

    // ✅ Mobile: valores visibles SIEMPRE (no dependas de la animación)
    if (this.isMobileView) {
      this.controls.exposure = 1.35;
      this.controls.bloomStrength = 0.21;
      this.controls.bloomRadius = 0.8;
      this.controls.bloomThreshold = 0;

      this.controls.cameraX = 0;
      this.controls.cameraY = 0;
      this.controls.cameraZ = 16;
      this.controls.cameraRotX = 0;
      this.controls.cameraRotY = 0;
      this.controls.cameraRotZ = 0;
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    // ✅ cap DPR en iPhone (composer + bloom + dpr alto = context loss al scroll)
    const dpr = this.isMobileView
      ? Math.min(window.devicePixelRatio || 1, 1.5)
      : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);

    this.renderer.setSize(width, height, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.controls.exposure;

    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // ✅ context loss handlers (por si Safari lo pierde al scroll/resize)
    this.attachContextLossHandlers();

    // Luces
    this.scene.add(new THREE.AmbientLight(0xffffff, this.isMobileView ? 0.25 : 0.1));
    const fill = new THREE.DirectionalLight(0xffffff, 0.1);
    fill.position.set(2, 4, 2);
    this.scene.add(fill);

    this.glowLight = new THREE.PointLight(this.getNeonColor(), 30, 10, 2);
    this.glowLight.position.set(0, 0.5, 0);
    this.scene.add(this.glowLight);

    // Postprocesado
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

    // ✅ iOS: resize “real” al hacer scroll (URL bar)
    window.addEventListener('resize', this.requestResize, { passive: true });
    window.visualViewport?.addEventListener('resize', this.requestResize, { passive: true });
    window.visualViewport?.addEventListener('scroll', this.requestResize, { passive: true });

    // ✅ ResizeObserver: cuando el contenedor “coja tamaño real” en móvil, reajusta
    this.resizeObserver = new ResizeObserver(() => this.requestResize());
    this.resizeObserver.observe(this.rendererContainer.nativeElement);

    // ✅ Reintento al siguiente frame (evita 0x0 al inicio en móvil)
    requestAnimationFrame(() => this.requestResize());

    // Cámara inicial
    this.camera.position.set(this.controls.cameraX, this.controls.cameraY, this.controls.cameraZ);
    if (this.isMobileView) this.camera.lookAt(0, 0, 0);
    else {
      this.camera.rotation.set(
        THREE.MathUtils.degToRad(this.controls.cameraRotX),
        THREE.MathUtils.degToRad(this.controls.cameraRotY),
        THREE.MathUtils.degToRad(this.controls.cameraRotZ)
      );
    }

    this.loadModelFromUrl('assets/threejs/logo.glb');
    this.ngZone.runOutsideAngular(() => this.animate());
  }

  private fitCameraToObject(object: THREE.Object3D, margin = 1.35): void {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const fov = this.camera.fov * (Math.PI / 180);
    const distance = (maxDim / 2) / Math.tan(fov / 2);
    const camZ = Math.max(1, distance * margin);

    const neededFar = camZ + maxDim * 4;
    if (this.camera.far < neededFar) this.camera.far = neededFar;

    this.controls.cameraX = 0;
    this.controls.cameraY = 0;
    this.controls.cameraZ = camZ;

    this.camera.position.set(0, 0, camZ);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
  }

  private animate = () => {
    if (!this.isBrowser) return;

    const elapsed = this.clock.getElapsedTime();
    this.clock.getDelta();

    this.camera.position.set(this.controls.cameraX, this.controls.cameraY, this.controls.cameraZ);

    if (this.isMobileView) {
      this.camera.lookAt(0, 0, 0);
    } else {
      this.camera.rotation.set(
        THREE.MathUtils.degToRad(this.controls.cameraRotX),
        THREE.MathUtils.degToRad(this.controls.cameraRotY),
        THREE.MathUtils.degToRad(this.controls.cameraRotZ)
      );
    }

    this.renderer.toneMappingExposure = this.controls.exposure;
    this.bloomPass.strength = this.controls.bloomStrength;
    this.bloomPass.radius = this.controls.bloomRadius;
    this.bloomPass.threshold = this.controls.bloomThreshold;

    if (this.modelRoot) {
      if (this.isMobileView) {
        this.modelRoot.rotation.x = THREE.MathUtils.degToRad(this.controls.rotationX);
        this.modelRoot.rotation.y = 0;
        this.modelRoot.rotation.z = THREE.MathUtils.degToRad(this.controls.rotationZ);
      } else {
        this.modelRoot.rotation.x = THREE.MathUtils.degToRad(this.controls.rotationX);
        this.modelRoot.rotation.y = THREE.MathUtils.degToRad(this.controls.rotationY);
        this.modelRoot.rotation.z = THREE.MathUtils.degToRad(this.controls.rotationZ);
      }
    }

    if (this.glowLight && this.modelRoot) {
      const pos = new THREE.Vector3();
      this.modelRoot.getWorldPosition(pos);
      this.glowLight.position.lerp(pos, 0.3);
      this.glowLight.intensity = 30;
    }

    if (this.isBlinking && this.modelRoot) {
      const blink = (Math.sin(elapsed * this.controls.blinkSpeed) + 1) / 2;
      const intensity = this.controls.baseEmissive + blink * this.controls.blinkAmount * 4;
      this.applyEmissiveIntensity(intensity);
      this.bloomPass.strength = this.controls.bloomStrength + blink * this.controls.blinkAmount;
    } else {
      this.applyEmissiveIntensity(this.controls.baseEmissive);
    }

    this.composer.render();
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private loadModelFromUrl(url: string, onDone?: () => void): void {
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        if (this.modelRoot) this.scene.remove(this.modelRoot);

        this.modelRoot = gltf.scene;

        // centrar en origen
        const box = new THREE.Box3().setFromObject(this.modelRoot);
        const center = box.getCenter(new THREE.Vector3());
        this.modelRoot.position.sub(center);

        this.scene.add(this.modelRoot);

        // neón
        this.applyNeonToExistingMaterials(this.modelRoot);
        this.applyNeonColor();
        this.applyEmissiveIntensity(this.controls.baseEmissive);

        if (this.isMobileView) {
          // Centra el modelo en el origen
          const box2 = new THREE.Box3().setFromObject(this.modelRoot);
          const center2 = box2.getCenter(new THREE.Vector3());
          this.modelRoot.position.sub(center2);

          // Resetea rotaciones para que el logo salga recto
          this.modelRoot.rotation.set(0, 0, 0);

          // Ajuste de posición (tu setup)
          const size = box2.getSize(new THREE.Vector3());
          this.modelRoot.position.y += size.y * 2.6;
          this.modelRoot.position.x += size.x * -1.08;

          // Aleja cámara con margen (tu setup)
          this.fitCameraToObject(this.modelRoot, 7);
          this.onControlsChange();
        } else {
          this.modelRoot.position.y = this.modelRoot.position.y + 0.5;
        }

        onDone?.();
      },
      undefined,
      (error) => {
        console.error('❌ Error al cargar GLB:', error);
        onDone?.();
      }
    );
  }

  private applyNeonToExistingMaterials(root: THREE.Object3D): void {
    const neon = this.getNeonColor();
    root.traverse((obj: any) => {
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat: any) => {
          if (!mat) return;
          if (!mat.emissive) mat.emissive = neon.clone();
          else mat.emissive.copy(neon);
          mat.emissiveIntensity = this.controls.baseEmissive;
          mat.needsUpdate = true;
        });
      }
    });
  }

  private onWindowResize = () => {
    if (!this.isBrowser) return;
    if (!this.camera || !this.renderer || !this.composer) return;

    const { width, height } = this.getContainerSize();
    const prevMobile = this.isMobileView;
    this.isMobileView = width < 900;

    // ✅ cap DPR también aquí (iOS puede cambiar viewport en scroll)
    const dpr = this.isMobileView
      ? Math.min(window.devicePixelRatio || 1, 1.5)
      : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);

    if (this.isMobileView && this.controls.exposure <= 0) this.controls.exposure = 1.35;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);

    // si estamos en mobile y ya hay modelo, re-encuadra
    if (this.isMobileView && this.modelRoot) {
      this.fitCameraToObject(this.modelRoot, 1.35);
    }

    // si venimos de desktop y entramos en mobile, cancela scroll
    if (!prevMobile && this.isMobileView && this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = undefined;
    }
  };

  private attachContextLossHandlers(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener(
      'webglcontextlost',
      (e: Event) => {
        e.preventDefault();
        cancelAnimationFrame(this.animationFrameId);
        console.warn('⚠️ WebGL context lost (iOS/Safari).');
      },
      false
    );

    canvas.addEventListener(
      'webglcontextrestored',
      () => {
        console.warn('✅ WebGL context restored.');
        // Reanuda el loop y fuerza resize para reestablecer targets del composer
        this.requestResize();
        this.ngZone.runOutsideAngular(() => this.animate());
      },
      false
    );
  }
}
