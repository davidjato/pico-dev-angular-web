import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { ComingSoonCountdown3D } from './coming-soon-countdown';

@Component({
  selector: 'feature-coming-soon',
  standalone: true,
  templateUrl: './coming-soon.component.html',
  styleUrls: ['./coming-soon.component.scss']
})
export class ComingSoonComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: false }) canvasContainer!: ElementRef<HTMLDivElement>;
  paused = false;
  private countdown3D?: ComingSoonCountdown3D;

  private scrollTopEl?: HTMLElement;
  private scrollBottomEl?: HTMLElement;
  private scrollHandler?: () => void;

  constructor(private renderer: Renderer2) { }

  togglePause() {
    this.paused = !this.paused;
    if (this.countdown3D) {
      this.paused ? this.countdown3D.pause() : this.countdown3D.resume();
    }
  }

  ngAfterViewInit() {
    if (typeof window === 'undefined' || typeof window.document === 'undefined') return;
    this.countdown3D = new ComingSoonCountdown3D({
      container: this.canvasContainer.nativeElement
    });
    // Animación scroll frases
    this.scrollTopEl = document.querySelector('.scroll-phrase-top') as HTMLElement;
    this.scrollBottomEl = document.querySelector('.scroll-phrase-bottom') as HTMLElement;
    this.scrollHandler = () => {
      const section = document.querySelector('.coming-soon-root') as HTMLElement;
      if (!section) return;
      const sectionRect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      // Solo animar si la sección está en pantalla
      if (sectionRect.top < viewportHeight && sectionRect.bottom > 0) {
        // Scroll relativo al inicio de la sección
        const visibleY = Math.max(0, viewportHeight - sectionRect.top);
        const maxScroll = sectionRect.height; // Usar toda la altura de la sección
        const percent = Math.min(Math.max(visibleY / maxScroll, 0), 1);
        // Frase superior: de izquierda (entra) a derecha (sale)
        if (this.scrollTopEl) {
          const translate = (percent - 0.5) * 100; // -50vw a +50vw, centrado en el medio
          this.renderer.setStyle(this.scrollTopEl, 'transform', `translateX(${translate}vw)`);
        }
        // Frase inferior: de derecha (entra) a izquierda (sale)
        if (this.scrollBottomEl) {
          const translate = -(percent - 0.5) * 100; // +50vw a -50vw, centrado en el medio
          this.renderer.setStyle(this.scrollBottomEl, 'transform', `translateX(${translate}vw)`);
        }
      } else {
        // Si no está en pantalla, deja las frases en su posición inicial
        if (this.scrollTopEl) {
          this.renderer.setStyle(this.scrollTopEl, 'transform', `translateX(0vw)`);
        }
        if (this.scrollBottomEl) {
          this.renderer.setStyle(this.scrollBottomEl, 'transform', `translateX(0vw)`);
        }
      }
    };
    window.addEventListener('scroll', this.scrollHandler);
    this.scrollHandler();
  }

  ngOnDestroy() {
    if (this.countdown3D) {
      this.countdown3D.dispose();
    }
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }
}
