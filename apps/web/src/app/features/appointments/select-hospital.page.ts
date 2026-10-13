import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { HospitalResponse } from '@auticare/contracts';
import { HospitalsApi } from '../hospitals/data-access/hospitals.api';
import { I18nService } from '../../core/i18n/i18n.service';
import { formatCityBilingual, formatHospitalName } from '../hospitals/cambodia-hospitals.data';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';

@Component({
  standalone: true,
  imports: [RouterLink, UiEmptyStateComponent, UiSpinnerComponent, UiMessageComponent],
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a routerLink="/appointments">{{
        currentLang() === 'km' ? 'ការណាត់ជួបមន្ទីរពេទ្យ' : 'Hospital Appointments'
      }}</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{{
        currentLang() === 'km' ? 'ជ្រើសរើសមន្ទីរពេទ្យ' : 'Choose a hospital'
      }}</span>
    </nav>

    <section class="page-header">
      <div class="header-content">
        <h1>
          {{
            currentLang() === 'km'
              ? 'តើអ្នកចង់ទៅពិគ្រោះនៅមន្ទីរពេទ្យណា?'
              : 'Which hospital would you like to visit?'
          }}
        </h1>
        <p>
          {{
            currentLang() === 'km'
              ? 'ជ្រើសរើសមន្ទីរពេទ្យដើម្បីមើលវេជ្ជបណ្ឌិតឯកទេស និងស្នើសុំការណាត់ជួប។'
              : 'Pick a hospital to see its available specialists and request an appointment.'
          }}
        </p>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            class="search-input"
            [attr.aria-label]="
              currentLang() === 'km'
                ? 'ស្វែងរកមន្ទីរពេទ្យតាមឈ្មោះ ទីក្រុង ឬអាសយដ្ឋាន...'
                : 'Search hospitals by name, city, or address...'
            "
            [placeholder]="
              currentLang() === 'km'
                ? 'ស្វែងរកមន្ទីរពេទ្យតាមឈ្មោះ ទីក្រុង ឬអាសយដ្ឋាន...'
                : 'Search hospitals by name, city, or address...'
            "
            [value]="searchQuery()"
            (input)="searchQuery.set($any($event.target).value)"
          />
        </div>
      </div>
    </section>

    @if (!loading() && !error() && hospitals().length > 0) {
      <div class="status-bar">
        <span class="count-tag">
          @if (hospitals().length === displayedHospitals().length) {
            {{
              currentLang() === 'km'
                ? 'បង្ហាញមន្ទីរពេទ្យទាំង ' + hospitals().length
                : 'Showing all ' + hospitals().length + ' hospitals'
            }}
          } @else {
            {{
              currentLang() === 'km'
                ? 'បង្ហាញ ' +
                  displayedHospitals().length +
                  ' ក្នុងចំណោម ' +
                  hospitals().length +
                  ' មន្ទីរពេទ្យ'
                : 'Showing ' +
                  displayedHospitals().length +
                  ' of ' +
                  hospitals().length +
                  ' hospitals'
            }}
          }
        </span>
      </div>
    }

    @if (loading()) {
      <ac-ui-spinner
        [label]="currentLang() === 'km' ? 'កំពុងផ្ទុកបញ្ជីមន្ទីរពេទ្យ…' : 'Loading hospitals…'"
      />
    } @else if (error(); as problem) {
      <ac-ui-message tone="error">{{ problem }}</ac-ui-message>
      <button type="button" class="retry" (click)="load()">
        {{ currentLang() === 'km' ? 'ព្យាយាមម្តងទៀត' : 'Try again' }}
      </button>
    } @else if (hospitals().length === 0) {
      <ac-ui-empty-state
        [title]="
          currentLang() === 'km' ? 'មិនទាន់មានមន្ទីរពេទ្យនៅឡើយទេ' : 'No hospitals available yet'
        "
        [message]="
          currentLang() === 'km'
            ? 'សូមពិនិត្យមើលឡើងវិញនៅពេលក្រោយ ឬទាក់ទងមកកាន់យើងខ្ញុំដើម្បីបន្ថែមអ្នកផ្តល់សេវាថែទាំរបស់អ្នក។'
            : 'Check back soon, or contact support to add your care provider.'
        "
      />
    } @else if (displayedHospitals().length === 0) {
      <ac-ui-empty-state
        [title]="currentLang() === 'km' ? 'រកមិនឃើញមន្ទីរពេទ្យទេ' : 'No hospitals found'"
        [message]="
          currentLang() === 'km'
            ? 'មិនមានមន្ទីរពេទ្យណាត្រូវនឹងការស្វែងរករបស់អ្នកទេ។ សូមសាកល្បងស្វែងរកដោយពាក្យគន្លឹះ ឬទីក្រុងផ្សេង។'
            : 'No hospitals match your search query. Try searching with a different keyword or city.'
        "
      >
        <button type="button" class="clear-search-btn" (click)="clearSearch()">
          {{ currentLang() === 'km' ? 'សម្អាតការស្វែងរក' : 'Clear search' }}
        </button>
      </ac-ui-empty-state>
    } @else {
      <ul class="hospital-list">
        @for (hospital of displayedHospitals(); track hospital.id) {
          <li>
            <a class="hospital-card" [routerLink]="['/appointments/hospitals', hospital.id]">
              <div class="hospital-info">
                <div class="hospital-title-row">
                  <h2>{{ formatHospitalName(hospital.name, currentLang()) }}</h2>
                  <span class="city-badge">{{
                    formatCityBilingual(hospital.city, currentLang())
                  }}</span>
                </div>
                <p class="hospital-address">{{ hospital.address }}</p>
                @if (hospital.services) {
                  <p class="hospital-services">{{ hospital.services }}</p>
                }
              </div>
              <span class="chevron" aria-hidden="true">›</span>
            </a>
          </li>
        }
      </ul>
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
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .header-content {
        flex: 1;
        min-width: 280px;
      }

      .header-actions {
        flex: 1;
        max-width: 440px;
        min-width: 260px;
      }

      .search-box {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 16px;
        background: var(--ac-color-surface);
        border: 1.5px solid var(--ac-color-border);
        border-radius: 999px;
        box-shadow: var(--ac-shadow-sm);
        transition: border-color var(--ac-motion-fast);
      }

      .search-box:focus-within {
        border-color: var(--ac-color-action-alt);
      }

      .search-icon {
        font-size: 15px;
        opacity: 0.7;
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

      h1 {
        margin: 0 0 8px;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
      }

      p {
        margin: 0;
        color: var(--ac-color-text-body);
      }

      .status-bar {
        display: flex;
        align-items: center;
        margin-bottom: 18px;
      }

      .count-tag {
        border-radius: 999px;
        background: var(--ac-color-tint-blue-soft);
        color: var(--ac-color-text-dark);
        padding: 4px 12px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
      }

      .clear-search-btn {
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

      .clear-search-btn:hover {
        background: var(--ac-color-text-dark);
        color: var(--ac-color-text-on-action);
      }

      .status {
        border-radius: 12px;
        padding: 16px;
        background: var(--ac-color-surface-info);
        color: var(--ac-color-ink-c);
      }

      .hospital-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 12px;
      }

      .hospital-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        border: 1px solid var(--ac-color-border);
        border-radius: 12px;
        background: var(--ac-color-surface);
        padding: 20px;
        text-decoration: none;
        box-shadow: var(--ac-shadow-sm);
        transition:
          border-color var(--ac-motion-fast),
          box-shadow var(--ac-motion-fast);
      }

      .hospital-card:hover {
        border-color: var(--ac-color-action-alt);
        box-shadow: var(--ac-shadow-md);
      }

      .hospital-info {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .hospital-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .hospital-card h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-card-title);
      }

      .city-badge {
        border-radius: 999px;
        background: var(--ac-color-sage-light);
        color: var(--ac-color-olive);
        padding: 2px 10px;
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
      }

      .hospital-address {
        margin: 0;
        color: var(--ac-color-text-muted);
        font-size: var(--ac-type-meta);
      }

      .hospital-services {
        margin: 0;
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-meta);
        line-height: var(--ac-line-body);
      }

      .chevron {
        color: var(--ac-color-action-alt);
        font-size: 1.5rem;
        font-weight: var(--ac-font-weight-bold);
      }

      .retry {
        margin-top: 12px;
        min-height: 40px;
        padding: 0 16px;
        border: 1px solid var(--ac-color-border);
        border-radius: 8px;
        background: var(--ac-color-surface);
        color: var(--ac-color-text-dark);
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectHospitalPage implements OnInit {
  private readonly hospitalsApi = inject(HospitalsApi);
  protected readonly i18n = inject(I18nService);
  protected readonly currentLang = this.i18n.currentLang;
  protected readonly formatHospitalName = formatHospitalName;
  protected readonly formatCityBilingual = formatCityBilingual;

  protected readonly hospitals = signal<readonly HospitalResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');

  readonly displayedHospitals = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.hospitals();
    if (!query) return list;

    return list.filter((hospital) => {
      const matchName = hospital.name.toLowerCase().includes(query);
      const matchCity = hospital.city.toLowerCase().includes(query);
      const matchAddress = hospital.address.toLowerCase().includes(query);
      const matchServices = hospital.services
        ? hospital.services.toLowerCase().includes(query)
        : false;
      return matchName || matchCity || matchAddress || matchServices;
    });
  });

  ngOnInit() {
    this.load();
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  /**
   * The failure branch used only to clear `loading`, so a failed request looked
   * exactly like a hospital list that happened to be empty — the parent was told
   * to "check back soon" when the real problem was that the request failed.
   */
  protected load() {
    this.loading.set(true);
    this.error.set(null);
    this.hospitalsApi.listHospitals().subscribe({
      next: (hospitals) => {
        this.hospitals.set(hospitals);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(
          this.currentLang() === 'km'
            ? 'មិនអាចផ្ទុកទិន្នន័យមន្ទីរពេទ្យបានទេ។'
            : 'Hospitals could not be loaded.',
        );
        this.loading.set(false);
      },
    });
  }
}
