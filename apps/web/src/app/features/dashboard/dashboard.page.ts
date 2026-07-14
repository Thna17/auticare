import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ChildResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { ChildrenApi } from '../children/data-access/children.api';

type QuickAction = {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly icon: 'screening' | 'school' | 'hospital' | 'activity';
};

const quickActions: readonly QuickAction[] = [
  {
    title: 'Start screening',
    description: 'Update support profile',
    path: '/screening',
    icon: 'screening',
  },
  { title: 'Find school', description: 'Inclusive education', path: '/schools', icon: 'school' },
  { title: 'Find hospital', description: 'Specialist care', path: '/hospitals', icon: 'hospital' },
  {
    title: 'Browse activities',
    description: 'Home-based learning',
    path: '/activities',
    icon: 'activity',
  },
];

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="dashboard-header">
      <div>
        <h1>Good {{ dayPart() }}, {{ parentFirstName() }}</h1>
        <p>
          Welcome back to AutiCare.
          @if (selectedChild()) {
            Here's what's happening with {{ selectedChild()!.firstName }} today.
          } @else {
            Create a child profile to personalize your care dashboard.
          }
        </p>
      </div>

      @if (selectedChild()) {
        <a class="child-switcher" [routerLink]="['/children', selectedChild()!.id]">
          <span class="child-avatar" aria-hidden="true">{{ childInitials(selectedChild()!) }}</span>
          <span>
            <strong>{{ selectedChild()!.firstName }}, {{ ageLabel(selectedChild()!.dateOfBirth) }}</strong>
            <small>Open profile</small>
          </span>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="m8 10 4 4 4-4"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.4"
            />
          </svg>
        </a>
      } @else {
        <a class="child-switcher empty" routerLink="/children">
          <span class="child-avatar" aria-hidden="true">+</span>
          <span>
            <strong>No child selected</strong>
            <small>Add child profile</small>
          </span>
        </a>
      }
    </section>

    @if (childrenError()) {
      <p class="error" role="alert">{{ childrenError() }}</p>
    }

    <section class="bento-grid" aria-label="Parent dashboard overview">
      <article class="card screening-card">
        <div class="progress-wrap" aria-label="Screening progress 65 percent">
          <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <circle cx="60" cy="60" r="48" class="progress-track"></circle>
            <circle cx="60" cy="60" r="48" class="progress-value"></circle>
          </svg>
          <div>
            <strong>65%</strong>
            <span>Progress</span>
          </div>
        </div>

        <div class="screening-copy">
          <span class="status-pill">Status: Active Review</span>
          <h2>Moderate support recommended</h2>
          <p>
            Last screening completed on January 15, 2024. Your care team is currently reviewing
            these results for a personalized roadmap.
          </p>
          <a class="primary-button" routerLink="/screening">View results</a>
        </div>
      </article>

      <article class="card weekly-card">
        <div class="section-title">
          <h2>Weekly Progress</h2>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M4 17 9 12l3 3 7-8M16 7h3v3"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.2"
            />
          </svg>
        </div>
        <div class="bar-chart" aria-label="3 activities completed this week">
          @for (height of weeklyBars; track $index) {
            <span [style.--bar-height.%]="height" [class.active]="height === 100">
              @if (height === 100) {
                <strong>3</strong>
              }
            </span>
          }
        </div>
        <p><strong>3 activities</strong> completed this week. You're on track for your goal!</p>
      </article>

      <article class="card action-card">
        <div class="soft-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path
              d="M5 6h14v9H8l-3 3V6Z"
              fill="none"
              stroke="currentColor"
              stroke-linejoin="round"
              stroke-width="2"
            />
            <path d="M8 10h8M8 13h5" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
          </svg>
        </div>
        <h2>Next Recommended Action</h2>
        <p>
          Based on {{ selectedChild()?.firstName || 'your child' }}'s latest screening, explore new
          communication activities tailored for social engagement.
        </p>
        <a class="text-link" routerLink="/activities">
          Explore communication activities
          <span aria-hidden="true">-&gt;</span>
        </a>
      </article>

      <article class="card appointment-card">
        <div class="appointment-top">
          <span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
            Upcoming Appointment
          </span>
          <strong>Confirmed</strong>
        </div>
        <h2>Angkor Children's Hospital</h2>
        <p>Developmental Assessment with Dr. Somat</p>
        <div class="appointment-meta">
          <span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
            Feb 1, 2024
          </span>
          <span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
            09:30 AM
          </span>
        </div>
      </article>
    </section>

    @if (!selectedChild() && !childrenLoading()) {
      <section class="empty-state">
        <h2>Personalize your dashboard</h2>
        <p>Add your first child profile to connect screenings, activities, school reports, and care notes.</p>
        <a class="primary-button" routerLink="/children">Open child profiles</a>
      </section>
    }

    <section class="quick-actions" aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title">Quick Actions</h2>
      <div>
        @for (action of quickActions; track action.path) {
          <a class="quick-card" [routerLink]="action.path">
            <span class="quick-icon" [class]="action.icon" aria-hidden="true"></span>
            <span>
              <strong>{{ action.title }}</strong>
              <small>{{ action.description }}</small>
            </span>
          </a>
        }
      </div>
    </section>

    <footer class="dashboard-footer">
      <section>
        <h2>AutiCare</h2>
        <p>Supporting neurodiverse families with personalized care paths and professional resources.</p>
      </section>
      <section>
        <h3>Support</h3>
        <a routerLink="/support">Emergency Resources</a>
        <a routerLink="/support">Medical Disclaimer</a>
        <a routerLink="/support">Contact Support</a>
      </section>
      <section>
        <h3>Quick Links</h3>
        <a routerLink="/privacy">Privacy Policy</a>
        <a routerLink="/terms">Terms of Service</a>
      </section>
      <section>
        <h3>Stay Connected</h3>
        <div class="social-row" aria-label="Community links">
          <a routerLink="/support" aria-label="Share AutiCare">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm12 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM8.7 16.3l6.6-3.6M8.7 18.7l6.6 2.6"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </a>
          <a routerLink="/support" aria-label="Open community support">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 20v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1M12 20v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </a>
        </div>
        <p class="copyright">(c) 2024 AutiCare. All rights reserved.</p>
      </section>
    </footer>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 1160px;
        margin: 0 auto;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 28px;
        margin-bottom: 50px;
      }

      .dashboard-header h1 {
        color: #315d72;
        font-size: 44px;
        line-height: 1.15;
        font-weight: 800;
        letter-spacing: 0;
      }

      .dashboard-header p {
        margin-top: 12px;
        color: #263238;
        font-size: 17px;
        line-height: 1.55;
      }

      .child-switcher {
        min-width: 230px;
        border: 1px solid #b8c2c8;
        border-radius: 24px;
        background: #e8f6ff;
        color: #001e2b;
        display: grid;
        grid-template-columns: 50px minmax(0, 1fr) 20px;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        text-decoration: none;
      }

      .child-switcher.empty {
        grid-template-columns: 50px minmax(0, 1fr);
      }

      .child-avatar {
        width: 50px;
        height: 50px;
        border-radius: 999px;
        background: #d7e9c0;
        color: #3d4b2d;
        display: grid;
        place-items: center;
        font-weight: 900;
        font-size: 20px;
      }

      .child-switcher strong,
      .child-switcher small {
        display: block;
      }

      .child-switcher strong {
        font-size: 16px;
        line-height: 1.2;
      }

      .child-switcher small {
        margin-top: 4px;
        color: #164f68;
        font-weight: 700;
      }

      .child-switcher svg {
        width: 20px;
        height: 20px;
      }

      .error {
        border-radius: 12px;
        background: #ffdad6;
        color: #93000a;
        padding: 14px 16px;
        margin-bottom: 20px;
      }

      .bento-grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: 26px;
      }

      .card {
        border: 1px solid rgb(221 229 228 / 0.72);
        border-radius: 24px;
        background: #ffffff;
        box-shadow: 0 12px 34px rgb(41 74 90 / 0.07);
        padding: 28px;
      }

      .screening-card {
        grid-column: span 8;
        min-height: 310px;
        display: grid;
        grid-template-columns: 176px minmax(0, 1fr);
        align-items: center;
        gap: 38px;
      }

      .progress-wrap {
        position: relative;
        width: 150px;
        height: 150px;
      }

      .progress-wrap svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .progress-track,
      .progress-value {
        fill: none;
        stroke-width: 10;
      }

      .progress-track {
        stroke: #e7eedf;
      }

      .progress-value {
        stroke: #a8b993;
        stroke-linecap: butt;
        stroke-dasharray: 301.59;
        stroke-dashoffset: 105.56;
      }

      .progress-wrap div {
        position: absolute;
        inset: 0;
        display: grid;
        place-content: center;
        justify-items: center;
        color: #4d5f3d;
      }

      .progress-wrap strong {
        font-size: 30px;
        line-height: 1;
      }

      .progress-wrap span {
        margin-top: 6px;
        text-transform: uppercase;
        font-size: 11px;
        font-weight: 800;
      }

      .screening-copy {
        display: grid;
        justify-items: start;
        gap: 14px;
      }

      .status-pill {
        border-radius: 999px;
        background: #d7e9c0;
        color: #4d5f3d;
        padding: 6px 14px;
        font-size: 13px;
        line-height: 1.1;
        font-weight: 800;
      }

      .screening-copy h2,
      .action-card h2,
      .appointment-card h2 {
        color: #001e2b;
        font-size: 30px;
        line-height: 1.34;
        font-weight: 700;
        letter-spacing: 0;
      }

      .screening-copy p,
      .action-card p,
      .appointment-card p,
      .weekly-card p {
        color: #41484b;
        font-size: 16px;
        line-height: 1.58;
      }

      .primary-button {
        min-height: 46px;
        border-radius: 12px;
        background: #3d6375;
        color: #ffffff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 26px;
        text-decoration: none;
        font-weight: 700;
      }

      .weekly-card {
        grid-column: span 4;
        min-height: 310px;
        display: grid;
        align-content: space-between;
        gap: 18px;
      }

      .section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        color: #164f68;
      }

      .section-title h2 {
        font-size: 18px;
        line-height: 1.3;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0;
      }

      .section-title svg {
        width: 26px;
        height: 26px;
      }

      .bar-chart {
        height: 160px;
        display: flex;
        align-items: end;
        justify-content: center;
        gap: 12px;
        padding-top: 26px;
      }

      .bar-chart span {
        position: relative;
        width: 34px;
        height: var(--bar-height);
        min-height: 2px;
        border-radius: 10px 10px 0 0;
        background: #ceedff;
      }

      .bar-chart span.active {
        background: #3d6375;
      }

      .bar-chart strong {
        position: absolute;
        left: 50%;
        top: -26px;
        color: #164f68;
        transform: translateX(-50%);
      }

      .weekly-card p {
        text-align: center;
      }

      .weekly-card p strong {
        color: #001e2b;
      }

      .action-card {
        position: relative;
        overflow: hidden;
        grid-column: span 6;
        min-height: 300px;
        display: grid;
        align-content: center;
        gap: 20px;
      }

      .action-card::after {
        content: '';
        position: absolute;
        right: -40px;
        top: -40px;
        width: 180px;
        height: 180px;
        border-radius: 0 0 0 180px;
        background: #e7eedf;
        opacity: 0.44;
      }

      .soft-icon {
        width: 58px;
        height: 58px;
        border-radius: 999px;
        background: #d7e9c0;
        color: #5a6949;
        display: grid;
        place-items: center;
      }

      .soft-icon svg {
        width: 30px;
        height: 30px;
      }

      .text-link {
        color: #164f68;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        font-weight: 800;
      }

      .text-link:hover {
        text-decoration: underline;
      }

      .appointment-card {
        grid-column: span 6;
        min-height: 300px;
        border-color: #b6dceb;
        background: #e8f6ff;
        display: grid;
        align-content: center;
        gap: 18px;
      }

      .appointment-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .appointment-top span,
      .appointment-meta span {
        color: #164f68;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 800;
        text-transform: uppercase;
      }

      .appointment-top svg,
      .appointment-meta svg {
        width: 18px;
        height: 18px;
      }

      .appointment-top strong {
        border-radius: 999px;
        background: #5a6949;
        color: #ffffff;
        padding: 6px 14px;
        font-size: 13px;
      }

      .appointment-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
      }

      .appointment-meta span {
        color: #001e2b;
        font-size: 14px;
        text-transform: none;
      }

      .empty-state {
        margin-top: 26px;
        border: 1px solid #c1c7cc;
        border-radius: 8px;
        background: #ffffff;
        padding: 24px;
        display: grid;
        justify-items: start;
        gap: 12px;
      }

      .empty-state h2 {
        color: #001e2b;
        font-size: 24px;
      }

      .empty-state p {
        color: #41484b;
        line-height: 1.55;
      }

      .quick-actions {
        margin-top: 58px;
      }

      .quick-actions h2 {
        color: #001e2b;
        font-size: 30px;
        line-height: 1.25;
        margin-bottom: 28px;
      }

      .quick-actions > div {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 26px;
      }

      .quick-card {
        min-height: 126px;
        border: 1px solid rgb(221 229 228 / 0.72);
        border-radius: 24px;
        background: #ffffff;
        color: #001e2b;
        box-shadow: 0 12px 34px rgb(41 74 90 / 0.06);
        display: grid;
        grid-template-columns: 58px minmax(0, 1fr);
        align-items: center;
        gap: 18px;
        padding: 22px 26px;
        text-decoration: none;
      }

      .quick-card:hover {
        border-color: #8db4c8;
      }

      .quick-card strong,
      .quick-card small {
        display: block;
      }

      .quick-card strong {
        font-size: 18px;
        line-height: 1.3;
        font-weight: 700;
      }

      .quick-card small {
        margin-top: 4px;
        color: #41484b;
        line-height: 1.35;
      }

      .quick-icon {
        width: 50px;
        height: 50px;
        border-radius: 999px;
        background: #ceedff;
        color: #3d6375;
        display: grid;
        place-items: center;
        position: relative;
      }

      .quick-icon::before,
      .quick-icon::after {
        content: '';
        position: absolute;
        box-sizing: border-box;
      }

      .screening::before {
        width: 18px;
        height: 22px;
        border: 2px solid currentColor;
        border-radius: 3px;
      }

      .screening::after {
        width: 10px;
        height: 7px;
        border-left: 2px solid currentColor;
        border-bottom: 2px solid currentColor;
        transform: rotate(-45deg);
      }

      .school::before {
        width: 20px;
        height: 14px;
        border: 2px solid currentColor;
        transform: rotate(45deg) skew(-10deg, -10deg);
      }

      .hospital::before {
        width: 22px;
        height: 22px;
        border: 2px solid currentColor;
        border-radius: 3px;
      }

      .hospital::after {
        width: 12px;
        height: 2px;
        background: currentColor;
        box-shadow: 0 0 0 0 currentColor;
        transform: rotate(90deg);
      }

      .activity::before {
        width: 18px;
        height: 18px;
        border: 2px solid currentColor;
        border-radius: 5px;
      }

      .activity::after {
        width: 8px;
        height: 8px;
        border: 2px solid currentColor;
        border-radius: 3px;
        background: #ceedff;
        transform: translate(8px, -8px);
      }

      .dashboard-footer {
        margin-top: 92px;
        border-top: 1px solid #c1c7cc;
        padding: 54px 0 24px;
        display: grid;
        grid-template-columns: 1.4fr 1fr 1fr 1.25fr;
        gap: 48px;
      }

      .dashboard-footer h2 {
        color: #315d72;
        font-size: 30px;
        line-height: 1.2;
      }

      .dashboard-footer h3 {
        color: #001e2b;
        font-size: 17px;
        line-height: 1.2;
        margin-bottom: 18px;
      }

      .dashboard-footer p,
      .dashboard-footer a {
        color: #41484b;
        font-size: 16px;
        line-height: 1.55;
      }

      .dashboard-footer a {
        display: block;
        text-decoration: none;
        margin-bottom: 10px;
      }

      .dashboard-footer a:hover {
        color: #164f68;
        text-decoration: underline;
      }

      .social-row {
        display: flex;
        gap: 14px;
      }

      .social-row a {
        width: 46px;
        height: 46px;
        border-radius: 999px;
        background: #ceedff;
        color: #164f68;
        display: grid;
        place-items: center;
      }

      .social-row svg {
        width: 22px;
        height: 22px;
      }

      .copyright {
        margin-top: 12px;
        font-size: 13px !important;
      }

      @media (max-width: 1180px) {
        .screening-card,
        .weekly-card,
        .action-card,
        .appointment-card {
          grid-column: span 12;
        }

        .weekly-card {
          min-height: 260px;
        }

        .quick-actions > div,
        .dashboard-footer {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 720px) {
        .dashboard-header {
          flex-direction: column;
          margin-bottom: 30px;
        }

        .dashboard-header h1 {
          font-size: 34px;
        }

        .dashboard-header p {
          font-size: 16px;
        }

        .child-switcher {
          width: 100%;
        }

        .bento-grid {
          gap: 18px;
        }

        .card {
          border-radius: 18px;
          padding: 22px;
        }

        .weekly-card {
          min-height: auto;
        }

        .bar-chart {
          height: 112px;
          gap: 10px;
          padding-top: 22px;
        }

        .bar-chart span {
          width: 30px;
        }

        .screening-card {
          grid-template-columns: 1fr;
          justify-items: center;
          text-align: center;
          gap: 22px;
          margin-bottom: 148px;
        }

        .screening-copy {
          justify-items: center;
        }

        .screening-copy h2,
        .action-card h2,
        .appointment-card h2 {
          font-size: 26px;
        }

        .appointment-top {
          align-items: flex-start;
          flex-direction: column;
        }

        .quick-actions {
          margin-top: 42px;
        }

        .quick-actions h2 {
          font-size: 27px;
        }

        .quick-actions > div,
        .dashboard-footer {
          grid-template-columns: 1fr;
        }

        .quick-card {
          min-height: 100px;
          border-radius: 18px;
        }

        .dashboard-footer {
          margin-top: 62px;
          gap: 26px;
          padding-bottom: 16px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly childrenApi = inject(ChildrenApi);

  protected readonly quickActions = quickActions;
  protected readonly weeklyBars = [40, 70, 100, 20, 2, 2, 2] as const;
  protected readonly children = signal<readonly ChildResponse[]>([]);
  protected readonly childrenLoading = signal(false);
  protected readonly childrenError = signal<string | null>(null);
  protected readonly parent = this.auth.parent;
  protected readonly selectedChild = computed(() => this.children().find((child) => !child.archivedAt) ?? null);
  protected readonly parentFirstName = computed(() => this.parent()?.firstName || 'there');

  ngOnInit() {
    if (!this.parent()) this.auth.loadCurrentUser().subscribe();
    this.loadChildren();
  }

  protected dayPart(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  protected childInitials(child: ChildResponse): string {
    return child.firstName.slice(0, 2).toUpperCase();
  }

  protected ageLabel(dateOfBirth: string): string {
    const birthDate = new Date(`${dateOfBirth}T00:00:00`);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
      years -= 1;
    }
    const safeYears = Math.max(years, 0);
    return safeYears === 1 ? 'age 1' : `age ${safeYears}`;
  }

  private loadChildren() {
    this.childrenLoading.set(true);
    this.childrenError.set(null);
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        this.childrenLoading.set(false);
      },
      error: () => {
        this.childrenError.set('Child profiles could not be loaded.');
        this.childrenLoading.set(false);
      },
    });
  }
}
