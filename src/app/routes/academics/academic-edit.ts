import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { OnboardingApiService } from '../onboarding/onboarding-api.service';
import { Observable, of } from 'rxjs';
import { AuthService } from '@core';

@Component({
  selector: 'app-academic-edit',
  template: `
    <h2 mat-dialog-title class="m-b-16">{{ data ? 'Edit' : 'Add' }} Academic Record</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 mt-4">
        <div class="row">
          <!-- Institution / University -->
          <div class="col-12 m-b-16">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>
                {{ isHighSchool ? 'Institution / School' : 'Institution / University' }}
              </mat-label>
              <mat-select formControlName="institution">
                @for (inst of institutions$ | async; track inst) {
                  <mat-option [value]="inst">{{ inst }}</mat-option>
                }
              </mat-select>
              @if (form.get('institution')?.invalid && form.get('institution')?.touched) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
          </div>

          <!-- Degree -->
          <div class="col-md-6 m-b-16">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>{{ isHighSchool ? 'Degree / Certificate' : 'Degree' }}</mat-label>
              @if (isHighSchool) {
                <mat-select formControlName="degree">
                  <mat-option value="Matriculation">Matriculation</mat-option>
                  <mat-option value="Intermediate">Intermediate</mat-option>
                  <mat-option value="O Levels">O Levels</mat-option>
                  <mat-option value="A Levels">A Levels</mat-option>
                  <mat-option value="Other">Other</mat-option>
                </mat-select>
              } @else {
                <mat-select formControlName="degree">
                  @for (d of degrees$ | async; track d) {
                    <mat-option [value]="d">{{ d }}</mat-option>
                  }
                </mat-select>
              }
              @if (form.get('degree')?.invalid && form.get('degree')?.touched) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
          </div>

          <!-- Year -->
          <div class="col-md-6 m-b-16">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Year</mat-label>
              <mat-select formControlName="yearBatch">
                @for (b of isHighSchool ? highSchoolYears : batches; track b.value) {
                  <mat-option [value]="b.value">{{ b.label }}</mat-option>
                }
              </mat-select>
              @if (form.get('yearBatch')?.invalid && form.get('yearBatch')?.touched) {
                <mat-error>Required</mat-error>
              }
            </mat-form-field>
          </div>

          @if (isHighSchool) {
            <!-- Education System -->
            <div class="col-md-12 m-b-16">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Education System</mat-label>
                <mat-select formControlName="educationSystem">
                  @for (es of educationSystems; track es) {
                    <mat-option [value]="es">{{ es }}</mat-option>
                  }
                </mat-select>
                @if (form.get('educationSystem')?.invalid && form.get('educationSystem')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>
            </div>
          } @else {
            <!-- Major / Field of Study -->
            <div class="col-md-12 m-b-16">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Major / Field of Study</mat-label>
                <input matInput formControlName="major" placeholder="e.g. Computer Science" />
                @if (form.get('major')?.invalid && form.get('major')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>
            </div>
          }

          <!-- File Upload -->
          <div class="col-12 m-b-16">
            <label for="fileInput" class="field-label m-b-8 d-block">
              Degree Certificate (optional)
            </label>
            <input
              id="fileInput"
              #fileInput
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              class="hidden"
              (change)="onFileSelected($event)"
            />
            <div
              class="file-upload-box hvr-lift"
              (click)="fileInput.click()"
              (keyup.enter)="fileInput.click()"
              tabindex="0"
            >
              @if (selectedFileName) {
                <mat-icon class="text-success">check_circle</mat-icon>
                <span class="file-name">{{ selectedFileName }}</span>
              } @else {
                <mat-icon>upload_file</mat-icon>
                <span>Click to upload Certificate/Transcript</span>
              }
            </div>
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="p-24">
      <button mat-button (click)="onCancel()" class="text-slate-500">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        (click)="onSave()"
        [disabled]="form.invalid"
        class="save-btn hvr-lift"
      >
        {{ data ? 'Update' : 'Save' }} Record
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
      .hidden {
        display: none;
      }
      .field-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface-variant);
      }
      .file-upload-box {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: var(--mat-sys-surface-container-high);
        border: 1px dashed var(--mat-sys-outline);
        border-radius: 16px;
        cursor: pointer;
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.875rem;
        transition: all 0.2s ease;

        &:hover {
          background: rgb(from var(--mat-sys-primary) r g b / 0.05);
          border-color: var(--mat-sys-primary);
        }

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          color: var(--mat-sys-primary);
        }
        .text-success {
          color: #10b981 !important;
        }
        .file-name {
          font-weight: 600;
          color: var(--mat-sys-on-surface);
        }
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
  ],
})
export class AcademicEdit implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AcademicEdit>);
  private readonly api = inject(OnboardingApiService);
  private readonly auth = inject(AuthService);
  readonly data = inject(MAT_DIALOG_DATA);

  institutions$!: Observable<string[]>;
  degrees$!: Observable<string[]>;

  readonly batches = [
    { label: '1st Year', value: '1' },
    { label: '2nd Year', value: '2' },
    { label: '3rd Year', value: '3' },
    { label: '4th Year', value: '4' },
    { label: '5th Year', value: '5' },
    { label: '6th Year', value: '6' },
  ];

  readonly highSchoolYears = [
    { label: '1st Year', value: '1' },
    { label: '2nd Year', value: '2' },
  ];

  readonly educationSystems = ['O Levels', 'A Levels', 'Intermediate', 'Matriculation', 'Other'];

  isHighSchool = false;

  selectedFileName: string | null = this.data?.degreeFileUrl || null;

  form = this.fb.group({
    institution: [this.data?.institution || '', Validators.required],
    degree: [this.data?.degree || '', Validators.required],
    yearBatch: [this.data?.yearBatch || '', Validators.required],
    major: [this.data?.major || ''],
    educationSystem: [this.data?.educationSystem || ''],
    type: [this.data?.type || 'university'],
  });

  ngOnInit() {
    // Determine if high school based on data or user profile
    const user = this.auth.getUserSnapshot();
    this.isHighSchool =
      this.data?.type === 'high_school' || user?.['personalInfo']?.educationLevel === 'High School';

    if (this.isHighSchool) {
      if (!this.data) this.form.get('type')?.setValue('high_school');
      this.form.get('educationSystem')?.setValidators(Validators.required);
      this.form.get('major')?.clearValidators();
    } else {
      if (!this.data) this.form.get('type')?.setValue('university');
      this.form.get('major')?.setValidators(Validators.required);
      this.form.get('educationSystem')?.clearValidators();
    }
    this.form.updateValueAndValidity();

    this.institutions$ = this.api.getInstitutions();

    // Handle dependent degree select
    this.form.get('institution')?.valueChanges.subscribe(inst => {
      if (inst) {
        this.degrees$ = this.api.getDegrees(inst);
      } else {
        this.degrees$ = of([]);
      }
    });

    // If editing, trigger degree load
    if (this.data?.institution) {
      this.degrees$ = this.api.getDegrees(this.data.institution);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFileName = file.name;
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.form.valid) {
      const result = {
        ...this.form.getRawValue(),
        degreeFileUrl: this.selectedFileName,
      };
      this.dialogRef.close(result);
    }
  }
}
