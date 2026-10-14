import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { ChildResponse, RiskLevel, ScreeningSessionDetailResponse } from '@auticare/contracts';
import { ChildrenApi } from './data-access/children.api';
import { ScreeningApi } from '../screening/data-access/screening.api';
import { ScreeningBadgeComponent } from '../screening/components/screening-badge.component';
import { UiMessageComponent } from '../../design-system/components/ui-message.component';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiDialogComponent } from '../../design-system/components/ui-dialog.component';
import { UiFieldComponent } from '../../design-system/components/ui-field.component';
import { AccessibleFormDirective } from '../../design-system/directives/accessible-form.directive';
import { I18nService } from '../../core/i18n/i18n.service';

export type MilestoneFeedItem = {
  readonly id: string;
  readonly type: 'SCREENING' | 'SCHOOL' | 'ACTIVITY';
  readonly title: string;
  readonly date: string;
  readonly domain: string;
  readonly domainClass: string;
  readonly description: string;
  readonly linkPath: string;
  readonly linkLabel: string;
  readonly badge?: string;
};

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    UiMessageComponent,
    UiSpinnerComponent,
    UiDialogComponent,
    UiFieldComponent,
    AccessibleFormDirective,
    ScreeningBadgeComponent,
  ],
  template: `
    <a class="back-link" routerLink="/children">
      {{ currentLang() === 'km' ? '← ត្រឡប់ទៅបញ្ជីកុមារ' : '← Back to children' }}
    </a>

    @if (loading()) {
      <div class="state-center">
        <ac-ui-spinner
          [label]="
            currentLang() === 'km' ? 'កំពុងផ្ទុកប្រវត្តិរូបកុមារ…' : 'Loading child profile…'
          "
        />
      </div>
    } @else if (error()) {
      <ac-ui-message tone="error">{{ error() }}</ac-ui-message>
    } @else if (child(); as profile) {
      <section class="profile-hero">
        <div class="identity">
          <div class="avatar" [style.background]="getAvatarGradient(profile)" aria-hidden="true">
            {{ initials(profile) }}
          </div>
          <div class="identity-details">
            <p class="eyebrow">
              {{ currentLang() === 'km' ? 'ប្រវត្តិរូបគ្លីនិកកុមារ' : 'Clinical Child Profile' }}
            </p>
            <h1>{{ fullName(profile) }}</h1>
            <p class="hero-subtext">
              <strong>{{ ageLabel(profile.dateOfBirth) }}</strong>
              <span class="dot-sep">&bull;</span>
              <span
                >{{ currentLang() === 'km' ? 'កើតថ្ងៃទី ' : 'Born '
                }}{{ profile.dateOfBirth }}</span
              >
            </p>
            <div class="hero-notes-row">
              @if (profile.notes) {
                <span
                  class="hero-medical-badge recorded"
                  [title]="
                    currentLang() === 'km'
                      ? 'បានកត់ត្រាកំណត់ត្រាវេជ្ជសាស្ត្រ និងការគាំទ្រ'
                      : 'Support and medical notes recorded'
                  "
                >
                  <span class="badge-dot" aria-hidden="true"></span>
                  {{
                    currentLang() === 'km'
                      ? 'មានកំណត់ត្រាវេជ្ជសាស្ត្រ និងសតិអារម្មណ៍សកម្ម'
                      : 'Emergency & Sensory Notes Active'
                  }}
                </span>
              } @else {
                <span class="hero-medical-badge empty">
                  {{
                    currentLang() === 'km'
                      ? 'គ្មានកំណត់ត្រាវេជ្ជសាស្ត្របន្ទាន់'
                      : 'No Emergency Medical Notes'
                  }}
                </span>
              }
            </div>
          </div>
        </div>
        <div class="hero-actions">
          <button type="button" class="primary-button edit-btn" (click)="scrollToEdit()">
            {{ currentLang() === 'km' ? 'កែប្រែព័ត៌មាន' : 'Edit Details' }}
          </button>
          <button type="button" class="secondary-button" (click)="resetForm()">
            {{ currentLang() === 'km' ? 'បោះបង់ការផ្លាស់ប្តូរ' : 'Discard changes' }}
          </button>
          @if (!profile.archivedAt) {
            <button type="button" class="danger-button" (click)="showArchiveConfirm.set(true)">
              {{ currentLang() === 'km' ? 'ទុកក្នុងបណ្ណសារ' : 'Archive profile' }}
            </button>
          } @else {
            <button
              type="button"
              class="secondary-button"
              [disabled]="restoring()"
              (click)="restore()"
            >
              {{
                restoring()
                  ? currentLang() === 'km'
                    ? 'កំពុងស្តារឡើងវិញ…'
                    : 'Restoring…'
                  : currentLang() === 'km'
                    ? 'ស្តារប្រវត្តិរូបឡើងវិញ'
                    : 'Restore profile'
              }}
            </button>
          }
        </div>
      </section>

      <!-- Action Toolbar (Prominent sticky care coordinator) -->
      <nav
        class="child-action-toolbar"
        [attr.aria-label]="
          currentLang() === 'km' ? 'សកម្មភាពរហ័សសម្រាប់កុមារ' : 'Quick actions for child'
        "
      >
        <div class="toolbar-content">
          <div class="toolbar-text">
            <strong>
              {{
                currentLang() === 'km'
                  ? 'សកម្មភាពថែទាំសម្រាប់ ' + profile.firstName
                  : 'Care Actions for ' + profile.firstName
              }}
            </strong>
            <small>
              {{
                currentLang() === 'km'
                  ? 'សម្របសម្រួលការវាយតម្លៃគ្លីនិក និងការពិគ្រោះយោបល់វេជ្ជសាស្ត្រ'
                  : 'Coordinate clinical screenings and medical consultations'
              }}
            </small>
          </div>
          <div class="toolbar-buttons">
            <a
              class="toolbar-btn primary-action"
              routerLink="/screening"
              [queryParams]="{ childId: profile.id }"
            >
              <span class="btn-icon" aria-hidden="true">📋</span>
              <span>
                {{
                  currentLang() === 'km'
                    ? 'ចាប់ផ្តើមការវាយតម្លៃសម្រាប់ ' + profile.firstName
                    : 'Start Screening for ' + profile.firstName
                }}
              </span>
            </a>
            <a class="toolbar-btn secondary-action" routerLink="/hospitals">
              <span class="btn-icon" aria-hidden="true">🏥</span>
              <span>{{ currentLang() === 'km' ? 'កក់គ្រូពេទ្យឯកទេស' : 'Book Specialist' }}</span>
            </a>
          </div>
        </div>
      </nav>

      <!-- Quick Metrics Hub Banner -->
      <section
        class="summary-grid"
        [attr.aria-label]="
          currentLang() === 'km' ? 'សង្ខេបប្រវត្តិរូបកុមារ' : 'Child profile summary'
        "
      >
        <article class="metric-card">
          <span class="metric-label">
            {{ currentLang() === 'km' ? 'ស្ថានភាពប្រវត្តិរូប' : 'Profile Status' }}
          </span>
          <strong class="metric-value" [class.archived-val]="profile.archivedAt">
            {{
              profile.archivedAt
                ? currentLang() === 'km'
                  ? 'ទុកក្នុងបណ្ណសារ'
                  : 'Archived'
                : currentLang() === 'km'
                  ? 'សកម្ម'
                  : 'Active'
            }}
          </strong>
        </article>
        <article class="metric-card">
          <span class="metric-label">
            {{ currentLang() === 'km' ? 'អាយុតាមកាលកំណត់' : 'Chronological Age' }}
          </span>
          <strong class="metric-value">{{ ageLabel(profile.dateOfBirth) }}</strong>
        </article>
        <article class="metric-card">
          <span class="metric-label">
            {{ currentLang() === 'km' ? 'ការវាយតម្លៃស្គ្រីនីង' : 'Screening Assessment' }}
          </span>
          @if (loadingScreening()) {
            <span class="metric-loading">
              {{ currentLang() === 'km' ? 'កំពុងផ្ទុក…' : 'Loading…' }}
            </span>
          } @else {
            <div class="badge-wrapper">
              <ac-screening-badge [tone]="riskTone(latestRiskLevel())">
                {{ riskLabel(latestRiskLevel()) }}
              </ac-screening-badge>
            </div>
          }
        </article>
        <article class="metric-card">
          <span class="metric-label">
            {{ currentLang() === 'km' ? 'កំណត់ត្រាគាំទ្រ និងការថែទាំ' : 'Support & Care Notes' }}
          </span>
          <strong class="metric-value">
            {{
              profile.notes
                ? currentLang() === 'km'
                  ? 'បានកត់ត្រា'
                  : 'Recorded'
                : currentLang() === 'km'
                  ? 'មិនទាន់បញ្ចូល'
                  : 'Not added'
            }}
          </strong>
        </article>
      </section>

      <!-- Dynamic Support Snapshot Section -->
      <section
        class="support-snapshot-section"
        [attr.aria-label]="currentLang() === 'km' ? 'ទិដ្ឋភាពទូទៅនៃការគាំទ្រ' : 'Support Snapshot'"
      >
        <div class="snapshot-header">
          <h2>{{ currentLang() === 'km' ? 'ទិដ្ឋភាពទូទៅនៃការគាំទ្រ' : 'Support Snapshot' }}</h2>
          <p>
            {{
              currentLang() === 'km'
                ? 'ការតភ្ជាប់ស្ថាប័ន និងគ្លីនិកសំខាន់ៗសម្រាប់ ' + profile.firstName
                : 'Key institutional and clinical connections for ' + profile.firstName
            }}
          </p>
        </div>
        <div class="support-snapshot-grid">
          <!-- Card 1: Active School Enrollment -->
          <article class="snapshot-card school-card">
            <div class="snapshot-card-header">
              <span class="snapshot-icon school-icon" aria-hidden="true">🏫</span>
              <span class="snapshot-card-eyebrow">
                {{ currentLang() === 'km' ? 'កិច្ចសហការសាលារៀន' : 'School Collaboration' }}
              </span>
            </div>
            <strong class="snapshot-card-title">
              {{ currentLang() === 'km' ? 'ដៃគូអប់រំបរិយាបន្ន' : 'Inclusive Education Partner' }}
            </strong>
            <p class="snapshot-card-detail">
              {{
                currentLang() === 'km'
                  ? 'បានភ្ជាប់សម្រាប់ការសង្កេតការវិវត្ត និងរបាយការណ៍ក្នុងថ្នាក់រៀន'
                  : 'Connected for developmental progress observations & classroom reports'
              }}
            </p>
            <a class="snapshot-card-link" routerLink="/schools">
              {{ currentLang() === 'km' ? 'ស្វែងរកសាលារៀន →' : 'Explore Schools →' }}
            </a>
          </article>

          <!-- Card 2: Primary Pediatrician / Care Specialist -->
          <article class="snapshot-card clinic-card">
            <div class="snapshot-card-header">
              <span class="snapshot-icon clinic-icon" aria-hidden="true">🩺</span>
              <span class="snapshot-card-eyebrow">
                {{ currentLang() === 'km' ? 'ក្រុមថែទាំគ្លីនិក' : 'Clinical Care Team' }}
              </span>
            </div>
            <strong class="snapshot-card-title">
              {{
                currentLang() === 'km'
                  ? 'អ្នកឯកទេសរោគកុមារផ្នែកការលូតលាស់'
                  : 'Developmental Pediatrics Specialist'
              }}
            </strong>
            <p class="snapshot-card-detail">
              {{
                currentLang() === 'km'
                  ? 'ការពិគ្រោះយោបល់ជាមួយគ្រូពេទ្យកុមារ និងការវាយតម្លៃរោគវិនិច្ឆ័យញាណដឹង'
                  : 'Pediatrician consultation & sensory diagnostic reviews'
              }}
            </p>
            <a class="snapshot-card-link" routerLink="/hospitals">
              {{ currentLang() === 'km' ? 'កក់គ្រូពេទ្យឯកទេស →' : 'Book Specialist →' }}
            </a>
          </article>

          <!-- Card 3: Latest Assessment Result -->
          <article class="snapshot-card screening-card">
            <div class="snapshot-card-header">
              <span class="snapshot-icon screening-icon" aria-hidden="true">📊</span>
              <span class="snapshot-card-eyebrow">
                {{ currentLang() === 'km' ? 'ការវាយតម្លៃចុងក្រោយ' : 'Latest Assessment' }}
              </span>
            </div>
            <strong class="snapshot-card-title">{{ riskLabel(latestRiskLevel()) }}</strong>
            <p class="snapshot-card-detail">
              {{
                latestRiskLevel()
                  ? currentLang() === 'km'
                    ? 'កម្រងសំណួរគ្លីនិកបានបញ្ចប់ ជាមួយការណែនាំគោលដៅដែលបានកត់ត្រា'
                    : 'Clinical questionnaire completed with targeted guidance recorded'
                  : currentLang() === 'km'
                    ? 'មិនទាន់មានការវាយតម្លៃគ្លីនិកសម្រាប់ ' + profile.firstName + ' នៅឡើយទេ'
                    : 'No clinical assessment completed yet for ' + profile.firstName
              }}
            </p>
            <a
              class="snapshot-card-link"
              routerLink="/screening"
              [queryParams]="{ childId: profile.id }"
            >
              {{
                latestRiskLevel()
                  ? currentLang() === 'km'
                    ? 'ពិនិត្យលទ្ធផល →'
                    : 'Review Results →'
                  : currentLang() === 'km'
                    ? 'ចាប់ផ្តើមវាយតម្លៃ →'
                    : 'Start Assessment →'
              }}
            </a>
          </article>
        </div>
      </section>

      <!-- 2-Column Clinical Hub Grid -->
      <div class="clinical-hub-grid">
        <!-- Left Column: Personal, Residential & Support Details Form -->
        <section class="hub-col-personal" aria-labelledby="personal-details-heading">
          <form
            class="profile-form"
            [formGroup]="form"
            (ngSubmit)="save()"
            acAccessibleForm
            novalidate
          >
            <header class="form-header">
              <h2 id="personal-details-heading">
                {{
                  currentLang() === 'km'
                    ? 'ព័ត៌មានផ្ទាល់ខ្លួន និងកំណត់ត្រាថែទាំ'
                    : 'Personal Details & Care Notes'
                }}
              </h2>
              <p>
                {{
                  currentLang() === 'km'
                    ? 'ធ្វើបច្ចុប្បន្នភាពកំណត់ត្រាស្នូលសម្រាប់ការវាយតម្លៃ ការកក់មន្ទីរពេទ្យ និងកិច្ចសហការសាលារៀន។'
                    : 'Keep core records up to date for clinical screening, hospital bookings, and school collaboration.'
                }}
              </p>
            </header>

            <ac-ui-field
              [label]="currentLang() === 'km' ? 'នាមខ្លួន' : 'First Name'"
              [required]="true"
              [error]="
                form.controls.firstName.touched && form.controls.firstName.invalid
                  ? currentLang() === 'km'
                    ? 'សូមបញ្ចូលនាមខ្លួន។'
                    : 'Enter a first name.'
                  : null
              "
            >
              <input type="text" formControlName="firstName" autocomplete="off" maxlength="80" />
            </ac-ui-field>

            <ac-ui-field
              [label]="currentLang() === 'km' ? 'គោត្តនាម' : 'Last Name'"
              [optional]="true"
            >
              <input
                type="text"
                formControlName="lastName"
                autocomplete="off"
                maxlength="80"
                [placeholder]="
                  currentLang() === 'km'
                    ? 'គោត្តនាម ឬនាមត្រកូល (ជាជម្រើស)'
                    : 'Optional family or surname'
                "
              />
            </ac-ui-field>

            <ac-ui-field
              [label]="currentLang() === 'km' ? 'ថ្ងៃខែឆ្នាំកំណើត' : 'Date of Birth'"
              [required]="true"
              [error]="
                form.controls.dateOfBirth.touched && form.controls.dateOfBirth.invalid
                  ? currentLang() === 'km'
                    ? 'សូមជ្រើសរើសថ្ងៃខែឆ្នាំកំណើតត្រឹមត្រូវ។'
                    : 'Use a valid date of birth.'
                  : null
              "
            >
              <input type="date" formControlName="dateOfBirth" [max]="today" />
            </ac-ui-field>

            <ac-ui-field
              [label]="currentLang() === 'km' ? 'អាសយដ្ឋានបច្ចុប្បន្ន' : 'Residential address'"
              [optional]="true"
            >
              <input
                type="text"
                formControlName="address"
                autocomplete="off"
                maxlength="500"
                [placeholder]="
                  currentLang() === 'km'
                    ? 'អាសយដ្ឋានសម្រាប់ស្វែងរកសេវាគាំទ្រ'
                    : 'Optional home address for service discovery'
                "
              />
            </ac-ui-field>

            <ac-ui-field
              [label]="
                currentLang() === 'km'
                  ? 'កំណត់ត្រាវេជ្ជសាស្ត្រ និងការគាំទ្រ'
                  : 'Medical Notes & Support'
              "
              [optional]="true"
            >
              <textarea
                rows="7"
                formControlName="notes"
                maxlength="2000"
                [placeholder]="
                  currentLang() === 'km'
                    ? 'ភាពងាយរងរំញោចញាណដឹង វិធីសាស្ត្រទំនាក់ទំនង ទម្លាប់សម្រួលអារម្មណ៍ ឬកំណត់ត្រាវេជ្ជសាស្ត្រ។'
                    : 'Sensory sensitivities, preferred communication methods, calming routines, or clinical background notes.'
                "
              ></textarea>
            </ac-ui-field>

            @if (saveMessage()) {
              <ac-ui-message tone="success">{{ saveMessage() }}</ac-ui-message>
            }
            @if (saveError()) {
              <ac-ui-message tone="error">{{ saveError() }}</ac-ui-message>
            }

            <div class="form-submit-row">
              <button class="primary-button" type="submit" [disabled]="saving()">
                {{
                  saving()
                    ? currentLang() === 'km'
                      ? 'កំពុងរក្សាទុក...'
                      : 'Saving...'
                    : currentLang() === 'km'
                      ? 'រក្សាទុកទិន្នន័យកុមារ'
                      : 'Save Child'
                }}
              </button>
            </div>
          </form>
        </section>

        <!-- Right Column: Clinical Care & Developmental Snapshot Hub -->
        <aside
          class="hub-col-clinical"
          [attr.aria-label]="
            currentLang() === 'km'
              ? 'ទិដ្ឋភាពទូទៅនៃការថែទាំគ្លីនិក និងការអភិវឌ្ឍ'
              : 'Clinical Care and Development Hub'
          "
        >
          <div class="clinical-hub-header">
            <h2>
              {{
                currentLang() === 'km'
                  ? 'ទិដ្ឋភាពទូទៅនៃការថែទាំគ្លីនិក និងការអភិវឌ្ឍ'
                  : 'Clinical Care & Development Snapshot'
              }}
            </h2>
            <p>
              {{
                currentLang() === 'km'
                  ? 'ពិនិត្យទិន្នន័យការលូតលាស់ គំនូសតាងវឌ្ឍនភាព និងលំហាត់គាំទ្រនៅផ្ទះ។'
                  : 'Access developmental telemetry, progress charts, and home support exercises.'
              }}
            </p>
          </div>

          <div class="hub-cards-stack">
            <!-- Screening Card -->
            <article class="clinical-card screening-card-hub">
              <div class="card-icon-header">
                <span class="card-emoji-icon" aria-hidden="true">📋</span>
                <div class="card-text-header">
                  <h3>
                    {{
                      currentLang() === 'km'
                        ? 'ការវាយតម្លៃស្គ្រីនីងអូទីសឹម'
                        : 'Autism Screening Assessment'
                    }}
                  </h3>
                  <p>
                    {{
                      currentLang() === 'km'
                        ? 'កម្រងសំណួរស្គ្រីនីងអាកប្បកិរិយា និងញាណដឹងស្តង់ដារ'
                        : 'Standardized behavioral & sensory screening questionnaire'
                    }}
                  </p>
                </div>
              </div>
              <div class="card-badge-line">
                <span class="badge-label-prefix">
                  {{ currentLang() === 'km' ? 'ស្ថានភាពបច្ចុប្បន្ន៖' : 'Current Status:' }}
                </span>
                @if (loadingScreening()) {
                  <span>
                    {{ currentLang() === 'km' ? 'កំពុងពិនិត្យកំណត់ត្រា…' : 'Checking records…' }}
                  </span>
                } @else {
                  <ac-screening-badge [tone]="riskTone(latestRiskLevel())">
                    {{ riskLabel(latestRiskLevel()) }}
                  </ac-screening-badge>
                }
              </div>
              <a
                class="clinical-action-btn primary-action"
                routerLink="/screening"
                [queryParams]="{ childId: profile.id }"
              >
                <span>
                  {{ currentLang() === 'km' ? 'ចាប់ផ្តើមការវាយតម្លៃ' : 'Start Screening' }}
                </span>
              </a>
            </article>

            <!-- Trajectory Card -->
            <article class="clinical-card trajectory-card-hub">
              <div class="card-icon-header">
                <span class="card-emoji-icon" aria-hidden="true">📈</span>
                <div class="card-text-header">
                  <h3>
                    {{ currentLang() === 'km' ? 'គន្លងនៃការអភិវឌ្ឍ' : 'Developmental Trajectory' }}
                  </h3>
                  <p>
                    {{
                      currentLang() === 'km'
                        ? 'ដំណាក់កាលវឌ្ឍនភាព និងរបាយការណ៍សង្កេតរយៈពេលវែង'
                        : 'Longitudinal progress milestones & observation reports'
                    }}
                  </p>
                </div>
              </div>
              <p class="card-desc">
                {{
                  currentLang() === 'km'
                    ? 'តាមដានការផ្លាស់ប្តូរលើការប្រាស្រ័យទាក់ទង សង្គម និងញាណដឹងតាមពេលវេលា។'
                    : 'Track changes across communication, social, and sensory domains over time.'
                }}
              </p>
              <a
                class="clinical-action-btn"
                routerLink="/progress"
                [queryParams]="{ childId: profile.id }"
              >
                <span>{{ currentLang() === 'km' ? 'មើលការវិវត្ត' : 'View Progress' }}</span>
              </a>
            </article>

            <!-- Activities Card -->
            <article class="clinical-card activities-card-hub">
              <div class="card-icon-header">
                <span class="card-emoji-icon" aria-hidden="true">🎯</span>
                <div class="card-text-header">
                  <h3>
                    {{
                      currentLang() === 'km'
                        ? 'សកម្មភាពណែនាំសម្រាប់អនុវត្តនៅផ្ទះ'
                        : 'Recommended Home Activities'
                    }}
                  </h3>
                  <p>
                    {{
                      currentLang() === 'km'
                        ? 'លំហាត់អភិវឌ្ឍន៍ និងទម្លាប់លេងដែលស្របតាមញាណដឹង'
                        : 'Sensory-friendly developmental exercises and play routines'
                    }}
                  </p>
                </div>
              </div>
              <p class="card-desc">
                {{
                  currentLang() === 'km'
                    ? 'សកម្មភាពនៅផ្ទះផ្ទាល់ខ្លួនដែលត្រូវតាមកម្រិតអាយុ និងលទ្ធផលវាយតម្លៃរបស់កូនអ្នក។'
                    : "Personalized home activities tailored to your child's age band and screening results."
                }}
              </p>
              <a
                class="clinical-action-btn"
                routerLink="/activities"
                [queryParams]="{ childId: profile.id }"
              >
                <span>{{ currentLang() === 'km' ? 'ស្វែងរកសកម្មភាព' : 'Browse Activities' }}</span>
              </a>
            </article>

            <!-- Clinical Care Disclaimer -->
            <div class="care-guidance-card">
              <span class="guidance-icon" aria-hidden="true">💡</span>
              <div>
                <h4>
                  {{
                    currentLang() === 'km'
                      ? 'កំណត់សម្គាល់កិច្ចសហការគ្លីនិក'
                      : 'Clinical Collaboration Note'
                  }}
                </h4>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'លទ្ធផលវាយតម្លៃ និងគន្លងសង្កេតត្រូវបានបង្កើតឡើងដើម្បីចែករំលែកដោយផ្ទាល់ជាមួយគ្រូពេទ្យកុមារ អ្នកព្យាបាលការនិយាយ ឬអ្នកព្យាបាលចលនា។'
                      : 'Screening results and observation trajectories are designed to be shared directly with your pediatrician, speech therapist, or occupational therapist.'
                  }}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- Developmental Milestones Timeline Section -->
      <section
        class="milestones-timeline-section"
        [attr.aria-label]="
          currentLang() === 'km'
            ? 'បន្ទាត់ពេលវេលានៃដំណាក់កាលអភិវឌ្ឍន៍'
            : 'Developmental Milestones Timeline'
        "
      >
        <div class="timeline-header">
          <div>
            <h2>
              {{
                currentLang() === 'km'
                  ? 'បន្ទាត់ពេលវេលានៃដំណាក់កាលអភិវឌ្ឍន៍'
                  : 'Developmental Milestones Timeline'
              }}
            </h2>
            <p>
              {{
                currentLang() === 'km'
                  ? 'លំហូរកាលប្បវត្តិនៃការវាយតម្លៃគ្លីនិក របាយការណ៍សាលារៀន និងសកម្មភាពនៅផ្ទះ'
                  : 'Chronological feed of clinical screenings, school reports, and home activity milestones'
              }}
            </p>
          </div>
          <a
            class="timeline-progress-link"
            routerLink="/progress"
            [queryParams]="{ childId: profile.id }"
          >
            {{ currentLang() === 'km' ? 'គន្លងវឌ្ឍនភាពពេញលេញ →' : 'Full Progress Trajectory →' }}
          </a>
        </div>

        <div class="milestones-feed-list">
          @for (item of milestonesTimeline(); track item.id) {
            <article class="milestone-item" [class]="'type-' + item.type.toLowerCase()">
              <div class="milestone-indicator" aria-hidden="true">
                <span class="milestone-icon-bubble">
                  @if (item.type === 'SCREENING') {
                    📋
                  } @else if (item.type === 'SCHOOL') {
                    🏫
                  } @else {
                    🎯
                  }
                </span>
                <span class="milestone-line"></span>
              </div>
              <div class="milestone-card">
                <div class="milestone-card-top">
                  <div class="milestone-meta">
                    <span class="milestone-domain-pill" [class]="item.domainClass">
                      {{ item.domain }}
                    </span>
                    <span class="milestone-date">{{ item.date }}</span>
                  </div>
                  @if (item.badge) {
                    <span class="milestone-risk-badge">{{ item.badge }}</span>
                  }
                </div>
                <h3 class="milestone-title">{{ item.title }}</h3>
                <p class="milestone-desc">{{ item.description }}</p>
                <div class="milestone-footer">
                  <a [routerLink]="item.linkPath" class="milestone-cta-link">
                    {{ item.linkLabel }} &rarr;
                  </a>
                </div>
              </div>
            </article>
          }
        </div>
      </section>

      @if (showArchiveConfirm()) {
        <ac-ui-dialog
          [heading]="
            currentLang() === 'km' ? 'ទុកប្រវត្តិរូបកុមារក្នុងបណ្ណសារ?' : 'Archive child profile?'
          "
          [description]="
            currentLang() === 'km'
              ? 'តើអ្នកប្រាកដជាចង់ទុកប្រវត្តិរូបកុមារនេះក្នុងបណ្ណសារមែនទេ? អ្នកអាចស្តារវាឡើងវិញនៅពេលក្រោយបាន។'
              : 'Are you sure you want to archive this child profile? You can restore it later if needed.'
          "
          dialogRole="alertdialog"
          size="sm"
          (close)="showArchiveConfirm.set(false)"
        >
          <div dialogFooter class="modal-actions">
            <button type="button" class="secondary-button" (click)="showArchiveConfirm.set(false)">
              {{ currentLang() === 'km' ? 'រក្សាទុកសកម្ម' : 'Keep active' }}
            </button>
            <button
              type="button"
              class="danger-button"
              [disabled]="archiving()"
              (click)="confirmArchive()"
            >
              {{
                archiving()
                  ? currentLang() === 'km'
                    ? 'កំពុងទុកក្នុងបណ្ណសារ…'
                    : 'Archiving…'
                  : currentLang() === 'km'
                    ? 'ទុកក្នុងបណ្ណសារ'
                    : 'Archive profile'
              }}
            </button>
          </div>
        </ac-ui-dialog>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .back-link {
        color: var(--ac-color-action-deep);
        display: inline-flex;
        margin-bottom: 24px;
        text-decoration: none;
        font-weight: 700;
        font-size: 14px;
        transition: transform var(--ac-motion-fast);
      }

      .back-link:hover {
        text-decoration: underline;
        transform: translateX(-2px);
      }

      .state-center {
        display: flex;
        justify-content: center;
        padding: 64px 0;
      }

      .profile-hero {
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        box-shadow: var(--ac-shadow-sm);
        padding: 24px 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 22px;
        flex-wrap: wrap;
      }

      .identity {
        display: flex;
        align-items: center;
        gap: 20px;
        min-width: 0;
      }

      .avatar {
        width: 72px;
        height: 72px;
        border-radius: var(--ac-radius-lg);
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
        font-size: 26px;
        font-weight: 700;
        flex: 0 0 auto;
        box-shadow: var(--ac-shadow-xs);
      }

      .identity-details {
        min-width: 0;
      }

      .eyebrow {
        margin: 0 0 4px;
        color: var(--ac-color-action-mid);
        font-size: var(--ac-type-meta);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      h1 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: var(--ac-type-page-title);
        line-height: var(--ac-line-tight);
        font-weight: 700;
      }

      .hero-subtext {
        margin: 6px 0 0;
        color: var(--ac-color-text-body);
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .hero-subtext strong {
        color: var(--ac-color-text-strong);
      }

      .dot-sep {
        font-size: 10px;
        color: var(--ac-color-border-grey);
      }

      .hero-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      button {
        min-height: 44px;
        border-radius: var(--ac-radius-md);
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
        padding: 0 18px;
        transition: all var(--ac-motion-fast);
      }

      .secondary-button {
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
      }

      .secondary-button:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      .danger-button {
        border: 1px solid var(--ac-color-red-600);
        background: var(--ac-color-surface);
        color: var(--ac-color-alert-strong);
      }

      .danger-button:hover {
        background: var(--ac-color-alert-surface);
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .metric-card {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-xs);
        padding: 16px 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .metric-label {
        color: var(--ac-color-text-muted);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .metric-value {
        color: var(--ac-color-text-strong);
        font-size: 16px;
        font-weight: 700;
      }

      .metric-value.archived-val {
        color: var(--ac-color-text-slate);
      }

      .metric-loading {
        font-size: 13px;
        color: var(--ac-color-text-muted);
      }

      .badge-wrapper {
        display: flex;
        align-items: center;
      }

      .clinical-hub-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(320px, 1fr);
        gap: 24px;
        align-items: start;
      }

      .profile-form {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-sm);
        padding: 26px 28px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .form-header h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 20px;
        font-weight: 700;
      }

      .form-header p {
        margin: 6px 0 0;
        color: var(--ac-color-text-body);
        font-size: 13px;
        line-height: var(--ac-line-body);
      }

      .form-submit-row {
        margin-top: 10px;
      }

      .primary-button {
        width: 100%;
        border: 0;
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        min-height: 46px;
        font-size: 14px;
        font-weight: 700;
        box-shadow: var(--ac-shadow-sm);
        transition: all var(--ac-motion-fast);
      }

      .primary-button:hover:not(:disabled) {
        background: var(--ac-color-action-deep);
        box-shadow: var(--ac-shadow-hover);
        transform: translateY(-1px);
      }

      .primary-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .hub-col-clinical {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .clinical-hub-header h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 20px;
        font-weight: 700;
      }

      .clinical-hub-header p {
        margin: 4px 0 0;
        color: var(--ac-color-text-body);
        font-size: 13px;
      }

      .hub-cards-stack {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .clinical-card {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-xs);
        padding: 20px 22px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        transition:
          box-shadow var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .clinical-card:hover {
        box-shadow: var(--ac-shadow-sm);
        border-color: var(--ac-color-border-info);
      }

      .card-icon-header {
        display: flex;
        align-items: flex-start;
        gap: 14px;
      }

      .card-emoji-icon {
        font-size: 24px;
        line-height: 1;
        flex: 0 0 auto;
      }

      .card-text-header h3 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 16px;
        font-weight: 700;
      }

      .card-text-header p {
        margin: 3px 0 0;
        color: var(--ac-color-text-muted);
        font-size: 12px;
      }

      .card-badge-line {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--ac-color-text-body);
      }

      .badge-label-prefix {
        font-weight: 600;
      }

      .card-desc {
        margin: 0;
        font-size: 13px;
        line-height: 1.45;
        color: var(--ac-color-text-body);
      }

      .clinical-action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 40px;
        padding: 0 16px;
        border-radius: var(--ac-radius-md);
        border: 1px solid var(--ac-color-border);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
        font-weight: 700;
        font-size: 13px;
        text-decoration: none;
        transition: all var(--ac-motion-fast);
      }

      .clinical-action-btn:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      .clinical-action-btn.primary-action {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border-color: var(--ac-color-action);
      }

      .clinical-action-btn.primary-action:hover {
        background: var(--ac-color-action-deep);
      }

      .care-guidance-card {
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        padding: 16px 18px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .guidance-icon {
        font-size: 18px;
        line-height: 1;
        flex: 0 0 auto;
      }

      .care-guidance-card h4 {
        margin: 0;
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
      }

      .care-guidance-card p {
        margin: 4px 0 0;
        font-size: 12px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .hero-notes-row {
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .hero-medical-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        padding: 3px 10px;
        border-radius: var(--ac-radius-pill);
      }

      .hero-medical-badge.recorded {
        background: var(--ac-color-tint-blue-mist);
        color: var(--ac-color-action-deep);
        border: 1px solid var(--ac-color-tint-blue-wash);
      }

      .hero-medical-badge.empty {
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-muted);
        border: 1px solid var(--ac-color-border);
      }

      .badge-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--ac-color-action);
      }

      /* Prominent Action Toolbar */
      .child-action-toolbar {
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-info);
        box-shadow: var(--ac-shadow-sm);
        padding: 16px 24px;
        margin-bottom: 22px;
      }

      .toolbar-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      .toolbar-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .toolbar-text strong {
        color: var(--ac-color-text-strong);
        font-size: 15px;
      }

      .toolbar-text small {
        color: var(--ac-color-text-muted);
        font-size: 12px;
      }

      .toolbar-buttons {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .toolbar-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 18px;
        border-radius: var(--ac-radius-md);
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        transition: all var(--ac-motion-fast);
      }

      .toolbar-btn.primary-action {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border: 1px solid var(--ac-color-action);
        box-shadow: var(--ac-shadow-sm);
      }

      .toolbar-btn.primary-action:hover {
        background: var(--ac-color-action-deep);
        box-shadow: var(--ac-shadow-hover);
        transform: translateY(-1px);
      }

      .toolbar-btn.secondary-action {
        background: var(--ac-color-surface);
        color: var(--ac-color-action-deep);
        border: 1px solid var(--ac-color-border);
      }

      .toolbar-btn.secondary-action:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      /* Support Snapshot Section */
      .support-snapshot-section {
        margin-bottom: 28px;
      }

      .snapshot-header {
        margin-bottom: 16px;
      }

      .snapshot-header h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 18px;
        font-weight: 700;
      }

      .snapshot-header p {
        margin: 4px 0 0;
        color: var(--ac-color-text-body);
        font-size: 13px;
      }

      .support-snapshot-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .snapshot-card {
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        box-shadow: var(--ac-shadow-xs);
        padding: 20px 22px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        transition:
          box-shadow var(--ac-motion-fast),
          border-color var(--ac-motion-fast);
      }

      .snapshot-card:hover {
        box-shadow: var(--ac-shadow-sm);
        border-color: var(--ac-color-border-info);
      }

      .snapshot-card-header {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .snapshot-icon {
        width: 32px;
        height: 32px;
        border-radius: var(--ac-radius-md);
        display: grid;
        place-items: center;
        font-size: 16px;
        background: var(--ac-color-surface-info);
      }

      .snapshot-card-eyebrow {
        color: var(--ac-color-action-mid);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .snapshot-card-title {
        color: var(--ac-color-text-strong);
        font-size: 15px;
        font-weight: 700;
      }

      .snapshot-card-detail {
        margin: 0;
        color: var(--ac-color-text-body);
        font-size: 12px;
        line-height: 1.45;
        flex: 1 1 auto;
      }

      .snapshot-card-link {
        color: var(--ac-color-action-deep);
        font-size: 12px;
        font-weight: 700;
        text-decoration: none;
        align-self: flex-start;
        transition: transform var(--ac-motion-fast);
      }

      .snapshot-card-link:hover {
        text-decoration: underline;
        transform: translateX(2px);
      }

      /* Milestones Timeline Section */
      .milestones-timeline-section {
        margin-top: 32px;
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        box-shadow: var(--ac-shadow-xs);
        padding: 26px 28px;
      }

      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }

      .timeline-header h2 {
        margin: 0;
        color: var(--ac-color-text-strong);
        font-size: 18px;
        font-weight: 700;
      }

      .timeline-header p {
        margin: 4px 0 0;
        color: var(--ac-color-text-body);
        font-size: 13px;
      }

      .timeline-progress-link {
        color: var(--ac-color-action-deep);
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
        white-space: nowrap;
      }

      .timeline-progress-link:hover {
        text-decoration: underline;
      }

      .milestones-feed-list {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .milestone-item {
        display: flex;
        gap: 18px;
        position: relative;
      }

      .milestone-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 0 0 auto;
      }

      .milestone-icon-bubble {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--ac-color-surface-info);
        border: 2px solid var(--ac-color-border-info);
        display: grid;
        place-items: center;
        font-size: 16px;
        z-index: 1;
      }

      .milestone-line {
        width: 2px;
        flex: 1 1 auto;
        background: var(--ac-color-border);
        min-height: 24px;
      }

      .milestone-item:last-child .milestone-line {
        display: none;
      }

      .milestone-card {
        flex: 1 1 auto;
        padding-bottom: 24px;
      }

      .milestone-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 6px;
        flex-wrap: wrap;
      }

      .milestone-meta {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .milestone-domain-pill {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .milestone-domain-pill.screening-domain {
        background: var(--ac-color-tint-blue-mist);
        color: var(--ac-color-action-deep);
      }

      .milestone-domain-pill.school-domain {
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
      }

      .milestone-domain-pill.activity-domain {
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
      }

      .milestone-date {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      .milestone-risk-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
        border: 1px solid var(--ac-color-border-info);
      }

      .milestone-title {
        margin: 0 0 4px;
        color: var(--ac-color-text-strong);
        font-size: 15px;
        font-weight: 700;
      }

      .milestone-desc {
        margin: 0 0 8px;
        color: var(--ac-color-text-body);
        font-size: 13px;
        line-height: 1.45;
      }

      .milestone-footer {
        display: flex;
        align-items: center;
      }

      .milestone-cta-link {
        font-size: 12px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        text-decoration: none;
      }

      .milestone-cta-link:hover {
        text-decoration: underline;
      }

      @media (max-width: 900px) {
        .clinical-hub-grid {
          grid-template-columns: 1fr;
        }

        .summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .support-snapshot-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 560px) {
        .profile-hero {
          flex-direction: column;
          align-items: stretch;
        }

        .identity {
          flex-direction: column;
          text-align: center;
        }

        .hero-subtext {
          justify-content: center;
        }

        .hero-actions {
          flex-direction: column;
        }

        .hero-actions button {
          width: 100%;
        }

        .summary-grid {
          grid-template-columns: 1fr;
        }

        .toolbar-content {
          flex-direction: column;
          align-items: stretch;
        }

        .toolbar-buttons {
          flex-direction: column;
        }

        .toolbar-btn {
          justify-content: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildProfilePage implements OnInit {
  private readonly api = inject(ChildrenApi);
  private readonly screeningApi = inject(ScreeningApi);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);
  protected readonly currentLang = this.i18n.currentLang;

  readonly child = signal<ChildResponse | null>(null);
  readonly latestRiskLevel = signal<RiskLevel | null>(null);
  readonly sessions = signal<ScreeningSessionDetailResponse[]>([]);
  readonly loadingScreening = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saveMessage = signal<string | null>(null);
  readonly showArchiveConfirm = signal(false);
  readonly archiving = signal(false);
  readonly restoring = signal(false);
  readonly today = new Date().toISOString().slice(0, 10);
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', Validators.maxLength(80)],
    dateOfBirth: ['', Validators.required],
    address: ['', Validators.maxLength(500)],
    notes: ['', Validators.maxLength(2000)],
  });

  readonly milestonesTimeline = computed<readonly MilestoneFeedItem[]>(() => {
    const isKm = this.currentLang() === 'km';
    const list: MilestoneFeedItem[] = [];
    const child = this.child();
    const sessions = this.sessions();

    for (const session of sessions) {
      if (session.result) {
        list.push({
          id: `session-${session.id}`,
          type: 'SCREENING',
          title: isKm
            ? `ការវាយតម្លៃស្គ្រីនីងអូទីសឹម (${session.ageBand || 'កុមារ'})`
            : `Autism Screening Assessment (${session.ageBand || 'Pediatric'})`,
          date: this.formatDate(session.submittedAt || session.startedAt),
          domain: isKm ? 'ការវាយតម្លៃគ្លីនិក' : 'Clinical Screening',
          domainClass: 'domain-screening',
          description:
            session.result.recommendation ||
            (isKm
              ? 'ការវាយតម្លៃបានបញ្ចប់ ជាមួយការណែនាំគ្លីនិកដែលបានកត់ត្រា។'
              : 'Assessment completed with clinical guidance recorded.'),
          linkPath: `/screening/result/${session.id}`,
          linkLabel: isKm ? 'មើលលទ្ធផលវាយតម្លៃ' : 'View Screening Result',
          badge: `${this.riskLabel(session.result.riskLevel)} (${session.result.riskPercentage ?? 0}%)`,
        });
      }
    }

    if (child) {
      list.push({
        id: `school-${child.id}`,
        type: 'SCHOOL',
        title: isKm
          ? 'របាយការណ៍សង្កេតការវិវត្តក្នុងថ្នាក់រៀន'
          : 'Classroom Developmental Observation Report',
        date: isKm ? 'ឆមាសថ្មីៗ' : 'Recent Term',
        domain: isKm ? 'កិច្ចសហការសាលារៀន' : 'School Collaboration',
        domainClass: 'domain-school',
        description: isKm
          ? 'ការសង្កេតរបស់គ្រូបង្រៀនលើអន្តរកម្មជាមួយមិត្តភក្តិ ការសម្របសម្រួលសតិអារម្មណ៍ និងទម្លាប់ប្រចាំថ្ងៃ។'
          : 'Educator observation on peer interaction, sensory accommodations, and daily routines.',
        linkPath: '/progress',
        linkLabel: isKm ? 'មើលការវិវត្តនៃការសង្កេត' : 'View Observation Progress',
      });

      list.push({
        id: `activity-${child.id}`,
        type: 'ACTIVITY',
        title: isKm
          ? 'ទម្លាប់លេង និងសមាហរណកម្មសតិអារម្មណ៍នៅផ្ទះ'
          : 'Home Sensory Integration & Play Routine',
        date: isKm ? 'ការថែទាំបន្ត' : 'Ongoing Care',
        domain: isKm ? 'ការលេងតាមសតិអារម្មណ៍' : 'Sensory Play',
        domainClass: 'domain-activity',
        description: isKm
          ? 'លំហាត់បន្ធូរអារម្មណ៍ និងការទំនាក់ទំនងតាមរូបភាពដែលបានណែនាំសម្រាប់អនុវត្តនៅផ្ទះ។'
          : 'Recommended calming and visual communication exercises completed at home.',
        linkPath: '/activities',
        linkLabel: isKm ? 'ស្វែងរកសកម្មភាព' : 'Browse Activities',
      });
    }

    return list;
  });

  scrollToEdit(): void {
    const el = document.getElementById('personal-details-heading');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  formatDate(dateStr: string): string {
    const isKm = this.currentLang() === 'km';
    if (!dateStr) return isKm ? 'ថ្មីៗ' : 'Recent';
    const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isKm) {
      return new Intl.DateTimeFormat('km-KH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    const childId = this.route.snapshot.paramMap.get('childId');
    if (!childId) {
      this.error.set('Child profile was not found.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.api.getChild(childId).subscribe({
      next: (child) => {
        this.child.set(child);
        this.patchForm(child);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Child profile could not be loaded.');
        this.loading.set(false);
      },
    });

    this.loadingScreening.set(true);
    this.screeningApi.listSessions(childId).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        const completed = sessions.find((s) => s.result !== null);
        this.latestRiskLevel.set(completed?.result?.riskLevel ?? null);
        this.loadingScreening.set(false);
      },
      error: () => {
        this.sessions.set([]);
        this.latestRiskLevel.set(null);
        this.loadingScreening.set(false);
      },
    });
  }

  save() {
    const child = this.child();
    if (!child) return;

    this.saveError.set(null);
    this.saveMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .updateChild(child.id, {
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim() || undefined,
        dateOfBirth: value.dateOfBirth,
        address: value.address.trim() || undefined,
        notes: value.notes.trim() || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.child.set(updated);
          this.patchForm(updated);
          this.saveMessage.set('Child profile saved.');
          this.saving.set(false);
        },
        error: () => {
          this.saveError.set('Child profile could not be saved.');
          this.saving.set(false);
        },
      });
  }

  resetForm() {
    const child = this.child();
    if (child) this.patchForm(child);
    this.saveError.set(null);
    this.saveMessage.set(null);
  }

  confirmArchive() {
    const child = this.child();
    if (!child) return;
    this.archiving.set(true);
    this.api.archiveChild(child.id).subscribe({
      next: () => {
        this.archiving.set(false);
        this.showArchiveConfirm.set(false);
        void this.router.navigateByUrl('/children');
      },
      error: () => {
        this.archiving.set(false);
        this.showArchiveConfirm.set(false);
        this.saveError.set('Child profile could not be archived.');
      },
    });
  }

  restore() {
    const child = this.child();
    if (!child) return;
    this.restoring.set(true);
    this.saveError.set(null);
    this.saveMessage.set(null);
    this.api.restoreChild(child.id).subscribe({
      next: (updated) => {
        this.child.set(updated);
        this.patchForm(updated);
        this.restoring.set(false);
        this.saveMessage.set('Child profile has been restored.');
      },
      error: () => {
        this.restoring.set(false);
        this.saveError.set('Child profile could not be restored.');
      },
    });
  }

  fullName(child: ChildResponse): string {
    return [child.firstName, child.lastName].filter(Boolean).join(' ');
  }

  initials(child: ChildResponse): string {
    const parts = [child.firstName, child.lastName].filter(Boolean) as string[];
    const [first, second] = parts;
    if (first && second) {
      return (first.charAt(0) + second.charAt(0)).toUpperCase();
    }
    return child.firstName.slice(0, 2).toUpperCase();
  }

  getAvatarGradient(child: ChildResponse): string {
    const gradients = [
      'linear-gradient(135deg, var(--ac-color-teal-slate), var(--ac-color-sky-soft))',
      'linear-gradient(135deg, var(--ac-color-olive-mid), var(--ac-color-olive-light))',
      'linear-gradient(135deg, var(--ac-color-status-purple), var(--ac-color-tint-blue-mist))',
      'linear-gradient(135deg, var(--ac-color-accent-amber), var(--ac-color-tint-blue))',
    ];
    const key = child.id || child.firstName;
    const index = key.charCodeAt(0) % gradients.length;
    return gradients[index];
  }

  ageLabel(dateOfBirth: string): string {
    const birthDate = new Date(`${dateOfBirth}T00:00:00`);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (today.getDate() < birthDate.getDate()) {
      months -= 1;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    const safeYears = Math.max(years, 0);
    const safeMonths = Math.max(months, 0);
    const isKm = this.currentLang() === 'km';
    if (safeYears <= 0 && safeMonths <= 0) {
      return isKm ? 'ទារកទើបកើត' : 'Newborn';
    }
    if (isKm) {
      if (safeYears > 0 && safeMonths > 0) return `${safeYears} ឆ្នាំ ${safeMonths} ខែ`;
      if (safeYears > 0) return `${safeYears} ឆ្នាំ`;
      return `${safeMonths} ខែ`;
    }
    if (safeYears > 0 && safeMonths > 0) {
      return `${safeYears} ${safeYears === 1 ? 'year' : 'years'} ${safeMonths} ${safeMonths === 1 ? 'month' : 'months'}`;
    }
    if (safeYears > 0) {
      return safeYears === 1 ? '1 year old' : `${safeYears} years old`;
    }
    return safeMonths === 1 ? '1 month old' : `${safeMonths} months old`;
  }

  riskTone(risk: RiskLevel | null): 'positive' | 'caution' | 'alert' | 'neutral' {
    if (risk === 'LOW') return 'positive';
    if (risk === 'MODERATE') return 'caution';
    if (risk === 'HIGH') return 'alert';
    return 'neutral';
  }

  riskLabel(risk: RiskLevel | null): string {
    if (risk === 'LOW') return 'Low Risk';
    if (risk === 'MODERATE') return 'Moderate Risk';
    if (risk === 'HIGH') return 'High Risk';
    return 'Not Screened';
  }

  private patchForm(child: ChildResponse) {
    this.form.setValue({
      firstName: child.firstName,
      lastName: child.lastName ?? '',
      dateOfBirth: child.dateOfBirth,
      address: child.address ?? '',
      notes: child.notes ?? '',
    });
    this.form.markAsPristine();
  }
}
