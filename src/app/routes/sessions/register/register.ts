import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { MtxButtonModule } from '@ng-matero/extensions/button';
import { TranslateModule } from '@ngx-translate/core';
import { OnboardingApiService } from '../../onboarding/onboarding-api.service';
import { ApiClientService } from '@shared/services/api-client.service';
import { ApiInterface, AuthResponse } from '@core/authentication/interface';
import { HotToastService } from '@ngxpert/hot-toast';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, finalize } from 'rxjs';
import { UserRole } from '@shared/enums/user.enums';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrl: './register.scss',
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MtxButtonModule,
    TranslateModule,
  ],
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly onboardingApi = inject(OnboardingApiService);
  private readonly http = inject(ApiClientService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(HotToastService);

  UserRole = UserRole;

  isSubmitting = signal<boolean>(false);

  registerForm = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: [1, [Validators.required]],
    },
    {
      validators: [this.matchValidator('password', 'confirmPassword')],
    }
  );

  get fullName() {
    return this.registerForm.get('fullName')!;
  }
  get email() {
    return this.registerForm.get('email')!;
  }
  get password() {
    return this.registerForm.get('password')!;
  }
  get confirmPassword() {
    return this.registerForm.get('confirmPassword')!;
  }
  get role() {
    return this.registerForm.get('role')!;
  }

  matchValidator(source: string, target: string) {
    return (control: AbstractControl) => {
      const sourceControl = control.get(source)!;
      const targetControl = control.get(target)!;
      if (targetControl.errors && !targetControl.errors['mismatch']) {
        return null;
      }
      if (sourceControl.value !== targetControl.value) {
        targetControl.setErrors({ mismatch: true });
        return { mismatch: true };
      } else {
        targetControl.setErrors(null);
        return null;
      }
    };
  }

  register(): void {
    if (this.registerForm.invalid) return;

    this.isSubmitting.set(true);
    localStorage.setItem('profileComplete', 'false');

    const { fullName, email, password, role } = this.registerForm.getRawValue();

    this.http
      .post<ApiInterface<AuthResponse>>('auth/register', {
        fullName,
        email,
        password,
        role,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        catchError(err => {
          console.error('Registration failed', err);

          this.toast.error(err?.error?.message || 'Registration failed! Please try again.');

          return of<ApiInterface<AuthResponse>>({
            status: 'error',
            message: err?.error?.message || 'Registration failed',
            data: null as unknown as AuthResponse,
            errorCode: err?.error?.errorCode ?? -1,
          });
        }),

        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe(res => {
        if (res.status !== 'success' || !res.data) {
          return;
        }

        this.toast.success(res.message || 'Registration successful! Please log in.');

        this.router.navigate(['/sessions/login']);
      });
  }
}
