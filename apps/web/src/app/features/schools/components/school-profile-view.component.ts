import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { SchoolDetailResponse } from '@auticare/contracts';
import { UiCardComponent } from '../../../design-system/components/ui-card.component';
import { availabilityLabel, availabilityTone } from '../school-display.util';

/**
 * Polished, read-only school profile view. Shared by the school's OWN profile page
 * (with `editable` = true, which surfaces an "Edit Profile" button) and the fully
 * read-only parent-facing detail page (`editable` = false). Both render the same
 * SchoolDetailResponse — the only difference is the edit affordance.
 */
@Component({
  selector: 'ac-school-profile-view',
  standalone: true,
  imports: [UiCardComponent],
  template: `
    <article class="profile-view">
      @if (school().coverImageUrl) {
        <img class="cover" [src]="school().coverImageUrl" [alt]="school().name + ' cover image'" />
      }

      <header class="profile-head">
        <div class="head-main">
          @if (school().logoUrl) {
            <img class="logo" [src]="school().logoUrl" [alt]="school().name + ' logo'" />
          }
          <div class="head-text">
            <div class="name-row">
              <h1>{{ school().name }}</h1>
              @if (school().isVerified) {
                <span class="verified" title="Verified by AutiCare">✓ Verified</span>
              }
            </div>
            @if (school().description) {
              <p class="tagline">{{ school().description }}</p>
            }
            <div class="head-meta">
              @if (school().rating !== null) {
                <span class="rating"
                  >★ {{ school().rating }} · {{ school().reviewCount }} review{{
                    school().reviewCount === 1 ? '' : 's'
                  }}</span
                >
              } @else {
                <span class="rating muted">No reviews yet</span>
              }
              <span class="avail" [class]="tone()">{{ availability() }}</span>
            </div>
          </div>
        </div>
        @if (editable()) {
          <button type="button" class="edit-btn" (click)="edit.emit()">Edit Profile</button>
        }
      </header>

      <div class="stats" role="group" aria-label="Key stats">
        <div class="stat">
          <span class="stat-label">Student : teacher</span>
          <span class="stat-value">{{ school().studentTeacherRatio || '—' }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Availability</span>
          <span class="stat-value">
            {{ availability() }}
            @if (school().availabilityStatus === 'WAITLIST' && school().waitlistEstimate) {
              <span class="stat-sub">({{ school().waitlistEstimate }})</span>
            }
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">Rating</span>
          <span class="stat-value">
            {{ school().rating !== null ? school().rating + ' / 5' : 'No reviews' }}
          </span>
        </div>
      </div>

      <ac-ui-card>
        <h2>Location &amp; contact</h2>
        <dl>
          <div>
            <dt>City / Province</dt>
            <dd>{{ school().city }}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{{ school().address }}</dd>
          </div>
          @if (school().email) {
            <div>
              <dt>Email</dt>
              <dd>
                <a [href]="'mailto:' + school().email">{{ school().email }}</a>
              </dd>
            </div>
          }
          @if (school().website) {
            <div>
              <dt>Website</dt>
              <dd>
                <a [href]="school().website" target="_blank" rel="noopener noreferrer">{{
                  school().website
                }}</a>
              </dd>
            </div>
          }
          @if (school().operatingHours) {
            <div>
              <dt>Operating hours</dt>
              <dd>{{ school().operatingHours }}</dd>
            </div>
          }
        </dl>
      </ac-ui-card>

      @if (school().specializations.length) {
        <ac-ui-card>
          <h2>Specializations &amp; therapies</h2>
          <div class="pills">
            @for (item of school().specializations; track item) {
              <span class="pill">{{ item }}</span>
            }
          </div>
        </ac-ui-card>
      }

      @if (school().admissionRequirements) {
        <ac-ui-card>
          <h2>Admission requirements</h2>
          <p class="prewrap">{{ school().admissionRequirements }}</p>
        </ac-ui-card>
      }

      @if (school().facilities.length) {
        <ac-ui-card>
          <h2>Facilities &amp; amenities</h2>
          <ul class="facilities">
            @for (facility of school().facilities; track facility) {
              <li>{{ facility }}</li>
            }
          </ul>
        </ac-ui-card>
      }
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .profile-view {
        display: flex;
        flex-direction: column;
        gap: 18px;
        max-width: 760px;
      }
      .cover {
        width: 100%;
        max-height: 220px;
        object-fit: cover;
        border-radius: 12px;
        border: 1px solid #d4e6ef;
      }
      .profile-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        background: #ffffff;
        border: 1px solid #d4e6ef;
        border-radius: 12px;
        box-shadow: 0 12px 30px rgb(41 74 90 / 0.08);
        padding: 22px 24px;
      }
      .head-main {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        min-width: 0;
      }
      .logo {
        width: 64px;
        height: 64px;
        object-fit: cover;
        border-radius: 12px;
        border: 1px solid #d4e6ef;
        flex: 0 0 auto;
      }
      .name-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      h1 {
        margin: 0;
        color: #3d6375;
        font-size: var(--ac-type-page-title);
      }
      h2 {
        margin: 0 0 12px;
        font-size: 1.1rem;
      }
      .tagline {
        margin: 6px 0 0;
        color: #263238;
        line-height: 1.5;
      }
      .head-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 10px;
      }
      .rating {
        color: #263238;
        font-weight: var(--ac-font-weight-bold);
      }
      .rating.muted {
        color: #66747a;
        font-weight: var(--ac-font-weight-semibold);
      }
      .verified {
        display: inline-block;
        border-radius: 999px;
        padding: 4px 12px;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
        background: #72a675;
        color: #ffffff;
      }
      .avail {
        display: inline-block;
        border-radius: 999px;
        padding: 4px 12px;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
      }
      .avail.open {
        background: #e2efe3;
        color: #236b43;
      }
      .avail.wait {
        background: #f6ecd4;
        color: #8a6414;
      }
      .avail.closed {
        background: #eef1f2;
        color: #66747a;
      }
      .edit-btn {
        flex: 0 0 auto;
        border: 0;
        border-radius: 8px;
        background: #3d6375;
        color: #ffffff;
        padding: 10px 18px;
        font-weight: var(--ac-font-weight-bold);
        cursor: pointer;
      }
      .edit-btn:focus-visible {
        outline: 3px solid #3d6375;
        outline-offset: 2px;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
      }
      .stat {
        background: #ffffff;
        border: 1px solid #d4e6ef;
        border-radius: 12px;
        padding: 16px 18px;
        display: grid;
        gap: 6px;
      }
      .stat-label {
        color: #66747a;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .stat-value {
        color: #3d6375;
        font-size: 1.2rem;
        font-weight: var(--ac-font-weight-bold);
      }
      .stat-sub {
        color: #66747a;
        font-size: 0.85rem;
        font-weight: var(--ac-font-weight-semibold);
      }
      dl {
        display: grid;
        gap: 14px;
        margin: 0;
      }
      dt {
        color: #66747a;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
      }
      dd {
        margin: 4px 0 0;
        color: #263238;
      }
      dd a {
        color: #3d6375;
        font-weight: var(--ac-font-weight-semibold);
      }
      .prewrap {
        margin: 0;
        white-space: pre-wrap;
        line-height: 1.5;
      }
      .pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .pill {
        border-radius: 999px;
        padding: 6px 14px;
        background: #e8f6ff;
        border: 1px solid #d4e6ef;
        color: #3d6375;
        font-weight: var(--ac-font-weight-bold);
        font-size: var(--ac-type-label);
      }
      .facilities {
        margin: 0;
        padding-left: 20px;
        display: grid;
        gap: 4px;
      }
      ac-ui-card {
        display: block;
      }
      @media (max-width: 560px) {
        .profile-head {
          flex-direction: column;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolProfileViewComponent {
  readonly school = input.required<SchoolDetailResponse>();
  readonly editable = input(false);
  readonly edit = output<void>();

  readonly availability = computed(() => availabilityLabel(this.school().availabilityStatus));
  readonly tone = computed(() => availabilityTone(this.school().availabilityStatus));
}
