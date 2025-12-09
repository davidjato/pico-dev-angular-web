import { Component, HostListener, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
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
  isBrowser = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.isMobileView = window.innerWidth <= 900;
    }
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
  menuOptions = [
    'CONCEPT',
    'MISSION',
    'VISION',
    'MANIFEST'
  ];
  selectedIndex = 0;
  contents = [
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
  ];

  selectOption(index: number) {
    this.selectedIndex = index;
  }
  isMobileView = false;
}