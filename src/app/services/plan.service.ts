import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../core/firebase';
import { Plan } from '../models/plan.model';
import { Macros } from '../models/log.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PlanService {
  constructor(private authService: AuthService) {}

  private async getUserId(): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');
    return user.uid;
  }

  //CRUD Operations

  async savePlan(plan: Plan): Promise<Plan> {
    const userId = await this.getUserId();
    const id = doc(collection(db, `users/${userId}/plans`)).id; // generate id first
    const planWithId = { ...plan, id };
    await setDoc(doc(db, `users/${userId}/plans`, id), planWithId);
    return planWithId;
  }

  async getActivePlan(): Promise<Plan | null> {
    const userId = await this.getUserId();
    const q = query(
      collection(db, `users/${userId}/plans`),
      where('isActive', '==', true),
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const docSnap = querySnapshot.docs[0]; //querySnapshot.docs[0] — gets first (and only) active plan.
    return { ...(docSnap.data() as Plan), id: docSnap.id };
  }

  async updatePlan(id: string, data: Partial<Plan>): Promise<void> {
    const userId = await this.getUserId();
    await updateDoc(doc(db, `users/${userId}/plans`, id), data);
  }

  async deletePlan(id: string): Promise<void> {
    const userId = await this.getUserId();
    await deleteDoc(doc(db, `users/${userId}/plans`, id));
  }

  //Calculation Methods

  calculateBMR(
    weight: number,
    height: number,
    age: number,
    gender: 'male' | 'female',
  ): number {
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  }

  calculateTDEE(
    bmr: number,
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active',
  ): number {
    const multipliers: { [key: string]: number } = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
    };
    return bmr * (multipliers[activityLevel.toLowerCase()] ?? 1.2);
  }

  calculateDailyCalorieTarget(
    tdee: number,
    goalType: 'weight_loss' | 'weight_gain' | 'maintenance',
    currentWeight: number,
    targetWeight: number,
    durationDays: number,
    gender: 'male' | 'female',
  ): { target: number; minimumDailyBurn: number } {
    if (goalType === 'maintenance')
      return { target: Math.round(tdee), minimumDailyBurn: 0 };

    const weightDifference = Math.abs(currentWeight - targetWeight);
    const dailyChange = (weightDifference * 7700) / durationDays;
    const MIN_CALORIES = gender.toLowerCase() === 'female' ? 1200 : 1500;

    if (goalType === 'weight_loss') {
      const rawTarget = Math.round(tdee - dailyChange);
      const guardedTarget = Math.max(rawTarget, MIN_CALORIES);
      const minimumDailyBurn = Math.max(0, guardedTarget - rawTarget);
      return { target: guardedTarget, minimumDailyBurn };
    }

    if (goalType === 'weight_gain')
      return { target: Math.round(tdee + dailyChange), minimumDailyBurn: 0 };

    return { target: Math.round(tdee), minimumDailyBurn: 0 };
  }

  calculateMacroTargets(
    dailyCalorieTarget: number,
    goal: 'weight_loss' | 'weight_gain' | 'maintenance',
    currentWeight: number,
  ): Macros {
    // step 1: protein from bodyweight
    const proteinMultiplier =
      goal === 'weight_loss' ? 2.2 : goal === 'weight_gain' ? 2.0 : 1.8;
    /*Ternary operator used : top line expands to-
      if (goal === 'weight_loss') {
        proteinMultiplier = 2.2;
      } else if (goal === 'weight_gain') {
        proteinMultiplier = 2.0;
      } else {
        proteinMultiplier = 1.8; // maintenance
      }*/
    //Python equivalent : proteinMultiplier = 2.2 if goal == 'weight_loss' else 2.0 if goal == 'weight_gain' else 1.8

    const protein = Math.round(currentWeight * proteinMultiplier);

    // step 2: remaining calories after protein
    const proteinCalories = protein * 4;
    const remainingCalories = dailyCalorieTarget - proteinCalories;

    // step 3: split remaining between carbs and fats
    const carbSplit = goal === 'weight_gain' ? 0.6 : 0.55;
    const fatSplit = 1 - carbSplit;

    const carbs = Math.round((remainingCalories * carbSplit) / 4);
    const fats = Math.round((remainingCalories * fatSplit) / 9);

    return { protein, carbs, fats };
  }

  suggestDurations(
    currentWeight: number,
    targetWeight: number,
    goal: 'weight_loss' | 'weight_gain' | 'maintenance',
  ): {
    durationDays: number;
    dailyChange: number;
    label: string;
    risk: string;
  }[] {
    const weightDifference = Math.abs(currentWeight - targetWeight);
    const totalCalories = weightDifference * 7700;

    const rates = {
      weight_loss: [
        { label: 'aggressive', weeklyKg: 0.75, risk: 'muscle loss risk' },
        { label: 'moderate', weeklyKg: 0.5, risk: 'recommended' },
        { label: 'comfortable', weeklyKg: 0.25, risk: 'slow but sustainable' },
      ],
      weight_gain: [
        { label: 'aggressive', weeklyKg: 0.5, risk: 'more fat gain risk' },
        { label: 'moderate', weeklyKg: 0.25, risk: 'recommended' },
        { label: 'comfortable', weeklyKg: 0.1, risk: 'clean bulk' },
      ],
      maintenance: [],
    };

    return rates[goal].map((rate) => {
      const durationWeeks = weightDifference / rate.weeklyKg;
      const durationDays = Math.round(durationWeeks * 7);
      const dailyChange = Math.round(totalCalories / durationDays);

      return {
        label: rate.label,
        durationDays,
        dailyChange,
        risk: rate.risk,
      };
    });
  }

  /*
This is accurate — duration is derived from your exact weekly rates, not hardcoded.
For 6kg weight loss:
aggressive:  6/0.75 = 8 weeks = 56 days,  822 cal/day
moderate:    6/0.5  = 12 weeks = 84 days,  548 cal/day
comfortable: 6/0.25 = 24 weeks = 168 days, 274 cal/day
*/

  createPlan(
    goal: 'weight_loss' | 'weight_gain' | 'maintenance',
    currentWeight: number,
    targetWeight: number,
    height: number,
    age: number,
    gender: 'male' | 'female',
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active',
    DurationOpted: {
      durationDays: number;
      dailyChange: number;
      label: string;
      risk: string;
    },
  ): Plan {
    const bmr = this.calculateBMR(currentWeight, height, age, gender);
    const tdee = this.calculateTDEE(bmr, activityLevel);

    const { target: dailyCalorieTarget, minimumDailyBurn } =
      this.calculateDailyCalorieTarget(
        tdee,
        goal,
        currentWeight,
        targetWeight,
        DurationOpted.durationDays,
        gender,
      );

    const macros = this.calculateMacroTargets(
      dailyCalorieTarget,
      goal,
      currentWeight,
    );

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + DurationOpted.durationDays);

    return {
      id: '',
      goal,
      currentWeight,
      targetWeight,
      height,
      age,
      gender,
      activityLevel,
      currentDailyCalories: tdee,
      bmr,
      tdee,
      durationDays: DurationOpted.durationDays,
      dailyCalorieTarget,
      minimumDailyBurn,
      dailyDeficitOrSurplus: DurationOpted.dailyChange,
      macroTargets: macros,
      dailyWaterTargetL: 2.5,
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      weeklyWeightLog: [],
      isActive: true,
    };
  }
}
