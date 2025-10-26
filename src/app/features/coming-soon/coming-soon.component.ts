import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import * as THREE from 'three';

@Component({
  selector: 'feature-coming-soon',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './coming-soon.component.html',
  styleUrls: ['./coming-soon.component.scss']
})
export class ComingSoonComponent implements AfterViewInit {
  @ViewChild('threeCanvas', { static: false }) threeCanvas!: ElementRef<HTMLCanvasElement>;
  paused = false;
  countdown = 60 * 60 * 24; // 24h in seconds
  intervalId: any;

  get countdownText() {
    const h = Math.floor(this.countdown / 3600).toString().padStart(2, '0');
    const m = Math.floor((this.countdown % 3600) / 60).toString().padStart(2, '0');
    const s = (this.countdown % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  togglePause() {
    this.paused = !this.paused;
  }

  ngAfterViewInit() {
    // SSR guard: only run Three.js in browser
    if (typeof window === 'undefined' || typeof window.document === 'undefined') return;
    const canvas = this.threeCanvas.nativeElement;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    // Neon ring
    const ringGeo = new THREE.TorusGeometry(2, 0.15, 32, 100);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x00fff7, emissive: 0x00fff7, emissiveIntensity: 1 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ring);

    // Neon sphere
    const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xff00cc, emissive: 0xff00cc, emissiveIntensity: 1 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(0, 0, 0);
    scene.add(sphere);

    // Lights
    const ambient = new THREE.AmbientLight(0x00fff7, 0.3);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(0, 5, 5);
    scene.add(dir);

    camera.position.set(0, 0, 7);

    const animate = () => {
      requestAnimationFrame(animate);
      ring.rotation.z += 0.01;
      sphere.position.x = Math.sin(Date.now()/1000) * 1.2;
      renderer.render(scene, camera);
    };
    animate();

    // Countdown logic
    this.intervalId = setInterval(() => {
      if (!this.paused && this.countdown > 0) {
        this.countdown--;
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
