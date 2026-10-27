import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { VisibleAnnouncement } from '@auticare/contracts';
import { AdminPortalApi } from '../../features/admin/data-access/admin-portal.api';

const DISMISSED_KEY = 'auticare.dismissedAnnouncements';

const readDismissed = (): string[] => {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

/**
 * Live announcements from the AutiCare team, above the page content. The
 * server decides who sees what; dismissing one only hides it in this browser.
 * A failed load shows nothing rather than an error, since this is not the
 * page the user came for.
 */
@Component({
  selector: 'ac-announcement-banner',
  standalone: true,
  template: `
    @for (item of visible(); track item.id) {
      <section class="banner" role="status" [attr.aria-label]="'Announcement: ' + item.title">
        <div class="text">
          <strong>{{ item.title }}</strong>
          <span>{{ item.body }}</span>
        </div>
        <button type="button" class="dismiss" (click)="dismiss(item.id)" aria-label="Dismiss">
          ×
        </button>
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: grid;
        gap: 8px;
      }

      :host:not(:empty) {
        margin-bottom: 16px;
      }

      .banner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 14px;
        border: 1px solid var(--ac-color-border-info);
        border-radius: 12px;
        background: var(--ac-color-surface-info);
      }

      .text {
        display: grid;
        gap: 2px;
        flex: 1;
        min-width: 0;
        overflow-wrap: anywhere;
        color: var(--ac-color-text-body);
        font-size: 14px;
      }

      .text strong {
        color: var(--ac-color-text-strong);
      }

      .dismiss {
        border: 0;
        background: none;
        font-size: 20px;
        line-height: 1;
        color: var(--ac-color-text-muted);
        cursor: pointer;
      }

      .dismiss:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementBannerComponent implements OnInit {
  private readonly api = inject(AdminPortalApi);

  private readonly items = signal<VisibleAnnouncement[]>([]);
  private readonly dismissed = signal<string[]>(readDismissed());

  protected readonly visible = computed(() =>
    this.items().filter((item) => !this.dismissed().includes(item.id)),
  );

  ngOnInit(): void {
    this.api.visibleAnnouncements().subscribe({
      next: (items) => this.items.set(items),
      error: () => this.items.set([]),
    });
  }

  protected dismiss(id: string): void {
    const next = [...this.dismissed(), id].slice(-50);
    this.dismissed.set(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      // Storage can be blocked; it is then hidden for this visit only.
    }
  }
}
