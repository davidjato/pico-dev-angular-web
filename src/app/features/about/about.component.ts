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
    `<p>
    Picollect was born from a simple observation.
</p>
<p>
    In a city that moves fast, celebration often becomes routine and emotional well-being is often left in the background.
</p>
<p>
    We gather.
</p>
<p>
    We attend.
</p>
<p>
    We keep moving.
</p>
<p>
    But behind the music, many people feel overwhelmed, disconnected, or alone.
</p>
<p>
    Picollect exists to create spaces where people can breathe again.
</p>
<p>
    Where music becomes a bridge.
</p>
<p>
    Where connection is intentional.
</p>
<p>
    And where celebration acknowledges mental health &nbsp;not as a campaign, but as a human reality.
</p>
`,
    `<p>
    Our mission is to bring people together through meaningful celebration.
</p>
<p>
    We create music-driven experiences that encourage presence, openness, and real connection.
</p>
<p>
    Moments where people don’t just dance next to each other, but feel part of something shared.
</p>
<p>
    Mental health is at the core of what we do through visibility, direct action, and long-term commitment.
</p>`,
    `<p>
    We imagine a culture where celebration creates impact.
</p>
<p>
    Where events are not defined by scale, but by how they make people feel.
</p>
<p>
    Where music raises awareness, community creates belonging, and purpose becomes part of nightlife.
</p>
<p>
    Our vision is to grow Picollect into a platform that connects artists, communities, and causes, redefining how we celebrate in Luxembourg and beyond.
</p>`,
    `<p>
    We believe celebration is a responsibility.
</p>
<p>
    We believe music is a language.
</p>
<p>
    We believe people come before performance.
</p>
<p>
    We believe in moments over metrics.
</p>
<p>
    In energy over excess.
</p>
<p>
    In connection over consumption.
</p>
<p>
    We believe mental health deserves care, access, and visibility — and that joy and awareness can coexist.
</p>
<p>
    Picollect is not just something you attend.
</p>
<p>
    It’s something you stand for.
</p>`
  ];

  selectOption(index: number) {
    this.selectedIndex = index;
  }
  isMobileView = false;
}