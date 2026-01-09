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
  afterNextRender,
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

    // Esperar a que Angular termine el hydration antes de inicializar Three.js
    if (this.isBrowser) {
      afterNextRender(() => {
        console.log('🎬 HOME: afterNextRender - Iniciando Three.js después del hydration');
        this.initThree();
        this.initGUI();
      });
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
  private frameCount = 0;

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

    // Móvil: sin animación, valores fijos
    if (this.isMobileView) {
      this.controls.cameraZ = 15;
      this.controls.bloomStrength = 0.21;
      this.controls.exposure = 1.35;
      this.neonColorHex = '#FF7A00';
      this.onControlsChange();
      return; // Salir sin configurar scroll handler
    }

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

    // Forzar mínimo 50px para prevenir canvas invisible (100px era muy restrictivo en iOS)
    const width = Math.max(50, Math.floor(rect.width || vw));
    const height = Math.max(50, Math.floor(rect.height || vh));

    return { width, height };
  }

  private initThree(): void {
    if (!this.isBrowser) return;

    console.log('🎬 HOME: Iniciando Three.js');

    const { width, height } = this.getContainerSize();
    console.log('📐 HOME: Dimensiones del contenedor:', { width, height });
    this.isMobileView = width < 900;
    console.log('📱 HOME: isMobileView =', this.isMobileView);

    // ✅ Mobile: valores visibles SIEMPRE (no dependas de la animación)
    if (this.isMobileView) {
      this.controls.exposure = 1.35;
      this.controls.bloomStrength = 0.21;
      this.controls.bloomRadius = 0.8;
      this.controls.bloomThreshold = 0;

      this.controls.cameraX = 0;
      this.controls.cameraY = 3.5; // Subir cámara para que logo se vea más abajo
      this.controls.cameraZ = 10; // Acercar más la cámara al logo
      this.controls.cameraRotX = 0;
      this.controls.cameraRotY = 0;
      this.controls.cameraRotZ = 0;

      // Logo recto en móvil
      this.controls.rotationX = 0;
      this.controls.rotationY = 0;
      this.controls.rotationZ = 0;
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

    // ✅ Forzar estilos inline para iOS
    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '0';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    canvas.style.pointerEvents = 'none';
    canvas.style.pointerEvents = 'none';

    // Marcar para que Angular no lo limpie
    canvas.setAttribute('data-threejs-canvas', 'true');
    canvas.setAttribute('ngSkipHydration', 'true');
    canvas.setAttribute('data-home-canvas', 'true');

    // ✅ IMPORTANTE: pointer-events none para no bloquear clics en botones/textos
    canvas.style.pointerEvents = 'none';

    // Forzar estilos en el contenedor también
    this.rendererContainer.nativeElement.style.display = 'block';
    this.rendererContainer.nativeElement.style.visibility = 'visible';
    this.rendererContainer.nativeElement.style.opacity = '1';
    this.rendererContainer.nativeElement.style.position = 'absolute';
    this.rendererContainer.nativeElement.style.inset = '0';
    this.rendererContainer.nativeElement.style.zIndex = '0';
    this.rendererContainer.nativeElement.style.pointerEvents = 'none';

    // Agregar al contenedor original
    this.rendererContainer.nativeElement.appendChild(canvas);
    console.log('✅ HOME: Canvas agregado al contenedor');

    // Verificar estilos del contenedor y canvas después de agregar
    setTimeout(() => {
      const containerStyles = window.getComputedStyle(this.rendererContainer.nativeElement);
      const canvasStyles = window.getComputedStyle(canvas);
      console.log('🔍 HOME: Verificación post-init:', {
        containerDisplay: containerStyles.display,
        containerVisibility: containerStyles.visibility,
        containerOpacity: containerStyles.opacity,
        containerZIndex: containerStyles.zIndex,
        canvasDisplay: canvasStyles.display,
        canvasVisibility: canvasStyles.visibility,
        canvasOpacity: canvasStyles.opacity,
        canvasZIndex: canvasStyles.zIndex,
        canvasInDOM: document.contains(canvas),
        canvasVisible: canvas.offsetParent !== null,
        containerChildren: this.rendererContainer.nativeElement.children.length
      });
    }, 100);

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
    console.log('🎬 HOME: Iniciando loop de animación...');
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
    // ✅ Programar el siguiente frame PRIMERO (antes de cualquier return)
    this.animationFrameId = requestAnimationFrame(this.animate);

    if (!this.isBrowser) return;

    // Protección contra context loss y canvas inválido
    if (!this.renderer || !this.composer) {
      console.warn('⚠️ HOME: Renderer o composer no disponible');
      return;
    }

    // ✅ CRÍTICO: Verificar si el canvas fue removido del DOM y re-agregarlo
    const canvas = this.renderer.domElement;
    if (!document.contains(canvas)) {
      console.warn('🔧 HOME: Canvas removido del DOM, re-agregando...');
      this.rendererContainer.nativeElement.appendChild(canvas);
    }

    // 🔥 FORZAR ESTILOS EN CADA FRAME (iOS Safari puede resetearlos)
    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';

    // Forzar estilos del contenedor también
    this.rendererContainer.nativeElement.style.position = 'absolute';
    this.rendererContainer.nativeElement.style.inset = '0';
    this.rendererContainer.nativeElement.style.zIndex = '0';
    this.rendererContainer.nativeElement.style.pointerEvents = 'none';

    // Verificar que el canvas tenga dimensiones válidas
    if (canvas.width === 0 || canvas.height === 0) {
      console.warn('⚠️ HOME: Canvas con dimensiones 0, saltando frame');
      return;
    }

    const elapsed = this.clock.getElapsedTime();
    this.clock.getDelta();

    // ✅ Forzar valores de cámara en móvil (evitar que otros cambios los sobrescriban)
    if (this.isMobileView) {
      this.controls.cameraX = -5;
      this.controls.cameraY = 1.5; // Subir cámara para que logo se vea más abajo
      this.controls.cameraZ = 10; // Acercar la cámara al logo
    }

    this.camera.position.set(this.controls.cameraX, this.controls.cameraY, this.controls.cameraZ);

    if (this.isMobileView) {
      // Hacer que la cámara mire al modelo en móvil
      if (this.modelRoot) {
        this.camera.lookAt(this.modelRoot.position);
      } else {
        this.camera.lookAt(0, 0, 0);
      }
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
        // ✅ Móvil: mantener logo completamente recto (0, 0, 0)
        this.modelRoot.rotation.set(0, 0, 0);

        // ✅ Cámara siempre mirando al logo en móvil
        const modelPos = new THREE.Vector3();
        this.modelRoot.getWorldPosition(modelPos);
        this.camera.lookAt(modelPos);
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

    // Log cada 60 frames (1 segundo aprox)
    this.frameCount++;
    if (this.frameCount === 1) {
      console.log('🎨 HOME: Primer frame renderizado');
      console.log('📍 HOME: Estado de la escena:', {
        hasModelRoot: !!this.modelRoot,
        sceneChildren: this.scene.children.length,
        cameraPosition: `(${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)})`,
        exposure: this.controls.exposure,
        bloomStrength: this.controls.bloomStrength
      });
    } else if (this.frameCount % 60 === 0) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(this.renderer.domElement);
      console.log(`🔄 HOME: Frame ${this.frameCount} - Canvas:`, JSON.stringify({
        visibleDOM: this.renderer.domElement.offsetParent !== null,
        zIndex: computedStyle.zIndex,
        position: computedStyle.position,
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
        hasModel: !!this.modelRoot,
        sceneChildren: this.scene.children.length
      }));
    }
  };

  private loadModelFromUrl(url: string, onDone?: () => void): void {
    const loader = new GLTFLoader();
    console.log('🔄 HOME: Cargando modelo desde:', url);

    loader.load(
      url,
      (gltf) => {
        console.log('✅ HOME: Modelo cargado exitosamente');
        if (this.modelRoot) this.scene.remove(this.modelRoot);

        this.modelRoot = gltf.scene;

        // Escalar modelo y centrar para móvil
        console.log('📦 HOME: Modelo -', JSON.stringify({
          position: { x: this.modelRoot.position.x, y: this.modelRoot.position.y, z: this.modelRoot.position.z },
          scale: { x: this.modelRoot.scale.x, y: this.modelRoot.scale.y, z: this.modelRoot.scale.z },
          rotation: { x: this.modelRoot.rotation.x, y: this.modelRoot.rotation.y, z: this.modelRoot.rotation.z },
          isMobile: this.isMobileView
        }));

        // centrar en origen
        const box = new THREE.Box3().setFromObject(this.modelRoot);
        const center = box.getCenter(new THREE.Vector3());
        this.modelRoot.position.sub(center);

        this.scene.add(this.modelRoot);
        console.log('🎭 HOME: Modelo agregado a la escena');

        // neón
        this.applyNeonToExistingMaterials(this.modelRoot);
        this.applyNeonColor();
        this.applyEmissiveIntensity(this.controls.baseEmissive);

        console.log('💡 HOME: Materiales neón aplicados, emissive:', this.controls.baseEmissive);

        if (this.isMobileView) {
          // ✅ Móvil SOLAMENTE: centrar, ajustar posición y escala
          const box2 = new THREE.Box3().setFromObject(this.modelRoot);
          const center2 = box2.getCenter(new THREE.Vector3());
          this.modelRoot.position.sub(center2);

          // Resetear rotaciones para que el logo salga recto
          this.modelRoot.rotation.set(0, 0, 0);

          // Ajuste de posición para móvil - logo más abajo en pantalla
          const size = box2.getSize(new THREE.Vector3());
          this.modelRoot.position.y += size.y * 0.5; // Reducido para bajar el logo en pantalla
          this.modelRoot.position.x += size.x * -1.08;

          // Escala más grande en móvil
          this.modelRoot.scale.set(1.5, 1.5, 1.5);

          // Usar la posición de cámara ya configurada en initThree (Z=10)
          this.camera.position.set(this.controls.cameraX, this.controls.cameraY, this.controls.cameraZ);
          this.camera.lookAt(this.modelRoot.position);
          this.camera.updateProjectionMatrix();

          console.log('📱 HOME: Modelo configurado para móvil en:', this.modelRoot.position);
          console.log('📷 HOME: Cámara móvil en Z =', this.controls.cameraZ);
        }
        // Desktop: no hace nada, el modelo ya está centrado en el origen

        this.onControlsChange();

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
    console.log('📏 HOME: onWindowResize - Dimensiones:', { width, height });

    // Prevenir resize solo si las dimensiones son realmente inválidas
    if (width < 50 || height < 50) {
      console.warn('⚠️ HOME: Dimensiones demasiado pequeñas, saltando resize:', width, height);
      return;
    }

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

    // Re-aplicar estilos para prevenir que iOS oculte el canvas
    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    canvas.style.zIndex = '1';

    // Forzar que el contenedor también sea visible
    this.rendererContainer.nativeElement.style.display = 'block';
    this.rendererContainer.nativeElement.style.visibility = 'visible';
    this.rendererContainer.nativeElement.style.opacity = '1';

    console.log('✅ HOME: Resize completado - Canvas:', {
      width: canvas.width,
      height: canvas.height,
      display: canvas.style.display,
      visible: canvas.offsetParent !== null
    });

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
        // Asegurar que el canvas sea visible
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        // Reanuda el loop y fuerza resize para reestablecer targets del composer
        setTimeout(() => {
          this.requestResize();
          this.ngZone.runOutsideAngular(() => this.animate());
        }, 50);
      },
      false
    );
  }
}
