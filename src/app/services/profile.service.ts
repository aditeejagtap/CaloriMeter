import { Injectable } from '@angular/core';
import { UserProfile } from '../models/profile.model';
import { db } from '../core/firebase';
import { setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(private authService: AuthService) { }

  private async getUserId(): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('User not logged in');
    return user.uid;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const userId = await this.getUserId();
    await setDoc(doc(db, 'users', userId, 'profile', 'data'), profile); // collection: 'users', document: userId, collection: 'profile', document: 'data'
  }

  async getProfile(): Promise<UserProfile | null> {
    const userId = await this.getUserId();
    const docSnap = await getDoc(doc(db, 'users', userId, 'profile', 'data'));
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  }

  async updateProfile(data: Partial<UserProfile>): Promise<void> {
    const userId = await this.getUserId();
    await updateDoc(doc(db, 'users', userId, 'profile', 'data'), data);
  }
  

}
