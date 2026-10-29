import type { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type {
  AdminAuditList,
  AdminOverview,
  AdminParentList,
  AdminSchoolList,
  AdminStaffList,
} from '@auticare/contracts';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnouncementBannerComponent } from '../../core/layout/announcement-banner.component';
import { AdminActivitiesPage } from './admin-activities.page';
import { AdminAiPage } from './admin-ai.page';
import { AdminAnalyticsPage } from './admin-analytics.page';
import { AdminHelpPage } from './admin-help.page';
import { AdminQuestionnairePage } from './admin-questionnaire.page';
import { AdminAnnouncementsPage } from './admin-announcements.page';
import { AdminAuditPage } from './admin-audit.page';
import { AdminPartnershipsPage } from './admin-partnerships.page';
import { AdminOverviewComponent } from './admin-overview.component';
import { AdminParentsPage } from './admin-parents.page';
import { AdminSchoolsPage } from './admin-schools.page';
import { AdminSponsorshipsPage } from './admin-sponsorships.page';
import { AdminStaffPage } from './admin-staff.page';
import { AdminPortalApi } from './data-access/admin-portal.api';

const page = <T>(items: T[]) => ({ items, total: items.length, page: 1, pageSize: 25 });

const parents: AdminParentList = page([
  {
    id: 'p1',
    firstName: 'Sok',
    lastName: 'Dara',
    email: 'dara@example.com',
    createdAt: '2026-10-01T00:00:00.000Z',
    status: 'ACTIVE' as const,
    suspendedReason: null,
    plan: 'PRO' as const,
    childCount: 2,
  },
]);

const schools: AdminSchoolList = page([
  {
    id: 's1',
    name: 'Bright Steps',
    city: 'Phnom Penh',
    status: 'ACTIVE' as const,
    isVerified: false,
    businessActive: true,
    teacherCount: 3,
    sponsoredUsed: 2,
    adminEmail: 'head@brightsteps.test',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
]);

const staff: AdminStaffList = page([
  {
    id: 'st1',
    accountId: 'a1',
    firstName: 'Serey',
    lastName: 'Teacher',
    username: 'sereyteacher.bs',
    email: null,
    schoolId: 's1',
    schoolName: 'Bright Steps',
    role: 'TEACHER' as const,
    title: 'Speech',
    status: 'SETUP_PENDING' as const,
  },
]);

const audit: AdminAuditList = {
  ...page([
    {
      id: 'e1',
      action: 'ACCOUNT_SUSPENDED',
      actorEmail: 'admin@auticare.test',
      actorRole: 'ADMIN',
      targetId: 'p1',
      targetEmail: 'dara@example.com',
      metadata: { reason: 'Spam inquiries' },
      createdAt: '2026-10-20T08:00:00.000Z',
    },
  ]),
  pageSize: 50,
  actions: ['ACCOUNT_SUSPENDED', 'SCHOOL_VERIFIED'],
};

const overview: AdminOverview = {
  parents: { total: 40, new7d: 3, new30d: 11 },
  schools: { active: 5, suspended: 1 },
  pending: { schoolRequests: 2, hospitalRequests: 1, teacherSetups: 4 },
  subscriptions: { pro: 7, business: 2, sponsoredActive: 6, pastDue: 1 },
  suspendedAccounts: 1,
  aiConfigured: false,
  recentActivity: audit.items,
};

const setup = <T>(component: Type<T>, api: Partial<AdminPortalApi>) => {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [provideRouter([]), { provide: AdminPortalApi, useValue: api }],
  });
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
};

