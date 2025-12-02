import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-header',
    standalone: true,
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
    currentLang: 'en' | 'fr' | 'es' = 'en';

    changeLang(lang: 'en' | 'fr' | 'es') {
        this.currentLang = lang;
        // Aquí llamas a tu servicio / lógica real de cambio de idioma
    }
}
