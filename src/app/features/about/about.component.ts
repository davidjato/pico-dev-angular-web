import { Component, HostListener, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as THREE from 'three';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'feature-about',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':increment', [
        style({ opacity: 0, transform: 'translateX(40px)' }),
        animate('300ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':decrement', [
        style({ opacity: 0, transform: 'translateX(-40px)' }),
        animate('300ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class AboutComponent implements OnInit {
  private touchStartX: number | null = null;
  private touchEndX: number | null = null;
  isBrowser = false;
  menuOptions: string[] = [];
  selectedIndex = 0;
  contents: string[] = [];
  isMobileView = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private translate: TranslateService
  ) { }

  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.touchStartX = event.touches[0].clientX;
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (this.touchStartX !== null && event.changedTouches.length === 1) {
      this.touchEndX = event.changedTouches[0].clientX;
      const deltaX = this.touchEndX - this.touchStartX;
      if (Math.abs(deltaX) > 40) {
        if (deltaX < 0) {
          this.nextOption();
        } else {
          this.prevOption();
        }
      }
    }
    this.touchStartX = null;
    this.touchEndX = null;
  }

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.isMobileView = window.innerWidth <= 900;
    }

    this.loadTranslatedContent();

    this.translate.onLangChange.subscribe(() => {
      this.loadTranslatedContent();
    });
  }

  loadTranslatedContent() {
    this.translate.get('ABOUT.MENU.CONCEPT').subscribe(val => {
      this.menuOptions = [
        this.translate.instant('ABOUT.MENU.CONCEPT'),
        this.translate.instant('ABOUT.MENU.MISSION'),
        this.translate.instant('ABOUT.MENU.VISION'),
        this.translate.instant('ABOUT.MENU.MANIFIESTO')
      ];
    });

    this.translate.get('ABOUT.TEXT.CONCEPT').subscribe(val => {
      this.contents = [
        this.translate.instant('ABOUT.TEXT.CONCEPT'),
        this.translate.instant('ABOUT.TEXT.MISSION'),
        this.translate.instant('ABOUT.TEXT.VISION'),
        this.translate.instant('ABOUT.TEXT.MANIFIESTO')
      ];
    });
  }

  @HostListener('window:resize')
  onResize() {
    if (this.isBrowser) {
      this.isMobileView = window.innerWidth <= 900;
    }
  }

  prevOption() {
    if (this.isMobileView) {
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
      } else {
        this.selectedIndex = this.menuOptions.length - 1;
      }
    } else {
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
      }
    }
  }

  nextOption() {
    if (this.isMobileView) {
      if (this.selectedIndex < this.menuOptions.length - 1) {
        this.selectedIndex++;
      } else {
        this.selectedIndex = 0;
      }
    } else {
      if (this.selectedIndex < this.menuOptions.length - 1) {
        this.selectedIndex++;
      }
    }
  }

  selectOption(index: number) {
    this.selectedIndex = index;
  }
}
