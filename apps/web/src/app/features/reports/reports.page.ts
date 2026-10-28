import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type {
  ActivityReportListItem,
  ChildResponse,
  ObservationResponse,
  ScreeningSessionResultResponse,
} from '@auticare/contracts';
import { ChildrenApi } from '../children/data-access/children.api';
import { SchoolsApi } from '../schools/data-access/schools.api';
import { ObservationsApi } from '../observations/data-access/observations.api';
import { ScreeningApi } from '../screening/data-access/screening.api';
import { UiSpinnerComponent } from '../../design-system/components/ui-spinner.component';
import { UiEmptyStateComponent } from '../../design-system/components/ui-empty-state.component';
import { I18nService } from '../../core/i18n/i18n.service';

export type ReportTab = 'school' | 'behaviour' | 'educational';
export type DateRange = '7d' | '30d' | '90d' | 'all';

const COPY = {
  en: {
    eyebrow: 'Developmental Progress',
    title: 'Child Progress Reports',
    subtitle:
      'Consolidated reports from schools, daily home observations, and developmental suggestions.',
    manageSharing: 'Manage sharing',
    printPdf: 'Print or export PDF',
    selectChildLabel: 'Select Child',
    dateWindowLabel: 'Date Window',
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
    last90Days: 'Last 90 days',
    allTime: 'All time',
    tabSchool: 'School Reports',
    tabObservations: 'Parent Observations',
    tabEducational: 'Educational Summaries',
    emptySchoolTitle: 'No school reports in this window',
    emptySchoolMsg:
      "When your child's teachers submit reports, they will be compiled and displayed here.",
    schoolSectionTitle: 'School Activity & Progress Reports',
    sourceSchool: 'Source: Enrolled School Educators',
    categoryLabel: 'Category',
    durationLabel: 'Duration',
    minLabel: 'min',
    emptyObsTitle: 'No observations recorded',
    emptyObsMsg: 'Record observations in the Observations tab to see patterns here.',
    obsSectionTitle: 'Parent Observations Report',
    sourceObs: 'Source: Home Logged Records',
    obsNotice:
      'Logged by family members during daily routines. These records help educators and therapists understand sensory preferences, triggers, and calming responses.',
    obsNoticeHeading: 'Parent observations:',
    obsSummaryText: (count: number, topCat: string, triggers: number) =>
      `${count} ${count === 1 ? 'observation' : 'observations'} · Top pattern: ${topCat} · ${triggers} recorded ${triggers === 1 ? 'trigger' : 'triggers'}`,
    tableHeaderDate: 'Date & Time',
    tableHeaderCategory: 'Category',
    tableHeaderIntensity: 'Intensity',
    tableHeaderTrigger: 'Trigger',
    tableHeaderResponse: 'Parent Response',
    tableHeaderOutcome: 'Outcome',
    tableHeaderNotes: 'Notes',
    educationalSectionTitle: 'Educational Summaries & Guidance',
    sourceEducational: 'Source: Screening & Educational Suggestions',
    disclaimerHeading: 'Educational suggestions, not a diagnosis:',
    disclaimerText:
      'The summaries below are generated from screening questionnaires and developmental patterns to suggest learning activities. AutiCare does not provide clinical diagnoses.',
    screeningOverviewTitle: 'Developmental Screening Overview',
    completedLabel: 'Completed:',
    concernLevelLabel: 'Concern Level:',
    screeningSummaryDesc: (score: number, percent: number) =>
      `Overall concern score: ${score} points (${percent}%). Educational focus areas have been identified based on parent responses.`,
    emptyScreeningTitle: 'No questionnaire records found',
    emptyScreeningMsg:
      'Complete the developmental questionnaire for this child to populate educational suggestions.',
    suggestionsTitle: 'Educational & Home Strategy Suggestions',
    strategy1Title: 'Sensory Integration:',
    strategy1Desc:
      'Provide designated quiet corners with weighted blankets or fidget tools before transitions between activities.',
    strategy2Title: 'Visual Supports:',
    strategy2Desc:
      'Utilize first-then schedule boards and visual activity strips to reduce transition anxiety.',
    strategy3Title: 'Communication Expansion:',
    strategy3Desc:
      'Incorporate favorite high-interest toys during turn-taking routines to encourage verbal or gestural requests.',
    strategy4Title: 'Collaborative Support:',
    strategy4Desc:
      'Share these observational patterns with your school educator via the "Manage sharing" section.',
    printDocTitle: 'AutiCare Developmental & Educational Report',
    printNonDiagnosticBadge: 'Non-Diagnostic Document',
    printChildLabel: 'Child:',
    printDateLabel: 'Report Date:',
    printFilterLabel: 'Date Filter Window:',
    printFocusLabel: 'Report Focus:',
    printDisclaimerNotice:
      'Important Notice: This document compiles educational reports, parent observations, and developmental suggestions. It is not a clinical diagnosis or medical evaluation.',
    loading: 'Compiling report data…',
  },
  km: {
    eyebrow: 'វឌ្ឍនភាពនៃការលូតលាស់',
    title: 'របាយការណ៍វឌ្ឍនភាពកុមារ',
    subtitle: 'របាយការណ៍រួមពីសាលារៀន កំណត់ត្រាការសង្កេតនៅផ្ទះ និងការណែនាំអភិវឌ្ឍន៍។',
    manageSharing: 'គ្រប់គ្រងការចែករំលែក',
    printPdf: 'បោះពុម្ព ឬទាញយកជា PDF',
    selectChildLabel: 'ជ្រើសរើសកុមារ',
    dateWindowLabel: 'ចន្លោះកាលបរិច្ឆេទ',
    last7Days: '៧ ថ្ងៃចុងក្រោយ',
    last30Days: '៣០ ថ្ងៃចុងក្រោយ',
    last90Days: '៩០ ថ្ងៃចុងក្រោយ',
    allTime: 'គ្រប់ពេលវេលា',
    tabSchool: 'របាយការណ៍ពីសាលា',
    tabObservations: 'ការសង្កេតរបស់អាណាព្យាបាល',
    tabEducational: 'សេចក្តីសង្ខេបការអប់រំ',
    emptySchoolTitle: 'គ្មានរបាយការណ៍ពីសាលាក្នុងកំឡុងពេលនេះទេ',
    emptySchoolMsg: 'នៅពេលគ្រូបង្រៀនបញ្ជូនរបាយការណ៍ វានឹងបង្ហាញនៅទីនេះ។',
    schoolSectionTitle: 'សកម្មភាពសាលា និងរបាយការណ៍វឌ្ឍនភាព',
    sourceSchool: 'ប្រភព៖ គ្រូបង្រៀននៅសាលា',
    categoryLabel: 'ប្រភេទ',
    durationLabel: 'រយៈពេល',
    minLabel: 'នាទី',
    emptyObsTitle: 'មិនទាន់មានកំណត់ត្រាការសង្កេតទេ',
    emptyObsMsg: 'កត់ត្រាការសង្កេតក្នុងទំព័រការសង្កេតដើម្បីបង្កើតលំនាំសង្ខេបនៅទីនេះ។',
    obsSectionTitle: 'របាយការណ៍ការសង្កេតរបស់អាណាព្យាបាល',
    sourceObs: 'ប្រភព៖ កំណត់ត្រានៅផ្ទះ',
    obsNotice:
      'កត់ត្រាដោយក្រុមគ្រួសារក្នុងទម្លាប់ប្រចាំថ្ងៃ។ កំណត់ត្រាទាំងនេះជួយគ្រូ និងអ្នកព្យាបាលយល់ដឹងពីចំណូលចិត្តវិញ្ញាណ កត្តាជម្រុញ និងការឆ្លើយតបដើម្បីសម្រួលអារម្មណ៍។',
    obsNoticeHeading: 'ការសង្កេតរបស់អាណាព្យាបាល៖',
    obsSummaryText: (count: number, topCat: string, triggers: number) =>
      `ការសង្កេតចំនួន ${count} · លំនាំចម្បង៖ ${topCat} · កត្តាជម្រុញដែលបានកត់ត្រា៖ ${triggers}`,
    tableHeaderDate: 'កាលបរិច្ឆេទ និងម៉ោង',
    tableHeaderCategory: 'ប្រភេទ',
    tableHeaderIntensity: 'កម្រិត',
    tableHeaderTrigger: 'កត្តាជម្រុញ',
    tableHeaderResponse: 'ការឆ្លើយតបរបស់អាណាព្យាបាល',
    tableHeaderOutcome: 'លទ្ធផល',
    tableHeaderNotes: 'កំណត់ចំណាំ',
    educationalSectionTitle: 'សេចក្តីសង្ខេបការអប់រំ និងការណែនាំ',
    sourceEducational: 'ប្រភព៖ កម្រងសំណួរស្គ្រីនីង និងអនុសាសន៍អប់រំ',
    disclaimerHeading: 'ការណែនាំអប់រំ មិនមែនជាការវិនិច្ឆ័យរោគទេ៖',
    disclaimerText:
      'សេចក្តីសង្ខេបខាងក្រោមត្រូវបានបង្កើតឡើងពីកម្រងសំណួរស្គ្រីនីង និងលំនាំអភិវឌ្ឍន៍ ដើម្បីណែនាំសកម្មភាពសិក្សា។ AutiCare មិនផ្តល់ការវិនិច្ឆ័យរោគតាមវេជ្ជសាស្ត្រឡើយ។',
    screeningOverviewTitle: 'ទិដ្ឋភាពទូទៅនៃការវាយតម្លៃស្គ្រីនីង',
    completedLabel: 'បានបញ្ចប់៖',
    concernLevelLabel: 'កម្រិតការព្រួយបារម្ភ៖',
    screeningSummaryDesc: (score: number, percent: number) =>
      `ពិន្ទុរួម៖ ${score} ពិន្ទុ (${percent}%)។ ផ្នែកផ្តោតលើការអប់រំត្រូវបានកំណត់ដោយផ្អែកលើចម្លើយរបស់អាណាព្យាបាល។`,
    emptyScreeningTitle: 'រកមិនឃើញកំណត់ត្រាកម្រងសំណួរទេ',
    emptyScreeningMsg: 'សូមបំពេញកម្រងសំណួរវាយតម្លៃសម្រាប់កុមារនេះ ដើម្បីទទួលបានការណែនាំអប់រំ។',
    suggestionsTitle: 'យុទ្ធសាស្ត្រអប់រំ និងការគាំទ្រនៅផ្ទះ',
    strategy1Title: 'ការសម្របសម្រួលវិញ្ញាណ៖',
    strategy1Desc: 'រៀបចំកន្លែងស្ងប់ស្ងាត់ជាមួយភួយទម្ងន់ ឬឧបករណ៍ជំនួយដៃ មុនពេលផ្លាស់ប្តូរសកម្មភាព។',
    strategy2Title: 'ជំនួយតាមរូបភាព៖',
    strategy2Desc:
      'ប្រើកាលវិភាគរូបភាព (ដំបូង-បន្ទាប់មក) ដើម្បីកាត់បន្ថយការថប់បារម្ភពេលផ្លាស់ប្តូរសកម្មភាព។',
    strategy3Title: 'ការពង្រីកការប្រាស្រ័យទាក់ទង៖',
    strategy3Desc:
      'បញ្ចូលប្រដាប់ក្មេងលេងដែលកុមារចូលចិត្តខ្លាំង ក្នុងទម្លាប់ផ្លាស់វេនគ្នា ដើម្បីលើកទឹកចិត្តឱ្យមានការស្នើសុំ។',
    strategy4Title: 'ការគាំទ្ររួមគ្នា៖',
    strategy4Desc:
      'ចែករំលែកលំនាំនៃការសង្កេតទាំងនេះជាមួយគ្រូបង្រៀនតាមរយៈផ្នែក "គ្រប់គ្រងការចែករំលែក"។',
    printDocTitle: 'របាយការណ៍អប់រំ និងការអភិវឌ្ឍន៍ AutiCare',
    printNonDiagnosticBadge: 'ឯកសារមិនមែនសម្រាប់វិនិច្ឆ័យរោគ',
    printChildLabel: 'កុមារ៖',
    printDateLabel: 'កាលបរិច្ឆេទរបាយការណ៍៖',
    printFilterLabel: 'ចន្លោះកាលបរិច្ឆេទ៖',
    printFocusLabel: 'ការផ្តោតនៃរបាយការណ៍៖',
    printDisclaimerNotice:
      'សេចក្តីជូនដំណឹងសំខាន់៖ ឯកសារនេះចងក្រងឡើងពីរបាយការណ៍អប់រំ ការសង្កេតរបស់អាណាព្យាបាល និងអនុសាសន៍អភិវឌ្ឍន៍។ នេះមិនមែនជាការវិនិច្ឆ័យរោគ ឬការវាយតម្លៃផ្នែកវេជ្ជសាស្ត្រទេ។',
    loading: 'កំពុងចងក្រងទិន្នន័យរបាយការណ៍…',
  },
};

