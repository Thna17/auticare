import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Router, provideRouter } from '@angular/router';
import type { ParentResponse } from '@auticare/contracts';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { OnboardingState } from '../../features/assessment/onboarding-state';
import type { OnboardingStateValue } from '../../features/assessment/onboarding-state';
import { onboardingGuard } from './onboarding.guard';

const parent = (role: ParentResponse['role']): ParentResponse => ({
  id: 'parent-1',
  email: 'parent@auticare.test',
  firstName: 'Sokha',
  lastName: 'Chan',
  role,
  phoneNumber: null,
  socialMediaAccount: null,
});

const route = {} as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('onboardingGuard', () => {
  let onboarding: { ensureState: () => unknown };
  let currentParent: ParentResponse | null;
  let router: Router;

  beforeEach(() => {
    onboarding = { ensureState: () => of<OnboardingStateValue>('complete') };
    currentParent = parent('PARENT');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            parent: () => currentParent,
            loadCurrentUser: () => of(true),
          },
        },
        { provide: OnboardingState, useValue: onboarding },
      ],
    });
    router = TestBed.inject(Router);
  });

  const run = () =>
    TestBed.runInInjectionContext(() =>
      firstValueFrom(onboardingGuard(route, state) as never),
    ) as Promise<boolean | UrlTree>;

  it('lets a parent into the app once the flow is complete', async () => {
    await expect(run()).resolves.toBe(true);
  });

  it('sends a parent who has no child yet into the first-run flow', async () => {
    onboarding.ensureState = () => of<OnboardingStateValue>('needs-child');

    const result = await run();
    expect(result).toBeInstanceOf(Object);
    expect(router.serializeUrl(result as UrlTree)).toBe('/welcome');
  });

  it('sends a parent who has not answered the short assessment into the flow', async () => {
    onboarding.ensureState = () => of<OnboardingStateValue>('needs-assessment');

    const result = await run();
    expect(router.serializeUrl(result as UrlTree)).toBe('/welcome');
  });

  it('never gates a school, hospital or administrator account', async () => {
    currentParent = parent('SCHOOL');
    let consulted = false;
    onboarding.ensureState = () => {
      consulted = true;
      return of<OnboardingStateValue>('needs-child');
    };

    await expect(run()).resolves.toBe(true);
    expect(consulted).toBe(false);
  });
});
