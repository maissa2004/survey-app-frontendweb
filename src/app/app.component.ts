// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/components/header/header.component';
import { ConfirmComponent } from './core/components/confirm/confirm.component';
import { AlertComponent } from './core/components/alert/alert.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent,AlertComponent, ConfirmComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'appenquetesweb';
}