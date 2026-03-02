import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core';
import { HotToastService } from '@ngxpert/hot-toast';
import { OnboardingApiService, PersonalInfoPayload } from '../../onboarding/onboarding-api.service';
import { Gender } from '@shared/enums/gender.enums';
import { EducationLevel } from '@shared/enums/education-level.enums';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
})
export class ProfileSettings implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly api = inject(OnboardingApiService);
  private readonly toast = inject(HotToastService);

  user = toSignal(this.auth.user());
  isSaving = signal(false);

  form = this.fb.nonNullable.group({
    name: [{ value: '', disabled: true }],
    email: [{ value: '', disabled: true }],
    dateOfBirth: ['', [Validators.required]],
    gender: [null as any as number, [Validators.required]],
    educationLevel: [null as any as number, [Validators.required]],
    phoneNumber: ['', [Validators.required]],
    country: ['', [Validators.required]],
    city: ['', [Validators.required]],
    shortBio: [''],
  });

  readonly genders = [
    { label: 'Male', value: Gender.Male },
    { label: 'Female', value: Gender.Female },
    { label: 'Prefer not to say', value: Gender.PreferNotToSay },
  ];

  readonly educationLevels = [
    { label: 'High School', value: EducationLevel.HighSchool },
    { label: 'University', value: EducationLevel.University },
    { label: 'Graduate', value: EducationLevel.Graduate },
    { label: 'Working Professional', value: EducationLevel.WorkingProfessional },
  ];

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
    this.loadProfile();
  }

  private loadProfile() {
    const u = this.user();
    if (u) {
      this.form.patchValue({
        name: u.name || '',
        email: u.email || '',
      });
    }

    this.api.getPersonalInfo().subscribe({
      next: res => {
        if (res.status === 'success' && res.data) {
          this.form.patchValue(res.data);
        } else if (res.status !== 'success') {
          this.toast.error(res.message || 'Failed to load profile');
        }
      },
    });
  }

  save() {
    if (this.form.valid) {
      this.isSaving.set(true);
      const val = this.form.getRawValue();

      const payload: PersonalInfoPayload = {
        dateOfBirth: val.dateOfBirth,
        country: val.country,
        city: val.city,
        phoneNumber: val.phoneNumber,
        gender: val.gender,
        educationLevel: val.educationLevel,
        shortBio: val.shortBio || '',
      };

      this.api.savePersonalInfo(payload).subscribe({
        next: res => {
          this.isSaving.set(false);
          if (res.status === 'success') {
            this.toast.success(res.message || 'Profile updated successfully!');
          } else {
            this.toast.error(res.message || 'Failed to update profile');
          }
        },
        error: () => this.isSaving.set(false),
      });
    }
  }
}
