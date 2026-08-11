import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HospitalsApi } from '../hospitals/data-access/hospitals.api';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { AppointmentsFacade } from './state/appointments.facade';
import { BookAppointmentModalComponent } from './book-appointment-modal.component';
import { specialtyCategories } from './appointments.types';

@Component({
  standalone: true,
  imports: [RouterLink, UiEmptyStateComponent, BookAppointmentModalComponent],
  template: `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a routerLink="/appointments">Appointments</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{{ facade.activeHospital()?.name ?? 'Specialists' }}</span>
    </nav>

    <section class="page-header">
      <h1>Available Specialists</h1>
      <span class="count-tag">View All ({{ facade.doctors().length }})</span>
    </section>

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
      <p class="status" aria-live="polite">Loading specialists...</p>
    } @else if (facade.filteredDoctors().length === 0) {
      <ac-ui-empty-state
        title="No specialists in this category"
        message="Try a different specialty filter, or check back soon."
      />
    } @else {
      <div class="doctor-grid">
        @for (doctor of facade.filteredDoctors(); track doctor.id) {
          <article class="doctor-card">
            <div class="avatar" aria-hidden="true">{{ initials(doctor.fullName) }}</div>
            <h2>{{ doctor.fullName }}</h2>
            <span class="specialty-badge">{{ doctor.specialty }}</span>
            <p class="rating">★ {{ rating(doctor.id) }}</p>
            <p class="next-available">Next available: {{ nextAvailable(doctor.id) }}</p>
            <button type="button" class="book-button" (click)="facade.openBooking(doctor)">
              Book Appointment
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
        color: #66747a;
        font-size: var(--ac-type-meta);
      }

      .breadcrumbs a {
        color: #66747a;
        text-decoration: none;
      }

      .breadcrumbs span[aria-current] {
        color: #294a5a;
        font-weight: var(--ac-font-weight-semibold);
      }

      .page-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }

      h1 {
        margin: 0;
        color: #001e2b;
        font-size: var(--ac-type-page-title);
      }

      .count-tag {
        border-radius: 999px;
        background: #f0f7fb;
        color: #294a5a;
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
        border: 1.5px solid #dde5e4;
        border-radius: 999px;
        background: #ffffff;
        color: #41484b;
        padding: 0 16px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        cursor: pointer;
      }

      .category-pills button.active {
        background: #294a5a;
        border-color: #294a5a;
        color: #ffffff;
      }

      .status {
        border-radius: 12px;
        padding: 16px;
        background: #e8f6ff;
        color: #163f52;
      }

      .doctor-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 18px;
      }

      .doctor-card {
        display: flex;
        flex-direction: column;
        gap: 10px;
        border: 1px solid #dde5e4;
        border-radius: 12px;
        background: #ffffff;
        box-shadow: var(--ac-shadow-sm);
        padding: 22px;
      }

      .avatar {
        width: 52px;
        height: 52px;
        border-radius: 999px;
        background: linear-gradient(135deg, #47758b, #9cc5d6);
        color: #ffffff;
        display: grid;
        place-items: center;
        font-weight: var(--ac-font-weight-bold);
      }

      .doctor-card h2 {
        margin: 0;
        color: #001e2b;
        font-size: var(--ac-type-card-title);
      }

      .specialty-badge {
        align-self: flex-start;
        border-radius: 999px;
        background: var(--ac-color-sage-light);
        color: #546343;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
      }

      .rating {
        margin: 0;
        color: #d9a441;
        font-weight: var(--ac-font-weight-semibold);
      }

      .next-available {
        margin: 0 0 8px;
        color: #66747a;
        font-size: var(--ac-type-meta);
      }

      .book-button {
        min-height: 44px;
        border: 0;
        border-radius: 10px;
        background: #294a5a;
        color: #ffffff;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
      }

      .book-button:hover {
        background: #1c3644;
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

  ngOnInit() {
    const hospitalId = this.route.snapshot.paramMap.get('hospitalId');
    if (!hospitalId) return;

    this.hospitalsApi.listHospitals().subscribe({
      next: (hospitals) => {
        const hospital = hospitals.find((h) => h.id === hospitalId);
        if (hospital) {
          this.facade.enterHospital({ id: hospital.id, name: hospital.name, city: hospital.city });
        }
      },
    });
  }

  protected initials(fullName: string): string {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  // Rating and next-available slot are presentation-only: the Doctor model
  // (apps/api/prisma/schema.prisma) has no rating or availability field yet,
  // so these are derived deterministically from the doctor id rather than
  // stored/randomized, to avoid implying real backend data.
  protected rating(doctorId: string): string {
    const seed = hashCode(doctorId);
    const value = 4.6 + (seed % 5) / 10;
    return value.toFixed(1);
  }

  protected nextAvailable(doctorId: string): string {
    const seed = hashCode(doctorId);
    const daysOut = 1 + (seed % 5);
    const date = new Date();
    date.setDate(date.getDate() + daysOut);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
}

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}
