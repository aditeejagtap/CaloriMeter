import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../services/profile.service';
import { PlanService } from '../../services/plan.service';
import { Router } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Plan } from '../../models/plan.model';

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './plan.component.html',
  styleUrl: './plan.component.css',
})
export class PlanComponent implements OnInit {
  constructor(
    private profileService: ProfileService,
    private planService: PlanService,
    private router: Router,
  ) {}

  stage: 1 | 2 | 3 = 1;
  activePlan: Plan | null = null;
  currentWeight: number = 0;
  isLoading: boolean = true;

  // Stage 1 form
  stage1_form = new FormGroup({
    goal: new FormControl<'weight_loss' | 'weight_gain' | 'maintenance'>('weight_loss'),
    targetWeight: new FormControl(0),
  });

  // duration options from suggestDurations
  durationOptions: {
    durationDays: number;
    dailyChange: number;
    label: string;
    risk: string;
  }[] = [];

  // user selected option
  selectedOption: {
    durationDays: number;
    dailyChange: number;
    label: string;
    risk: string;
  } | null = null;

  async ngOnInit() {
    const profile = await this.profileService.getProfile();
    if (profile) this.currentWeight = profile.weight;

    const activePlan = await this.planService.getActivePlan();
    if (activePlan) {
      this.activePlan = activePlan;
      this.stage = 3;
    }
    this.isLoading = false;
  }

  get isMaintenance(): boolean {
    return this.stage1_form.value.goal === 'maintenance';
  }

  get targetWeightPlaceholder(): string {
    const goal = this.stage1_form.value.goal;
    if (goal === 'weight_loss') return `Less than ${this.currentWeight} kg`;
    if (goal === 'weight_gain') return `More than ${this.currentWeight} kg`;
    return 'Enter target weight';
  }

  // called when user fills goal + weights
  getSuggestions() {
    const formValue = this.stage1_form.value;
    const goal = formValue.goal ?? 'weight_loss';
    let targetWeight = formValue.targetWeight ?? 0;

    // For maintenance, use current weight as target
    if (goal === 'maintenance') {
      targetWeight = this.currentWeight;
    }

    // Validate target weight based on goal
    if (goal === 'weight_loss' && targetWeight >= this.currentWeight) {
      alert('For weight loss, target weight must be lower than current weight');
      return;
    }
    if (goal === 'weight_gain' && targetWeight <= this.currentWeight) {
      alert(
        'For weight gain, target weight must be higher than current weight',
      );
      return;
    }

    // For maintenance, skip duration selection and create plan directly
    if (goal === 'maintenance') {
      this.selectedOption = {
        durationDays: 365, // 1 year default for maintenance
        dailyChange: 0,
        label: 'maintenance',
        risk: 'steady state',
      };
      this.createPlan();
      return;
    }

    this.durationOptions = this.planService.suggestDurations(
      this.currentWeight,
      targetWeight,
      goal,
    );
    this.stage = 2;
  }

  // called when user picks a duration option
  selectOption(option: {
    durationDays: number;
    dailyChange: number;
    label: string;
    risk: string;
  }) {
    this.selectedOption = option;
  }

  // called on final submit
  async createPlan() {
    if (!this.selectedOption) return;
    const formValue = this.stage1_form.value;
    const profile = await this.profileService.getProfile();
    if (!profile) return;

    const goal = formValue.goal ?? 'weight_loss';
    let targetWeight = formValue.targetWeight ?? 0;

    const plan = this.planService.createPlan(
      goal,
      this.currentWeight,
      targetWeight,
      profile.height,
      profile.age,
      profile.gender,
      profile.activityLevel,
      this.selectedOption,
    );

    if (this.activePlan) {
      await this.planService.updatePlan(this.activePlan.id, plan);
      this.activePlan = { ...plan, id: this.activePlan.id };
    } else {
      this.activePlan = await this.planService.savePlan(plan);
    }
    this.stage = 3;
  }

  async editPlan() {
    const confirmed = confirm('This will replace your current plan. Continue?');
    if (!confirmed) return;
    if (this.activePlan) {
      await this.planService.updatePlan(this.activePlan.id, {
        isActive: false,
      });
    }
    this.activePlan = null;
    this.selectedOption = null;
    this.durationOptions = [];
    this.stage = 1;
  }
}
