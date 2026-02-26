import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AcademicInfoPayload, DegreeEntry } from '../../onboarding-api.service';
import { OnboardingService } from '../../onboarding.service';

@Component({
  selector: 'app-step-academic',
  templateUrl: './step-academic.html',
  styleUrl: './step-academic.scss',
  imports: [
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

  readonly degreeTypes = [
    'High School Diploma',
    'Associate Degree',
    "Bachelor's Degree",
    "Master's Degree",
    'PhD / Doctorate',
    'Postdoctoral',
    'Diploma / Certificate',
    'Other',
  ];

  readonly years = this.buildYearList();

  /** List of complete, saved degree entries */
  degrees: DegreeEntry[] = [];

  /** Inline "add degree" form */
  degreeForm = this.fb.nonNullable.group({
    institution: ['', Validators.required],
    degree: ['', Validators.required],
    startYear: ['', Validators.required],
    endYear: [''], // empty = in progress
    major: ['', Validators.required],
  });

  /** File selected for upload */
  selectedFile: File | null = null;

  showDegreeForm = false;
  editingIndex = -1; // -1 = adding new; >=0 = editing existing

  ngOnInit() {
    const saved = this.onboarding.snapshot.academicInfo;
    if (saved?.degrees?.length) {
      this.degrees = [...saved.degrees];
    } else {
      // Show form immediately on first visit
      this.showDegreeForm = true;
    }
  }

  private buildYearList(): string[] {
    const current = new Date().getFullYear();
    return Array.from({ length: 50 }, (_, i) => String(current - i));
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
    this.degreeForm.setValue({
      institution: d.institution,
      degree: d.degree,
      startYear: d.startYear,
      endYear: d.endYear,
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
    const entry: DegreeEntry = { ...v };
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
