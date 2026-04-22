// saved once, reused forever
export enum MealSource {
  KITCHEN = "Seema's Kitchen",
  HOMEMADE = 'HomeMade',
  PACKAGED = 'Packaged',
  ORDERED = 'Ordered',
  OTHER = 'Other',
}
export interface Macros {
  protein: number;
  fats: number;
  carbs: number;
}

/////////////////////////////////////////////////////////

// daily log references templates

export interface MealTemplate {
  id: string;
  foodItem: string;
  source: MealSource;
  macrosPerServing: Macros;
  caloriesPerServing: number;
  lastUsed: string;
  useCount: number;
}

export interface MealLog {
  templateId: string; // reference to original template
  foodItem: string; // overridable
  source: MealSource; // overridable
  quantity: number; // overridable
  macrosPerServing: Macros; // overridable
  caloriesConsumed: number; // recalculated after override
  savedAsTemplate: boolean; // if overridden, prompt user to save as new template
}

export interface WorkoutTemplate {
  id: string;
  activityName: string;
  durationMins: number;
}

export interface WorkoutLog {
  templateId: string; // points to WorkoutTemplate
  activityName: string;
  durationMins: number; // user overrides this
  caloriesBurned: number; // user overrides this
}

export interface DailyLog {
  id: string;
  date: string;
  meals: MealLog[];
  workouts: WorkoutLog[];
  waterIntakeL: number;
}
