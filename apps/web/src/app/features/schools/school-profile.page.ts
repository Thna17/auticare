// school-enrollments.page.ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { SchoolStaffResponse } from '@auticare/contracts';
import { SchoolsApi } from './data-access/schools.api';
import { SchoolTopbarComponent } from '../../school-component/components/school-topbar.component';

interface Specialization {
  name: string;
  lead: string;
  status: 'Active' | 'Pending Staff' | 'Inactive';
  icon: string;
}

@Component({
  standalone: true,
  imports: [SchoolTopbarComponent],
  selector: 'ac-school-profile-page',
  template: `
    <div class="page-layout">
      <main class="main-content">
        <ac-school-topbar />

        <!-- Cover Image Section -->
        <div class="cover-section">
          <div class="cover-image">
            <img
              src="https://images.unsplash.com/photo-1562774053-801e4e208e4e?w=1200&h=400&fit=crop"
              alt="School Campus"
            />
            <button class="edit-cover-btn">
              <span>✏</span>
              <span>Edit Cover</span>
            </button>
          </div>

          <!-- School Logo & Basic Info -->
          <div class="school-identity">
            <div class="school-logo">🏫</div>
            <div class="school-basic-info">
              <h1>Serenity Academy for Autism</h1>
              <p class="tagline">Excellence in Neurodivergent Education & Clinical Support</p>
              <span class="verified-badge">✓ Verified</span>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- Left Column -->
          <div class="left-column">
            <!-- General Information -->
            <div class="info-card">
              <div class="card-header">
                <div class="section-title">
                  <span class="icon">ℹ</span>
                  <h2>General Information</h2>
                </div>
                <button class="edit-btn">✏</button>
              </div>
              <p class="mission-text">
                Our mission is to provide a holistic, evidence-based learning environment that
                celebrates neurodiversity. We empower students through individualized education
                programs (IEPs) that integrate clinical excellence with compassionate teaching,
                ensuring every child reaches their unique potential in a supportive atmosphere.
              </p>

              <!-- Stats Grid -->
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">STUDENT-TEACHER</span>
                  <span class="stat-value">3:1</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">AGE RANGE</span>
                  <span class="stat-value">4 - 18</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">CURRENT CAPACITY</span>
                  <div class="stat-with-progress">
                    <span class="stat-value">85%</span>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: 85%"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Clinical Specializations -->
            <div class="info-card">
              <div class="card-header">
                <div class="section-title">
                  <h2>Clinical Specializations</h2>
                </div>
                <button class="add-new-btn">
                  <span>+</span>
                  <span>Add New</span>
                </button>
              </div>

              <div class="specializations-list">
                @for (spec of specializations(); track spec.name) {
                  <div class="specialization-item">
                    <div class="spec-icon">{{ spec.icon }}</div>
                    <div class="spec-info">
                      <span class="spec-name">{{ spec.name }}</span>
                      <span class="spec-lead">Lead: {{ spec.lead }}</span>
                    </div>
                    <span
                      class="status-badge"
                      [class]="spec.status.toLowerCase().replace(' ', '-')"
                    >
                      {{ spec.status }}
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="right-column">
            <!-- Community Rating Card -->
            <div class="rating-card">
              <div class="rating-header">
                <span>Community Rating</span>
                <span class="public-badge">Public</span>
              </div>
              <div class="rating-content">
                <span class="rating-score">4.9</span>
                <div class="stars">★★★★★</div>
                <span class="rating-count">Based on 124 parent reviews</span>
              </div>
              <button class="view-reviews-btn">View All Reviews</button>
            </div>

            <!-- Facility Information -->
            <div class="info-card">
              <div class="card-header">
                <div class="section-title">
                  <h2>Facility Information</h2>
                </div>
              </div>

              <div class="facility-details">
                <div class="detail-row">
                  <span class="detail-icon">📍</span>
                  <div class="detail-content">
                    <span class="detail-label">Address</span>
                    <span class="detail-text"
                      >4228 Willow Creek Way, Suite 100<br />Palo Alto, CA 94301</span
                    >
                  </div>
                </div>

                <div class="detail-row">
                  <span class="detail-icon">🕐</span>
                  <div class="detail-content">
                    <span class="detail-label">Office Hours</span>
                    <div class="hours-grid">
                      <span>Mon - Fri: 8:00 AM - 5:30 PM</span>
                      <span>Sat: 9:00 AM - 1:00 PM</span>
                    </div>
                  </div>
                </div>

                <div class="detail-row">
                  <span class="detail-icon">📞</span>
                  <div class="detail-content">
                    <span class="detail-label">Contact</span>
                    <span class="detail-text">(555) 123-4567</span>
                    <span class="detail-text">hello&#64;serenityacademy.org</span>
                  </div>
                  <button class="update-details-btn">Update Details</button>
                </div>
              </div>

              <!-- Document Preview -->
              <div class="document-preview">
                <div class="doc-thumbnail"></div>
                <div class="doc-thumbnail"></div>
                <div class="doc-thumbnail"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer class="page-footer">
          <span>© 2024 AutiCare Global Inc.</span>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <span class="system-status">
            <span class="status-dot"></span>
            Systems Operational
          </span>
        </footer>
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

      /* Cover Section */
      .cover-section {
        position: relative;
        margin-bottom: 24px;
      }

      .cover-image {
        position: relative;
        border-radius: 16px;
        overflow: hidden;
        height: 320px;
      }

      .cover-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .edit-cover-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
        backdrop-filter: blur(4px);
        transition: background 0.2s;
      }

      .edit-cover-btn:hover {
        background: rgba(0, 0, 0, 0.8);
      }

      .school-identity {
        position: relative;
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 0 24px;
        margin-top: -60px;
      }

      .school-logo {
        width: 120px;
        height: 120px;
        background: white;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 60px;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
        z-index: 1;
      }

      .school-basic-info {
        flex: 1;
        padding-bottom: 16px;
      }

      .school-basic-info h1 {
        margin: 0 0 6px 0;
        font-size: 28px;
        font-weight: 700;
        color: #0f172a;
      }

      .tagline {
        margin: 0 0 8px 0;
        color: #64748b;
        font-size: 14px;
      }

      .verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background: #d1fae5;
        color: #059669;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }

      /* Content Grid */
      .content-grid {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 24px;
        margin-bottom: 24px;
      }

      .left-column,
      .right-column {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      /* Info Cards */
      .info-card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .section-title .icon {
        font-size: 18px;
      }

      .section-title h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
      }

      .edit-btn {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        color: #64748b;
        transition: all 0.2s;
      }

      .edit-btn:hover {
        background: #f1f5f9;
        color: #2d6a7a;
      }

      .mission-text {
        color: #475569;
        line-height: 1.7;
        margin-bottom: 24px;
        font-size: 14px;
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .stat-label {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-value {
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
      }

      .stat-with-progress {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .progress-bar {
        flex: 1;
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: #10b981;
        border-radius: 3px;
      }

      /* Add New Button */
      .add-new-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }

      .add-new-btn:hover {
        background: #059669;
      }

      /* Specializations List */
      .specializations-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .specialization-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px;
        background: #f8fafc;
        border-radius: 10px;
      }

      .spec-icon {
        font-size: 24px;
      }

      .spec-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .spec-name {
        font-weight: 600;
        color: #0f172a;
        font-size: 14px;
      }

      .spec-lead {
        font-size: 12px;
        color: #64748b;
      }

      .status-badge {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-badge.active {
        background: #d1fae5;
        color: #059669;
      }

      .status-badge.pending-staff {
        background: #fef3c7;
        color: #d97706;
      }

      .status-badge.inactive {
        background: #fee2e2;
        color: #dc2626;
      }

      /* Rating Card */
      .rating-card {
        background: linear-gradient(135deg, #2d6a7a 0%, #1e4a5a 100%);
        border-radius: 12px;
        padding: 24px;
        color: white;
        box-shadow: 0 4px 12px rgba(45, 106, 122, 0.3);
      }

      .rating-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        font-size: 13px;
        opacity: 0.9;
      }

      .public-badge {
        padding: 4px 10px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
      }

      .rating-content {
        text-align: center;
        margin-bottom: 20px;
      }

      .rating-score {
        display: block;
        font-size: 56px;
        font-weight: 700;
        line-height: 1;
        margin-bottom: 8px;
      }

      .stars {
        font-size: 24px;
        letter-spacing: 4px;
        margin-bottom: 8px;
      }

      .rating-count {
        font-size: 13px;
        opacity: 0.9;
      }

      .view-reviews-btn {
        width: 100%;
        padding: 12px;
        background: rgba(255, 255, 255, 0.15);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .view-reviews-btn:hover {
        background: rgba(255, 255, 255, 0.25);
      }

      /* Facility Details */
      .facility-details {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .detail-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      .detail-icon {
        font-size: 18px;
        margin-top: 2px;
      }

      .detail-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .detail-label {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .detail-text {
        font-size: 13px;
        color: #0f172a;
        line-height: 1.5;
      }

      .hours-grid {
        display: grid;
        gap: 2px;
        font-size: 13px;
        color: #0f172a;
      }

      .update-details-btn {
        align-self: flex-start;
        padding: 6px 12px;
        background: white;
        border: 1px solid #2d6a7a;
        color: #2d6a7a;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .update-details-btn:hover {
        background: #2d6a7a;
        color: white;
      }

      /* Document Preview */
      .document-preview {
        display: flex;
        gap: 8px;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
      }

      .doc-thumbnail {
        width: 80px;
        height: 100px;
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        border-radius: 8px;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.1);
      }

      /* Footer */
      .page-footer {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px 24px;
        border-top: 1px solid #e2e8f0;
        font-size: 13px;
        color: #64748b;
      }

      .page-footer a {
        color: #64748b;
        text-decoration: none;
      }

      .page-footer a:hover {
        color: #2d6a7a;
      }

      .system-status {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
      }

      /* Responsive Design */
      @media (max-width: 1024px) {
        .content-grid {
          grid-template-columns: 1fr;
        }

        .right-column {
          order: -1;
        }

        .rating-card,
        .info-card {
          margin-bottom: 0;
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

        .cover-image {
          height: 200px;
        }

        .school-identity {
          flex-direction: column;
          margin-top: -40px;
          padding: 0;
        }

        .school-logo {
          width: 80px;
          height: 80px;
          font-size: 40px;
        }

        .school-basic-info h1 {
          font-size: 22px;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .page-footer {
          flex-direction: column;
          gap: 8px;
          text-align: center;
        }

        .system-status {
          margin-left: 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolProfilePage implements OnInit {
  private readonly api = inject(SchoolsApi);
  readonly profile = signal<SchoolStaffResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly specializations = signal<Specialization[]>([
    { name: 'ABA Therapy', lead: 'Dr. Marcus Thorne', status: 'Active', icon: '🧩' },
    { name: 'Speech Therapy', lead: 'Sarah Jenkins, SLP', status: 'Active', icon: '💬' },
    {
      name: 'Occupational Therapy',
      lead: 'Alex Rivera, OTR/L',
      status: 'Pending Staff',
      icon: '✋',
    },
  ]);

  ngOnInit() {
    this.loading.set(true);
    this.api.getMySchoolStaffProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('School profile could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });
  }
}
