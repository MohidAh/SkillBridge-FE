import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { MtxButtonModule } from '@ng-matero/extensions/button';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, filter, finalize } from 'rxjs/operators';

import { ApiInterface, AuthResponse, AuthService, TokenService } from '@core/authentication';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';
import { of } from 'rxjs';
import { ApiClientService } from '@shared/services/api-client.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MtxButtonModule,
    TranslateModule,
  ],
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly http = inject(ApiClientService);
  private readonly toast = inject(HotToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tokenService = inject(TokenService);

  isSubmitting = signal<boolean>(false);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  get email() {
    return this.loginForm.get('email')!;
  }
  get password() {
    return this.loginForm.get('password')!;
  }
  get rememberMe() {
    return this.loginForm.get('rememberMe')!;
  }

  login(): void {
    if (!this.email.value || !this.password.value) return;

    this.isSubmitting.set(true);

    this.http
      .post<ApiInterface<AuthResponse>>('auth/login', {
        email: this.email.value,
        password: this.password.value,
        rememberMe: this.rememberMe.value,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        catchError(err => {
          this.toast.error(err?.error?.message || 'Login failed. Please try again.');

          return of<ApiInterface<AuthResponse>>({
            status: 'error',
            message: err?.error?.message || 'Login failed',
            data: null as unknown as AuthResponse,
            errorCode: err?.error?.errorCode ?? -1,
          });
        }),

        finalize(() => {
          this.isSubmitting.set(false);
        })
      )
      .subscribe(res => {
        if (res.status !== 'success' || !res.data) return;

        // this.persistAuth(res.data, this.rememberMe.value);

        localStorage.setItem('user', JSON.stringify(res.data.user));
        this.tokenService.set({
          access_token: res.data.token, // must match backend property
          // refresh_token: res.data.expiresInMinutes, // if provided
          expires_in: res.data.expiresInMinutes, // required for expiration logic
          token_type: 'Bearer',
        });
        this.toast.success('Login successful!');
        this.router.navigate(['/dashboard']);
      });
  }
}
