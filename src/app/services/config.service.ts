// src/app/services/config.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment'; // Add this import

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private razorpayKeyId: string = '';
  private configLoaded = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  loadConfig(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use environment.apiUrl instead of relative path
      this.http.get<{ keyId: string }>(`${environment.apiUrl}/payment/config`).subscribe({
        next: (config) => {
          this.razorpayKeyId = config.keyId;
          this.configLoaded.next(true);
          resolve();
        },
        error: (err) => {
          console.error('Failed to load config:', err);
          reject(err);
        }
      });
    });
  }

  getRazorpayKeyId(): string {
    return this.razorpayKeyId;
  }

  isConfigLoaded(): BehaviorSubject<boolean> {
    return this.configLoaded;
  }
}