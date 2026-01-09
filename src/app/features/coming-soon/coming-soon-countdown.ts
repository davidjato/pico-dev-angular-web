// Lógica Three.js para el contador neón coming soon
// Se importa y se usa en el componente Angular
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface ComingSoonCountdownOptions {
    container: HTMLElement;
    guiContainer?: HTMLElement;
}

export class ComingSoonCountdown3D {
    private scene!: THREE.Scene;
    private camera!: THREE.OrthographicCamera;
    private renderer!: THREE.WebGLRenderer;
    private composer!: EffectComposer;
    private controls!: OrbitControls | undefined;
    private bloomPass!: UnrealBloomPass;
    private floor: Reflector | undefined;
    private root!: THREE.Group;
    private secondBoxes: THREE.Group[] = [];
    private ALL_DIGIT_GROUPS: THREE.Group[] = [];
    private paused = false;
    private DIGITS = 0;
    private TARGET_DATE = new Date('2026-09-30T00:00:00+02:00');
    private orthoSize = 60;
    private reflectResolutionScale = 0.3;
    private currentReflectStrength = 0.08;
    private baseFloorColor = new THREE.Color(0x0a0f14);
    private animationId: number | null = null;
    private guiInitialized = false;
    private resizeRaf = 0;
    private frameCount = 0;
    private canvasRestoreObserver: MutationObserver | null = null;

