import { Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HomeComponent } from '../features/home/home.component';
import { HeaderComponent } from '../shared/header.component';
import { AboutComponent } from '../features/about/about.component';
import { WhyUsComponent } from '../features/why-us/why-us.component';
import { ComingSoonComponent } from '../features/coming-soon/coming-soon.component';
import { ContactComponent } from '../features/contact/contact.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    TranslateModule,
    HomeComponent,
    HeaderComponent,
    ComingSoonComponent, AboutComponent,
    WhyUsComponent,
  ],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
  constructor(public translate: TranslateService) { }

  changeLang(lang: string) {
    this.translate.use(lang);
  }
}
