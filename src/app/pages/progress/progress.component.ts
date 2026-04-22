import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PlanService } from '../../services/plan.service';
import { LogService } from '../../services/log.service';
import { Plan } from '../../models/plan.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.css',
})
export class ProgressComponent implements OnInit {
  constructor(
    private planService: PlanService,
    private logService: LogService,
    private router: Router,
  ) {}

  isLoading = true;
  activePlan: Plan | null = null;
  loggedDates: Set<string> = new Set();
  streakDates: Set<string> = new Set();
  dayStatus: Map<string, 'pending' | 'passed' | 'failed'> = new Map();
  streakCount = 0;

  // weight logging
  showWeightInput = false;
  newWeight = 0;
  
  // calendar
  currentMonth = new Date();

  calculateStreakCount() {
    if (!this.dayStatus || this.dayStatus.size === 0) {
      this.streakCount = 0;
      return;
    }

    const sortedDates = Array.from(this.dayStatus.keys()).sort().reverse();

    let count = 0;

    for (const date of sortedDates) {
      const status = this.dayStatus.get(date);

      if (status === 'pending') continue;

      if (status === 'passed') {
        count++;
      } else {
        break; // stop at first ❌
      }
    }

    this.streakCount = count;
  }

  async ngOnInit() {
    try {
      const [plan, loggedDates] = await Promise.all([
        this.planService.getActivePlan(),
        this.logService.getLoggedDates(),
      ]);
      this.activePlan = plan;
      this.loggedDates = new Set(loggedDates);

      await this.calculateStreaks(); // 🔥 IMPORTANT
      this.calculateStreakCount();
      this.logService.setStreakCount(this.streakCount);
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  // Weight progress getters
  get startWeight(): number {
    return this.activePlan?.currentWeight ?? 0;
  }

  get goalWeight(): number {
    return this.activePlan?.targetWeight ?? 0;
  }

  get currentWeight(): number {
    const log = this.activePlan?.weeklyWeightLog;
    if (log && log.length > 0) return log[log.length - 1].weight;
    return this.startWeight;
  }

  get kgRemaining(): number {
    return Math.abs(this.currentWeight - this.goalWeight);
  }

  get progressPercent(): number {
    const total = Math.abs(this.startWeight - this.goalWeight);
    if (total === 0) return 100;

    // For weight loss: progress = (start - current) / (start - goal)
    // For weight gain: progress = (current - start) / (goal - start)
    if (this.activePlan?.goal === 'weight_loss') {
      const done = this.startWeight - this.currentWeight;
      return Math.min(Math.max(Math.round((done / total) * 100), 0), 100);
    } else if (this.activePlan?.goal === 'weight_gain') {
      const done = this.currentWeight - this.startWeight;
      return Math.min(Math.max(Math.round((done / total) * 100), 0), 100);
    } else {
      // For maintenance, just show based on absolute difference
      const done = Math.abs(this.startWeight - this.currentWeight);
      return Math.min(Math.round((done / total) * 100), 100);
    }
  }

  async logWeeklyWeight() {
    if (!this.activePlan || !this.newWeight) return;

    // Don't allow negative weights
    if (this.newWeight <= 0) {
      alert('Weight must be a positive number');
      return;
    }

    const entry = {
      date: new Date().toISOString().split('T')[0],
      weight: this.newWeight,
    };
    const updatedLog = [...this.activePlan.weeklyWeightLog, entry];
    await this.planService.updatePlan(this.activePlan.id, {
      weeklyWeightLog: updatedLog,
    });
    this.activePlan.weeklyWeightLog = updatedLog;
    this.showWeightInput = false;
    this.newWeight = 0;
  }

  // Calendar
  get calendarDays(): (string | null)[] {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (string | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(dateStr);
    }
    return days;
  }

  get calendarMonthLabel(): string {
    return this.currentMonth.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
  }

  prevMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
    );
  }

  nextMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
    );
  }

  goToDay(date: string) {
    this.router.navigate(['/home'], { queryParams: { date } });
  }

  isToday(date: string): boolean {
    return date === new Date().toISOString().split('T')[0];
  }

  hasLog(date: string): boolean {
    return this.loggedDates.has(date);
  }

  async evaluateDay(date: string): Promise<boolean> {
    if (!this.activePlan) return false;

    const log = await this.logService.getDailyLogByDate(date);
    if (!log) return false;

    const mealCalories = log.meals.reduce(
      (sum, m) => sum + m.caloriesConsumed,
      0,
    );

    const workoutCalories = log.workouts.reduce(
      (sum, w) => sum + w.caloriesBurned,
      0,
    );

    const meetsCalorieTarget =
      mealCalories <= this.activePlan.dailyCalorieTarget;

    const meetsBurnTarget = workoutCalories >= this.activePlan.minimumDailyBurn;

    return meetsCalorieTarget && meetsBurnTarget;
  }

  async calculateStreaks() {
    if (!this.activePlan) return;

    this.streakDates.clear();
    this.dayStatus.clear();

    const sortedDates = Array.from(this.loggedDates).sort();
    const today = new Date().toISOString().split('T')[0];

    let streakActive = true;
    let shouldExtendPlan = false;

    for (const date of sortedDates) {
      if (date === today) {
        this.dayStatus.set(date, 'pending');
        continue;
      }
      const isValid = await this.evaluateDay(date);

      if (isValid) {
        this.dayStatus.set(date, 'passed');

        if (streakActive) {
          this.streakDates.add(date); // 🔥 only if streak not broken yet
        }
      } else {
        this.dayStatus.set(date, 'failed');

        // break streak only once
        if (streakActive) {
          streakActive = false;
          shouldExtendPlan = true;
        }
      }
    }

    // ✅ Extend ONLY ONCE and ONLY IF NOT ALREADY EXTENDED
    if (shouldExtendPlan && !this.activePlan.isExtended) {
      await this.extendPlanByOneDay();

      // mark so we don't extend again on reload
      await this.planService.updatePlan(this.activePlan.id, {
        isExtended: true,
      });

      this.activePlan.isExtended = true;
    }
  }

  async extendPlanByOneDay() {
    if (!this.activePlan) return;

    const endDate = new Date(this.activePlan.endDate);
    endDate.setDate(endDate.getDate() + 1);

    const newDateStr = endDate.toISOString().split('T')[0];

    await this.planService.updatePlan(this.activePlan.id, {
      endDate: newDateStr,
    });

    this.activePlan.endDate = newDateStr;
  }
}
