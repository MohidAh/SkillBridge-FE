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
  educationLevel: string;
  phone: string;
  country: string;
  city: string;
  bio: string;
}

export interface DegreeEntry {
  type: 'high_school' | 'university';

  // High School Fields
  educationSystem?: string;
  subjects?: string;
  grades?: string;

  // University Fields
  institution?: string;
  degree?: string;
  yearBatch?: string; // <-- Changed from startYear / endYear
  major?: string;
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
    return this.http.post<RegistrationPayload>(API.register, data);
  }

  savePersonalInfo(data: PersonalInfoPayload) {
    return this.http.put<PersonalInfoPayload>(API.personalInfo, data);
  }

  saveAcademicInfo(data: AcademicInfoPayload) {
    return this.http.put<AcademicInfoPayload>(API.academicInfo, data);
  }

  saveSkills(data: SkillsPayload) {
    return this.http.put<SkillsPayload>(API.skills, data);
  }

  submitAssessment(data: AssessmentPayload) {
    return this.http.post<AssessmentPayload>(API.assessment, data);
  }

  getInstitutions() {
    // 🔌 Mock implementation until BE is ready
    return of([
      'FAST-NUCES',
      'LUMS',
      'NUST',
      'IBA',
      'NED University',
      'COMSATS',
      'Sir Syed University of Engineering and Technology',
      'Other',
    ]);
  }

  getDegrees(institution: string) {
    // 🔌 Mock implementation until BE is ready
    // You can populate this conditionally based on institution if needed.
    return of([
      'BS Computer Science',
      'BS Software Engineering',
      'BS Computer Engineering',
      'BBA',
      'MBA',
      'MS Computer Science',
      'PhD Computer Science',
      'Other',
    ]);
  }
}
