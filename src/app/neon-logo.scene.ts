import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { extend, injectLoader } from 'angular-three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import {
  NgtpEffectComposer,
  NgtpBloom,
  NgtpVignette,
} from 'angular-three-postprocessing';

extend(THREE);

@Component({
  selector: 'app-neon-logo-scene',
  standalone: true,
  template: `
    <!-- Fondo siempre visible -->
    <ngt-color attach="background" [args]="['#050201']" />

    <!-- Solo renderizar el resto si el GLB está cargado -->
    @if (gltf(); as loaded) {
      <!-- Luces cálidas -->
      <ngt-ambient-light [args]="['#330b03', 0.5]" />
      <ngt-spot-light
        [args]="['#FF7A00', 2.5]"
        [position]="[0, 2.5, 3]"
        [angle]="0.7"
        [penumbra]="0.7"
        [castShadow]="true"
      />
      <ngt-point-light
        [args]="['#ffc58a', 1.2]"
        [position]="[2.5, 1.8, -1]"
      />

      <!-- Suelo -->
      <ngt-mesh
        [rotation]="[minusHalfPi, 0, 0]"
        [position]="[0, -1, 0]"
        receiveShadow
      >
        <ngt-plane-geometry [args]="[14, 14]" />
        <ngt-mesh-standard-material
          [color]="'#140402'"
          [roughness]="0.45"
          [metalness]="0.35"
        />
      </ngt-mesh>

      <!-- Modelo GLB -->
      <ngt-primitive
        [args]="[loaded.scene]"
        [castShadow]="true"
        [receiveShadow]="true"
      />

      <!-- Postprocesado -->
      <ngtp-effect-composer [options]="{ multisampling: 0 }">
        <ngtp-bloom
          [options]="{
            intensity: 1.6,
            luminanceThreshold: 0.2,
            luminanceSmoothing: 0.15
          }"
        />
        <ngtp-vignette
          [options]="{
            eskil: false,
            offset: 0.3,
            darkness: 0.9
          }"
        />
      </ngtp-effect-composer>
    }
  `,
  imports: [NgtpEffectComposer, NgtpBloom, NgtpVignette],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeonLogoScene {
  readonly minusHalfPi = -Math.PI / 2;

  // truco de tipos para usar GLTFLoader con injectLoader en angular-three v3
  protected gltf = injectLoader(() => GLTFLoader as any, () => '/assets/threejs/logo.glb');

}
