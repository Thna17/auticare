import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { HospitalResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { HospitalsApi } from './data-access/hospitals.api';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

/** Card view model — `services` split into badge tags. */
interface HospitalViewModel {
  id: string;
  name: string;
  city: string;
  address: string;
  services: string;
  serviceTags: string[];
}

type SortOption = 'name' | 'city' | 'services';

const SERVICE_FILTER_OPTIONS = [
  'Developmental pediatrics',
  'Occupational therapy',
  'Speech therapy',
] as const;

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, UiMessageComponent, UiEmptyStateComponent, UiSpinnerComponent],
  template: `
    <!-- Top Bar -->
    <header class="topbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          aria-label="Search hospitals by name, city or specialization"
          type="text"
          placeholder="Search for hospitals, cities, or specializations..."
          class="search-input"
          [value]="search()"
          (input)="search.set($any($event.target).value)"
        />
      </div>
      <div class="topbar-actions">
        <div class="user-profile-small">
          <div class="user-text">
            <span class="name">{{ userName() }}</span>
            <span class="role">{{ userRole() }}</span>
          </div>
          <div class="avatar-small">{{ initials() }}</div>
        </div>
      </div>
    </header>

    <!-- Page Header -->
    <section class="page-header">
      <div>
        <h1>Hospitals</h1>
        <p>
          Discover specialist care providers for your child — therapies, diagnostics, and
          developmental support in one directory.
        </p>
      </div>
      <div class="view-toggle">
        <button type="button" class="toggle-btn active">
          <span>☰</span>
          <span>List View</span>
        </button>
        <button type="button" class="toggle-btn">
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
          <label class="filter-label">City/Province</label>
          <select
            aria-label="Filter hospitals by city"
            class="filter-select"
            [value]="selectedCity()"
            (change)="selectedCity.set($any($event.target).value)"
          >
            <option value="">All cities</option>
            @for (city of cities(); track city) {
              <option [value]="city">{{ city }}</option>
            }
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Services</label>
          <div class="checkbox-group">
            @for (service of serviceOptions; track service) {
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [checked]="selectedServices().includes(service)"
                  (change)="toggleService(service)"
                />
                <span>{{ service }}</span>
              </label>
            }
          </div>
        </div>

        <button type="button" class="apply-filters-btn" (click)="applyFilters()">Go</button>
        <button type="button" class="clear-filters-btn" (click)="clearFilters()">
          Reset filters
        </button>
      </aside>

      <!-- Results -->
      <div class="hospitals-list">
        <div class="list-header">
          <span class="results-count">Showing {{ filteredHospitals().length }} results</span>
          <div class="sort-dropdown">
            <label>Sort by:</label>
            <select
              aria-label="Sort hospitals"
              [value]="sortBy()"
              (change)="onSortChange($any($event.target).value)"
            >
              <option value="name">Name A-Z</option>
              <option value="city">City A-Z</option>
              <option value="services">Most services</option>
            </select>
          </div>
        </div>

        @if (loading()) {
          <ac-ui-spinner label="Loading hospitals…" />
        } @else if (error(); as loadError) {
          <ac-ui-message tone="error">{{ loadError }}</ac-ui-message>
        } @else if (filteredHospitals().length === 0) {
          <ac-ui-empty-state
            title="No hospitals found"
            [message]="
              hospitals().length === 0
                ? 'No hospitals are listed yet.'
                : 'No hospitals match your filters. Try resetting them.'
            "
          >
            <button type="button" class="clear-filters-btn" (click)="clearFilters()">
              Reset filters
            </button>
          </ac-ui-empty-state>
        } @else {
          @for (hospital of filteredHospitals(); track hospital.id) {
            <article class="hospital-card">
              <div class="hospital-image-wrapper">
                <div class="hospital-mark" aria-hidden="true"><span></span></div>
              </div>

              <div class="hospital-content">
                <div class="hospital-header">
                  <h3>{{ hospital.name }}</h3>
                </div>

                <div class="hospital-location">
                  <span class="location-icon">📍</span>
                  <span>{{ hospital.address }}, {{ hospital.city }}</span>
                </div>

                @if (hospital.serviceTags.length) {
                  <div class="services-list">
                    @for (tag of hospital.serviceTags; track tag) {
                      <span class="service-tag">{{ tag }}</span>
                    }
                  </div>
                }

                <div class="hospital-footer">
                  <button type="button" class="booking-btn">Book Appointment</button>
                </div>
              </div>
            </article>
          }
        }
      </div>
    </div>

    @if (canManage()) {
      <section class="admin-panel" aria-labelledby="add-hospital-title">
        <header>
          <h2 id="add-hospital-title">Add a hospital</h2>
          <p>Publish a clear, searchable care option for families.</p>
        </header>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="field-grid">
            <label class="field">
              <span>Hospital name</span>
              <input type="text" formControlName="name" maxlength="160" />
            </label>
            <label class="field">
              <span>City</span>
              <input type="text" formControlName="city" maxlength="120" />
            </label>
          </div>
          <label class="field">
            <span>Address</span>
            <input type="text" formControlName="address" maxlength="300" />
          </label>
          <label class="field">
            <span>Services</span>
            <textarea
              rows="4"
              formControlName="services"
              maxlength="2000"
              placeholder="Developmental pediatrics, occupational therapy, speech support..."
            ></textarea>
          </label>
          @if (form.touched && form.invalid) {
            <ac-ui-message tone="error"
              >Complete the hospital details before publishing.</ac-ui-message
            >
          }
          @if (formError()) {
            <ac-ui-message tone="error">{{ formError() }}</ac-ui-message>
          }
          @if (formMessage()) {
            <ac-ui-message tone="success">{{ formMessage() }}</ac-ui-message>
          }
          <button type="submit" [disabled]="saving()">
            {{ saving() ? 'Publishing...' : 'Add hospital' }}
          </button>
        </form>
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      /* ── Top bar ─────────────────────────────────────────────── */
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 24px;
      }
      .search-box {
        flex: 1;
        max-width: 520px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 16px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-tint-steel-soft);
        border-radius: 10px;
        box-shadow: 0 2px 8px rgb(15 23 42 / 0.04);
      }
      .search-icon {
        font-size: 15px;
        opacity: 0.7;
      }
      .search-input {
        flex: 1;
        border: none;
        padding: 12px 0;
        font: inherit;
        font-size: 14px;
        background: transparent;
        outline: none;
      }
      .topbar-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .user-profile-small {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .user-text {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .user-text .name {
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-action-darkest);
      }
      .user-text .role {
        font-size: 12px;
        color: var(--ac-color-text-slate);
      }
      .avatar-small {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
        font-size: 13px;
        font-weight: 700;
      }

      /* ── Page header ─────────────────────────────────────────── */
      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 24px;
      }
      .page-header h1 {
        font-size: 28px;
        color: var(--ac-color-action-darkest);
        margin-bottom: 6px;
      }
      .page-header > div > p {
        color: var(--ac-color-text-slate);
        font-size: 14px;
        max-width: 560px;
      }
      .view-toggle {
        display: flex;
        gap: 8px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-tint-steel-soft);
        border-radius: 10px;
        padding: 4px;
      }
      .toggle-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        border: none;
        background: transparent;
        color: var(--ac-color-text-slate);
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
      }
      .toggle-btn.active {
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
      }

      /* ── Layout: sidebar + list ──────────────────────────────── */
      .content-wrapper {
        display: flex;
        gap: 24px;
        align-items: flex-start;
      }

      .filters-sidebar {
        width: 250px;
        flex-shrink: 0;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-tint-steel-soft);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 18px;
        box-shadow: 0 2px 8px rgb(15 23 42 / 0.04);
        position: sticky;
        top: 16px;
      }
      .filters-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .filter-icon {
        font-size: 16px;
      }
      .filters-header h2 {
        font-size: 16px;
        color: var(--ac-color-action-darkest);
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .filter-label {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: var(--ac-color-text-slate);
      }
      .filter-select {
        padding: 10px 12px;
        border: 1px solid var(--ac-color-tint-steel-soft);
        border-radius: 8px;
        font: inherit;
        font-size: 14px;
        background: var(--ac-color-surface);
        cursor: pointer;
        outline: none;
      }
      .filter-select:focus {
        border-color: var(--ac-color-action-alt);
      }
      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--ac-color-slate-700);
        cursor: pointer;
      }
      .checkbox-label input {
        accent-color: var(--ac-color-action-alt);
        width: 16px;
        height: 16px;
      }
      .apply-filters-btn {
        padding: 12px;
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: 8px;
        font: inherit;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .apply-filters-btn:hover {
        background: var(--ac-color-ink-a);
      }
      .clear-filters-btn {
        padding: 10px;
        background: transparent;
        color: var(--ac-color-text-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        font: inherit;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
      }
      .clear-filters-btn:hover {
        color: var(--ac-color-action-alt);
        border-color: var(--ac-color-action-alt);
      }

      /* ── Results list ────────────────────────────────────────── */
      .hospitals-list {
        flex: 1;
        min-width: 0;
      }
      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
        padding: 14px 18px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-tint-steel-soft);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgb(15 23 42 / 0.04);
      }
      .results-count {
        font-size: 14px;
        color: var(--ac-color-text-slate);
        font-weight: 500;
      }
      .sort-dropdown {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--ac-color-text-slate);
      }
      .sort-dropdown select {
        padding: 7px 10px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 8px;
        font: inherit;
        font-size: 13px;
        cursor: pointer;
        outline: none;
      }

      .loading-state,
      .empty-state {
        padding: 40px 20px;
        text-align: center;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-tint-steel-soft);
        border-radius: 12px;
        color: var(--ac-color-text-slate);
        font-size: 14px;
      }
      .error {
        padding: 14px 18px;
        border-radius: 12px;
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-strong);
        font-weight: 600;
        font-size: 14px;
      }

      /* ── Hospital cards ──────────────────────────────────────── */
      .hospital-card {
        display: flex;
        gap: 18px;
        padding: 20px;
        margin-bottom: 16px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-tint-steel-soft);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgb(15 23 42 / 0.04);
        transition: box-shadow 0.2s;
      }
      .hospital-card:hover {
        box-shadow: 0 6px 18px rgb(15 23 42 / 0.08);
      }
      .hospital-image-wrapper {
        flex-shrink: 0;
      }
      .hospital-mark {
        width: 96px;
        height: 96px;
        border-radius: 12px;
        background: var(--ac-color-tint-blue-light);
        display: grid;
        place-items: center;
      }
      .hospital-mark span {
        height: 34px;
        position: relative;
        width: 34px;
      }
      .hospital-mark span::before,
      .hospital-mark span::after {
        background: var(--ac-color-action-alt);
        content: '';
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
      }
      .hospital-mark span::before {
        height: 34px;
        width: 9px;
      }
      .hospital-mark span::after {
        height: 9px;
        width: 34px;
      }
      .hospital-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .hospital-header h3 {
        font-size: 18px;
        color: var(--ac-color-action-darkest);
      }
      .hospital-location {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--ac-color-text-slate);
        font-size: 14px;
      }
      .location-icon {
        font-size: 15px;
      }
      .services-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .service-tag {
        padding: 4px 10px;
        background: var(--ac-color-blue-100);
        color: var(--ac-color-blue-600);
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
      }
      .hospital-footer {
        margin-top: auto;
        padding-top: 6px;
      }
      .booking-btn {
        padding: 11px 22px;
        background: var(--ac-color-action-alt);
        color: var(--ac-color-text-on-action);
        border: none;
        border-radius: 8px;
        font: inherit;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .booking-btn:hover {
        background: var(--ac-color-ink-a);
      }

      /* ── Admin panel (kept) ──────────────────────────────────── */
      .admin-panel {
        margin-top: 28px;
        border: 1px solid var(--ac-color-border);
        border-radius: 12px;
        background: var(--ac-color-surface);
        box-shadow: 0 8px 30px rgb(41 74 90 / 0.06);
        padding: 24px;
      }
      .admin-panel header {
        margin-bottom: 18px;
      }
      .admin-panel h2 {
        font-size: 20px;
        color: var(--ac-color-action-darkest);
      }
      .admin-panel header p {
        margin-top: 6px;
        color: var(--ac-color-text-slate);
        font-size: 14px;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .field-grid {
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-slate-700);
      }
      .field input,
      .field textarea {
        border: 1px solid var(--ac-color-tint-steel-soft);
        border-radius: 8px;
        font: inherit;
        font-weight: 400;
        padding: 10px 12px;
        resize: vertical;
      }
      .field input:focus,
      .field textarea:focus {
        border-color: var(--ac-color-action);
        box-shadow: 0 0 0 4px rgb(61 99 117 / 0.12);
        outline: none;
      }
      .admin-panel button[type='submit'] {
        justify-self: start;
        min-height: 46px;
        border: 0;
        border-radius: 8px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        cursor: pointer;
        font: inherit;
        font-weight: var(--ac-font-weight-bold);
        padding: 0 18px;
      }
      .admin-panel button[type='submit']:hover:not(:disabled) {
        background: var(--ac-color-ink-j);
      }
      .admin-panel button[type='submit']:disabled {
        cursor: progress;
        opacity: 0.72;
      }
      .form-error,
      .success {
        border-radius: 8px;
        padding: 14px 16px;
        font-size: 14px;
      }
      .form-error {
        background: var(--ac-color-alert-surface);
        color: var(--ac-color-alert-strong);
      }
      .success {
        background: var(--ac-color-sage-light);
        color: var(--ac-color-olive-darkest);
      }

      /* ── Responsive ──────────────────────────────────────────── */
      @media (max-width: 960px) {
        .content-wrapper {
          flex-direction: column;
        }
        .filters-sidebar {
          width: 100%;
          position: static;
        }
      }
      @media (max-width: 640px) {
        .page-header {
          flex-direction: column;
          gap: 16px;
        }
        .topbar {
          flex-direction: column;
          align-items: stretch;
        }
        .search-box {
          max-width: 100%;
        }
        .user-profile-small .user-text {
          display: none;
        }
        .hospital-card {
          flex-direction: column;
        }
        .hospital-mark {
          width: 100%;
          height: 110px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalsPage implements OnInit {
  private readonly api = inject(HospitalsApi);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly canManage = computed(() => this.auth.parent()?.role === 'ADMIN');

  /** Full directory as loaded from the API (never modified). */
  private readonly allHospitals = signal<readonly HospitalResponse[]>([]);

  // ── Filters / search / sort ─────────────────────────────────────
  readonly search = signal('');
  readonly selectedCity = signal('');
  readonly selectedServices = signal<string[]>([]);
  readonly sortBy = signal<SortOption>('name');
  readonly serviceOptions = SERVICE_FILTER_OPTIONS;

  /** Distinct cities from the loaded directory. */
  readonly cities = computed(() =>
    [...new Set(this.allHospitals().map((h) => h.city))].sort((a, b) => a.localeCompare(b)),
  );

  /** Frontend filtering + search + sorting over the loaded directory. */
  readonly filteredHospitals = computed<readonly HospitalViewModel[]>(() => {
    const term = this.search().trim().toLowerCase();
    const city = this.selectedCity();
    const services = this.selectedServices();

    const items = this.allHospitals()
      .map((hospital) => ({ ...hospital, serviceTags: parseServiceTags(hospital.services) }))
      .filter((hospital) => {
        if (city !== '' && hospital.city.toLowerCase() !== city.toLowerCase()) return false;
        if (
          services.length > 0 &&
          !services.some((service) => matchesService(hospital.services, service))
        ) {
          return false;
        }
        if (term !== '') {
          const haystack =
            `${hospital.name} ${hospital.city} ${hospital.address} ${hospital.services}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      });

    switch (this.sortBy()) {
      case 'city':
        return [...items].sort(
          (a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name),
        );
      case 'services':
        return [...items].sort((a, b) => b.serviceTags.length - a.serviceTags.length);
      case 'name':
      default:
        return [...items].sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  readonly hospitals = computed(() => this.filteredHospitals());
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly formMessage = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    city: ['', [Validators.required, Validators.maxLength(120)]],
    address: ['', [Validators.required, Validators.maxLength(300)]],
    services: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  readonly userName = computed(() => {
    const parent = this.auth.parent();
    const name = [parent?.firstName, parent?.lastName].filter(Boolean).join(' ').trim();
    return name !== '' ? name : (parent?.email ?? 'Parent');
  });
  readonly userRole = computed(() => {
    const role = this.auth.parent()?.role ?? 'PARENT';
    return role === 'ADMIN' ? 'Administrator' : 'Parent';
  });
  readonly initials = computed(() => {
    const parent = this.auth.parent();
    const first = parent?.firstName?.[0] ?? '';
    const last = parent?.lastName?.[0] ?? '';
    const value = (first + last).trim();
    return value !== '' ? value.toUpperCase() : 'P';
  });

  ngOnInit() {
    this.load();
  }

  onSortChange(value: string) {
    if (value === 'city' || value === 'services' || value === 'name') {
      this.sortBy.set(value);
    }
  }

  toggleService(service: string) {
    const current = this.selectedServices();
    this.selectedServices.set(
      current.includes(service) ? current.filter((s) => s !== service) : [...current, service],
    );
  }

  applyFilters() {
    // Frontend filtering is reactive via `filteredHospitals`; Go re-applies nothing
    // extra but keeps the Schools-page interaction pattern.
  }

  clearFilters() {
    this.search.set('');
    this.selectedCity.set('');
    this.selectedServices.set([]);
  }

  submit() {
    this.formError.set(null);
    this.formMessage.set(null);
    if (!this.canManage()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .createHospital({
        name: value.name.trim(),
        city: value.city.trim(),
        address: value.address.trim(),
        services: value.services.trim(),
      })
      .subscribe({
        next: (hospital) => {
          this.allHospitals.update((items) =>
            [...items, hospital].sort((a, b) => a.name.localeCompare(b.name)),
          );
          this.form.reset();
          this.formMessage.set(`${hospital.name} has been added to the directory.`);
          this.saving.set(false);
        },
        error: () => {
          this.formError.set('Hospital could not be added. Please try again.');
          this.saving.set(false);
        },
      });
  }

  private load() {
    this.loading.set(true);
    this.error.set(null);
    this.api.listHospitals().subscribe({
      next: (hospitals) => {
        this.allHospitals.set(hospitals);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Hospitals could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });
  }
}

/** Split the stored services string into badge tags (comma / newline separated). */
function parseServiceTags(services: string): string[] {
  return services
    .split(/[,;\n]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag !== '');
}

/** Case-insensitive service match tolerant of separators ("Speech support" etc.). */
function matchesService(services: string, service: string): boolean {
  const haystack = services.toLowerCase();
  const needle = service.toLowerCase();
  return (
    haystack.includes(needle) ||
    haystack.includes(needle.replace(/\s+/g, '-')) ||
    needle.split(/\s+/).every((word) => word.length > 2 && haystack.includes(word))
  );
}
