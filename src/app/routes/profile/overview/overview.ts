import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core';
import { HotToastService } from '@ngxpert/hot-toast';
import { OnboardingApiService, PreferenceRecord } from '../../onboarding/onboarding-api.service';
import { Gender } from '@shared/enums/gender.enums';
import { EducationLevel } from '@shared/enums/education-level.enums';

@Component({
  selector: 'app-profile-overview',
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, DatePipe],
})
export class ProfileOverview implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(HotToastService);

  user = toSignal(this.auth.user());
  isLoading = signal(true);
  personalInfo = signal<any>(null);
  preferences = signal<PreferenceRecord | null>(null);

  // Icon mapping for interests
  private readonly interestIcons: Record<string, string> = {
    'Technology': 'devices',
    'Healthcare': 'medical_services',
    'Design': 'palette',
    'Education': 'school',
    'Finance': 'leaderboard',
    'Arts & Design': 'palette',
    'Business & Finance': 'leaderboard',
    'Law & Policy': 'gavel',
    'Environment': 'eco',
    'Science & Research': 'science',
    'Marketing': 'campaign',
    'Social Work': 'group',
  };

  get genderLabel(): string {
    const g = this.personalInfo()?.gender;
    if (!g) return '';
    return Gender[g] || 'Other';
  }

  get educationLevelLabel(): string {
    const e = this.personalInfo()?.educationLevel;
    if (!e) return '';
    return EducationLevel[e] || 'Other';
  }

  get hasSkills(): boolean {
    const p = this.preferences();
    return !!(p?.skills?.length || p?.careerInterests?.length || p?.courseSkills?.length);
  }

  get displayInterests() {
    return (this.preferences()?.careerInterests || []).map(i => ({
      name: i.name,
      icon: this.interestIcons[i.name] || 'stars',
    }));
  }

  ngOnInit() {
    this.refreshData();
  }

  private refreshData() {
    this.isLoading.set(true);

    this.api.getPersonalInfo().subscribe({
      next: res => {
        if (res.status === 'success') {
          const u = this.user();
          this.personalInfo.set({
            ...res.data,
            name: u?.name || '',
            email: u?.email || '',
          });
        } else {
          this.toast.error(res.message || 'Failed to load personal info');
        }
      },
      error: () => this.isLoading.set(false),
    });

    this.api.getPreferences().subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.status === 'success') {
          this.preferences.set(res.data);
        } else {
          this.toast.error(res.message || 'Failed to load preferences');
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  goToOnboarding() {
    this.router.navigateByUrl('/onboarding');
  }
}
