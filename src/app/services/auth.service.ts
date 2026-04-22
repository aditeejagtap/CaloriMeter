import { Injectable } from '@angular/core';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth } from '../core/firebase';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async getCurrentUser(): Promise<User | null> {
    return auth.currentUser;
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }
}

