import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, inject, Renderer2 } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { SettingsService } from '@core';
import { MtxAlertModule } from '@ng-matero/extensions/alert';
import { MtxProgressModule } from '@ng-matero/extensions/progress';
import { Subscription } from 'rxjs';
import { CHARTS, ELEMENT_DATA, MESSAGES, STATS } from './data';

// 1. Professional Data Interface
export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Disabled';
  registrationDate: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatListModule,
    MatGridListModule,
    MatTableModule,
    MatTabsModule,
    MatIconModule,
    MtxProgressModule,
    MtxAlertModule,
  ],
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly settings = inject(SettingsService);
  private readonly renderer = inject(Renderer2); // Safe DOM manipulation

  // --- Existing Dashboard Data ---
  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  dataSource = ELEMENT_DATA;
  messages = MESSAGES;
  charts = CHARTS;
  chart1?: ApexCharts;
  chart2?: ApexCharts;
  stats = STATS;
  notifySubscription = Subscription.EMPTY;
  isShowAlert = true;

  // --- New Student Management Data & State ---
  students: Student[] = [
    { id: '#STU-001', name: 'Amy Phrodite', email: 'amy.p@example.com', phone: '(123) 456-7890', status: 'Active', registrationDate: '2024-09-15' },
    { id: '#STU-002', name: 'Michael Davis', email: 'michael.d@example.com', phone: '(098) 765-4321', status: 'Disabled', registrationDate: '2024-10-01' }
  ];

  activeModal: string | null = null;
  selectedStudent: Student | null = null;

  get isDark() {
    return this.settings.getThemeColor() == 'dark';
  }

  ngOnInit() {
    this.notifySubscription = this.settings.notify.subscribe(opts => {
      this.updateCharts();
    });
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.initCharts(), 100);
    });
  }

  // --- Professional Modal Logic ---
  openModal(modalId: string, student: Student) {
    this.activeModal = modalId;
    this.selectedStudent = student;
    this.renderer.setStyle(document.body, 'overflow', 'hidden'); // Prevent background scroll
  }

  closeModal() {
    this.activeModal = null;
    this.selectedStudent = null;
    this.renderer.removeStyle(document.body, 'overflow'); // Restore background scroll
  }

  closeOnBackdrop(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Check if clicked exactly on the overlay background
    if (target.classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  ngOnDestroy() {
    this.chart1?.destroy();
    this.chart2?.destroy();
    this.notifySubscription.unsubscribe();
  }

  initCharts() {
    const chartElement1 = document.querySelector('#chart1');
    const chartElement2 = document.querySelector('#chart2');

    if (chartElement1 && chartElement2) {
      this.chart1 = new ApexCharts(chartElement1, this.charts[0]);
      this.chart1.render();

      this.chart2 = new ApexCharts(chartElement2, this.charts[1]);
      this.chart2.render();

      this.updateCharts();

      // Ensure the charts resize correctly once the layout settles
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 500);
    } else {
      console.warn('Dashboard charts could not find target elements #chart1/2');
    }
  }

  updateCharts() {
    this.chart1?.updateOptions({
      chart: {
        foreColor: this.isDark ? '#ccc' : '#333',
        background: 'transparent',
      },
      tooltip: {
        theme: this.isDark ? 'dark' : 'light',
      },
      grid: {
        borderColor: this.isDark ? '#5a5a5a' : '#e1e1e1',
      },
      theme: {
        mode: this.isDark ? 'dark' : 'light',
      },
    });

    this.chart2?.updateOptions({
      chart: {
        foreColor: this.isDark ? '#ccc' : '#333',
        background: 'transparent',
      },
      plotOptions: {
        radar: {
          polygons: {
            strokeColors: this.isDark ? '#5a5a5a' : '#e1e1e1',
            connectorColors: this.isDark ? '#5a5a5a' : '#e1e1e1',
            fill: {
              colors: this.isDark ? ['#2c2c2c', '#222'] : ['#f2f2f2', '#fff'],
            },
          },
        },
      },
      tooltip: {
        theme: this.isDark ? 'dark' : 'light',
      },
      theme: {
        mode: this.isDark ? 'dark' : 'light',
      },
    });
  }

  onAlertDismiss() {
    this.isShowAlert = false;
  }

  getRandom(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
