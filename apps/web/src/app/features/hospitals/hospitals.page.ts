import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { HospitalResponse } from '@auticare/contracts';
import { AuthService } from '../../core/auth/auth.service';
import { HospitalsApi } from './data-access/hospitals.api';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">Care directory</p>
        <h1>Hospitals</h1>
        <p>
          {{
            canManage()
              ? 'Maintain the care directory families use to find specialist support.'
              : 'Explore specialist care providers available through AutiCare.'
          }}
        </p>
      </div>
      @if (canManage()) {
        <span class="role-badge">Administrator access</span>
      }
    </section>

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
            <p class="form-error" role="alert">Complete the hospital details before publishing.</p>
          }
          @if (formError()) {
            <p class="form-error" role="alert">{{ formError() }}</p>
          }
          @if (formMessage()) {
            <p class="success" role="status">{{ formMessage() }}</p>
          }
          <button type="submit" [disabled]="saving()">
            {{ saving() ? 'Publishing...' : 'Add hospital' }}
          </button>
        </form>
      </section>
    }

    @if (loading()) {
      <p class="status" aria-live="polite">Loading hospitals...</p>
    } @else if (error()) {
      <p class="form-error" role="alert">{{ error() }}</p>
    } @else if (hospitals().length === 0) {
      <section class="empty-state">
        <h2>No hospitals listed yet</h2>
        <p>New care providers will appear here when they are added to the directory.</p>
      </section>
    } @else {
      <section class="hospital-grid" aria-label="Hospital directory">
        @for (hospital of hospitals(); track hospital.id) {
          <article class="hospital-card">
            <div class="hospital-mark" aria-hidden="true"><span></span></div>
            <div>
              <p class="city">{{ hospital.city }}</p>
              <h2>{{ hospital.name }}</h2>
              <p class="address">{{ hospital.address }}</p>
            </div>
            <div class="services">
              <span>Services</span>
              <p>{{ hospital.services }}</p>
            </div>
          </article>
        }
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
      p {
        margin: 0;
      }
      .page-header {
        align-items: flex-start;
        display: flex;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 28px;
      }
      .page-header > div {
        max-width: 700px;
      }
      .eyebrow,
      .city,
      .services span {
        color: #546343;
        font-size: 14px;
        font-weight: 800;
        text-transform: uppercase;
      }
      .eyebrow {
        margin-bottom: 8px;
      }
      h1 {
        color: #001e2b;
        font-size: 40px;
        line-height: 1.2;
      }
      .page-header p:last-child {
        color: #41484b;
        font-size: 17px;
        line-height: 1.55;
        margin-top: 10px;
      }
      .role-badge {
        border-radius: 999px;
        background: #d7e9c0;
        color: #3d4b2d;
        font-size: 14px;
        font-weight: 800;
        padding: 9px 13px;
        white-space: nowrap;
      }
      .admin-panel {
        border: 1px solid #c6dde9;
        border-radius: 8px;
        background: #e8f6ff;
        display: grid;
        gap: 20px;
        margin-bottom: 28px;
        padding: 24px;
      }
      .admin-panel header {
        display: grid;
        gap: 7px;
      }
      h2 {
        color: #001e2b;
        font-size: 23px;
        line-height: 1.3;
      }
      .admin-panel header p,
      .address,
      .services p {
        color: #41484b;
        line-height: 1.5;
      }
      form {
        display: grid;
        gap: 16px;
      }
      .field-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .field {
        color: #001e2b;
        display: grid;
        font-weight: 800;
        gap: 9px;
      }
      input,
      textarea {
        box-sizing: border-box;
        width: 100%;
        border: 1px solid #b8c2c8;
        border-radius: 8px;
        background: #ffffff;
        color: #001e2b;
        font: inherit;
        font-weight: 400;
        padding: 13px 14px;
      }
      input {
        min-height: 50px;
      }
      textarea {
        min-height: 112px;
        resize: vertical;
      }
      input:focus,
      textarea:focus {
        border-color: #3d6375;
        box-shadow: 0 0 0 4px rgb(61 99 117 / 0.12);
        outline: none;
      }
      button {
        justify-self: start;
        min-height: 46px;
        border: 0;
        border-radius: 8px;
        background: #3d6375;
        color: #ffffff;
        cursor: pointer;
        font: inherit;
        font-weight: 800;
        padding: 0 18px;
      }
      button:hover:not(:disabled) {
        background: #244b5d;
      }
      button:disabled {
        cursor: progress;
        opacity: 0.72;
      }
      .status,
      .form-error,
      .success,
      .empty-state {
        border-radius: 8px;
        margin: 0 0 22px;
        padding: 16px;
      }
      .status {
        background: #e8f6ff;
        color: #164f68;
      }
      .form-error {
        background: #ffdad6;
        color: #93000a;
      }
      .success {
        background: #e7eedf;
        color: #244b2d;
      }
      .empty-state {
        border: 1px solid #dde5e4;
        background: #ffffff;
      }
      .empty-state p {
        color: #41484b;
        margin-top: 8px;
      }
      .hospital-grid {
        display: grid;
        gap: 18px;
        grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
      }
      .hospital-card {
        min-height: 255px;
        border: 1px solid #dde5e4;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 8px 30px rgb(41 74 90 / 0.06);
        display: grid;
        gap: 18px;
        padding: 22px;
      }
      .hospital-mark {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        background: #c0e8fe;
        display: grid;
        place-items: center;
      }
      .hospital-mark span {
        height: 20px;
        position: relative;
        width: 20px;
      }
      .hospital-mark span::before,
      .hospital-mark span::after {
        background: #315d72;
        content: '';
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
      }
      .hospital-mark span::before {
        height: 20px;
        width: 5px;
      }
      .hospital-mark span::after {
        height: 5px;
        width: 20px;
      }
      .city {
        margin-bottom: 6px;
      }
      .address {
        margin-top: 8px;
      }
      .services {
        align-self: end;
        border-top: 1px solid #dde5e4;
        padding-top: 14px;
      }
      .services span {
        color: #315d72;
        font-size: 12px;
      }
      .services p {
        margin-top: 5px;
      }
      @media (max-width: 640px) {
        .page-header {
          flex-direction: column;
        }
        h1 {
          font-size: 32px;
        }
        .field-grid {
          grid-template-columns: 1fr;
        }
        .admin-panel {
          padding: 20px;
        }
        button {
          width: 100%;
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
  readonly hospitals = signal<readonly HospitalResponse[]>([]);
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

  ngOnInit() {
    this.load();
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
          this.hospitals.update((items) =>
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
        this.hospitals.set(hospitals);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Hospitals could not be loaded. Please refresh the page.');
        this.loading.set(false);
      },
    });
  }
}
