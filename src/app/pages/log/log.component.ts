import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { LogService } from '../../services/log.service';
import {
  MealSource,
  MealTemplate,
  WorkoutTemplate,
} from '../../models/log.model';

@Component({
  selector: 'app-log',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './log.component.html',
  styleUrl: './log.component.css',
})
export class LogComponent implements OnInit {
  mealTemplates: MealTemplate[] = [];
  workoutTemplates: WorkoutTemplate[] = [];

  constructor(private logService: LogService) {}

  meal_form = new FormGroup({
    foodItem: new FormControl(''),
    source: new FormControl(''),
    quantity: new FormControl(0),
    caloriesPerServing: new FormControl(0),
    macrosPerServing: new FormGroup({
      fats: new FormControl(0),
      carbs: new FormControl(0),
      protein: new FormControl(0),
    }),
  });

  wo_form = new FormGroup({
    activityName: new FormControl(''),
    durationMins: new FormControl(0),
  });

  ngOnInit() {
    this.loadTemplates();
    this.meal_form.get('macrosPerServing')?.valueChanges.subscribe((macros) => {
      const calories =
        (macros?.protein ?? 0) * 4 +
        (macros?.carbs ?? 0) * 4 +
        (macros?.fats ?? 0) * 9;

      this.meal_form
        .get('caloriesPerServing')
        ?.setValue(calories, { emitEvent: false });
    });
  }

  async loadTemplates() {
    this.mealTemplates = await this.logService.getMealTemplates();
    this.workoutTemplates = await this.logService.getWorkoutTemplates();
  }

  showToast(message: string) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2200);
    }
  }

  async onSubmitMeal() {
    const formValue = this.meal_form.value;

    const mealTemplate: MealTemplate = {
      id: '',
      foodItem: formValue.foodItem ?? '',
      source: formValue.source as MealSource,
      macrosPerServing: {
        protein: formValue.macrosPerServing?.protein ?? 0,
        fats: formValue.macrosPerServing?.fats ?? 0,
        carbs: formValue.macrosPerServing?.carbs ?? 0,
      },
      caloriesPerServing: formValue.caloriesPerServing ?? 0,
      lastUsed: '',
      useCount: 0,
    };

    const saved = await this.logService.saveMealTemplate(mealTemplate);
    await this.logService.updateMealTemplate(saved.id, { id: saved.id });

    // Clear form and show toast
    this.meal_form.reset();
    this.showToast('Template logged!');
    await this.loadTemplates();
  }

  async onSubmitWorkout() {
    const formValue = this.wo_form.value;

    const workoutTemplate: WorkoutTemplate = {
      id: '',
      activityName: formValue.activityName ?? '',
      durationMins: formValue.durationMins ?? 0,
    };

    const saved = await this.logService.saveWorkoutTemplate(workoutTemplate);
    await this.logService.updateWorkoutTemplate(saved.id, { id: saved.id });

    // Clear form and show toast
    this.wo_form.reset();
    this.showToast('Template logged!');
    await this.loadTemplates();
  }

  async deleteMealTemplate(id: string) {
    await this.logService.deleteMealTemplates(id);
    this.showToast('Meal template deleted!');
    await this.loadTemplates();
  }

  async deleteWorkoutTemplate(id: string) {
    await this.logService.deleteWorkoutTemplates(id);
    this.showToast('Workout template deleted!');
    await this.loadTemplates();
  }

  editMealTemplate(template: MealTemplate) {
    // Pre-fill form with template data
    this.meal_form.patchValue({
      foodItem: template.foodItem,
      source: template.source,
      caloriesPerServing: template.caloriesPerServing,
      macrosPerServing: template.macrosPerServing,
    });
  }

  editWorkoutTemplate(template: WorkoutTemplate) {
    // Pre-fill form with template data
    this.wo_form.patchValue({
      activityName: template.activityName,
      durationMins: template.durationMins,
    });
  }
}
