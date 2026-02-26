import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { OnboardingService } from '../onboarding.service';
import { StepPersonal } from '../steps/step-personal/step-personal';
import { StepAcademic } from '../steps/step-academic/step-academic';
import { StepSkills } from '../steps/step-skills/step-skills';
import { StepPsychology } from '../steps/step-psychology/step-psychology';

@Component({
  selector: 'app-onboarding-wizard',
  templateUrl: './onboarding-wizard.html',
  styleUrl: './onboarding-wizard.scss',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    StepPersonal,
    StepAcademic,
    StepSkills,
    StepPsychology,
  ],
})
export class OnboardingWizard implements OnInit {
  protected readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  currentStep = signal(0);

  readonly steps = [
    { label: 'Personal Info', icon: 'person', description: 'Tell us about yourself' },
    { label: 'Academics', icon: 'school', description: 'Your educational background' },
    { label: 'Skills & Interests', icon: 'auto_awesome', description: 'What you know and love' },
    { label: 'Personality', icon: 'psychology', description: 'Discover your traits' },
  ];

  ngOnInit() {
    this.onboarding.state.subscribe(s => this.currentStep.set(s.currentStep));
  }

  onPersonalSaved(data: any) {
    this.onboarding.savePersonalInfo(data);
    this.onboarding.nextStep();
  }

  onAcademicSaved(data: any) {
    this.onboarding.saveAcademicInfo(data);
    this.onboarding.nextStep();
  }

  onSkillsSaved(data: any) {
    this.onboarding.saveSkills(data);
    this.onboarding.nextStep();
  }

  onAssessmentSaved(data: any) {
    this.onboarding.saveAssessment(data);
    this.onboarding.markProfileComplete();
    this.router.navigateByUrl('/dashboard');
  }

  goBack() {
    this.onboarding.prevStep();
  }
}
