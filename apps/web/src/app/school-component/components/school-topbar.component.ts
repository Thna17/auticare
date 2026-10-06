// school-topbar.component.ts
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  selector: 'ac-school-topbar',
  template: `
    <header class="topbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          aria-label="Search students, therapists or records"
          type="text"
          placeholder="Search students, therapists, or records..."
          class="search-input"
        />
      </div>

      <div class="topbar-actions">
        <button class="icon-btn" aria-label="Notifications">
          <span class="icon">🔔</span>
          <span class="badge"></span>
        </button>
        <button class="icon-btn" aria-label="Help">
          <span class="icon">?</span>
        </button>
        <a class="user-profile" routerLink="/schools/profile">
          <div class="user-info">
            <span class="user-name">{{ displayName() }}</span>
            <span class="user-role">{{ roleLabel() }}</span>
          </div>
          <div class="user-avatar">{{ avatarInitials() }}</div>
        </a>
      </div>
    </header>
  `,
  styles: [
    `
      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        margin-bottom: 24px;
      }

      .search-box {
        flex: 1;
        max-width: 480px;
        position: relative;
      }

      .search-icon {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 16px;
      }

      .search-input {
        width: 100%;
        padding: 12px 16px 12px 44px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      .search-input:focus {
        border-color: var(--ac-color-blue-500);
      }

      .topbar-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .icon-btn {
        position: relative;
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .icon-btn:hover {
        background: var(--ac-color-slate-100);
      }

      .icon {
        font-size: 20px;
      }

      .badge {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 8px;
        height: 8px;
        background: var(--ac-color-red-500);
        border-radius: 50%;
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-left: 16px;
        border-left: 1px solid var(--ac-color-border-slate);
        text-decoration: none;
        color: inherit;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .user-profile:hover {
        opacity: 0.8;
      }

      .user-info {
        display: flex;
        flex-direction: column;
        text-align: right;
      }

      .user-name {
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
        font-size: 14px;
      }

      .user-role {
        font-size: 12px;
        color: var(--ac-color-text-slate);
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        background: var(--ac-color-blue-100);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        color: #1e40af;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolTopbarComponent {
  private readonly auth = inject(AuthService);
  private readonly parent = this.auth.parent;

  protected readonly displayName = computed(() => {
    const p = this.parent();
    if (p) return `${p.firstName} ${p.lastName}`;
    return 'School Staff';
  });

  protected readonly roleLabel = computed(() => {
    const p = this.parent();
    if (p?.role === 'SCHOOL') return 'School account';
    return p?.role ?? 'Staff';
  });

  protected readonly avatarInitials = computed(() => {
    const p = this.parent();
    if (p) return `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase();
    return 'SS';
  });
}
