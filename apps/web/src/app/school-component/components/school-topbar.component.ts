// school-topbar.component.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  standalone: true,
  selector: 'ac-school-topbar',
  template: `
    <header class="topbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
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
        <div class="user-profile">
          <div class="user-info">
            <span class="user-name">Sarah Mitchell</span>
            <span class="user-role">Senior Special Educator</span>
          </div>
          <div class="user-avatar">👩‍🏫</div>
        </div>
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
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      .search-input:focus {
        border-color: #3b82f6;
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
        background: #f1f5f9;
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
        background: #ef4444;
        border-radius: 50%;
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-left: 16px;
        border-left: 1px solid #e2e8f0;
      }

      .user-info {
        display: flex;
        flex-direction: column;
        text-align: right;
      }

      .user-name {
        font-weight: 600;
        color: #0f172a;
        font-size: 14px;
      }

      .user-role {
        font-size: 12px;
        color: #64748b;
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        background: #dbeafe;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolTopbarComponent {}