    constructor(private options: ComingSoonCountdownOptions) {
        // No ejecutar en SSR
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            console.warn('⚠️ COMING-SOON: Ejecutándose en servidor (SSR), saltando inicialización');
            return;
        }
        this.init();
    }

    private addGUIControls() {
        if (this.guiInitialized || !this.options.guiContainer) return;
        this.guiInitialized = true;

        const params = {
            neonColor: '#' + this.CONFIG.NEON_COLOR.getHexString(),
            offColor: '#' + this.CONFIG.OFF_COLOR.getHexString(),
            panelBgColor: '#' + this.CONFIG.PANEL_COLOR.getHexString(),
            frameColor: '#' + this.CONFIG.FRAME_COLOR.getHexString(),
            fogColor: '#05070c',
            floorColor: '#' + this.baseFloorColor.getHexString(),

            bloomStrength: this.bloomPass.strength,
            bloomRadius: this.bloomPass.radius,
            bloomThreshold: this.bloomPass.threshold,

            zoom: this.camera.zoom,
            cameraPosX: this.camera.position.x,
            cameraPosY: this.camera.position.y,
            cameraPosZ: this.camera.position.z,
            enableOrbitControls: !!this.controls,

            digitWidth: this.CONFIG.DIGIT_W,
            digitHeight: this.CONFIG.DIGIT_H,
            segmentThickness: this.CONFIG.SEG_T,
            panelPaddingX: this.CONFIG.PANEL_PADDING_X,
            panelPaddingY: this.CONFIG.PANEL_PADDING_Y,
            gapBetweenPanels: this.CONFIG.GAP_BETWEEN_PANELS,
            gapBetweenDigits: this.CONFIG.GAP_BETWEEN_DIGITS,

            reflectionStrength: this.currentReflectStrength,
            reflectionResolution: this.reflectResolutionScale,

            panelBgOpacity: 0.85,
            offSegmentOpacity: 0.6,

            rootPosY: this.root.position.y
        };

        // GUI deshabilitado
        /*
        const gui = new GUI();
        gui.title('⏱️ Coming Soon');

        // Añadir al contenedor compartido
        this.options.guiContainer.appendChild(gui.domElement);

        // Configurar estilos para quitar posicionamiento fixed
        gui.domElement.style.position = 'relative';
        gui.domElement.style.top = 'auto';
        gui.domElement.style.right = 'auto';
        gui.domElement.style.margin = '0';

        // === COLORES ===
        const colorsFolder = gui.addFolder('🎨 Colores');
        colorsFolder.addColor(params, 'neonColor').name('Neón').onChange((v: string) => {
            this.CONFIG.NEON_COLOR.set(v);
            this.ALL_DIGIT_GROUPS.forEach(g => {
                (g.userData['onMat'] as THREE.MeshBasicMaterial).color.set(this.CONFIG.NEON_COLOR);
            });
        });
        colorsFolder.addColor(params, 'offColor').name('Segmento Apagado').onChange((v: string) => {
            this.CONFIG.OFF_COLOR.set(v);
        });
        colorsFolder.addColor(params, 'panelBgColor').name('Fondo Panel').onChange((v: string) => {
            this.CONFIG.PANEL_COLOR.set(v);
        });
        colorsFolder.addColor(params, 'frameColor').name('Marco').onChange((v: string) => {
            this.CONFIG.FRAME_COLOR.set(v);
            this.secondBoxes.forEach(panel => {
                panel.traverse(obj => {
                    if (obj.type === 'LineSegments') {
                        const mat = (obj as THREE.LineSegments).material;
                        if ((mat as any).color) {
                            (mat as THREE.LineBasicMaterial).color.set(this.CONFIG.FRAME_COLOR);
                            (mat as THREE.LineBasicMaterial).needsUpdate = true;
                        }
                    }
                });
            });
        });
        colorsFolder.addColor(params, 'fogColor').name('Niebla').onChange((v: string) => {
            if (this.scene.fog) (this.scene.fog as THREE.Fog).color.set(v);
        });
        colorsFolder.addColor(params, 'floorColor').name('Piso Reflectante').onChange((v: string) => {
            this.baseFloorColor.set(v);
            if (this.floor) {
                (this.floor.material as any).uniforms.color.value.copy(this.baseFloorColor).multiplyScalar(this.currentReflectStrength);
            }
        });

        // === BLOOM ===
        const bloomFolder = gui.addFolder('✨ Bloom');
        bloomFolder.add(params, 'bloomStrength', 0, 5, 0.01).name('Fuerza').onChange((v: number) => {
            this.bloomPass.strength = v;
        });
        bloomFolder.add(params, 'bloomRadius', 0, 2, 0.01).name('Radio').onChange((v: number) => {
            this.bloomPass.radius = v;
        });
        bloomFolder.add(params, 'bloomThreshold', 0, 1, 0.01).name('Umbral').onChange((v: number) => {
            this.bloomPass.threshold = v;
        });

        // === CÁMARA ===
        const cameraFolder = gui.addFolder('📷 Cámara');
        cameraFolder.add(params, 'zoom', 0.05, 3, 0.01).name('Zoom').onChange((v: number) => {
            this.camera.zoom = v;
            this.camera.updateProjectionMatrix();
        });
        cameraFolder.add(params, 'cameraPosX', -100, 100, 1).name('Posición X').onChange((v: number) => {
            this.camera.position.x = v;
        });
        cameraFolder.add(params, 'cameraPosY', -100, 100, 1).name('Posición Y').onChange((v: number) => {
            this.camera.position.y = v;
        });
        cameraFolder.add(params, 'cameraPosZ', -200, 200, 1).name('Posición Z').onChange((v: number) => {
            this.camera.position.z = v;
        });
        cameraFolder.add(params, 'enableOrbitControls').name('Controles Órbita').onChange((v: boolean) => {
            if (v && !this.controls) {
                this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            } else if (!v && this.controls) {
                this.controls.dispose();
                this.controls = undefined;
            }
        });

        // === DIMENSIONES ===
        const dimensionsFolder = gui.addFolder('📐 Dimensiones');
        dimensionsFolder.add(params, 'digitWidth', 5, 25, 0.5).name('Ancho Dígito').onChange((v: number) => {
            this.CONFIG.DIGIT_W = v;
        });
        dimensionsFolder.add(params, 'digitHeight', 10, 40, 0.5).name('Alto Dígito').onChange((v: number) => {
            this.CONFIG.DIGIT_H = v;
        });
        dimensionsFolder.add(params, 'segmentThickness', 0.5, 5, 0.1).name('Grosor Segmento').onChange((v: number) => {
            this.CONFIG.SEG_T = v;
        });
        dimensionsFolder.add(params, 'panelPaddingX', 0, 20, 0.5).name('Padding X Panel').onChange((v: number) => {
            this.CONFIG.PANEL_PADDING_X = v;
        });
        dimensionsFolder.add(params, 'panelPaddingY', 0, 20, 0.5).name('Padding Y Panel').onChange((v: number) => {
            this.CONFIG.PANEL_PADDING_Y = v;
        });
        dimensionsFolder.add(params, 'gapBetweenPanels', 0, 20, 0.5).name('Espacio Entre Paneles').onChange((v: number) => {
            this.CONFIG.GAP_BETWEEN_PANELS = v;
            this.layout();
        });
        dimensionsFolder.add(params, 'gapBetweenDigits', 0, 10, 0.5).name('Espacio Entre Dígitos').onChange((v: number) => {
            this.CONFIG.GAP_BETWEEN_DIGITS = v;
        });

        // === REFLEXIONES ===
        const reflectionsFolder = gui.addFolder('💧 Reflexiones');
        reflectionsFolder.add(params, 'reflectionStrength', 0, 1, 0.01).name('Intensidad').onChange((v: number) => {
            this.currentReflectStrength = v;
            if (this.floor) {
                (this.floor.material as any).uniforms.color.value.copy(this.baseFloorColor).multiplyScalar(v);
            }
        });
        reflectionsFolder.add(params, 'reflectionResolution', 0.1, 2, 0.1).name('Resolución').onChange((v: number) => {
            this.reflectResolutionScale = v;
            this.buildFloor();
        });

        // === EFECTOS ===
        const effectsFolder = gui.addFolder('⚡ Efectos');
        effectsFolder.add(params, 'panelBgOpacity', 0, 1, 0.01).name('Opacidad Fondo Panel').onChange((v: number) => {
            this.secondBoxes.forEach(panel => {
                panel.traverse(obj => {
                    if (obj instanceof THREE.Mesh && obj.geometry.type === 'PlaneGeometry') {
                        (obj.material as THREE.MeshBasicMaterial).opacity = v;
                    }
                });
            });
        });
        effectsFolder.add(params, 'offSegmentOpacity', 0, 1, 0.01).name('Opacidad Segmento OFF').onChange((v: number) => {
            this.ALL_DIGIT_GROUPS.forEach(g => {
                (g.userData['offMat'] as THREE.MeshBasicMaterial).opacity = v;
            });
        });

        // === POSICIÓN ===
        const positionFolder = gui.addFolder('📍 Posición');
        positionFolder.add(params, 'rootPosY', -50, 50, 0.5).name('Altura Contador').onChange((v: number) => {
            this.root.position.y = v;
        });
        */
    }

    private CONFIG = (() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 900;
        return {
            NEON_COLOR: new THREE.Color('#FF7A00'),
            FRAME_COLOR: new THREE.Color('#FF7A00'),
            OFF_COLOR: new THREE.Color('#0b151a'),
            PANEL_COLOR: new THREE.Color('#091016'),
            BLOOM_STRENGTH: 3.0,
            BLOOM_RADIUS: 0.6,
            BLOOM_THRESHOLD: 0.0,
            DIGIT_W: isMobile ? 9 : 12,
            DIGIT_H: isMobile ? 15 : 20,
            SEG_T: isMobile ? 1.2 : 2.2,
            PANEL_PADDING_X: isMobile ? 4 : 6,
            PANEL_PADDING_Y: isMobile ? 3 : 8,
            GAP_BETWEEN_PANELS: isMobile ? 4 : 6,
            GAP_BETWEEN_DIGITS: isMobile ? 1.5 : 3.5
        };
    })();

    private SEGMENTS_BY_DIGIT = {
        0: [0, 1, 2, 3, 4, 5],
        1: [1, 2],
        2: [0, 1, 6, 4, 3],
        3: [0, 1, 2, 3, 6],
        4: [5, 6, 1, 2],
        5: [0, 5, 6, 2, 3],
        6: [0, 5, 4, 3, 2, 6],
        7: [0, 1, 2],
        8: [0, 1, 2, 3, 4, 5, 6],
        9: [0, 1, 2, 3, 5, 6]
    };

    private init() {
        console.log('🎬 COMING-SOON: Iniciando Three.js');
        const container = this.options.container;
        console.log('📦 COMING-SOON: Contenedor:', container);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x05070c, 120, 220);
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.OrthographicCamera(
            -this.orthoSize * aspect, this.orthoSize * aspect,
            this.orthoSize, -this.orthoSize,
            0.1, 1000
        );
        const isMobile = window.innerWidth <= 900;
        this.camera.zoom = isMobile ? 0.28 : 0.44;
        const cameraZ = isMobile ? 120 : 120;
        this.camera.position.set(0, 0, cameraZ);
        this.camera.lookAt(0, 0, 0);
        this.camera.rotation.set(0, 0, 0);
        this.camera.updateProjectionMatrix();
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        const dpr = isMobile
            ? Math.min(window.devicePixelRatio || 1, 1.5)
            : Math.min(window.devicePixelRatio || 1, 2);
        this.renderer.setPixelRatio(dpr);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Forzar estilos inline para iOS con !important
        const canvas = this.renderer.domElement;
        canvas.style.setProperty('display', 'block', 'important');
        canvas.style.setProperty('width', '100%', 'important');
        canvas.style.setProperty('height', '100%', 'important');
        canvas.style.setProperty('position', 'absolute', 'important');
        canvas.style.setProperty('top', '0', 'important');
        canvas.style.setProperty('left', '0', 'important');
        canvas.style.setProperty('visibility', 'visible', 'important');
        canvas.style.setProperty('opacity', '1', 'important');
        canvas.style.setProperty('z-index', '1', 'important');
        canvas.style.setProperty('pointer-events', 'none', 'important'); // Cambiar a 'none' para permitir scroll
        
        // Forzar estilos en el contenedor también con !important
        container.style.setProperty('display', 'block', 'important');
        container.style.setProperty('visibility', 'visible', 'important');
        container.style.setProperty('opacity', '1', 'important');
        container.style.setProperty('position', 'absolute', 'important');
        
        // Forzar estilos en el SECTION parent (#collab)
        const section = container.parentElement;
        if (section) {
            section.style.setProperty('display', 'block', 'important');
            section.style.setProperty('visibility', 'visible', 'important');
            section.style.setProperty('opacity', '1', 'important');
            section.style.setProperty('position', 'relative', 'important');
            section.style.setProperty('width', '100%', 'important');
            section.style.setProperty('height', '100vh', 'important');
            section.style.setProperty('overflow', 'visible', 'important');
            console.log('✅ COMING-SOON: Estilos forzados en SECTION', section.tagName, section.id);
        }
        
        // Forzar estilos en feature-coming-soon (host component)
        const featureComingSoon = section?.parentElement;
        if (featureComingSoon && featureComingSoon.tagName.toLowerCase() === 'feature-coming-soon') {
            featureComingSoon.style.setProperty('display', 'block', 'important');
            featureComingSoon.style.setProperty('visibility', 'visible', 'important');
            featureComingSoon.style.setProperty('opacity', '1', 'important');
            featureComingSoon.style.setProperty('width', '100%', 'important');
            featureComingSoon.style.setProperty('height', '100vh', 'important');
            console.log('✅ COMING-SOON: Estilos forzados en feature-coming-soon');
        }

        container.appendChild(canvas);
        console.log('✅ COMING-SOON: Canvas agregado. Dimensiones:', canvas.width, 'x', canvas.height);
        console.log('🎨 COMING-SOON: Estilos del canvas:', {
            display: canvas.style.display,
            width: canvas.style.width,
            height: canvas.style.height
        });

        // Agregar MutationObserver para detectar cambios de estilos
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const target = mutation.target as HTMLElement;
                    const rect = target.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) {
                        console.error('🚨 MUTATION DETECTED: Elemento colapsado a 0x0:', {
                            tag: target.tagName,
                            id: target.id,
                            classes: target.className,
                            computedDisplay: getComputedStyle(target).display,
                            computedWidth: getComputedStyle(target).width,
                            computedHeight: getComputedStyle(target).height
                        });
                        
                        // Forzar dimensiones inmediatamente
                        if (target.tagName === 'SECTION') {
                            target.style.setProperty('width', '100%', 'important');
                            target.style.setProperty('height', '100vh', 'important');
                            target.style.setProperty('display', 'block', 'important');
                            console.warn('🔧 FORCED SECTION dimensions');
                        }
                    }
                }
            });
        });
        
        // Observar el SECTION y todos sus ancestros (reusar la variable ya declarada arriba)
        if (section) {
            observer.observe(section, { attributes: true, attributeFilter: ['style'] });
            const featureComingSoon = section.parentElement;
            if (featureComingSoon) {
                observer.observe(featureComingSoon, { attributes: true, attributeFilter: ['style'] });
            }
        }

        // Context loss handlers para iOS
        this.attachContextLossHandlers();
        
        // Vigilante anti-SSR: detectar si el canvas es removido del DOM
        this.setupCanvasRestoreObserver();
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableRotate = false;
        this.controls.enablePan = false;
        this.controls.enableZoom = false; // Deshabilitar zoom
        this.controls.enableDamping = true;
        this.controls.target.set(0, 0, 0);
        this.controls.update();
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this.CONFIG.BLOOM_STRENGTH,
            this.CONFIG.BLOOM_RADIUS,
            this.CONFIG.BLOOM_THRESHOLD
        );
        this.composer.addPass(this.bloomPass);
        this.buildFloor();
        this.root = new THREE.Group();
        this.scene.add(this.root);
        const initialSeconds = this.secondsUntil(this.TARGET_DATE);
        this.DIGITS = Math.max(1, initialSeconds.toString().length);
        for (let i = 0; i < this.DIGITS; i++) {
            const p = this.createPanel(1);
            this.root.add(p);
            this.secondBoxes.push(p);
        }
        this.layout();

        // iOS: resize real al hacer scroll (URL bar)
        window.addEventListener('resize', this.requestResize, { passive: true });
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', this.requestResize, { passive: true });
            window.visualViewport.addEventListener('scroll', this.requestResize, { passive: true });
        }
        
        // DEBUG: Detectar scroll en mobile
        if (isMobile) {
            window.addEventListener('scroll', () => {
                const canvas = this.renderer.domElement;
                const section = this.options.container.parentElement;
                const sectionRect = section?.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                const computedCanvas = getComputedStyle(canvas);
                
                console.log('📜 MOBILE SCROLL:', {
                    scrollY: window.scrollY,
                    sectionTop: sectionRect?.top,
                    sectionBottom: sectionRect?.bottom,
                    canvasTop: canvasRect.top,
                    canvasBottom: canvasRect.bottom,
                    canvasInViewport: canvasRect.top < window.innerHeight && canvasRect.bottom > 0,
                    canvasDisplay: computedCanvas.display,
                    canvasVisibility: computedCanvas.visibility,
                    canvasOpacity: computedCanvas.opacity,
                    canvasZIndex: computedCanvas.zIndex,
                    canvasPosition: computedCanvas.position
                });
            }, { passive: true });
        }

        this.animate();
        // Añadir GUI para color y zoom (debe ir después de inicializar cámara y escena)
        this.addGUIControls();
    }

    private buildFloor() {
        if (this.floor) {
            this.scene.remove(this.floor);
            this.floor.geometry?.dispose?.();
            // Reflector.material is always a single Material, not an array
            (this.floor.material as THREE.Material).dispose?.();
        }
        const floorGeo = new THREE.PlaneGeometry(2000, 2000);

        // Usar visualViewport para dimensiones reales en iOS
        const vv = window.visualViewport;
        const width = vv?.width ?? window.innerWidth;
        const height = vv?.height ?? window.innerHeight;
        const isMobile = width <= 900;

        // Cap DPR consistente con el resto del código
        const dpr = isMobile
            ? Math.min(window.devicePixelRatio || 1, 1.5)
            : Math.min(window.devicePixelRatio || 1, 2);

        const texW = Math.max(128, Math.floor(width * dpr * this.reflectResolutionScale));
        const texH = Math.max(128, Math.floor(height * dpr * this.reflectResolutionScale));
        this.floor = new Reflector(floorGeo, {
            textureWidth: texW,
            textureHeight: texH,
            color: this.baseFloorColor.getHex(),
            multisample: 4,
            clipBias: 0.003
        });
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.position.y = -22;
        this.scene.add(this.floor);
        (this.floor.material as any).uniforms.color.value.copy(this.baseFloorColor).multiplyScalar(this.currentReflectStrength);
    }

    private createDigitGroup(): THREE.Group {
        const g = new THREE.Group();
        const W2 = this.CONFIG.DIGIT_W / 2;
        const H2 = this.CONFIG.DIGIT_H / 2;
        const t = this.CONFIG.SEG_T;
        const hW = this.CONFIG.DIGIT_W - 2 * t;
        const hH = t;
        const vW = t;
        const vH = H2 - 1.5 * t;
        const onMat = new THREE.MeshBasicMaterial({ color: this.CONFIG.NEON_COLOR, transparent: true, opacity: 1 });
        const offMat = new THREE.MeshBasicMaterial({ color: this.CONFIG.OFF_COLOR, transparent: true, opacity: 0.6 });
        function horiz(y: number) {
            const geo = new THREE.PlaneGeometry(hW, hH);
            const mesh = new THREE.Mesh(geo, offMat.clone());
            mesh.position.y = y;
            g.add(mesh);
            return mesh;
        }
        function vert(x: number, y: number) {
            const geo = new THREE.PlaneGeometry(vW, vH);
            const mesh = new THREE.Mesh(geo, offMat.clone());
            mesh.position.set(x, y, 0);
            g.add(mesh);
            return mesh;
        }
        const A = horiz(H2 - hH / 2);
        const B = vert(W2 - vW / 2, (H2 - t - vH / 2));
        const C = vert(W2 - vW / 2, -(H2 - t - vH / 2));
        const D = horiz(-H2 + hH / 2);
        const E = vert(-W2 + vW / 2, -(H2 - t - vH / 2));
        const F = vert(-W2 + vW / 2, (H2 - t - vH / 2));
        const G = horiz(0);
        g.userData = {
            segments: [A, B, C, D, E, F, G],
            onMat,
            offMat,
            setValue: (value: number) => {
                const v = Math.max(0, Math.min(9, value | 0));
                const list = this.SEGMENTS_BY_DIGIT[v as keyof typeof this.SEGMENTS_BY_DIGIT];
                (g.userData['segments'] as THREE.Mesh[]).forEach((mesh: THREE.Mesh, i: number) => {
                    const on = list.includes(i);
                    mesh.material = (on ? onMat : offMat);
                    mesh.material.needsUpdate = true;
                });
            },
            flicker: (intensity = 0.02) => {
                (g.userData['segments'] as THREE.Mesh[]).forEach((mesh: THREE.Mesh) => {
                    if (mesh.material === onMat) {
                        const base = 1.0;
                        const delta = (Math.random() - 0.5) * intensity;
                        (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.88, Math.min(1.0, base + delta));
                        mesh.material.needsUpdate = true;
                    }
                });
            }
        };
        this.ALL_DIGIT_GROUPS.push(g);
        return g;
    }

    private createPanel(digitCount = 1): THREE.Group {
        const panel = new THREE.Group();
        const padX = this.CONFIG.PANEL_PADDING_X;
        const padY = this.CONFIG.PANEL_PADDING_Y;
        const totalW = digitCount * this.CONFIG.DIGIT_W + (digitCount - 1) * this.CONFIG.GAP_BETWEEN_DIGITS + padX * 2;
        const totalH = this.CONFIG.DIGIT_H + padY * 2;
        const bgGeo = new THREE.PlaneGeometry(totalW, totalH, 1, 1);
        const bgMat = new THREE.MeshBasicMaterial({ color: this.CONFIG.PANEL_COLOR, transparent: true, opacity: 0.85 });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.z = -0.2;
        panel.add(bg);
        const frameGeo = new THREE.BoxGeometry(totalW, totalH, 0.4);
        const edges = new THREE.EdgesGeometry(frameGeo);
        const frame = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: this.CONFIG.FRAME_COLOR }));
        frame.position.z = -0.21;
        panel.add(frame);
        const digits: THREE.Group[] = [];
        const startX = - ((digitCount - 1) * (this.CONFIG.DIGIT_W + this.CONFIG.GAP_BETWEEN_DIGITS)) / 2;
        for (let i = 0; i < digitCount; i++) {
            const d = this.createDigitGroup();
            d.position.x = startX + i * (this.CONFIG.DIGIT_W + this.CONFIG.GAP_BETWEEN_DIGITS);
            panel.add(d);
            digits.push(d);
        }
        panel.userData = {
            digits,
            setNumber: (n: number, pad = digitCount) => {
                const s = Math.abs(n | 0).toString().padStart(pad, '0').slice(-pad);
                for (let i = 0; i < pad; i++) digits[i].userData['setValue'](Number(s[i]));
            },
            flicker: () => { digits.forEach(d => d.userData['flicker']()); }
        };
        return panel;
    }

    private layout() {
        const widths = this.secondBoxes.map(obj => {
            obj.updateWorldMatrix(true, true);
            const box = new THREE.Box3().setFromObject(obj);
            return box.getSize(new THREE.Vector3()).x;
        });
        const totalW = widths.reduce((a, b) => a + b, 0) + this.CONFIG.GAP_BETWEEN_PANELS * (widths.length - 1);
        let x = -totalW / 2;
        this.secondBoxes.forEach((obj, i) => {
            const w = widths[i];
            obj.position.x = x + w / 2;
            x += w + this.CONFIG.GAP_BETWEEN_PANELS;
        });
        this.root.position.y = 4;
        this.root.rotation.set(0, 0, 0);
    }

    private secondsUntil(date: Date) {
        return Math.max(0, Math.floor((date.getTime() - new Date().getTime()) / 1000));
    }

    private updateCountdown() {
        if (this.paused) return;
        const secs = this.secondsUntil(this.TARGET_DATE);
        const s = secs.toString().padStart(this.DIGITS, '0');
        for (let i = 0; i < this.DIGITS; i++) {
            this.secondBoxes[i].userData['setNumber'](Number(s[i]), 1);
            this.secondBoxes[i].userData['flicker']();
        }
    }

    private requestResize = () => {
        if (this.resizeRaf) return;
        this.resizeRaf = requestAnimationFrame(() => {
            this.resizeRaf = 0;
            this.onResize();
        });
    };

    private onResize = () => {
        const vv = window.visualViewport;
        const width = vv?.width ?? window.innerWidth;
        const height = vv?.height ?? window.innerHeight;

        // Prevenir resize si las dimensiones son inválidas
        if (width < 100 || height < 100) {
            console.warn('⚠️ Dimensiones inválidas detectadas en countdown, saltando resize:', width, height);
            return;
        }

        const aspect = width / height;
        this.camera.left = -this.orthoSize * aspect;
        this.camera.right = this.orthoSize * aspect;
        this.camera.top = this.orthoSize;
        this.camera.bottom = -this.orthoSize;

        // Alejar más la cámara y reducir zoom en mobile también al redimensionar
        const isMobile = width <= 900;
        this.camera.zoom = isMobile ? 0.28 : 0.44;
        const cameraZ = isMobile ? 250 : 120;
        this.camera.position.z = cameraZ;
        this.camera.updateProjectionMatrix();

        // Cap DPR también en resize
        const dpr = isMobile
            ? Math.min(window.devicePixelRatio || 1, 1.5)
            : Math.min(window.devicePixelRatio || 1, 2);
        this.renderer.setPixelRatio(dpr);

        this.renderer.setSize(width, height, false);
        this.composer.setSize(width, height);
        
        // Re-aplicar estilos para prevenir que iOS oculte el canvas
        const canvas = this.renderer.domElement;
        canvas.style.display = 'block';
        canvas.style.visibility = 'visible';
        canvas.style.opacity = '1';
        canvas.style.zIndex = '1';
        
        console.log('✅ COMING-SOON: Resize completado - Canvas:', {
            width: canvas.width,
            height: canvas.height,
            display: canvas.style.display,
            visible: canvas.offsetParent !== null
        });
        
        this.buildFloor();
        this.layout();
    };

    private attachContextLossHandlers(): void {
        const canvas = this.renderer.domElement;

        canvas.addEventListener(
            'webglcontextlost',
            (e: Event) => {
                e.preventDefault();
                if (this.animationId) cancelAnimationFrame(this.animationId);
                console.warn('⚠️ WebGL context lost (iOS/Safari) - Coming Soon.');
            },
            false
        );

        canvas.addEventListener(
            'webglcontextrestored',
            () => {
                console.warn('✅ WebGL context restored - Coming Soon.');
                // Asegurar que el canvas sea visible
                canvas.style.display = 'block';
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                // Reanuda el loop y fuerza resize para reestablecer targets del composer
                setTimeout(() => {
                    this.requestResize();
                    this.animate();
                }, 50);
            },
            false
        );
    }

    private setupCanvasRestoreObserver(): void {
        const canvas = this.renderer.domElement;
        const isMobile = window.innerWidth <= 900;
        
        if (!isMobile) return; // Solo en mobile
        
        console.log('🔍 MOBILE: Iniciando vigilante anti-SSR del canvas');
        
        // Observar si el canvas es removido del contenedor
        this.canvasRestoreObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach((node) => {
                        if (node === canvas) {
                            console.warn('🚨 MOBILE: Canvas REMOVIDO del DOM - Restaurando...');
                            // Restaurar inmediatamente
                            if (!this.options.container.contains(canvas)) {
                                this.options.container.appendChild(canvas);
                                console.log('✅ MOBILE: Canvas restaurado al contenedor');
                            }
                        }
                    });
                }
            });
        });
        
        // Observar el contenedor
        this.canvasRestoreObserver.observe(this.options.container, {
            childList: true,
            subtree: false
        });
    }

    private animate = () => {
        // ✅ Programar el siguiente frame PRIMERO
        this.animationId = requestAnimationFrame(this.animate);

        // Protección contra context loss y canvas inválido
        if (!this.renderer || !this.composer) {
            console.warn('⚠️ COMING-SOON: Renderer o composer no disponible');
            return;
        }
        
        // Verificar que el canvas tenga dimensiones válidas
        const canvas = this.renderer.domElement;
        if (!canvas || canvas.width === 0 || canvas.height === 0) {
            console.warn('⚠️ COMING-SOON: Canvas inválido o con dimensiones 0');
            return;
        }
        
        // ✅ Verificar si el canvas fue removido del DOM y re-agregarlo
        if (!this.options.container.contains(canvas)) {
            console.warn('⚠️ COMING-SOON: Canvas removido del DOM, re-agregando...');
            this.options.container.appendChild(canvas);
            // Re-aplicar estilos
            canvas.style.display = 'block';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.visibility = 'visible';
            canvas.style.opacity = '1';
            canvas.style.zIndex = '1';
            
            // Forzar estilos en el contenedor también
            this.options.container.style.display = 'block';
            this.options.container.style.visibility = 'visible';
            this.options.container.style.opacity = '1';
        }
        
        // ✅ MOBILE: Forzar estilos SIEMPRE en cada frame para prevenir SSR
        const isMobile = window.innerWidth <= 900;
        if (isMobile) {
            // Verificar que el canvas esté en el DOM
            if (!this.options.container.contains(canvas)) {
                console.warn('🚨 MOBILE ANIMATE: Canvas NO está en el DOM - Restaurando...');
                this.options.container.appendChild(canvas);
            }
            
            // Forzar canvas SIEMPRE en cada frame
            canvas.style.setProperty('display', 'block', 'important');
            canvas.style.setProperty('visibility', 'visible', 'important');
            canvas.style.setProperty('opacity', '1', 'important');
            canvas.style.setProperty('position', 'absolute', 'important');
            canvas.style.setProperty('top', '0', 'important');
            canvas.style.setProperty('left', '0', 'important');
            canvas.style.setProperty('width', '100%', 'important');
            canvas.style.setProperty('height', '100%', 'important');
            canvas.style.setProperty('z-index', '1', 'important');
            canvas.style.setProperty('pointer-events', 'none', 'important');
            canvas.style.setProperty('transform', 'translateZ(0)', 'important');
            canvas.style.setProperty('overflow', 'visible', 'important');
            canvas.style.setProperty('contain', 'none', 'important');
            canvas.style.setProperty('clip-path', 'none', 'important');
            
            // Forzar contenedor SIEMPRE
            this.options.container.style.setProperty('display', 'block', 'important');
            this.options.container.style.setProperty('visibility', 'visible', 'important');
            this.options.container.style.setProperty('opacity', '1', 'important');
            this.options.container.style.setProperty('position', 'absolute', 'important');
            this.options.container.style.setProperty('top', '0', 'important');
            this.options.container.style.setProperty('left', '0', 'important');
            this.options.container.style.setProperty('width', '100%', 'important');
            this.options.container.style.setProperty('height', '100%', 'important');
            this.options.container.style.setProperty('pointer-events', 'none', 'important');
            this.options.container.style.setProperty('transform', 'translateZ(0)', 'important');
            this.options.container.style.setProperty('overflow', 'visible', 'important');
            this.options.container.style.setProperty('contain', 'none', 'important');
            this.options.container.style.setProperty('clip-path', 'none', 'important');
            
            // Forzar sección SIEMPRE
            const section = this.options.container.parentElement;
            if (section) {
                section.style.setProperty('display', 'block', 'important');
                section.style.setProperty('visibility', 'visible', 'important');
                section.style.setProperty('opacity', '1', 'important');
                section.style.setProperty('position', 'relative', 'important');
                section.style.setProperty('width', '100%', 'important');
                section.style.setProperty('height', '100vh', 'important');
                section.style.setProperty('overflow', 'visible', 'important');
                section.style.setProperty('transform', 'translateZ(0)', 'important');
                section.style.setProperty('contain', 'none', 'important');
                section.style.setProperty('clip-path', 'none', 'important');
            }
            
            // Forzar host SIEMPRE
            const featureComingSoon = section?.parentElement;
            if (featureComingSoon && featureComingSoon.tagName.toLowerCase() === 'feature-coming-soon') {
                featureComingSoon.style.setProperty('display', 'block', 'important');
                featureComingSoon.style.setProperty('visibility', 'visible', 'important');
                featureComingSoon.style.setProperty('opacity', '1', 'important');
                featureComingSoon.style.setProperty('width', '100%', 'important');
                featureComingSoon.style.setProperty('height', '100vh', 'important');
                featureComingSoon.style.setProperty('overflow', 'visible', 'important');
                featureComingSoon.style.setProperty('contain', 'none', 'important');
            }
        }
        
        // ✅ Verificar si el canvas se ha vuelto invisible y forzar visibilidad (fallback para desktop)
        if (canvas.offsetParent === null && !isMobile) {
            // Log para debug en mobile
            const rect = canvas.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
            console.warn('⚠️ COMING-SOON: Canvas invisible - offsetParent null', {
                rect: {top: rect.top, bottom: rect.bottom, height: rect.height},
                inViewport: isInViewport,
                windowHeight: window.innerHeight
            });
            console.warn('⚠️ COMING-SOON: Canvas invisible (offsetParent null), forzando visibilidad...');
            canvas.style.setProperty('display', 'block', 'important');
            canvas.style.setProperty('visibility', 'visible', 'important');
            canvas.style.setProperty('opacity', '1', 'important');
            canvas.style.setProperty('position', isMobile ? 'fixed' : 'absolute', 'important');
            canvas.style.setProperty('z-index', '1', 'important');
            canvas.style.setProperty('pointer-events', 'none', 'important'); // Cambiar a 'none' para permitir scroll
            
            // Forzar en contenedor
            this.options.container.style.setProperty('display', 'block', 'important');
            this.options.container.style.setProperty('visibility', 'visible', 'important');
            this.options.container.style.setProperty('opacity', '1', 'important');
            this.options.container.style.setProperty('position', 'absolute', 'important');
            
            // Forzar en SECTION parent
            const section = this.options.container.parentElement;
            if (section) {
                section.style.setProperty('display', 'block', 'important');
                section.style.setProperty('visibility', 'visible', 'important');
                section.style.setProperty('opacity', '1', 'important');
                section.style.setProperty('position', 'relative', 'important');
                section.style.setProperty('width', '100%', 'important');
                section.style.setProperty('height', '100vh', 'important');
                section.style.setProperty('overflow', 'visible', 'important');
            }
            
            // Forzar en feature-coming-soon
            const featureComingSoon = section?.parentElement;
            if (featureComingSoon && featureComingSoon.tagName.toLowerCase() === 'feature-coming-soon') {
                featureComingSoon.style.setProperty('display', 'block', 'important');
                featureComingSoon.style.setProperty('visibility', 'visible', 'important');
                featureComingSoon.style.setProperty('opacity', '1', 'important');
                featureComingSoon.style.setProperty('width', '100%', 'important');
                featureComingSoon.style.setProperty('height', '100vh', 'important');
                featureComingSoon.style.setProperty('min-width', '100vw', 'important');
                featureComingSoon.style.setProperty('min-height', '100vh', 'important');
            }
        }
        
        this.root.position.z = 0;
        this.updateCountdown();
        this.controls?.update();
        this.composer.render();
        
        // Log cada 60 frames
        this.frameCount++;
        if (this.frameCount === 1) {
            console.log('🎨 COMING-SOON: Primer frame renderizado');
            
            // Verificar toda la cadena de padres
            const parentChain: Array<{tag: string, classes: string, display: string, visibility: string, offsetParent: boolean}> = [];
            let element: HTMLElement | null = canvas;
            while (element) {
                parentChain.push({
                    tag: element.tagName,
                    classes: element.className || '(none)',
                    display: getComputedStyle(element).display,
                    visibility: getComputedStyle(element).visibility,
                    offsetParent: element.offsetParent !== null
                });
                element = element.parentElement;
            }
            
            console.log('🔍 COMING-SOON: Estado inicial canvas:', {
                inDOM: this.options.container.contains(canvas),
                offsetParent: canvas.offsetParent !== null,
                display: canvas.style.display,
                visibility: canvas.style.visibility,
                zIndex: canvas.style.zIndex,
                width: canvas.width,
                height: canvas.height,
                containerDisplay: this.options.container.style.display,
                containerVisibility: this.options.container.style.visibility
            });
            console.log('🔗 COMING-SOON: Cadena de elementos padres:', parentChain);
        } else if (this.frameCount % 60 === 0) {
            const inDOM = this.options.container.contains(canvas);
            const visible = canvas.offsetParent !== null;
            
            // Si es invisible, mostrar la cadena de padres
            if (!visible) {
                const parentChain: Array<{tag: string, classes: string, display: string, visibility: string, offsetParent: boolean}> = [];
                let element: HTMLElement | null = canvas;
                while (element && parentChain.length < 10) {
                    const computed = getComputedStyle(element);
                    const rect = element.getBoundingClientRect();
                    parentChain.push({
                        tag: element.tagName,
                        classes: element.className || '(none)',
                        display: computed.display,
                        visibility: computed.visibility,
                        offsetParent: element.offsetParent !== null
                    });
                    
                    // Log de la posición real del elemento
                    if (element.tagName === 'SECTION' || (element.tagName === 'DIV' && element.className.includes('coming-soon-root'))) {
                        const rect = element.getBoundingClientRect();
                        console.warn(`⚠️ ${element.tagName} (#${element.id || 'no-id'}) rect:`, {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height,
                            bottom: rect.bottom,
                            right: rect.right,
                            inViewport: rect.top < window.innerHeight && rect.bottom > 0
                        });
                    }
                    
                    element = element.parentElement;
                }
                console.warn(`⚠️ COMING-SOON: Frame ${this.frameCount} - Canvas INVISIBLE - Cadena de padres:`, parentChain);
            }
            
            console.log(`🔄 COMING-SOON: Frame ${this.frameCount} - Canvas visible: ${visible} Z-index: ${canvas.style.zIndex}${!visible ? ' ⚠️ INVISIBLE' : ''}${!inDOM ? ' ⚠️ NOT IN DOM' : ''}`);
        }
    };

    public pause() {
        this.paused = true;
    }
    public resume() {
        this.paused = false;
    }
    public togglePause() {
        this.paused = !this.paused;
    }
    public isPaused() {
        return this.paused;
    }
    public dispose() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
        
        // Desconectar observador de canvas
        if (this.canvasRestoreObserver) {
            this.canvasRestoreObserver.disconnect();
            this.canvasRestoreObserver = null;
        }

        window.removeEventListener('resize', this.requestResize);
        if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', this.requestResize);
            window.visualViewport.removeEventListener('scroll', this.requestResize);
        }

        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.composer) {
            this.composer.dispose();
        }
        if (this.controls) {
            this.controls.dispose();
        }
        if (this.ALL_DIGIT_GROUPS) {
            this.ALL_DIGIT_GROUPS.length = 0;
        }
        if (this.secondBoxes) {
            this.secondBoxes.length = 0;
        }
        if (this.root) {
            this.root.clear();
        }
        if (this.floor && this.scene) {
            this.scene.remove(this.floor);
            this.floor.geometry?.dispose?.();
            (this.floor.material as THREE.Material).dispose?.();
        }
        if (this.renderer && this.options.container.contains(this.renderer.domElement)) {
            this.options.container.removeChild(this.renderer.domElement);
        }
    }
}
