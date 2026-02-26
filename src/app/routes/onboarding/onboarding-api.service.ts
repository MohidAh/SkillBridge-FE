import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, of } from 'rxjs';

// ──────────────────────────────────────────────────────────
// ✅ Drop in real BE URLs here when backend is ready.
//    Everything else in the app will automatically use them.
// ──────────────────────────────────────────────────────────
const API = {
  register: '/auth/register',
  personalInfo: '/user/profile',
  academicInfo: '/user/academic',
  skills: '/user/skills',
  assessment: '/user/assessment',
};

export interface RegistrationPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface PersonalInfoPayload {
  dateOfBirth: string;
  gender: string;
  phone: string;
  country: string;
  city: string;
  bio: string;
}

export interface DegreeEntry {
  institution: string;
  degree: string;
  startYear: string;
  endYear: string; // empty string = In Progress
  major: string;
  degreeFileUrl?: string; // populated when BE is ready
}

export interface AcademicInfoPayload {
  degrees: DegreeEntry[];
}

export interface SkillsPayload {
  skills: string[];
  careerInterests: string[];
  courseSkills: string[];
}

export interface AssessmentPayload {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  answers: number[];
}

@Injectable({ providedIn: 'root' })
export class OnboardingApiService {
  private readonly http = inject(HttpClient);

  submitRegistration(data: RegistrationPayload) {
    return this.http.post(API.register, data).pipe(
      catchError(err => {
        console.warn('[OnboardingAPI] Registration endpoint not yet live:', err.status);
        return of(null);
      })
    );
  }

  savePersonalInfo(data: PersonalInfoPayload) {
    return this.http.put(API.personalInfo, data).pipe(
      catchError(err => {
        console.warn('[OnboardingAPI] Personal info endpoint not yet live:', err.status);
        return of(null);
      })
    );
  }

  saveAcademicInfo(data: AcademicInfoPayload) {
    return this.http.put(API.academicInfo, data).pipe(
      catchError(err => {
        console.warn('[OnboardingAPI] Academic info endpoint not yet live:', err.status);
        return of(null);
      })
    );
  }

  saveSkills(data: SkillsPayload) {
    return this.http.put(API.skills, data).pipe(
      catchError(err => {
        console.warn('[OnboardingAPI] Skills endpoint not yet live:', err.status);
        return of(null);
      })
    );
  }

  submitAssessment(data: AssessmentPayload) {
    return this.http.post(API.assessment, data).pipe(
      catchError(err => {
        console.warn('[OnboardingAPI] Assessment endpoint not yet live:', err.status);
        return of(null);
      })
    );
  }
}
