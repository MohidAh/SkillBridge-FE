import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import {
  AcademicInfoPayload,
  DegreeEntry,
  OnboardingApiService,
} from '../../onboarding-api.service';
import { OnboardingService } from '../../onboarding.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-academic',
  templateUrl: './step-academic.html',
  styleUrl: './step-academic.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class StepAcademic implements OnInit {
  @Output() saved = new EventEmitter<AcademicInfoPayload>();
  @Output() back = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(OnboardingService);
  private readonly api = inject(OnboardingApiService);

  readonly Object = Object;
  readonly batches = [
    { label: '1st Year', value: 1 },
    { label: '2nd Year', value: 2 },
    { label: '3rd Year', value: 3 },
    { label: '4th Year', value: 4 },
    { label: '5th Year', value: 5 },
    { label: '6th Year', value: 6 },
  ];
  readonly highSchoolYears = [
    { label: '1st Year', value: 1 },
    { label: '2nd Year', value: 2 },
  ];
  readonly educationSystems = ['O Levels', 'A Levels', 'Intermediate', 'Matriculation', 'Other'];

  isHighSchool = false;
  institutions$!: Observable<string[]>;
  degrees$!: Observable<string[]>;

  /** List of complete, saved degree entries */
  degrees: DegreeEntry[] = [];

  /** Inline "add degree" form */
  degreeForm = this.fb.group({
    type: ['university' as 'university' | 'high_school'],

    // High School Fields
    educationSystem: [''],
    subjects: [''],
    grades: [''],

    // University Fields
    institution: [''],
    degree: [''],
    yearBatch: [''],
    major: [''],
  });

  /** File selected for upload */
  selectedFile: File | null = null;

  showDegreeForm = false;
  editingIndex = -1; // -1 = adding new; >=0 = editing existing

  ngOnInit() {
    this.isHighSchool = this.onboarding.snapshot.personalInfo?.educationLevel === 'High School';
    this.setupFormValidators();

    const saved = this.onboarding.snapshot.academicInfo;
    if (saved?.degrees?.length) {
      this.degrees = [...saved.degrees];
    } else {
      // Show form immediately on first visit
      this.showDegreeForm = true;
    }

    this.institutions$ = this.api.getInstitutions();

    // When institution changes, load its optional degrees
    this.degreeForm.get('institution')?.valueChanges.subscribe(inst => {
      if (inst) {
        this.degrees$ = this.api.getDegrees(inst);
        // Clear degree when institution changes, unless we are editing an existing record
        if (this.editingIndex === -1 && this.degreeForm.get('degree')?.value) {
          this.degreeForm.get('degree')?.setValue('');
        }
      } else {
        this.degrees$ = of([]);
      }
    });
  }

  private setupFormValidators() {
    const f = this.degreeForm.controls;

    // Clear all existing validators
    Object.values(f).forEach(ctrl => {
      ctrl.clearValidators();
      ctrl.updateValueAndValidity();
    });

    if (this.isHighSchool) {
      f.type.setValue('high_school');
      f.educationSystem.setValidators(Validators.required);
      f.institution.setValidators(Validators.required);
      f.degree.setValidators(Validators.required);
      f.yearBatch.setValidators(Validators.required);
      f.grades.setValidators(Validators.required);
    } else {
      f.type.setValue('university');
      f.institution.setValidators(Validators.required);
      f.degree.setValidators(Validators.required);
      f.yearBatch.setValidators(Validators.required);
      f.major.setValidators(Validators.required);
    }
  }

  private buildBatchList(): string[] {
    const current = new Date().getFullYear();
    // generate e.g: 2024, 2025, 2026, 2027, 2028, 2029
    return Array.from({ length: 6 }, (_, i) => String(current + i));
  }

  // ── File upload ──────────────────────────────────────────────────────────────
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  triggerFileInput(input: HTMLInputElement) {
    input.click();
  }

  // ── Add / Edit Degree ────────────────────────────────────────────────────────
  openAddDegree() {
    this.degreeForm.reset();
    this.selectedFile = null;
    this.editingIndex = -1;
    this.showDegreeForm = true;
  }

  editDegree(index: number) {
    const d = this.degrees[index];
    this.degreeForm.patchValue({
      type: d.type,
      educationSystem: d.educationSystem,
      subjects: d.subjects,
      grades: d.grades,
      institution: d.institution,
      degree: d.degree,
      yearBatch: d.yearBatch,
      major: d.major,
    });
    this.editingIndex = index;
    this.showDegreeForm = true;
  }

  saveDegree() {
    if (this.degreeForm.invalid) {
      this.degreeForm.markAllAsTouched();
      return;
    }
    const v = this.degreeForm.getRawValue();
    const entry: DegreeEntry = {
      type: this.isHighSchool ? 'high_school' : 'university',
      ...(this.isHighSchool
        ? {
            educationSystem: v.educationSystem || '',
            institution: v.institution || '',
            degree: v.degree || '',
            yearBatch: v.yearBatch || '',
            grades: v.grades || '',
          }
        : {
            institution: v.institution || '',
            degree: v.degree || '',
            yearBatch: v.yearBatch || '',
            major: v.major || '',
          }),
    };

    // File URL would be set by BE; locally just store name for display
    if (this.selectedFile) {
      entry.degreeFileUrl = this.selectedFile.name;
    }

    if (this.editingIndex >= 0) {
      this.degrees[this.editingIndex] = entry;
    } else {
      this.degrees.push(entry);
    }
    this.showDegreeForm = false;
    this.editingIndex = -1;
    this.selectedFile = null;
    this.degreeForm.reset();
  }

  cancelDegreeForm() {
    this.showDegreeForm = false;
    this.editingIndex = -1;
    this.degreeForm.reset();
    this.selectedFile = null;
  }

  removeDegree(index: number) {
    this.degrees.splice(index, 1);
    if (this.degrees.length === 0) this.showDegreeForm = true;
  }

  // ── Submit step ──────────────────────────────────────────────────────────────
  submit() {
    // If the form is open try to save the current draft
    if (this.showDegreeForm && this.degreeForm.dirty) {
      if (this.degreeForm.valid) {
        this.saveDegree();
      } else {
        this.degreeForm.markAllAsTouched();
        return;
      }
    }
    if (this.degrees.length === 0) {
      this.showDegreeForm = true;
      this.degreeForm.markAllAsTouched();
      return;
    }
    this.saved.emit({ degrees: this.degrees });
  }
}
