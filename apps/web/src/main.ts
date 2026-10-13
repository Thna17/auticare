import { ErrorHandler } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { GlobalErrorHandler } from './app/core/errors/global-error-handler';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [...appConfig.providers, { provide: ErrorHandler, useClass: GlobalErrorHandler }],
}).catch((err) => console.error(err));
