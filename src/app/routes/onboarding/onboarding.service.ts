import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  OnboardingApiService,
  PersonalInfoPayload,
  AcademicInfoPayload,
  SkillsPayload,
  AssessmentPayload,
} from './onboarding-api.service';
import { AuthService } from '@core/authentication/auth.service';

export interface OnboardingState {
  currentStep: number;
  personalInfo: PersonalInfoPayload | null;
  academicInfo: AcademicInfoPayload | null;
  skills: SkillsPayload | null;
  assessment: AssessmentPayload | null;
}

const INITIAL_STATE: OnboardingState = {
  currentStep: 0,
  personalInfo: null,
  academicInfo: null,
  skills: null,
  assessment: null,
};

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthService);
  private state$ = new BehaviorSubject<OnboardingState>(INITIAL_STATE);

  get state() {
    return this.state$.asObservable();
  }

  get snapshot() {
    return this.state$.getValue();
  }

  get currentStep() {
    return this.snapshot.currentStep;
  }

  nextStep() {
    const s = this.snapshot;
    this.state$.next({ ...s, currentStep: s.currentStep + 1 });
  }

  prevStep() {
    const s = this.snapshot;
    if (s.currentStep > 0) {
      this.state$.next({ ...s, currentStep: s.currentStep - 1 });
    }
  }

  savePersonalInfo(data: PersonalInfoPayload) {
    this.state$.next({ ...this.snapshot, personalInfo: data });

    const currentUser = this.auth.getUserSnapshot();
    const updatedUser = { ...currentUser, ...data };

    this.auth.setUser(updatedUser);
  }

  saveAcademicInfo(data: AcademicInfoPayload) {
    this.state$.next({ ...this.snapshot, academicInfo: data });

    const currentUser = this.auth.getUserSnapshot();
    const updatedUser = { ...currentUser, ...data };

    this.auth.setUser(updatedUser);
  }

  saveSkills(data: SkillsPayload) {
    this.state$.next({ ...this.snapshot, skills: data });

    const currentUser = this.auth.getUserSnapshot();
    const updatedUser = { ...currentUser, ...data };

    this.auth.setUser(updatedUser);
  }

  saveAssessment(data: AssessmentPayload) {
    this.state$.next({ ...this.snapshot, assessment: data });

    const currentUser = this.auth.getUserSnapshot();
    const updatedUser = { ...currentUser, assessment: data };

    this.auth.setUser(updatedUser);
  }

  markProfileComplete() {
    localStorage.setItem('profileComplete', 'true');
  }

  reset() {
    localStorage.removeItem('profileComplete');
    this.state$.next(INITIAL_STATE);
  }
}
