// schools.page.ts (Parent Side)
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import type { SchoolResponse } from '@auticare/contracts';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ChildrenApi } from '../children/data-access/children.api';
import { SchoolsApi } from './data-access/schools.api';
import { EnrollmentRequestsApi } from './data-access/enrollment-requests.api';
import type { ChildResponse } from '@auticare/contracts';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';

interface SchoolViewModel extends SchoolResponse {
  rating: number | null;
  reviewCount: number;
  isVerified: boolean;
  specializations: string[];
}

const SPECIALIZATION_OPTIONS = [
  'ABA',
  'Speech Therapy',
  'Sensory Integration',
  'Occupational Therapy',
  'Social Skills',
] as const;

@Component({
  standalone: true,
  imports: [RouterLink, UiMessageComponent],
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
              aria-label="Search schools by name, city or specialization"
              type="text"
              placeholder="Search for school names, cities, or specializations..."
              class="search-input"
              [value]="search()"
              (input)="search.set($any($event.target).value)"
              (keyup.enter)="applyFilters()"
            />
          </div>
          <div class="topbar-actions">
            <button class="icon-btn" aria-label="Notifications" routerLink="/notifications">
              <span>🔔</span>
            </button>
            <button class="icon-btn" aria-label="Help">
              <span>?</span>
            </button>
            <div class="user-profile-small">
              <div class="user-text">
                <span class="name">{{ userName() }}</span>
                <span class="role">Parent</span>
              </div>
              <div class="avatar-small">{{ initials() }}</div>
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
              <select
                aria-label="Filter schools by province"
                class="filter-select"
                [value]="province()"
                (change)="province.set($any($event.target).value); applyFilters()"
              >
                <option value="">All provinces</option>
                @for (city of cities(); track city) {
                  <option [value]="city">{{ city }}</option>
                }
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Availability</label>
              <select
                aria-label="Filter schools by availability"
                class="filter-select"
                [value]="availability()"
                (change)="availability.set($any($event.target).value); applyFilters()"
              >
                <option value="">Any availability</option>
                <option value="IMMEDIATE">Immediate openings</option>
                <option value="WAITLIST">Waitlist</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">Specializations</label>
              <div class="tags-group">
                @for (tag of specializationOptions; track tag) {
                  <button
                    type="button"
                    class="tag-btn"
                    [class.active]="selectedSpecializations().includes(tag)"
                    (click)="toggleSpecialization(tag)"
                  >
                    {{ tag }}
                  </button>
                }
              </div>
            </div>

            <button class="apply-filters-btn" (click)="applyFilters()" [disabled]="loading()">
              {{ loading() ? 'Searching…' : 'Go' }}
            </button>
            <button class="clear-filters-btn" type="button" (click)="clearFilters()">
              Reset filters
            </button>
          </aside>

          <!-- Schools List -->
          <div class="schools-list">
            @if (loading()) {
              <div class="loading-state">
                <p>Loading schools...</p>
              </div>
            } @else if (error()) {
              <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
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
                  <select aria-label="Sort schools">
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
                          school.coverImageUrl ||
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
                      @if (school.rating !== null) {
                        <div class="rating">
                          <span class="star">★</span>
                          <span class="rating-value">{{ school.rating }}</span>
                          <span class="rating-count">({{ school.reviewCount }})</span>
                        </div>
                      }
                    </div>

                    <div class="school-location">
                      <span class="location-icon">📍</span>
                      <span>{{ school.address }}, {{ school.city }}</span>
                    </div>

                    @if (school.description) {
                      <p class="school-description">{{ school.description }}</p>
                    }

                    @if (school.specializations.length) {
                      <div class="specializations-list">
                        @for (spec of school.specializations; track spec) {
                          <span class="spec-tag">{{ spec }}</span>
                        }
                      </div>
                    }

                    <div class="school-meta">
                      <div class="meta-item">
                        <span class="meta-icon">👥</span>
                        <div>
                          <span class="meta-label">STUDENT:TEACHER</span>
                          <span class="meta-value">{{ school.studentTeacherRatio ?? '—' }}</span>
                        </div>
                      </div>

                      <div class="meta-item">
                        <span class="meta-icon">📅</span>
                        <div>
                          <span class="meta-label">AVAILABILITY</span>
                          <span
                            class="meta-value"
                            [class.waitlist]="school.availabilityStatus === 'WAITLIST'"
                            [class.closed]="school.availabilityStatus === 'CLOSED'"
                          >
                            {{ availabilityLabel(school.availabilityStatus) }}
                            @if (school.waitlistEstimate) {
                              <span class="waitlist-time">({{ school.waitlistEstimate }})</span>
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      class="enrollment-btn"
                      (click)="openRequestDialog(school)"
                      [disabled]="school.availabilityStatus === 'CLOSED'"
                    >
                      {{
                        school.availabilityStatus === 'CLOSED'
                          ? 'Not accepting requests'
                          : 'Request Enrollment'
                      }}
                    </button>
                  </div>
                </div>
              }
            }
          </div>

          <!-- Enrollment request dialog -->
          @if (requestDialogSchool(); as dialogSchool) {
            <div class="dialog-backdrop" (click)="closeRequestDialog()">
              <div
                class="dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="request-dialog-title"
                (click)="$event.stopPropagation()"
              >
                <h3 id="request-dialog-title">Request Enrollment</h3>
                <p class="dialog-school">{{ dialogSchool.name }} — {{ dialogSchool.city }}</p>

                @if (children().length === 0) {
                  <p class="dialog-hint">
                    Add a child to your family profile first — then you can request enrollment here.
                  </p>
                  <div class="dialog-actions">
                    <button type="button" class="btn-secondary" (click)="closeRequestDialog()">
                      Close
                    </button>
                  </div>
                } @else if (requestSubmitted(); as done) {
                  <div class="success-box" role="status">
                    <strong>Request sent.</strong>
                    {{ done.childName }}'s enrollment request was delivered — {{ done.schoolName }}
                    will review it and respond on your notifications.
                  </div>
                  <div class="dialog-actions">
                    <button type="button" class="btn-secondary" (click)="closeRequestDialog()">
                      Done
                    </button>
                  </div>
                } @else {
                  <label class="dialog-field">
                    <span class="dialog-label">Child</span>
                    <select
                      class="dialog-input"
                      [value]="selectedChildId()"
                      (change)="selectedChildId.set($any($event.target).value)"
                    >
                      @for (child of children(); track child.id) {
                        <option [value]="child.id">{{ child.firstName }}</option>
                      }
                    </select>
                  </label>

                  <label class="dialog-field">
                    <span class="dialog-label">Message to the school (optional)</span>
                    <textarea
                      class="dialog-input"
                      rows="3"
                      maxlength="2000"
                      placeholder="Share anything that helps the school — your child's needs, goals, or questions."
                      [value]="requestMessage()"
                      (input)="requestMessage.set($any($event.target).value)"
                    ></textarea>
                  </label>

                  @if (requestError(); as dialogErr) {
                    <ac-ui-message tone="error">{{ dialogErr }}</ac-ui-message>
                  }

                  <div class="dialog-actions">
                    <button type="button" class="btn-secondary" (click)="closeRequestDialog()">
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="apply-filters-btn dialog-submit"
                      (click)="submitRequest()"
                      [disabled]="requestSubmitting() || !selectedChildId()"
                    >
                      {{ requestSubmitting() ? 'Sending…' : 'Send request' }}
                    </button>
                  </div>
                }
              </div>
            </div>
          }
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
        background: var(--ac-color-tint-blue-light);
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
        color: var(--ac-color-ink-e);
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
        background: var(--ac-color-action);
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
        color: var(--ac-color-text-slate-strong);
        font-size: 14px;
      }

      .user-role {
        font-size: 12px;
        color: var(--ac-color-text-slate);
      }

      .dropdown {
        color: var(--ac-color-text-slate);
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
        color: var(--ac-color-action);
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
        color: var(--ac-color-ink-e);
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
        background: var(--ac-color-action-alt);
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
        background: var(--ac-color-ink-a);
      }

      .sidebar-footer {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .logout-btn {
        color: var(--ac-color-red-500);
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
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        font-size: 14px;
        outline: none;
        background: white;
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
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 8px;
        border-radius: 8px;
        transition: background 0.2s;
      }

      .icon-btn:hover {
        background: var(--ac-color-border-slate);
      }

      .user-profile-small {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-left: 16px;
        border-left: 1px solid var(--ac-color-border-slate);
      }

      .user-text {
        display: flex;
        flex-direction: column;
        text-align: right;
      }

      .name {
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
        font-size: 14px;
      }

      .role {
        font-size: 12px;
        color: var(--ac-color-text-slate);
      }

      .avatar-small {
        width: 40px;
        height: 40px;
        background: var(--ac-color-blue-100);
        color: var(--ac-color-blue-600);
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
        color: var(--ac-color-text-slate-strong);
      }

      .page-header p {
        margin: 0;
        color: var(--ac-color-text-slate);
        font-size: 15px;
        max-width: 600px;
      }

      .view-toggle {
        display: flex;
        gap: 8px;
        background: white;
        padding: 4px;
        border-radius: 10px;
        border: 1px solid var(--ac-color-border-slate);
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
        color: var(--ac-color-text-slate);
        transition: all 0.2s;
      }

      .toggle-btn:hover {
        background: var(--ac-color-slate-100);
      }

      .toggle-btn.active {
        background: var(--ac-color-action-alt);
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
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .filter-icon {
        font-size: 20px;
      }

      .filters-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }

      .filter-group {
        margin-bottom: 24px;
      }

      .filter-label {
        display: block;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
        font-size: 13px;
        margin-bottom: 10px;
      }

      .filter-select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        cursor: pointer;
      }

      .filter-select:focus {
        border-color: var(--ac-color-blue-500);
      }

      .distance-slider {
        margin-bottom: 8px;
      }

      .slider {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: var(--ac-color-border-slate);
        outline: none;
        -webkit-appearance: none;
      }

      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--ac-color-action-alt);
        cursor: pointer;
      }

      .slider-labels {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--ac-color-text-slate);
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
        color: var(--ac-color-slate-600);
      }

      .checkbox-label input[type='checkbox'] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: var(--ac-color-action-alt);
      }

      .tags-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .tag-btn {
        padding: 6px 12px;
        background: var(--ac-color-slate-100);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tag-btn:hover {
        background: var(--ac-color-border-slate);
        border-color: var(--ac-color-action-alt);
      }

      .apply-filters-btn {
        width: 100%;
        padding: 12px;
        background: var(--ac-color-action-alt);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .apply-filters-btn:hover {
        background: var(--ac-color-ink-a);
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
        color: var(--ac-color-text-slate);
        font-weight: 500;
      }

      .sort-dropdown {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--ac-color-text-slate);
      }

      .sort-dropdown select {
        padding: 8px 12px;
        border: 1px solid var(--ac-color-border-slate);
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
        background: var(--ac-color-green-500);
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
        color: var(--ac-color-text-slate-strong);
      }

      .rating {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .star {
        color: var(--ac-color-amber-500);
        font-size: 18px;
      }

      .rating-value {
        font-weight: 700;
        color: var(--ac-color-text-slate-strong);
        font-size: 16px;
      }

      .rating-count {
        color: var(--ac-color-text-slate);
        font-size: 13px;
      }

      .school-location {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--ac-color-text-slate);
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
        background: var(--ac-color-blue-100);
        color: var(--ac-color-blue-600);
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }

      .school-meta {
        display: flex;
        gap: 32px;
        padding-top: 8px;
        border-top: 1px solid var(--ac-color-border-slate);
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
        color: var(--ac-color-text-slate);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .meta-value {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: var(--ac-color-text-slate-strong);
      }

      .meta-value.waitlist {
        color: var(--ac-color-amber-500);
      }

      .meta-value.closed {
        color: var(--ac-color-alert-text);
      }

      .school-description {
        margin: 0;
        color: var(--ac-color-text-slate);
        font-size: 14px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .clear-filters-btn {
        width: 100%;
        margin-top: 8px;
        padding: 10px;
        background: transparent;
        color: var(--ac-color-text-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
      }

      .clear-filters-btn:hover {
        color: var(--ac-color-action-alt);
        border-color: var(--ac-color-action-alt);
      }

      /* Enrollment request dialog */
      .dialog-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 16px;
      }

      .dialog {
        width: 100%;
        max-width: 460px;
        background: white;
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
      }

      .dialog h3 {
        margin: 0 0 4px;
        color: var(--ac-color-action-darkest);
        font-size: 18px;
      }

      .dialog-school {
        margin: 0 0 16px;
        color: var(--ac-color-text-slate);
        font-size: 14px;
      }

      .dialog-hint {
        margin: 0 0 16px;
        color: var(--ac-color-grey-a);
        font-size: 14px;
      }

      .dialog-field {
        display: block;
        margin-bottom: 14px;
      }

      .dialog-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-slate-700);
        margin-bottom: 6px;
      }

      .dialog-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: 9px;
        font-size: 14px;
        font-family: inherit;
        box-sizing: border-box;
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 16px;
      }

      .dialog-submit {
        width: auto;
      }

      .btn-secondary {
        padding: 10px 18px;
        border: 1px solid var(--ac-color-tint-steel);
        border-radius: 9px;
        background: var(--ac-color-surface);
        color: var(--ac-color-action-alt);
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
      }

      .success-box {
        padding: 12px 16px;
        border-radius: 9px;
        background: var(--ac-color-green-50);
        color: var(--ac-color-green-600);
        font-size: 14px;
      }

      .waitlist-time {
        font-weight: 500;
        color: var(--ac-color-text-slate);
      }

      .enrollment-btn {
        align-self: flex-start;
        padding: 12px 24px;
        background: var(--ac-color-action-alt);
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
        background: var(--ac-color-ink-a);
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
        border: 1px solid var(--ac-color-border-slate);
        background: white;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .page-btn:hover {
        border-color: var(--ac-color-blue-500);
        background: var(--ac-color-slate-100);
      }

      .page-btn.active {
        background: var(--ac-color-action-alt);
        color: white;
        border-color: var(--ac-color-action-alt);
      }

      .ellipsis {
        color: var(--ac-color-text-slate);
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
        color: var(--ac-color-alert-text);
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
  private readonly childrenApi = inject(ChildrenApi);
  private readonly requestsApi = inject(EnrollmentRequestsApi);
  private readonly auth = inject(AuthService);

  readonly schools = signal<readonly SchoolViewModel[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // ── Filters ────────────────────────────────────────────────────────
  readonly cities = signal<string[]>([]);
  readonly search = signal('');
  readonly province = signal('');
  readonly availability = signal('');
  readonly selectedSpecializations = signal<string[]>([]);
  readonly specializationOptions = SPECIALIZATION_OPTIONS;

  // ── Enrollment request dialog ──────────────────────────────────────
  readonly requestDialogSchool = signal<SchoolViewModel | null>(null);
  readonly children = signal<ChildResponse[]>([]);
  readonly selectedChildId = signal('');
  readonly requestMessage = signal('');
  readonly requestSubmitting = signal(false);
  readonly requestError = signal<string | null>(null);
  readonly requestSubmitted = signal<{ childName: string; schoolName: string } | null>(null);

  readonly userName = computed(() => {
    const parent = this.auth.parent();
    const name = [parent?.firstName, parent?.lastName].filter(Boolean).join(' ').trim();
    return name !== '' ? name : (parent?.email ?? 'Parent');
  });
  readonly initials = computed(() => {
    const parent = this.auth.parent();
    const first = parent?.firstName?.[0] ?? '';
    const last = parent?.lastName?.[0] ?? '';
    const value = (first + last).trim();
    return value !== '' ? value.toUpperCase() : 'P';
  });

  ngOnInit() {
    void this.loadSchools();
    this.api.listSchoolCities().subscribe({
      next: (cities) => this.cities.set(cities),
      error: () => this.cities.set([]),
    });
  }

  loadSchools() {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .listSchools({
        search: this.search().trim() || undefined,
        province: this.province() || undefined,
        availability: this.availability() || undefined,
        specializations:
          this.selectedSpecializations().length > 0
            ? this.selectedSpecializations().join(',')
            : undefined,
      })
      .subscribe({
        next: (schools) => {
          // Real backend data — no mock overrides. rating/reviewCount/isVerified/
          // specializations come straight from the API (rating is computed from
          // real reviews server-side).
          this.schools.set(schools);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Schools could not be loaded. Please refresh the page.');
          this.loading.set(false);
        },
      });
  }

  applyFilters() {
    void this.loadSchools();
  }

  toggleSpecialization(tag: string) {
    const current = this.selectedSpecializations();
    this.selectedSpecializations.set(
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
    void this.loadSchools();
  }

  clearFilters() {
    this.search.set('');
    this.province.set('');
    this.availability.set('');
    this.selectedSpecializations.set([]);
    void this.loadSchools();
  }

  availabilityLabel(status: SchoolResponse['availabilityStatus']): string {
    switch (status) {
      case 'IMMEDIATE':
        return 'Immediate';
      case 'WAITLIST':
        return 'Waitlist';
      case 'CLOSED':
        return 'Closed';
    }
  }

  // ── Enrollment request flow ────────────────────────────────────────

  openRequestDialog(school: SchoolViewModel) {
    this.requestDialogSchool.set(school);
    this.requestSubmitted.set(null);
    this.requestError.set(null);
    this.requestMessage.set('');
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        if (children.length > 0 && this.selectedChildId() === '') {
          this.selectedChildId.set(children[0].id);
        }
      },
      error: () => this.children.set([]),
    });
  }

  closeRequestDialog() {
    this.requestDialogSchool.set(null);
    this.requestSubmitted.set(null);
    this.requestError.set(null);
  }

  submitRequest() {
    const school = this.requestDialogSchool();
    const childId = this.selectedChildId();
    if (!school || !childId || this.requestSubmitting()) {
      return;
    }

    this.requestSubmitting.set(true);
    this.requestError.set(null);

    const message = this.requestMessage().trim();
    this.requestsApi
      .createRequest({
        schoolId: school.id,
        childId,
        ...(message !== '' && { message }),
      })
      .subscribe({
        next: (request) => {
          this.requestSubmitting.set(false);
          this.requestSubmitted.set({
            childName: request.childName,
            schoolName: request.schoolName,
          });
        },
        error: (err) => {
          this.requestSubmitting.set(false);
          const status = err?.status as number | undefined;
          if (status === 409) {
            this.requestError.set(
              'This child already has an enrollment or an open request at this school.',
            );
          } else if (status === 404) {
            this.requestError.set('This school or child could not be found.');
          } else {
            this.requestError.set('Could not send the request. Please try again.');
          }
        },
      });
  }
}
