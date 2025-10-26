import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import * as THREE from 'three';

@Component({
  selector: 'feature-why-us',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './why-us.component.html',
  styleUrls: ['./why-us.component.scss']
})
export class WhyUsComponent implements AfterViewInit {
  @ViewChild('threeCanvas', { static: false }) threeCanvas!: ElementRef<HTMLCanvasElement>;

  menuOptions = [
    { key: 'CELEBRATE', label: 'WHYUS.MENU.CELEBRATE' },
    { key: 'AWARENESS', label: 'WHYUS.MENU.AWARENESS' },
    { key: 'COMMUNITY', label: 'WHYUS.MENU.COMMUNITY' },
    { key: 'IMPACT', label: 'WHYUS.MENU.IMPACT' }
  ];
  hoveredOption: string|null = null;

  get hoveredTextKey() {
    return this.hoveredOption ? `WHYUS.TEXT.${this.hoveredOption}` : '';
  }

  setHovered(option: string|null) {
    this.hoveredOption = option;
  }

  ngAfterViewInit() {
    // SSR guard: only run Three.js in browser
    if (typeof window === 'undefined' || typeof window.document === 'undefined') return;
    const canvas = this.threeCanvas.nativeElement;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    // Neon columns scene (simplified)
  const columns: any[] = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const geometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 32);
      const material = new THREE.MeshStandardMaterial({ color: 0x00fff7, emissive: 0x00fff7, emissiveIntensity: 1 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = (i - n/2 + 0.5) * 0.8;
      mesh.position.y = 0;
      mesh.position.z = 0;
      columns.push(mesh);
      scene.add(mesh);
    }
    // Floor
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = -2;
    scene.add(floor);

    // Lights
    const ambient = new THREE.AmbientLight(0x00fff7, 0.3);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(0, 5, 5);
    scene.add(dir);

    camera.position.set(0, 1, 8);

    function animate() {
      requestAnimationFrame(animate);
      columns.forEach((col, i) => {
        col.scale.y = 1.2 + Math.sin(Date.now()/500 + i) * 0.5;
      });
      renderer.render(scene, camera);
    }
    animate();
  }
}