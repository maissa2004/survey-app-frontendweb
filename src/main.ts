import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Désactiver le SSR en utilisant bootstrapApplication directement
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));