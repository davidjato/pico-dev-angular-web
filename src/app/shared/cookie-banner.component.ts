import { Component, signal, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
    selector: 'app-cookie-banner',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './cookie-banner.component.html',
    styleUrls: ['./cookie-banner.component.scss']
})
export class CookieBannerComponent {
    showBanner = signal(false);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);

    ngOnInit() {
        // Solo ejecutar en el browser (no en SSR)
        if (!this.isBrowser) return;

        // Solo mostrar si no hay preferencia guardada
        const cookiePreference = localStorage.getItem('cookiePreference');
        if (!cookiePreference) {
            // Mostrar después de un pequeño delay
            setTimeout(() => this.showBanner.set(true), 1000);
        }
    }

    acceptAll() {
        if (!this.isBrowser) return;
        localStorage.setItem('cookiePreference', 'all');
        this.showBanner.set(false);
    }

    declineNonEssential() {
        if (!this.isBrowser) return;
        localStorage.setItem('cookiePreference', 'essential');
        this.showBanner.set(false);
    }
}
