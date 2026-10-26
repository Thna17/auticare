import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ChildResponse } from '@auticare/contracts';
import { I18nService } from '../../core/i18n/i18n.service';
import { AuthService } from '../../core/auth/auth.service';
import { ChildrenApi } from '../children/data-access/children.api';

const COPY = {
  en: {
    eyebrow: 'Profile',
    title: 'Who we are',
    subtitle: 'Your child’s details and your own account, in one place.',
    childSection: 'Child',
    accountSection: 'Your account',
    noChildTitle: 'No child profile yet',
    noChildBody: 'Add your child so the activities, screening and documents can follow their age.',
    addChild: 'Add a child',
    editChild: 'Edit details',
    openChild: 'Open profile',
    born: 'Born',
    age: 'Age',
    notes: 'Notes',
    noNotes: 'No notes yet.',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    notSet: 'Not set',
    editAccount: 'Account settings',
    years: (years: number, months: number) => `${years} years ${months} months`,
    monthsOnly: (months: number) => `${months} months`,
  },
  km: {
    eyebrow: 'ព័ត៌មានផ្ទាល់ខ្លួន',
    title: 'យើងជានរណា',
    subtitle: 'ព័ត៌មានលម្អិតរបស់កូន និងគណនីរបស់អ្នក នៅកន្លែងតែមួយ។',
    childSection: 'កុមារ',
    accountSection: 'គណនីរបស់អ្នក',
    noChildTitle: 'មិនទាន់មានប្រវត្តិរូបកុមារទេ',
    noChildBody: 'បន្ថែមព័ត៌មានកូន ដើម្បីឱ្យសកម្មភាព ការវាយតម្លៃ និងឯកសារតាមអាយុរបស់គាត់។',
    addChild: 'បន្ថែមកុមារ',
    editChild: 'កែព័ត៌មាន',
    openChild: 'បើកប្រវត្តិរូប',
    born: 'កើតនៅ',
    age: 'អាយុ',
    notes: 'កំណត់ចំណាំ',
    noNotes: 'មិនទាន់មានកំណត់ចំណាំទេ។',
    name: 'ឈ្មោះ',
    email: 'អ៊ីមែល',
    phone: 'លេខទូរស័ព្ទ',
    notSet: 'មិនបានកំណត់',
    editAccount: 'ការកំណត់គណនី',
    years: (years: number, months: number) => `${years} ឆ្នាំ ${months} ខែ`,
    monthsOnly: (months: number) => `${months} ខែ`,
  },
};

/**
 * Profile is a read-in-one-place view: the child the app is currently working
 * with, and the parent's own account. Editing stays on the screens that already
 * own it (/children/:id and /settings) so there is one editor per thing.
 */
