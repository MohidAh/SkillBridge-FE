import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { NgStyle, DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-overview',
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, NgStyle, DatePipe],
})
export class ProfileOverview implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  user = toSignal(this.auth.user());
  isLoading = signal(true);

  get personalInfo() {
    const u = this.user();
    return {
      name: u?.name || '',
      dob: u?.['dateOfBirth'] || '',
      country: u?.['country'] || '',
      city: u?.['city'] || '',
      phone: u?.['phone'] || '',
      bio: u?.['bio'] || '',
    };
  }

  get skillsInterests() {
    const u = this.user();
    return {
      skills: u?.['skills'] || [],
      interests: (u?.['careerInterests'] || []).map((name: string) => ({
        name,
        icon: this.getInterestIcon(name),
      })),
      courseSkills: u?.['courseSkills'] || [],
    };
  }

  get hasSkills() {
    const s = this.skillsInterests;
    return s.skills.length > 0 || s.interests.length > 0 || s.courseSkills.length > 0;
  }

  get personalityResults() {
    const u = this.user();
    const assessment = u?.['assessment'] || {};
    return [
      { name: 'Openness', percentage: assessment.openness || 0 },
      { name: 'Conscientiousness', percentage: assessment.conscientiousness || 0 },
      { name: 'Extraversion', percentage: assessment.extraversion || 0 },
      { name: 'Agreeableness', percentage: assessment.agreeableness || 0 },
      { name: 'Neuroticism', percentage: assessment.neuroticism || 0 },
    ];
  }

  get hasAssessment() {
    return this.personalityResults.some(t => t.percentage > 0);
  }

  ngOnInit() {
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1200);
  }

  goToOnboarding() {
    this.router.navigateByUrl('/onboarding');
  }

  private getInterestIcon(name: string): string {
    const icons: Record<string, string> = {
      Technology: 'devices',
      Healthcare: 'medical_services',
      Design: 'palette',
      Education: 'school',
      Finance: 'leaderboard',
    };
    return icons[name] || 'star';
  }
}
