import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import * as THREE from 'three';

@Component({
  selector: 'feature-about',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements AfterViewInit {
  @ViewChild('threeCanvas', { static: false }) threeCanvas!: ElementRef<HTMLCanvasElement>;

  menuOptions = [
    { key: 'CONCEPT', label: 'ABOUT.MENU.CONCEPT' },
    { key: 'MISSION', label: 'ABOUT.MENU.MISSION' },
    { key: 'VISION', label: 'ABOUT.MENU.VISION' },
    { key: 'MANIFIESTO', label: 'ABOUT.MENU.MANIFIESTO' }
  ];
  selectedOption = 'CONCEPT';

  get selectedTextKey() {
    return `ABOUT.TEXT.${this.selectedOption}`;
  }

  selectOption(option: string) {
    this.selectedOption = option;
  }

  ngAfterViewInit() {
    // Solo ejecutar Three.js en el navegador
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const canvas = this.threeCanvas.nativeElement;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    // Simple geometry (rotating cube)
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x007bff });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 2);
    scene.add(light);

    camera.position.z = 3;

    function animate() {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    animate();
  }
}