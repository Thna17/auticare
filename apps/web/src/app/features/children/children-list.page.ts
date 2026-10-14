import type { OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ChildResponse, RiskLevel } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { ChildrenFacade } from './state/children.facade';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { ScreeningApi } from '../screening/data-access/screening.api';
import { ScreeningBadgeComponent } from '../screening/components/screening-badge.component';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  standalone: true,
  imports: [
    RouterLink,
    UiEmptyStateComponent,
    UiMessageComponent,
    UiSpinnerComponent,
    ScreeningBadgeComponent,
  ],
  template: `
    <section class="page-header">
      <div class="header-intro">
        <p class="eyebrow">
          {{ currentLang() === 'km' ? 'ប្រវត្តិរូបគ្រួសារ និងការថែទាំ' : 'Family Profiles & Care' }}
        </p>
        <div class="title-with-badge">
          <h1>{{ currentLang() === 'km' ? 'កុមារ' : 'Children' }}</h1>
          @if (!facade.loading() && facade.children().length > 0) {
            <span class="child-count-pill">
              {{ activeChildrenCount() }}
              {{ currentLang() === 'km' ? 'បានចុះឈ្មោះ' : 'registered' }}
            </span>
          }
        </div>
        <p class="subtitle">
          {{
            currentLang() === 'km'
              ? 'គ្រប់គ្រងប្រវត្តិរូប តាមដានគន្លងការលូតលាស់ និងសម្របសម្រួលការថែទាំគ្លីនិកសម្រាប់កុមារម្នាក់ៗ។'
              : 'Manage profiles, track developmental trajectories, and coordinate clinical care for each child.'
          }}
        </p>
      </div>
      <div class="header-actions">
        <button
          type="button"
          class="toggle-archived"
          [class.active]="showArchived()"
          (click)="toggleArchived()"
        >
          {{
            showArchived()
              ? currentLang() === 'km'
                ? 'លាក់ប្រវត្តិរូបក្នុងបណ្ណសារ'
                : 'Hide archived profiles'
              : currentLang() === 'km'
                ? 'មើលប្រវត្តិរូបក្នុងបណ្ណសារ'
                : 'View archived profiles'
          }}
        </button>
        @if (canCreateChildren()) {
          <a class="create-child-btn" routerLink="/children/new">
            <span class="plus-icon" aria-hidden="true">+</span>
            <span>{{ currentLang() === 'km' ? 'បន្ថែមទិន្នន័យកុមារ' : 'Add Child' }}</span>
          </a>
        }
      </div>
    </section>

    @if (facade.loading()) {
      <div class="state-center">
        <ac-ui-spinner
          [label]="
            currentLang() === 'km' ? 'កំពុងផ្ទុកប្រវត្តិរូបកុមារ…' : 'Loading children profiles…'
          "
        />
      </div>
    } @else if (facade.error()) {
      <ac-ui-message tone="error">{{ facade.error() }}</ac-ui-message>
    } @else if (facade.children().length === 0) {
      <div class="empty-wrapper">
        <ac-ui-empty-state
          icon="👶"
          [title]="
            currentLang() === 'km' ? 'មិនទាន់មានប្រវត្តិរូបកុមារនៅឡើយទេ' : 'No child profiles yet'
          "
          [message]="
            currentLang() === 'km'
              ? 'បង្កើតប្រវត្តិរូបកូនរបស់អ្នក ដើម្បីតាមដានដំណាក់កាលអភិវឌ្ឍន៍ ការវាយតម្លៃស្គ្រីនីង និងផែនការគាំទ្រគ្លីនិក។'
              : 'Create a child profile to track developmental milestones, screening assessments, and clinical support plans.'
          "
        >
          @if (canCreateChildren()) {
            <a class="empty-action-btn" routerLink="/children/new">
              <span aria-hidden="true">+</span>
              {{ currentLang() === 'km' ? 'បង្កើតប្រវត្តិរូបកុមារ' : 'Create Child Profile' }}
            </a>
          }
        </ac-ui-empty-state>
      </div>
    } @else {
      <section
        class="child-grid"
        [attr.aria-label]="currentLang() === 'km' ? 'ប្រវត្តិរូបកុមារ' : 'Child profiles'"
      >
        @for (child of facade.children(); track child.id) {
          <article class="child-card" [class.archived]="child.archivedAt">
            <div class="card-header-row">
              <div class="avatar" [style.background]="getAvatarGradient(child)" aria-hidden="true">
                {{ initials(child) }}
              </div>
              <div class="card-identity">
                <div class="title-row">
                  <h2>{{ fullName(child) }}</h2>
                  @if (child.archivedAt) {
                    <span class="archived-badge">
                      {{ currentLang() === 'km' ? 'ទុកក្នុងបណ្ណសារ' : 'Archived' }}
                    </span>
                  }
                </div>
                <p class="age-text">
                  <strong>{{ ageLabel(child.dateOfBirth) }}</strong>
                  <span class="birth-dot">&bull;</span>
                  <span>
                    {{ currentLang() === 'km' ? 'កើតថ្ងៃទី ' : 'Born ' }}{{ child.dateOfBirth }}
                  </span>
                </p>
              </div>
            </div>

            <div class="card-body">
              <div class="status-badge-row">
                <ac-screening-badge [tone]="getScreeningTone(child.id)">
                  {{ getScreeningBadgeLabel(child.id) }}
                </ac-screening-badge>
              </div>

              <div class="notes-box">
                @if (child.notes) {
                  <p class="notes-text">{{ child.notes }}</p>
                } @else {
                  <p class="notes-text muted">
                    {{
                      currentLang() === 'km'
                        ? 'មិនទាន់មានកំណត់ត្រាគាំទ្រនៅឡើយទេ។'
                        : 'No support notes recorded yet.'
                    }}
                  </p>
                }
              </div>

              <!-- Quick Clinical Navigation Shortcuts -->
              <div class="quick-shortcuts">
                <a
                  class="shortcut-chip"
                  routerLink="/screening"
                  [queryParams]="{ childId: child.id }"
                  [title]="currentLang() === 'km' ? 'ការវាយតម្លៃស្គ្រីនីង' : 'Screening assessment'"
                >
                  <span class="shortcut-icon" aria-hidden="true">📋</span>
                  <span>{{ currentLang() === 'km' ? 'ការវាយតម្លៃ' : 'Screening' }}</span>
                </a>
                <a
                  class="shortcut-chip"
                  routerLink="/progress"
                  [queryParams]="{ childId: child.id }"
                  [title]="
                    currentLang() === 'km' ? 'ការវិវត្តនៃការលូតលាស់' : 'Developmental progress'
                  "
                >
                  <span class="shortcut-icon" aria-hidden="true">📈</span>
                  <span>{{ currentLang() === 'km' ? 'ការវិវត្ត' : 'Progress' }}</span>
                </a>
                <a
                  class="shortcut-chip"
                  routerLink="/activities"
                  [queryParams]="{ childId: child.id }"
                  [title]="
                    currentLang() === 'km' ? 'សកម្មភាពអភិវឌ្ឍន៍' : 'Developmental activities'
                  "
                >
                  <span class="shortcut-icon" aria-hidden="true">🎯</span>
                  <span>{{ currentLang() === 'km' ? 'សកម្មភាព' : 'Activities' }}</span>
                </a>
              </div>
            </div>

            <div class="card-actions">
              @if (child.archivedAt) {
                <button
                  type="button"
                  class="restore-btn"
                  [disabled]="restoringId() === child.id"
                  (click)="restore(child.id)"
                >
                  {{
                    restoringId() === child.id
                      ? currentLang() === 'km'
                        ? 'កំពុងស្តារឡើងវិញ…'
                        : 'Restoring…'
                      : currentLang() === 'km'
                        ? 'ស្តារឡើងវិញ'
                        : 'Restore'
                  }}
                </button>
              }
              <a class="profile-link" [routerLink]="['/children', child.id]">
                <span>
                  {{ currentLang() === 'km' ? 'មើលប្រវត្តិរូបពេញលេញ' : 'View Full Profile' }}
                </span>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M5 12h13M13 6l6 6-6 6"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.4"
                  />
                </svg>
              </a>
            </div>
          </article>
        }
        @if (canCreateChildren()) {
          <a
            class="add-child-dashed-card"
            routerLink="/children/new"
            aria-label="Add Another Child"
          >
            <div class="dashed-card-icon" aria-hidden="true">+</div>
            <strong class="dashed-card-title">Add Another Child</strong>
            <p class="dashed-card-desc">
              Create another profile to track developmental milestones and care plans.
            </p>
          </a>
        }
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        margin-bottom: 32px;
        flex-wrap: wrap;
      }

      .header-intro {
        max-width: 680px;
      }

      .eyebrow {
        margin: 0 0 6px;
        color: var(--ac-color-action-mid);
        font-size: var(--ac-type-meta);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .title-with-badge {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      h1 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-tight);
        font-weight: 700;
      }

      .child-count-pill {
        display: inline-flex;
        align-items: center;
        padding: 4px 12px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action-deep);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .subtitle {
        margin: 10px 0 0;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .toggle-archived {
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-slate);
        border-radius: var(--ac-radius-md);
        min-height: 44px;
        padding: 0 16px;
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        transition: all var(--ac-motion-fast);
      }

      .toggle-archived:hover {
        background: var(--ac-color-tint-blue-wash);
        border-color: var(--ac-color-border-info);
        color: var(--ac-color-action-deep);
      }

      .toggle-archived.active {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
        color: var(--ac-color-action-deep);
      }

      .create-child-btn,
      .empty-action-btn {
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 20px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 700;
        box-shadow: var(--ac-shadow-sm);
        transition: all var(--ac-motion-fast);
      }

      .create-child-btn:hover,
      .empty-action-btn:hover {
        background: var(--ac-color-action-deep);
        box-shadow: var(--ac-shadow-hover);
        transform: translateY(-1px);
      }

      .plus-icon {
        font-size: 16px;
        line-height: 1;
      }

      .state-center {
        display: flex;
        justify-content: center;
        padding: 64px 0;
      }

      .empty-wrapper {
        margin-top: 16px;
      }

      .empty-action-btn {
        margin-top: 20px;
      }

      .child-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 22px;
      }

      .child-card {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: 22px;
        display: flex;
        flex-direction: column;
        gap: 18px;
        transition:
          transform var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .child-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--ac-shadow-hover);
        border-color: var(--ac-color-border-info);
      }

      .child-card.archived {
        opacity: 0.8;
        background: var(--ac-color-slate-50);
      }

      .add-child-dashed-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: var(--ac-space-8) var(--ac-space-6);
        border: 2px dashed var(--ac-color-border-grey);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-tint-blue-wash);
        color: var(--ac-color-text-strong);
        text-decoration: none;
        min-height: 280px;
        transition:
          background var(--ac-motion-fast),
          border-color var(--ac-motion-fast),
          transform var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast);
      }

      .add-child-dashed-card:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
        transform: translateY(-2px);
        box-shadow: var(--ac-shadow-hover);
      }

      .dashed-card-icon {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action);
        display: grid;
        place-items: center;
        font-size: 26px;
        font-weight: 700;
        margin-bottom: var(--ac-space-3);
        box-shadow: var(--ac-shadow-xs);
      }

      .dashed-card-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        margin-bottom: var(--ac-space-1);
      }

      .dashed-card-desc {
        font-size: 13px;
        color: var(--ac-color-text-muted);
        max-width: 240px;
        line-height: 1.4;
        margin: 0;
      }

      .card-header-row {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .avatar {
        width: 60px;
        height: 60px;
        border-radius: var(--ac-radius-md);
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
        font-size: 20px;
        font-weight: 700;
        flex: 0 0 auto;
        box-shadow: var(--ac-shadow-xs);
      }

      .card-identity {
        flex: 1;
        min-width: 0;
      }

      .title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 18px;
        line-height: 1.3;
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .archived-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-slate-200);
        color: var(--ac-color-text-slate);
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .age-text {
        margin: 4px 0 0;
        color: var(--ac-color-text-muted);
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .age-text strong {
        color: var(--ac-color-text-strong);
        font-weight: 600;
      }

      .birth-dot {
        font-size: 10px;
        color: var(--ac-color-border-grey);
      }

      .card-body {
        display: flex;
        flex-direction: column;
        gap: 14px;
        flex: 1;
      }

      .status-badge-row {
        display: flex;
        align-items: center;
      }

      .notes-box {
        min-height: 58px;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-subtle);
        padding: 12px 14px;
        display: flex;
        align-items: center;
      }

      .notes-text {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .notes-text.muted {
        color: var(--ac-color-text-muted);
        font-style: italic;
      }

      .quick-shortcuts {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .shortcut-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 10px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        color: var(--ac-color-text-slate);
        text-decoration: none;
        font-size: 12px;
        font-weight: 600;
        transition: all var(--ac-motion-fast);
      }

      .shortcut-chip:hover {
        border-color: var(--ac-color-action);
        color: var(--ac-color-action-deep);
        background: var(--ac-color-tint-blue-wash);
      }

      .shortcut-icon {
        font-size: 12px;
      }

      .card-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: auto;
        padding-top: 14px;
        border-top: 1px solid var(--ac-color-border);
      }

      .profile-link {
        margin-left: auto;
        min-height: 38px;
        border-radius: var(--ac-radius-sm);
        color: var(--ac-color-action-deep);
        display: inline-flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        font-size: 13px;
        font-weight: 700;
        padding: 0 4px;
        transition: gap var(--ac-motion-fast);
      }

      .profile-link svg {
        width: 16px;
        height: 16px;
        transition: transform var(--ac-motion-fast);
      }

      .profile-link:hover {
        gap: 12px;
      }

      .profile-link:hover svg {
        transform: translateX(3px);
      }

      .restore-btn {
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-action);
        border-radius: var(--ac-radius-pill);
        padding: 5px 14px;
        font: inherit;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all var(--ac-motion-fast);
      }

      .restore-btn:hover:not(:disabled) {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      @media (max-width: 640px) {
        .page-header {
          flex-direction: column;
          align-items: stretch;
        }

        .header-actions {
          flex-direction: column;
          align-items: stretch;
        }

        .toggle-archived,
        .create-child-btn {
          width: 100%;
        }

        .child-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildrenListPage implements OnInit {
  readonly facade = inject(ChildrenFacade);
  private readonly auth = inject(AuthService);
  private readonly screeningApi = inject(ScreeningApi);
  private readonly i18n = inject(I18nService);
  protected readonly currentLang = this.i18n.currentLang;

  readonly canCreateChildren = computed(() => this.auth.parent()?.role === 'PARENT');
  readonly showArchived = signal(false);
  readonly restoringId = signal<string | null>(null);
  readonly screeningRiskMap = signal<Record<string, RiskLevel | null>>({});

  readonly activeChildrenCount = computed(
    () => this.facade.children().filter((c) => !c.archivedAt).length,
  );

  constructor() {
    effect(() => {
      const children = this.facade.children();
      const currentMap = untracked(() => this.screeningRiskMap());
      for (const child of children) {
        if (!(child.id in currentMap)) {
          this.loadScreeningStatus(child.id);
        }
      }
    });
  }

  ngOnInit() {
    this.facade.load();
  }

  private loadScreeningStatus(childId: string) {
    this.screeningApi.listSessions(childId).subscribe({
      next: (sessions) => {
        const completed = sessions.find((s) => s.result !== null);
        const risk = completed?.result?.riskLevel ?? null;
        this.screeningRiskMap.update((map) => ({ ...map, [childId]: risk }));
      },
      error: () => {
        this.screeningRiskMap.update((map) => ({ ...map, [childId]: null }));
      },
    });
  }

  getScreeningTone(childId: string): 'positive' | 'caution' | 'alert' | 'neutral' {
    const risk = this.screeningRiskMap()[childId];
    if (risk === 'LOW') return 'positive';
    if (risk === 'MODERATE') return 'caution';
    if (risk === 'HIGH') return 'alert';
    return 'neutral';
  }

  getScreeningBadgeLabel(childId: string): string {
    const isKm = this.currentLang() === 'km';
    const risk = this.screeningRiskMap()[childId];
    if (risk === 'LOW') return isKm ? 'បានវាយតម្លៃ៖ ហានិភ័យទាប' : 'Screened: Low Risk';
    if (risk === 'MODERATE') return isKm ? 'បានវាយតម្លៃ៖ ហានិភ័យមធ្យម' : 'Screened: Moderate Risk';
    if (risk === 'HIGH') return isKm ? 'បានវាយតម្លៃ៖ ហានិភ័យខ្ពស់' : 'Screened: High Risk';
    return isKm ? 'ណែនាំឱ្យធ្វើការវាយតម្លៃ' : 'Screening Recommended';
  }

  toggleArchived() {
    const next = !this.showArchived();
    this.showArchived.set(next);
    this.facade.load(next);
  }

  restore(childId: string) {
    this.restoringId.set(childId);
    this.facade.restore(childId).subscribe({
      next: () => this.restoringId.set(null),
      error: () => this.restoringId.set(null),
    });
  }

  fullName(child: ChildResponse): string {
    return [child.firstName, child.lastName].filter(Boolean).join(' ');
  }

  initials(child: ChildResponse): string {
    const parts = [child.firstName, child.lastName].filter(Boolean) as string[];
    const [first, second] = parts;
    if (first && second) {
      return (first.charAt(0) + second.charAt(0)).toUpperCase();
    }
    return child.firstName.slice(0, 2).toUpperCase();
  }

  getAvatarGradient(child: ChildResponse): string {
    const gradients = [
      'linear-gradient(135deg, var(--ac-color-teal-slate), var(--ac-color-sky-soft))',
      'linear-gradient(135deg, var(--ac-color-olive-mid), var(--ac-color-olive-light))',
      'linear-gradient(135deg, var(--ac-color-status-purple), var(--ac-color-tint-blue-mist))',
      'linear-gradient(135deg, var(--ac-color-accent-amber), var(--ac-color-tint-blue))',
    ];
    const key = child.id || child.firstName;
    const index = key.charCodeAt(0) % gradients.length;
    return gradients[index];
  }

  ageLabel(dateOfBirth: string): string {
    const birthDate = new Date(`${dateOfBirth}T00:00:00`);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (today.getDate() < birthDate.getDate()) {
      months -= 1;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    const safeYears = Math.max(years, 0);
    const safeMonths = Math.max(months, 0);
    const isKm = this.currentLang() === 'km';
    if (isKm) {
      if (safeYears > 0 && safeMonths > 0) return `${safeYears} ឆ្នាំ ${safeMonths} ខែ`;
      if (safeYears > 0) return `${safeYears} ឆ្នាំ`;
      return `${safeMonths} ខែ`;
    }
    if (safeYears > 0 && safeMonths > 0) {
      return `${safeYears} ${safeYears === 1 ? 'year' : 'years'} ${safeMonths} ${safeMonths === 1 ? 'month' : 'months'}`;
    }
    if (safeYears > 0) {
      return safeYears === 1 ? '1 year old' : `${safeYears} years old`;
    }
    return safeMonths === 1 ? '1 month old' : `${safeMonths} months old`;
  }
}
