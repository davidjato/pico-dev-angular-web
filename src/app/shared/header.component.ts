import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
    private translate = inject(TranslateService);

    currentLang: 'en' | 'fr' | 'lb' = 'en';
    menuOpen = false;

    constructor() {
        // Establecer inglés por defecto al iniciar
        this.translate.use('en');
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
