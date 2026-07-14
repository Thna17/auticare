import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import type {
  AuthResponse,
  LoginRequest,
  ParentResponse,
  PasswordResetRequest,
  PasswordResetResponse,
  RegisterRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@auticare/contracts';
import type { Observable } from 'rxjs';
import { catchError, map, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
type AuthState = {
  status: 'unknown' | 'authenticated' | 'anonymous';
  parent: ParentResponse | null;
};
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly state = signal<AuthState>({ status: 'unknown', parent: null });
  readonly parent = computed(() => this.state().parent);
  readonly isAuthenticated = computed(() => this.state().status === 'authenticated');
  loadCurrentUser(): Observable<boolean> {
    return this.http.get<{ data: AuthResponse }>(`${this.apiBaseUrl}/auth/me`).pipe(
      tap((response) => this.state.set({ status: 'authenticated', parent: response.data.parent })),
      map(() => true),
      catchError(() => {
        this.state.set({ status: 'anonymous', parent: null });
        return of(false);
      }),
    );
  }
  login(input: LoginRequest): Observable<ParentResponse> {
    return this.http.post<{ data: AuthResponse }>(`${this.apiBaseUrl}/auth/login`, input).pipe(
      map((response) => response.data.parent),
      tap((parent) => this.state.set({ status: 'authenticated', parent })),
    );
  }
  register(input: RegisterRequest): Observable<ParentResponse> {
    return this.http.post<{ data: AuthResponse }>(`${this.apiBaseUrl}/auth/register`, input).pipe(
      map((response) => response.data.parent),
      tap((parent) => this.state.set({ status: 'authenticated', parent })),
    );
  }
  requestPasswordReset(input: PasswordResetRequest): Observable<PasswordResetResponse> {
    return this.http
      .post<{ data: PasswordResetResponse }>(`${this.apiBaseUrl}/auth/forgot-password`, input)
      .pipe(map((response) => response.data));
  }
  resetPassword(input: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http
      .post<{ data: ResetPasswordResponse }>(`${this.apiBaseUrl}/auth/reset-password`, input)
      .pipe(map((response) => response.data));
  }
  logout(): Observable<void> {
    return this.http
      .post<{ data: { loggedOut: boolean } }>(`${this.apiBaseUrl}/auth/logout`, {})
      .pipe(
        tap(() => this.state.set({ status: 'anonymous', parent: null })),
        map(() => undefined),
      );
  }
}
