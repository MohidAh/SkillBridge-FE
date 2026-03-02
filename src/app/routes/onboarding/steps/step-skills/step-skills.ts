import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import {
  LookupItem,
  OnboardingApiService,
  UpdatePreferencePayload,
} from '../../onboarding-api.service';
import { OnboardingService } from '../../onboarding.service';
import { CommonModule } from '@angular/common';

import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-step-skills',
  templateUrl: './step-skills.html',
  styleUrl: './step-skills.scss',
  imports: [CommonModule, FormsModule, MatButtonModule, MatChipsModule, MatIconModule],
})
export class StepSkills implements OnInit {
  @Output() saved = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private readonly onboarding = inject(OnboardingService);
  private readonly api = inject(OnboardingApiService);
  private readonly toast = inject(HotToastService);

  allSkills: LookupItem[] = [];
  allInterests: LookupItem[] = [];

  selectedSkillIds = new Set<string>();
  selectedInterestIds = new Set<string>();
  courseSkills: string[] = [];
  courseInput = '';

  isLoading = false;
  isSaving = false;

  // Icon mapping for common interests
  private readonly interestIcons: Record<string, string> = {
    'Technology': '💻',
    'Business & Finance': '📊',
    'Healthcare': '🏥',
    'Arts & Design': '🎨',
    'Law & Policy': '⚖️',
    'Environment': '🌿',
    'Education': '🎓',
    'Science & Research': '🔬',
    'Marketing': '📣',
    'Social Work': '🤝',
  };

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.isLoading = true;

    // Load available lookups
    this.api.getSkills().subscribe(res => {
      if (res.status === 'success') {
        this.allSkills = res.data ?? [];
      }
    });

    this.api.getCareerInterests().subscribe(res => {
      if (res.status === 'success') {
        this.allInterests = res.data ?? [];
      }
    });

    // Load current preferences
    this.api.getPreferences().subscribe({
      next: res => {
        this.isLoading = false;
        if (res.status === 'success' && res.data) {
          const d = res.data;
          this.selectedSkillIds = new Set(d.skills.map(s => s.id));
          this.selectedInterestIds = new Set(d.careerInterests.map(i => i.id));
          this.courseSkills = [...(d.courseSkills ?? [])];
        } else if (res.status !== 'success') {
          this.toast.error(res.message || 'Failed to load preferences');
        }
      },
      error: () => (this.isLoading = false),
    });
  }

  getInterestIcon(name: string): string {
    return this.interestIcons[name] || '🎯';
  }

  toggleSkill(id: string) {
    this.selectedSkillIds.has(id)
      ? this.selectedSkillIds.delete(id)
      : this.selectedSkillIds.add(id);
  }

  toggleInterest(id: string) {
    this.selectedInterestIds.has(id)
      ? this.selectedInterestIds.delete(id)
      : this.selectedInterestIds.add(id);
  }

  addCourseSkill(value: string) {
    const v = value.trim();
    if (v && !this.courseSkills.includes(v)) this.courseSkills.push(v);
    this.courseInput = '';
  }

  removeCourseSkill(skill: string) {
    this.courseSkills = this.courseSkills.filter(s => s !== skill);
  }

  submit() {
    this.save();
  }

  skip() {
    this.selectedSkillIds.clear();
    this.selectedInterestIds.clear();
    this.courseSkills = [];
    this.save();
  }

  private save() {
    this.isSaving = true;
    const payload: UpdatePreferencePayload = {
      skillIds: Array.from(this.selectedSkillIds),
      careerInterestIds: Array.from(this.selectedInterestIds),
      courseSkills: this.courseSkills,
    };

    this.api.updatePreferences(payload).subscribe({
      next: res => {
        this.isSaving = false;
        if (res.status === 'success') {
          this.toast.success('Preferences saved successfully');
          this.saved.emit();
        } else {
          this.toast.error(res.message || 'Failed to save preferences');
        }
      },
      error: () => (this.isSaving = false),
    });
  }
}
