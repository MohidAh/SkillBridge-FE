import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { SettingsService } from '@core';
import { MtxAlertModule } from '@ng-matero/extensions/alert';
import { NgStyle } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core';
import { Router } from '@angular/router';
import { RECOMMENDED_CAREERS, Career } from './data';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatListModule,
    MatGridListModule,
    MatTableModule,
    MatTabsModule,
    MatIconModule,
    MtxAlertModule,
    NgStyle,
  ],
})
export class Dashboard implements OnInit {
  private readonly settings = inject(SettingsService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  user = toSignal(this.auth.user());
  isLoading = signal(true);

  get careers(): Career[] {
    const u = this.user();
    // For demonstration, if user has career interests, show actual recommendations
    // Otherwise return empty array which triggers the empty state in template
    return u?.['careerInterests']?.length ? RECOMMENDED_CAREERS : [];
  }

  get userData() {
    const u = this.user();
    return {
      name: u?.name || 'User',
      greeting: 'Welcome back',
      subtitle: 'Here are your recommended career paths based on your profile.',
    };
  }

  get personalityTraits() {
    const u = this.user();
    const assessment = u?.['assessment'] || {};
    return [
      { name: 'Openness', percentage: assessment.openness || 0, color: '#0f969c' },
      {
        name: 'Conscientiousness',
        percentage: assessment.conscientiousness || 0,
        color: '#6da5c0',
      },
      { name: 'Extraversion', percentage: assessment.extraversion || 0, color: '#294d61' },
      { name: 'Agreeableness', percentage: assessment.agreeableness || 0, color: '#0c7075' },
      { name: 'Neuroticism', percentage: assessment.neuroticism || 0, color: '#ef4444' },
    ];
  }

  get hasAssessment() {
    return this.personalityTraits.some(t => t.percentage > 0);
  }

  get isDark() {
    return this.settings.getThemeColor() == 'dark';
  }

  ngOnInit() {
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1200);
  }

  goToOnboarding() {
    this.router.navigateByUrl('/onboarding');
  }
}
