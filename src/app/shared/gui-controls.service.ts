import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class GuiControlsService {
    private container: HTMLElement | null = null;
    private platformId = inject(PLATFORM_ID);

    constructor() {
        // Crear el contenedor solo en el navegador
        if (isPlatformBrowser(this.platformId)) {
            this.container = document.createElement('div');
            this.container.className = 'gui-controls-container';
            this.container.style.position = 'fixed';
            this.container.style.top = '80px';
            this.container.style.left = '20px';
            this.container.style.zIndex = '9999';
            this.container.style.display = 'flex';
            this.container.style.flexDirection = 'column';
            this.container.style.gap = '10px';
            this.container.style.maxHeight = 'calc(100vh - 100px)';
            this.container.style.overflowY = 'auto';
            this.container.style.overflowX = 'hidden';
        }
    }

    getContainer(): HTMLElement | null {
        return this.container;
    }

    attachToDOM(): void {
        // Insertar en el body si aún no está y si estamos en el navegador
        if (isPlatformBrowser(this.platformId) && this.container && !this.container.parentElement) {
            document.body.appendChild(this.container);
        }
    }
}
