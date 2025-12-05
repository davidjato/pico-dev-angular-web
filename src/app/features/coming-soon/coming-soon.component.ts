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
  private animationFrameId?: number;

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
    
    // Usar setTimeout para asegurar que el DOM está listo
    setTimeout(() => {
      // Animación scroll frases
      this.scrollTopEl = document.querySelector('.scroll-phrase-top') as HTMLElement;
      this.scrollBottomEl = document.querySelector('.scroll-phrase-bottom') as HTMLElement;
      
      console.log('Elements found:', {
        top: !!this.scrollTopEl,
        bottom: !!this.scrollBottomEl
      });
      
      const updatePhrases = () => {
        const section = document.querySelector('.coming-soon-root') as HTMLElement;
        if (!section) return;
        
        const scrollY = window.scrollY || window.pageYOffset;
        const viewportHeight = window.innerHeight;
        
        // Calcular offset de la sección en el documento
        let sectionTop = 0;
        let element: HTMLElement | null = section;
        while (element) {
          sectionTop += element.offsetTop;
          element = element.offsetParent as HTMLElement | null;
        }
        
        // Frase superior: empieza antes (3.5 viewports antes)
        if (this.scrollTopEl) {
          const startPointTop = sectionTop - viewportHeight * 3.5;
          const endPointTop = sectionTop + section.offsetHeight + viewportHeight * 1.5;
          const animationRangeTop = endPointTop - startPointTop;
          const progressTop = (scrollY - startPointTop) / animationRangeTop;
          const translate = (progressTop - 0.5) * 650;
          this.scrollTopEl.style.transform = `translateX(${translate}%)`;
        }
        
        // Frase inferior: empieza después (1.5 viewports antes)
        if (this.scrollBottomEl) {
          const startPointBottom = sectionTop - viewportHeight * 1.5;
          const endPointBottom = sectionTop + section.offsetHeight + viewportHeight * 1.5;
          const animationRangeBottom = endPointBottom - startPointBottom;
          const progressBottom = (scrollY - startPointBottom) / animationRangeBottom;
          const translate = -(progressBottom - 0.5) * 250;
          this.scrollBottomEl.style.transform = `translateX(${translate}%)`;
        }
      };
      
      this.scrollHandler = () => {
        requestAnimationFrame(updatePhrases);
      };
      
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
      console.log('Scroll listener added');
      updatePhrases();
    }, 100);
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
