// school-sidebar.component.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  selector: 'ac-school-sidebar',
  template: `
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="logo">
          <span class="logo-icon"></span>
          <span class="logo-text">AutiCare</span>
        </div>
        <button class="menu-toggle" aria-label="Toggle menu">☰</button>
      </div>

      <!-- School Profile -->
      <div class="school-profile">
        <div class="school-avatar">🏫</div>
        <div class="school-info">
          <span class="school-name">Riverside Academy</span>
          <span class="school-type">School account</span>
        </div>
        <span class="dropdown-arrow">▾</span>
      </div>

      <!-- Navigation -->
      <nav class="nav-menu">
        <a routerLink="/school/dashboard" routerLinkActive="active" class="nav-item">
          <span class="nav-icon"></span>
          <span>Dashboard</span>
        </a>
        <a routerLink="/school/profile" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🏛</span>
          <span>School Profile</span>
        </a>
        <a routerLink="/school/students" routerLinkActive="active" class="nav-item active">
          <span class="nav-icon"></span>
          <span>Students</span>
        </a>
        <a routerLink="/school/reports" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">◐</span>
          <span>Reports</span>
        </a>
        <a routerLink="/school/notifications" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">🔔</span>
          <span>Notifications</span>
        </a>
      </nav>

      <!-- Add Activity Button -->
      <div class="sidebar-action">
        <button class="add-activity-btn">+ Add Activity</button>
      </div>

      <!-- Bottom Menu -->
      <div class="sidebar-footer">
        <a routerLink="/school/settings" class="nav-item">
          <span class="nav-icon">⚙</span>
          <span>Settings</span>
        </a>
        <a routerLink="/school/help" class="nav-item">
          <span class="nav-icon">?</span>
          <span>Help Center</span>
        </a>
        <button class="nav-item logout-btn">
          <span class="nav-icon"></span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [
    `
      .sidebar {
        width: 260px;
        background: #e8f4f8;
        border-radius: 16px;
        padding: 24px 16px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        height: calc(100vh - 32px);
        position: sticky;
        top: 16px;
      }

      .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 8px;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .logo-icon {
        font-size: 24px;
      }

      .logo-text {
        font-size: 20px;
        font-weight: 700;
        color: #1a3a4a;
      }

      .menu-toggle {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #3d6375;
      }

      .school-profile {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: white;
        border-radius: 12px;
        cursor: pointer;
      }

      .school-avatar {
        width: 40px;
        height: 40px;
        background: #dbeafe;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .school-info {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .school-name {
        font-weight: 600;
        color: #0f172a;
        font-size: 14px;
      }

      .school-type {
        font-size: 12px;
        color: #64748b;
      }

      .dropdown-arrow {
        color: #64748b;
      }

      .nav-menu {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 10px;
        text-decoration: none;
        color: #3d6375;
        font-weight: 500;
        font-size: 14px;
        transition: all 0.2s;
        cursor: pointer;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
      }

      .nav-item:hover {
        background: rgba(255, 255, 255, 0.5);
      }

      .nav-item.active {
        background: #a8d5e2;
        color: #1a3a4a;
        font-weight: 600;
      }

      .nav-icon {
        font-size: 18px;
        width: 24px;
        text-align: center;
      }

      .sidebar-action {
        margin-top: 8px;
      }

      .add-activity-btn {
        width: 100%;
        padding: 14px;
        background: #2d6a7a;
        color: white;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .add-activity-btn:hover {
        background: #1f4f5c;
      }

      .sidebar-footer {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .logout-btn {
        color: #ef4444;
      }

      .logout-btn:hover {
        background: rgba(239, 68, 68, 0.1);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolSidebarComponent {}
