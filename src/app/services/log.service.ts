import { Injectable } from '@angular/core';
import {  collection,  doc,  addDoc,  getDocs,  deleteDoc,  updateDoc,  query,  where,  setDoc,  getDoc,} from 'firebase/firestore';
import { db } from '../core/firebase';
import { MealTemplate, WorkoutTemplate, DailyLog } from '../models/log.model';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class LogService {
  constructor(private authService: AuthService) {}

  private streakCount$ = new BehaviorSubject<number>(0);

  // ✅ set streak
  setStreakCount(count: number) {
    this.streakCount$.next(count);
  }

  // ✅ get streak (observable)
  getStreakCountObservable() {
    return this.streakCount$.asObservable();
  }

  private async getUserId(): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');
    return user.uid;
  }

  //MealTemplate Methods

  async saveMealTemplate(Mtemplate: MealTemplate): Promise<MealTemplate> {
    const userId = await this.getUserId();
    const docRef = await addDoc(
      collection(db, `users/${userId}/mealTemplates`),
      Mtemplate,
    );
    return { ...Mtemplate, id: docRef.id };
  }

  async getMealTemplates(): Promise<MealTemplate[]> {
    const userId = await this.getUserId();
    const querySnapshot = await getDocs(
      collection(db, `users/${userId}/mealTemplates`),
    );
    const templates: MealTemplate[] = [];
    
    for (const doc of querySnapshot.docs) {
      templates.push({ ...(doc.data() as MealTemplate), id: doc.id });
    }
    return templates;
  }

  async deleteMealTemplates(id: string): Promise<void> {
    const userId = await this.getUserId();
    await deleteDoc(doc(db, `users/${userId}/mealTemplates`, id));
  }

  async updateMealTemplate(id: string, data: Partial<MealTemplate>): Promise<void> {
    const userId = await this.getUserId();
    const docRef = doc(db, `users/${userId}/mealTemplates`, id);
    await updateDoc(docRef, data);
  }

  //WorkoutTemplate Methods

  async saveWorkoutTemplate(WOtemplate: WorkoutTemplate): Promise<WorkoutTemplate> {
    const userId = await this.getUserId();
    const docref = await addDoc(
      collection(db, `users/${userId}/workoutTemplates`),
      WOtemplate,
    );
    return { ...WOtemplate, id: docref.id };
  }

  async getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    const userId = await this.getUserId();
    const querySnapshot = await getDocs(
      collection(db, `users/${userId}/workoutTemplates`),
    );
    const WOtemplates: WorkoutTemplate[] = [];
    for (const doc of querySnapshot.docs) {
      WOtemplates.push({ ...(doc.data() as WorkoutTemplate), id: doc.id });
    }
    return WOtemplates;
  }

  async deleteWorkoutTemplates(id: string): Promise<void> {
    const userId = await this.getUserId();
    await deleteDoc(doc(db, `users/${userId}/workoutTemplates`, id));
  }

  async updateWorkoutTemplate(id: string, data: Partial<WorkoutTemplate>): Promise<void> {
    const userId = await this.getUserId();
    const docRef = doc(db, `users/${userId}/workoutTemplates`, id);
    await updateDoc(docRef, data);
  }

  //DailyLog Methods

  async saveDailyLog(log: DailyLog): Promise<DailyLog> {
    const userId = await this.getUserId();
    await setDoc(doc(db, `users/${userId}/dailyLogs`, log.date), log);
    return log;
  }

  async getDailyLogByDate(date: string): Promise<DailyLog | null> {
    const userId = await this.getUserId();
    const docRef = doc(db, `users/${userId}/dailyLogs`, date);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as DailyLog) : null;
  }

  async deleteDailyLog(date: string): Promise<void> {
    const userId = await this.getUserId();
    await deleteDoc(doc(db, `users/${userId}/dailyLogs`, date));
  }

  async updateDailyLog(date: string, data: Partial<DailyLog>): Promise<void> {
    const userId = await this.getUserId();
    const docRef = doc(db, `users/${userId}/dailyLogs`, date);
    await updateDoc(docRef, data);
  }

  async getLoggedDates(): Promise<string[]> {
    const userId = await this.getUserId();
    const querySnapshot = await getDocs(collection(db, `users/${userId}/dailyLogs`));
    return querySnapshot.docs.map(doc => doc.id); // date is the doc id
  }

  createEmptyLog(date: string): DailyLog {
    return {
      id: date,
      date,
      meals: [],
      workouts: [],
      waterIntakeL: 0,
    };
  }


}


