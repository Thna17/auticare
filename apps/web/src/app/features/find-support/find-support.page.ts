import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SchoolsApi } from '../schools/data-access/schools.api';
import { HospitalsApi } from '../hospitals/data-access/hospitals.api';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { I18nService } from '../../core/i18n/i18n.service';
import { getFacilityImageUrl } from './find-support-images';

export interface SupportDirectoryItem {
  id: string;
  type: 'school' | 'hospital';
  name: string;
  city: string;
  address: string;
  servicesSnippet: string;
  isVerified: boolean;
  isFavorite: boolean;
  imageUrl?: string | null;
}

export type SupportTypeFilter = 'ALL' | 'SCHOOL' | 'HOSPITAL';

const COPY = {
  en: {
    eyebrow: 'Directory & Community',
    title: 'Find Support',
    subtitle:
      'Explore verified schools and healthcare facilities supporting autistic children across Cambodia.',
    searchPlaceholder: 'Search by name, city, or services…',
    searchLabel: 'Search directory',
    cityLabel: 'Filter by city',
    allLocations: 'All Locations',
    typeFilterLabel: 'Filter by facility type',
    allSupport: 'All Support',
    schools: 'Schools',
    healthcare: 'Healthcare',
    saved: 'Saved',
    schoolTag: 'School',
    healthcareTag: 'Healthcare',
    verifiedPartner: 'AutiCare Partner',
    saveBtn: 'Save',
    savedBtn: 'Saved',
    addFavorite: 'Save to favorites',
    removeFavorite: 'Remove from favorites',
    viewDetails: 'View details & inquiries',
    emptyTitle: 'No support providers found',
    emptyMessage:
      'Try adjusting your search criteria, city filter, or saved filter to see available providers.',
    loadError: 'Failed to load support directory. Please check your network and try again.',
    retry: 'Try Again',
    loading: 'Loading support directory…',
    directoryLabel: 'Support directory list',
    showingCount: (shown: number, total: number) =>
      `Showing ${shown} of ${total} support providers`,
  },
  km: {
    eyebrow: 'សហគមន៍ និងការថែទាំសុខភាព',
    title: 'ស្វែងរកការគាំទ្រ',
    subtitle: 'ស្វែងរកសាលារៀន និងមណ្ឌលសុខាភិបាលដែលគាំទ្រកុមារអូទីស្សឹមនៅទូទាំងប្រទេសកម្ពុជា។',
    searchPlaceholder: 'ស្វែងរកតាមឈ្មោះ ទីក្រុង ឬសេវាកម្ម…',
    searchLabel: 'ស្វែងរកក្នុងបញ្ជី',
    cityLabel: 'ត្រងតាមទីក្រុង',
    allLocations: 'គ្រប់ទីតាំងទាំងអស់',
    typeFilterLabel: 'ត្រងតាមប្រភេទស្ថាប័ន',
    allSupport: 'ទាំងអស់',
    schools: 'សាលារៀន',
    healthcare: 'មណ្ឌលសុខភាព',
    saved: 'បានរក្សាទុក',
    schoolTag: 'សាលារៀន',
    healthcareTag: 'មណ្ឌលសុខភាព',
    verifiedPartner: 'ដៃគូ AutiCare',
    saveBtn: 'រក្សាទុក',
    savedBtn: 'បានរក្សាទុក',
    addFavorite: 'រក្សាទុកក្នុងបញ្ជីពេញចិត្ត',
    removeFavorite: 'ដកចេញពីបញ្ជីពេញចិត្ត',
    viewDetails: 'មើលព័ត៌មានលម្អិត និងទំនាក់ទំនង',
    emptyTitle: 'រកមិនឃើញអ្នកផ្តល់ការគាំទ្រទេ',
    emptyMessage: 'សូមសាកល្បងកែប្រែពាក្យស្វែងរក តម្រងទីក្រុង ឬតម្រងដែលបានរក្សាទុក។',
    loadError: 'មិនអាចទាញយកបញ្ជីគាំទ្របានទេ។ សូមពិនិត្យបណ្តាញអ៊ីនធឺណិត ហើយព្យាយាមម្តងទៀត។',
    retry: 'ព្យាយាមម្តងទៀត',
    loading: 'កំពុងផ្ទុកបញ្ជីគាំទ្រ…',
    directoryLabel: 'បញ្ជីស្ថាប័នគាំទ្រ',
    showingCount: (shown: number, total: number) =>
      `កំពុងបង្ហាញ ${shown} ក្នុងចំណោម ${total} ទីតាំងគាំទ្រ`,
  },
};

