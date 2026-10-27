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

export interface SupportDirectoryItem {
  id: string;
  type: 'school' | 'hospital';
  name: string;
  city: string;
  address: string;
  servicesSnippet: string;
  isVerified: boolean;
  isFavorite: boolean;
}

export type SupportTypeFilter = 'ALL' | 'SCHOOL' | 'HOSPITAL';

@Component({
  selector: 'ac-find-support',
  standalone: true,
  imports: [FormsModule, UiSpinnerComponent, UiEmptyStateComponent],
  template: `
    <div class="support-page">
      <header class="support-header">
        <div>
          <h1 class="page-title">Find Support</h1>
          <p class="page-subtitle">
            Explore verified schools and healthcare facilities supporting autistic children.
          </p>
        </div>
      </header>

      <section class="filters-panel">
        <div class="search-row">
          <div class="search-field">
            <span class="search-icon" aria-hidden="true">&#x1F50D;</span>
            <input
              type="text"
              class="search-input"
              placeholder="Search by name, city, or services..."
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              aria-label="Search directory"
            />
          </div>

          <div class="city-filter">
            <select
              class="city-select"
              [ngModel]="selectedCity()"
              (ngModelChange)="selectedCity.set($event)"
              aria-label="Filter by city"
            >
              <option value="ALL">All Locations</option>
              @for (city of cities(); track city) {
                <option [value]="city">{{ city }}</option>
              }
            </select>
          </div>
        </div>

        <div class="filter-actions-row">
          <div class="type-chips" role="group" aria-label="Type filter">
            <button
              type="button"
              class="chip-btn"
              [class.active]="selectedType() === 'ALL'"
              (click)="selectedType.set('ALL')"
            >
              All Support
            </button>
            <button
              type="button"
              class="chip-btn"
              [class.active]="selectedType() === 'SCHOOL'"
              (click)="selectedType.set('SCHOOL')"
            >
              Schools
            </button>
            <button
              type="button"
              class="chip-btn"
              [class.active]="selectedType() === 'HOSPITAL'"
              (click)="selectedType.set('HOSPITAL')"
            >
              Healthcare
            </button>
          </div>

          <button
            type="button"
            class="favorite-filter-btn"
            [class.active]="favoritesOnly()"
            (click)="favoritesOnly.set(!favoritesOnly())"
            [attr.aria-pressed]="favoritesOnly()"
          >
            <span class="heart-icon">&#x2665;</span>
            <span>Saved Favorites</span>
          </button>
        </div>
      </section>

      @if (loading()) {
        <div class="loading-state">
          <ac-ui-spinner label="Loading support directory..."></ac-ui-spinner>
        </div>
      } @else if (error()) {
        <div class="error-banner" role="alert">
          <p>{{ error() }}</p>
          <button type="button" class="btn-retry" (click)="loadDirectory()">Try Again</button>
        </div>
      } @else if (filteredItems().length === 0) {
        <ac-ui-empty-state
          title="No support providers found"
          message="Try adjusting your search criteria, city filter, or saved favorites toggle."
        ></ac-ui-empty-state>
      } @else {
        <div class="results-meta">
          Showing {{ filteredItems().length }} of {{ items().length }} support providers
        </div>

        <div class="support-grid">
          @for (item of filteredItems(); track item.type + '-' + item.id) {
            <article
              class="support-card"
              (click)="openDetail(item)"
              (keydown.enter)="openDetail(item)"
              tabindex="0"
              role="button"
              [attr.aria-label]="item.name + ', ' + item.city"
            >
              <div class="card-top">
                <div class="type-badges">
                  <span class="type-badge" [class.hospital-badge]="item.type === 'hospital'">
                    {{ item.type === 'school' ? 'School' : 'Healthcare' }}
                  </span>
                  @if (item.isVerified) {
                    <span class="verified-badge">&#x2713; AutiCare Partner</span>
                  }
                </div>

                <button
                  type="button"
                  class="heart-toggle-btn"
                  [class.favorited]="item.isFavorite"
                  (click)="toggleFavorite(item, $event)"
                  [attr.aria-label]="item.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
                >
                  &#x2665;
                </button>
              </div>

              <div class="card-body">
                <h2 class="item-name">{{ item.name }}</h2>
                <div class="item-city">
                  <span aria-hidden="true">&#x1F4CD;</span>
                  <span>{{ item.city }}</span>
                </div>
                <p class="services-snippet">{{ item.servicesSnippet }}</p>
              </div>

              <div class="card-footer">
                <span class="link-label">View details & inquiries &rarr;</span>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .support-page {
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-lg);
        padding: var(--ac-spacing-lg);
        max-width: 1200px;
        margin: 0 auto;
      }

      .support-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid var(--ac-color-border);
        padding-bottom: var(--ac-spacing-md);
      }

      .page-title {
        font-size: var(--ac-type-h1);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text);
        margin: 0 0 var(--ac-spacing-xs) 0;
      }

      .page-subtitle {
        font-size: var(--ac-type-body);
        color: var(--ac-color-text-muted);
        margin: 0;
      }

      .filters-panel {
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-md);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: var(--ac-spacing-md);
      }

      .search-row {
        display: flex;
        gap: var(--ac-spacing-md);
        flex-wrap: wrap;
      }

      .search-field {
        flex: 1;
        min-width: 260px;
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-icon {
        position: absolute;
        left: var(--ac-spacing-sm);
        color: var(--ac-color-text-muted);
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: var(--ac-spacing-sm) var(--ac-spacing-sm) var(--ac-spacing-sm) 2.2rem;
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-background);
        color: var(--ac-color-text);
        font-size: var(--ac-type-body);
      }

      .search-input:focus {
        outline: 2px solid var(--ac-color-primary);
        border-color: transparent;
      }

      .city-filter {
        min-width: 180px;
      }

      .city-select {
        width: 100%;
        padding: var(--ac-spacing-sm);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-background);
        color: var(--ac-color-text);
        font-size: var(--ac-type-body);
      }

      .filter-actions-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--ac-spacing-sm);
      }

      .type-chips {
        display: flex;
        gap: var(--ac-spacing-xs);
      }

      .chip-btn {
        padding: var(--ac-spacing-xs) var(--ac-spacing-md);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-full, 9999px);
        background: var(--ac-color-background);
        color: var(--ac-color-text-muted);
        cursor: pointer;
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-medium);
        transition:
          background-color 0.2s,
          color 0.2s;
      }

      .chip-btn.active {
        background: var(--ac-color-primary);
        color: var(--ac-color-surface);
        border-color: var(--ac-color-primary);
      }

      .favorite-filter-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--ac-spacing-xs);
        padding: var(--ac-spacing-xs) var(--ac-spacing-md);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-full, 9999px);
        background: var(--ac-color-background);
        color: var(--ac-color-text-muted);
        cursor: pointer;
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-medium);
        transition: all 0.2s;
      }

      .favorite-filter-btn.active {
        background: color-mix(in srgb, var(--ac-color-danger) 15%, transparent);
        color: var(--ac-color-danger);
        border-color: var(--ac-color-danger);
      }

      .favorite-filter-btn .heart-icon {
        font-size: 1.1rem;
      }

      .results-meta {
        font-size: var(--ac-type-small);
        color: var(--ac-color-text-muted);
      }

      .support-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: var(--ac-spacing-md);
      }

      .support-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        padding: var(--ac-spacing-md);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: var(--ac-spacing-md);
        cursor: pointer;
        transition:
          transform 0.15s,
          border-color 0.15s,
          box-shadow 0.15s;
      }

      .support-card:hover {
        transform: translateY(-2px);
        border-color: var(--ac-color-primary);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--ac-color-primary) 10%, transparent);
      }

      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--ac-spacing-xs);
      }

      .type-badges {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ac-spacing-xs);
      }

      .type-badge {
        display: inline-block;
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-bold);
        padding: 0.15rem 0.5rem;
        border-radius: var(--ac-radius-sm);
        background: color-mix(in srgb, var(--ac-color-primary) 15%, transparent);
        color: var(--ac-color-primary);
      }

      .type-badge.hospital-badge {
        background: color-mix(
          in srgb,
          var(--ac-color-accent, var(--ac-color-primary)) 15%,
          transparent
        );
        color: var(--ac-color-accent, var(--ac-color-primary));
      }

      .verified-badge {
        display: inline-block;
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-medium);
        padding: 0.15rem 0.5rem;
        border-radius: var(--ac-radius-sm);
        background: color-mix(in srgb, var(--ac-color-success) 15%, transparent);
        color: var(--ac-color-success);
      }

      .heart-toggle-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 1.35rem;
        line-height: 1;
        padding: var(--ac-spacing-xs);
        color: var(--ac-color-text-muted);
        transition:
          transform 0.15s,
          color 0.15s;
      }

      .heart-toggle-btn:hover {
        transform: scale(1.15);
        color: var(--ac-color-danger);
      }

      .heart-toggle-btn.favorited {
        color: var(--ac-color-danger);
      }

      .card-body {
        display: flex;
        flex-direction: column;
        gap: var(--ac-spacing-xs);
      }

      .item-name {
        font-size: var(--ac-type-h3);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text);
        margin: 0;
        line-height: var(--ac-line-tight);
      }

      .item-city {
        display: flex;
        align-items: center;
        gap: var(--ac-spacing-xs);
        font-size: var(--ac-type-small);
        color: var(--ac-color-text-muted);
      }

      .services-snippet {
        font-size: var(--ac-type-body);
        color: var(--ac-color-text-muted);
        margin: var(--ac-spacing-xs) 0 0 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .card-footer {
        border-top: 1px solid var(--ac-color-border);
        padding-top: var(--ac-spacing-sm);
        margin-top: auto;
      }

      .link-label {
        font-size: var(--ac-type-small);
        font-weight: var(--ac-font-weight-medium);
        color: var(--ac-color-primary);
      }

      .loading-state {
        padding: var(--ac-spacing-xl);
        display: flex;
        justify-content: center;
      }

      .error-banner {
        padding: var(--ac-spacing-md);
        background: color-mix(in srgb, var(--ac-color-danger) 15%, transparent);
        border: 1px solid var(--ac-color-danger);
        border-radius: var(--ac-radius-md);
        color: var(--ac-color-danger);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .btn-retry {
        background: var(--ac-color-danger);
        color: var(--ac-color-surface);
        border: none;
        padding: var(--ac-spacing-xs) var(--ac-spacing-md);
        border-radius: var(--ac-radius-sm);
        cursor: pointer;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FindSupportPage implements OnInit {
  private readonly schoolsApi = inject(SchoolsApi);
  private readonly hospitalsApi = inject(HospitalsApi);
  private readonly router = inject(Router);

  readonly items = signal<SupportDirectoryItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly searchTerm = signal('');
  readonly selectedCity = signal('ALL');
  readonly selectedType = signal<SupportTypeFilter>('ALL');
  readonly favoritesOnly = signal(false);

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
      schools: this.schoolsApi.listSchools(),
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
        }));

        const mappedHospitals: SupportDirectoryItem[] = (hospitals || []).map((h) => ({
          id: h.id,
          type: 'hospital',
          name: h.name,
          city: h.city,
          address: h.address,
          servicesSnippet: h.services || 'Pediatric & developmental health services',
          isVerified: false,
          isFavorite: Boolean((h as { isFavorite?: boolean }).isFavorite),
        }));

        const combined = [...mappedSchools, ...mappedHospitals].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        this.items.set(combined);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(
          'Failed to load support directory. Please check your network and try again.',
        );
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
