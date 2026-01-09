import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../shared/header.component';

@Component({
    selector: 'app-cookies-policy',
    standalone: true,
    imports: [CommonModule, TranslateModule, RouterLink, HeaderComponent],
    templateUrl: './cookies-policy.component.html',
    styleUrls: ['./cookies-policy.component.scss']
})
export class CookiesPolicyComponent { }