@Component({
  selector: 'ac-find-support',
  standalone: true,
  imports: [FormsModule, UiSpinnerComponent, UiEmptyStateComponent],
  template: `
    <div class="support-page">
      <header class="page-head">
        <div>
          <p class="eyebrow">{{ copy().eyebrow }}</p>
          <h1>{{ copy().title }}</h1>
          <p class="subtitle">{{ copy().subtitle }}</p>
        </div>
      </header>

      <section class="filters-panel" [attr.aria-label]="copy().typeFilterLabel">
        <div class="search-row">
          <div class="search-field">
            <input
              type="search"
              class="search-input"
              [placeholder]="copy().searchPlaceholder"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              [attr.aria-label]="copy().searchLabel"
            />
          </div>

          <div class="city-filter">
            <select
              class="city-select"
              [ngModel]="selectedCity()"
              (ngModelChange)="selectedCity.set($event)"
              [attr.aria-label]="copy().cityLabel"
            >
              <option value="ALL">{{ copy().allLocations }}</option>
              @for (city of cities(); track city) {
                <option [value]="city">{{ city }}</option>
              }
            </select>
          </div>
        </div>

        <div class="filter-actions-row">
          <div class="type-chips" role="group" [attr.aria-label]="copy().typeFilterLabel">
            <button
              type="button"
              class="chip-btn"
              [class.active]="selectedType() === 'ALL'"
              [attr.aria-pressed]="selectedType() === 'ALL'"
              (click)="selectedType.set('ALL')"
            >
              <span>{{ copy().allSupport }}</span>
              <span class="count-pill">{{ items().length }}</span>
            </button>
            <button
              type="button"
              class="chip-btn"
              [class.active]="selectedType() === 'SCHOOL'"
              [attr.aria-pressed]="selectedType() === 'SCHOOL'"
              (click)="selectedType.set('SCHOOL')"
            >
              <span>{{ copy().schools }}</span>
              <span class="count-pill">{{ schoolCount() }}</span>
            </button>
            <button
              type="button"
              class="chip-btn"
              [class.active]="selectedType() === 'HOSPITAL'"
              [attr.aria-pressed]="selectedType() === 'HOSPITAL'"
              (click)="selectedType.set('HOSPITAL')"
            >
              <span>{{ copy().healthcare }}</span>
              <span class="count-pill">{{ hospitalCount() }}</span>
            </button>
          </div>

          <button
            type="button"
            class="favorite-filter-btn"
            [class.active]="favoritesOnly()"
            (click)="favoritesOnly.set(!favoritesOnly())"
            [attr.aria-pressed]="favoritesOnly()"
          >
            <span>{{ copy().saved }}</span>
            @if (favoriteCount() > 0) {
              <span class="count-pill">{{ favoriteCount() }}</span>
            }
          </button>
        </div>
      </section>

      @if (loading()) {
        <div class="loading-state">
          <ac-ui-spinner [label]="copy().loading"></ac-ui-spinner>
        </div>
      } @else if (error()) {
        <div class="error-banner" role="alert">
          <p>{{ error() }}</p>
          <button type="button" class="btn-retry" (click)="loadDirectory()">
            {{ copy().retry }}
          </button>
        </div>
      } @else if (filteredItems().length === 0) {
        <ac-ui-empty-state
          [title]="copy().emptyTitle"
          [message]="copy().emptyMessage"
        ></ac-ui-empty-state>
      } @else {
        <div class="results-meta">
          {{ copy().showingCount(filteredItems().length, items().length) }}
        </div>

        <section class="directory-panel" [attr.aria-label]="copy().directoryLabel">
          <ul class="support-grid">
            @for (item of filteredItems(); track item.type + '-' + item.id) {
              <li
                class="support-card"
                (click)="openDetail(item)"
                (keydown.enter)="openDetail(item)"
                tabindex="0"
                role="button"
                [attr.aria-label]="item.name + ', ' + item.city"
              >
                <div class="card-media">
                  @if (item.imageUrl) {
                    <img
                      [src]="item.imageUrl"
                      [alt]="item.name"
                      class="facility-photo"
                      loading="lazy"
                    />
                  } @else {
                    <div
                      class="media-fallback"
                      [class.hospital-fallback]="item.type === 'hospital'"
                      aria-hidden="true"
                    >
                      <div class="fallback-icon-wrap">
                        @if (item.type === 'school') {
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.75"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path
                              d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
                            ></path>
                            <path d="M6 6h10"></path>
                            <path d="M6 10h10"></path>
                            <path d="M6 14h6"></path>
                          </svg>
                        } @else {
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.75"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M3 21h18"></path>
                            <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path>
                            <path d="M9 10h6"></path>
                            <path d="M12 7v6"></path>
                          </svg>
                        }
                      </div>
                      <span class="fallback-label">
                        {{ item.type === 'school' ? copy().schoolTag : copy().healthcareTag }}
                      </span>
                    </div>
                  }

                  <div class="media-badges">
                    <span class="type-badge" [class.hospital-badge]="item.type === 'hospital'">
                      {{ item.type === 'school' ? copy().schoolTag : copy().healthcareTag }}
                    </span>
                    @if (item.isVerified) {
                      <span class="verified-badge">
                        <svg
                          class="verified-icon"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>{{ copy().verifiedPartner }}</span>
                      </span>
                    }
                  </div>
                </div>

                <div class="card-content">
                  <div class="card-main">
                    <h2 class="item-name">{{ item.name }}</h2>

                    <div class="item-city">
                      <svg
                        class="city-pin-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span class="city-name">{{ item.city }}</span>
                      @if (item.address) {
                        <span class="location-sep" aria-hidden="true">&bull;</span>
                        <span class="address-text">{{ item.address }}</span>
                      }
                    </div>

                    <p class="services-snippet">{{ item.servicesSnippet }}</p>
                  </div>

                  <div class="card-footer">
                    <button
                      type="button"
                      class="heart-toggle-btn"
                      [class.favorited]="item.isFavorite"
                      (click)="toggleFavorite(item, $event)"
                      [attr.aria-label]="
                        item.isFavorite ? copy().removeFavorite : copy().addFavorite
                      "
                    >
                      <svg
                        class="heart-icon"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        [attr.fill]="item.isFavorite ? 'currentColor' : 'none'"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path
                          d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                        ></path>
                      </svg>
                      <span>{{ item.isFavorite ? copy().savedBtn : copy().saveBtn }}</span>
                    </button>
                    <span class="link-label" aria-hidden="true">
                      <span>{{ copy().viewDetails }}</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>
              </li>
            }
          </ul>
        </section>
      }
    </div>
  `,
  styles: [
    `
      /* Full width layout matching the Children and Observations reference pages */
      :host {
        display: block;
        padding-bottom: var(--ac-space-12);
      }

      .support-page {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-6);
      }

      .page-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--ac-space-6);
        flex-wrap: wrap;
      }

      .eyebrow {
        margin: 0 0 var(--ac-space-2);
        color: var(--ac-color-action-mid);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      h1 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-tight);
        font-weight: var(--ac-font-weight-bold);
      }

      .subtitle {
        margin: var(--ac-space-2) 0 0;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-page-subtitle);
        line-height: var(--ac-line-body);
        max-width: 680px;
      }

      .filters-panel {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-4);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        padding: var(--ac-space-4);
      }

      .search-row {
        display: flex;
        gap: var(--ac-space-3);
        flex-wrap: wrap;
      }

      .search-field {
        flex: 1;
        min-width: 260px;
      }

      .search-input {
        width: 100%;
        min-height: 44px;
        padding: 0 var(--ac-space-4);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: var(--ac-type-body);
        box-sizing: border-box;
      }

      .search-input:focus {
        outline: 2px solid var(--ac-color-focus);
        border-color: transparent;
      }

      .city-filter {
        min-width: 180px;
      }

      .city-select {
        width: 100%;
        min-height: 44px;
        padding: 0 var(--ac-space-3);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font: inherit;
        font-size: var(--ac-type-body);
        box-sizing: border-box;
      }

      .city-select:focus {
        outline: 2px solid var(--ac-color-focus);
        border-color: transparent;
      }

      .filter-actions-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--ac-space-3);
      }

      .type-chips {
        display: flex;
        gap: var(--ac-space-2);
        flex-wrap: wrap;
      }

      .chip-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--ac-space-2);
        min-height: 36px;
        padding: 0 var(--ac-space-3);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-muted);
        cursor: pointer;
        font: inherit;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        transition:
          border-color var(--ac-motion-fast),
          color var(--ac-motion-fast),
          background var(--ac-motion-fast);
      }

      .chip-btn:hover {
        border-color: var(--ac-color-action);
        color: var(--ac-color-action-deep);
      }

      .chip-btn.active {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border-color: var(--ac-color-action);
      }

      .favorite-filter-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--ac-space-2);
        min-height: 36px;
        padding: 0 var(--ac-space-3);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-muted);
        cursor: pointer;
        font: inherit;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        transition:
          border-color var(--ac-motion-fast),
          color var(--ac-motion-fast),
          background var(--ac-motion-fast);
      }

      .favorite-filter-btn:hover {
        border-color: var(--ac-color-action);
        color: var(--ac-color-action-deep);
      }

      .favorite-filter-btn.active {
        background: var(--ac-color-amber-tint-50);
        color: var(--ac-color-amber-800);
        border-color: var(--ac-color-amber-tint-sand);
      }

      .count-pill {
        display: inline-block;
        padding: 1px 6px;
        border-radius: var(--ac-radius-pill);
        background: color-mix(in srgb, currentColor 18%, transparent);
        font-size: 0.75rem;
      }

      .results-meta {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      /* Directory Grid */
      .directory-panel {
        display: block;
      }

      .support-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--ac-space-5);
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .support-card {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        overflow: hidden;
        cursor: pointer;
        box-shadow: var(--ac-shadow-sm);
        transition:
          transform var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .support-card:hover {
        transform: translateY(-2px);
        border-color: var(--ac-color-action-mid);
        box-shadow: var(--ac-shadow-md);
      }

      .support-card:focus-visible {
        outline: 2px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      /* Card Media Header */
      .card-media {
        position: relative;
        width: 100%;
        height: 180px;
        background: var(--ac-brand-50);
        overflow: hidden;
      }

      .facility-photo {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        display: block;
        transition: transform var(--ac-motion-fast);
      }

      .support-card:hover .facility-photo {
        transform: scale(1.04);
      }

      .media-fallback {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--ac-space-2);
        background: linear-gradient(
          135deg,
          var(--ac-brand-50) 0%,
          color-mix(in srgb, var(--ac-brand-100) 70%, var(--ac-color-surface)) 100%
        );
        color: var(--ac-brand-700);
      }

      .media-fallback.hospital-fallback {
        background: linear-gradient(
          135deg,
          var(--ac-color-surface-info) 0%,
          color-mix(in srgb, var(--ac-color-ice-blue-border) 60%, var(--ac-color-surface)) 100%
        );
        color: var(--ac-color-ice-blue-text);
      }

      .fallback-icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        border-radius: var(--ac-radius-pill);
        background: color-mix(in srgb, var(--ac-color-surface) 80%, transparent);
        box-shadow: var(--ac-shadow-sm);
      }

      .fallback-label {
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        letter-spacing: 0.02em;
        opacity: 0.85;
      }

      .media-badges {
        position: absolute;
        top: var(--ac-space-3);
        left: var(--ac-space-3);
        right: var(--ac-space-3);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--ac-space-2);
        pointer-events: none;
      }

      .type-badge {
        display: inline-flex;
        align-items: center;
        font-size: 0.75rem;
        font-weight: var(--ac-font-weight-semibold);
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        background: color-mix(in srgb, var(--ac-color-surface) 92%, transparent);
        color: var(--ac-brand-800);
        border: 1px solid var(--ac-color-border);
        backdrop-filter: blur(8px);
        box-shadow: var(--ac-shadow-sm);
      }

      .type-badge.hospital-badge {
        color: var(--ac-brand-900);
        border-color: var(--ac-color-border);
      }

      .verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75rem;
        font-weight: var(--ac-font-weight-semibold);
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        background: color-mix(in srgb, var(--ac-color-surface) 95%, transparent);
        color: var(--ac-color-green-dark);
        border: 1px solid var(--ac-color-green-border-soft);
        backdrop-filter: blur(8px);
        box-shadow: var(--ac-shadow-sm);
      }

      .verified-icon {
        flex-shrink: 0;
      }

      /* Card Content */
      .card-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: var(--ac-space-4) var(--ac-space-4) var(--ac-space-3);
        gap: var(--ac-space-3);
      }

      .card-main {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-2);
      }

      .item-name {
        margin: 0;
        font-size: 1.0625rem;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        line-height: var(--ac-line-tight);
      }

      .item-city {
        display: flex;
        align-items: center;
        gap: var(--ac-space-1);
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
        flex-wrap: wrap;
      }

      .city-pin-icon {
        color: var(--ac-color-action-mid);
        flex-shrink: 0;
      }

      .city-name {
        font-weight: var(--ac-font-weight-medium);
      }

      .location-sep {
        color: var(--ac-color-border-grey);
      }

      .address-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 220px;
      }

      .services-snippet {
        font-size: var(--ac-type-body);
        color: var(--ac-color-text-body);
        line-height: var(--ac-line-body);
        margin: var(--ac-space-1) 0 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      /* Card Footer */
      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: var(--ac-space-3);
        border-top: 1px solid var(--ac-color-border);
        gap: var(--ac-space-2);
      }

      .heart-toggle-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 36px;
        padding: 0 var(--ac-space-3);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-muted);
        font: inherit;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        transition:
          border-color var(--ac-motion-fast),
          color var(--ac-motion-fast),
          background var(--ac-motion-fast);
      }

      .heart-toggle-btn:hover {
        border-color: var(--ac-color-action);
        color: var(--ac-color-action-deep);
      }

      .heart-toggle-btn.favorited {
        background: var(--ac-color-amber-tint-50);
        color: var(--ac-color-amber-800);
        border-color: var(--ac-color-amber-tint-sand);
      }

      .heart-icon {
        flex-shrink: 0;
      }

      .link-label {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-action-mid);
        white-space: nowrap;
        transition: color var(--ac-motion-fast);
      }

      .support-card:hover .link-label {
        color: var(--ac-color-action-deep);
      }

      .loading-state {
        padding: var(--ac-space-8);
        display: flex;
        justify-content: center;
      }

      .error-banner {
        padding: var(--ac-space-4);
        background: var(--ac-color-red-tint-50);
        border: 1px solid var(--ac-color-red-tint-muted);
        border-radius: var(--ac-radius-md);
        color: var(--ac-color-alert-text);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--ac-space-4);
      }

      .btn-retry {
        min-height: 36px;
        padding: 0 var(--ac-space-4);
        background: var(--ac-color-alert-strong);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: var(--ac-radius-md);
        font: inherit;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
      }

      button:focus-visible {
        outline: 2px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      @media (max-width: 640px) {
        .support-grid {
          grid-template-columns: 1fr;
          gap: var(--ac-space-4);
        }

        .card-media {
          height: 160px;
        }

        .address-text {
          max-width: 180px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FindSupportPage implements OnInit {
  private readonly schoolsApi = inject(SchoolsApi);
  private readonly hospitalsApi = inject(HospitalsApi);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly currentLang = this.i18n.currentLang;
  readonly copy = computed(() => COPY[this.currentLang()] ?? COPY.en);

  readonly items = signal<SupportDirectoryItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly searchTerm = signal('');
  readonly selectedCity = signal('ALL');
  readonly selectedType = signal<SupportTypeFilter>('ALL');
  readonly favoritesOnly = signal(false);

  readonly schoolCount = computed(() => this.items().filter((i) => i.type === 'school').length);
  readonly hospitalCount = computed(() => this.items().filter((i) => i.type === 'hospital').length);
  readonly favoriteCount = computed(() => this.items().filter((i) => i.isFavorite).length);

  readonly cities = computed(() => {
    const list = this.items().map((i) => i.city.trim());
    return Array.from(new Set(list.filter(Boolean))).sort();
  });

  readonly filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const city = this.selectedCity();
    const type = this.selectedType();
    const favsOnly = this.favoritesOnly();

    return this.items().filter((item) => {
      if (type !== 'ALL') {
        if (type === 'SCHOOL' && item.type !== 'school') return false;
        if (type === 'HOSPITAL' && item.type !== 'hospital') return false;
      }

      if (city !== 'ALL' && item.city.toLowerCase() !== city.toLowerCase()) {
        return false;
      }

      if (favsOnly && !item.isFavorite) {
        return false;
      }

      if (term) {
        const matchesName = item.name.toLowerCase().includes(term);
        const matchesCity = item.city.toLowerCase().includes(term);
        const matchesServices = item.servicesSnippet.toLowerCase().includes(term);
        if (!matchesName && !matchesCity && !matchesServices) {
          return false;
        }
      }

      return true;
    });
  });

  ngOnInit(): void {
    this.loadDirectory();
  }

  loadDirectory(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      // The directory shows every school on one page; 100 is the API's maximum.
      schools: this.schoolsApi.listSchools({ limit: 100 }),
      hospitals: this.hospitalsApi.listHospitals(),
    }).subscribe({
      next: ({ schools, hospitals }) => {
        const mappedSchools: SupportDirectoryItem[] = (schools?.schools || []).map((s) => ({
          id: s.id,
          type: 'school',
          name: s.name,
          city: s.city,
          address: s.address,
          servicesSnippet:
            s.specializations && s.specializations.length > 0
              ? s.specializations.join(', ')
              : s.description || 'Inclusive learning & developmental programs',
          isVerified: Boolean(s.isVerified),
          isFavorite: Boolean(s.isFavorite),
          imageUrl: getFacilityImageUrl(s.name, s.id) || s.coverImageUrl || s.logoUrl || null,
        }));

        const mappedHospitals: SupportDirectoryItem[] = (hospitals || []).map((h) => ({
          id: h.id,
          type: 'hospital',
          name: h.name,
          city: h.city,
          address: h.address,
          servicesSnippet: h.services || 'Pediatric & developmental health services',
          isVerified: false,
          isFavorite: (h as { isFavorite?: boolean }).isFavorite ?? false,
          imageUrl: getFacilityImageUrl(h.name, h.id) || null,
        }));

        const combined = [...mappedSchools, ...mappedHospitals].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        this.items.set(combined);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.copy().loadError);
        this.loading.set(false);
      },
    });
  }

  openDetail(item: SupportDirectoryItem): void {
    this.router.navigate(['/find-support', item.type, item.id]);
  }

  toggleFavorite(item: SupportDirectoryItem, event: Event): void {
    event.stopPropagation();
    const nextState = !item.isFavorite;

    if (item.type === 'school') {
      const call = nextState
        ? this.schoolsApi.addFavorite(item.id)
        : this.schoolsApi.removeFavorite(item.id);

      call.subscribe({
        next: () => this.updateItemFavoriteState(item.id, item.type, nextState),
        error: () => {},
      });
    } else {
      this.hospitalsApi.toggleFavorite(item.id).subscribe({
        next: (res) => this.updateItemFavoriteState(item.id, item.type, res.isFavorite),
        error: () => {},
      });
    }
  }

  private updateItemFavoriteState(
    id: string,
    type: 'school' | 'hospital',
    isFavorite: boolean,
  ): void {
    this.items.update((prev) =>
      prev.map((it) => (it.id === id && it.type === type ? { ...it, isFavorite } : it)),
    );
  }
}
