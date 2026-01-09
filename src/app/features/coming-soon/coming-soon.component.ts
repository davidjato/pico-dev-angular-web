import { Component, AfterViewInit, OnDestroy, afterNextRender, Injector, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ComingSoonCountdown3D } from './coming-soon-countdown';

@Component({
  selector: 'feature-coming-soon',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './coming-soon.component.html',
  styleUrls: ['./coming-soon.component.scss']
})
export class ComingSoonComponent implements AfterViewInit, OnDestroy {
  private countdown3D?: ComingSoonCountdown3D;
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);
  private translate = inject(TranslateService);
  isBrowser = isPlatformBrowser(this.platformId);

  ngAfterViewInit() {
    if (!this.isBrowser) return;

    afterNextRender(() => {
      const hostElement = document.querySelector('feature-coming-soon');
      if (!hostElement) return;

      // Limpiar contenido SSR
      while (hostElement.firstChild) {
        hostElement.removeChild(hostElement.firstChild);
      }

      // Crear estructura simple
      const section = document.createElement('section');
      section.id = 'collab';
      section.style.cssText = 'display: block; position: relative; width: 100%; height: 70vh; overflow: hidden; visibility: visible;';

      // Canvas container para Three.js
      const canvasContainer = document.createElement('div');
      canvasContainer.className = 'canvas-container';
      canvasContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; display: block; visibility: visible;';

      // Artist reveal text (con traducción)
      const artistReveal = document.createElement('div');
      artistReveal.className = 'artist-reveal';
      artistReveal.style.cssText = 'position: absolute; left: 50%; top: 65%; transform: translate(-50%, -50%); width: 100%; display: flex; justify-content: center; z-index: 10; pointer-events: none;';
      artistReveal.innerHTML = `<span style="font-family: 'Space Grotesk', sans-serif; font-size: 1.1rem; font-weight: 400; letter-spacing: 0.04em; color: #fff; text-align: center; padding-bottom: 4px; border-bottom: 1px solid rgba(255, 255, 255, 0.3);">${this.translate.instant('COMINGSOON_MARQUEE.ARTIST_REVEAL')}</span>`;

      // Actualizar traducciones cuando cambie el idioma
      this.translate.onLangChange.subscribe(() => {
        artistReveal.innerHTML = `<span style="font-family: 'Space Grotesk', sans-serif; font-size: 1.1rem; font-weight: 400; letter-spacing: 0.04em; color: #fff; text-align: center; padding-bottom: 4px; border-bottom: 1px solid rgba(255, 255, 255, 0.3);">${this.translate.instant('COMINGSOON_MARQUEE.ARTIST_REVEAL')}</span>`;
      });

      // Ensamblar DOM
      section.appendChild(canvasContainer);
      section.appendChild(artistReveal);
      hostElement.appendChild(section);

      // Inicializar Three.js scene
      requestAnimationFrame(() => {
        this.countdown3D = new ComingSoonCountdown3D({
          container: canvasContainer
        });
      });
    }, { injector: this.injector });
  }

  ngOnDestroy() {
    if (this.countdown3D) {
      this.countdown3D.dispose();
    }
  }
}
