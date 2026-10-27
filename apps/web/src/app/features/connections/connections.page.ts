import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type {
  ChildResponse,
  ConnectionPreviewResponse,
  ParentSchoolConnection,
} from '@auticare/contracts';
import { I18nService } from '../../core/i18n/i18n.service';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { ChildrenApi } from '../children/data-access/children.api';
import { ConnectionsApi } from './data-access/connections.api';

const COPY = {
  en: {
    title: 'My schools',
    subtitle:
      'Connect your child to their school with the code the school gave you. Their teachers can then share reports with you here.',
    connectTitle: 'Connect to a school',
    codeLabel: 'Connection code',
    codeHint: 'Eight letters and numbers from your school, e.g. K7QM-4XPA.',
    check: 'Check code',
    checking: 'Checking…',
    youAreConnecting: 'You are connecting to',
    teachersOnCode: 'Teachers',
    whichChild: 'Which child is this for?',
    noChildren: 'Add your child first, then come back with the code.',
    addChild: 'Add a child',
    consent: (school: string, child: string) =>
      `I agree that ${school} and the teachers it assigns can see ${child}'s name and age and share reports with me.`,
    privacy:
      'Your screenings, daily notes and conversations with AutiCare stay private. The school never sees them.',
    connect: 'Connect',
    connecting: 'Connecting…',
    cancel: 'Use a different code',
    connected: (child: string, school: string) => `${child} is now connected to ${school}.`,
    yourSchools: 'Connected schools',
    none: 'No schools yet. When your child’s school gives you a code, enter it above.',
    teachers: 'Teachers',
    noTeachers: 'The school has not assigned teachers yet.',
    reports: (n: number) => (n === 1 ? '1 report' : `${n} reports`),
    viewReports: 'View reports',
    since: 'Since',
    disconnect: 'Disconnect',
    confirmDisconnect: (child: string, school: string) =>
      `Disconnect ${child} from ${school}? Its teachers will no longer see ${child}. Reports already shared stay with you.`,
    failed: 'Something went wrong. Please try again.',
  },
  km: {
    title: 'សាលារបស់ខ្ញុំ',
    subtitle:
      'ភ្ជាប់កូនរបស់អ្នកទៅសាលារបស់គាត់ ដោយប្រើលេខកូដដែលសាលាបានផ្តល់។ បន្ទាប់មក គ្រូរបស់គាត់អាចចែករំលែករបាយការណ៍ជាមួយអ្នកនៅទីនេះ។',
    connectTitle: 'ភ្ជាប់ទៅសាលា',
    codeLabel: 'លេខកូដភ្ជាប់',
    codeHint: 'អក្សរ និងលេខប្រាំបីខ្ទង់ពីសាលារបស់អ្នក ឧ. K7QM-4XPA។',
    check: 'ពិនិត្យលេខកូដ',
    checking: 'កំពុងពិនិត្យ…',
    youAreConnecting: 'អ្នកកំពុងភ្ជាប់ទៅ',
    teachersOnCode: 'គ្រូ',
    whichChild: 'តើសម្រាប់កូនមួយណា?',
    noChildren: 'សូមបន្ថែមព័ត៌មានកូនជាមុនសិន រួចត្រឡប់មកវិញជាមួយលេខកូដ។',
    addChild: 'បន្ថែមកូន',
    consent: (school: string, child: string) =>
      `ខ្ញុំយល់ព្រមឱ្យ ${school} និងគ្រូដែលសាលាចាត់តាំង មើលឈ្មោះ និងអាយុរបស់ ${child} ហើយចែករំលែករបាយការណ៍ជាមួយខ្ញុំ។`,
    privacy:
      'ការវាយតម្លៃ កំណត់ត្រាប្រចាំថ្ងៃ និងការសន្ទនាជាមួយ AutiCare របស់អ្នក រក្សាជាឯកជន។ សាលាមិនដែលឃើញវាទេ។',
    connect: 'ភ្ជាប់',
    connecting: 'កំពុងភ្ជាប់…',
    cancel: 'ប្រើលេខកូដផ្សេង',
    connected: (child: string, school: string) => `${child} ត្រូវបានភ្ជាប់ទៅ ${school} ហើយ។`,
    yourSchools: 'សាលាដែលបានភ្ជាប់',
    none: 'មិនទាន់មានសាលាទេ។ នៅពេលសាលារបស់កូនផ្តល់លេខកូដ សូមបញ្ចូលវានៅខាងលើ។',
    teachers: 'គ្រូ',
    noTeachers: 'សាលាមិនទាន់ចាត់តាំងគ្រូនៅឡើយទេ។',
    reports: (n: number) => `របាយការណ៍ ${n}`,
    viewReports: 'មើលរបាយការណ៍',
    since: 'ចាប់ពី',
    disconnect: 'ផ្តាច់',
    confirmDisconnect: (child: string, school: string) =>
      `ផ្តាច់ ${child} ពី ${school}? គ្រូរបស់សាលានឹងលែងឃើញ ${child} ទៀត។ របាយការណ៍ដែលបានចែករំលែកនៅតែជារបស់អ្នក។`,
    failed: 'មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្តងទៀត។',
  },
};

