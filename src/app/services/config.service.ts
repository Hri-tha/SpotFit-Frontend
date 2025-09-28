// config.service.ts - FIXED VERSION
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private razorpayKeyId: string = environment.razorpayKeyId; // Use environment value as fallback
  private configLoaded = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    // Auto-load config when service is created
    this.loadConfig();
  }

  loadConfig(): Promise<void> {
    return new Promise((resolve, reject) => {
      // If we already have a key from environment, consider it loaded
      if (environment.razorpayKeyId) {
        this.razorpayKeyId = environment.razorpayKeyId;
        this.configLoaded.next(true);
        resolve();
        return;
      }

      // Otherwise, try to load from backend
      this.http.get<{ keyId: string }>(`${environment.apiUrl}/payment/config`).subscribe({
        next: (config) => {
          this.razorpayKeyId = config.keyId;
          this.configLoaded.next(true);
          resolve();
        },
        error: (err) => {
          console.error('Failed to load config from backend:', err);
          // Use fallback
          this.razorpayKeyId = 'rzp_test_default'; // Fallback key
          this.configLoaded.next(true);
          resolve();
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