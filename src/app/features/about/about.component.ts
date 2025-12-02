import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import * as THREE from 'three';

@Component({
  selector: 'feature-about',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  menuOptions = [
    'CONCEPT',
    'MISSION',
    'VISION',
    'MANIFEST'
  ];
  selectedIndex = 0;
  contents = [
    'Texto para CONCEPT',
    'Texto para MISSION',
    'Texto para VISION',
    'Texto para MANIFEST'
  ];

  selectOption(index: number) {
    this.selectedIndex = index;
  }
}