import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PersonalInfoPayload } from '../../onboarding-api.service';
import { OnboardingService } from '../../onboarding.service';

@Component({
  selector: 'app-step-personal',
  templateUrl: './step-personal.html',
  styleUrl: './step-personal.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class StepPersonal implements OnInit {
  @Output() saved = new EventEmitter<PersonalInfoPayload>();

  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(OnboardingService);

  form = this.fb.nonNullable.group({
    dateOfBirth: ['', Validators.required],
    gender: ['', Validators.required],
    educationLevel: ['', Validators.required],
    phone: ['', Validators.required],
    country: ['', Validators.required],
    city: ['', Validators.required],
    bio: [''],
  });

  readonly genders = ['Male', 'Female', 'Prefer not to say'];
  readonly educationLevels = ['High School', 'University', 'Graduate'];

  readonly countries = [
    'Pakistan',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'India',
    'Germany',
    'UAE',
    'Saudi Arabia',
    'Other',
  ];

  ngOnInit() {
    const saved = this.onboarding.snapshot.personalInfo;
    if (saved) this.form.patchValue(saved);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.getRawValue());
  }
}