@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="page-head">
      <p class="eyebrow">{{ copy().eyebrow }}</p>
      <h1>{{ copy().title }}</h1>
      <p class="subtitle">{{ copy().subtitle }}</p>
    </header>

    <section class="panel" aria-labelledby="child-heading">
      <div class="panel-head">
        <h2 id="child-heading">{{ copy().childSection }}</h2>
        <a routerLink="/children/new" class="link">{{ copy().addChild }}</a>
      </div>

      @if (child(); as kid) {
        <div class="child-row">
          <span class="avatar" aria-hidden="true">{{ initials(kid) }}</span>
          <div class="child-meta">
            <p class="child-name">{{ kid.firstName }} {{ kid.lastName ?? '' }}</p>
            <p class="muted">
              {{ copy().age }}: {{ childAge(kid) }} · {{ copy().born }}: {{ kid.dateOfBirth }}
            </p>
          </div>
          <div class="row-actions">
            <a class="ghost" [routerLink]="['/children', kid.id]">{{ copy().openChild }}</a>
            <a class="ghost" [routerLink]="['/children', kid.id]">{{ copy().editChild }}</a>
          </div>
        </div>

        <div class="notes">
          <h3>{{ copy().notes }}</h3>
          <p>{{ kid.notes || copy().noNotes }}</p>
        </div>
      } @else {
        <div class="no-child">
          <p class="child-name">{{ copy().noChildTitle }}</p>
          <p class="muted">{{ copy().noChildBody }}</p>
          <a class="ghost" routerLink="/children/new">{{ copy().addChild }}</a>
        </div>
      }
    </section>

    <section class="panel" aria-labelledby="account-heading">
      <div class="panel-head">
        <h2 id="account-heading">{{ copy().accountSection }}</h2>
        <a routerLink="/settings" class="link">{{ copy().editAccount }}</a>
      </div>

      <dl class="facts">
        <div>
          <dt>{{ copy().name }}</dt>
          <dd>{{ accountName() }}</dd>
        </div>
        <div>
          <dt>{{ copy().email }}</dt>
          <dd>{{ parent()?.email ?? copy().notSet }}</dd>
        </div>
        <div>
          <dt>{{ copy().phone }}</dt>
          <dd>{{ parent()?.phoneNumber || copy().notSet }}</dd>
        </div>
      </dl>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 880px;
        margin: 0 auto;
      }

      .page-head {
        margin-bottom: 24px;
      }

      .eyebrow {
        margin: 0 0 6px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: var(--ac-type-label);
        font-weight: 700;
        color: var(--ac-color-action);
      }

      h1 {
        margin: 0 0 8px;
        font-size: var(--ac-type-page-title);
        color: var(--ac-color-text-strong);
      }

      .subtitle {
        margin: 0;
        max-width: 60ch;
        color: var(--ac-color-text-muted);
        line-height: 1.6;
      }

      .panel {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        padding: 22px;
        margin-bottom: 18px;
        box-shadow: var(--ac-shadow-xs);
      }

      .panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }

      h2 {
        margin: 0;
        font-size: var(--ac-type-section-title);
        color: var(--ac-color-text-strong);
      }

      h3 {
        margin: 0 0 6px;
        font-size: var(--ac-type-label);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--ac-color-text-muted);
      }

      .link {
        color: var(--ac-color-action);
        font-weight: 700;
        font-size: var(--ac-type-meta);
        text-decoration: none;
      }

      .link:hover {
        text-decoration: underline;
      }

      .child-row {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .avatar {
        width: 52px;
        height: 52px;
        flex: none;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--ac-color-blue-surface-soft);
        color: var(--ac-color-action-darkest);
        font-weight: 800;
        font-size: 18px;
      }

      .child-meta {
        flex: 1;
        min-width: 180px;
      }

      .child-name {
        margin: 0;
        font-weight: 700;
        font-size: var(--ac-type-card-title);
        color: var(--ac-color-text-strong);
      }

      .muted {
        margin: 2px 0 0;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .row-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .ghost {
        padding: 8px 14px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border);
        color: var(--ac-color-text-strong);
        font-weight: 600;
        font-size: var(--ac-type-meta);
        text-decoration: none;
      }

      .ghost:hover {
        background: var(--ac-color-surface-slate);
      }

      .no-child {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }

      .no-child .ghost {
        margin-top: 8px;
      }

      .notes {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid var(--ac-color-border);
      }

      .notes p {
        margin: 0;
        color: var(--ac-color-text-strong);
        line-height: 1.65;
        white-space: pre-wrap;
      }

      .facts {
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }

      .facts dt {
        font-size: var(--ac-type-label);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--ac-color-text-muted);
        margin-bottom: 4px;
      }

      .facts dd {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-weight: 600;
        overflow-wrap: anywhere;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly auth = inject(AuthService);
  private readonly childrenApi = inject(ChildrenApi);

  protected readonly copy = computed(() => COPY[this.i18n.currentLang()]);
  protected readonly parent = this.auth.parent;
  protected readonly children = signal<readonly ChildResponse[]>([]);
  protected readonly child = computed(() => this.children()[0] ?? null);

  protected readonly accountName = computed(() => {
    const parent = this.parent();
    if (!parent) return '';
    return `${parent.firstName} ${parent.lastName}`.trim();
  });

  ngOnInit(): void {
    this.childrenApi.listChildren().subscribe({
      next: (children) => this.children.set(children),
      error: () => this.children.set([]),
    });
  }

  protected initials(child: ChildResponse): string {
    return `${child.firstName.charAt(0)}${child.lastName?.charAt(0) ?? ''}`.toUpperCase();
  }

  protected childAge(child: ChildResponse): string {
    const born = new Date(child.dateOfBirth);
    const now = new Date();
    let months = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
    if (now.getDate() < born.getDate()) months -= 1;
    months = Math.max(months, 0);
    const copy = this.copy();
    return months >= 12
      ? copy.years(Math.floor(months / 12), months % 12)
      : copy.monthsOnly(months);
  }
}
