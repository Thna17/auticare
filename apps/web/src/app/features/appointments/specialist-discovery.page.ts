import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import type { HospitalResponse } from '@auticare/contracts';
import { I18nService } from '../../core/i18n/i18n.service';
import { HospitalsApi } from '../hospitals/data-access/hospitals.api';
import {
  CAMBODIA_PROVINCES,
  CAMBODIAN_HOSPITALS_SEED,
  formatCityBilingual,
  formatSpecialtyBilingual,
} from '../hospitals/cambodia-hospitals.data';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { AppointmentsFacade } from './state/appointments.facade';
import { BookAppointmentModalComponent } from './book-appointment-modal.component';
import { specialtyCategories } from './appointments.types';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';

@Component({
  standalone: true,
  imports: [RouterLink, UiEmptyStateComponent, BookAppointmentModalComponent, UiSpinnerComponent],
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a routerLink="/appointments">{{
        currentLang() === 'km' ? 'ការណាត់ជួបមន្ទីរពេទ្យ' : 'Hospital Appointments'
      }}</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{{
        facade.activeHospital()?.name ??
          (currentLang() === 'km' ? 'វេជ្ជបណ្ឌិតឯកទេស' : 'Specialists')
      }}</span>
    </nav>

    <section class="page-header">
      <div class="header-content">
        <h1>
          {{
            currentLang() === 'km'
              ? 'វេជ្ជបណ្ឌិតឯកទេសដែលទំនេរ (Available Specialists)'
              : 'Available Specialists'
          }}
        </h1>
        <span class="count-tag">
          @if (facade.doctors().length === displayedDoctors().length) {
            View All ({{ facade.doctors().length }})
          } @else {
            {{ displayedDoctors().length }} of {{ facade.doctors().length }}
          }
        </span>
      </div>
    </section>

    <!-- Filter Toolbar -->
    <div class="filter-toolbar">
      <div class="search-box">
        <span class="search-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input
          type="search"
          class="search-input"
          aria-label="Search specialists by name, specialty, or bio..."
          [placeholder]="
            currentLang() === 'km'
              ? 'ស្វែងរកវេជ្ជបណ្ឌិត ជំនាញឯកទេស ឬប្រវត្តិ...'
              : 'Search specialists by name, specialty, or bio...'
          "
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)"
        />
      </div>

      <div class="dropdown-filters">
        <!-- City Filter Dropdown -->
        <div class="select-wrapper">
          <label for="city-filter" class="sr-only">Filter by city</label>
          <select
            id="city-filter"
            class="filter-select city-select"
            [value]="selectedCity()"
            (change)="onCitySelect($any($event.target).value)"
            aria-label="Filter by city"
          >
            <option value="ALL">All Cities</option>
            @for (city of availableCities(); track city.key) {
              <option [value]="city.key">{{ city.label }}</option>
            }
          </select>
        </div>

        <!-- Hospital Filter Dropdown -->
        <div class="select-wrapper">
          <label for="hospital-filter" class="sr-only">Filter by hospital</label>
          <select
            id="hospital-filter"
            class="filter-select hospital-select"
            [value]="selectedHospitalId()"
            (change)="onHospitalSelect($any($event.target).value)"
            aria-label="Filter by hospital"
          >
            <option value="ALL">All Hospitals</option>
            @for (hospital of filteredHospitalOptions(); track hospital.id) {
              <option [value]="hospital.id">{{ hospital.name }}</option>
            }
          </select>
        </div>
      </div>
    </div>

    <!-- Specialty category pills -->
    <div class="category-pills" role="group" aria-label="Filter by specialty">
      @for (category of categories; track category) {
        <button
          type="button"
          [class.active]="facade.categoryFilter() === category"
          (click)="facade.setCategory(category)"
        >
          {{ category }}
        </button>
      }
    </div>

    @if (facade.doctorsLoading()) {
      <ac-ui-spinner label="Loading specialists…" />
    } @else if (displayedDoctors().length === 0) {
      <ac-ui-empty-state
        [title]="hasActiveFilters() ? 'No matching specialists' : 'No specialists available'"
        [message]="
          hasActiveFilters()
            ? 'No specialists match your search query and selected filter.'
            : 'No specialists are currently registered at this hospital.'
        "
      >
        @if (hasActiveFilters()) {
          <button type="button" class="clear-filters-btn" (click)="clearFilters()">
            Clear search & filters
          </button>
        }
      </ac-ui-empty-state>
    } @else {
      <div class="doctor-grid">
        @for (doctor of displayedDoctors(); track doctor.id) {
          <article class="doctor-card">
            <div class="doctor-card-header">
              <div class="avatar" aria-hidden="true">{{ initials(doctor.fullName) }}</div>
              <div class="doctor-meta-header">
                <h2>{{ doctor.fullName }}</h2>
                <span class="specialty-badge" [attr.data-specialty]="doctor.specialty">
                  {{ formatSpecialty(doctor.specialty) }}
                </span>
              </div>
            </div>

            <div class="hospital-name-tag">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{{ getDoctorHospitalName(doctor.hospitalId) }}</span>
            </div>

            <div class="available-days-group" aria-label="Available days">
              <span class="days-label">Available:</span>
              <div class="days-chips">
                @for (day of getDayChips(doctor.availableDays); track day) {
                  <span class="day-chip">{{ day }}</span>
                }
              </div>
            </div>

            @if (doctor.bio) {
              <p class="bio-text">{{ doctor.bio }}</p>
            }
            <p class="schedule-info">{{ formatSchedule(doctor) }}</p>
            <button type="button" class="book-button" (click)="facade.openBooking(doctor)">
              Book Consultation
            </button>
          </article>
        }
      </div>
    }

    @if (facade.booking().isOpen) {
      <ac-book-appointment-modal />
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .breadcrumbs {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .breadcrumbs a {
        color: var(--ac-color-text-muted);
        text-decoration: none;
      }

      .breadcrumbs span[aria-current] {
        color: var(--ac-color-text-dark);
        font-weight: var(--ac-font-weight-semibold);
      }

      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .filter-toolbar {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;
        align-items: center;
      }

      .search-box {
        flex: 1;
        min-width: 240px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 16px;
        background: var(--ac-color-surface);
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        box-shadow: var(--ac-shadow-sm);
        transition: border-color var(--ac-motion-fast);
      }

      .search-box:focus-within {
        border-color: var(--ac-color-action-alt);
      }

      .search-icon {
        font-size: 15px;
        opacity: 0.7;
        display: flex;
        align-items: center;
      }

      .search-input {
        flex: 1;
        border: none;
        padding: 10px 0;
        font: inherit;
        font-size: var(--ac-type-meta);
        background: transparent;
        outline: none;
        color: var(--ac-color-text);
      }

      .search-input::placeholder {
        color: var(--ac-color-text-muted);
      }

      .dropdown-filters {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .select-wrapper {
        position: relative;
      }

      .filter-select {
        min-height: 40px;
        border: 1.5px solid var(--ac-color-border);
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-text);
        padding: 0 16px;
        font: inherit;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        outline: none;
        cursor: pointer;
        box-shadow: var(--ac-shadow-sm);
        transition: border-color var(--ac-motion-fast);
      }

      .filter-select:focus {
        border-color: var(--ac-color-action-alt);
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      h1 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
      }

      .count-tag {
        border-radius: 999px;
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-text-dark);
        padding: 4px 12px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
      }

      .category-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 24px;
      }

      .category-pills button {
        min-height: 40px;
        border: 1.5px solid var(--ac-color-border);
        border-radius: 999px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        padding: 0 16px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
      }

      .category-pills button.active {
        background: var(--ac-color-text-dark);
        border-color: var(--ac-color-text-dark);
        color: var(--ac-color-text-on-action);
      }

      .clear-filters-btn {
        min-height: 40px;
        padding: 0 18px;
        border: 1.5px solid var(--ac-color-text-dark);
        border-radius: 999px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-dark);
        font-weight: var(--ac-font-weight-semibold);
        font-size: var(--ac-type-meta);
        cursor: pointer;
        transition:
          background var(--ac-motion-fast),
          color var(--ac-motion-fast);
      }

      .clear-filters-btn:hover {
        background: var(--ac-color-text-dark);
        color: var(--ac-color-text-on-action);
      }

      .status {
        border-radius: 12px;
        padding: 16px;
        background: var(--ac-color-surface-info);
        color: var(--ac-color-ink-c);
      }

      .doctor-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 18px;
      }

      .doctor-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        border: 1px solid var(--ac-color-border);
        border-radius: 12px;
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: 22px;
      }

      .doctor-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .avatar {
        width: 52px;
        height: 52px;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--ac-color-teal-slate), var(--ac-color-sky-soft));
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
        font-weight: var(--ac-font-weight-bold);
        flex-shrink: 0;
      }

      .doctor-meta-header {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .doctor-card h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-card-title);
      }

      .specialty-badge {
        align-self: flex-start;
        border-radius: 999px;
        background: var(--ac-color-sage-light);
        color: var(--ac-color-olive);
        padding: 3px 10px;
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
      }

      .hospital-name-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
      }

      .available-days-group {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        font-size: 12px;
      }

      .days-label {
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-medium);
      }

      .days-chips {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }

      .day-chip {
        padding: 2px 7px;
        border-radius: var(--ac-radius-sm);
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-action-deep);
        font-size: 11px;
        font-weight: var(--ac-font-weight-semibold);
      }

      .bio-text {
        margin: 0;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-meta);
        line-height: var(--ac-line-body);
      }

      .schedule-info {
        margin: 0 0 8px;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .book-button {
        min-height: 44px;
        border: 0;
        border-radius: 10px;
        background: var(--ac-color-text-dark);
        color: var(--ac-color-text-on-action);
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        transition: background-color var(--ac-motion-fast);
      }

      .book-button:hover {
        background: var(--ac-color-ink-charcoal);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecialistDiscoveryPage implements OnInit {
  protected readonly facade = inject(AppointmentsFacade);
  protected readonly categories = specialtyCategories;
  private readonly hospitalsApi = inject(HospitalsApi);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);
  protected readonly currentLang = this.i18n.currentLang;

  readonly hospitals = signal<readonly HospitalResponse[]>(CAMBODIAN_HOSPITALS_SEED);
  readonly selectedCity = signal('ALL');
  readonly selectedHospitalId = signal('ALL');
  readonly searchQuery = signal('');

  readonly availableCities = computed(() => {
    const provinceKeys = new Set(CAMBODIA_PROVINCES.map((p) => p.key.toLowerCase()));
    const list: { key: string; label: string }[] = CAMBODIA_PROVINCES.map((p) => ({
      key: p.key,
      label: formatCityBilingual(p.key, this.currentLang()),
    }));

    for (const h of this.hospitals()) {
      if (h.city && !provinceKeys.has(h.city.toLowerCase())) {
        provinceKeys.add(h.city.toLowerCase());
        list.push({
          key: h.city,
          label: h.city,
        });
      }
    }
    const activeCity = this.facade.activeHospital()?.city;
    if (activeCity && !provinceKeys.has(activeCity.toLowerCase())) {
      provinceKeys.add(activeCity.toLowerCase());
      list.push({
        key: activeCity,
        label: activeCity,
      });
    }
    return list;
  });

  readonly filteredHospitalOptions = computed(() => {
    const city = this.selectedCity();
    const list = this.hospitals().length > 0 ? this.hospitals() : CAMBODIAN_HOSPITALS_SEED;
    if (city === 'ALL') return list;
    const normCity = city.toLowerCase();
    return list.filter((h) => {
      const hCity = h.city.toLowerCase();
      return hCity === normCity || hCity.includes(normCity) || normCity.includes(hCity);
    });
  });

  protected formatSpecialty(specialty: string): string {
    return formatSpecialtyBilingual(specialty, this.currentLang());
  }

  readonly displayedDoctors = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const city = this.selectedCity();
    const hospitalId = this.selectedHospitalId();
    let doctors = this.facade.filteredDoctors();

    if (hospitalId !== 'ALL') {
      doctors = doctors.filter((doctor) => doctor.hospitalId === hospitalId);
    } else if (city !== 'ALL') {
      const normCity = city.toLowerCase();
      const cityHospitalIds = new Set(
        this.hospitals()
          .filter((h) => {
            const hCity = h.city.toLowerCase();
            return hCity === normCity || hCity.includes(normCity) || normCity.includes(hCity);
          })
          .map((h) => h.id),
      );
      doctors = doctors.filter((doctor) => {
        if (cityHospitalIds.has(doctor.hospitalId)) return true;
        const activeCity = (this.facade.activeHospital()?.city ?? '').toLowerCase();
        return (
          activeCity === normCity || activeCity.includes(normCity) || normCity.includes(activeCity)
        );
      });
    }

    if (!query) return doctors;

    return doctors.filter((doctor) => {
      const matchName = doctor.fullName.toLowerCase().includes(query);
      const matchSpecialty =
        doctor.specialty.toLowerCase().includes(query) ||
        this.formatSpecialty(doctor.specialty).toLowerCase().includes(query);
      const matchBio = (doctor.bio ?? '').toLowerCase().includes(query);
      return matchName || matchSpecialty || matchBio;
    });
  });

  readonly hasActiveFilters = computed(() => {
    const routeHospitalId = this.route.snapshot.paramMap.get('hospitalId') ?? 'ALL';
    const isHospitalFiltered =
      this.selectedHospitalId() !== 'ALL' && this.selectedHospitalId() !== routeHospitalId;
    return (
      this.searchQuery().trim().length > 0 ||
      this.facade.categoryFilter() !== 'All' ||
      this.selectedCity() !== 'ALL' ||
      isHospitalFiltered
    );
  });

  ngOnInit() {
    const hospitalId = this.route.snapshot.paramMap.get('hospitalId');
    if (hospitalId) {
      this.selectedHospitalId.set(hospitalId);
    }

    this.hospitalsApi.listHospitals().subscribe({
      next: (hospitals) => {
        const effectiveHospitals = hospitals.length > 0 ? hospitals : CAMBODIAN_HOSPITALS_SEED;
        this.hospitals.set(effectiveHospitals);
        if (hospitalId) {
          const hospital = effectiveHospitals.find((h) => h.id === hospitalId);
          if (hospital) {
            this.facade.enterHospital({
              id: hospital.id,
              name: hospital.name,
              city: hospital.city,
            });
          }
        }
      },
      error: () => {
        this.hospitals.set(CAMBODIAN_HOSPITALS_SEED);
      },
    });
  }

  onCitySelect(city: string): void {
    this.selectedCity.set(city);
    // If the currently selected hospital does not belong to the selected city, reset it
    if (city !== 'ALL') {
      const normCity = city.toLowerCase();
      const currentHosp = this.hospitals().find((h) => h.id === this.selectedHospitalId());
      if (
        currentHosp &&
        !currentHosp.city.toLowerCase().includes(normCity) &&
        !normCity.includes(currentHosp.city.toLowerCase())
      ) {
        this.selectedHospitalId.set('ALL');
      }
    }
  }

  onHospitalSelect(hospitalId: string): void {
    this.selectedHospitalId.set(hospitalId);
    if (hospitalId !== 'ALL') {
      const hospital = this.hospitals().find((h) => h.id === hospitalId);
      if (hospital) {
        this.facade.enterHospital({ id: hospital.id, name: hospital.name, city: hospital.city });
      }
    }
  }

  clearFilters(): void {
    const routeHospitalId = this.route.snapshot.paramMap.get('hospitalId') ?? 'ALL';
    this.searchQuery.set('');
    this.selectedCity.set('ALL');
    this.selectedHospitalId.set(routeHospitalId);
    this.facade.setCategory('All');
  }

  protected initials(fullName: string): string {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected getDoctorHospitalName(hospitalId?: string): string {
    if (hospitalId) {
      const match = this.hospitals().find((h) => h.id === hospitalId);
      if (match) return match.name;
    }
    return (
      this.facade.activeHospital()?.name ?? 'National Pediatric Hospital (មន្ទីរពេទ្យកុមារជាតិ)'
    );
  }

  protected getDayChips(availableDays?: string): string[] {
    const days = availableDays ?? '1,2,3,4,5';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days
      .split(',')
      .map(Number)
      .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6)
      .map((n) => dayNames[n]);
  }

  protected formatSchedule(doctor: {
    availableDays?: string;
    startHour?: number;
    endHour?: number;
  }): string {
    const days = doctor.availableDays ?? '1,2,3,4,5';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activeDays = days
      .split(',')
      .map(Number)
      .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6)
      .map((n) => dayNames[n])
      .join(', ');

    const start = doctor.startHour ?? 9;
    const end = doctor.endHour ?? 17;
    const timeRange = `${start}:00 - ${end}:00`;

    return activeDays ? `${activeDays} · ${timeRange}` : `Hours: ${timeRange}`;
  }
}
