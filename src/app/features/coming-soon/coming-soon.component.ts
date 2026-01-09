import { Component, AfterViewInit, OnDestroy, afterNextRender, Injector, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ComingSoonCountdown3D } from './coming-soon-countdown';

@Component({
  selector: 'feature-coming-soon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coming-soon.component.html',
  styleUrls: ['./coming-soon.component.scss']
})
export class ComingSoonComponent implements AfterViewInit, OnDestroy {
  // ViewChild removido - crearemos el contenedor manualmente en JavaScript
  // FORZANDO RECOMPILACIÓN - v2
  paused = false;
  private countdown3D?: ComingSoonCountdown3D;
  private domInitialized = false; // Bandera para evitar recreación múltiple

  private scrollTopEl?: HTMLElement;
  private scrollBottomEl?: HTMLElement;
  private scrollHandler?: () => void;
  private animationFrameId?: number;
  
  // Detectar si estamos en el navegador
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);
  private injector = inject(Injector);

  togglePause() {
    this.paused = !this.paused;
    if (this.countdown3D) {
      this.paused ? this.countdown3D.pause() : this.countdown3D.resume();
    }
  }

  ngAfterViewInit() {
    console.log('🔍 COMING-SOON COMPONENT: ngAfterViewInit - isBrowser:', this.isBrowser);
    if (!this.isBrowser || this.domInitialized) {
      console.log('⏭️ Saltando inicialización - ya inicializado o no es navegador');
      return;
    }
    
    // Marcar como inicializado INMEDIATAMENTE
    this.domInitialized = true;
    
    // Limpiar INMEDIATAMENTE antes de afterNextRender
    const hostElement = document.querySelector('feature-coming-soon');
    if (hostElement) {
      while (hostElement.firstChild) {
        hostElement.removeChild(hostElement.firstChild);
      }
    }
    // Limpiar duplicados globales
    document.querySelectorAll('.scroll-phrase, .artist-reveal').forEach(el => el.remove());
    
    // SOLUCIÓN NUCLEAR: Recrear TODO el DOM en JavaScript puro
    afterNextRender(() => {
      console.log('🔍 COMING-SOON: Recreando DOM completo en JavaScript...');
      
      // Obtener el host element (<feature-coming-soon>)
      const hostElement = document.querySelector('feature-coming-soon');
      if (!hostElement) {
        console.error('❌ No se encontró feature-coming-soon');
        return;
      }
      
      // Verificar que esté limpio (segunda verificación)
      if (hostElement.children.length > 0) {
        console.warn('⚠️ Host element no estaba limpio, limpiando...');
        while (hostElement.firstChild) {
          hostElement.removeChild(hostElement.firstChild);
        }
      }
      
      // TAMBIÉN eliminar cualquier elemento duplicado que pueda estar en otras secciones
      document.querySelectorAll('.scroll-phrase, .artist-reveal').forEach(el => {
        console.log('🗑️ Eliminando duplicado:', el.className);
        el.remove();
      });
      
      console.log('✅ Contenido SSR limpiado completamente');
      
      // Crear SECTION desde cero en JavaScript
      const section = document.createElement('section');
      section.id = 'collab';
      section.style.cssText = 'display: block; position: relative; width: 100%; height: 100vh; overflow: visible; visibility: visible;'; // Cambiar overflow a visible
      
      // Crear canvas container
      const canvasContainer = document.createElement('div');
      canvasContainer.className = 'canvas-container';
      canvasContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; display: block; visibility: visible;';
      
      // Crear frases scroll
      const scrollTopDiv = document.createElement('div');
      scrollTopDiv.className = 'scroll-phrase scroll-phrase-top';
      const isMobile = window.innerWidth <= 900;
      const displayStyle = isMobile ? 'display: none;' : '';
      scrollTopDiv.style.cssText = `position: absolute; left: 0; top: 20%; width: 100vw; pointer-events: none; z-index: 100; font-size: 2.2rem; font-weight: 100; color: #fff; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.04em; will-change: transform; font-family: "Roboto", Arial, Helvetica, sans-serif; ${displayStyle}`;
      scrollTopDiv.innerHTML = '<span>INSPIRED BY <span class="highlight" style="font-weight: 600; color: #fff;">CONTRADICTION</span>, DRIVEN BY CARE</span>';
      
      const scrollBottomDiv = document.createElement('div');
      scrollBottomDiv.className = 'scroll-phrase scroll-phrase-bottom';
      scrollBottomDiv.style.cssText = `position: absolute; left: 0; bottom: 20%; width: 100vw; pointer-events: none; z-index: 100; font-size: 2.2rem; font-weight: 100; color: #fff; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.04em; will-change: transform; font-family: "Roboto", Arial, Helvetica, sans-serif; ${displayStyle}`;
      scrollBottomDiv.innerHTML = '<span>LEAVE LIGHTER AT <span class="highlight" style="font-weight: 600; color: #fff;">HEART</span> -- NOT JUST FOR THE SHOW. BUT THE <span class="highlight" style="font-weight: 600; color: #fff;">PURPOSE</span></span>';
      
      // Crear artist reveal (siempre visible)
      const artistRevealDiv = document.createElement('div');
      artistRevealDiv.className = 'artist-reveal';
      artistRevealDiv.style.cssText = 'position: absolute; left: 50%; top: 65%; transform: translate(-50%, -50%); width: 100%; display: flex; justify-content: center; z-index: 99;';
      artistRevealDiv.innerHTML = '<span class="artist-reveal-underline" style="font-family: \'Roboto\', sans-serif; font-size: 1.1rem; font-weight: 100; letter-spacing: 0.04em; color: #fff; position: relative;">Artist soon to be revealed</span>';
      
      // Ensamblar todo
      section.appendChild(canvasContainer);
      section.appendChild(scrollTopDiv);
      section.appendChild(scrollBottomDiv);
      section.appendChild(artistRevealDiv);
      hostElement.appendChild(section);
      
      console.log('✅ DOM recreado:', {
        section: section.getBoundingClientRect(),
        canvasContainer: canvasContainer.getBoundingClientRect()
      });
      
      // Esperar un frame para asegurar renderizado
      requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        console.log('📐 SECTION rect después de recrear:', rect);
        
        if (rect.width === 0 || rect.height === 0) {
          console.error('❌ SECTION sigue con 0x0 incluso después de recrear');
          return;
        }
        
        // ESPERAR 200ms antes de inicializar Three.js para asegurar que todo está limpio
        setTimeout(() => {
          // Verificar y eliminar SOLO duplicados que están FUERA del #collab
          const collabSection = document.querySelector('#collab');
          const allPhrases = document.querySelectorAll('.scroll-phrase');
          const allArtist = document.querySelectorAll('.artist-reveal');
          
          let phrasesRemovidas = 0;
          let artistRemovido = 0;
          
          // Eliminar frases que NO están dentro de #collab
          allPhrases.forEach(el => {
            if (!collabSection?.contains(el)) {
              console.log('🗑️ Eliminando frase FUERA de #collab');
              el.remove();
              phrasesRemovidas++;
            }
          });
          
          // Eliminar artist reveal que NO están dentro de #collab
          allArtist.forEach(el => {
            if (!collabSection?.contains(el)) {
              console.log('🗑️ Eliminando artist reveal FUERA de #collab');
              el.remove();
              artistRemovido++;
            }
          });
          
          console.log('🔍 Verificación pre-init:', {
            phrasesTotales: allPhrases.length,
            phrasesEliminadas: phrasesRemovidas,
            phrasesDentroCollab: allPhrases.length - phrasesRemovidas,
            artistTotales: allArtist.length,
            artistEliminados: artistRemovido,
            artistDentroCollab: allArtist.length - artistRemovido
          });
          
          console.log('🔍 COMING-SOON: Creando ComingSoonCountdown3D...');
          this.countdown3D = new ComingSoonCountdown3D({
            container: canvasContainer
          });
        }, 200);
      });

      
      // Guardar referencias para animaciones scroll
      this.scrollTopEl = scrollTopDiv;
      this.scrollBottomEl = scrollBottomDiv;
      
      // Usar setTimeout para asegurar que el DOM está listo
      setTimeout(() => {

        const updatePhrases = () => {
          const section = document.querySelector('#collab') as HTMLElement;
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
        const isMobile = window.innerWidth <= 900;
        const heightScrollTopPhrase = isMobile ? 2.5 : 2.8;
        const heightScrollBottomPhrase = isMobile ? 2.4 : 2.4;
        const speedFactorTop = isMobile ? 2 : 1;
        const speedFactorBottom = isMobile ? 5 : 2;
        // Frase superior: empieza antes (3.5 viewports antes)
        if (this.scrollTopEl) {
          const startPointTop = sectionTop - viewportHeight * heightScrollTopPhrase;
          const endPointTop = sectionTop + section.offsetHeight + viewportHeight * 1.5;
          const animationRangeTop = endPointTop - startPointTop;
          const progressTop = (scrollY - startPointTop) / animationRangeTop;
          const translate = (progressTop - 0.5) * 650 * speedFactorTop;
          this.scrollTopEl.style.transform = `translateX(${translate}%)`;
        }

        // Frase inferior: empieza después (1.5 viewports antes)
        if (this.scrollBottomEl) {
          const startPointBottom = sectionTop - viewportHeight * heightScrollBottomPhrase;
          const endPointBottom = sectionTop + section.offsetHeight + viewportHeight * 1.5;
          const animationRangeBottom = endPointBottom - startPointBottom;
          const progressBottom = (scrollY - startPointBottom) / animationRangeBottom;
          // En mobile, multiplicar la velocidad por 2


          const translate = -(progressBottom - 0.5) * 250 * speedFactorBottom;
          this.scrollBottomEl.style.transform = `translateX(${translate}%)`;
        }
      };

      this.scrollHandler = () => {
        requestAnimationFrame(updatePhrases);
      };

      window.addEventListener('scroll', this.scrollHandler, { passive: true });
      updatePhrases();
    }, 100);
    }, { injector: this.injector });
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
