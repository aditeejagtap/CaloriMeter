export interface UserProfile {
  uid: string;          // from Google Auth
  name: string;         // from Google Auth
  email: string;        // from Google Auth
  photoUrl: string;     // from Google Auth
  joinedDate: string;   // when they first signed up
  age: number;
  height: number;       // cm
  weight: number;       // kg
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
}