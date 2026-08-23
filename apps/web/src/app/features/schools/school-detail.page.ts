// school-detail.page.ts (Parent Side)
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface SchoolService {
  icon: string;
  title: string;
  description: string;
}

interface CurriculumFeature {
  icon: string;
  title: string;
  description: string;
}

interface ProgressMetric {
  label: string;
  value: number;
  color: string;
}

@Component({
  standalone: true,
  imports: [RouterLink], // ✅ Added RouterLink here
  selector: 'ac-parent-school-detail-page',
  template: `
    <div class="page-layout">
      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Bar -->
        <header class="topbar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search school records..." class="search-input" />
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
                <span class="name">Sarah Jenkins</span>
                <span class="role">Care Coordinator</span>
              </div>
              <div class="avatar-small">SJ</div>
            </div>
          </div>
        </header>

        <!-- School Detail Content -->
        <div class="school-detail">
          <!-- ✅ Fixed Back Button Link -->
          <a class="back-to-schools" routerLink="/schools">
            <span aria-hidden="true">←</span>
            Back to Schools
          </a>

          <!-- Navigation Tabs -->
          <nav class="detail-tabs">
            <a class="tab active">Overview</a>
            <a class="tab">Programs</a>
            <a class="tab">Faculty</a>
            <div class="tab-avatar">👤</div>
          </nav>

          <!-- School Header -->
          <section class="school-header">
            <div class="header-content">
              <span class="verified-badge">✓ VERIFIED LEARNING CENTER</span>
              <h1>Blue Horizon Learning Center</h1>
              <div class="rating-location">
                <div class="rating">
                  <span class="star">★</span>
                  <span class="rating-value">4.8</span>
                  <span class="rating-count">(89)</span>
                </div>
                <span class="location">📍 1234 Educational Plaza, Suite 400, Phnom Penh</span>
              </div>
              <div class="action-buttons">
                <button class="btn-primary">Request Enrollment</button>
                <button class="btn-secondary">Book Tour</button>
                <button class="btn-secondary">Contact School</button>
              </div>
            </div>
            <div class="header-image">
              <img
                src="https://images.unsplash.com/photo-1562774053-801e4e208e4e?w=400&h=300&fit=crop"
                alt="School campus"
              />
            </div>
          </section>

          <!-- Stats Row -->
          <section class="stats-row">
            <div class="stat-item">
              <span class="stat-label">Student-Teacher Ratio</span>
              <span class="stat-value">5:1</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Age Range</span>
              <span class="stat-value">3-17 years</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Availability</span>
              <span class="stat-value">Immediate</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Capacity</span>
              <span class="stat-value">48 Students</span>
            </div>
          </section>

          <!-- About & Services -->
          <section class="about-services">
            <div class="about-section">
              <h2>Nurturing Every Potential</h2>
              <p>
                At Blue Horizon, we believe that education for children on the autism spectrum
                requires a delicate balance of evidence-based clinical rigor and profound human
                empathy. Our philosophy is rooted in the "Whole-Child" approach, where academic
                progress is measured alongside emotional regulation, social communication, and
                sensory well-being.
              </p>
              <p>
                Our team of board-certified behavior analysts, speech therapists, and special
                education experts work in concert to build individualized roadmaps for every
                student, ensuring that the classroom environment adapts to the child, rather than
                forcing the child to adapt to the classroom.
              </p>
              <div class="faculty-preview">
                <div class="faculty-avatars">
                  <div class="faculty-avatar">👨‍</div>
                  <div class="faculty-avatar">👩‍🏫</div>
                  <div class="faculty-avatar">‍💼</div>
                  <div class="faculty-avatar">👩‍⚕️</div>
                </div>
                <span class="faculty-count">+12 Specialist Faculty Members</span>
              </div>
            </div>

            <div class="services-grid">
              @for (service of services(); track service.title) {
                <div class="service-card">
                  <div class="service-icon">{{ service.icon }}</div>
                  <h3>{{ service.title }}</h3>
                  <p>{{ service.description }}</p>
                </div>
              }
            </div>
          </section>

          <!-- Curriculum Section -->
          <section class="curriculum-section">
            <div class="curriculum-content">
              <h2>The Collaborative Curriculum</h2>
              @for (feature of curriculumFeatures(); track feature.title) {
                <div class="curriculum-feature">
                  <div class="feature-icon">{{ feature.icon }}</div>
                  <div class="feature-text">
                    <h3>{{ feature.title }}</h3>
                    <p>{{ feature.description }}</p>
                  </div>
                </div>
              }
            </div>

            <div class="progress-tracker">
              <div class="tracker-header">
                <span>Student Progress Tracker</span>
                <span class="term">Term 2 · Week 8</span>
              </div>
              @for (metric of progressMetrics(); track metric.label) {
                <div class="progress-item">
                  <div class="progress-label">
                    <span>{{ metric.label }}</span>
                    <span class="progress-value">{{ metric.value }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      [style.width.%]="metric.value"
                      [style.background]="metric.color"
                    ></div>
                  </div>
                </div>
              }
              <div class="testimonial">
                <p>"Leo has shown remarkable growth in initiating play with peers this month."</p>
                <span class="testimonial-author">— Ms. Sarah, Lead Educator</span>
              </div>
            </div>
          </section>

          <!-- Campus Visit Section -->
          <section class="campus-visit">
            <div class="visit-info">
              <h2>Visit Our Campus</h2>
              <div class="info-item">
                <span class="info-icon">📍</span>
                <div>
                  <span class="info-label">Address</span>
                  <span class="info-text"
                    >1234 Educational Plaza, Suite 400<br />Phnom Penh, Cambodia</span
                  >
                </div>
              </div>
              <div class="info-item">
                <span class="info-icon">🕐</span>
                <div>
                  <span class="info-label">Office Hours</span>
                  <span class="info-text"
                    >Mon - Fri: 8:00 AM - 6:00 PM<br />Saturday: 9:00 AM - 1:00 PM<br />Sunday:
                    Closed</span
                  >
                </div>
              </div>
              <div class="info-item">
                <span class="info-icon">📞</span>
                <div>
                  <span class="info-label">Get in Touch</span>
                  <span class="info-text">+855 12 345 678<br />hello@bluehorizon.edu.kh</span>
                </div>
              </div>
            </div>
            <div class="campus-image">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop"
                alt="Campus building"
              />
              <div class="image-overlay">
                <span>📍 Blue Horizon Campus</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .page-layout {
        display: flex;
        min-height: 100vh;
        background: #f0f7fa;
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
        max-width: 600px;
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
      }

      .icon-btn:hover {
        background: #e2e8f0;
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

      /* School Detail */
      .school-detail {
        max-width: 1200px;
        margin: 0 auto;
      }

      .detail-tabs {
        display: flex;
        gap: 24px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e2e8f0;
      }

      .back-to-schools {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding: 12px 18px;
        width: fit-content;
        border: 1px solid #2d6a7a;
        border-radius: 10px;
        background: white;
        color: #2d6a7a;
        font-size: 16px;
        font-weight: 600;
        text-decoration: none;
        transition:
          background 0.2s,
          color 0.2s;
      }

      .back-to-schools:hover {
        background: #2d6a7a;
        color: white;
      }

      .tab {
        padding: 8px 16px;
        color: #64748b;
        text-decoration: none;
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        transition: color 0.2s;
      }

      .tab:hover {
        color: #2d6a7a;
      }

      .tab.active {
        color: #2d6a7a;
        font-weight: 600;
        border-bottom: 2px solid #2d6a7a;
      }

      .tab-avatar {
        margin-left: auto;
        width: 36px;
        height: 36px;
        background: #dbeafe;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }

      /* School Header */
      .school-header {
        display: flex;
        gap: 32px;
        background: white;
        padding: 32px;
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        margin-bottom: 24px;
      }

      .header-content {
        flex: 1;
      }

      .verified-badge {
        display: inline-block;
        padding: 6px 12px;
        background: #d1fae5;
        color: #059669;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.5px;
        margin-bottom: 12px;
      }

      .school-header h1 {
        margin: 0 0 12px 0;
        font-size: 32px;
        font-weight: 700;
        color: #0f172a;
      }

      .rating-location {
        display: flex;
        gap: 24px;
        align-items: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .rating {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .star {
        color: #f59e0b;
        font-size: 18px;
      }

      .rating-value {
        font-weight: 700;
        color: #0f172a;
        font-size: 16px;
      }

      .rating-count {
        color: #64748b;
        font-size: 13px;
      }

      .location {
        color: #64748b;
        font-size: 14px;
      }

      .action-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .btn-primary {
        padding: 12px 24px;
        background: #2d6a7a;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .btn-primary:hover {
        background: #1f4f5c;
      }

      .btn-secondary {
        padding: 12px 24px;
        background: white;
        color: #2d6a7a;
        border: 1px solid #2d6a7a;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-secondary:hover {
        background: #f0f7fa;
      }

      .header-image {
        flex-shrink: 0;
      }

      .header-image img {
        width: 280px;
        height: 200px;
        object-fit: cover;
        border-radius: 12px;
      }

      /* Stats Row */
      .stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .stat-item {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .stat-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
      }

      .stat-value {
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
      }

      /* About & Services */
      .about-services {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 24px;
      }

      .about-section,
      .services-grid {
        background: white;
        padding: 32px;
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      }

      .about-section h2 {
        margin: 0 0 16px 0;
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
      }

      .about-section p {
        color: #475569;
        line-height: 1.7;
        margin-bottom: 16px;
        font-size: 14px;
      }

      .faculty-preview {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 24px;
      }

      .faculty-avatars {
        display: flex;
      }

      .faculty-avatar {
        width: 40px;
        height: 40px;
        background: #dbeafe;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        margin-left: -8px;
        border: 2px solid white;
      }

      .faculty-avatar:first-child {
        margin-left: 0;
      }

      .faculty-count {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
      }

      .services-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .service-card {
        background: #f0f7fa;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
      }

      .service-icon {
        font-size: 32px;
        margin-bottom: 12px;
      }

      .service-card h3 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
      }

      .service-card p {
        margin: 0;
        font-size: 12px;
        color: #64748b;
        line-height: 1.5;
      }

      /* Curriculum Section */
      .curriculum-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 24px;
      }

      .curriculum-content,
      .progress-tracker {
        background: white;
        padding: 32px;
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      }

      .curriculum-content h2 {
        margin: 0 0 24px 0;
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
      }

      .curriculum-feature {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
      }

      .feature-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      .feature-text h3 {
        margin: 0 0 6px 0;
        font-size: 15px;
        font-weight: 600;
        color: #0f172a;
      }

      .feature-text p {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        line-height: 1.6;
      }

      .tracker-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e2e8f0;
      }

      .tracker-header span:first-child {
        font-weight: 600;
        color: #0f172a;
        font-size: 15px;
      }

      .term {
        font-size: 12px;
        color: #64748b;
      }

      .progress-item {
        margin-bottom: 16px;
      }

      .progress-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 13px;
      }

      .progress-label span:first-child {
        color: #475569;
      }

      .progress-value {
        font-weight: 600;
        color: #0f172a;
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s;
      }

      .testimonial {
        margin-top: 24px;
        padding: 16px;
        background: #f0f7fa;
        border-radius: 8px;
        border-left: 3px solid #2d6a7a;
      }

      .testimonial p {
        margin: 0 0 8px 0;
        font-size: 13px;
        color: #475569;
        font-style: italic;
      }

      .testimonial-author {
        font-size: 12px;
        color: #64748b;
        font-weight: 600;
      }

      /* Campus Visit */
      .campus-visit {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        background: white;
        padding: 32px;
        border-radius: 16px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      }

      .visit-info h2 {
        margin: 0 0 24px 0;
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
      }

      .info-item {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
      }

      .info-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .info-label {
        display: block;
        font-size: 11px;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .info-text {
        font-size: 14px;
        color: #0f172a;
        line-height: 1.6;
      }

      .campus-image {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
      }

      .campus-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .image-overlay {
        position: absolute;
        bottom: 16px;
        left: 16px;
        background: rgba(45, 106, 122, 0.9);
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
      }

      /* Responsive */
      @media (max-width: 1024px) {
        .about-services,
        .curriculum-section,
        .campus-visit {
          grid-template-columns: 1fr;
        }

        .stats-row {
          grid-template-columns: repeat(2, 1fr);
        }

        .school-header {
          flex-direction: column;
        }

        .header-image img {
          width: 100%;
        }
      }

      @media (max-width: 768px) {
        .stats-row {
          grid-template-columns: 1fr;
        }

        .action-buttons {
          flex-direction: column;
        }

        .rating-location {
          flex-direction: column;
          align-items: flex-start;
        }

        .services-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly schoolId = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.schoolId.set(id);
    console.log('SchoolDetailPage loaded for school ID:', id);
  }

  readonly services = signal<SchoolService[]>([
    {
      icon: '🧩',
      title: 'ABA Therapy',
      description: 'Applied Behavior Analysis',
    },
    {
      icon: '💬',
      title: 'Speech & Language',
      description: 'Communication Support',
    },
    {
      icon: '✋',
      title: 'Occupational',
      description: 'Fine Motor Skills',
    },
    {
      icon: '🎯',
      title: 'Sensory Integration',
      description: 'Regulation Support',
    },
  ]);

  readonly curriculumFeatures = signal<CurriculumFeature[]>([
    {
      icon: '📋',
      title: 'Dynamic IEPs',
      description:
        'Individualized Education Plans that evolve every quarter based on real-time data tracking and student performance.',
    },
    {
      icon: '👨‍‍👧',
      title: 'Parent Partnership Program',
      description:
        'Bi-weekly coaching sessions for families to ensure techniques used at school are successfully bridged to home life.',
    },
    {
      icon: '🎓',
      title: 'Functional Life Skills',
      description:
        'Curriculum integrated with vocational and daily living skills to prepare students for greater independence.',
    },
  ]);

  readonly progressMetrics = signal<ProgressMetric[]>([
    { label: 'Social Communication', value: 82, color: '#10B981' },
    { label: 'Emotional Regulation', value: 65, color: '#3B82F6' },
    { label: 'Cognitive Flexibility', value: 74, color: '#F59E0B' },
  ]);
}
