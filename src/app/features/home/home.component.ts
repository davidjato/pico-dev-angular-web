
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LogoNeonComponent } from './logo-neon.component';

@Component({
  selector: 'feature-home',
  standalone: true,
  imports: [TranslateModule, LogoNeonComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  scrollToNext() {
    const about = document.getElementById('about');
    if (about) about.scrollIntoView({ behavior: 'smooth' });
  }
}