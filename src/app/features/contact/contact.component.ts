import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'feature-contact',
  standalone: true,
  imports: [TranslateModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  email: string = '';

  onSubmit() {
    if (this.email) {
      console.log('Email submitted:', this.email);
      // TODO: Implement email submission logic
    }
  }
}
