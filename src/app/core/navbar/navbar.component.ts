import { Component, OnInit } from '@angular/core';
import { ProfileService } from '../../services/profile.service';
import { Router } from '@angular/router';
import { LogService } from '../../services/log.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {
  streakCount = 0;
  userName = '';
  userPhoto = 'assets/user.png'; // fallback image

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private logService: LogService,
  ) {}

  async ngOnInit() {
    const profile = await this.profileService.getProfile();
    if (profile) {
      this.userName = profile.name;
      this.userPhoto = profile.photoUrl || 'assets/user.png';

    this.logService.getStreakCountObservable().subscribe(count => {
      this.streakCount = count;
      });
    }
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
