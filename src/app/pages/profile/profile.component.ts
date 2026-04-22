import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../models/profile.model';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router,
  ) {}

  profile: UserProfile | null = null;

  isEditing = false;

  edit_form = new FormGroup({
    age: new FormControl(0),
    height: new FormControl(0),
    weight: new FormControl(0),
    gender: new FormControl(''),
    activityLevel: new FormControl(''),
  });

  async saveProfile() {
    const formValue = this.edit_form.value;
    await this.profileService.updateProfile({
      age: formValue.age ?? 0,
      height: formValue.height ?? 0,
      weight: formValue.weight ?? 0,
      gender: formValue.gender as 'male' | 'female',
      activityLevel: formValue.activityLevel as 'sedentary' | 'light' | 'moderate' | 'active',
    });
    this.profile = await this.profileService.getProfile();
    this.isEditing = false;
  }
  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    this.profile = await this.profileService.getProfile();
    console.log(this.profile);
    if (this.profile) {
      this.edit_form.patchValue({
        age: this.profile.age,
        height: this.profile.height,
        weight: this.profile.weight,
        gender: this.profile.gender,
        activityLevel: this.profile.activityLevel,
      });
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