@Component({
  selector: 'ac-reports',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, UiSpinnerComponent, UiEmptyStateComponent],
  template: `
    <div class="reports-container">
      <header class="page-head no-print">
        <div class="header-intro">
          <p class="eyebrow">{{ copy().eyebrow }}</p>
          <h1>{{ copy().title }}</h1>
          <p class="subtitle">{{ copy().subtitle }}</p>
        </div>

        <div class="header-actions">
          <a routerLink="/settings" class="btn-share-link">
            <span>{{ copy().manageSharing }} &rarr;</span>
          </a>

          <button type="button" class="btn-print" (click)="printReport()">
            <span>{{ copy().printPdf }}</span>
          </button>
        </div>
      </header>

      <section class="controls-panel no-print">
        <div class="controls-inputs">
          <div class="control-group">
            <label for="child-select" class="control-label">{{ copy().selectChildLabel }}</label>
            <select
              id="child-select"
              class="control-select"
              [ngModel]="selectedChildId()"
              (ngModelChange)="onChildChange($event)"
            >
              @for (child of children(); track child.id) {
                <option [value]="child.id">{{ child.firstName }} {{ child.lastName || '' }}</option>
              }
            </select>
          </div>

          <div class="control-group">
            <label for="date-range" class="control-label">{{ copy().dateWindowLabel }}</label>
            <select
              id="date-range"
              class="control-select"
              [ngModel]="dateRange()"
              (ngModelChange)="dateRange.set($event)"
            >
              <option value="7d">{{ copy().last7Days }}</option>
              <option value="30d">{{ copy().last30Days }}</option>
              <option value="90d">{{ copy().last90Days }}</option>
              <option value="all">{{ copy().allTime }}</option>
            </select>
          </div>
        </div>

        <div class="tabs-group" role="tablist" aria-label="Report sections">
          <button
            type="button"
            role="tab"
            class="tab-btn"
            [class.active]="activeTab() === 'school'"
            [attr.aria-selected]="activeTab() === 'school'"
            (click)="activeTab.set('school')"
          >
            {{ copy().tabSchool }}
          </button>
          <button
            type="button"
            role="tab"
            class="tab-btn"
            [class.active]="activeTab() === 'behaviour'"
            [attr.aria-selected]="activeTab() === 'behaviour'"
            (click)="activeTab.set('behaviour')"
          >
            {{ copy().tabObservations }}
          </button>
          <button
            type="button"
            role="tab"
            class="tab-btn"
            [class.active]="activeTab() === 'educational'"
            [attr.aria-selected]="activeTab() === 'educational'"
            (click)="activeTab.set('educational')"
          >
            {{ copy().tabEducational }}
          </button>
        </div>
      </section>

      <!-- Printable Header for physical paper and PDF downloads -->
      <section class="print-header print-only">
        <div class="print-brand">
          <h2>{{ copy().printDocTitle }}</h2>
          <span class="report-badge">{{ copy().printNonDiagnosticBadge }}</span>
        </div>
        <div class="print-meta-grid">
          <div>
            <strong>{{ copy().printChildLabel }}</strong>
            {{ activeChild()?.firstName }}
            {{ activeChild()?.lastName || '' }}
          </div>
          <div>
            <strong>{{ copy().printDateLabel }}</strong>
            {{ currentDate | date: 'mediumDate' }}
          </div>
          <div>
            <strong>{{ copy().printFilterLabel }}</strong>
            {{ dateRangeLabel() }}
          </div>
          <div>
            <strong>{{ copy().printFocusLabel }}</strong> {{ activeTabLabel() }}
          </div>
        </div>
        <div class="print-disclaimer">
          {{ copy().printDisclaimerNotice }}
        </div>
      </section>

      <main class="report-main">
        @if (loading()) {
          <div class="loading-state no-print">
            <ac-ui-spinner [label]="copy().loading"></ac-ui-spinner>
          </div>
        } @else {
          <!-- TAB 1: SCHOOL REPORTS -->
          @if (activeTab() === 'school') {
            <section class="report-section">
              <div class="section-heading">
                <h2>{{ copy().schoolSectionTitle }}</h2>
                <span class="badge-source">{{ copy().sourceSchool }}</span>
              </div>

              @if (filteredSchoolReports().length === 0) {
                <ac-ui-empty-state
                  [title]="copy().emptySchoolTitle"
                  [message]="copy().emptySchoolMsg"
                ></ac-ui-empty-state>
              } @else {
                <div class="reports-panel">
                  <ul class="reports-list">
                    @for (rep of filteredSchoolReports(); track rep.id) {
                      <li class="report-item">
                        <div class="card-header">
                          <div>
                            <h3 class="card-title">{{ rep.title }}</h3>
                            <span class="card-date">{{ rep.createdAt | date: 'mediumDate' }}</span>
                          </div>
                          <span class="chip-status">{{ rep.status }}</span>
                        </div>

                        <p class="report-summary">{{ rep.summary }}</p>

                        <div class="metrics-grid">
                          <span class="metric-pill">
                            <span class="metric-name">{{ copy().categoryLabel }}:</span>
                            <span class="metric-val">{{ rep.activityCategory }}</span>
                          </span>
                          @if (rep.duration) {
                            <span class="metric-pill">
                              <span class="metric-name">{{ copy().durationLabel }}:</span>
                              <span class="metric-val"
                                >{{ rep.duration }} {{ copy().minLabel }}</span
                              >
                            </span>
                          }
                        </div>
                      </li>
                    }
                  </ul>
                </div>
              }
            </section>
          }

          <!-- TAB 2: BEHAVIOUR OBSERVATIONS (Parent Observations) -->
          @if (activeTab() === 'behaviour') {
            <section class="report-section">
              <div class="section-heading">
                <h2>{{ copy().obsSectionTitle }}</h2>
                <span class="badge-source">{{ copy().sourceObs }}</span>
              </div>

              <div class="notice-callout">
                <p>
                  <strong>{{ copy().obsNoticeHeading }}</strong>
                  {{ copy().obsNotice }}
                </p>
              </div>

              @if (filteredObservations().length > 0) {
                <div class="summary-meta-strip">
                  {{
                    copy().obsSummaryText(
                      filteredObservations().length,
                      topCategory(),
                      uniqueTriggersCount()
                    )
                  }}
                </div>
              }

              @if (filteredObservations().length === 0) {
                <ac-ui-empty-state
                  [title]="copy().emptyObsTitle"
                  [message]="copy().emptyObsMsg"
                ></ac-ui-empty-state>
              } @else {
                <div class="table-card">
                  <table class="report-table">
                    <thead>
                      <tr>
                        <th scope="col">{{ copy().tableHeaderDate }}</th>
                        <th scope="col">{{ copy().tableHeaderCategory }}</th>
                        <th scope="col">{{ copy().tableHeaderIntensity }}</th>
                        <th scope="col">{{ copy().tableHeaderTrigger }}</th>
                        <th scope="col">{{ copy().tableHeaderResponse }}</th>
                        <th scope="col">{{ copy().tableHeaderOutcome }}</th>
                        <th scope="col">{{ copy().tableHeaderNotes }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (obs of filteredObservations(); track obs.id) {
                        <tr>
                          <td class="cell-date">
                            {{ obs.occurredAt | date: 'short' }}
                          </td>
                          <td>
                            <span class="category-chip">{{ obs.category }}</span>
                          </td>
                          <td>
                            <span class="intensity-chip" [class]="'int-' + obs.intensity">{{
                              obs.intensity
                            }}</span>
                          </td>
                          <td>{{ obs.trigger || '—' }}</td>
                          <td>{{ obs.parentResponse || '—' }}</td>
                          <td>{{ obs.outcome || '—' }}</td>
                          <td class="cell-notes">{{ obs.note || '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>
          }

          <!-- TAB 3: EDUCATIONAL SUMMARIES (AI Suggestions & Questionnaire) -->
          @if (activeTab() === 'educational') {
            <section class="report-section">
              <div class="section-heading">
                <h2>{{ copy().educationalSectionTitle }}</h2>
                <span class="badge-source">{{ copy().sourceEducational }}</span>
              </div>

              <div class="warning-callout">
                <p>
                  <strong>{{ copy().disclaimerHeading }}</strong>
                  {{ copy().disclaimerText }}
                </p>
              </div>

              @if (screeningResult(); as result) {
                <div class="screening-summary-card">
                  <div class="card-header">
                    <div>
                      <h3 class="card-title">
                        {{ copy().screeningOverviewTitle }}
                      </h3>
                      <span class="card-date"
                        >{{ copy().completedLabel }}
                        {{ result.submittedAt || result.startedAt | date: 'mediumDate' }}</span
                      >
                    </div>
                    <span
                      class="concern-chip"
                      [class]="'risk-' + (result.result?.riskLevel || 'moderate').toLowerCase()"
                    >
                      {{ copy().concernLevelLabel }}
                      {{ result.result?.riskLevel || 'Pending' }}
                    </span>
                  </div>

                  <p class="screening-desc">
                    {{
                      copy().screeningSummaryDesc(
                        result.result?.score || 0,
                        result.result?.riskPercentage || 0
                      )
                    }}
                  </p>

                  <div class="domain-scores-grid">
                    @for (domain of result.result?.categoryBreakdown || []; track domain.category) {
                      <div class="domain-card">
                        <div class="domain-head">
                          <span class="domain-title">{{ domain.category }}</span>
                          <span class="domain-val">{{ domain.riskPercentage }}%</span>
                        </div>
                        <div class="progress-bar-bg">
                          <div
                            class="progress-bar-fill"
                            [style.width.%]="domain.riskPercentage"
                          ></div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <ac-ui-empty-state
                  [title]="copy().emptyScreeningTitle"
                  [message]="copy().emptyScreeningMsg"
                ></ac-ui-empty-state>
              }

              <div class="suggestions-card">
                <h3 class="suggestions-title">{{ copy().suggestionsTitle }}</h3>
                <ul class="suggestions-list">
                  <li>
                    <strong>{{ copy().strategy1Title }}</strong>
                    {{ copy().strategy1Desc }}
                  </li>
                  <li>
                    <strong>{{ copy().strategy2Title }}</strong>
                    {{ copy().strategy2Desc }}
                  </li>
                  <li>
                    <strong>{{ copy().strategy3Title }}</strong>
                    {{ copy().strategy3Desc }}
                  </li>
                  <li>
                    <strong>{{ copy().strategy4Title }}</strong>
                    {{ copy().strategy4Desc }}
                  </li>
                </ul>
              </div>
            </section>
          }
        }
      </main>
    </div>
  `,
  styles: [
    `
      /* Full width layout matching Children & Observations standard */
      :host {
        display: block;
        padding-bottom: var(--ac-space-12);
      }

      .reports-container {
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

      .header-intro {
        max-width: 680px;
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
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: var(--ac-space-3);
        flex-wrap: wrap;
      }

      .btn-share-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 var(--ac-space-4);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-mid);
        font: inherit;
        font-size: 14px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        transition:
          border-color var(--ac-motion-fast),
          background var(--ac-motion-fast);
      }

      .btn-share-link:hover {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
      }

      .btn-print {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 var(--ac-space-5);
        border: 1px solid var(--ac-color-action);
        border-radius: var(--ac-radius-md);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font: inherit;
        font-size: 14px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        transition: background var(--ac-motion-fast);
      }

      .btn-print:hover {
        background: var(--ac-color-action-deep);
      }

      .controls-panel {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ac-space-4);
        justify-content: space-between;
        align-items: flex-end;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        padding: var(--ac-space-4);
      }

      .controls-inputs {
        display: flex;
        gap: var(--ac-space-3);
        flex-wrap: wrap;
      }

      .control-group {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-1);
        min-width: 180px;
      }

      .control-label {
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .control-select {
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

      .control-select:focus {
        outline: 2px solid var(--ac-color-focus);
        border-color: transparent;
      }

      .tabs-group {
        display: flex;
        gap: var(--ac-space-2);
        flex-wrap: wrap;
      }

      .tab-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 38px;
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
          background var(--ac-motion-fast),
          border-color var(--ac-motion-fast),
          color var(--ac-motion-fast);
      }

      .tab-btn:hover {
        border-color: var(--ac-color-action);
        color: var(--ac-color-action-deep);
      }

      .tab-btn.active {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        border-color: var(--ac-color-action);
      }

      .print-only {
        display: none;
      }

      .report-main {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-6);
      }

      .report-section {
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-4);
      }

      .section-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--ac-space-2);
      }

      .section-heading h2 {
        font-size: 1.25rem;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        margin: 0;
      }

      .badge-source {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
        background: var(--ac-color-surface-info);
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border-info);
      }

      .notice-callout,
      .warning-callout {
        border-radius: var(--ac-radius-md);
        padding: var(--ac-space-3) var(--ac-space-4);
        display: flex;
        align-items: flex-start;
      }

      .notice-callout p,
      .warning-callout p {
        margin: 0;
        font-size: 0.9375rem;
        line-height: var(--ac-line-body);
      }

      .notice-callout {
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-text-body);
      }

      .warning-callout {
        background: var(--ac-color-amber-tint-50);
        border: 1px solid var(--ac-color-amber-tint-sand);
        color: var(--ac-color-amber-800);
      }

      /* Quiet inline summary strip instead of big stat cards */
      .summary-meta-strip {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-medium);
        padding: var(--ac-space-2) var(--ac-space-3);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        border-radius: var(--ac-radius-md);
        display: inline-block;
      }

      /* Reports panel with row dividers (one panel standard) */
      .reports-panel {
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        background: var(--ac-color-surface);
        overflow: clip;
      }

      .reports-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
      }

      .report-item {
        padding: var(--ac-space-4) var(--ac-space-5);
        border-top: 1px solid var(--ac-color-border);
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-2);
      }

      .report-item:first-child {
        border-top: none;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--ac-space-2);
      }

      .card-title {
        font-size: 1.0625rem;
        font-weight: var(--ac-font-weight-bold);
        margin: 0 0 var(--ac-space-1);
        color: var(--ac-color-text-strong);
      }

      .card-date {
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .chip-status {
        font-size: 0.75rem;
        font-weight: var(--ac-font-weight-bold);
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-green-tint-50);
        color: var(--ac-color-green-dark);
        border: 1px solid var(--ac-color-green-border-soft);
      }

      .report-summary {
        font-size: 0.9375rem;
        color: var(--ac-color-text-body);
        line-height: var(--ac-line-body);
        margin: 0;
      }

      .metrics-grid {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ac-space-2);
        margin-top: var(--ac-space-1);
      }

      .metric-pill {
        background: var(--ac-color-ice-blue-soft);
        border: 1px solid var(--ac-color-ice-blue-border);
        border-radius: var(--ac-radius-pill);
        padding: 2px 8px;
        font-size: var(--ac-type-meta);
        display: inline-flex;
        gap: var(--ac-space-1);
        color: var(--ac-brand-800);
      }

      .metric-name {
        color: var(--ac-color-text-muted);
      }

      .metric-val {
        font-weight: var(--ac-font-weight-semibold);
      }

      .table-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        overflow-x: auto;
      }

      .report-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: var(--ac-type-body);
      }

      .report-table th {
        padding: var(--ac-space-3) var(--ac-space-4);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-text-strong);
        font-weight: var(--ac-font-weight-bold);
        font-size: var(--ac-type-meta);
        border-bottom: 1px solid var(--ac-color-border);
        white-space: nowrap;
      }

      .report-table td {
        padding: var(--ac-space-3) var(--ac-space-4);
        border-bottom: 1px solid var(--ac-color-border);
        vertical-align: top;
        color: var(--ac-color-text-body);
        font-size: 0.9375rem;
      }

      .cell-date {
        white-space: nowrap;
        font-size: var(--ac-type-meta);
        color: var(--ac-color-text-muted);
      }

      .category-chip {
        background: var(--ac-color-ice-blue-soft);
        color: var(--ac-brand-800);
        border: 1px solid var(--ac-color-ice-blue-border);
        font-weight: var(--ac-font-weight-medium);
        font-size: var(--ac-type-meta);
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        white-space: nowrap;
      }

      .intensity-chip {
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        display: inline-block;
      }

      .int-1,
      .int-2 {
        background: var(--ac-color-green-tint-50);
        color: var(--ac-color-green-dark);
        border: 1px solid var(--ac-color-green-border-soft);
      }

      .int-3 {
        background: var(--ac-color-amber-tint-50);
        color: var(--ac-color-amber-800);
        border: 1px solid var(--ac-color-amber-tint-sand);
      }

      .int-4,
      .int-5 {
        background: var(--ac-color-red-tint-50);
        color: var(--ac-color-alert-text);
        border: 1px solid var(--ac-color-red-tint-muted);
      }

      .screening-summary-card,
      .suggestions-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border);
        border-radius: var(--ac-radius-lg);
        padding: var(--ac-space-6);
      }

      .screening-desc {
        font-size: 0.9375rem;
        color: var(--ac-color-text-body);
        line-height: var(--ac-line-body);
        margin: var(--ac-space-2) 0 0;
      }

      .concern-chip {
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
      }

      .risk-high {
        background: var(--ac-color-red-tint-50);
        color: var(--ac-color-alert-text);
        border: 1px solid var(--ac-color-red-tint-muted);
      }

      .risk-moderate,
      .risk-medium {
        background: var(--ac-color-amber-tint-50);
        color: var(--ac-color-amber-800);
        border: 1px solid var(--ac-color-amber-tint-sand);
      }

      .risk-low {
        background: var(--ac-color-green-tint-50);
        color: var(--ac-color-green-dark);
        border: 1px solid var(--ac-color-green-border-soft);
      }

      .domain-scores-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--ac-space-3);
        margin-top: var(--ac-space-4);
      }

      .domain-card {
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        border-radius: var(--ac-radius-md);
        padding: var(--ac-space-3);
      }

      .domain-head {
        display: flex;
        justify-content: space-between;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-medium);
        margin-bottom: var(--ac-space-2);
        color: var(--ac-color-text-strong);
      }

      .progress-bar-bg {
        height: 6px;
        background: color-mix(in srgb, var(--ac-color-border) 60%, transparent);
        border-radius: var(--ac-radius-pill);
        overflow: hidden;
      }

      .progress-bar-fill {
        height: 100%;
        background: var(--ac-color-action);
      }

      .suggestions-title {
        font-size: 1.125rem;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        margin: 0 0 var(--ac-space-3) 0;
      }

      .suggestions-list {
        margin: 0;
        padding-left: var(--ac-space-5);
        display: flex;
        flex-direction: column;
        gap: var(--ac-space-3);
        font-size: 0.9375rem;
        line-height: var(--ac-line-body);
        color: var(--ac-color-text-body);
      }

      .loading-state {
        padding: var(--ac-space-12);
        display: flex;
        justify-content: center;
      }

      button:focus-visible,
      a:focus-visible {
        outline: 2px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      /* Print Stylesheet */
      @media print {
        .no-print {
          display: none !important;
        }

        .print-only {
          display: block !important;
        }

        body,
        .reports-container {
          padding: 0 !important;
          margin: 0 !important;
          background: transparent !important;
          color: var(--ac-color-text-strong) !important;
        }

        .print-header {
          border-bottom: 2px solid var(--ac-color-text-strong);
          padding-bottom: 12pt;
          margin-bottom: 16pt;
        }

        .print-brand {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .print-brand h2 {
          margin: 0;
          font-size: 16pt;
          color: var(--ac-color-text-strong);
        }

        .report-badge {
          border: 1px solid var(--ac-color-text-strong);
          padding: 2pt 6pt;
          font-size: 9pt;
          font-weight: bold;
          color: var(--ac-color-text-strong);
        }

        .print-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6pt;
          margin-top: 8pt;
          font-size: 10pt;
          color: var(--ac-color-text-body);
        }

        .print-disclaimer {
          margin-top: 10pt;
          font-size: 8.5pt;
          font-style: italic;
          border-top: 1px solid var(--ac-color-border);
          padding-top: 4pt;
          color: var(--ac-color-text-muted);
        }

        .reports-panel,
        .table-card,
        .screening-summary-card,
        .suggestions-card {
          border: 1px solid var(--ac-color-border) !important;
          page-break-inside: avoid;
          box-shadow: none !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage implements OnInit {
  private readonly childrenApi = inject(ChildrenApi);
  private readonly schoolsApi = inject(SchoolsApi);
  private readonly observationsApi = inject(ObservationsApi);
  private readonly screeningApi = inject(ScreeningApi);
  private readonly i18n = inject(I18nService);

  readonly currentLang = this.i18n.currentLang;
  readonly copy = computed(() => COPY[this.currentLang()] ?? COPY.en);

  readonly currentDate = new Date();
  readonly children = signal<ChildResponse[]>([]);
  readonly selectedChildId = signal('');
  readonly activeTab = signal<ReportTab>('school');
  readonly dateRange = signal<DateRange>('30d');
  readonly loading = signal(true);

  readonly schoolReports = signal<ActivityReportListItem[]>([]);
  readonly observations = signal<ObservationResponse[]>([]);
  readonly screeningResult = signal<ScreeningSessionResultResponse | null>(null);

  readonly activeChild = computed(() =>
    this.children().find((c) => c.id === this.selectedChildId()),
  );

  readonly dateRangeLabel = computed(() => {
    switch (this.dateRange()) {
      case '7d':
        return this.copy().last7Days;
      case '30d':
        return this.copy().last30Days;
      case '90d':
        return this.copy().last90Days;
      default:
        return this.copy().allTime;
    }
  });

  readonly activeTabLabel = computed(() => {
    switch (this.activeTab()) {
      case 'school':
        return this.copy().tabSchool;
      case 'behaviour':
        return this.copy().tabObservations;
      case 'educational':
        return this.copy().tabEducational;
    }
  });

  private getCutoffDate(): Date | null {
    const range = this.dateRange();
    if (range === 'all') return null;
    const now = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  readonly filteredSchoolReports = computed(() => {
    const cutoff = this.getCutoffDate();
    if (!cutoff) return this.schoolReports();
    return this.schoolReports().filter((r) => new Date(r.createdAt) >= cutoff);
  });

  readonly filteredObservations = computed(() => {
    const cutoff = this.getCutoffDate();
    if (!cutoff) return this.observations();
    return this.observations().filter((o) => new Date(o.occurredAt) >= cutoff);
  });

  readonly topCategory = computed(() => {
    const list = this.filteredObservations();
    if (list.length === 0) return 'None';
    const counts: Record<string, number> = {};
    for (const o of list) counts[o.category] = (counts[o.category] || 0) + 1;
    let top = 'None';
    let max = 0;
    for (const [cat, cnt] of Object.entries(counts)) {
      if (cnt > max) {
        max = cnt;
        top = cat;
      }
    }
    return top;
  });

  readonly uniqueTriggersCount = computed(() => {
    const triggers = this.filteredObservations()
      .map((o) => o.trigger?.trim())
      .filter(Boolean);
    return new Set(triggers).size;
  });

  ngOnInit(): void {
    this.loadChildren();
  }

  loadChildren(): void {
    this.childrenApi.listChildren().subscribe({
      next: (children) => {
        this.children.set(children);
        if (children.length > 0 && !this.selectedChildId()) {
          this.selectedChildId.set(children[0]?.id || '');
          this.loadChildData(children[0]?.id || '');
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  onChildChange(childId: string): void {
    this.selectedChildId.set(childId);
    this.loadChildData(childId);
  }

  loadChildData(childId: string): void {
    if (!childId) return;
    this.loading.set(true);

    this.schoolsApi.listReportsWithChild({ childId, status: 'SUBMITTED' }).subscribe({
      next: (res) => this.schoolReports.set(res?.reports || []),
      error: () => this.schoolReports.set([]),
    });

    this.observationsApi.list({ childId }).subscribe({
      next: (obs) => this.observations.set(obs || []),
      error: () => this.observations.set([]),
    });

    this.screeningApi.getLatest(childId).subscribe({
      next: (result) => {
        this.screeningResult.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.screeningResult.set(null);
        this.loading.set(false);
      },
    });
  }

  printReport(): void {
    window.print();
  }
}
