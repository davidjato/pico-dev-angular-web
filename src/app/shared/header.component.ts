import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, inject, AfterViewInit, PLATFORM_ID, OnInit } from '@angular/core';

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, TranslateModule, RouterModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, AfterViewInit {
    private translate = inject(TranslateService);
    private cdr = inject(ChangeDetectorRef);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);
    private router = inject(Router);

    currentLang: 'en' | 'fr' | 'lb' = 'en';
    menuOpen = false;
    activeSection = 'home';
    isLegalPage = false;
    isScrolled = false;

    constructor() {
        // Establecer inglés por defecto al iniciar
        this.translate.use('en');

        // Detectar inmediatamente en el constructor si estamos en página legal
        if (this.isBrowser) {
            const url = this.router.url;
            this.isLegalPage = url.includes('/cookies-policy') || url.includes('/data-privacy-policy');
        }
    }

    ngOnInit() {
        // Escuchar cambios de ruta solo cuando la navegación se completa
        if (this.isBrowser) {
            this.router.events.pipe(
                filter(event => event instanceof NavigationEnd)
            ).subscribe(() => {
                this.checkIfLegalPage();
            });
        }
    }

    checkIfLegalPage() {
        const url = this.router.url;
        const wasLegalPage = this.isLegalPage;
        this.isLegalPage = url.includes('/cookies-policy') || url.includes('/data-privacy-policy');

        if (wasLegalPage !== this.isLegalPage) {
            this.cdr.detectChanges();
        }
    }

    ngAfterViewInit() {
        // Solo ejecutar en browser
        if (!this.isBrowser) return;

        // Detectar sección inicial después de que la vista esté lista
        setTimeout(() => this.onScroll(), 100);
    }

    @HostListener('window:scroll')
    onScroll() {
        // Solo ejecutar en browser
        if (!this.isBrowser) return;

        // Detectar si se ha hecho scroll
        const scrolled = window.scrollY > 50;
        if (this.isScrolled !== scrolled) {
            this.isScrolled = scrolled;
            this.cdr.markForCheck();
        }

        const sections = ['home', 'about', 'why-us', 'contact'];
        const scrollPosition = window.scrollY + 100; // Offset para activar antes

        for (const sectionId of sections) {
            const section = document.getElementById(sectionId);
            if (section) {
                const offsetTop = section.offsetTop;
                const offsetBottom = offsetTop + section.offsetHeight;

                if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
                    if (this.activeSection !== sectionId) {
                        this.activeSection = sectionId;
                        this.cdr.markForCheck();
                    }
                    break;
                }
            }
        }
    }

    changeLang(lang: 'en' | 'fr' | 'lb') {
        this.currentLang = lang;
        this.translate.use(lang);
        console.log('Idioma cambiado a:', lang);
    }

    scrollToSection(sectionId: string) {
        const el = document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
    }

    closeMenu() {
        this.menuOpen = false;
    }
}
