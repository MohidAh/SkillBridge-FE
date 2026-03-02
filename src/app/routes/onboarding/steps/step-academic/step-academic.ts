import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable, map, switchMap, throwError } from 'rxjs';
import {
  AcademicPayload,
  AcademicRecord,
  InstitutionItem,
  OnboardingApiService,
  ProgramItem,
} from '../../onboarding-api.service';
import { OnboardingService } from '../../onboarding.service';
import { CommonModule } from '@angular/common';
import { EducationLevel } from '@shared/enums/education-level.enums';
import { AppErrorDirective } from '@shared/directives/app-error.directive';

import { HotToastService } from '@ngxpert/hot-toast';

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
    AppErrorDirective,
  ],
})
export class StepAcademic implements OnInit {
  @Output() saved = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(OnboardingService);
  private readonly api = inject(OnboardingApiService);
  private readonly toast = inject(HotToastService);

  // Education level from Step 1
  educationLevel = EducationLevel.University;
  get isHighSchool() {
    return this.educationLevel === EducationLevel.HighSchool;
  }

  // Saved records from backend
  primaryAcademic: AcademicRecord | null = null;
  academicHistory: AcademicRecord[] = [];

  // State
  showForm = false;
  editingId: string | null = null;
  isLoading = false;
  isSaving = false;

  // Dropdowns
  institutions: InstitutionItem[] = [];
  programs: ProgramItem[] = [];

  readonly batches = Array.from({ length: 6 }, (_, i) => ({
    label: `${i + 1}${['st', 'nd', 'rd', 'th', 'th', 'th'][i]} Year`,
    value: i + 1,
  }));

  readonly highSchoolYears = [
    { label: '1st Year', value: 1 },
    { label: '2nd Year', value: 2 },
  ];

  /** The main degree form */
  degreeForm = this.fb.nonNullable.group({
    institutionId: ['', Validators.required],
    institutionProgramId: ['', Validators.required],
    batchYear: [0, Validators.required],
    gradeLevel: [null as any as number], // High School only
    major: [''], // University only
  });

  ngOnInit() {
    // Get education level from state saved in Step 1
    const personalInfo = this.onboarding.snapshot.personalInfo;
    if (personalInfo?.educationLevel) {
      this.educationLevel = personalInfo.educationLevel;
    }

    this.setupConditionalValidators();

    // Load existing academic records
    this.isLoading = true;
    this.api.getMyAcademics().subscribe({
      next: res => {
        this.isLoading = false;
        if (res.status === 'success' && res.data) {
          this.primaryAcademic = res.data.primaryAcademic;
          this.academicHistory = res.data.academicHistory ?? [];
        } else if (res.status !== 'success') {
          this.toast.error(res.message || 'Failed to load academic records');
        }
        if (!this.primaryAcademic) {
          this.showForm = true;
        }
      },
      error: () => {
        this.isLoading = false;
        this.showForm = true;
      },
    });

    // Load institutions filtered by education level type
    this.api.getInstitutions(this.educationLevel).subscribe(res => {
      if (res.status === 'success') {
        this.institutions = res.data?.items ?? [];
      }
    });

    this.api.getPrograms(this.educationLevel).subscribe(res => {
      if (res.status === 'success') {
        this.programs = res.data?.items ?? [];
      }
    });
  }

  private setupConditionalValidators() {
    const { gradeLevel, major } = this.degreeForm.controls;
    gradeLevel.clearValidators();
    major.clearValidators();
    if (this.isHighSchool) {
      gradeLevel.setValidators(Validators.required);
    } else {
      major.setValidators(Validators.required);
    }
    gradeLevel.updateValueAndValidity();
    major.updateValueAndValidity();
  }

  openAddForm() {
    this.degreeForm.reset();
    this.editingId = null;
    this.showForm = true;
  }

  editRecord(record: AcademicRecord) {
    this.editingId = record.id;
    this.degreeForm.patchValue({
      institutionId: record.institutionName, // names used as temp until institution lookup API is available
      institutionProgramId: record.programName,
      batchYear: record.batchYear,
      gradeLevel: record?.gradeLevel,
      major: record.major ?? '',
    });
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
    this.degreeForm.reset();
  }

