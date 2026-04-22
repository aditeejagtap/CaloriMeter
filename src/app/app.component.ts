import { Component } from '@angular/core';
import { NavbarComponent } from "./core/navbar/navbar.component";
import { BottomBarComponent } from './core/bottom-bar/bottom-bar.component';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NavbarComponent, BottomBarComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  currentUrl = '';

  constructor(private router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentUrl = event.url;
      }
    });
  }

  get showNav(): boolean {
    return !['/login', '/onboarding'].includes(this.currentUrl);
  }
}
