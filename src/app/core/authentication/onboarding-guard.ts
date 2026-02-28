import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard that redirects authenticated users with incomplete profiles to /onboarding.
 * Re-used on protected routes inside AdminLayout.
 */
export const onboardingGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.check()) {
    return router.parseUrl('/auth/login');
  }

  // Check localStorage flag first (set by OnboardingService on completion)
  const profileComplete = localStorage.getItem('profileComplete');
  if (profileComplete === 'true') {
    return true;
  }

  // Redirect to onboarding wizard
  return router.parseUrl('/onboarding');
};