  saveRecord() {
    if (this.degreeForm.invalid) {
      this.degreeForm.markAllAsTouched();
      return;
    }

    const v = this.degreeForm.getRawValue();
    this.isSaving = true;

    if (this.editingId) {
      // Update existing record
      const updatePayload = {
        institutionId: v.institutionId,
        institutionProgramId: v.institutionProgramId,
        batchYear: v.batchYear,
        ...(this.isHighSchool ? { gradeLevel: v.gradeLevel } : { major: v.major }),
      };
      this.api.updateAcademic(this.editingId, updatePayload).subscribe({
        next: res => {
          this.isSaving = false;
          if (res.status === 'success' && res.data) {
            this.replaceRecord(res.data);
            this.toast.success(res.message || 'Record updated successfully');
            this.cancelForm();
          } else {
            this.toast.error(res.message || 'Failed to update record');
          }
        },
        error: () => {
          this.isSaving = false;
        },
      });
    } else {
      // New record
      const academicPayload: AcademicPayload = {
        educationLevel: this.educationLevel,
        institutionId: v.institutionId,
        institutionProgramId: v.institutionProgramId,
        batchYear: v.batchYear,
        ...(this.isHighSchool ? { gradeLevel: v.gradeLevel ?? undefined } : { major: v.major }),
      };

      const onboardingCall$ = this.isHighSchool
        ? this.api.submitHsOnboarding({
            institutionId: v.institutionId,
            institutionProgramId: v.institutionProgramId,
            gradeLevel: v.gradeLevel,
            batchYear: v.batchYear,
          })
        : this.api.submitUniversityOnboarding({
            institutionId: v.institutionId,
            institutionProgramId: v.institutionProgramId,
            major: v.major,
            batchYear: v.batchYear,
          });

      onboardingCall$
        .pipe(
          switchMap(ores => {
            if (ores.status !== 'success') {
              return throwError(() => new Error(ores.message || 'Onboarding step failed'));
            }
            return this.api.createAcademic(academicPayload);
          })
        )
        .subscribe({
          next: res => {
            this.isSaving = false;
            if (res.status === 'success' && res.data) {
              if (!this.primaryAcademic) {
                this.primaryAcademic = { ...res.data, isPrimary: true };
              } else {
                this.academicHistory.push(res.data);
              }
              this.toast.success('Record saved successfully');
              this.cancelForm();
            } else {
              this.toast.error(res.message || 'Failed to save record');
            }
          },
          error: err => {
            this.isSaving = false;
            this.toast.error(err.message || 'An error occurred');
          },
        });
    }
  }

  deleteRecord(id: string) {
    this.api.deleteAcademic(id).subscribe({
      next: res => {
        if (res.status === 'success') {
          this.toast.success('Record deleted');
          if (this.primaryAcademic?.id === id) {
            this.primaryAcademic = null;
            if (this.academicHistory.length > 0) {
              this.primaryAcademic = this.academicHistory.shift()!;
            }
            if (!this.primaryAcademic) this.showForm = true;
          } else {
            this.academicHistory = this.academicHistory.filter(r => r.id !== id);
          }
        } else {
          this.toast.error(res.message || 'Failed to delete record');
        }
      },
    });
  }

  makePrimary(id: string) {
    this.api.makePrimary(id).subscribe({
      next: res => {
        if (res.status === 'success') {
          this.toast.success('Marked as primary');
          const newPrimary = this.academicHistory.find(r => r.id === id);
          if (newPrimary && this.primaryAcademic) {
            this.academicHistory = this.academicHistory.filter(r => r.id !== id);
            this.academicHistory.unshift({ ...this.primaryAcademic, isPrimary: false });
            this.primaryAcademic = { ...newPrimary, isPrimary: true };
          }
        } else {
          this.toast.error(res.message || 'Failed to mark as primary');
        }
      },
    });
  }

  private replaceRecord(updated: AcademicRecord) {
    if (this.primaryAcademic?.id === updated.id) {
      this.primaryAcademic = updated;
    } else {
      const idx = this.academicHistory.findIndex(r => r.id === updated.id);
      if (idx !== -1) this.academicHistory[idx] = updated;
    }
  }

  get hasRecords() {
    return !!this.primaryAcademic;
  }

  submit() {
    if (!this.hasRecords) {
      this.showForm = true;
      return;
    }
    this.saved.emit();
  }
}
