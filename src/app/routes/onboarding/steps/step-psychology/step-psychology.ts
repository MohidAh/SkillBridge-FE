import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { AssessmentPayload } from '../../onboarding-api.service';
import { OnboardingService } from '../../onboarding.service';

interface BigFiveQuestion {
  id: number;
  text: string;
  trait: keyof TraitScores;
  reversed: boolean;
}

interface TraitScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

const QUESTIONS: BigFiveQuestion[] = [
  // Openness
  {
    id: 1,
    text: 'I enjoy exploring new ideas and being creative.',
    trait: 'openness',
    reversed: false,
  },
  { id: 2, text: 'I have a vivid imagination.', trait: 'openness', reversed: false },
  { id: 3, text: 'I am not interested in abstract ideas.', trait: 'openness', reversed: true },
  {
    id: 4,
    text: 'I enjoy experiencing different cultures and art forms.',
    trait: 'openness',
    reversed: false,
  },
  // Conscientiousness
  {
    id: 5,
    text: 'I keep my belongings neat and in order.',
    trait: 'conscientiousness',
    reversed: false,
  },
  {
    id: 6,
    text: 'I follow a schedule and plan ahead.',
    trait: 'conscientiousness',
    reversed: false,
  },
  {
    id: 7,
    text: 'I often leave things to the last minute.',
    trait: 'conscientiousness',
    reversed: true,
  },
  {
    id: 8,
    text: 'I pay attention to details and avoid mistakes.',
    trait: 'conscientiousness',
    reversed: false,
  },
  // Extraversion
  {
    id: 9,
    text: 'I feel energized when I am around other people.',
    trait: 'extraversion',
    reversed: false,
  },
  {
    id: 10,
    text: 'I enjoy being the center of attention.',
    trait: 'extraversion',
    reversed: false,
  },
  {
    id: 11,
    text: 'I prefer spending time alone rather than with large groups.',
    trait: 'extraversion',
    reversed: true,
  },
  {
    id: 12,
    text: 'I easily strike up conversations with strangers.',
    trait: 'extraversion',
    reversed: false,
  },
  // Agreeableness
  {
    id: 13,
    text: 'I find it easy to empathize with others.',
    trait: 'agreeableness',
    reversed: false,
  },
  { id: 14, text: 'I tend to trust people.', trait: 'agreeableness', reversed: false },
  { id: 15, text: 'I can be cold and uncaring to others.', trait: 'agreeableness', reversed: true },
  {
    id: 16,
    text: 'I try to help others when they are in need.',
    trait: 'agreeableness',
    reversed: false,
  },
  // Neuroticism
  { id: 17, text: 'I often feel anxious or stressed.', trait: 'neuroticism', reversed: false },
  { id: 18, text: 'My mood changes frequently.', trait: 'neuroticism', reversed: false },
  { id: 19, text: 'I rarely feel sad or depressed.', trait: 'neuroticism', reversed: true },
  { id: 20, text: 'I get upset easily under pressure.', trait: 'neuroticism', reversed: false },
];

const TRAIT_META: Record<
  keyof TraitScores,
  { label: string; icon: string; color: string; desc: string }
> = {
  openness: { label: 'Openness', icon: '🌍', color: '#0f969c', desc: 'Curiosity & creativity' },
  conscientiousness: {
    label: 'Conscientiousness',
    icon: '📋',
    color: '#294d61',
    desc: 'Discipline & organization',
  },
  extraversion: {
    label: 'Extraversion',
    icon: '🎉',
    color: '#6da5c0',
    desc: 'Sociability & energy',
  },
  agreeableness: {
    label: 'Agreeableness',
    icon: '🤝',
    color: '#0c7075',
    desc: 'Compassion & cooperation',
  },
  neuroticism: {
    label: 'Neuroticism',
    icon: '🌊',
    color: '#072e33',
    desc: 'Emotional sensitivity',
  },
};

@Component({
  selector: 'app-step-psychology',
  templateUrl: './step-psychology.html',
  styleUrl: './step-psychology.scss',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSliderModule, FormsModule],
})
export class StepPsychology implements OnInit {
  @Output() saved = new EventEmitter<AssessmentPayload>();
  @Output() back = new EventEmitter<void>();

  private readonly onboarding = inject(OnboardingService);

  readonly questions = QUESTIONS;
  readonly traitMeta = TRAIT_META;
  readonly traits = Object.keys(TRAIT_META) as (keyof TraitScores)[];

  answers: Record<number, number> = {};
  showResults = false;
  traitScores: TraitScores = {
    openness: 0,
    conscientiousness: 0,
    extraversion: 0,
    agreeableness: 0,
    neuroticism: 0,
  };

  ngOnInit() {
    // Restore previous answers on back navigation
    const saved = this.onboarding.snapshot.assessment;
    if (saved?.answers?.length) {
      this.questions.forEach((q, i) => {
        if (saved.answers[i] !== undefined) {
          this.answers[q.id] = saved.answers[i];
        }
      });
    }
  }

  get answeredCount() {
    return Object.keys(this.answers).length;
  }

  get allAnswered() {
    return this.answeredCount === this.questions.length;
  }

  get progress() {
    return Math.round((this.answeredCount / this.questions.length) * 100);
  }

  setAnswer(questionId: number, value: number) {
    this.answers[questionId] = value;
  }

  computeScores(): TraitScores {
    const sums: TraitScores = {
      openness: 0,
      conscientiousness: 0,
      extraversion: 0,
      agreeableness: 0,
      neuroticism: 0,
    };
    const counts: Partial<Record<keyof TraitScores, number>> = {};

    for (const q of this.questions) {
      const raw = this.answers[q.id] ?? 3;
      const score = q.reversed ? 6 - raw : raw;
      sums[q.trait] = (sums[q.trait] || 0) + score;
      counts[q.trait] = (counts[q.trait] || 0) + 1;
    }

    return {
      openness: Math.round((sums.openness / (counts.openness || 1)) * 20),
      conscientiousness: Math.round(
        (sums.conscientiousness / (counts.conscientiousness || 1)) * 20
      ),
      extraversion: Math.round((sums.extraversion / (counts.extraversion || 1)) * 20),
      agreeableness: Math.round((sums.agreeableness / (counts.agreeableness || 1)) * 20),
      neuroticism: Math.round((sums.neuroticism / (counts.neuroticism || 1)) * 20),
    };
  }

  calculate() {
    if (!this.allAnswered) return;
    this.traitScores = this.computeScores();
    this.showResults = true;
  }

  submit() {
    this.saved.emit({
      ...this.traitScores,
      answers: this.questions.map(q => this.answers[q.id] ?? 3),
    });
  }
}
