import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  OnboardingApiService,
  PersonalInfoPayload,
  AcademicInfoPayload,
  SkillsPayload,
  AssessmentPayload,
} from './onboarding-api.service';

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
    this.api.savePersonalInfo(data).subscribe();
  }

  saveAcademicInfo(data: AcademicInfoPayload) {
    this.state$.next({ ...this.snapshot, academicInfo: data });
    this.api.saveAcademicInfo(data).subscribe();
  }

  saveSkills(data: SkillsPayload) {
    this.state$.next({ ...this.snapshot, skills: data });
    this.api.saveSkills(data).subscribe();
  }

  saveAssessment(data: AssessmentPayload) {
    this.state$.next({ ...this.snapshot, assessment: data });
    this.api.submitAssessment(data).subscribe();
  }

  markProfileComplete() {
    localStorage.setItem('profileComplete', 'true');
  }

  reset() {
    localStorage.removeItem('profileComplete');
    this.state$.next(INITIAL_STATE);
  }
}
