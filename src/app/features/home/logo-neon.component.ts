import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectionStrategy, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, JsonPipe } from '@angular/common';

@Component({
    selector: 'app-logo-neon',
    standalone: true,
    imports: [FormsModule, DecimalPipe, JsonPipe],
    templateUrl: './logo-neon.component.html',
    styleUrls: ['./logo-neon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoNeonComponent implements AfterViewInit, OnDestroy {
    get sceneConfig() {
        return {
            cameraPosX: this.cameraPosX,
            logoOffsetX: this.logoOffsetX,
            logoOffsetY: this.logoOffsetY,
            logoOffsetZ: this.logoOffsetZ,
            logoRotationY: this.logoRotationY,
            color: this.color,
            baseIntensity: this.baseIntensity,
            bloom: this.bloom,
            threshold: this.threshold,
            radius: this.radius,
            pulse: this.pulse,
            loop: this.loop,
            onTime: this.onTime,
            offTime: this.offTime,
            spinSpeed: this.spinSpeed,
            autoRotate: this.autoRotate
        };
    }
    // Controles dinámicos
    public cameraPosX: number = 6.6;
    public logoRotationY: number = 0;
    public logoOffsetX: number = 4.7;
    public logoOffsetY: number = 0;
    public logoOffsetZ: number = 0;
    @ViewChild('scene', { static: true }) sceneRef!: ElementRef<HTMLDivElement>;

    // Three.js objects
    private renderer: any;
    private scene: any;
    private camera: any;
    private controls: any;
    private composer: any;
    private bloomPass: any;
    private neonMaterial: any;
    private fresnelMaterial: any;
    private neonGroup: any;
    private neonCore: any;
    private neonShell: any;
    private neonLight: any;
    private ring: any;
    private stlLoader: any;
    private animationId: any;
    private loopPhase: 'on' | 'off' = 'off';
    private loopTimer: any;
    private t = 0;

    // UI state (public for template binding)
    public isOn = false;
    public color = '#2efff7';
    public baseIntensity = 2.2;
    public bloom = 0.9;
    public threshold = 0.72;
    public radius = 0.4;
    public pulse = true;
    public loop = true;
    public onTime = 2.0;
    public offTime = 1.0;
    public spinSpeed = 0;
    public autoRotate = true;

    // File input reference for template
    fileInput!: HTMLInputElement;
    // --- UI Event Handlers ---
    toggleNeon() {
        if (this.isOn) {
            this.setOn(false);
        } else {
            this.flickerOn();
        }
    }

    onColorChange() {
        if (!this.neonMaterial || !this.fresnelMaterial) return;
        // Use dynamic import to ensure correct THREE instance
        import('three').then(THREE => {
            const c = new THREE.Color(this.color);
            this.neonMaterial.emissive.copy(c);
            this.fresnelMaterial.uniforms.uColor.value.copy(c);
            if (this.neonLight) this.neonLight.color.copy(c);
            document.documentElement.style.setProperty('--accent', this.color);
        });
    }

    onIntensityChange() {
        if (this.isOn) this.setOn(true);
    }

    onBloomChange() {
        if (!this.bloomPass) return;
        this.bloomPass.strength = this.isOn ? this.bloom : 0.0;
        this.bloomPass.threshold = this.threshold;
        this.bloomPass.radius = this.radius;
    }

    onLoopChange() {
        if (this.loop) this.startLoop(); else this.stopLoop();
    }

    onFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const buf = e.target?.result;
            if (buf && buf instanceof ArrayBuffer) {
                await this.loadStlFromBuffer(buf);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // --- Three.js logic helpers (stubs, to be filled as needed) ---
    private setOn(on: boolean) {
        this.isOn = on;
        if (!this.neonMaterial || !this.fresnelMaterial) return;
        this.neonMaterial.emissiveIntensity = on ? this.baseIntensity : 0.0;
        this.fresnelMaterial.uniforms.uIntensity.value = on ? this.baseIntensity * 0.7 : 0.0;
        if (this.neonLight) this.neonLight.intensity = on ? this.baseIntensity * 12.0 : 0.0;
        this.onBloomChange();
    }


    private flickerOn(duration = 700) {
        // Realistic flicker effect when turning ON
        const start = performance.now();
        const step = (now: number) => {
            const t = now - start;
            if (t < duration) {
                const flick = 0.7 + Math.random() * 0.9; // 0.7..1.6
                const cur = this.baseIntensity * flick;
                if (this.neonMaterial && this.fresnelMaterial) {
                    this.neonMaterial.emissiveIntensity = cur;
                    this.fresnelMaterial.uniforms.uIntensity.value = cur * 0.7;
                }
                if (this.neonLight) this.neonLight.intensity = cur * 12.0;
                if (this.bloomPass) this.bloomPass.strength = this.bloom * (0.45 + Math.random() * 0.7);
                requestAnimationFrame(step);
            } else {
                this.setOn(true);
            }
        };
        requestAnimationFrame(step);
    }


    private flickerOff(duration = 220) {
        // Realistic flicker effect when turning OFF
        const start = performance.now();
        const step = (now: number) => {
            const t = now - start;
            if (t < duration) {
                const blip = Math.random() < 0.3 ? (0.2 + Math.random() * 0.6) : 0.0;
                const cur = this.baseIntensity * blip;
                if (this.neonMaterial && this.fresnelMaterial) {
                    this.neonMaterial.emissiveIntensity = cur;
                    this.fresnelMaterial.uniforms.uIntensity.value = cur * 0.7;
                }
                if (this.neonLight) this.neonLight.intensity = cur * 12.0;
                requestAnimationFrame(step);
            } else {
                this.setOn(false);
            }
        };
        requestAnimationFrame(step);
    }


    private startLoop() {
        this.stopLoop();
        this.loopPhase = this.isOn ? 'on' : 'off';
        const loopTick = () => {
            if (!this.loop) return;
            if (this.loopPhase === 'off') {
                this.flickerOn(700);
                this.loopPhase = 'on';
                const onMs = this.onTime * 1000 * (0.85 + Math.random() * 0.3);
                this.loopTimer = setTimeout(loopTick, onMs);
            } else {
                this.flickerOff(220);
                this.loopPhase = 'off';
                const offMs = this.offTime * 1000 * (0.85 + Math.random() * 0.3);
                this.loopTimer = setTimeout(loopTick, offMs);
            }
        };
        loopTick();
    }

    private stopLoop() {
        if (this.loopTimer) clearTimeout(this.loopTimer);
    }


    private async loadStlFromBuffer(buffer: ArrayBuffer) {
        if (!this.stlLoader) return;
        try {
            const geometry = this.stlLoader.parse(buffer);
            this.replaceNeonWithGeometry(geometry);
        } catch (e: any) {
            // eslint-disable-next-line no-console
            console.error('Error cargando STL:', e);
            alert('No se pudo cargar el STL: ' + e.message);
        }
    }

    private disposeNeonGroup() {
        if (!this.neonGroup) return;
        this.scene.remove(this.neonGroup);
        this.neonGroup.traverse((o: any) => {
            if (o.isMesh) {
                o.geometry && o.geometry.dispose();
            }
        });
        this.neonGroup = null; this.neonCore = null; this.neonShell = null; this.neonLight = null;
    }

    private replaceNeonWithGeometry(geometry: any) {
        this.disposeNeonGroup();
        const fitAndCenterGeometry = (geometry: any) => {
            geometry.computeBoundingBox();
            geometry.computeVertexNormals();
            import('three').then(THREE => {
                const box = geometry.boundingBox;
                const size = new THREE.Vector3();
                box.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z);
                const target = 1.8;
                const scale = maxDim > 0 ? target / maxDim : 1.0;
                geometry.scale(scale, scale, scale);
                // geometry.center(); // No centrar, para que el offset funcione
                // El offset se aplicará dinámicamente al grupo
                if (this.autoRotate) {
                    geometry.rotateX(-Math.PI / 2);
                }
            });
        };
        fitAndCenterGeometry(geometry);
        import('three').then(THREE => {
            const c = new THREE.Color(this.color);
            this.neonCore = new THREE.Mesh(geometry, this.neonMaterial);
            // No desplazamiento interno, solo offset global
            const shellGeom = geometry.clone();
            this.neonShell = new THREE.Mesh(shellGeom, this.fresnelMaterial);
            this.neonShell.scale.multiplyScalar(1.03);
            this.neonShell.renderOrder = 1;
            this.neonLight = new THREE.PointLight(c, this.isOn ? this.baseIntensity * 12.0 : 0.0, 6.0, 2.0);
            this.neonGroup = new THREE.Group();
            this.neonGroup.add(this.neonCore);
            this.neonGroup.add(this.neonShell);
            this.neonGroup.add(this.neonLight);
            this.neonGroup.position.x = this.logoOffsetX; // Configurable offset
            this.scene.add(this.neonGroup);
            // Ensure color is set after STL load
            this.onColorChange();
        });
    }

    ngAfterViewInit() {
        // SSR guard: only run Three.js in browser
        if (typeof window === 'undefined' || typeof window.document === 'undefined') return;
        // Also check for platformId if needed (Angular Universal)
        if (navigator && navigator.userAgent && navigator.userAgent.includes('Node.js')) return;
        this.initThree();
    }

    ngOnDestroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        // TODO: Dispose Three.js resources
    }

    private async initThree() {
        // Extra SSR guard
        if (typeof window === 'undefined' || typeof window.document === 'undefined') return;
        // Dynamic imports for SSR safety
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');
        const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer');
        const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass');
        const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass');
        const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader');

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: true, preserveDrawingBuffer: true });
        this.renderer.setClearColor(0x0a0b10, 1);
        const dpr = window.devicePixelRatio || 1;
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(window.innerWidth, window.innerHeight, true);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.7;
        this.renderer.physicallyCorrectLights = true;
        this.sceneRef.nativeElement.appendChild(this.renderer.domElement);
        // Force canvas style to match window size for crispness
        const canvas = this.renderer.domElement;
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#0a0b10');
        this.scene.fog = new THREE.FogExp2(0x090a10, 0.08);

        // Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(this.cameraPosX, 1.6, 3.6);
    // La cámara y los controles apuntan siempre al centro de la escena
    const target = new THREE.Vector3(0, 0, 0);
    this.camera.lookAt(target);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(target);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

        // Lights
        const hemi = new THREE.HemisphereLight(0x3a4a7a, 0x080808, 0.5);
        this.scene.add(hemi);
        const dir = new THREE.DirectionalLight(0xffffff, 0.25);
        dir.position.set(2, 3, 2);
        this.scene.add(dir);

        // Floor
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshStandardMaterial({ color: 0x0e1118, roughness: 0.9, metalness: 0.1 })
        );
        floor.rotation.x = -Math.PI * 0.5;
        floor.position.y = -0.9;
        this.scene.add(floor);

        // Neon material
        this.neonMaterial = new THREE.MeshStandardMaterial({
            color: 0x111116,
            metalness: 0.1,
            roughness: 0.35,
            emissive: new THREE.Color('#2efff7'),
            emissiveIntensity: 0.0
        });

        // Fresnel material
        this.fresnelMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color('#2efff7') },
                uIntensity: { value: 0.0 },
                uPower: { value: 2.0 }
            },
            vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
            fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uPower;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main(){
          float fres = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0), uPower);
          float glow = uIntensity * fres;
          gl_FragColor = vec4(uColor * glow, glow);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.FrontSide
        });

        // Neon group builder
        const buildFromGeometry = (geometry: any) => {
            fitAndCenterGeometry(geometry);
            this.neonCore = new THREE.Mesh(geometry, this.neonMaterial);
            const shellGeom = geometry.clone();
            this.neonShell = new THREE.Mesh(shellGeom, this.fresnelMaterial);
            this.neonShell.scale.multiplyScalar(1.03);
            this.neonShell.renderOrder = 1;
            this.neonLight = new THREE.PointLight(new THREE.Color('#2efff7'), 0.0, 6.0, 2.0);
            this.neonGroup = new THREE.Group();
            this.neonGroup.add(this.neonCore);
            this.neonGroup.add(this.neonShell);
                    // geometry.center(); // No centrar, para que el offset funcione
                this.neonGroup.position.x = this.logoOffsetX; // Configurable offset
                // El offset y la rotación se aplican dinámicamente en el bucle de animación
            this.scene.add(this.neonGroup);
        };

        // Fit and center geometry
        const fitAndCenterGeometry = (geometry: any) => {
            geometry.computeBoundingBox();
            geometry.computeVertexNormals();
            const box = geometry.boundingBox;
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const target = 1.8;
            const scale = maxDim > 0 ? target / maxDim : 1.0;
            geometry.scale(scale, scale, scale);
            geometry.center();
        };


        // Load initial logo STL from assets
        fetch('assets/threejs/logo.stl')
            .then(r => r.arrayBuffer())
            .then(buf => {
                try {
                    const geometry = this.stlLoader.parse(buf);
                    buildFromGeometry(geometry);
                } catch (e) {
                    // fallback to placeholder if STL fails
                    buildFromGeometry(new THREE.TorusKnotGeometry(0.7, 0.22, 256, 64, 1, 3));
                }
            })
            .catch(() => buildFromGeometry(new THREE.TorusKnotGeometry(0.7, 0.22, 256, 64, 1, 3)));

        // (No base ring: removed for clean STL logo scene)

        // Post-processing: Bloom
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.4, 0.72);
        this.composer.addPass(this.bloomPass);

        // STL Loader
        this.stlLoader = new STLLoader();

        // Animation loop
        // Flicker logic for animation
        let glitchUntil = 0;
        let nextGlitchAt = performance.now() + 1500 + Math.random() * 3000;
        const flickerFactor = (tSec: number) => {
            const n = Math.sin(tSec * 7.0) * 0.02 + Math.sin(tSec * 17.0) * 0.03 + Math.sin(tSec * 29.0) * 0.015;
            let base = 1.0 + n;
            const now = performance.now();
            if (now > nextGlitchAt) {
                glitchUntil = now + (40 + Math.random() * 120);
                nextGlitchAt = now + (1500 + Math.random() * 4500);
            }
            const glitch = (now < glitchUntil) ? (0.4 + Math.random() * 0.25) : 1.0;
            return Math.max(0.0, base) * glitch;
        };

        // Ensure renderer size matches window on every frame (for some browsers)
        const ensureRendererSize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const dpr = window.devicePixelRatio || 1;
            const canvas = this.renderer.domElement;
            if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
                this.renderer.setPixelRatio(dpr);
                this.renderer.setSize(w, h, true);
                this.composer.setSize(w, h);
                canvas.style.width = '100vw';
                canvas.style.height = '100vh';
            }
        };

        const animate = () => {
            ensureRendererSize();
            this.t += 0.016;
            // Actualizar posición de la cámara en X y target
            if (this.camera) {
                this.camera.position.x = this.cameraPosX;
                this.camera.lookAt(new THREE.Vector3(0, 0, 0));
                if (this.controls) {
                    this.controls.target.set(0, 0, 0);
                }
            }
                // Actualizar offset y rotación del logo
                if (this.neonGroup) {
                    this.neonGroup.position.set(this.logoOffsetX, this.logoOffsetY, this.logoOffsetZ);
                    this.neonGroup.rotation.y = this.logoRotationY;
                }
            // Neon flicker (realistic)
            if (this.isOn) {
                const f = this.pulse ? flickerFactor(this.t) : 1.0;
                const cur = this.baseIntensity * f;
                if (this.neonMaterial && this.fresnelMaterial) {
                    this.neonMaterial.emissiveIntensity = cur;
                    this.fresnelMaterial.uniforms.uIntensity.value = cur * 0.7;
                }
                if (this.neonLight) this.neonLight.intensity = cur * 12.0;
            } else {
                if (this.neonMaterial && this.fresnelMaterial) {
                    this.neonMaterial.emissiveIntensity = 0.0;
                    this.fresnelMaterial.uniforms.uIntensity.value = 0.0;
                }
                if (this.neonLight) this.neonLight.intensity = 0.0;
            }
            this.controls.update();
            this.composer.render();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();

        // Responsive
        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const dpr = window.devicePixelRatio || 1;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            // Mantener el enfoque y el target en el centro de la escena
            if (typeof THREE !== 'undefined') {
                const target = new THREE.Vector3(0, 0, 0);
                this.camera.lookAt(target);
                if (this.controls) {
                    this.controls.target.copy(target);
                }
            }
            this.renderer.setPixelRatio(dpr);
            this.renderer.setSize(w, h, true);
            this.composer.setSize(w, h);
            const canvas = this.renderer.domElement;
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
        });
    }
}
