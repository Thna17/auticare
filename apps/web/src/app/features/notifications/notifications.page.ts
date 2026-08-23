// notifications.page.ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SchoolTopbarComponent } from '../../school-component/components/school-topbar.component';

interface Notification {
  id: string;
  senderName: string;
  studentName: string;
  initials: string;
  isSystem?: boolean;
  messagePreview: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Read';
}

@Component({
  standalone: true,
  imports: [SchoolTopbarComponent],
  selector: 'ac-notifications-page',
  template: `
    <div class="page-layout">
      <main class="main-content">
        <ac-school-topbar />

        <!-- Notifications Card -->
        <div class="notifications-card">
          <!-- Filters Bar -->
          <div class="filters-bar">
            <div class="filter-tabs">
              <button class="tab-btn active">All</button>
              <button class="tab-btn">Enrollment</button>
            </div>
            <div class="filter-controls">
              <select class="filter-select">
                <option>Status: All</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Read</option>
              </select>
              <button class="advanced-filter-btn">
                <span>⚙</span>
                <span>Advanced Filters</span>
              </button>
              <button class="icon-btn" aria-label="Refresh">↻</button>
            </div>
          </div>

          <!-- Table -->
          <table class="notifications-table">
            <thead>
              <tr>
                <th>SENDER & STUDENT</th>
                <th>MESSAGE PREVIEW</th>
                <th>DATE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              @for (notification of notifications(); track notification.id) {
                <tr>
                  <td>
                    <div class="sender-cell">
                      <div class="avatar" [class.system]="notification.isSystem">
                        @if (notification.isSystem) {
                          <span class="system-icon">⚠</span>
                        } @else {
                          {{ notification.initials }}
                        }
                      </div>
                      <div class="sender-info">
                        <span class="sender-name">{{ notification.senderName }}</span>
                        @if (notification.studentName) {
                          <span class="student-name">Student: {{ notification.studentName }}</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td class="message-cell">{{ notification.messagePreview }}</td>
                  <td class="date-cell">{{ notification.date }}</td>
                  <td class="status-cell">
                    <a href="#" class="status-link approve">Approve</a>
                    <a href="#" class="status-link details">Details</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="pagination">
            <span class="pagination-info">Showing 1 to 10 of 48 notifications</span>
            <div class="pagination-controls">
              <button class="page-btn">‹</button>
              <button class="page-btn active">1</button>
              <button class="page-btn">2</button>
              <button class="page-btn">3</button>
              <button class="page-btn">›</button>
            </div>
          </div>
        </div>

        <!-- Notification History Card -->
        <div class="history-card">
          <div class="history-content">
            <div class="history-icon">🕐</div>
            <div class="history-info">
              <h3>Notification History</h3>
              <p>Archives are kept for 12 months for compliance records.</p>
            </div>
          </div>
          <button class="archives-btn">Access Archives</button>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .page-layout {
        display: flex;
        gap: 24px;
        padding: 24px;
        background: #f8fafc;
        min-height: 100vh;
      }

      .main-content {
        flex: 1;
        min-width: 0;
        width: 100%;
        max-width: 100%;
      }

      .page-header {
        margin-bottom: 24px;
      }

      .page-header h1 {
        margin: 0 0 8px 0;
        font-size: 28px;
        font-weight: 700;
        color: #0f172a;
      }

      .page-header p {
        margin: 0;
        color: #64748b;
        font-size: 14px;
        max-width: 700px;
      }

      .notifications-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        overflow: hidden;
        margin-bottom: 24px;
      }

      .filters-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e2e8f0;
      }

      .filter-tabs {
        display: flex;
        gap: 8px;
      }

      .tab-btn {
        padding: 8px 16px;
        border: 1px solid #e2e8f0;
        background: white;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tab-btn:hover {
        border-color: #3b82f6;
      }

      .tab-btn.active {
        background: #2d6a7a;
        color: white;
        border-color: #2d6a7a;
      }

      .filter-controls {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .filter-select {
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 13px;
        outline: none;
        cursor: pointer;
      }

      .filter-select:focus {
        border-color: #3b82f6;
      }

      .advanced-filter-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .advanced-filter-btn:hover {
        border-color: #3b82f6;
      }

      .icon-btn {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        color: #64748b;
        transition: background 0.2s;
      }

      .icon-btn:hover {
        background: #f1f5f9;
      }

      .notifications-table {
        width: 100%;
        border-collapse: collapse;
      }

      .notifications-table th {
        text-align: left;
        padding: 14px 20px;
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #e2e8f0;
      }

      .notifications-table td {
        padding: 16px 20px;
        border-bottom: 1px solid #f1f5f9;
        font-size: 14px;
        vertical-align: middle;
      }

      .notifications-table tr:last-child td {
        border-bottom: none;
      }

      .sender-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .avatar {
        width: 40px;
        height: 40px;
        background: #dbeafe;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
        color: #2563eb;
        flex-shrink: 0;
      }

      .avatar.system {
        background: #fee2e2;
        color: #ef4444;
      }

      .system-icon {
        font-size: 18px;
      }

      .sender-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .sender-name {
        font-weight: 600;
        color: #0f172a;
        font-size: 14px;
      }

      .student-name {
        font-size: 12px;
        color: #64748b;
      }

      .message-cell {
        color: #475569;
        max-width: 400px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .date-cell {
        color: #64748b;
        font-size: 13px;
        white-space: nowrap;
      }

      .status-cell {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .status-link {
        font-size: 13px;
        text-decoration: none;
        font-weight: 500;
      }

      .status-link.approve {
        color: #10b981;
      }

      .status-link.approve:hover {
        text-decoration: underline;
      }

      .status-link.details {
        color: #64748b;
      }

      .status-link.details:hover {
        text-decoration: underline;
      }

      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-top: 1px solid #e2e8f0;
      }

      .pagination-info {
        font-size: 13px;
        color: #64748b;
      }

      .pagination-controls {
        display: flex;
        gap: 6px;
      }

      .page-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #e2e8f0;
        background: white;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .page-btn:hover {
        border-color: #3b82f6;
      }

      .page-btn.active {
        background: #2d6a7a;
        color: white;
        border-color: #2d6a7a;
      }

      .history-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .history-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .history-icon {
        font-size: 28px;
      }

      .history-info h3 {
        margin: 0 0 4px 0;
        font-size: 15px;
        font-weight: 600;
        color: #0f172a;
      }

      .history-info p {
        margin: 0;
        font-size: 13px;
        color: #64748b;
      }

      .archives-btn {
        padding: 10px 20px;
        background: white;
        border: 1px solid #2d6a7a;
        color: #2d6a7a;
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .archives-btn:hover {
        background: #2d6a7a;
        color: white;
      }

      /* Responsive Design */
      @media (max-width: 1024px) {
        .page-layout {
          gap: 16px;
          padding: 16px;
        }

        .main-content {
          max-width: calc(100% - 260px);
        }

        .message-cell {
          max-width: 250px;
        }
      }

      @media (max-width: 768px) {
        .page-layout {
          flex-direction: column;
          gap: 0;
          padding: 0;
        }

        .main-content {
          max-width: 100%;
          padding: 16px;
        }

        .filters-bar {
          flex-direction: column;
          gap: 12px;
          align-items: flex-start;
        }

        .filter-controls {
          width: 100%;
          justify-content: space-between;
        }

        .notifications-table {
          display: block;
          overflow-x: auto;
        }

        .history-card {
          flex-direction: column;
          gap: 16px;
          text-align: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPage {
  readonly notifications = signal<Notification[]>([
    {
      id: '1',
      senderName: 'Elena Mitchell',
      studentName: 'Leo M.',
      initials: 'EM',
      messagePreview: 'We are looking to transition Leo into the fl...',
      date: 'Today, 09:42 AM',
      status: 'Pending',
    },
    {
      id: '2',
      senderName: 'James David',
      studentName: 'Sarah D.',
      initials: 'JD',
      messagePreview: "Thank you for the update on Sarah's speec...",
      date: 'Yesterday, 04:15 PM',
      status: 'Pending',
    },
    {
      id: '3',
      senderName: 'System',
      studentName: '',
      initials: '',
      isSystem: true,
      messagePreview: 'Unusual login attempt detected from new...',
      date: 'Oct 24, 11:20 PM',
      status: 'Pending',
    },
    {
      id: '4',
      senderName: 'Robert Anderson',
      studentName: 'Toby A.',
      initials: 'RA',
      messagePreview: 'Regarding the IEP meeting next Tuesday, r...',
      date: 'Oct 24, 02:00 PM',
      status: 'Pending',
    },
  ]);
}
