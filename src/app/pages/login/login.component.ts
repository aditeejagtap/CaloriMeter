import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/profile.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  constructor(private authService: AuthService, private router: Router, private profileService: ProfileService ) {}

  async signInWithGoogle() {
    await this.authService.signInWithGoogle();
    const profile = await this.profileService.getProfile();
  
  if (profile) {
    this.router.navigate(['/']);
  } else {
    this.router.navigate(['/onboarding']);
  }
  }
}
