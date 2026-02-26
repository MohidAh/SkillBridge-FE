import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-academic-edit',
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Subject</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 mt-4">
        <mat-form-field appearance="outline">
          <mat-label>Code</mat-label>
          <input matInput formControlName="code" placeholder="e.g. CS101" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Subject</mat-label>
          <input matInput formControlName="subject" placeholder="e.g. Data Structures" />
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Semester</mat-label>
            <input matInput formControlName="semester" placeholder="e.g. Fall 2026" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Credits</mat-label>
            <input matInput type="number" formControlName="credits" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="In Progress">In Progress</mat-option>
            <mat-option value="Completed">Completed</mat-option>
            <mat-option value="Upcoming">Upcoming</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="p-b-24 p-x-24">
      <button mat-button (click)="onCancel()" class="text-slate-500">Cancel</button>
      <button mat-flat-button color="primary" (click)="onSave()" [disabled]="form.invalid">
        {{ data ? 'Update' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 400px;
      }
    `,
  ],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
})
export class AcademicEdit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AcademicEdit>);
  readonly data = inject(MAT_DIALOG_DATA);

  form = this.fb.group({
    code: [this.data?.code || '', Validators.required],
    subject: [this.data?.subject || '', Validators.required],
    semester: [this.data?.semester || '', Validators.required],
    credits: [this.data?.credits || 0, [Validators.required, Validators.min(1)]],
    status: [this.data?.status || 'Upcoming', Validators.required],
  });

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
