import type { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type {
  AdminSubscription,
  ParentPlanResponse,
  SchoolSubscriptionResponse,
  Subscription,
} from '@auticare/contracts';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchoolsApi } from '../schools/data-access/schools.api';
import { AdminSubscriptionsPage } from './admin-subscriptions.page';
import { SubscriptionsApi } from './data-access/subscriptions.api';
import { ParentSubscriptionPage } from './parent-subscription.page';
import { SchoolSponsorshipsPage } from './school-sponsorships.page';
import { SchoolSubscriptionPage } from './school-subscription.page';

const business: Subscription = {
  id: 'sub-b',
  plan: 'BUSINESS',
  interval: 'MONTHLY',
  status: 'ACTIVE',
  priceCents: 6000,
  currency: 'USD',
  startedAt: '2026-10-01T00:00:00.000Z',
  currentPeriodEnd: '2026-11-30T23:59:59.999Z',
  canceledAt: null,
  provider: 'MANUAL',
  grantsAccess: true,
};

const freePlan: ParentPlanResponse = {
  plan: 'FREE',
  source: null,
  subscription: null,
  sponsorship: null,
  maxChildren: null,
  activeChildren: 1,
  offers: [{ id: 'offer-1', schoolName: 'Bright Steps', invitedAt: '2026-10-20T00:00:00.000Z' }],
};

const schoolData = (overrides: Partial<SchoolSubscriptionResponse> = {}) => ({
  subscription: business,
  businessActive: true,
  slotsTotal: 5,
  slotsUsed: 1,
  sponsorships: [
    {
      id: 'sp-1',
      email: 'family@example.com',
      status: 'ACTIVE' as const,
      invitedAt: '2026-10-20T00:00:00.000Z',
      acceptedAt: '2026-10-21T00:00:00.000Z',
      endedAt: null,
      endedReason: null,
    },
  ],
  ...overrides,
});

const setup = <T>(component: Type<T>, api: Partial<SubscriptionsApi>) => {
  TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]),
      { provide: SubscriptionsApi, useValue: api },
      { provide: SchoolsApi, useValue: { listAdminSchoolAccounts: () => of([]) } },
    ],
  });
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
};

describe('ParentSubscriptionPage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('shows Free, the Pro price and a school offer that promises no data is shared', () => {
    const { el } = setup(ParentSubscriptionPage, { myPlan: () => of(freePlan) });
    expect(el.querySelector('.plan-name')?.textContent).toContain('Free');
    expect(el.textContent).toContain('$20 / month');
    expect(el.textContent).toContain('$200 / year');
    expect(el.textContent).toContain('Bright Steps is offering you AutiCare Pro');
    expect(el.textContent).toContain("share any of your children's information");
  });

  it('accepting an offer shows the sponsored Pro plan', () => {
    const acceptOffer = vi.fn().mockReturnValue(
      of({
        ...freePlan,
        plan: 'PRO',
        source: 'SPONSORED',
        maxChildren: 2,
        offers: [],
        sponsorship: {
          id: 'offer-1',
          schoolName: 'Bright Steps',
          acceptedAt: '2026-10-21T00:00:00.000Z',
          grantsAccess: true,
        },
      } satisfies ParentPlanResponse),
    );
    const { fixture, el } = setup(ParentSubscriptionPage, {
      myPlan: () => of(freePlan),
      acceptOffer,
    });
    el.querySelector<HTMLButtonElement>('.card.highlight .btn-primary')!.click();
    fixture.detectChanges();

    expect(acceptOffer).toHaveBeenCalledWith('offer-1');
    expect(el.querySelector('.plan-name')?.textContent).toContain('Pro');
    expect(el.textContent).toContain('Sponsored by Bright Steps');
    expect(el.textContent).toMatch(/1\s+of\s+2/);
  });
});

describe('SchoolSubscriptionPage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('shows the Business plan, its price and slot usage', () => {
    const { el } = setup(SchoolSubscriptionPage, { schoolSubscription: () => of(schoolData()) });
    expect(el.textContent).toContain('$60 / month');
    expect(el.textContent).toContain('1 of 5 in use');
    expect(el.querySelector('.chip')?.textContent).toContain('Active');
  });
});

describe('SchoolSponsorshipsPage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('lists sponsored accounts by email only and sends a new offer', () => {
    const inviteSponsorship = vi.fn().mockReturnValue(of(schoolData({ slotsUsed: 2 })));
    const { fixture, el } = setup(SchoolSponsorshipsPage, {
      schoolSubscription: () => of(schoolData()),
      inviteSponsorship,
    });
    expect(el.textContent).toContain('family@example.com');
    expect(el.textContent).toContain('not teacher accounts');

    const input = el.querySelector<HTMLInputElement>('input[type="email"]')!;
    input.value = 'new@example.com';
    input.dispatchEvent(new Event('input'));
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(inviteSponsorship).toHaveBeenCalledWith('new@example.com');
    expect(el.textContent).toContain('2 of 5 in use');
    expect(el.textContent).toContain('Offer sent');
  });

  it('hides the offer form while the Business plan is not active', () => {
    const { el } = setup(SchoolSponsorshipsPage, {
      schoolSubscription: () => of(schoolData({ businessActive: false })),
    });
    expect(el.querySelector('form')).toBeNull();
    expect(el.textContent).toContain('need an active Business plan');
  });
});

describe('AdminSubscriptionsPage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  const row: AdminSubscription = {
    ...business,
    plan: 'PRO',
    priceCents: 2000,
    owner: { type: 'PARENT', id: 'p1', name: 'Sok Dara', email: 'dara@example.com' },
    note: null,
  };

  it('lists plans and records Pro for a parent by email', () => {
    const adminCreate = vi.fn().mockReturnValue(of(row));
    const adminList = vi.fn().mockReturnValue(of([row]));
    const { fixture, el } = setup(AdminSubscriptionsPage, { adminList, adminCreate });
    expect(el.textContent).toContain('Sok Dara');
    expect(el.textContent).toContain('$20 / month');

    el.querySelector<HTMLButtonElement>('.page-head .btn-primary')!.click();
    fixture.detectChanges();
    const email = el.querySelector<HTMLInputElement>('input[type="email"]')!;
    email.value = 'Dara@Example.com';
    email.dispatchEvent(new Event('input'));
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(adminCreate).toHaveBeenCalledWith({
      plan: 'PRO',
      interval: 'MONTHLY',
      parentEmail: 'dara@example.com',
    });
  });
});
