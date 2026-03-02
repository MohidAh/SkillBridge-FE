import { Component, DestroyRef, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PersonalInfoPayload } from '../../onboarding-api.service';
import { OnboardingService } from '../../onboarding.service';
import { ApiInterface, PersonalInfo } from '@core/authentication/interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';
import { ApiClientService } from '@shared/services/api-client.service';
import { catchError, of, finalize } from 'rxjs';
import { EducationLevel } from '@shared/enums/eduLevel.enums';
import { TokenService } from '@core/authentication/token.service';

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
  private readonly http = inject(ApiClientService);
  private readonly toast = inject(HotToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  isSubmitting = signal<boolean>(false);

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

  readonly educationLevels = [
    { value: EducationLevel.HighSchool, label: 'High School' },
    { value: EducationLevel.University, label: 'University' },
    { value: EducationLevel.Graduate, label: 'Graduate' },
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
    const saved = this.onboarding.snapshot.personalInfo;
    if (saved) this.form.patchValue(saved);
  }

  submit(): void {
    const Token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYTgzNTBjYS03OTM4LTQ1YWMtYjM2Ny1jNzAzYzkyODdlOTUiLCJlbWFpbCI6InVuaS5zdHVkZW50KzFAZXhhbXBsZS5jb20iLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImZhODM1MGNhLTc5MzgtNDVhYy1iMzY3LWM3MDNjOTI4N2U5NSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IlVuaXZlcnNpdHlTdHVkZW50IiwiZnVsbE5hbWUiOiJVcGRhdGVkIE5hbWUiLCJqdGkiOiI3OTYzNzgwNS1jNmRhLTRmMzgtYmY5Ni1iMGJmY2U3ODcyNWEiLCJleHAiOjE3NzI0MDYzNzgsImlzcyI6IlNraWxsQnJpZGdlIiwiYXVkIjoiU2tpbGxCcmlkZ2VVc2VycyJ9.Z7QQfZbwq3iVHET1uT6UDGJ4H-3d1pJ9E6OlCToVQZw';

    this.tokenService.set({
      access_token: Token,
      expires_in: 30000,
      token_type: 'Bearer',
    });

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      ...this.form.getRawValue(),
      bio: this.form.value.bio || '',
    };

    this.http
      .post<ApiInterface<PersonalInfo>>('profile/personal', payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        catchError(err => {
          console.error('Profile completion failed', err);

          this.toast.error(err?.error?.message || 'Something went wrong. Please try again.');

          // Fallback response
          return of<ApiInterface<null>>({
            status: 'error',
            message: err?.error?.message || 'Request failed',
            data: null,
            errorCode: err?.error?.errorCode ?? -1,
          });
        }),

        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe(res => {
        if (res.status === 'success') {
          localStorage.setItem('profileComplete', 'true');

          this.toast.success(res.message || 'Profile completed successfully!');

          this.router.navigate(['/dashboard']);
          return;
        }
      });

    // Fallback for now (backend not integrated): save locally and advance
    this.onboarding.savePersonalInfo(payload);
    this.saved.emit(payload);
    this.onboarding.nextStep();
  }
}
