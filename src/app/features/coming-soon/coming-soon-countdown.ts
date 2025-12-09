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

    constructor(private options: ComingSoonCountdownOptions) {
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
        const container = this.options.container;
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
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        container.appendChild(this.renderer.domElement);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableRotate = false;
        this.controls.enablePan = false;
        this.controls.enableDamping = true;
        this.controls.zoomSpeed = 0.8;
        this.controls.minZoom = 0.05;
        this.controls.maxZoom = 3;
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
        window.addEventListener('resize', this.onResize);
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
        const dpr = Math.min(window.devicePixelRatio, 2);
        const texW = Math.max(128, Math.floor(window.innerWidth * dpr * this.reflectResolutionScale));
        const texH = Math.max(128, Math.floor(window.innerHeight * dpr * this.reflectResolutionScale));
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

    private onResize = () => {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.left = -this.orthoSize * aspect;
        this.camera.right = this.orthoSize * aspect;
        this.camera.top = this.orthoSize;
        this.camera.bottom = -this.orthoSize;
        // Alejar más la cámara y reducir zoom en mobile también al redimensionar
        const isMobile = window.innerWidth <= 900;
        this.camera.zoom = isMobile ? 0.28 : 0.44;
        const cameraZ = isMobile ? 250 : 120;
        this.camera.position.z = cameraZ;
        this.camera.updateProjectionMatrix();
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        this.buildFloor();
        this.layout();
    };

    private animate = () => {
        this.animationId = requestAnimationFrame(this.animate);
        this.root.position.z = 0;
        this.updateCountdown();
        this.controls?.update();
        this.composer.render();
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
        window.removeEventListener('resize', this.onResize);
        this.renderer.dispose();
        this.composer.dispose();
        this.controls?.dispose();
        this.ALL_DIGIT_GROUPS.length = 0;
        this.secondBoxes.length = 0;
        this.root.clear();
        if (this.floor) {
            this.scene.remove(this.floor);
            this.floor.geometry?.dispose?.();
            (this.floor.material as THREE.Material).dispose?.();
        }
        if (this.options.container.contains(this.renderer.domElement)) {
            this.options.container.removeChild(this.renderer.domElement);
        }
    }
}
