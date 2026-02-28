import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { inject } from '@angular/core';
import { SkillsPayload } from '../../onboarding-api.service';
import { OnboardingService } from '../../onboarding.service';

const PREDEFINED_SKILLS = [
  'Python',
  'JavaScript',
  'Java',
  'C++',
  'Data Analysis',
  'Machine Learning',
  'Web Development',
  'SQL',
  'Excel',
  'Project Management',
  'Communication',
  'Problem Solving',
  'UI/UX Design',
  'Photoshop',
  'Research',
  'Public Speaking',
  'Statistics',
  'Networking',
  'Cybersecurity',
  'Cloud Computing',
];

const CAREER_INTERESTS = [
  { icon: '💻', label: 'Technology' },
  { icon: '📊', label: 'Business & Finance' },
  { icon: '🏥', label: 'Healthcare' },
  { icon: '🎨', label: 'Arts & Design' },
  { icon: '⚖️', label: 'Law & Policy' },
  { icon: '🌿', label: 'Environment' },
  { icon: '🎓', label: 'Education' },
  { icon: '🔬', label: 'Science & Research' },
  { icon: '📣', label: 'Marketing' },
  { icon: '🤝', label: 'Social Work' },
];

@Component({
  selector: 'app-step-skills',
  templateUrl: './step-skills.html',
  styleUrl: './step-skills.scss',
  imports: [FormsModule, MatButtonModule, MatChipsModule, MatIconModule],
})
export class StepSkills implements OnInit {
  @Output() saved = new EventEmitter<SkillsPayload>();
  @Output() back = new EventEmitter<void>();

  private readonly onboarding = inject(OnboardingService);

  readonly allSkills = PREDEFINED_SKILLS;
  readonly allInterests = CAREER_INTERESTS;

  selectedSkills = new Set<string>();
  selectedInterests = new Set<string>();
  courseSkills: string[] = [];
  courseInput = '';

  ngOnInit() {
    // Restore previous skill & interest selections on back navigation
    const saved = this.onboarding.snapshot.skills;
    if (saved) {
      this.selectedSkills = new Set(saved.skills);
      this.selectedInterests = new Set(saved.careerInterests);
      this.courseSkills = [...(saved.courseSkills ?? [])];
    }
  }

  toggleSkill(skill: string) {
    this.selectedSkills.has(skill)
      ? this.selectedSkills.delete(skill)
      : this.selectedSkills.add(skill);
  }

  toggleInterest(label: string) {
    this.selectedInterests.has(label)
      ? this.selectedInterests.delete(label)
      : this.selectedInterests.add(label);
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
    this.saved.emit({
      skills: [...this.selectedSkills],
      careerInterests: [...this.selectedInterests],
      courseSkills: this.courseSkills,
    });
  }

  skip() {
    this.saved.emit({
      skills: [],
      careerInterests: [],
      courseSkills: [],
    });
  }
}
