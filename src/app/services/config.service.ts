// src/app/services/config.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private razorpayKeyId: string = 'temp_key'; // Temporary key
  private configLoaded = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  loadConfig(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Temporary: Resolve immediately with mock data
      setTimeout(() => {
        this.razorpayKeyId = 'temp_key';
        this.configLoaded.next(true);
        resolve();
      }, 100);

      // Comment out the actual API call for now
      /*
      this.http.get<{ keyId: string }>(`${environment.apiUrl}/payment/config`).subscribe({
        next: (config) => {
          this.razorpayKeyId = config.keyId;
          this.configLoaded.next(true);
          resolve();
        },
        error: (err) => {
          console.error('Failed to load config:', err);
          // Don't reject - use fallback values
          this.razorpayKeyId = 'fallback_key';
          this.configLoaded.next(true);
          resolve();
        }
      });
      */
    });
  }

  getRazorpayKeyId(): string {
    return this.razorpayKeyId;
  }

  isConfigLoaded(): BehaviorSubject<boolean> {
    return this.configLoaded;
  }
}