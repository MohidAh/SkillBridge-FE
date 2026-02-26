import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AcademicEdit } from './academic-edit';

interface AcademicItem {
  code: string;
  subject: string;
  semester: string;
  credits: number;
  status: 'In Progress' | 'Completed' | 'Upcoming';
}

@Component({
  selector: 'app-academics',
  templateUrl: './academics.html',
  styleUrl: './academics.scss',
  imports: [MatCardModule, MatTableModule, MatChipsModule, MatButtonModule, MatIconModule],
})
export class Academics {
  private readonly dialog = inject(MatDialog);

  displayedColumns: string[] = ['code', 'subject', 'semester', 'credits', 'status', 'actions'];

  dataSource: AcademicItem[] = [
    {
      code: 'CS101',
      subject: 'Introduction to Programming',
      semester: 'Spring 2026',
      credits: 4,
      status: 'Completed',
    },
    {
      code: 'MA201',
      subject: 'Discrete Mathematics',
      semester: 'Spring 2026',
      credits: 3,
      status: 'In Progress',
    },
    {
      code: 'CS220',
      subject: 'Data Structures',
      semester: 'Fall 2026',
      credits: 4,
      status: 'Upcoming',
    },
    {
      code: 'CS305',
      subject: 'Database Systems',
      semester: 'Fall 2026',
      credits: 3,
      status: 'Upcoming',
    },
  ];

  add() {
    const dialogRef = this.dialog.open(AcademicEdit, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dataSource = [...this.dataSource, result];
      }
    });
  }

  edit(item: AcademicItem) {
    const dialogRef = this.dialog.open(AcademicEdit, {
      width: '500px',
      data: item,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const index = this.dataSource.indexOf(item);
        if (index > -1) {
          const newData = [...this.dataSource];
          newData[index] = result;
          this.dataSource = newData;
        }
      }
    });
  }
}
