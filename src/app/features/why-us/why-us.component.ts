import { Component, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'feature-why-us',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './why-us.component.html',
  styleUrls: ['./why-us.component.scss']
})
export class WhyUsComponent {
  activePoint = 0;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  isMobile(): boolean {
    return this.isBrowser && window.innerWidth <= 900;
  }

  onPointHover(isHovered: boolean, idx?: number): void {
    // Implementación básica sin Three.js
  }
}