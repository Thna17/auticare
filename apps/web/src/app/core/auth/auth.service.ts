import { HttpClient, HttpContext } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import type {
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  AuthResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginRequest,
  ParentResponse,
  PasswordResetRequest,
  PasswordResetResponse,
  RegisterRequest,
  ResendInvitationRequest,
  ResendInvitationResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  StaffSetupRequest,
  UpdateMyProfileRequest,
  VerifyInvitationResponse,
} from '@auticare/contracts';
import type { Observable } from 'rxjs';
import { catchError, map, of, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { SKIP_AUTH_REFRESH } from '../interceptors/auth-refresh.interceptor';
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
        this.clearClientSession();
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
  /** A school-created teacher's first sign-in: username, setup code, new password. */
  staffSetup(input: StaffSetupRequest): Observable<ParentResponse> {
    return this.http
      .post<{ data: AuthResponse }>(`${this.apiBaseUrl}/auth/staff-setup`, input)
      .pipe(
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
  /**
   * Update the signed-in account holder's own profile. The response carries the
   * updated parent, so the shared auth state is refreshed in place — the header
   * name and initials follow a save without a reload.
   */
  updateMyProfile(input: UpdateMyProfileRequest): Observable<ParentResponse> {
    return this.http.patch<{ data: AuthResponse }>(`${this.apiBaseUrl}/auth/me`, input).pipe(
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
  verifyInvitation(token: string): Observable<VerifyInvitationResponse> {
    return this.http
      .get<{ data: VerifyInvitationResponse }>(`${this.apiBaseUrl}/auth/invitations/verify`, {
        params: { token },
      })
      .pipe(map((response) => response.data));
  }
  acceptInvitation(input: AcceptInvitationRequest): Observable<ParentResponse> {
    return this.http
      .post<{ data: AcceptInvitationResponse }>(`${this.apiBaseUrl}/auth/invitations/accept`, input)
      .pipe(
        map((response) => response.data.parent),
        tap((parent) => this.state.set({ status: 'authenticated', parent })),
      );
  }
  resendInvitation(input: ResendInvitationRequest): Observable<ResendInvitationResponse> {
    return this.http
      .post<{ data: ResendInvitationResponse }>(`${this.apiBaseUrl}/auth/invitations/resend`, input)
      .pipe(map((response) => response.data));
  }
  changePassword(input: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http
      .post<{ data: ChangePasswordResponse }>(`${this.apiBaseUrl}/auth/change-password`, input)
      .pipe(map((response) => response.data));
  }

  private readonly router = inject(Router, { optional: true });

  /**
   * Reset client session state without network calls.
   */
  clearClientSession(): void {
    this.state.set({ status: 'anonymous', parent: null });
  }

  /**
   * Clear client state and redirect to login, preserving intended return URL.
   */
  clearSessionAndRedirect(returnUrl?: string): void {
    this.clearClientSession();
    if (this.router) {
      const queryParams = returnUrl ? { returnUrl } : undefined;
      void this.router.navigate(['/login'], queryParams ? { queryParams } : undefined);
    }
  }

  /**
   * Request token refresh from the server. Exactly one POST to /api/v1/auth/refresh.
   */
  refreshSession(): Observable<ParentResponse> {
    return this.http
      .post<{ data: AuthResponse }>(
        `${this.apiBaseUrl}/auth/refresh`,
        {},
        {
          context: new HttpContext().set(SKIP_AUTH_REFRESH, true),
        },
      )
      .pipe(
        map((response) => response.data.parent),
        tap((parent) => this.state.set({ status: 'authenticated', parent })),
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<{ data: { loggedOut: boolean } }>(`${this.apiBaseUrl}/auth/logout`, {})
      .pipe(
        tap(() => this.clearClientSession()),
        map(() => undefined),
      );
  }
}
