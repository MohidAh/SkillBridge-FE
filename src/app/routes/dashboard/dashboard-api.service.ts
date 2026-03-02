import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiResponse } from '@core/authentication/interface';
import { Career } from './data';
import { PersonalityResult } from '../onboarding/onboarding-api.service';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);

  getRecommendations() {
    return this.http.get<ApiResponse<Career[]>>('/api/Dashboard/recommendations');
  }

  getPersonalityMe() {
    return this.http.get<ApiResponse<PersonalityResult>>('/api/Personality/me');
  }
}
