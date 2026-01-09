import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../shared/header.component';

@Component({
    selector: 'app-privacy-policy',
    standalone: true,
    imports: [CommonModule, TranslateModule, RouterLink, HeaderComponent],
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent { }
