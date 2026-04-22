import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../models/profile.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
})
export class OnboardingComponent {
  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router,
  ) {}

  onboarding_form = new FormGroup({
    dateOfBirth: new FormControl(null),
    height: new FormControl(null),
    gender: new FormControl(''),
    weight: new FormControl(null),
    activityLevel: new FormControl(''),
  });

  calculateAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }

  async onSubmit() {
    const formValue = this.onboarding_form.value;
    const user = await this.authService.getCurrentUser();
    if (!user) return;

    const age = this.calculateAge(formValue.dateOfBirth ?? '');

    const profile: UserProfile = {
      uid: user.uid,
      name: user.displayName ?? '',
      email: user.email ?? '',
      photoUrl: user.photoURL ?? '',
      joinedDate: new Date().toISOString().split('T')[0],
      age: age,
      height: formValue.height ?? 0,
      weight: formValue.weight ?? 0,
      gender: formValue.gender as 'male' | 'female',
      activityLevel: formValue.activityLevel as
        | 'sedentary'
        | 'light'
        | 'moderate'
        | 'active',
    };

    await this.profileService.saveProfile(profile);
    this.router.navigate(['/plan']);
  }
}
