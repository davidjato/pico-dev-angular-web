import { Component, OnDestroy } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HomeComponent } from '../features/home/home.component';
import { HeaderComponent } from '../shared/header.component';
import { FooterComponent } from '../shared/footer.component';
import { AboutComponent } from '../features/about/about.component';
import { WhyUsComponent } from '../features/why-us/why-us.component';
import { ComingSoonComponent } from '../features/coming-soon/coming-soon.component';
import { ContactComponent } from '../features/contact/contact.component';
import { GuiControlsService } from '../shared/gui-controls.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    TranslateModule,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    ComingSoonComponent, AboutComponent,
    WhyUsComponent,
    ContactComponent
  ],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnDestroy {

  constructor(
    public translate: TranslateService,
    private guiService: GuiControlsService
  ) {
    // Asegurar que el contenedor GUI esté en el DOM
    if (typeof document !== 'undefined') {
      this.guiService.attachToDOM();
    }
  }

  ngOnDestroy(): void {
    // No hay nada que destruir ya que cada componente gestiona su propio GUI
  }

  changeLang(lang: string) {
    this.translate.use(lang);
  }
}
