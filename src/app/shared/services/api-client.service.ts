import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpHeaders,
  HttpErrorResponse,
  HttpContext,
  HttpContextToken,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

type QueryParams = Record<string, string | number | boolean | null | undefined>;
const SKIP_AUTH = new HttpContextToken<boolean>(() => false);
@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  /* ===========================
     GET
  =========================== */
  get<T>(
    endpoint: string,
    options?: {
      params?: QueryParams;
      headers?: HttpHeaders;
      context?: HttpContext;
    }
  ): Observable<T> {
    return this.http
      .get<T>(this.buildUrl(endpoint), {
        params: this.buildParams(options?.params),
        headers: options?.headers,
        context: options?.context,
      })
      .pipe(catchError(this.handleError));
  }

  /* ===========================
     POST
  =========================== */
  post<T>(
    endpoint: string,
    body: unknown,
    options?: {
      headers?: HttpHeaders;
      context?: HttpContext;
    }
  ): Observable<T> {
    return this.http
      .post<T>(this.buildUrl(endpoint), body, {
        headers: options?.headers,
        context: options?.context,
      })
      .pipe(catchError(this.handleError));
  }

  /* ===========================
     PUT
  =========================== */
  put<T>(
    endpoint: string,
    body: unknown,
    options?: {
      headers?: HttpHeaders;
      context?: HttpContext;
    }
  ): Observable<T> {
    return this.http
      .put<T>(this.buildUrl(endpoint), body, {
        headers: options?.headers,
        context: options?.context,
      })
      .pipe(catchError(this.handleError));
  }

  /* ===========================
     DELETE
  =========================== */
  delete<T>(
    endpoint: string,
    options?: {
      params?: QueryParams;
      headers?: HttpHeaders;
      context?: HttpContext;
    }
  ): Observable<T> {
    return this.http
      .delete<T>(this.buildUrl(endpoint), {
        params: this.buildParams(options?.params),
        headers: options?.headers,
        context: options?.context,
      })
      .pipe(catchError(this.handleError));
  }

  /* ===========================
     Helpers
  =========================== */

  private buildUrl(endpoint: string): string {
    if (!endpoint) {
      throw new Error('Endpoint cannot be empty');
    }

    return `${this.baseUrl}${endpoint}`;
  }

  private buildParams(params?: QueryParams): HttpParams {
    if (!params) return new HttpParams();

    return Object.entries(params).reduce((httpParams, [key, value]) => {
      if (value !== null && value !== undefined) {
        return httpParams.set(key, String(value));
      }
      return httpParams;
    }, new HttpParams());
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error);
  }
}
