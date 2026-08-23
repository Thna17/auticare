// parent-report-detail.page.ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface EngagementMetric {
  label: string;
  value: number;
  color: string;
}

interface ActivityMoment {
  id: string;
  imageUrl: string;
  title: string;
}

interface HomeFollowUpItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

@Component({
  standalone: true,
  selector: 'ac-parent-report-detail-page',
  template: `
    <div class="page-layout">
      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Bar -->
        <header class="topbar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search reports..." class="search-input" />
          </div>
          <div class="topbar-actions">
            <button class="icon-btn" aria-label="Notifications">
              <span>🔔</span>
            </button>
            <button class="icon-btn" aria-label="Help">
              <span>?</span>
            </button>
            <div class="user-profile-small">
              <div class="user-text">
                <span class="name">Alex Thompson</span>
                <span class="role">Parent Account</span>
              </div>
              <div class="avatar-small">AT</div>
            </div>
          </div>
        </header>

        <!-- Report Content -->
        <div class="report-container">
          <!-- Report Header -->
          <div class="report-header">
            <div>
              <h1>Activity Report: Tactile Exploration Session</h1>
              <div class="report-meta">
                <span class="date">Date: October 24, 2023</span>
                <span class="status-badge completed">✓ Completed Successfully</span>
              </div>
            </div>
          </div>

          <div class="report-grid">
            <!-- Left Column -->
            <div class="report-main">
              <!-- Activity Summary -->
              <section class="report-card">
                <div class="card-header">
                  <span class="card-icon"></span>
                  <h2>Activity Summary</h2>
                </div>
                <div class="card-content">
                  <p>
                    During today's tactile exploration session, we focused on sensory integration
                    through various textures. The primary objective was to encourage independent
                    interaction with non-preferred materials and promote bilateral coordination.
                  </p>
                  <p>
                    The student showed exceptional curiosity toward the kinetic sand area,
                    maintaining focus for over 15 minutes. While initially hesitant with the
                    building blocks, gradual prompting led to a collaborative tower-building
                    exercise that practiced both fine motor skills and turn-taking concepts.
                  </p>
                </div>
              </section>

              <!-- Activity Moments -->
              <section class="report-card">
                <div class="card-header">
                  <span class="card-icon">📷</span>
                  <h2>Activity Moments</h2>
                  <button class="view-all-btn">View All Photos</button>
                </div>
                <div class="activity-moments">
                  @for (moment of activityMoments(); track moment.id) {
                    <div class="moment-card">
                      <img [src]="moment.imageUrl" [alt]="moment.title" class="moment-image" />
                      <div class="moment-overlay">
                        <span>{{ moment.title }}</span>
                      </div>
                    </div>
                  }
                </div>
              </section>

              <!-- Teacher Observations -->
              <section class="report-card observations-card">
                <div class="card-header">
                  <div class="teacher-info">
                    <div class="teacher-avatar">‍🏫</div>
                    <div>
                      <h3>Teacher Observations</h3>
                    </div>
                  </div>
                  <span class="score-badge">99</span>
                </div>
                <div class="card-content">
                  <blockquote class="observation-quote">
                    "It was wonderful to see the breakthrough today during the stacking activity.
                    There was a clear moment of joy when the tower reached its peak. We're seeing
                    more consistent eye contact when requesting specific blocks, which is a
                    significant milestone in our communication goals."
                  </blockquote>
                  <cite class="teacher-name">— Ms. Sarah Jenkins, Lead Behavioral Therapist</cite>
                </div>
              </section>
            </div>

            <!-- Right Column -->
            <div class="report-sidebar">
              <!-- Engagement Metrics -->
              <section class="report-card engagement-card">
                <div class="card-header">
                  <span class="card-icon">📊</span>
                  <h2>Engagement</h2>
                </div>
                <div class="engagement-overall">
                  <div class="circular-progress">
                    <svg viewBox="0 0 120 120" class="progress-svg">
                      <circle class="progress-bg" cx="60" cy="60" r="52"></circle>
                      <circle
                        class="progress-bar"
                        cx="60"
                        cy="60"
                        r="52"
                        [attr.stroke-dasharray]="2 * 3.14159 * 52"
                        [attr.stroke-dashoffset]="
                          2 * 3.14159 * 52 * (1 - engagementMetrics()[0].value / 100)
                        "
                      ></circle>
                    </svg>
                    <div class="progress-text">
                      <span class="progress-value">{{ engagementMetrics()[0].value }}%</span>
                      <span class="progress-label">Overall Participation</span>
                    </div>
                  </div>
                </div>
                <div class="engagement-breakdown">
                  @for (metric of engagementMetrics().slice(1); track metric.label) {
                    <div class="metric-row">
                      <span class="metric-label">{{ metric.label }}</span>
                      <div class="metric-bar-bg">
                        <div
                          class="metric-bar-fill"
                          [style.width.%]="metric.value"
                          [style.background]="metric.color"
                        ></div>
                      </div>
                      <span class="metric-value">{{ metric.value }}%</span>
                    </div>
                  }
                </div>
              </section>

              <!-- Home Follow-up -->
              <section class="report-card followup-card">
                <div class="card-header">
                  <span class="card-icon">🏠</span>
                  <h2>Home Follow-up</h2>
                </div>
                <div class="card-content">
                  <p class="followup-intro">
                    Continue these activities at home to reinforce today's learnings:
                  </p>
                  <div class="followup-list">
                    @for (item of homeFollowUpItems(); track item.id) {
                      <label class="followup-item">
                        <input
                          type="checkbox"
                          [checked]="item.completed"
                          class="followup-checkbox"
                        />
                        <span class="checkmark"></span>
                        <div class="followup-content">
                          <span class="followup-title">{{ item.title }}</span>
                          <span class="followup-desc">{{ item.description }}</span>
                        </div>
                      </label>
                    }
                  </div>
                  <button class="mark-all-btn">Mark All as Complete</button>
                </div>
              </section>

              <!-- Action Buttons -->
              <div class="action-buttons">
                <button class="btn-secondary">
                  <span>↗</span>
                  <span>Share with Specialist</span>
                </button>
                <button class="btn-primary">
                  <span>⬇</span>
                  <span>Download Full Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .page-layout {
        display: flex;
        min-height: 100vh;
        background: #f8fafc;
      }

      /* Sidebar Styles */
      .sidebar {
        width: 260px;
        background: white;
        border-right: 1px solid #e2e8f0;
        padding: 24px 16px;
        display: flex;
        flex-direction: column;
        gap: 24px;
        position: sticky;
        top: 0;
        height: 100vh;
        overflow-y: auto;
      }

      .sidebar-header {
        padding: 0 8px;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .logo-icon {
        font-size: 32px;
        background: #2d6a7a;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .logo-text {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f1f5f9;
        border-radius: 12px;
      }

      .avatar {
        width: 44px;
        height: 44px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 16px;
      }

      .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
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

      .nav-menu {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 10px;
        text-decoration: none;
        color: #475569;
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
        background: #f1f5f9;
      }

      .nav-item.active {
        background: #dbeafe;
        color: #1e40af;
        font-weight: 600;
      }

      .nav-icon {
        font-size: 18px;
        width: 24px;
        text-align: center;
      }

      .sidebar-footer {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
      }

      .logout-btn {
        color: #ef4444;
      }

      .logout-btn:hover {
        background: rgba(239, 68, 68, 0.1);
      }

      /* Main Content */
      .main-content {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
      }

      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
        gap: 24px;
      }

      .search-box {
        flex: 1;
        max-width: 400px;
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
        background: white;
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
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: background 0.2s;
        color: #64748b;
      }

      .icon-btn:hover {
        background: #f1f5f9;
      }

      .user-profile-small {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-left: 16px;
        border-left: 1px solid #e2e8f0;
      }

      .user-text {
        display: flex;
        flex-direction: column;
        text-align: right;
      }

      .name {
        font-weight: 600;
        color: #0f172a;
        font-size: 14px;
      }

      .role {
        font-size: 12px;
        color: #64748b;
      }

      .avatar-small {
        width: 40px;
        height: 40px;
        background: #dbeafe;
        color: #2563eb;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
      }

      /* Report Container */
      .report-container {
        width: 100%;
      }

      .report-header {
        margin-bottom: 32px;
      }

      .report-header h1 {
        margin: 0 0 12px 0;
        font-size: 28px;
        font-weight: 700;
        color: #1e293b;
      }

      .report-meta {
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .date {
        color: #64748b;
        font-size: 14px;
      }

      .status-badge {
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }

      .status-badge.completed {
        background: #d1fae5;
        color: #059669;
      }

      /* Report Grid */
      .report-grid {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 24px;
      }

      .report-main {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .report-sidebar {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      /* Report Card */
      .report-card {
        background: white;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }

      .card-icon {
        font-size: 24px;
      }

      .card-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
      }

      .view-all-btn {
        margin-left: auto;
        background: none;
        border: none;
        color: #3b82f6;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }

      .card-content {
        color: #475569;
        line-height: 1.7;
      }

      .card-content p {
        margin: 0 0 16px 0;
      }

      .card-content p:last-child {
        margin-bottom: 0;
      }

      /* Activity Moments */
      .activity-moments {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .moment-card {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        aspect-ratio: 16/10;
      }

      .moment-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .moment-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
        color: white;
        padding: 12px;
        font-size: 13px;
        font-weight: 600;
      }

      /* Observations Card */
      .observations-card .card-header {
        justify-content: space-between;
      }

      .teacher-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .teacher-avatar {
        width: 44px;
        height: 44px;
        background: #dbeafe;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }

      .teacher-info h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }

      .score-badge {
        background: #f1f5f9;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 20px;
        color: #1e293b;
      }

      .observation-quote {
        margin: 0 0 16px 0;
        padding: 0;
        font-style: italic;
        color: #475569;
        line-height: 1.8;
        border: none;
      }

      .teacher-name {
        font-style: normal;
        font-weight: 600;
        color: #64748b;
        font-size: 13px;
      }

      /* Engagement Card */
      .engagement-overall {
        display: flex;
        justify-content: center;
        margin-bottom: 24px;
      }

      .circular-progress {
        position: relative;
        width: 140px;
        height: 140px;
      }

      .progress-svg {
        transform: rotate(-90deg);
        width: 100%;
        height: 100%;
      }

      .progress-bg {
        fill: none;
        stroke: #e2e8f0;
        stroke-width: 8;
      }

      .progress-bar {
        fill: none;
        stroke: #10b981;
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.5s ease;
      }

      .progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .progress-value {
        display: block;
        font-size: 32px;
        font-weight: 700;
        color: #10b981;
        line-height: 1;
      }

      .progress-label {
        font-size: 12px;
        color: #64748b;
        margin-top: 4px;
      }

      .engagement-breakdown {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .metric-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .metric-label {
        width: 100px;
        font-size: 13px;
        color: #475569;
        font-weight: 500;
      }

      .metric-bar-bg {
        flex: 1;
        height: 8px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
      }

      .metric-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;
      }

      .metric-value {
        width: 40px;
        text-align: right;
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
      }

      /* Follow-up Card */
      .followup-intro {
        margin: 0 0 20px 0;
        font-size: 14px;
        color: #64748b;
      }

      .followup-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
      }

      .followup-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .followup-item:hover {
        background: #f1f5f9;
      }

      .followup-checkbox {
        width: 18px;
        height: 18px;
        margin-top: 2px;
        cursor: pointer;
        accent-color: #10b981;
      }

      .followup-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .followup-title {
        font-weight: 600;
        font-size: 14px;
        color: #1e293b;
      }

      .followup-desc {
        font-size: 12px;
        color: #64748b;
      }

      .mark-all-btn {
        width: 100%;
        padding: 10px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        color: #3b82f6;
        cursor: pointer;
        transition: all 0.2s;
      }

      .mark-all-btn:hover {
        background: #f8fafc;
        border-color: #3b82f6;
      }

      /* Action Buttons */
      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .btn-primary,
      .btn-secondary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px 20px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .btn-primary {
        background: #2d6a7a;
        color: white;
      }

      .btn-primary:hover {
        background: #1f4f5c;
      }

      .btn-secondary {
        background: white;
        color: #2d6a7a;
        border: 1px solid #2d6a7a;
      }

      .btn-secondary:hover {
        background: #f0f7fa;
      }

      /* Responsive */
      @media (max-width: 1024px) {
        .report-grid {
          grid-template-columns: 1fr;
        }

        .report-sidebar {
          order: -1;
        }
      }

      @media (max-width: 768px) {
        .sidebar {
          display: none;
        }

        .main-content {
          padding: 20px;
        }

        .report-grid {
          grid-template-columns: 1fr;
        }

        .activity-moments {
          grid-template-columns: 1fr;
        }

        .topbar {
          flex-direction: column;
          gap: 16px;
        }

        .search-box {
          max-width: 100%;
        }

        .user-profile-small .user-text {
          display: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressPage {
  private readonly route = inject(ActivatedRoute);

  readonly activityMoments = signal<ActivityMoment[]>([
    {
      id: '1',
      imageUrl: 'https://images.unsplash.com/photo-1562774053-801e4e208e4e?w=400&h=300&fit=crop',
      title: 'Sand Play Exploration',
    },
    {
      id: '2',
      imageUrl: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&h=300&fit=crop',
      title: 'Building Blocks Session',
    },
  ]);

  readonly engagementMetrics = signal<EngagementMetric[]>([
    { label: 'Overall Participation', value: 90, color: '#10B981' },
    { label: 'Communication', value: 85, color: '#3B82F6' },
    { label: 'Social Skills', value: 70, color: '#8B5CF6' },
    { label: 'Daily Living', value: 92, color: '#F59E0B' },
  ]);

  readonly homeFollowUpItems = signal<HomeFollowUpItem[]>([
    {
      id: '1',
      title: 'Texture matching game',
      description: 'Find 3 different soft objects',
      completed: false,
    },
    {
      id: '2',
      title: 'Block building practice',
      description: 'Encourage stacking 5+ items',
      completed: false,
    },
    {
      id: '3',
      title: 'Color naming',
      description: 'Practice naming primary colors',
      completed: false,
    },
  ]);
}
