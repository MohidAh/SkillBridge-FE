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
import {
  OnboardingApiService,
  PreferenceRecord,
  PersonalityResult,
} from '../../onboarding/onboarding-api.service';
import { Gender } from '@shared/enums/gender.enums';
import { EducationLevel } from '@shared/enums/education-level.enums';

interface TraitDisplay {
  label: string;
  icon: string;
  color: string;
  key: keyof PersonalityResult;
  desc: string;
}

const TRAIT_CONFIG: TraitDisplay[] = [
  {
    label: 'Openness',
    icon: '🌍',
    color: '#0f969c',
    key: 'opennessPercent',
    desc: 'Curiosity & creativity',
  },
  {
    label: 'Conscientiousness',
    icon: '📋',
    color: '#294d61',
    key: 'conscientiousnessPercent',
    desc: 'Discipline & organization',
  },
  {
    label: 'Extraversion',
    icon: '🎉',
    color: '#6da5c0',
    key: 'extraversionPercent',
    desc: 'Sociability & energy',
  },
  {
    label: 'Agreeableness',
    icon: '🤝',
    color: '#0c7075',
    key: 'agreeablenessPercent',
    desc: 'Compassion & cooperation',
  },
  {
    label: 'Neuroticism',
    icon: '🌊',
    color: '#072e33',
    key: 'neuroticismPercent',
    desc: 'Emotional sensitivity',
  },
];

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
  personalityResult = signal<PersonalityResult | null>(null);

  traitConfig = TRAIT_CONFIG;

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

  get displayInterests() {
    return (this.preferences()?.careerInterests || []).map(i => ({
      name: i.name,
      icon: this.interestIcons[i.name] || 'stars',
    }));
  }

  get hasPersonality(): boolean {
    return !!this.personalityResult();
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
        }
      },
    });

    this.api.getPreferences().subscribe({
      next: res => {
        if (res.status === 'success') {
          this.preferences.set(res.data);
        }
      },
    });

    this.api.getPersonalityResult().subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res.status === 'success') {
          this.personalityResult.set(res.data);
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  goToOnboarding() {
    this.router.navigateByUrl('/onboarding');
  }
}
