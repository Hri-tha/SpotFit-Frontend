import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig as baseConfig } from './app/app.config';
import { App } from './app/app';
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { ConfigService } from './app/services/config.service';

export function initializeApp(configService: ConfigService) {
  return (): Promise<any> => {
    return configService.loadConfig();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    ...baseConfig.providers,   // ✅ include HttpClient, Router, Interceptors
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService],
      multi: true,
    },
  ],
};

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
