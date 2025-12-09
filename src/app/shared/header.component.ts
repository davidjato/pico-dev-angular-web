import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
    currentLang: 'en' | 'fr' | 'es' = 'en';
    menuOpen = false;

    changeLang(lang: 'en' | 'fr' | 'es') {
        this.currentLang = lang;
        // Aquí llamas a tu servicio / lógica real de cambio de idioma
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
