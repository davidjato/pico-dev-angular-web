import { Component, inject, DestroyRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NewsletterService } from '../../shared/newsletter.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'feature-contact',
  standalone: true,
  imports: [TranslateModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  private newsletterService = inject(NewsletterService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  email: string = '';
  selectedType: 'asistente' | 'promotor' | 'partner' = 'asistente';
  privacyAccepted: boolean = false;

  isLoading: boolean = false;
  isSuccess: boolean = false;
  isError: boolean = false;
  errorMessage: string = '';

  onSubmit() {
    if (!this.privacyAccepted) {
      this.isError = true;
      this.errorMessage = 'Please accept the privacy policy';
      return;
    }

    if (this.email && this.validateEmail(this.email)) {
      this.isLoading = true;
      this.isSuccess = false;
      this.isError = false;
      this.errorMessage = '';

      console.log('📧 Enviando suscripción:', { email: this.email, type: this.selectedType });

      this.newsletterService.subscribe(this.email, this.selectedType)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            console.log('✅ Respuesta exitosa del servidor:', response);
            this.isLoading = false;
            this.isSuccess = true;

            // Limpiar el formulario después de 3 segundos - ejecutar dentro de NgZone
            this.ngZone.run(() => {
              setTimeout(() => {
                console.log('🧹 Limpiando formulario...');
                this.email = '';
                this.selectedType = 'asistente';
                this.isSuccess = false;
                this.cdr.markForCheck();
                console.log('✨ Formulario limpiado:', { email: this.email, type: this.selectedType });
              }, 3000);
            });
          },
          error: (error) => {
            console.error('❌ Error en suscripción:', error);
            this.isLoading = false;

            // Si es AbortError, ignorarlo si ya tuvimos éxito
            if (error.name === 'AbortError' && this.isSuccess) {
              console.log('⚠️ AbortError ignorado - suscripción ya exitosa');
              return;
            }

            this.isError = true;
            this.errorMessage = error.error?.message || 'Error al suscribirse. Por favor, intenta de nuevo.';

            // Ocultar el error después de 5 segundos
            this.ngZone.run(() => {
              setTimeout(() => {
                this.isError = false;
                this.cdr.markForCheck();
              }, 5000);
            });
          }
        });
    } else {
      this.isError = true;
      this.errorMessage = 'Por favor, introduce un email válido.';
      this.ngZone.run(() => {
        setTimeout(() => {
          this.isError = false;
          this.cdr.markForCheck();
        }, 3000);
      });
    }
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
