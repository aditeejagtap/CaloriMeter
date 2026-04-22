import { Macros } from "./log.model";

export interface Plan {
  id: string;
  goal: 'weight_loss' | 'weight_gain' | 'maintenance';
  
  // user inputs
  currentWeight: number;
  targetWeight: number;
  height: number;        // cm
  age: number;
  gender: 'male' | 'female';
  currentDailyCalories: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';

  // calculated
  bmr: number;
  tdee: number;          // total daily energy expenditure = bmr * activity multiplier
  durationDays: number;
  dailyCalorieTarget: number;
  dailyDeficitOrSurplus: number;
  macroTargets: Macros;
  dailyWaterTargetL: number;
  minimumDailyBurn: number;

  // tracking
  startDate: string;
  endDate: string;
  weeklyWeightLog: { date: string; weight: number }[];
  isActive: boolean;     // only one plan active at a time
  isExtended?: boolean;
}
