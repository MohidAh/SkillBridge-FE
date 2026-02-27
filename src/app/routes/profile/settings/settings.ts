import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
  ],
})
export class ProfileSettings implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  user = toSignal(this.auth.user());

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    dateOfBirth: ['', [Validators.required]],
    gender: ['', [Validators.required]],
    educationLevel: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    country: ['', [Validators.required]],
    city: ['', [Validators.required]],
    bio: [''],
  });

  readonly genders = ['Male', 'Female', 'Prefer not to say'];
  readonly educationLevels = ['High School', 'University', 'Graduate'];
  readonly countries = [
    'Pakistan',
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'India',
    'Germany',
    'UAE',
    'Saudi Arabia',
    'Other',
  ];

  ngOnInit() {
    const u = this.user();
    if (u) {
      this.form.patchValue({
        name: u.name || '',
        email: u.email || '',
        dateOfBirth: u['dateOfBirth'] || '',
        gender: u['gender'] || '',
        educationLevel: u['educationLevel'] || '',
        phone: u['phone'] || '',
        country: u['country'] || '',
        city: u['city'] || '',
        bio: u['bio'] || '',
      });
    }
  }

  save() {
    if (this.form.valid) {
      console.log('Saving profile:', this.form.value);
      // In a real app, we'd call a service to update the user
    }
  }
}
