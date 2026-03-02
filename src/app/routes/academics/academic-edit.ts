import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import {
  AcademicRecord,
  InstitutionItem,
  OnboardingApiService,
  ProgramItem,
} from '../onboarding/onboarding-api.service';
import { AuthService } from '@core';
import { EducationLevel } from '@shared/enums/education-level.enums';

export interface AcademicEditDialogData {
  record: AcademicRecord | null;
}

import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-academic-edit',
  template: `
    <h2 mat-dialog-title class="m-b-16">{{ data.record ? 'Edit' : 'Add' }} Academic Record</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 mt-4">
        <div class="row">
          <!-- Institution -->
          <div class="col-12 m-b-16">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>
                {{ isHighSchool ? 'Institution / School' : 'Institution / University' }}
              </mat-label>
              <mat-select formControlName="institutionId">
                @for (inst of institutions; track inst.id) {
                  <mat-option [value]="inst.id">{{ inst.name }}</mat-option>
                }
              </mat-select>
              @if (form.get('institutionId')?.invalid && form.get('institutionId')?.touched) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
          </div>

          <!-- Program -->
          <div class="col-md-6 m-b-16">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>
                {{ isHighSchool ? 'Degree / Certificate' : 'Degree / Program' }}
              </mat-label>
              @if (isHighSchool) {
                <mat-select formControlName="institutionProgramId">
                  <mat-option value="matric">Matriculation</mat-option>
                  <mat-option value="intermediate">Intermediate</mat-option>
                  <mat-option value="olevels">O Levels</mat-option>
                  <mat-option value="alevels">A Levels</mat-option>
                  <mat-option value="other">Other</mat-option>
                </mat-select>
              } @else {
                <mat-select formControlName="institutionProgramId">
                  @for (p of programs; track p.id) {
                    <mat-option [value]="p.id">{{ p.name }}</mat-option>
                  }
                </mat-select>
              }
              @if (
                form.get('institutionProgramId')?.invalid &&
                form.get('institutionProgramId')?.touched
              ) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
          </div>

          <!-- Year / Grade -->
          <div class="col-md-6 m-b-16">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>{{ isHighSchool ? 'Year / Grade' : 'Current Year' }}</mat-label>
              <mat-select formControlName="gradeLevel">
                @for (b of isHighSchool ? highSchoolYears : batches; track b.value) {
                  <mat-option [value]="b.value">{{ b.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Batch Year -->
          <div class="col-md-6 m-b-16">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Batch Year</mat-label>
              <input matInput type="number" formControlName="batchYear" placeholder="e.g. 2022" />
              @if (form.get('batchYear')?.invalid && form.get('batchYear')?.touched) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
          </div>

          <!-- Major (non-HS) -->
          @if (!isHighSchool) {
            <div class="col-md-6 m-b-16">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Major / Field of Study</mat-label>
                <input matInput formControlName="major" placeholder="e.g. Computer Science" />
                @if (form.get('major')?.invalid && form.get('major')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>
            </div>
          }
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="p-24">
      <button mat-button (click)="onCancel()" class="text-slate-500">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        (click)="onSave()"
        [disabled]="form.invalid || isSaving"
        class="save-btn hvr-lift"
      >
        @if (isSaving) {
          <mat-spinner diameter="18" style="display:inline-block;margin-right:8px" />
        }
        {{ data.record ? 'Update' : 'Save' }} Record
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 500px;
        max-width: 600px;
      }
      .w-full {
        width: 100%;
      }
      .save-btn {
        height: 44px;
        padding: 0 24px;
        border-radius: 12px;
        font-weight: 700;
      }
    `,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class AcademicEdit implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AcademicEdit>);
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(HotToastService);
  readonly data = inject<AcademicEditDialogData>(MAT_DIALOG_DATA);

  institutions: InstitutionItem[] = [];
  programs: ProgramItem[] = [];
  isSaving = false;

  educationLevel = EducationLevel.University;
  get isHighSchool() {
    return this.educationLevel === EducationLevel.HighSchool;
  }

  readonly batches = Array.from({ length: 6 }, (_, i) => ({
    label: `${i + 1}${['st', 'nd', 'rd', 'th', 'th', 'th'][i]} Year`,
    value: i + 1,
  }));

  readonly highSchoolYears = [
    { label: '1st Year', value: 1 },
    { label: '2nd Year', value: 2 },
  ];

  form = this.fb.nonNullable.group({
    institutionId: ['', Validators.required],
    institutionProgramId: ['', Validators.required],
    batchYear: [0, Validators.required],
    gradeLevel: [0],
    major: [''],
  });

  ngOnInit() {
    // Determine education level from user state
    const user = this.auth.getUserSnapshot();
    const eduLevel = user?.['educationLevel'] ?? EducationLevel.University;
    this.educationLevel = eduLevel;

    this.setupConditionalValidators();

    // Prefill if editing
    const rec = this.data?.record;
    if (rec) {
      this.educationLevel = rec.educationLevel;
      this.setupConditionalValidators();
      this.form.patchValue({
        institutionId: rec.institutionName, // will be replaced by id once we have lookup by name
        institutionProgramId: rec.programName,
        batchYear: rec.batchYear,
        gradeLevel: rec.gradeLevel,
        major: rec.major ?? '',
      });
    }

    // Load lookup data
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
    const { gradeLevel, major } = this.form.controls;
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

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.isSaving = true;

    const rec = this.data?.record;

    if (rec) {
      // Update
      const payload = {
        institutionId: v.institutionId,
        institutionProgramId: v.institutionProgramId,
        batchYear: v.batchYear,
        ...(this.isHighSchool ? { gradeLevel: v.gradeLevel ?? undefined } : { major: v.major }),
      };
      this.api.updateAcademic(rec.id, payload).subscribe({
        next: res => {
          this.isSaving = false;
          if (res.status === 'success' && res.data) {
            this.toast.success(res.message || 'Record updated');
            this.dialogRef.close(res.data);
          } else {
            this.toast.error(res.message || 'Failed to update record');
          }
        },
        error: () => {
          this.isSaving = false;
        },
      });
    } else {
      // Create
      const payload = {
        educationLevel: this.educationLevel,
        institutionId: v.institutionId,
        institutionProgramId: v.institutionProgramId,
        batchYear: v.batchYear,
        ...(this.isHighSchool ? { gradeLevel: v.gradeLevel ?? undefined } : { major: v.major }),
      };
      this.api.createAcademic(payload).subscribe({
        next: res => {
          this.isSaving = false;
          if (res.status === 'success' && res.data) {
            this.toast.success(res.message || 'Record saved');
            this.dialogRef.close(res.data);
          } else {
            this.toast.error(res.message || 'Failed to save record');
          }
        },
        error: () => {
          this.isSaving = false;
        },
      });
    }
  }
}