const apiMessage = (err: unknown): string | undefined =>
  (err as { error?: { error?: { message?: string } } })?.error?.error?.message;

/**
 * Where a parent connects a child to a school and sees who teaches them.
 * Nothing is shared until the parent has seen which school the code belongs
 * to, chosen the child, and agreed.
 */
@Component({
  standalone: true,
  imports: [RouterLink, UiMessageComponent, UiSpinnerComponent],
  selector: 'ac-connections-page',
  template: `
    <header class="page-head">
      <h1>{{ copy().title }}</h1>
      <p class="subtitle">{{ copy().subtitle }}</p>
    </header>

    @if (notice(); as message) {
      <ac-ui-message tone="success">{{ message }}</ac-ui-message>
    }

    <section class="card" aria-labelledby="connect-title">
      <h2 id="connect-title">{{ copy().connectTitle }}</h2>

      @if (!preview()) {
        <form class="code-form" (submit)="check($event)">
          <label class="field">
            <span class="label">{{ copy().codeLabel }}</span>
            <input
              class="code-input"
              type="text"
              autocomplete="one-time-code"
              autocapitalize="characters"
              spellcheck="false"
              maxlength="20"
              placeholder="XXXX-XXXX"
              [value]="code()"
              (input)="code.set($any($event.target).value)"
            />
            <small>{{ copy().codeHint }}</small>
          </label>
          <button type="submit" class="btn-primary" [disabled]="busy() || code().trim().length < 8">
            {{ busy() ? copy().checking : copy().check }}
          </button>
        </form>
      } @else {
        @let school = preview()!.school;
        <div class="preview">
          <span class="school-mark" aria-hidden="true">{{ school.name.charAt(0) }}</span>
          <div>
            <small>{{ copy().youAreConnecting }}</small>
            <strong>{{ school.name }}</strong>
            <span class="meta">{{ school.city }}</span>
            @if (preview()!.teachers.length) {
              <span class="meta">
                {{ copy().teachersOnCode }}: {{ teacherList(preview()!.teachers) }}
              </span>
            }
          </div>
        </div>

        @if (children().length === 0) {
          <ac-ui-message tone="info">
            {{ copy().noChildren }} <a routerLink="/children/new">{{ copy().addChild }}</a>
          </ac-ui-message>
        } @else {
          <fieldset class="field">
            <legend class="label">{{ copy().whichChild }}</legend>
            <div class="child-options">
              @for (child of children(); track child.id) {
                <label class="child-option" [class.selected]="childId() === child.id">
                  <input
                    type="radio"
                    name="child"
                    [checked]="childId() === child.id"
                    (change)="childId.set(child.id)"
                  />
                  <span class="child-avatar" aria-hidden="true">{{
                    child.firstName.charAt(0)
                  }}</span>
                  <span>{{ child.firstName }}</span>
                </label>
              }
            </div>
          </fieldset>

          @if (selectedChild(); as child) {
            <label class="consent">
              <input
                type="checkbox"
                [checked]="consent()"
                (change)="consent.set($any($event.target).checked)"
              />
              <span>{{ copy().consent(school.name, child.firstName) }}</span>
            </label>
            <p class="privacy">{{ copy().privacy }}</p>
          }
        }

        <div class="actions">
          <button
            type="button"
            class="btn-primary"
            [disabled]="busy() || !childId() || !consent()"
            (click)="connect()"
          >
            {{ busy() ? copy().connecting : copy().connect }}
          </button>
          <button type="button" class="btn-ghost" (click)="reset()">{{ copy().cancel }}</button>
        </div>
      }

      @if (error(); as message) {
        <ac-ui-message tone="error">{{ message }}</ac-ui-message>
      }
    </section>

    <section aria-labelledby="schools-title" class="schools">
      <h2 id="schools-title">{{ copy().yourSchools }}</h2>
      @if (loading()) {
        <ac-ui-spinner [label]="copy().yourSchools" />
      } @else {
        <div class="school-grid">
          @for (item of connections(); track item.enrollmentId) {
            <article class="school-card">
              <header class="school-head">
                <span class="school-mark" aria-hidden="true">{{ item.school.name.charAt(0) }}</span>
                <div>
                  <strong>{{ item.school.name }}</strong>
                  <span class="meta"
                    >{{ item.child.firstName }} · {{ copy().since }} {{ item.startDate }}</span
                  >
                </div>
              </header>
              <div class="team">
                <span class="label">{{ copy().teachers }}</span>
                @if (item.teachers.length) {
                  <ul>
                    @for (teacher of item.teachers; track $index) {
                      <li>
                        {{ teacher.firstName }} {{ teacher.lastName }}
                        @if (teacher.title) {
                          <small>· {{ teacher.title }}</small>
                        }
                      </li>
                    }
                  </ul>
                } @else {
                  <span class="meta">{{ copy().noTeachers }}</span>
                }
              </div>
              <footer class="school-foot">
                <a class="link" routerLink="/schools/reports">
                  {{ copy().viewReports }} · {{ copy().reports(item.reportCount) }}
                </a>
                <button type="button" class="btn-text danger" (click)="disconnect(item)">
                  {{ copy().disconnect }}
                </button>
              </footer>
            </article>
          } @empty {
            <p class="empty">{{ copy().none }}</p>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: 22px;
        padding-bottom: 48px;
      }

      h1 {
        margin: 0 0 6px;
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-title);
        color: var(--ac-color-text-strong);
      }

      .subtitle {
        margin: 0;
        max-width: 62ch;
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-muted);
      }

      h2 {
        margin: 0;
        font-size: 17px;
        color: var(--ac-color-text-strong);
      }

      .card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 18px;
        padding: 22px 24px;
        display: grid;
        gap: 16px;
        max-width: 720px;
      }

      .code-form {
        display: flex;
        align-items: flex-end;
        gap: 12px;
        flex-wrap: wrap;
      }

      .field {
        display: grid;
        gap: 6px;
        margin: 0;
        padding: 0;
        border: 0;
      }

      .field small,
      .meta {
        font-size: 13px;
        color: var(--ac-color-text-muted);
      }

      .label {
        font-size: 14px;
        font-weight: 700;
        color: var(--ac-color-text-strong);
      }

      .code-input {
        width: 220px;
        height: 48px;
        padding: 0 14px;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: 12px;
        font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
        font-size: 18px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .preview {
        display: flex;
        gap: 14px;
        align-items: center;
        padding: 14px 16px;
        border-radius: 14px;
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
      }

      .preview > div {
        display: grid;
        gap: 2px;
      }

      .preview strong {
        font-size: 17px;
        color: var(--ac-color-text-strong);
      }

      .school-mark {
        width: 44px;
        height: 44px;
        flex: 0 0 auto;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: var(--ac-color-action-darkest);
        color: var(--ac-color-text-on-action);
        font-weight: 800;
        font-size: 18px;
      }

      .child-options {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .child-option {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px 8px 8px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 999px;
        cursor: pointer;
        font-weight: 600;
      }

      .child-option input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .child-option.selected {
        border-color: var(--ac-color-action-mid);
        box-shadow: 0 0 0 3px var(--ac-color-tint-blue-light);
      }

      .child-option:focus-within {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .child-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--ac-color-primary);
        color: var(--ac-color-ink-f);
        font-weight: 800;
      }

      .consent {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        font-size: 15px;
        line-height: 1.5;
        color: var(--ac-color-text-strong);
      }

      .consent input {
        margin-top: 4px;
        width: 18px;
        height: 18px;
      }

      .privacy {
        margin: 0;
        font-size: 13.5px;
        color: var(--ac-color-text-muted);
      }

      .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .schools {
        display: grid;
        gap: 12px;
      }

      .school-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 14px;
      }

      .school-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 16px;
        padding: 18px;
        display: grid;
        gap: 14px;
      }

      .school-head {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .school-head > div {
        display: grid;
        gap: 2px;
      }

      .school-head strong {
        color: var(--ac-color-text-strong);
      }

      .team ul {
        list-style: none;
        margin: 6px 0 0;
        padding: 0;
        display: grid;
        gap: 4px;
        font-size: 14px;
        color: var(--ac-color-text-body);
      }

      .team small {
        color: var(--ac-color-text-muted);
      }

      .school-foot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding-top: 12px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .link {
        color: var(--ac-color-action-deep);
        font-weight: 700;
        font-size: 14px;
        text-decoration: none;
      }

      .empty {
        margin: 0;
        color: var(--ac-color-text-muted);
      }

      .btn-primary,
      .btn-ghost,
      .btn-text {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .btn-primary {
        height: 48px;
        padding: 0 22px;
        border: 0;
        border-radius: 12px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .btn-primary:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .btn-ghost {
        height: 48px;
        padding: 0 18px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
      }

      .btn-text {
        border: 0;
        background: none;
        font-size: 13px;
      }

      .btn-text.danger {
        color: var(--ac-color-alert-text);
      }

      button:focus-visible,
      a:focus-visible,
      input:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionsPage implements OnInit {
  private readonly api = inject(ConnectionsApi);
  private readonly childrenApi = inject(ChildrenApi);
  private readonly i18n = inject(I18nService);

  protected readonly copy = computed(() => COPY[this.i18n.currentLang()]);

  protected readonly connections = signal<ParentSchoolConnection[]>([]);
  protected readonly children = signal<readonly ChildResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly code = signal('');
  protected readonly preview = signal<ConnectionPreviewResponse | null>(null);
  protected readonly childId = signal<string | null>(null);
  protected readonly consent = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected readonly selectedChild = computed(
    () => this.children().find((child) => child.id === this.childId()) ?? null,
  );

  ngOnInit(): void {
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        if (children.length === 1) this.childId.set(children[0]!.id);
      },
      error: () => this.children.set([]),
    });
    this.load();
  }

  protected check(event: Event): void {
    event.preventDefault();
    this.error.set(null);
    this.notice.set(null);
    this.busy.set(true);
    this.api.preview(this.code().trim()).subscribe({
      next: (preview) => {
        this.busy.set(false);
        this.preview.set(preview);
        this.consent.set(false);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(apiMessage(err) ?? this.copy().failed);
      },
    });
  }

  protected connect(): void {
    const childId = this.childId();
    if (!childId || !this.consent()) return;
    this.error.set(null);
    this.busy.set(true);
    this.api.connect({ code: this.code().trim(), childId, consent: true }).subscribe({
      next: (connection) => {
        this.busy.set(false);
        this.notice.set(this.copy().connected(connection.child.firstName, connection.school.name));
        this.reset();
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(apiMessage(err) ?? this.copy().failed);
      },
    });
  }

  protected reset(): void {
    this.preview.set(null);
    this.code.set('');
    this.consent.set(false);
    this.error.set(null);
  }

  protected disconnect(item: ParentSchoolConnection): void {
    if (!window.confirm(this.copy().confirmDisconnect(item.child.firstName, item.school.name))) {
      return;
    }
    this.api.disconnect(item.enrollmentId).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(apiMessage(err) ?? this.copy().failed),
    });
  }

  protected teacherList(teachers: ConnectionPreviewResponse['teachers']): string {
    return teachers.map((t) => `${t.firstName} ${t.lastName}`.trim()).join(', ');
  }

  private load(): void {
    this.api.list().subscribe({
      next: (connections) => {
        this.connections.set(connections);
        this.loading.set(false);
      },
      error: () => {
        this.connections.set([]);
        this.loading.set(false);
      },
    });
  }
}
