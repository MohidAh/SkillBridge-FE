import { Component, effect, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { PageHeader } from '@shared';
import { AcademicEdit } from './academic-edit';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core';
import { DegreeEntry } from '../onboarding/onboarding-api.service';

@Component({
  selector: 'app-academics',
  templateUrl: './academics.html',
  styleUrl: './academics.scss',
  imports: [
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    PageHeader,
  ],
})
export class Academics {
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);

  user = toSignal(this.auth.user());
  dataSource = signal<DegreeEntry[]>([]);
  isLoading = signal(true);

  displayedColumns: string[] = ['institution', 'degree', 'yearBatch', 'major', 'actions'];

  constructor() {
    effect(() => {
      const userData = this.user();
      if (userData) {
        if (userData['degrees']) {
          this.dataSource.set(userData['degrees']);
        }
        this.isLoading.set(false);
      }
    });

    // Fallback if user signal takes too long
    setTimeout(() => {
      if (this.isLoading()) this.isLoading.set(false);
    }, 3000);
  }

  add() {
    const dialogRef = this.dialog.open(AcademicEdit, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataSource.update(data => [...data, result]);
      }
    });
  }

  edit(item: DegreeEntry) {
    const dialogRef = this.dialog.open(AcademicEdit, {
      width: '500px',
      data: item,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataSource.update(data => {
          const index = data.indexOf(item);
          if (index > -1) {
            const newData = [...data];
            newData[index] = result;
            return newData;
          }
          return data;
        });
      }
    });
  }
}
