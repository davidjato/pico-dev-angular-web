import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NewsletterSubscription {
    email: string;
    clientType: 'asistente' | 'promotor' | 'partner';
}

export interface NewsletterResponse {
    success: boolean;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NewsletterService {
    private http = inject(HttpClient);
    private apiUrl = 'https://pico-dev-backend-dba741a6f66c.herokuapp.com/api/newsletter/subscribe';

    subscribe(email: string, clientType: 'asistente' | 'promotor' | 'partner'): Observable<NewsletterResponse> {
        const body: NewsletterSubscription = {
            email,
            clientType
        };

        return this.http.post<NewsletterResponse>(this.apiUrl, body);
    }
}
