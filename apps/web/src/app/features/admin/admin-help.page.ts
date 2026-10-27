import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PORTAL_PAGE_STYLES } from '../../design-system/styles/portal-page.styles';

type Guide = {
  id: string;
  title: string;
  steps: readonly string[];
  link?: { label: string; path: string };
};

const GUIDES: readonly Guide[] = [
  {
    id: 'schools',
    title: 'Approve a school',
    steps: [
      'Open School requests. Check the school is real: licence, address and a contact you can reach.',
      'Approve. AutiCare creates the school and its admin account and emails the admin a link to set a password.',
      'The school admin then adds teachers on their Team page. Each teacher gets a username and a one-time setup code from their school, in person. No email is needed.',
      'Or create a school yourself with Create school account on Schools & Organizations.',
    ],
    link: { label: 'School requests', path: '/admin/school-registrations' },
  },
  {
    id: 'hospitals',
    title: 'Approve a hospital or clinic',
    steps: [
      'Open Hospital requests and verify the organization the same way.',
      'Approving creates the hospital and its admin account. Their admin adds coordinators and doctors.',
    ],
    link: { label: 'Hospital requests', path: '/admin/hospital-registrations' },
  },
  {
    id: 'plans',
    title: 'Record a Pro or Business plan',
    steps: [
      'Online payment is not connected yet. Arrange payment outside AutiCare first.',
      'Open Subscription Plans → Record a plan. Pro is for a parent (their account email); Business is for a school.',
      'Set the paid-through date if there is one. Add the receipt number as a note.',
      'Cancel keeps access until the paid-through date. End now stops access straight away. Nothing is ever deleted.',
    ],
    link: { label: 'Subscription Plans', path: '/admin/subscriptions' },
  },
  {
    id: 'sponsored',
    title: 'Sponsored Pro accounts',
    steps: [
      'Each Business school can offer Pro to five families. These are family accounts, not teacher seats.',
      'The school offers a slot by email; the parent accepts on their own account.',
      "The school never sees the families' children through a sponsorship.",
    ],
    link: { label: 'Sponsored Pro Accounts', path: '/admin/sponsorships' },
  },
  {
    id: 'suspend',
    title: 'Suspend an account or a school',
    steps: [
      'Parents & Families or Teachers & Staff → Suspend, with a reason. The person is signed out and cannot sign in until reactivated.',
      'Schools & Organizations → Suspend hides the school from the directory and signs all its staff out.',
      'Suspending never deletes data. Every suspension and reactivation is in the audit log.',
    ],
    link: { label: 'Parents & Families', path: '/admin/parents' },
  },
  {
    id: 'content',
    title: 'Activities and the questionnaire',
    steps: [
      'Resources & Activities: write an activity as a Draft, check it, then Publish. Families only ever see published activities.',
      'Mark an activity as professionally reviewed only when a qualified person has checked it.',
      'Questionnaire Management: editing a question publishes a new version. Questionnaires already finished keep the old wording.',
      'Keep all wording educational. AutiCare never diagnoses.',
    ],
    link: { label: 'Resources & Activities', path: '/admin/activities' },
  },
  {
    id: 'announcements',
    title: 'Send an announcement',
    steps: [
      'Announcements → New announcement. Choose the audience and set the status to Published.',
      'Use Show from / Show until to schedule it. Archive takes it down at once.',
    ],
    link: { label: 'Announcements', path: '/admin/announcements' },
  },
  {
    id: 'trouble',
    title: 'When someone cannot sign in',
    steps: [
      "Teacher with an expired setup code: their school admin issues a new code from the school's Team page.",
      'Message "This account has been suspended": check Parents & Families or Teachers & Staff and reactivate if appropriate.',
      'Message "Your school\'s AutiCare access is suspended": the school is suspended on Schools & Organizations.',
      "A school admin who never set a password: approve again or resend the invitation from the school's account.",
    ],
    link: { label: 'Teachers & Staff', path: '/admin/staff' },
  },
  {
    id: 'privacy',
    title: 'Privacy rules for admins',
    steps: [
      "Admin pages show counts, never a child's records, questionnaire answers, notes or AI conversations.",
      'Only look at what you need for the task in front of you.',
      'Every important action is recorded in the audit log and cannot be edited.',
    ],
    link: { label: 'Audit Logs', path: '/admin/audit' },
  },
];

/** Internal how-to guide for the AutiCare admin team. */
@Component({
  standalone: true,
  imports: [RouterLink],
  selector: 'ac-admin-help-page',
  template: `
    <header class="page-head">
      <div>
        <h1>Help &amp; Documentation</h1>
        <p class="subtitle">How to run AutiCare day to day. Open a topic for the steps.</p>
      </div>
    </header>

    <nav class="actions" aria-label="Topics">
      @for (guide of guides; track guide.id) {
        <a class="btn-small" [href]="'#' + guide.id">{{ guide.title }}</a>
      }
    </nav>

    @for (guide of guides; track guide.id) {
      <details class="card" [id]="guide.id">
        <summary>
          <h2>{{ guide.title }}</h2>
        </summary>
        <ol class="steps">
          @for (step of guide.steps; track step) {
            <li>{{ step }}</li>
          }
        </ol>
        @if (guide.link; as link) {
          <a class="btn-ghost" [routerLink]="link.path">Open {{ link.label }}</a>
        }
      </details>
    }
  `,
  styles: [
    PORTAL_PAGE_STYLES,
    `
      summary {
        cursor: pointer;
        list-style-position: inside;
      }

      summary h2 {
        display: inline;
      }

      .steps {
        margin: 0;
        padding-left: 20px;
        display: grid;
        gap: 8px;
        line-height: 1.55;
        color: var(--ac-color-text-body);
      }

      details .btn-ghost {
        justify-self: start;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHelpPage {
  protected readonly guides = GUIDES;
}