describe('admin portal pages', () => {
  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => vi.restoreAllMocks());

  it('Parents shows plan and child count, and suspends with a reason', () => {
    const suspendAccount = vi.fn().mockReturnValue(of({ suspended: true }));
    const { el } = setup(AdminParentsPage, { parents: () => of(parents), suspendAccount });
    expect(el.textContent).toContain('dara@example.com');
    expect(el.textContent).toContain('Pro');
    expect(el.textContent).toMatch(/2\s+children/);

    vi.spyOn(window, 'prompt').mockReturnValue('Spam inquiries');
    Array.from(el.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => b.textContent?.trim() === 'Suspend')!
      .click();
    expect(suspendAccount).toHaveBeenCalledWith('p1', 'Spam inquiries');
  });

  it('Schools shows the plan and verifies a listing', () => {
    const updateSchool = vi.fn().mockReturnValue(of({ ...schools.items[0], isVerified: true }));
    const { fixture, el } = setup(AdminSchoolsPage, { schools: () => of(schools), updateSchool });
    expect(el.textContent).toContain('Business');
    expect(el.textContent).toContain('2 of 5 sponsored Pro accounts in use');

    Array.from(el.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => b.textContent?.trim() === 'Verify')!
      .click();
    fixture.detectChanges();
    expect(updateSchool).toHaveBeenCalledWith('s1', { isVerified: true });
    expect(el.textContent).toContain('Verified');
  });

  it('Teachers & Staff shows usernames and setup status', () => {
    const { el } = setup(AdminStaffPage, { staff: () => of(staff) });
    expect(el.textContent).toContain('sereyteacher.bs');
    expect(el.textContent).toContain('Waiting for setup');
    expect(el.textContent).toContain('Bright Steps');
  });

  it('Audit Logs lists entries with readable actions and filters by action', () => {
    const auditFn = vi.fn().mockReturnValue(of(audit));
    const { el } = setup(AdminAuditPage, { audit: auditFn });
    expect(el.textContent).toContain('Account suspended');
    expect(el.textContent).toContain('reason: Spam inquiries');

    const select = el.querySelector<HTMLSelectElement>('select')!;
    select.value = 'SCHOOL_VERIFIED';
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    expect(auditFn).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'SCHOOL_VERIFIED', page: 1 }),
    );
  });

  it('Sponsored Pro Accounts totals the schools', () => {
    const { el } = setup(AdminSponsorshipsPage, {
      sponsorships: () =>
        of([
          {
            schoolId: 's1',
            schoolName: 'Bright Steps',
            businessActive: true,
            slotsUsed: 3,
            slotsTotal: 5,
            invited: 1,
            active: 2,
            ended: 0,
          },
        ]),
    });
    expect(el.querySelector('.stat strong')?.textContent).toBe('2');
    expect(el.textContent).toContain('3 / 5');
  });

  it('Overview links each number to the page that handles it', () => {
    const { el } = setup(AdminOverviewComponent, { overview: () => of(overview) });
    const requests = el.querySelector('a.stat[href="/admin/school-registrations"]');
    expect(requests?.textContent).toContain('2');
    expect(el.textContent).toContain('3 new this week');
    expect(el.textContent).toContain('AI assistant not configured');
    expect(el.textContent).toContain('Account suspended');
  });

  it('Announcements creates a published announcement for parents', () => {
    const saveAnnouncement = vi.fn().mockReturnValue(of({}));
    const { fixture, el } = setup(AdminAnnouncementsPage, {
      announcements: () => of([]),
      saveAnnouncement,
    });
    el.querySelector<HTMLButtonElement>('.page-head .btn-primary')!.click();
    fixture.detectChanges();

    const [title] = Array.from(el.querySelectorAll<HTMLInputElement>('input[type="text"]'));
    title.value = 'New activities';
    title.dispatchEvent(new Event('input'));
    const body = el.querySelector<HTMLTextAreaElement>('textarea')!;
    body.value = 'Ten new sensory activities.';
    body.dispatchEvent(new Event('input'));
    const [audience, status] = Array.from(el.querySelectorAll<HTMLSelectElement>('select'));
    audience.value = 'PARENTS';
    audience.dispatchEvent(new Event('change'));
    status.value = 'PUBLISHED';
    status.dispatchEvent(new Event('change'));
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));

    expect(saveAnnouncement).toHaveBeenCalledWith(
      {
        title: 'New activities',
        body: 'Ten new sensory activities.',
        audience: 'PARENTS',
        status: 'PUBLISHED',
        publishAt: null,
        expiresAt: null,
      },
      undefined,
    );
  });

  it('Partnerships lists organizations and flags overdue follow-ups', () => {
    const { el } = setup(AdminPartnershipsPage, {
      partnerships: () =>
        of([
          {
            id: 'pa1',
            organizationName: 'Hope Centre',
            organizationType: 'NGO' as const,
            contactName: 'Vanna',
            contactEmail: null,
            contactPhone: null,
            status: 'IN_DISCUSSION' as const,
            nextFollowUpAt: '2020-01-01',
            notes: 'Met at the fair',
            createdAt: '2026-10-01T00:00:00.000Z',
            updatedAt: '2026-10-01T00:00:00.000Z',
          },
        ]),
    });
    expect(el.textContent).toContain('Hope Centre');
    expect(el.textContent).toContain('In discussion');
    expect(el.querySelector('.overdue')).not.toBeNull();
  });

  it('Analytics shows totals and one chart per metric', () => {
    const month = {
      month: '2026-10',
      parentRegistrations: 4,
      schoolsAdded: 1,
      proStarted: 2,
      businessStarted: 1,
      plansEnded: 0,
      recordedPlanValueCents: 10000,
      questionnairesCompleted: 3,
      aiQuestions: 12,
      activitiesCompleted: 5,
    };
    const { el } = setup(AdminAnalyticsPage, {
      analytics: () =>
        of({
          months: [month],
          totals: {
            parents: 10,
            parentsOnPro: 2,
            activeChildren: 8,
            childrenWithCompletedQuestionnaire: 6,
          },
        }),
    });
    expect(el.textContent).toContain('20%');
    expect(el.textContent).toContain('75%');
    expect(el.querySelectorAll('.chart').length).toBe(9);
    expect(el.textContent).toContain('$100');
  });

  it('the banner shows live announcements and hides one when dismissed', () => {
    try {
      localStorage.removeItem('auticare.dismissedAnnouncements');
    } catch {
      // ignore
    }
    const { fixture, el } = setup(AnnouncementBannerComponent, {
      visibleAnnouncements: () =>
        of([{ id: 'an1', title: 'Maintenance', body: 'Tonight 10pm', publishedAt: null }]),
    });
    expect(el.textContent).toContain('Maintenance');
    el.querySelector<HTMLButtonElement>('.dismiss')!.click();
    fixture.detectChanges();
    expect(el.textContent).not.toContain('Maintenance');
  });

  it('Resources & Activities lists drafts and filters by status', () => {
    const base = {
      category: 'Sensory',
      minAgeMonths: 12,
      maxAgeMonths: 60,
      summary: 'A calm sensory bin.',
      steps: null,
      imageUrl: null,
      videoUrl: null,
      resourceUrl: null,
      professionallyReviewed: false,
      reviewedBy: null,
      completions: 4,
      updatedAt: '2026-10-01T00:00:00.000Z',
    };
    const { fixture, el } = setup(AdminActivitiesPage, {
      activities: () =>
        of([
          { ...base, id: 'a1', title: 'Rice bin', status: 'PUBLISHED' as const },
          { ...base, id: 'a2', title: 'Draft idea', status: 'DRAFT' as const },
        ]),
    });
    expect(el.textContent).toContain('Rice bin');
    expect(el.textContent).toContain('4 completed');
    Array.from(el.querySelectorAll<HTMLButtonElement>('.toolbar .btn-small'))
      .find((b) => b.textContent?.trim() === 'Draft')!
      .click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Draft idea');
    expect(el.textContent).not.toContain('Rice bin');
  });

  it('Questionnaire shows live questions per form and explains versioning on edit', () => {
    const q = {
      id: 'q1',
      questionText: 'Does your child point to show you something?',
      category: 'Social Interaction',
      displayOrder: 1,
      polarity: 'REVERSE' as const,
      ageBand: 'TODDLER' as const,
      formKind: 'SHORT' as const,
      isActive: true,
      version: 1,
      replacesId: null,
      answerCount: 12,
      updatedAt: '2026-10-01T00:00:00.000Z',
    };
    const { fixture, el } = setup(AdminQuestionnairePage, {
      questionnaire: () =>
        of({
          questions: [q],
          stats: [
            { ageBand: 'TODDLER' as const, formKind: 'SHORT' as const, started: 10, completed: 8 },
          ],
        }),
    });
    expect(el.textContent).toContain('Does your child point');
    expect(el.textContent).toContain('80%');
    Array.from(el.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => b.textContent?.trim() === 'Edit')!
      .click();
    fixture.detectChanges();
    expect(el.textContent).toContain('kept for the 12 answers already given');
  });

  it('AI monitoring shows usage and the safety rules', () => {
    const { el } = setup(AdminAiPage, {
      aiMonitoring: () =>
        of({
          configured: true,
          model: 'test-model',
          days: 7,
          totals: {
            conversations: 3,
            questions: 9,
            answers: 9,
            crisisReplies: 1,
            medicationReplies: 0,
            avgLatencyMs: 2300,
            tokensIn: 1000,
            tokensOut: 500,
            reviewedSources: 4,
          },
          daily: [{ date: '2026-10-27', questions: 9, avgLatencyMs: 2300 }],
          estimatedCostUsd: 0.0042,
          todayCostUsd: 0.0004,
          dailyBudgetUsd: 2,
          thinkingMode: 'disabled',
          rules: 'You do not diagnose.',
        }),
    });
    expect(el.textContent).toContain('test-model');
    expect(el.textContent).toContain('2.3 s');
    // Spend is shown as money, with the daily ceiling beside it.
    expect(el.textContent).toContain('$0.0004');
    expect(el.textContent).toContain('$2.00');
    expect(el.querySelector('.rules')?.textContent).toContain('You do not diagnose.');
  });

  it('Help & Documentation lists the admin guides', () => {
    const { el } = setup(AdminHelpPage, {});
    expect(el.querySelectorAll('details').length).toBeGreaterThanOrEqual(8);
    expect(el.textContent).toContain('Approve a school');
    expect(el.textContent).toContain('username and a one-time setup code');
  });
});
