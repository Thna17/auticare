// schools.page.ts (Parent Side)
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { SchoolResponse } from '@auticare/contracts';
import { RouterLink } from '@angular/router';
import { SchoolsApi } from './data-access/schools.api';

interface SchoolViewModel extends SchoolResponse {
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  specializations: string[];
  studentTeacherRatio: string;
  availability: 'Immediate' | 'Waitlist';
  waitlistTime?: string;
  imageUrl?: string;
}

@Component({
  standalone: true,
  imports: [RouterLink],
  selector: 'ac-parent-schools-page',
  template: `
    <div class="page-layout">
      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Bar -->
        <header class="topbar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search for school names, cities, or specializations..."
              class="search-input"
            />
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

        <!-- Page Header -->
        <section class="page-header">
          <div>
            <h1>Find Special Education Schools</h1>
            <p>
              Discover and connect with specialized educational institutions tailored for
              neurodivergent children.
            </p>
          </div>
          <div class="view-toggle">
            <button class="toggle-btn active">
              <span>☰</span>
              <span>List View</span>
            </button>
            <button class="toggle-btn">
              <span>🗺</span>
              <span>Map View</span>
            </button>
          </div>
        </section>

        <div class="content-wrapper">
          <!-- Filters Sidebar -->
          <aside class="filters-sidebar">
            <div class="filters-header">
              <span class="filter-icon">⚙</span>
              <h2>Filters</h2>
            </div>

            <div class="filter-group">
              <label class="filter-label">Province/Region</label>
              <select class="filter-select">
                <option>Phnom Penh</option>
                <option>Kandal</option>
                <option>Kompung Spue</option>
                <option>SeimReap</option>
                <option>Batdombong</option>
                <option>Takoe</option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Distance (Within 50km)</label>
              <div class="distance-slider">
                <input type="range" min="5" max="100" value="50" class="slider" />
                <div class="slider-labels">
                  <span>5km</span>
                  <span>100km+</span>
                </div>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">School Type</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" />
                  <span>Private Specialized</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" checked />
                  <span>Public Integration</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" />
                  <span>Non-profit/Charity</span>
                </label>
              </div>
            </div>

            <div class="filter-group">
              <label class="filter-label">Specializations</label>
              <div class="tags-group">
                <button class="tag-btn">ABA</button>
                <button class="tag-btn">Speech Therapy</button>
                <button class="tag-btn">Sensory Integration</button>
                <button class="tag-btn">Occupational Therapy</button>
                <button class="tag-btn">Social Skills</button>
              </div>
            </div>

            <button class="apply-filters-btn">Go</button>
          </aside>

          <!-- Schools List -->
          <div class="schools-list">
            @if (loading()) {
              <div class="loading-state">
                <p>Loading schools...</p>
              </div>
            } @else if (error()) {
              <p class="error" role="alert">{{ error() }}</p>
            } @else if (!schools().length) {
              <div class="empty-state">
                <p>No schools are available yet.</p>
              </div>
            } @else {
              <div class="list-header">
                <span class="results-count"
                  >Showing {{ schools().length }} results in your area</span
                >
                <div class="sort-dropdown">
                  <label>Sort by:</label>
                  <select>
                    <option>Highest Rated</option>
                    <option>Nearest</option>
                    <option>Most Reviews</option>
                    <option>Name A-Z</option>
                  </select>
                </div>
              </div>

              @for (school of schools(); track school.id) {
                <div class="school-card">
                  <div class="school-image-wrapper">
                    <a class="school-link" [routerLink]="['/schools', school.id]">
                      <img
                        [src]="
                          school.imageUrl ||
                          'https://images.unsplash.com/photo-1562774053-801e4e208e4e?w=400&h=300&fit=crop'
                        "
                        [alt]="school.name"
                        class="school-image"
                      />
                      @if (school.isVerified) {
                        <span class="verified-badge">✓ Verified</span>
                      }
                    </a>
                  </div>

                  <div class="school-content">
                    <div class="school-header">
                      <a class="school-link" [routerLink]="['/schools', school.id]">
                        <h3>{{ school.name }}</h3>
                      </a>
                      <div class="rating">
                        <span class="star">★</span>
                        <span class="rating-value">{{ school.rating }}</span>
                        <span class="rating-count">({{ school.reviewCount }})</span>
                      </div>
                    </div>

                    <div class="school-location">
                      <span class="location-icon">📍</span>
                      <span>{{ school.address }}, {{ school.city }}</span>
                    </div>

                    <div class="specializations-list">
                      @for (spec of school.specializations; track spec) {
                        <span class="spec-tag">{{ spec }}</span>
                      }
                    </div>

                    <div class="school-meta">
                      <div class="meta-item">
                        <span class="meta-icon">👥</span>
                        <div>
                          <span class="meta-label">STUDENT:TEACHER</span>
                          <span class="meta-value">{{ school.studentTeacherRatio }}</span>
                        </div>
                      </div>

                      <div class="meta-item">
                        <span class="meta-icon">📅</span>
                        <div>
                          <span class="meta-label">AVAILABILITY</span>
                          <span
                            class="meta-value"
                            [class.waitlist]="school.availability === 'Waitlist'"
                          >
                            {{ school.availability }}
                            @if (school.waitlistTime) {
                              <span class="waitlist-time">({{ school.waitlistTime }})</span>
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <button class="enrollment-btn">Request Enrollment</button>
                  </div>
                </div>
              }
            }
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
        background: #f0f7fa;
      }

      /* Sidebar Styles */
      .sidebar {
        width: 260px;
        background: #e8f4f8;
        border-radius: 0 16px 16px 0;
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
        font-size: 28px;
      }

      .logo-text {
        font-size: 22px;
        font-weight: 700;
        color: #1a3a4a;
      }

      .menu-toggle {
        display: none;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: white;
        border-radius: 12px;
        cursor: pointer;
      }

      .avatar {
        width: 40px;
        height: 40px;
        background: #3d6375;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
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

      .dropdown {
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

      .new-screening-btn {
        width: 100%;
        padding: 14px;
        background: #2d6a7a;
        color: white;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: background 0.2s;
      }

      .new-screening-btn:hover {
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

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 32px;
      }

      .page-header h1 {
        margin: 0 0 8px 0;
        font-size: 32px;
        font-weight: 700;
        color: #0f172a;
      }

      .page-header p {
        margin: 0;
        color: #64748b;
        font-size: 15px;
        max-width: 600px;
      }

      .view-toggle {
        display: flex;
        gap: 8px;
        background: white;
        padding: 4px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
      }

      .toggle-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border: none;
        background: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        color: #64748b;
        transition: all 0.2s;
      }

      .toggle-btn:hover {
        background: #f1f5f9;
      }

      .toggle-btn.active {
        background: #2d6a7a;
        color: white;
      }

      .content-wrapper {
        display: flex;
        gap: 24px;
      }

      /* Filters Sidebar */
      .filters-sidebar {
        width: 280px;
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        height: fit-content;
        position: sticky;
        top: 24px;
      }

      .filters-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e2e8f0;
      }

      .filter-icon {
        font-size: 20px;
      }

      .filters-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
      }

      .filter-group {
        margin-bottom: 24px;
      }

      .filter-label {
        display: block;
        font-weight: 600;
        color: #0f172a;
        font-size: 13px;
        margin-bottom: 10px;
      }

      .filter-select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        cursor: pointer;
      }

      .filter-select:focus {
        border-color: #3b82f6;
      }

      .distance-slider {
        margin-bottom: 8px;
      }

      .slider {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: #e2e8f0;
        outline: none;
        -webkit-appearance: none;
      }

      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #2d6a7a;
        cursor: pointer;
      }

      .slider-labels {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #64748b;
        margin-top: 6px;
      }

      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        font-size: 14px;
        color: #475569;
      }

      .checkbox-label input[type='checkbox'] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: #2d6a7a;
      }

      .tags-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .tag-btn {
        padding: 6px 12px;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tag-btn:hover {
        background: #e2e8f0;
        border-color: #2d6a7a;
      }

      .apply-filters-btn {
        width: 100%;
        padding: 12px;
        background: #2d6a7a;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .apply-filters-btn:hover {
        background: #1f4f5c;
      }

      /* Schools List */
      .schools-list {
        flex: 1;
      }

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        padding: 16px 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      }

      .results-count {
        font-size: 14px;
        color: #64748b;
        font-weight: 500;
      }

      .sort-dropdown {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: #64748b;
      }

      .sort-dropdown select {
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        outline: none;
      }

      .school-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        display: flex;
        gap: 24px;
        transition: box-shadow 0.2s;
      }

      .school-card:hover {
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
      }

      .school-link {
        text-decoration: none;
        cursor: pointer;
        color: inherit;
      }

      .school-image-wrapper {
        position: relative;
        flex-shrink: 0;
      }

      .school-image {
        width: 280px;
        height: 180px;
        object-fit: cover;
        border-radius: 10px;
      }

      .verified-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        background: #10b981;
        color: white;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .school-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .school-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .school-header h3 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        color: #0f172a;
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

      .school-location {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #64748b;
        font-size: 14px;
      }

      .location-icon {
        font-size: 16px;
      }

      .specializations-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .spec-tag {
        padding: 4px 10px;
        background: #dbeafe;
        color: #2563eb;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }

      .school-meta {
        display: flex;
        gap: 32px;
        padding-top: 8px;
        border-top: 1px solid #e2e8f0;
      }

      .meta-item {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .meta-icon {
        font-size: 20px;
      }

      .meta-label {
        display: block;
        font-size: 11px;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .meta-value {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
      }

      .meta-value.waitlist {
        color: #f59e0b;
      }

      .waitlist-time {
        font-weight: 500;
        color: #64748b;
      }

      .enrollment-btn {
        align-self: flex-start;
        padding: 12px 24px;
        background: #2d6a7a;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
        margin-top: 8px;
      }

      .enrollment-btn:hover {
        background: #1f4f5c;
      }

      /* Pagination */
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin-top: 32px;
        padding: 20px;
      }

      .page-btn {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #e2e8f0;
        background: white;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .page-btn:hover {
        border-color: #3b82f6;
        background: #f1f5f9;
      }

      .page-btn.active {
        background: #2d6a7a;
        color: white;
        border-color: #2d6a7a;
      }

      .ellipsis {
        color: #64748b;
        padding: 0 8px;
      }

      /* Loading & Empty States */
      .loading-state,
      .empty-state {
        background: white;
        border-radius: 12px;
        padding: 48px;
        text-align: center;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      }

      .error {
        color: #a23434;
        font-weight: 600;
        padding: 16px;
        background: #ffebee;
        border-radius: 8px;
      }

      /* Responsive */
      @media (max-width: 1024px) {
        .filters-sidebar {
          width: 240px;
        }

        .school-image {
          width: 220px;
          height: 140px;
        }
      }

      @media (max-width: 768px) {
        .sidebar {
          position: fixed;
          left: -260px;
          z-index: 1000;
          transition: left 0.3s;
        }

        .sidebar.open {
          left: 0;
        }

        .menu-toggle {
          display: block;
        }

        .filters-sidebar {
          display: none;
        }

        .school-card {
          flex-direction: column;
        }

        .school-image {
          width: 100%;
          height: 200px;
        }

        .page-header {
          flex-direction: column;
          gap: 16px;
        }

        .view-toggle {
          width: 100%;
          justify-content: flex-end;
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
export class SchoolsPage implements OnInit {
  private readonly api = inject(SchoolsApi);
  readonly schools = signal<readonly SchoolViewModel[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit() {
    this.loading.set(true);
    this.api.listSchools().subscribe({
      next: (schools) => {
        // Map backend data to view model with mock enhancements
        const viewModel = schools.map((school, index) => ({
          ...school,
          rating: 4.5 + (index % 5) * 0.1, // Mock rating between 4.5-4.9
          reviewCount: 50 + index * 30, // Mock review count
          isVerified: index % 2 === 0, // Alternate verified status
          specializations: [
            'Applied Behavior Analysis',
            'Speech Therapy',
            'Sensory Integration',
          ].slice(0, 2 + (index % 2)),
          studentTeacherRatio: `${3 + (index % 6)}:1`,
          // Explicitly cast to the union type to satisfy TypeScript
          availability: (index % 3 === 0 ? 'Waitlist' : 'Immediate') as 'Immediate' | 'Waitlist',
          waitlistTime: index % 3 === 0 ? `${index + 1}m` : undefined,
          imageUrl: undefined, // Will use default image in template
        }));

        this.schools.set(viewModel);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Schools could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });
  }
}
