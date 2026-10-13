import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AppointmentResponse, DoctorResponse } from '@auticare/contracts';
import { HospitalManagementApi } from './hospital-management.api';
import { UiBadgeComponent } from '../../design-system/components/ui-badge.component';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { statusPresentation, statusTone } from '../appointments/appointments.types';

@Component({
  standalone: true,
  imports: [RouterLink, UiBadgeComponent, UiCardComponent, UiMessageComponent, UiSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <span aria-current="page">Hospital workspace</span>
    </nav>

    <section class="page-header">
      <div class="header-content">
        <p class="eyebrow">Clinical Operations Hub</p>
        <h1>{{ name() }}</h1>
        <p class="subtitle">
          Real-time clinical operations dashboard, daily appointment schedule, triage alerts, and
          specialist availability.
        </p>
      </div>
    </section>

    @if (loading()) {
      <ac-ui-card>
        <ac-ui-spinner label="Loading clinical operations summary…" />
      </ac-ui-card>
    } @else if (error(); as problem) {
      <ac-ui-card>
        <ac-ui-message tone="error">{{ problem }}</ac-ui-message>
        <button type="button" class="btn-retry" (click)="load()">Try again</button>
      </ac-ui-card>
    } @else {
      <!-- Pending Requests Alert Banner -->
      @if (requested() > 0) {
        <section class="triage-alert-banner" role="alert" aria-live="polite">
          <div class="alert-icon-box" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div class="alert-content">
            <h2 class="alert-title">
              Action Required: {{ requested() }} Pending Appointment Request{{
                requested() === 1 ? '' : 's'
              }}
            </h2>
            <p class="alert-message">
              Families are awaiting specialist confirmation. Please review and triage these clinical
              visit requests.
            </p>
          </div>
          <a class="btn-alert-action" routerLink="/hospital/appointments"> Review Requests → </a>
        </section>
      } @else {
        <section class="triage-calm-banner" role="status">
          <div class="calm-icon-box" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <p class="calm-message">
            All appointment requests are triaged. Your clinical queue is fully up to date.
          </p>
        </section>
      }

      <!-- Operational KPIs Grid -->
      <section class="stats" aria-label="Appointment summary">
        <article class="stat-card pending-card">
          <div class="stat-icon-wrap" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class="stat-data">
            <p class="stat-label">Pending Review</p>
            <p class="stat-value">{{ requested() }}</p>
          </div>
        </article>

        <article class="stat-card approved-card">
          <div class="stat-icon-wrap" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="stat-data">
            <p class="stat-label">Approved Visits</p>
            <p class="stat-value">{{ confirmed() }}</p>
          </div>
        </article>

        <article class="stat-card completed-card">
          <div class="stat-icon-wrap" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div class="stat-data">
            <p class="stat-label">Completed</p>
            <p class="stat-value">{{ completed() }}</p>
          </div>
        </article>

        <article class="stat-card roster-card">
          <div class="stat-icon-wrap" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="stat-data">
            <p class="stat-label">Active Specialists</p>
            <p class="stat-value">{{ doctors().length }}</p>
          </div>
        </article>
      </section>

      <!-- Daily Appointment Summary -->
      <section class="dashboard-section" aria-label="Today's clinical schedule">
        <div class="section-header">
          <div>
            <h2 class="section-title">Today's Appointment Schedule</h2>
            <p class="section-subtitle">
              Scheduled clinical visits and developmental consultations for {{ todayFormatted }}.
            </p>
          </div>
          <a class="section-action" routerLink="/hospital/appointments"> View All Visits → </a>
        </div>

        @if (todayAppointments().length === 0) {
          <ac-ui-card class="schedule-empty-card">
            <div class="empty-schedule-inner">
              <div class="empty-schedule-icon" aria-hidden="true">📅</div>
              <div>
                <p class="empty-schedule-title">No appointments scheduled for today</p>
                <p class="empty-schedule-desc">
                  Incoming requests will appear here once approved for today's clinical sessions.
                </p>
              </div>
            </div>
          </ac-ui-card>
        } @else {
          <div class="schedule-table-wrap">
            <table class="schedule-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Specialist</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (item of todayAppointments(); track item.id) {
                  <tr>
                    <td class="time-cell">
                      <strong>{{ formatTime(item.scheduledAt) }}</strong>
                    </td>
                    <td>
                      <span class="patient-name">{{ item.childName ?? 'Patient TBD' }}</span>
                    </td>
                    <td>
                      <span class="doctor-name">{{ item.doctorName ?? 'Unassigned' }}</span>
                    </td>
                    <td class="reason-cell">
                      <span>{{ item.reason ?? '—' }}</span>
                    </td>
                    <td>
                      <ac-ui-badge [tone]="statusTone[item.status]">
                        {{ statusPresentation[item.status].label }}
                      </ac-ui-badge>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      <!-- Specialist Availability Breakdown -->
      <section class="dashboard-section" aria-label="Specialist availability breakdown">
        <div class="section-header">
          <div>
            <h2 class="section-title">Specialist Roster &amp; Availability</h2>
            <p class="section-subtitle">
              On-call clinical specialists and active booking availability windows.
            </p>
          </div>
          <a class="section-action" routerLink="/hospital/doctors"> Manage Specialists → </a>
        </div>

        @if (doctors().length === 0) {
          <ac-ui-card class="schedule-empty-card">
            <div class="empty-schedule-inner">
              <div class="empty-schedule-icon" aria-hidden="true">👨‍⚕️</div>
              <div>
                <p class="empty-schedule-title">No specialists configured yet</p>
                <p class="empty-schedule-desc">
                  Add doctors and specialists to your clinical roster so families can schedule
                  appointments.
                </p>
              </div>
            </div>
          </ac-ui-card>
        } @else {
          <div class="specialist-grid">
            @for (doc of doctors(); track doc.id) {
              <ac-ui-card class="specialist-card">
                <div class="specialist-card-top">
                  <div class="specialist-avatar" aria-hidden="true">
                    {{ getInitials(doc.fullName) }}
                  </div>
                  <div class="specialist-meta">
                    <h3 class="specialist-name">{{ doc.fullName }}</h3>
                    <span class="specialist-badge">{{ doc.specialty }}</span>
                  </div>
                </div>

                <div class="specialist-details">
                  <div class="detail-row">
                    <span class="detail-label">Active Days:</span>
                    <div class="day-pills">
                      @for (day of getDayLabels(doc.availableDays); track day) {
                        <span class="day-pill">{{ day }}</span>
                      }
                    </div>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Hours:</span>
                    <span class="hours-val">{{ formatDoctorHours(doc) }}</span>
                  </div>
                </div>
              </ac-ui-card>
            }
          </div>
        }
      </section>
    }

    <!-- Quick Navigation Links -->
    <section class="quick-links" aria-label="Quick management actions">
      <a class="link-card" routerLink="/hospital/appointments">
        <div class="link-icon-box" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div class="link-content">
          <h2>Review appointment requests</h2>
          <p>
            Triage and approve clinical appointments, examine guardian notes, and record visit
            outcomes.
          </p>
        </div>
        <span class="link-arrow" aria-hidden="true">&rsaquo;</span>
      </a>

      <a class="link-card" routerLink="/hospital/doctors">
        <div class="link-icon-box" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div class="link-content">
          <h2>Manage specialists &amp; roster</h2>
          <p>
            Register doctors, update weekly clinical working days, consultation hours, and slot
            lengths.
          </p>
        </div>
        <span class="link-arrow" aria-hidden="true">&rsaquo;</span>
      </a>

      <a class="link-card" routerLink="/hospital/profile">
        <div class="link-icon-box" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <div class="link-content">
          <h2>Update institution profile</h2>
          <p>
            Maintain hospital directory information, address, departments, specialized services, and
            emergency desk details.
          </p>
        </div>
        <span class="link-arrow" aria-hidden="true">&rsaquo;</span>
      </a>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 1040px;
        margin: 0 auto;
      }

      .breadcrumbs {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .breadcrumbs span[aria-current] {
        color: var(--ac-color-text-dark);
        font-weight: var(--ac-font-weight-semibold);
      }

      .page-header {
        margin-bottom: 24px;
      }

      .eyebrow {
        margin: 0 0 6px;
        color: var(--ac-color-action);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        font-size: var(--ac-type-meta);
        letter-spacing: 0.04em;
      }

      h1 {
        margin: 0 0 8px;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-title);
      }

      .subtitle {
        margin: 0;
        max-width: 680px;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
      }

      /* ── Triage Alerts ───────────────────────────────────────── */
      .triage-alert-banner {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-amber-tint-cream);
        border: 1px solid var(--ac-color-amber-500);
        margin-bottom: 24px;
        flex-wrap: wrap;
      }

      .alert-icon-box {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-amber-800);
        flex-shrink: 0;
      }

      .alert-content {
        flex: 1 1 300px;
      }

      .alert-title {
        margin: 0 0 4px;
        font-size: 15px;
        font-weight: 700;
        color: var(--ac-color-amber-800);
      }

      .alert-message {
        margin: 0;
        font-size: 13.5px;
        color: var(--ac-color-action-darkest);
        line-height: 1.4;
      }

      .btn-alert-action {
        display: inline-flex;
        align-items: center;
        padding: 8px 16px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        white-space: nowrap;
        transition: background 160ms ease;
      }
      .btn-alert-action:hover {
        background: var(--ac-color-action-deep);
      }

      .triage-calm-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 18px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-green-50);
        border: 1px solid var(--ac-color-green-100);
        margin-bottom: 24px;
      }

      .calm-icon-box {
        color: var(--ac-color-green-600);
        display: flex;
        align-items: center;
      }

      .calm-message {
        margin: 0;
        font-size: 13.5px;
        font-weight: 600;
        color: var(--ac-color-green-700);
      }

      /* ── Stats Grid ─────────────────────────────────────────── */
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 16px;
        margin-bottom: 28px;
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: 14px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: 18px 20px;
        transition:
          transform 160ms ease,
          box-shadow 160ms ease;
      }
      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--ac-shadow-md);
      }

      .stat-icon-wrap {
        width: 42px;
        height: 42px;
        border-radius: var(--ac-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .pending-card .stat-icon-wrap {
        background: var(--ac-color-amber-tint-cream);
        color: var(--ac-color-amber-800);
      }
      .approved-card .stat-icon-wrap {
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action);
      }
      .completed-card .stat-icon-wrap {
        background: var(--ac-color-green-50);
        color: var(--ac-color-green-700);
      }
      .roster-card .stat-icon-wrap {
        background: var(--ac-color-slate-100);
        color: var(--ac-color-slate-700);
      }

      .stat-data {
        min-width: 0;
      }

      .stat-label {
        margin: 0 0 4px;
        color: var(--ac-color-text-muted);
        font-size: 12px;
        font-weight: var(--ac-font-weight-medium);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .stat-value {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 26px;
        font-weight: var(--ac-font-weight-bold);
        line-height: 1;
      }

      /* ── Dashboard Sections ──────────────────────────────────── */
      .dashboard-section {
        margin-bottom: 32px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 14px;
        gap: 16px;
        flex-wrap: wrap;
      }

      .section-title {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .section-subtitle {
        margin: 0;
        font-size: 13.5px;
        color: var(--ac-color-text-slate);
      }

      .section-action {
        color: var(--ac-color-action);
        font-size: 13.5px;
        font-weight: 700;
        text-decoration: none;
      }
      .section-action:hover {
        text-decoration: underline;
      }

      /* ── Empty Schedule ──────────────────────────────────────── */
      .schedule-empty-card {
        padding: 24px;
      }
      .empty-schedule-inner {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .empty-schedule-icon {
        font-size: 28px;
      }
      .empty-schedule-title {
        margin: 0 0 4px;
        font-size: 15px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }
      .empty-schedule-desc {
        margin: 0;
        font-size: 13px;
        color: var(--ac-color-text-slate);
      }

      /* ── Schedule Table ──────────────────────────────────────── */
      .schedule-table-wrap {
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        overflow-x: auto;
        box-shadow: var(--ac-shadow-sm);
      }

      .schedule-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13.5px;
        text-align: left;
      }

      .schedule-table th {
        padding: 12px 16px;
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-slate);
        font-size: 11.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .schedule-table td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--ac-color-border-slate);
        color: var(--ac-color-text-slate-strong);
      }

      .schedule-table tbody tr:last-child td {
        border-bottom: 0;
      }

      .time-cell {
        color: var(--ac-color-action);
        white-space: nowrap;
      }

      .patient-name {
        font-weight: 600;
      }

      .doctor-name {
        color: var(--ac-color-text-slate);
      }

      .reason-cell {
        max-width: 260px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--ac-color-text-body);
      }

      /* ── Specialist Grid ─────────────────────────────────────── */
      .specialist-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
      }

      .specialist-card {
        padding: 18px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
      }

      .specialist-card-top {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .specialist-avatar {
        width: 44px;
        height: 44px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        flex-shrink: 0;
      }

      .specialist-meta {
        min-width: 0;
      }

      .specialist-name {
        margin: 0 0 4px;
        font-size: 15px;
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
      }

      .specialist-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action);
        font-size: 11.5px;
        font-weight: 600;
      }

      .specialist-details {
        display: flex;
        flex-direction: column;
        gap: 6px;
        border-top: 1px solid var(--ac-color-border-slate);
        padding-top: 10px;
        font-size: 12.5px;
      }

      .detail-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .detail-label {
        color: var(--ac-color-text-slate);
        font-weight: 600;
      }

      .day-pills {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }

      .day-pill {
        display: inline-block;
        padding: 1px 6px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-slate-100);
        color: var(--ac-color-slate-700);
        font-size: 11px;
        font-weight: 600;
      }

      .hours-val {
        color: var(--ac-color-text-slate-strong);
        font-weight: 600;
      }

      /* ── Quick Links ─────────────────────────────────────────── */
      .quick-links {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }

      .link-card {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: 18px;
        text-decoration: none;
        transition:
          border-color 0.15s ease,
          transform 0.15s ease,
          box-shadow 0.15s ease;
      }

      .link-card:hover {
        border-color: var(--ac-color-action);
        transform: translateY(-2px);
        box-shadow: var(--ac-shadow-md);
      }

      .link-icon-box {
        width: 38px;
        height: 38px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .link-content {
        flex: 1;
        min-width: 0;
      }

      .link-card h2 {
        margin: 0 0 4px;
        color: var(--ac-color-text-strong);
        font-size: 15px;
        font-weight: 700;
      }

      .link-card p {
        margin: 0;
        color: var(--ac-color-text-muted);
        font-size: 12.5px;
        line-height: 1.45;
      }

      .link-arrow {
        flex: 0 0 auto;
        color: var(--ac-color-action);
        font-size: 1.3rem;
        margin-top: 4px;
      }

      .btn-retry {
        margin-top: 12px;
        padding: 8px 16px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface);
        color: var(--ac-color-action);
        font-weight: 700;
        cursor: pointer;
      }
    `,
  ],
})
export class HospitalDashboardPage {
  private readonly api = inject(HospitalManagementApi);
  readonly name = signal('Hospital dashboard');
  readonly requested = signal(0);
  readonly confirmed = signal(0);
  readonly completed = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly allAppointments = signal<AppointmentResponse[]>([]);
  readonly doctors = signal<DoctorResponse[]>([]);

  protected readonly statusTone = statusTone;
  protected readonly statusPresentation = statusPresentation;

  readonly todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  readonly todayAppointments = computed(() => {
    const todayYmd = new Date().toISOString().slice(0, 10);
    return this.allAppointments()
      .filter((a) => a.scheduledAt.slice(0, 10) === todayYmd)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  });

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.me().subscribe({ next: (v) => this.name.set(v.hospital.name) });

    this.api.appointments().subscribe({
      next: (v) => {
        this.allAppointments.set(v);
        this.requested.set(v.filter((a) => a.status === 'REQUESTED').length);
        this.confirmed.set(v.filter((a) => a.status === 'CONFIRMED').length);
        this.completed.set(v.filter((a) => a.status === 'COMPLETED').length);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Your appointment summary could not be loaded.');
        this.loading.set(false);
      },
    });

    this.api.doctors().subscribe({
      next: (docs) => this.doctors.set(docs),
      error: () => {},
    });
  }

  getInitials(name: string): string {
    return name
      .replace(/^Dr\.\s*/i, '')
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  getDayLabels(availableDays?: string): string[] {
    if (!availableDays) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const map: Record<string, string> = {
      '1': 'Mon',
      '2': 'Tue',
      '3': 'Wed',
      '4': 'Thu',
      '5': 'Fri',
      '6': 'Sat',
      '0': 'Sun',
    };
    return availableDays
      .split(',')
      .map((d) => map[d.trim()] || d.trim())
      .filter(Boolean);
  }

  formatDoctorHours(doctor: DoctorResponse): string {
    const start = doctor.startHour ?? 9;
    const end = doctor.endHour ?? 17;
    const duration = doctor.slotDurationMinutes ?? 30;
    const formatH = (h: number) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hr = h % 12 || 12;
      return `${hr}:00 ${ampm}`;
    };
    return `${formatH(start)} – ${formatH(end)} (${duration}m slots)`;
  }
}
