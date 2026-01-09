import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
    private translate = inject(TranslateService);
    
    currentLang: 'en' | 'fr' | 'es' = 'es';
    menuOpen = false;

    changeLang(lang: 'en' | 'fr' | 'es') {
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
