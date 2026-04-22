import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../services/log.service';
import { PlanService } from '../../services/plan.service';
import { Plan } from '../../models/plan.model';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import {
  DailyLog,
  MealTemplate,
  WorkoutTemplate,
} from '../../models/log.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  constructor(
    private logService: LogService,
    private planService: PlanService,
    private route: ActivatedRoute,
  ) {}

  isLoading = true;
  today = new Date().toISOString().split('T')[0];
  viewingDate = this.today;
  isViewingPast = false;

  // Helper method to format date display
  getFormattedDate(dateStr: string): string {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const dateObj = new Date(dateStr);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (dateStr === today) {
      return `Today - ${formattedDate}`;
    } else if (dateStr === yesterdayStr) {
      return `Yesterday - ${formattedDate}`;
    } else if (dateStr === tomorrowStr) {
      return `Tomorrow - ${formattedDate}`;
    }
    return formattedDate;
  }

  activePlan: Plan | null = null;
  dailyLog: DailyLog | null = null;
  mealTemplates: MealTemplate[] = [];
  workoutTemplates: WorkoutTemplate[] = [];

  // calculated
  caloriesConsumed = 0;
  caloriesBurned = 0;
  adjustedTarget = 0;
  netCalories = 0;

  // macros
  macroConsumed = { protein: 0, carbs: 0, fats: 0 };
  macroTarget = { protein: 0, carbs: 0, fats: 0 };

  prevDay() {
    const d = new Date(this.viewingDate);
    d.setDate(d.getDate() - 1);
    this.updateDate(d);
  }

  nextDay() {
    const d = new Date(this.viewingDate);
    d.setDate(d.getDate() + 1);
    this.updateDate(d);
  }

  async updateDate(date: Date) {
    this.viewingDate = date.toISOString().split('T')[0];
    this.isViewingPast = this.viewingDate < this.today;

    // reload log for selected date
    this.dailyLog = await this.logService.getDailyLogByDate(this.viewingDate);

    this.recalculate();
    this.updateWaterDrops();
  }

  async ngOnInit() {
    const dateParam = this.route.snapshot.queryParamMap.get('date');
    if (dateParam) {
      this.viewingDate = dateParam;
      this.isViewingPast = dateParam < this.today;
    }
    

    try {
      const [plan, log, meals, workouts] = await Promise.all([
        this.planService.getActivePlan(),
        this.logService.getDailyLogByDate(this.viewingDate),
        this.logService.getMealTemplates(),
        this.logService.getWorkoutTemplates(),
      ]);

      this.activePlan = plan;
      this.dailyLog = log;
      this.mealTemplates = meals;
      this.workoutTemplates = workouts;

      this.recalculate();
      this.updateWaterDrops();
    } catch (err) {
      console.error('Home init error:', err);
    } finally {
      this.isLoading = false;
    }
  }

  recalculate() {
    this.caloriesConsumed =
      this.dailyLog?.meals.reduce((sum, m) => sum + m.caloriesConsumed, 0) ?? 0;
    this.caloriesBurned =
      this.dailyLog?.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0) ??
      0;
    this.adjustedTarget =
      (this.activePlan?.dailyCalorieTarget ?? 0) + this.caloriesBurned;
    this.netCalories = this.caloriesConsumed - this.caloriesBurned;

    this.macroConsumed = {
      protein:
        this.dailyLog?.meals.reduce(
          (sum, m) => sum + (m.macrosPerServing?.protein ?? 0) * m.quantity,
          0,
        ) ?? 0,
      carbs:
        this.dailyLog?.meals.reduce(
          (sum, m) => sum + (m.macrosPerServing?.carbs ?? 0) * m.quantity,
          0,
        ) ?? 0,
      fats:
        this.dailyLog?.meals.reduce(
          (sum, m) => sum + (m.macrosPerServing?.fats ?? 0) * m.quantity,
          0,
        ) ?? 0,
    };

    this.macroTarget = {
      protein: this.activePlan?.macroTargets.protein ?? 0,
      carbs: this.activePlan?.macroTargets.carbs ?? 0,
      fats: this.activePlan?.macroTargets.fats ?? 0,
    };

    this.updateWaterDrops();
  }

  updateWaterDrops() {
    const current = this.dailyLog?.waterIntakeL ?? 0;

    const drops = Math.round(current / 0.5); // convert litres → drops

    this.filledDrops = Math.max(0, Math.min(drops, this.waterDrops.length));
  }

  getMacroPercentage(consumed: number, target: number): number {
    if (target === 0) return 0;
    return Math.min((consumed / target) * 100, 100);
  }

  get caloriesRemaining(): number {
    const baseTarget = this.activePlan?.dailyCalorieTarget ?? 0;
    const burnTarget = this.activePlan?.minimumDailyBurn ?? 0;

    // 🔥 only extra burn counts
    const extraBurn = Math.max(0, this.caloriesBurned - burnTarget);

    return Math.max(0, baseTarget - this.caloriesConsumed + extraBurn);
  }

  get ringDashOffset(): number {
    if (this.adjustedTarget === 0) return 339.3;
    const percentage = Math.min(this.caloriesConsumed / this.adjustedTarget, 1);
    return 339.3 * (1 - percentage);
  }

  //Code for meal and workout log

  // UI state
  showMealPicker = false;
  showWorkoutPicker = false;
  selectedMealTemplate: MealTemplate | null = null;
  mealQuantity = 1;

  // Add Meal flow
  selectMealTemplate(template: MealTemplate) {
    this.selectedMealTemplate = template;
  }

  async logMeal() {
    if (!this.selectedMealTemplate) return;

    const mealLog = {
      templateId: this.selectedMealTemplate.id,
      foodItem: this.selectedMealTemplate.foodItem,
      source: this.selectedMealTemplate.source,
      quantity: this.mealQuantity,
      macrosPerServing: this.selectedMealTemplate.macrosPerServing,
      caloriesConsumed:
        this.selectedMealTemplate.caloriesPerServing * this.mealQuantity,
      savedAsTemplate: true,
    };

    if (!this.dailyLog) {
      this.dailyLog = this.logService.createEmptyLog(this.viewingDate);
      this.dailyLog.meals.push(mealLog);
      await this.logService.saveDailyLog(this.dailyLog);
    } else {
      this.dailyLog.meals.push(mealLog);
      await this.logService.updateDailyLog(this.viewingDate, {
        meals: this.dailyLog.meals,
      });
    }

    this.showMealPicker = false;
    this.selectedMealTemplate = null;
    this.mealQuantity = 1;
    this.recalculate();
    this.updateWaterDrops();
  }

  // Add Workout flow

  selectedWorkoutTemplate: WorkoutTemplate | null = null;
  workoutCaloriesBurned = 0;

  selectWorkoutTemplate(template: WorkoutTemplate) {
    this.selectedWorkoutTemplate = template;
  }

  async logWorkout() {
    if (!this.selectedWorkoutTemplate) return;
    const workoutLog = {
      templateId: this.selectedWorkoutTemplate.id,
      activityName: this.selectedWorkoutTemplate.activityName,
      durationMins: this.selectedWorkoutTemplate.durationMins,
      caloriesBurned: this.workoutCaloriesBurned,
    };

    if (!this.dailyLog) {
      this.dailyLog = this.logService.createEmptyLog(this.viewingDate);
      this.dailyLog.workouts.push(workoutLog);
      await this.logService.saveDailyLog(this.dailyLog);
    } else {
      this.dailyLog.workouts.push(workoutLog);
      await this.logService.updateDailyLog(this.viewingDate, {
        workouts: this.dailyLog.workouts,
      });
    }

    this.showWorkoutPicker = false;
    this.recalculate();
    this.updateWaterDrops();
  }

  // Water intake
  waterDrops = Array(6).fill(0);
  filledDrops = 0;
  waterInputValue: number | null = null;

  toggleDrop(index: number) {
    if (index < this.filledDrops) {
      this.filledDrops = index;
    } else {
      this.filledDrops = index + 1;
    }
    this.saveWaterIntake();
  }

  async saveWaterIntake() {
    if (!this.dailyLog) {
      this.dailyLog = this.logService.createEmptyLog(this.viewingDate);
    }
    // Each drop = 0.5L
    this.dailyLog.waterIntakeL = this.filledDrops * 0.5;
    await this.logService.saveDailyLog(this.dailyLog);
    this.updateWaterDrops();

    // Show notification when all drops are filled
    if (this.filledDrops >= this.waterDrops.length) {
      this.showToast('Fully hydrated! 💪');
    }
  }

  showToast(message: string) {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger reflow
    void toast.offsetWidth;

    // Show toast
    toast.classList.add('show');

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 400);
    }, 3000);
  }

  async deleteMealLog(index: number) {
    if (!this.dailyLog) return;
    this.dailyLog.meals.splice(index, 1);
    await this.logService.updateDailyLog(this.viewingDate, {
      meals: this.dailyLog.meals,
    });
    this.recalculate();
  }

  async deleteWorkoutLog(index: number) {
    if (!this.dailyLog) return;
    this.dailyLog.workouts.splice(index, 1);
    await this.logService.updateDailyLog(this.viewingDate, {
      workouts: this.dailyLog.workouts,
    });
    this.recalculate();
  }
}
