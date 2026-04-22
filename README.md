# 🔥 CaloriMeter

![Angular](https://img.shields.io/badge/Angular-Framework-red)
![Status](https://img.shields.io/badge/Status-Active-success)
![Focus](https://img.shields.io/badge/Focus-Consistency%20Tracking-orange)
![Logic](https://img.shields.io/badge/Core-Calorie%20Science-blue)
![License](https://img.shields.io/badge/License-MIT-green)

> Not just a calorie tracker — a consistency engine powered by real fitness science.

---

## 🧠 What Makes This Different?

Most fitness apps track numbers.  
CaloriMeter applies **actual metabolic logic** to guide behavior and enforce discipline.

---

## 🔬 Core Calculation Engine

CaloriMeter is built on established nutritional science rather than arbitrary estimates.

- Uses the Mifflin-St Jeor equation to calculate Basal Metabolic Rate (BMR)
- Applies **calorie deficit/surplus principles** for weight loss and gain
- Enforces **safe minimum calorie thresholds** (e.g., 1200 kcal)
- Implements **burn target compensation logic**:
  - Users must meet a minimum daily burn
  - Only *excess burn* contributes to additional calorie allowance

These calculation principles make the system:

- **More grounded in real-world physiology**
- **Safer than naive calorie tracking**
- **More effective for sustainable progress**

👉 Instead of rewarding shortcuts, the system aligns with how the body actually responds to energy balance.

---

## ✨ Features

### 🍽️ Smart Calorie Tracking
- Log meals with reusable templates
- Dynamic calorie calculations
- Net calorie tracking (consumed vs burned)

### 🏃 Workout Integration
- Log workouts with custom calorie burn
- Compare against minimum daily burn targets

### 💧 Hydration System
- Interactive 6-drop tracker (0.5L each → 3L total)
- Real-time feedback:
  - Keep going 💧
  - Almost there ⚡
  - Fully hydrated 💪

### 🔥 Streak Logic (Behavior-Driven)
A streak is counted **ONLY IF**:
- 🍽️ Calories ≤ daily target  
- 🏃 Burn ≥ minimum required  

Else:
- ❌ Streak breaks  
- ➕ Plan duration extends  

👉 Focus: **consistency, not partial credit**

---

### 📅 Time Navigation
- Move across days seamlessly
- View historical logs with recalculated state

---

### 📊 Visual Dashboard
- Circular calorie progress ring
- Macro distribution bars
- Color-coded feedback system (green/red logic)

---

## 🛠 Tech Stack

- **Frontend:** Angular
- **State Management:** Services + BehaviorSubject
- **Styling:** Custom CSS (dark UI, responsive)
- **Architecture:** Component-driven + modular services

---

## 🎯 Key Engineering Concepts

- Derived state (caloriesRemaining, extra burn logic)
- Reactive UI updates across components
- End-of-day evaluation system
- Constraint-based logic (binary success conditions)
- UX-driven state visualization

---

## 🚀 Getting Started

```bash
git clone https://github.com/your-username/calorimeter.git
cd calorimeter
npm install
ng serve