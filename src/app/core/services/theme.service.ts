import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$: Observable<boolean> = this.isDarkModeSubject.asObservable();

  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.loadInitialTheme();
  }

  private loadInitialTheme(): void {
    const saved = localStorage.getItem('dashboardDarkMode');
    const darkMode = saved === 'true';
    this.setDarkMode(darkMode);
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.isDarkModeSubject.value);
  }

  setDarkMode(enabled: boolean): void {
    this.isDarkModeSubject.next(enabled);
    localStorage.setItem('dashboardDarkMode', String(enabled));

    if (enabled) {
      this.renderer.addClass(document.body, 'dark-mode');
      this.renderer.setStyle(document.body, 'background-color', '#1a1a2e');
      this.renderer.setStyle(document.body, 'color', '#e0e0e0');
    } else {
      this.renderer.removeClass(document.body, 'dark-mode');
      this.renderer.setStyle(document.body, 'background-color', '');
      this.renderer.setStyle(document.body, 'color', '');
    }
  }

  getCurrentMode(): boolean {
    return this.isDarkModeSubject.value;
  }
}