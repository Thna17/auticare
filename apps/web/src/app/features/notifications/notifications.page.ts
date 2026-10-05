import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { ParentNotificationsPage } from './parent-notifications.page';
import { SchoolNotificationsPage } from './school-notifications.page';

/**
 * /notifications renders a different view per role.
 *
 * The route previously loaded the school view for everyone with no role guard, so
 * a parent who reached this URL got a page that immediately called
 * `/schools/notifications` and was refused with 403s. Schools and parents have
 * genuinely different notifications — a school approves enrollment requests,
 * a parent reads updates about their child — so this switches rather than trying
 * to serve both from one component.
 *
 * Roles with no notification feed of their own get an empty state instead of a
 * failing page.
 */
@Component({
  standalone: true,
  imports: [ParentNotificationsPage, SchoolNotificationsPage, UiEmptyStateComponent],
  template: `
    @switch (role()) {
      @case ('SCHOOL') {
        <ac-school-notifications />
      }
      @case ('PARENT') {
        <ac-parent-notifications />
      }
      @default {
        <ac-ui-empty-state
          title="No notifications"
          message="This account type does not have a notification feed."
        />
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPage {
  private readonly auth = inject(AuthService);
  protected readonly role = computed(() => this.auth.parent()?.role ?? null);
}
