import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { NavIconComponent } from '../../core/layout/nav-icon.component';

type LandingFeature = {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
};

/** The four things the app does for a family, as the planner describes them. */
const EN_FEATURES: readonly LandingFeature[] = [
  {
    title: 'A three-minute check-in',
    description:
      'Ten simple questions give you a starting point: a concern band in plain words, never a diagnosis.',
    icon: 'checklist',
  },
  {
    title: 'Ask AutiCare',
    description:
      'Ask anything in Khmer or English and get a calm, careful answer, with a doctor referral when it matters.',
    icon: 'ai',
  },
  {
    title: 'Daily notes and patterns',
    description:
      'Record sleep, eating or sensory moments in seconds. Over the weeks, AutiCare shows you the patterns.',
    icon: 'trend',
  },
  {
    title: 'Guidance you can trust',
    description:
      'Routines and strategies drawn from reviewed autism resources, each one showing where it came from.',
    icon: 'shield',
  },
];

const KM_FEATURES: readonly LandingFeature[] = [
  {
    title: 'ការពិនិត្យខ្លីបីនាទី',
    description:
      'សំណួរងាយៗដប់ ផ្តល់ចំណុចចាប់ផ្តើម៖ កម្រិតនៃការព្រួយបារម្ភជាពាក្យសាមញ្ញ មិនមែនជាការធ្វើរោគវិនិច្ឆ័យទេ។',
    icon: 'checklist',
  },
  {
    title: 'សួរ AutiCare',
    description:
      'សួរអ្វីក៏បានជាភាសាខ្មែរ ឬអង់គ្លេស ហើយទទួលបានចម្លើយច្បាស់ និងប្រុងប្រយ័ត្ន ព្រមទាំងណែនាំឱ្យជួបគ្រូពេទ្យនៅពេលចាំបាច់។',
    icon: 'ai',
  },
  {
    title: 'កំណត់ត្រាប្រចាំថ្ងៃ និងគំរូ',
    description:
      'កត់ត្រាការគេង ការញ៉ាំ ឬប្រតិកម្មវិញ្ញាណក្នុងរយៈពេលប៉ុន្មានវិនាទី។ យូរៗទៅ AutiCare បង្ហាញគំរូដែលកើតឡើង។',
    icon: 'trend',
  },
  {
    title: 'ការណែនាំដែលអាចទុកចិត្តបាន',
    description:
      'ទម្លាប់ និងយុទ្ធសាស្ត្រដែលដកស្រង់ពីធនធានអូទីសឹមដែលបានពិនិត្យ ហើយនីមួយៗបង្ហាញប្រភពរបស់វា។',
    icon: 'shield',
  },
];

const EN_STEPS = [
  {
    title: 'Add your child',
    description: 'A first name and a date of birth are all it takes to begin.',
  },
  {
    title: 'Take the short check-in',
    description: 'About three minutes, and you see plainly where things stand.',
  },
  {
    title: 'Note what you see',
    description: 'Record everyday moments, and ask AutiCare whenever you are unsure.',
  },
  {
    title: 'Bring it to the specialist',
    description: 'Book a hospital visit and show dated notes instead of trying to remember.',
  },
] as const;

const KM_STEPS = [
  {
    title: 'បន្ថែមព័ត៌មានកូនរបស់អ្នក',
    description: 'មានតែឈ្មោះ និងថ្ងៃខែឆ្នាំកំណើតប៉ុណ្ណោះ ក៏អាចចាប់ផ្តើមបាន។',
  },
  {
    title: 'ធ្វើការពិនិត្យខ្លី',
    description: 'ប្រហែលបីនាទី ហើយអ្នកនឹងឃើញស្ថានភាពយ៉ាងច្បាស់។',
  },
  {
    title: 'កត់ត្រាអ្វីដែលអ្នកឃើញ',
    description: 'កត់ត្រាពេលវេលាប្រចាំថ្ងៃ ហើយសួរ AutiCare នៅពេលអ្នកមិនប្រាកដ។',
  },
  {
    title: 'យកទៅបង្ហាញអ្នកជំនាញ',
    description: 'ណាត់ជួបមន្ទីរពេទ្យ ហើយបង្ហាញកំណត់ត្រាមានកាលបរិច្ឆេទ ជំនួសឱ្យការចងចាំ។',
  },
] as const;

type BillingPeriod = 'monthly' | 'yearly';

type PricingPlan = {
  readonly id: 'school' | 'family' | 'hospital';
  readonly name: string;
  readonly info: string;
  /** USD per month. Yearly is the per-month price when billed yearly. 0 means free. */
  readonly price: { readonly monthly: number; readonly yearly: number };
  readonly features: readonly string[];
  readonly cta: { readonly label: string; readonly link: string };
  readonly highlighted?: boolean;
};

/*
 * Families never pay: the landing page promises a free family account.
 * School and hospital prices are placeholders until the team sets real ones;
 * change them here and every card, badge and discount follows.
 */
const PLAN_PRICES = {
  school: { monthly: 29, yearly: 24 },
  family: { monthly: 0, yearly: 0 },
  hospital: { monthly: 79, yearly: 66 },
} as const;

const EN_PLANS: readonly PricingPlan[] = [
  {
    id: 'school',
    name: 'School',
    info: 'For teachers and inclusive classrooms',
    price: PLAN_PRICES.school,
    features: [
      'Student roster for enrolled children',
      'Structured activity reports',
      'Reports shared with parents',
      'Photo and file attachments',
      'School profile in the directory',
      'Email support',
    ],
    cta: { label: 'Apply as a school', link: '/register-school' },
  },
  {
    id: 'family',
    name: 'Family',
    info: 'For parents and guardians',
    price: PLAN_PRICES.family,
    features: [
      'Three-minute check-in and full screening',
      'Daily notes and pattern insights',
      'Ask AutiCare in Khmer or English',
      'Guidance from trusted sources',
      "Play activities for your child's age",
      'Book hospital appointments',
      "Read your child's school reports",
    ],
    cta: { label: 'Create a free account', link: '/register' },
    highlighted: true,
  },
  {
    id: 'hospital',
    name: 'Hospital',
    info: 'For clinics and specialist teams',
    price: PLAN_PRICES.hospital,
    features: [
      'Appointment requests in one list',
      'Doctor and specialist listings',
      'Hospital profile in the directory',
      'Families arrive with dated notes',
      'Multiple staff accounts',
      'Priority support',
    ],
    cta: { label: 'Contact us', link: '/support' },
  },
];

const KM_PLANS: readonly PricingPlan[] = [
  {
    id: 'school',
    name: 'សាលារៀន',
    info: 'សម្រាប់គ្រូ និងថ្នាក់រៀនបរិយាបន្ន',
    price: PLAN_PRICES.school,
    features: [
      'បញ្ជីសិស្សដែលបានចុះឈ្មោះ',
      'របាយការណ៍សកម្មភាពមានរចនាសម្ព័ន្ធ',
      'ចែករំលែករបាយការណ៍ជាមួយឪពុកម្តាយ',
      'ភ្ជាប់រូបភាព និងឯកសារ',
      'ប្រវត្តិសាលានៅក្នុងបញ្ជី',
      'ជំនួយតាមអ៊ីមែល',
    ],
    cta: { label: 'ដាក់ពាក្យជាសាលា', link: '/register-school' },
  },
  {
    id: 'family',
    name: 'គ្រួសារ',
    info: 'សម្រាប់ឪពុកម្តាយ និងអាណាព្យាបាល',
    price: PLAN_PRICES.family,
    features: [
      'ការពិនិត្យខ្លីបីនាទី និងការវាយតម្លៃពេញលេញ',
      'កំណត់ត្រាប្រចាំថ្ងៃ និងការយល់ដឹងពីគំរូ',
      'សួរ AutiCare ជាភាសាខ្មែរ ឬអង់គ្លេស',
      'ការណែនាំពីប្រភពដែលទុកចិត្តបាន',
      'សកម្មភាពលេងតាមអាយុកូន',
      'ណាត់ជួបមន្ទីរពេទ្យ',
      'អានរបាយការណ៍សាលារបស់កូន',
    ],
    cta: { label: 'បង្កើតគណនីឥតគិតថ្លៃ', link: '/register' },
    highlighted: true,
  },
  {
    id: 'hospital',
    name: 'មន្ទីរពេទ្យ',
    info: 'សម្រាប់គ្លីនិក និងក្រុមអ្នកជំនាញ',
    price: PLAN_PRICES.hospital,
    features: [
      'សំណើណាត់ជួបនៅក្នុងបញ្ជីតែមួយ',
      'បញ្ជីវេជ្ជបណ្ឌិត និងអ្នកជំនាញ',
      'ប្រវត្តិមន្ទីរពេទ្យនៅក្នុងបញ្ជី',
      'គ្រួសារមកដល់ជាមួយកំណត់ត្រាមានកាលបរិច្ឆេទ',
      'គណនីបុគ្គលិកច្រើន',
      'ជំនួយអាទិភាព',
    ],
    cta: { label: 'ទាក់ទងយើង', link: '/support' },
  },
];

/** Short facts shown under the hero instead of a separate trust section. */
const EN_TRUST_POINTS = [
  'Screening support, not a diagnosis',
  'Your family data stays private',
  'Khmer and English',
] as const;

const KM_TRUST_POINTS = [
  'ជំនួយការវាយតម្លៃ មិនមែនការធ្វើរោគវិនិច្ឆ័យ',
  'ទិន្នន័យគ្រួសាររបស់អ្នករក្សាជាឯកជន',
  'ភាសាខ្មែរ និងអង់គ្លេស',
] as const;

const EN_AUTISM_NOTES = [
  {
    title: 'Every child is unique',
    description: 'Observations are organized around your child, not rigid checklists.',
  },
  {
    title: 'Screening is a starting point',
    description: 'Structured notes prepare families for better conversations with doctors.',
  },
  {
    title: 'Progress works best as a team',
    description: 'Shared context helps parents, pediatricians, and schools work together.',
  },
] as const;

const KM_AUTISM_NOTES = [
  {
    title: 'កុមារម្នាក់ៗមានភាពពិសេសរៀងៗខ្លួន',
    description: 'AutiCare រៀបចំការសង្កេតជុំវិញកុមារផ្ទាល់ មិនមែនជាទម្រង់ទូទៅឡើយ។',
  },
  {
    title: 'ការវាយតម្លៃគឺជាចំណុចចាប់ផ្តើម',
    description: 'កំណត់ត្រាជួយអ្នករៀបចំការពិភាក្សាកាន់តែប្រសើរជាមួយវេជ្ជបណ្ឌិត។',
  },
  {
    title: 'ការរីកចម្រើនកើតពីកិច្ចសហការ',
    description: 'ឪពុកម្តាយ វេជ្ជបណ្ឌិត និងគ្រូធ្វើការរួមគ្នាដើម្បីអនាគតកុមារ។',
  },
] as const;

@Component({
  standalone: true,
  imports: [RouterLink, NavIconComponent],
  template: `
    <main class="landing-page">
      <header class="site-header">
        <div class="nav-shell">
          <a class="brand" routerLink="/" aria-label="AutiCare home">
            <span class="brand-logo-frame">
              <img
                src="/images/auticare-logo.png"
                alt=""
                aria-hidden="true"
                width="36"
                height="36"
              />
            </span>
            <span class="brand-text">AutiCare</span>
          </a>

          <nav class="desktop-nav" aria-label="Main navigation">
            <a href="#home" aria-current="page" (click)="scrollToSection('home', $event)">{{
              currentLang() === 'km' ? 'ទំព័រដើម' : 'Home'
            }}</a>
            <a href="#features" (click)="scrollToSection('features', $event)">{{
              currentLang() === 'km' ? 'លក្ខណៈពិសេស' : 'Features'
            }}</a>
            <a href="#how-it-works" (click)="scrollToSection('how-it-works', $event)">{{
              currentLang() === 'km' ? 'ដំណើរការ' : 'How it works'
            }}</a>
            <a href="#about-autism" (click)="scrollToSection('about-autism', $event)">{{
              currentLang() === 'km' ? 'អំពីអូទីសឹម' : 'About autism'
            }}</a>
            <a href="#pricing" (click)="scrollToSection('pricing', $event)">{{
              currentLang() === 'km' ? 'តម្លៃ' : 'Pricing'
            }}</a>
          </nav>

          <div class="header-actions">
            <button
              type="button"
              class="topbar-lang-toggle"
              (click)="toggleLanguage()"
              [attr.aria-label]="
                currentLang() === 'km' ? 'ប្តូរទៅភាសាអង់គ្លេស' : 'Switch language to Khmer'
              "
              [title]="currentLang() === 'km' ? 'ប្តូរទៅភាសាអង់គ្លេស' : 'Switch language to Khmer'"
            >
              <span class="lang-flag" aria-hidden="true">{{
                currentLang() === 'km' ? '🇰🇭' : '🇬🇧'
              }}</span>
              <span class="lang-text">{{ currentLang() === 'km' ? 'ភាសាខ្មែរ' : 'English' }}</span>
            </button>

            @if (isAuthenticated()) {
              <a class="dashboard-link" [routerLink]="dashboardPath()">
                <span>{{
                  currentLang() === 'km' ? 'ទៅកាន់ផ្ទាំងគ្រប់គ្រង' : 'Go to Dashboard'
                }}</span>
                <svg
                  viewBox="0 0 20 20"
                  width="15"
                  height="15"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                    clip-rule="evenodd"
                  />
                </svg>
              </a>
              <span
                class="user-avatar"
                [attr.aria-label]="userDisplayName()"
                [title]="userDisplayName()"
              >
                {{ userInitials() }}
              </span>
            } @else {
              <a class="signup-link" routerLink="/register">
                <span>{{ currentLang() === 'km' ? 'ចុះឈ្មោះ' : 'Signup' }}</span>
              </a>
              <a class="login-link" routerLink="/login">
                <svg
                  viewBox="0 0 20 20"
                  width="16"
                  height="16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 9a7 7 0 1 1 14 0H3Z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>{{ currentLang() === 'km' ? 'ចូលប្រើ' : 'Login' }}</span>
              </a>
            }

            <button
              type="button"
              class="mobile-menu-toggle"
              (click)="toggleMobileMenu()"
              [attr.aria-expanded]="mobileMenuOpen()"
              [attr.aria-label]="
                mobileMenuOpen()
                  ? currentLang() === 'km'
                    ? 'បិទម៉ឺនុយ'
                    : 'Close navigation menu'
                  : currentLang() === 'km'
                    ? 'បើកម៉ឺនុយ'
                    : 'Open navigation menu'
              "
              aria-controls="mobile-nav-drawer"
            >
              <span class="hamburger-bar top" [class.open]="mobileMenuOpen()"></span>
              <span class="hamburger-bar mid" [class.open]="mobileMenuOpen()"></span>
              <span class="hamburger-bar bot" [class.open]="mobileMenuOpen()"></span>
            </button>
          </div>
        </div>
      </header>

      <!-- Mobile Navigation Drawer -->
      @if (mobileMenuOpen()) {
        <div class="mobile-drawer-backdrop" (click)="closeMobileMenu()" aria-hidden="true"></div>
        <aside
          id="mobile-nav-drawer"
          class="mobile-drawer"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="currentLang() === 'km' ? 'ម៉ឺនុយចល័ត' : 'Mobile navigation'"
        >
          <div class="mobile-drawer-header">
            <a class="brand" routerLink="/" (click)="closeMobileMenu()" aria-label="AutiCare home">
              <span class="brand-logo-frame">
                <img
                  src="/images/auticare-logo.png"
                  alt=""
                  aria-hidden="true"
                  width="32"
                  height="32"
                />
              </span>
              <span class="brand-text">AutiCare</span>
            </a>
            <button
              type="button"
              class="mobile-drawer-close"
              (click)="closeMobileMenu()"
              [attr.aria-label]="currentLang() === 'km' ? 'បិទម៉ឺនុយ' : 'Close menu'"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav class="mobile-drawer-nav" aria-label="Mobile navigation links">
            <a href="#home" (click)="scrollToSection('home', $event)">
              <span class="drawer-icon" aria-hidden="true">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              <span class="drawer-label">{{ currentLang() === 'km' ? 'ទំព័រដើម' : 'Home' }}</span>
              <span class="drawer-arrow" aria-hidden="true">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </a>
            <a href="#features" (click)="scrollToSection('features', $event)">
              <span class="drawer-icon" aria-hidden="true">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect width="7" height="9" x="3" y="3" rx="1.5" />
                  <rect width="7" height="5" x="14" y="3" rx="1.5" />
                  <rect width="7" height="9" x="14" y="12" rx="1.5" />
                  <rect width="7" height="5" x="3" y="16" rx="1.5" />
                </svg>
              </span>
              <span class="drawer-label">{{
                currentLang() === 'km' ? 'លក្ខណៈពិសេស' : 'Features'
              }}</span>
              <span class="drawer-arrow" aria-hidden="true">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </a>
            <a href="#how-it-works" (click)="scrollToSection('how-it-works', $event)">
              <span class="drawer-icon" aria-hidden="true">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
              </span>
              <span class="drawer-label">{{
                currentLang() === 'km' ? 'ដំណើរការ' : 'How it works'
              }}</span>
              <span class="drawer-arrow" aria-hidden="true">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </a>
            <a href="#about-autism" (click)="scrollToSection('about-autism', $event)">
              <span class="drawer-icon" aria-hidden="true">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                  />
                </svg>
              </span>
              <span class="drawer-label">{{
                currentLang() === 'km' ? 'អំពីអូទីសឹម' : 'About autism'
              }}</span>
              <span class="drawer-arrow" aria-hidden="true">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </a>
            <a href="#pricing" (click)="scrollToSection('pricing', $event)">
              <span class="drawer-icon" aria-hidden="true">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z"
                  />
                  <circle cx="7.5" cy="7.5" r="1.5" />
                </svg>
              </span>
              <span class="drawer-label">{{ currentLang() === 'km' ? 'តម្លៃ' : 'Pricing' }}</span>
              <span class="drawer-arrow" aria-hidden="true">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </a>
          </nav>

          <div class="mobile-drawer-footer">
            @if (isAuthenticated()) {
              <a
                class="mobile-drawer-primary-btn"
                [routerLink]="dashboardPath()"
                (click)="closeMobileMenu()"
              >
                {{ currentLang() === 'km' ? 'ទៅកាន់ផ្ទាំងគ្រប់គ្រង' : 'Go to Dashboard' }}
              </a>
            } @else {
              <a
                class="mobile-drawer-primary-btn"
                routerLink="/register"
                (click)="closeMobileMenu()"
              >
                {{ currentLang() === 'km' ? 'ចុះឈ្មោះបង្កើតគណនី' : 'Sign Up Free' }}
              </a>
              <a
                class="mobile-drawer-secondary-btn"
                routerLink="/login"
                (click)="closeMobileMenu()"
              >
                {{ currentLang() === 'km' ? 'ចូលប្រើគណនី' : 'Login' }}
              </a>
            }
          </div>
        </aside>
      }

      <!-- High-Impact Hero Section -->
      <section id="home" class="hero-section">
        <div class="hero-copy">
          <h1>
            {{
              currentLang() === 'km'
                ? 'ការគាំទ្រសម្រាប់គ្រប់ជំហាននៃការលូតលាស់'
                : "Support for every step of your child's journey"
            }}
          </h1>
          <p class="hero-subtitle">
            {{
              currentLang() === 'km'
                ? 'កម្មវិធីតាមដានការលូតលាស់ សកម្មភាពប្រចាំថ្ងៃ និងតភ្ជាប់ជាមួយអ្នកជំនាញកុមារ។'
                : 'Guided developmental screening, tailored daily activities, and connected care teams.'
            }}
          </p>

          <div class="hero-actions">
            @if (isAuthenticated()) {
              <a class="primary-action" [routerLink]="dashboardPath()">{{
                currentLang() === 'km' ? 'ទៅកាន់ផ្ទាំងគ្រប់គ្រង' : 'Go to Dashboard'
              }}</a>
            } @else {
              <a class="primary-action" routerLink="/register">{{
                currentLang() === 'km' ? 'ចាប់ផ្តើមប្រើប្រាស់' : 'Get started'
              }}</a>
            }
            <a
              class="secondary-action"
              href="#how-it-works"
              (click)="scrollToSection('how-it-works', $event)"
            >
              {{ currentLang() === 'km' ? 'របៀបដែលកម្មវិធីដំណើរការ' : 'Learn how it works' }}
            </a>
          </div>

          <ul
            class="hero-trust"
            [attr.aria-label]="currentLang() === 'km' ? 'ការធានា' : 'Our promises'"
          >
            @for (point of trustPoints(); track point) {
              <li>
                <ac-nav-icon name="check" />
                <span>{{ point }}</span>
              </li>
            }
          </ul>
        </div>

        <div class="hero-media">
          <!-- Background Organic Pastel Blob -->
          <div class="hero-blob-backdrop" aria-hidden="true"></div>

          <!-- Top-Right Playful Doodle Heart -->
          <div class="hero-doodle-heart" aria-hidden="true">
            <svg width="46" height="42" viewBox="0 0 46 42" fill="none">
              <path
                d="M23 37C23 37 6 25 6 14C6 8 10.5 4 16.5 4C20 4 22 6 23 7.5C24 6 26 4 29.5 4C35.5 4 40 8 40 14C40 25 23 37 23 37Z"
                fill="none"
                stroke="var(--ac-color-amber-500)"
                stroke-width="3.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M38 27C40.5 28 42.5 27 44.5 25"
                stroke="var(--ac-color-amber-500)"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
          </div>

          <!-- Playful Joy Tick Marks -->
          <div class="hero-doodle-ticks" aria-hidden="true">
            <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
              <path
                d="M6 16C8 11 11 7 15 3"
                stroke="var(--ac-color-green-500)"
                stroke-width="3"
                stroke-linecap="round"
              />
              <path
                d="M17 18C19 13 21 10 24 6"
                stroke="var(--ac-color-green-500)"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
          </div>

          <!-- Organic Pebble-Framed Photo -->
          <div class="hero-frame-container">
            <picture>
              <source srcset="/images/signup-hero.webp" type="image/webp" />
              <img
                src="/images/signup-hero.png"
                alt="Mother and child smiling while building blocks together"
                width="1411"
                height="1115"
                fetchpriority="high"
              />
            </picture>
          </div>

          <!-- Floating Support & Futures Pill Badge -->
          <div class="hero-floating-badge" role="status">
            <div class="badge-icon-wrap" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="11"
                  cy="7"
                  r="4"
                  stroke="var(--ac-color-action)"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
                <path
                  d="M4 21C4 16.5 7.5 13.5 11.5 13.5"
                  stroke="var(--ac-color-action)"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
                <path
                  d="M16.5 14C15 12.5 13 14 15 16L16.5 17.5L18 16C20 14 18 12.5 16.5 14Z"
                  fill="var(--ac-color-green-500)"
                  stroke="var(--ac-color-action)"
                  stroke-width="1.6"
                  stroke-linejoin="round"
                />
                <path
                  d="M19.5 21C19.5 18.5 18 16.5 16 16.5"
                  stroke="var(--ac-color-action)"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <div class="badge-text-wrap">
              <span class="badge-line-1">
                {{ currentLang() === 'km' ? 'ការគាំទ្រកាន់តែប្រសើរ' : 'Better support.' }}
              </span>
              <span class="badge-line-2">
                {{ currentLang() === 'km' ? 'អនាគតកាន់តែភ្លឺស្វាង' : 'Brighter futures.' }}
              </span>
            </div>
            <div class="badge-heart-wrap" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="var(--ac-color-amber-500)">
                <path
                  d="M10 18.25C10 18.25 1.5 12.8 1.5 6.75C1.5 3.75 3.8 1.5 6.75 1.5C8.4 1.5 9.5 2.5 10 3.25C10.5 2.5 11.6 1.5 13.25 1.5C16.2 1.5 18.5 3.75 18.5 6.75C18.5 12.8 10 18.25 10 18.25Z"
                />
              </svg>
            </div>
          </div>

          <!-- Bottom-Right Botanical Leaf Illustration -->
          <div class="hero-botanical-leaf" aria-hidden="true">
            <svg width="74" height="74" viewBox="0 0 74 74" fill="none">
              <path
                d="M16 68C28 60 46 44 50 20"
                stroke="var(--ac-brand-mint)"
                stroke-width="4.5"
                stroke-linecap="round"
              />
              <ellipse
                cx="30"
                cy="24"
                rx="11"
                ry="6.5"
                transform="rotate(-30 30 24)"
                fill="var(--ac-brand-mint)"
                fill-opacity="0.85"
              />
              <ellipse
                cx="26"
                cy="46"
                rx="11"
                ry="6.5"
                transform="rotate(-15 26 46)"
                fill="var(--ac-brand-mint)"
                fill-opacity="0.85"
              />
              <ellipse
                cx="50"
                cy="20"
                rx="9"
                ry="5.5"
                transform="rotate(-45 50 20)"
                fill="var(--ac-brand-mint)"
                fill-opacity="0.85"
              />
              <ellipse
                cx="54"
                cy="40"
                rx="10"
                ry="6"
                transform="rotate(35 54 40)"
                fill="var(--ac-brand-mint)"
                fill-opacity="0.85"
              />
            </svg>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="tools-section" aria-labelledby="tools-title">
        <div class="section-heading">
          <p class="section-kicker">
            {{ currentLang() === 'km' ? 'អ្វីដែលអ្នកទទួលបាន' : 'What you get' }}
          </p>
          <h2 id="tools-title">
            {{
              currentLang() === 'km'
                ? 'ជំនួយសម្រាប់ពេលវេលារវាងការកត់សម្គាល់ និងការជួបអ្នកជំនាញ'
                : 'Help for the weeks between noticing and being seen'
            }}
          </h2>
          <p>
            {{
              currentLang() === 'km'
                ? 'AutiCare មិនជំនួសអ្នកជំនាញទេ។ វាជួយឱ្យពេលរង់ចាំមិនទទេ។'
                : 'AutiCare does not replace a specialist. It makes the waiting time less empty.'
            }}
          </p>
        </div>

        <div class="tool-grid">
          @for (tool of features(); track tool.title) {
            <article class="tool-card">
              <span class="tool-icon" aria-hidden="true"><ac-nav-icon [name]="tool.icon" /></span>
              <h3>{{ tool.title }}</h3>
              <p>{{ tool.description }}</p>
            </article>
          }
        </div>
      </section>

      <!-- How It Works Section -->
      <section id="how-it-works" class="process-section" aria-labelledby="process-title">
        <div class="process-copy">
          <p class="section-kicker">{{ currentLang() === 'km' ? 'ដំណើរការ' : 'How it works' }}</p>
          <h2 id="process-title">
            {{
              currentLang() === 'km' ? 'របៀបដែល AutiCare គាំទ្រអ្នក' : 'How AutiCare supports you'
            }}
          </h2>

          <ol class="step-list">
            @for (step of steps(); track step.title; let index = $index) {
              <li [class.active]="activeStep() === index">
                <button
                  type="button"
                  class="step-btn"
                  [attr.aria-pressed]="activeStep() === index"
                  (mouseenter)="activeStep.set(index)"
                  (focus)="activeStep.set(index)"
                  (click)="activeStep.set(index)"
                >
                  <span class="step-num">{{ index + 1 }}</span>
                  <span class="step-text">
                    <strong>{{ step.title }}</strong>
                    <span>{{ step.description }}</span>
                  </span>
                </button>
              </li>
            }
          </ol>
        </div>

        <!-- A picture of the real app; the panel for the chosen step lights up. -->
        <div
          class="product-preview"
          role="img"
          [attr.aria-label]="
            currentLang() === 'km'
              ? 'រូបភាពផ្ទាំងគ្រប់គ្រង AutiCare: ព័ត៌មានកុមារ លទ្ធផលពិនិត្យ កំណត់ត្រា និងការណាត់ជួប'
              : 'AutiCare overview: child profile, check-in result, notes and an upcoming visit'
          "
        >
          <div class="preview-window" aria-hidden="true">
            <header class="preview-bar">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="preview-url">auticare.app/overview</span>
            </header>

            <div class="preview-body">
              <!-- Step 1: the child -->
              <section class="pv-card pv-child" [class.lit]="activeStep() === 0">
                <span class="pv-avatar">D</span>
                <span class="pv-child-text">
                  <strong>{{
                    currentLang() === 'km' ? 'ដារ៉ា · ៣ ឆ្នាំ' : 'Dara · 3 years'
                  }}</strong>
                  <small>{{
                    currentLang() === 'km' ? 'ប្រវត្តិរូបរួចរាល់' : 'Profile ready'
                  }}</small>
                </span>
                <span class="pv-pill ok">
                  <ac-nav-icon name="check" />
                  {{ currentLang() === 'km' ? 'បានបន្ថែម' : 'Added' }}
                </span>
              </section>

              <!-- Step 2: the check-in -->
              <section class="pv-card pv-check" [class.lit]="activeStep() === 1">
                <p class="pv-label">
                  {{ currentLang() === 'km' ? 'លទ្ធផលពិនិត្យ' : 'Check-in result' }}
                </p>
                <span class="pv-pill amber">{{
                  currentLang() === 'km' ? 'មធ្យម' : 'Moderate'
                }}</span>
                <ul class="pv-areas">
                  @for (area of previewAreas(); track area.label) {
                    <li>
                      <span>{{ area.label }}</span>
                      <span class="pv-track"
                        ><span [class]="'pv-fill ' + area.tone" [style.width.%]="area.value"></span
                      ></span>
                    </li>
                  }
                </ul>
                <small class="pv-fine">{{
                  currentLang() === 'km' ? 'មិនមែនការធ្វើរោគវិនិច្ឆ័យ' : 'Not a diagnosis'
                }}</small>
              </section>

              <!-- Step 3: notes and patterns -->
              <section class="pv-card pv-notes" [class.lit]="activeStep() === 2">
                <p class="pv-label">
                  {{ currentLang() === 'km' ? '១៤ ថ្ងៃចុងក្រោយ' : 'Last 14 days' }}
                </p>
                <div class="pv-chart">
                  @for (bar of previewBars; track $index) {
                    <span [class.night]="bar.night" [style.height.%]="bar.value"></span>
                  }
                </div>
                <p class="pv-insight">
                  <ac-nav-icon name="trend" />
                  {{
                    currentLang() === 'km'
                      ? 'យប់ពិបាកកើតឡើងបន្ទាប់ពីថ្ងៃមានសំឡេងខ្លាំង'
                      : 'Hard nights follow noisy days'
                  }}
                </p>
              </section>

              <!-- Step 4: the visit -->
              <section class="pv-card pv-visit" [class.lit]="activeStep() === 3">
                <span class="pv-date">
                  <small>{{ currentLang() === 'km' ? 'អង្គារ' : 'Tue' }}</small>
                  <strong>9:00</strong>
                </span>
                <span class="pv-visit-text">
                  <strong>{{
                    currentLang() === 'km' ? 'ការពិនិត្យការលូតលាស់' : 'Developmental check'
                  }}</strong>
                  <small>{{
                    currentLang() === 'km'
                      ? 'កំណត់ត្រាមានកាលបរិច្ឆេទ ១៤ រួចរាល់សម្រាប់ចែករំលែក'
                      : '14 dated notes ready to share'
                  }}</small>
                </span>
                <span class="pv-button">{{ currentLang() === 'km' ? 'មើល' : 'View' }}</span>
              </section>
            </div>
          </div>

          <!-- The assistant floats over the app, as it does in use. -->
          <div class="pv-chat" [class.lit]="activeStep() === 2" aria-hidden="true">
            <span class="pv-chat-head"><ac-nav-icon name="ai" /> Ask AutiCare</span>
            <p class="pv-bubble me">
              {{
                currentLang() === 'km'
                  ? 'ហេតុអ្វីគាត់បិទត្រចៀកនៅផ្សារ?'
                  : 'Why does he cover his ears at the market?'
              }}
            </p>
            <p class="pv-bubble">
              {{
                currentLang() === 'km'
                  ? 'សំឡេងខ្លាំងអាចធ្វើឱ្យកុមារខ្លះមិនស្រួល។ សាកល្បង…'
                  : 'Loud places can overwhelm some children. Try…'
              }}
            </p>
          </div>
        </div>
      </section>

      <!-- About Autism Section -->
      <section id="about-autism" class="autism-section" aria-labelledby="autism-title">
        <div class="section-heading">
          <p class="section-kicker">
            {{ currentLang() === 'km' ? 'អំពីអូទីសឹម' : 'About autism' }}
          </p>
          <h2 id="autism-title">
            {{
              currentLang() === 'km'
                ? 'ការយល់ដឹង និងការគាំទ្រប្រកបដោយសេចក្តីថ្លៃថ្នូរ'
                : 'Understanding and compassionate care'
            }}
          </h2>
          <p>
            {{
              currentLang() === 'km'
                ? 'ការគាំទ្រដ៏ល្អបំផុតកើតចេញពីកិច្ចសហការ និងការយល់ដឹងច្បាស់លាស់។'
                : 'The best support comes from shared context and mutual understanding.'
            }}
          </p>
        </div>

        <div class="autism-grid">
          @for (note of autismNotes(); track note.title) {
            <article>
              <h3>{{ note.title }}</h3>
              <p>{{ note.description }}</p>
            </article>
          }
        </div>
      </section>

      <!-- Pricing -->
      <section id="pricing" class="pricing-section" aria-labelledby="pricing-title">
        <div class="pricing-head">
          <h2 id="pricing-title">
            {{
              currentLang() === 'km'
                ? 'ឥតគិតថ្លៃសម្រាប់គ្រួសារ។ សាមញ្ញសម្រាប់ដៃគូ។'
                : 'Free for families. Simple for partners.'
            }}
          </h2>
          <p>
            {{
              currentLang() === 'km'
                ? 'ឪពុកម្តាយមិនដែលបង់ប្រាក់ទេ។ សាលារៀន និងមន្ទីរពេទ្យជួយគាំទ្រវេទិកានេះ ដោយគ្មានថ្លៃលាក់កំបាំង។'
                : 'Parents never pay. Schools and hospitals keep the platform running, with no hidden costs.'
            }}
          </p>
        </div>

        <div
          class="billing-toggle"
          role="radiogroup"
          [attr.aria-label]="currentLang() === 'km' ? 'រយៈពេលបង់ប្រាក់' : 'Billing period'"
          [class.is-yearly]="billing() === 'yearly'"
        >
          <span class="billing-thumb" aria-hidden="true"></span>
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="billing() === 'monthly'"
            [class.active]="billing() === 'monthly'"
            (click)="billing.set('monthly')"
          >
            {{ currentLang() === 'km' ? 'ប្រចាំខែ' : 'Monthly' }}
          </button>
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="billing() === 'yearly'"
            [class.active]="billing() === 'yearly'"
            (click)="billing.set('yearly')"
          >
            {{ currentLang() === 'km' ? 'ប្រចាំឆ្នាំ' : 'Yearly' }}
          </button>
        </div>

        <div class="pricing-grid">
          @for (plan of plans(); track plan.id) {
            <article class="plan-card" [class.highlighted]="plan.highlighted">
              <header class="plan-head">
                <div class="plan-badges">
                  @if (plan.highlighted) {
                    <span class="plan-badge">
                      <ac-nav-icon name="star" />
                      {{ currentLang() === 'km' ? 'សម្រាប់គ្រប់គ្រួសារ' : 'For every family' }}
                    </span>
                  }
                  @if (billing() === 'yearly' && discountPercent(plan) > 0) {
                    <span class="plan-badge discount">
                      {{
                        currentLang() === 'km'
                          ? 'បញ្ចុះ ' + discountPercent(plan) + '%'
                          : discountPercent(plan) + '% off'
                      }}
                    </span>
                  }
                </div>
                <h3>{{ plan.name }}</h3>
                <p class="plan-info">{{ plan.info }}</p>
                <p class="plan-price">
                  <!-- Re-created on every change so the price animates in. -->
                  @for (amount of [plan.price[billing()]]; track amount) {
                    <span class="plan-amount">{{ priceLabel(amount) }}</span>
                  }
                  @if (plan.price.monthly > 0) {
                    <span class="plan-per">{{ currentLang() === 'km' ? '/ខែ' : '/month' }}</span>
                  }
                </p>
                <p class="plan-billed">
                  @if (plan.price.monthly === 0) {
                    {{ currentLang() === 'km' ? 'ឥតគិតថ្លៃជារៀងរហូត' : 'Free forever' }}
                  } @else if (billing() === 'yearly') {
                    {{ currentLang() === 'km' ? 'គិតថ្លៃប្រចាំឆ្នាំ' : 'Billed yearly' }}
                  } @else {
                    {{ currentLang() === 'km' ? 'គិតថ្លៃប្រចាំខែ' : 'Billed monthly' }}
                  }
                </p>
              </header>

              <ul class="plan-features">
                @for (feature of plan.features; track feature) {
                  <li>
                    <ac-nav-icon name="check" />
                    <span>{{ feature }}</span>
                  </li>
                }
              </ul>

              <footer class="plan-foot">
                <a
                  class="plan-cta"
                  [class.primary]="plan.highlighted"
                  [routerLink]="plan.cta.link"
                  >{{ plan.cta.label }}</a
                >
              </footer>
            </article>
          }
        </div>
      </section>

      <!-- Final Call to Action -->
      <section id="start" class="cta-section" aria-labelledby="cta-title">
        <h2 id="cta-title">
          {{
            currentLang() === 'km'
              ? 'តើអ្នកត្រៀមខ្លួនចាប់ផ្តើមដំណើរហើយឬនៅ?'
              : 'Ready to start the journey?'
          }}
        </h2>
        <p>
          {{
            currentLang() === 'km'
              ? 'បង្កើតគណនីគ្រួសារឥតគិតថ្លៃ ដើម្បីចាប់ផ្តើមតាមដានការលូតលាស់របស់កុមារ។'
              : 'Create a free family account and start organizing support in one calm workspace.'
          }}
        </p>
        @if (isAuthenticated()) {
          <a [routerLink]="dashboardPath()">{{
            currentLang() === 'km' ? 'ទៅកាន់ផ្ទាំងគ្រប់គ្រង' : 'Go to Dashboard'
          }}</a>
        } @else {
          <a routerLink="/register">{{
            currentLang() === 'km' ? 'បង្កើតគណនី' : 'Create account'
          }}</a>
        }
      </section>

      <!-- Site Footer -->
      <footer class="site-footer">
        <div class="footer-main">
          <section class="footer-about">
            <a class="footer-brand" routerLink="/" aria-label="AutiCare home">
              <span class="footer-logo">
                <img
                  src="/images/auticare-logo.png"
                  alt=""
                  aria-hidden="true"
                  width="40"
                  height="40"
                  loading="lazy"
                />
              </span>
              <span>AutiCare</span>
            </a>
            <p>
              {{
                currentLang() === 'km'
                  ? 'ជំនួយសម្រាប់គ្រួសារនៅកម្ពុជា ក្នុងរយៈពេលរវាងការកត់សម្គាល់ និងការជួបអ្នកជំនាញ។'
                  : 'Support for families in Cambodia through the weeks between noticing and being seen.'
              }}
            </p>
            @if (!isAuthenticated()) {
              <a class="footer-cta" routerLink="/register">
                {{ currentLang() === 'km' ? 'បង្កើតគណនីឥតគិតថ្លៃ' : 'Create a free account' }}
                <span aria-hidden="true">→</span>
              </a>
            }
          </section>

          <nav class="footer-col" aria-labelledby="footer-product">
            <h2 id="footer-product">{{ currentLang() === 'km' ? 'កម្មវិធី' : 'Product' }}</h2>
            <a href="#features" (click)="scrollToSection('features', $event)">{{
              currentLang() === 'km' ? 'លក្ខណៈពិសេស' : 'Features'
            }}</a>
            <a href="#how-it-works" (click)="scrollToSection('how-it-works', $event)">{{
              currentLang() === 'km' ? 'ដំណើរការ' : 'How it works'
            }}</a>
            <a href="#about-autism" (click)="scrollToSection('about-autism', $event)">{{
              currentLang() === 'km' ? 'អំពីអូទីសឹម' : 'About autism'
            }}</a>
            <a href="#pricing" (click)="scrollToSection('pricing', $event)">{{
              currentLang() === 'km' ? 'តម្លៃ' : 'Pricing'
            }}</a>
          </nav>

          <nav class="footer-col" aria-labelledby="footer-help">
            <h2 id="footer-help">{{ currentLang() === 'km' ? 'ជំនួយ' : 'Help' }}</h2>
            <a routerLink="/support">{{
              currentLang() === 'km' ? 'មជ្ឈមណ្ឌលជំនួយ' : 'Help Center'
            }}</a>
            <a routerLink="/crisis">{{
              currentLang() === 'km' ? 'ជំនួយបន្ទាន់' : 'Crisis support'
            }}</a>
            <a routerLink="/support">{{
              currentLang() === 'km' ? 'ទំនាក់ទំនងយើង' : 'Contact us'
            }}</a>
          </nav>

          <nav class="footer-col" aria-labelledby="footer-legal">
            <h2 id="footer-legal">{{ currentLang() === 'km' ? 'ច្បាប់' : 'Legal' }}</h2>
            <a routerLink="/privacy">{{
              currentLang() === 'km' ? 'គោលការណ៍ឯកជនភាព' : 'Privacy policy'
            }}</a>
            <a routerLink="/terms">{{
              currentLang() === 'km' ? 'លក្ខខណ្ឌប្រើប្រាស់' : 'Terms of use'
            }}</a>
          </nav>
        </div>

        <!-- The medical notice and the emergency route get their own row, not fine print. -->
        <div class="footer-notice">
          <p>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" />
            </svg>
            <span>
              {{
                currentLang() === 'km'
                  ? 'AutiCare ផ្តល់ជំនួយការវាយតម្លៃ និងព័ត៌មានអប់រំ។ វាមិនមែនជាការធ្វើរោគវិនិច្ឆ័យ ឬផែនការព្យាបាលទេ ហើយមិនជំនួសគ្រូពេទ្យដែលមានគុណវុឌ្ឍិឡើយ។'
                  : 'AutiCare offers screening support and educational information. It is not a diagnosis or a treatment plan, and it does not replace a qualified clinician.'
              }}
            </span>
          </p>
          <a class="footer-crisis" routerLink="/crisis">
            {{
              currentLang() === 'km'
                ? 'ក្នុងករណីបន្ទាន់ សូមមើលលេខទូរស័ព្ទជំនួយ'
                : 'In an emergency, see who to call'
            }}
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div class="footer-bottom">
          <p class="copyright">
            © {{ currentYear }} AutiCare ·
            {{
              currentLang() === 'km'
                ? 'រក្សាសិទ្ធិគ្រប់យ៉ាង · ជាភាសាខ្មែរ និងអង់គ្លេស'
                : 'All rights reserved · In Khmer and English'
            }}
          </p>
          <div class="footer-bottom-actions">
            <button type="button" class="footer-lang" (click)="toggleLanguage()">
              {{ currentLang() === 'km' ? 'English' : 'ភាសាខ្មែរ' }}
            </button>
            <a class="footer-top" href="#home" (click)="scrollToSection('home', $event)">
              {{ currentLang() === 'km' ? 'ត្រឡប់ទៅខាងលើ' : 'Back to top' }}
              <span aria-hidden="true">↑</span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        background: var(--ac-color-background);
        color: var(--ac-color-text-strong);
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      .landing-page {
        min-height: 100svh;
        background: var(--ac-color-background);
      }

      /* ==================== FLOATING PILL NAVBAR ==================== */
      .site-header {
        position: sticky;
        top: 18px;
        z-index: 1000;
        width: 100%;
        padding: 0 clamp(16px, 3.5vw, 40px);
        background: transparent;
        pointer-events: none;
      }

      .nav-shell {
        pointer-events: auto;
        max-width: 1240px;
        margin: 0 auto;
        height: 70px;
        background: var(--ac-color-surface);
        border-radius: 9999px;
        box-shadow:
          0 12px 32px -4px color-mix(in srgb, var(--ac-color-shadow) 8%, transparent),
          0 2px 8px color-mix(in srgb, var(--ac-color-shadow) 4%, transparent),
          0 0 0 1px color-mix(in srgb, var(--ac-color-black) 4%, transparent);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12px 0 24px;
        gap: 12px;
        transition:
          box-shadow 0.25s ease,
          transform 0.25s ease;
      }

      /* Brand Identity */
      .brand,
      .footer-brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        flex-shrink: 0;
      }

      .brand-logo-frame {
        width: 38px;
        height: 38px;
        border-radius: 9999px;
        overflow: hidden;
        display: grid;
        place-items: center;
        background: var(--ac-color-surface);
        box-shadow: 0 2px 10px color-mix(in srgb, var(--ac-brand-500) 14%, transparent);
        border: 1px solid color-mix(in srgb, var(--ac-brand-500) 16%, transparent);
        transition: transform 0.22s ease;
      }

      .brand:hover .brand-logo-frame {
        transform: scale(1.08) rotate(-3deg);
      }

      .brand-logo-frame img,
      .footer-brand img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .brand-text {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.03em;
        background: linear-gradient(
          135deg,
          var(--ac-color-action-deep) 0%,
          var(--ac-color-action) 50%,
          var(--ac-color-action-deep) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        line-height: 1;
      }

      /* Floating Center Pill Navigation */
      .desktop-nav {
        display: flex;
        align-items: center;
        gap: 3px;
        background: transparent;
        padding: 0;
        border: none;
        box-shadow: none;
      }

      .desktop-nav a {
        display: inline-flex;
        align-items: center;
        padding: 8px 13px;
        border-radius: 9999px;
        color: var(--ac-color-text-body);
        font-size: 14.5px;
        font-weight: 500;
        white-space: nowrap;
        text-decoration: none;
        line-height: 1.25;
        transition: all 0.18s ease;
      }

      .desktop-nav a:hover {
        color: var(--ac-color-action);
        background: color-mix(in srgb, var(--ac-brand-500) 6%, transparent);
      }

      .desktop-nav a[aria-current='page'],
      .desktop-nav a.active {
        color: var(--ac-color-action);
        background: color-mix(in srgb, var(--ac-brand-500) 10%, transparent);
        font-weight: 600;
        padding: 8px 16px;
        box-shadow: none;
      }

      /* Header Actions */
      .header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }

      .topbar-lang-toggle {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 0 14px;
        height: 42px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 9999px;
        background: var(--ac-color-slate-50);
        color: var(--ac-color-slate-600);
        font-family: inherit;
        font-size: 13.5px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 1px 2px color-mix(in srgb, var(--ac-color-shadow) 4%, transparent);
        transition: all 0.18s ease;
      }

      .topbar-lang-toggle:hover {
        background: var(--ac-color-surface);
        border-color: var(--ac-color-action);
        color: var(--ac-color-action);
      }

      .topbar-lang-toggle:focus-visible {
        outline: 2px solid var(--ac-color-action);
        outline-offset: 2px;
      }

      .topbar-lang-toggle .lang-flag {
        font-size: 16px;
        line-height: 1;
      }

      .topbar-lang-toggle .lang-text {
        font-size: 13.5px;
        line-height: 1;
        font-weight: 600;
      }

      .signup-link {
        height: 42px;
        padding: 0 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 9999px;
        color: var(--ac-color-text-body);
        font-size: 14.5px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.18s ease;
      }

      .signup-link:hover {
        color: var(--ac-color-action);
        background: color-mix(in srgb, var(--ac-brand-500) 8%, transparent);
      }

      /* Prominent Pill Button with AutiCare Original Brand Palette */
      .login-link,
      .dashboard-link {
        height: 46px;
        padding: 0 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 9999px;
        background: linear-gradient(
          135deg,
          var(--ac-color-action) 0%,
          var(--ac-color-action-deep) 100%
        );
        color: var(--ac-color-text-on-action);
        font-size: 14.5px;
        font-weight: 600;
        text-decoration: none;
        box-shadow: 0 4px 14px color-mix(in srgb, var(--ac-brand-500) 28%, transparent);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .login-link:hover,
      .dashboard-link:hover {
        background: linear-gradient(
          135deg,
          var(--ac-color-action-mid) 0%,
          var(--ac-color-action-deep) 100%
        );
        transform: translateY(-1px);
        box-shadow: 0 6px 18px color-mix(in srgb, var(--ac-brand-500) 38%, transparent);
        color: var(--ac-color-text-on-action);
      }

      .login-link:active,
      .dashboard-link:active {
        transform: translateY(0);
      }

      .login-link svg,
      .dashboard-link svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .user-avatar {
        width: 38px;
        height: 38px;
        border-radius: 9999px;
        background: linear-gradient(135deg, var(--ac-color-action), var(--ac-color-teal-accent));
        color: var(--ac-color-text-on-action);
        border: 2px solid var(--ac-color-white);
        box-shadow: 0 2px 8px color-mix(in srgb, var(--ac-brand-500) 25%, transparent);
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 13.5px;
        flex-shrink: 0;
      }

      /* Hero Section */
      .hero-section {
        min-height: 100svh;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.16fr);
        align-items: center;
        gap: 44px;
        padding: 32px clamp(20px, 4.5vw, 64px) 48px;
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--ac-brand-50) 95%, transparent) 0%,
          color-mix(in srgb, var(--ac-brand-50) 75%, transparent) 100%
        );
      }

      .hero-copy {
        display: flex;
        flex-direction: column;
        gap: 24px;
        max-width: 640px;
      }

      .hero-section h1 {
        font-size: clamp(48px, 5.8vw, 68px);
        line-height: 1.08;
        font-weight: 900;
        color: var(--ac-color-text-strong);
        letter-spacing: -0.03em;
        text-wrap: balance;
      }

      .hero-subtitle {
        font-size: clamp(18px, 2vw, 22px);
        line-height: 1.6;
        color: var(--ac-color-text-body);
        max-width: 560px;
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-top: 8px;
      }

      .primary-action {
        height: 52px;
        border-radius: 999px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 32px;
        font-size: 16px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        box-shadow: 0 8px 20px color-mix(in srgb, var(--ac-brand-800) 18%, transparent);
        transition:
          background 160ms ease,
          transform 160ms ease,
          box-shadow 160ms ease;
      }

      .primary-action:hover {
        background: var(--ac-color-action-alt);
        transform: translateY(-1px);
        box-shadow: 0 12px 24px color-mix(in srgb, var(--ac-brand-800) 24%, transparent);
      }

      .secondary-action {
        height: 52px;
        border-radius: 999px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-grey);
        color: var(--ac-color-text-strong);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 26px;
        font-size: 16px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        transition:
          background 160ms ease,
          border-color 160ms ease,
          transform 160ms ease;
      }

      .secondary-action:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
        transform: translateY(-1px);
      }

      /* Modern Organic Blob Hero Frame & Floating Card */
      .hero-media {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 720px;
        margin: 0 auto;
        padding: 20px 14px;
        box-sizing: border-box;
      }

      /* Pastel Mint Organic Blob Background */
      .hero-blob-backdrop {
        position: absolute;
        top: 1%;
        left: -1%;
        width: 102%;
        height: 101%;
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--ac-brand-mint) 70%, transparent) 0%,
          color-mix(in srgb, var(--ac-brand-mint) 45%, transparent) 100%
        );
        border-radius: 46px 88px 46px 80px;
        z-index: 1;
        pointer-events: none;
        transform: rotate(-2deg);
        filter: blur(1px);
      }

      /* Organic Pebble Image Frame - Expanded to Display Full Image */
      .hero-frame-container {
        position: relative;
        z-index: 2;
        width: 100%;
        border-radius: 40px 80px 40px 68px;
        overflow: hidden;
        background: var(--ac-color-surface);
        box-shadow:
          0 24px 50px -12px color-mix(in srgb, var(--ac-color-shadow) 16%, transparent),
          0 0 0 1px color-mix(in srgb, var(--ac-color-white) 85%, transparent);
      }

      .hero-frame-container img {
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 1411 / 1115;
        object-fit: contain;
        background: var(--ac-color-surface);
      }

      /* Playful Top-Right Hand-Drawn Heart Doodle */
      .hero-doodle-heart {
        position: absolute;
        top: -6px;
        right: 18px;
        z-index: 3;
        pointer-events: none;
        animation: heroDoodleFloat 4s ease-in-out infinite alternate;
      }

      /* Playful Tick Marks over boy */
      .hero-doodle-ticks {
        position: absolute;
        top: 24%;
        left: 40%;
        z-index: 3;
        pointer-events: none;
        opacity: 0.9;
      }

      /* Floating Care Badge */
      .hero-floating-badge {
        position: absolute;
        bottom: 12px;
        right: 4px;
        z-index: 4;
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px 12px 14px;
        background: color-mix(in srgb, var(--ac-color-white) 95%, transparent);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 999px;
        border: 1px solid color-mix(in srgb, var(--ac-color-border-slate) 90%, transparent);
        box-shadow:
          0 16px 36px -6px color-mix(in srgb, var(--ac-color-shadow) 16%, transparent),
          0 2px 8px color-mix(in srgb, var(--ac-color-shadow) 4%, transparent);
        transition:
          transform 200ms ease,
          box-shadow 200ms ease;
      }

      .hero-floating-badge:hover {
        transform: translateY(-2px);
        box-shadow:
          0 20px 40px -6px color-mix(in srgb, var(--ac-color-shadow) 20%, transparent),
          0 4px 12px color-mix(in srgb, var(--ac-color-shadow) 6%, transparent);
      }

      .badge-icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--ac-brand-100) 65%, transparent);
        color: var(--ac-color-action);
        flex-shrink: 0;
      }

      .badge-text-wrap {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
        text-align: left;
      }

      .badge-line-1,
      .badge-line-2 {
        font-size: 13.5px;
        font-weight: 800;
        color: var(--ac-color-text-slate-strong);
        letter-spacing: -0.01em;
        white-space: nowrap;
      }

      .badge-heart-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--ac-color-amber-500);
        margin-left: 2px;
        flex-shrink: 0;
      }

      /* Botanical Leaf Illustration at Bottom Right */
      .hero-botanical-leaf {
        position: absolute;
        bottom: -20px;
        right: -16px;
        z-index: 1;
        pointer-events: none;
        opacity: 0.88;
      }

      @keyframes heroDoodleFloat {
        0% {
          transform: translateY(0) rotate(0deg);
        }
        100% {
          transform: translateY(-4px) rotate(3deg);
        }
      }

      /* Section Common Headings */
      .section-heading {
        text-align: center;
        display: grid;
        gap: 10px;
        max-width: 680px;
        margin: 0 auto 40px;
      }

      .section-kicker {
        font-size: 13px;
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--ac-color-action);
      }

      .section-heading h2 {
        font-size: clamp(28px, 3.2vw, 38px);
        line-height: 1.25;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .section-heading p {
        font-size: 16px;
        line-height: 1.55;
        color: var(--ac-color-text-body);
      }

      /* Features section (class names kept from the old "Core tools" grid) */
      .tools-section {
        padding: 72px clamp(24px, 5vw, 72px);
      }

      .tool-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 24px;
      }

      .tool-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 18px;
        padding: 28px;
        display: grid;
        gap: 12px;
        transition:
          transform 160ms ease,
          box-shadow 160ms ease;
      }

      .tool-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 28px color-mix(in srgb, var(--ac-brand-800) 8%, transparent);
      }

      .tool-icon {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        background: var(--ac-color-surface-info);
        display: grid;
        place-items: center;
        color: var(--ac-color-action-deep);
      }

      .tool-card h3 {
        font-size: 18px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .tool-card p {
        font-size: 14px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
      }

      /* Process Section */
      .process-section {
        padding: 88px clamp(24px, 5vw, 72px);
        background: var(--ac-color-surface);
        border-top: 1px solid var(--ac-color-border-slate);
        border-bottom: 1px solid var(--ac-color-border-slate);
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
        align-items: center;
        gap: 64px;
      }

      .process-copy h2 {
        font-size: clamp(28px, 3.2vw, 38px);
        line-height: 1.2;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--ac-color-text-strong);
      }

      .step-list {
        list-style: none;
        padding: 0;
        margin: 28px 0 0;
        display: grid;
        gap: 8px;
      }

      .step-btn {
        width: 100%;
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 14px 16px;
        border: 1px solid transparent;
        border-radius: 16px;
        background: transparent;
        text-align: left;
        font: inherit;
        cursor: pointer;
        transition:
          background 200ms ease,
          border-color 200ms ease,
          box-shadow 200ms ease;
      }

      .step-list li.active .step-btn {
        background: var(--ac-color-surface-slate);
        border-color: var(--ac-color-border-slate);
        box-shadow: var(--ac-shadow-xs);
      }

      .step-btn:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .step-num {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        border: 2px solid var(--ac-color-border-info);
        background: var(--ac-color-surface);
        color: var(--ac-color-action-mid);
        display: grid;
        place-items: center;
        font-size: 14px;
        font-weight: 800;
        flex-shrink: 0;
        transition:
          background 200ms ease,
          color 200ms ease,
          border-color 200ms ease;
      }

      .step-list li.active .step-num {
        background: var(--ac-color-action-darkest);
        border-color: var(--ac-color-action-darkest);
        color: var(--ac-color-text-on-action);
      }

      .step-text {
        display: grid;
        gap: 4px;
      }

      .step-text strong {
        font-size: 17px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .step-text span {
        font-size: 14.5px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
      }

      /* ---- Product preview ---- */
      .product-preview {
        position: relative;
        padding: 28px 0 28px 28px;
      }

      /* A soft colour field behind the window gives it depth. */
      .product-preview::before {
        content: '';
        position: absolute;
        inset: 0 0 0 10%;
        border-radius: 32px;
        background: linear-gradient(
          135deg,
          var(--ac-color-tint-blue-light),
          var(--ac-color-surface-info) 55%,
          var(--ac-color-sage-light)
        );
      }

      .preview-window {
        position: relative;
        border-radius: 18px;
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        overflow: hidden;
        box-shadow: 0 30px 60px -30px color-mix(in srgb, var(--ac-brand-900) 45%, transparent);
      }

      .preview-bar {
        height: 38px;
        background: var(--ac-color-surface);
        border-bottom: 1px solid var(--ac-color-border-slate);
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 14px;
      }

      .preview-bar .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--ac-color-border-grey);
      }

      .preview-url {
        margin-left: 12px;
        padding: 3px 12px;
        border-radius: 999px;
        background: var(--ac-color-surface-slate);
        font-size: 11.5px;
        color: var(--ac-color-text-muted);
      }

      .preview-body {
        padding: 18px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .pv-card {
        position: relative;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 14px;
        padding: 14px 16px;
        opacity: 0.55;
        transform: scale(0.985);
        transition:
          opacity 260ms ease,
          transform 260ms ease,
          box-shadow 260ms ease,
          border-color 260ms ease;
      }

      .pv-card.lit {
        opacity: 1;
        transform: none;
        border-color: var(--ac-color-action-mid);
        box-shadow:
          0 0 0 4px var(--ac-color-tint-blue-light),
          0 12px 28px -18px color-mix(in srgb, var(--ac-brand-900) 50%, transparent);
      }

      .pv-label {
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--ac-color-text-muted);
      }

      .pv-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }

      .pv-pill ac-nav-icon {
        width: 13px;
        height: 13px;
      }

      .pv-pill.ok {
        background: var(--ac-color-green-50);
        color: var(--ac-color-green-600);
      }

      .pv-pill.amber {
        background: var(--ac-color-amber-tint-cream);
        color: var(--ac-color-amber-dark);
      }

      /* Step 1 */
      .pv-child {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .pv-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--ac-color-primary);
        color: var(--ac-color-ink-f);
        font-weight: 800;
      }

      .pv-child-text,
      .pv-visit-text {
        display: grid;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }

      .pv-child-text strong,
      .pv-visit-text strong {
        font-size: 14.5px;
        color: var(--ac-color-text-strong);
      }

      .pv-child-text small,
      .pv-visit-text small,
      .pv-fine {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      /* Step 2 */
      .pv-check {
        display: grid;
        gap: 10px;
        align-content: start;
      }

      .pv-check .pv-pill {
        justify-self: start;
      }

      .pv-areas {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 7px;
      }

      .pv-areas li {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 70px;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--ac-color-text-body);
      }

      .pv-track {
        height: 6px;
        border-radius: 999px;
        background: var(--ac-color-surface-slate);
        overflow: hidden;
      }

      .pv-fill {
        display: block;
        height: 100%;
        border-radius: 999px;
        background: var(--ac-color-green-teal);
      }

      .pv-fill.amber {
        background: var(--ac-color-amber-dark);
      }

      /* Step 3 */
      .pv-notes {
        display: grid;
        gap: 10px;
        align-content: start;
      }

      .pv-chart {
        height: 64px;
        display: flex;
        align-items: flex-end;
        gap: 4px;
      }

      .pv-chart span {
        flex: 1;
        border-radius: 4px 4px 2px 2px;
        background: var(--ac-color-ice-blue-soft);
      }

      .pv-chart span.night {
        background: var(--ac-color-action-mid);
      }

      .pv-insight {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12.5px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
      }

      .pv-insight ac-nav-icon {
        width: 15px;
        height: 15px;
      }

      /* Step 4 */
      .pv-visit {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .pv-date {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: var(--ac-color-action-darkest);
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
        align-content: center;
        line-height: 1.1;
      }

      .pv-date small {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        opacity: 0.8;
      }

      .pv-date strong {
        font-size: 13px;
      }

      .pv-button {
        padding: 7px 14px;
        border-radius: 999px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-size: 12px;
        font-weight: 700;
      }

      /* Floating assistant */
      .pv-chat {
        position: absolute;
        left: -8px;
        bottom: -6px;
        width: min(250px, 62%);
        padding: 12px;
        border-radius: 16px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        box-shadow: 0 22px 44px -22px color-mix(in srgb, var(--ac-brand-900) 55%, transparent);
        display: grid;
        gap: 8px;
        transform: translateY(6px);
        opacity: 0.92;
        transition:
          transform 260ms ease,
          opacity 260ms ease,
          border-color 260ms ease;
      }

      .pv-chat.lit {
        transform: none;
        opacity: 1;
        border-color: var(--ac-color-action-mid);
      }

      .pv-chat-head {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 800;
        color: var(--ac-color-action-deep);
      }

      .pv-chat-head ac-nav-icon {
        width: 15px;
        height: 15px;
      }

      .pv-bubble {
        padding: 8px 11px;
        border-radius: 12px 12px 12px 4px;
        background: var(--ac-color-surface-slate);
        font-size: 12px;
        line-height: 1.45;
        color: var(--ac-color-text-body);
      }

      .pv-bubble.me {
        justify-self: end;
        border-radius: 12px 12px 4px 12px;
        background: var(--ac-color-action-darkest);
        color: var(--ac-color-text-on-action);
      }

      @media (prefers-reduced-motion: reduce) {
        .pv-card,
        .pv-chat,
        .step-btn,
        .step-num {
          transition: none;
        }
      }

      /* About Autism */
      .autism-section {
        padding: 72px clamp(24px, 5vw, 72px);
        background: var(--ac-color-surface);
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .autism-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 24px;
      }

      .autism-grid article {
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 18px;
        padding: 28px;
        display: grid;
        gap: 10px;
      }

      .autism-grid h3 {
        font-size: 18px;
        font-weight: var(--ac-font-weight-bold);
      }

      .autism-grid p {
        font-size: 15px;
        line-height: 1.55;
        color: var(--ac-color-text-body);
      }

      /* Pricing */
      .pricing-section {
        padding: 88px clamp(24px, 5vw, 72px);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 28px;
      }

      .pricing-head {
        max-width: 640px;
        text-align: center;
      }

      .pricing-head h2 {
        font-size: clamp(28px, 3.2vw, 38px);
        line-height: 1.2;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--ac-color-text-strong);
      }

      .pricing-head p {
        margin-top: 10px;
        font-size: 16px;
        line-height: 1.6;
        color: var(--ac-color-text-body);
      }

      .billing-toggle {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        padding: 4px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 999px;
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-xs);
      }

      .billing-thumb {
        position: absolute;
        top: 4px;
        bottom: 4px;
        left: 4px;
        width: calc(50% - 4px);
        border-radius: 999px;
        background: var(--ac-color-action-darkest);
        transition: transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1);
      }

      .billing-toggle.is-yearly .billing-thumb {
        transform: translateX(100%);
      }

      .billing-toggle button {
        position: relative;
        z-index: 1;
        min-width: 104px;
        height: 38px;
        padding: 0 18px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: var(--ac-color-text-body);
        font: inherit;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: color 220ms ease;
      }

      .billing-toggle button.active {
        color: var(--ac-color-text-on-action);
      }

      .billing-toggle button:focus-visible,
      .plan-cta:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .pricing-grid {
        width: 100%;
        max-width: 1040px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 24px;
        align-items: stretch;
        margin-top: 8px;
      }

      .plan-card {
        position: relative;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 18px;
        background: var(--ac-color-surface);
        box-shadow: var(--ac-shadow-xs);
        overflow: hidden;
        transition:
          transform 200ms ease,
          box-shadow 200ms ease;
      }

      .plan-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 16px 36px -20px color-mix(in srgb, var(--ac-brand-900) 35%, transparent);
      }

      /* The family plan is the one most visitors want: raised and darker. */
      .plan-card.highlighted {
        transform: scale(1.04);
        border-color: var(--ac-color-action-darkest);
        box-shadow: 0 24px 48px -24px color-mix(in srgb, var(--ac-brand-900) 55%, transparent);
        z-index: 1;
      }

      .plan-card.highlighted:hover {
        transform: scale(1.04) translateY(-3px);
      }

      .plan-head {
        position: relative;
        padding: 24px 24px 20px;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .plan-card.highlighted .plan-head {
        background: var(--ac-color-action-darkest);
        border-bottom-color: var(--ac-color-action-darkest);
        color: var(--ac-color-text-on-action);
      }

      .plan-badges {
        position: absolute;
        top: 14px;
        right: 14px;
        display: flex;
        gap: 6px;
      }

      .plan-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        color: var(--ac-color-text-strong);
        font-size: 12px;
        font-weight: 700;
        animation: plan-fade 180ms ease both;
      }

      .plan-badge ac-nav-icon {
        width: 12px;
        height: 12px;
        fill: currentColor;
      }

      .plan-badge.discount {
        background: var(--ac-color-tint-blue-light);
        border-color: var(--ac-color-border-info);
        color: var(--ac-color-action-deep);
      }

      .plan-head h3 {
        font-size: 20px;
        font-weight: 800;
        color: inherit;
      }

      .plan-card:not(.highlighted) .plan-head h3 {
        color: var(--ac-color-text-strong);
      }

      .plan-info {
        margin-top: 4px;
        font-size: 14px;
        color: var(--ac-color-text-muted);
      }

      .plan-card.highlighted .plan-info,
      .plan-card.highlighted .plan-billed,
      .plan-card.highlighted .plan-per {
        color: color-mix(in srgb, var(--ac-color-text-on-action) 75%, transparent);
      }

      .plan-price {
        margin-top: 22px;
        display: flex;
        align-items: baseline;
        gap: 6px;
        min-height: 44px;
      }

      .plan-amount {
        display: inline-block;
        font-size: 38px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums;
        animation: plan-price-in 260ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
      }

      .plan-card:not(.highlighted) .plan-amount {
        color: var(--ac-color-text-strong);
      }

      .plan-per {
        font-size: 15px;
        color: var(--ac-color-text-muted);
      }

      .plan-billed {
        margin-top: 6px;
        font-size: 12.5px;
        color: var(--ac-color-text-muted);
      }

      .plan-features {
        list-style: none;
        margin: 0;
        padding: 22px 24px 26px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        flex: 1;
      }

      .plan-features li {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 14.5px;
        line-height: 1.45;
        color: var(--ac-color-text-body);
      }

      .plan-features ac-nav-icon {
        flex: 0 0 auto;
        width: 18px;
        height: 18px;
        margin-top: 1px;
        color: var(--ac-color-green-teal);
      }

      .plan-foot {
        padding: 16px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .plan-cta {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 46px;
        border-radius: 12px;
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font-size: 15px;
        font-weight: 700;
        text-decoration: none;
        transition:
          background 160ms ease,
          border-color 160ms ease;
      }

      .plan-cta:hover {
        background: var(--ac-color-surface-slate);
        border-color: var(--ac-color-action-mid);
      }

      .plan-cta.primary {
        border-color: var(--ac-color-action-darkest);
        background: var(--ac-color-action-darkest);
        color: var(--ac-color-text-on-action);
      }

      .plan-cta.primary:hover {
        background: var(--ac-color-action-deep);
      }

      @keyframes plan-price-in {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
      }

      @keyframes plan-fade {
        from {
          opacity: 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .plan-amount,
        .plan-badge {
          animation: none;
        }
        .billing-thumb,
        .plan-card {
          transition: none;
        }
      }

      @media (max-width: 900px) {
        .pricing-grid {
          grid-template-columns: 1fr;
          max-width: 440px;
        }

        /* Stacked, the family card leads and is not scaled into its neighbours. */
        .plan-card.highlighted {
          order: -1;
          transform: none;
        }

        .plan-card.highlighted:hover {
          transform: translateY(-3px);
        }
      }

      @media (max-width: 768px) {
        .pricing-section {
          padding: 56px 16px;
        }
      }

      /* CTA Section */
      .cta-section {
        padding: 80px 24px;
        text-align: center;
        background: var(--ac-color-surface-info);
        border-top: 1px solid var(--ac-color-border-info);
        display: grid;
        justify-items: center;
        gap: 20px;
      }

      .cta-section h2 {
        font-size: clamp(30px, 3.6vw, 42px);
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .cta-section p {
        font-size: 18px;
        max-width: 600px;
        color: var(--ac-color-text-body);
      }

      .cta-section a {
        height: 52px;
        border-radius: 14px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 32px;
        font-size: 17px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        transition: background 160ms ease;
      }

      .cta-section a:hover {
        background: var(--ac-color-action-alt);
      }

      /* Site Footer: deep ink, so the page ends with a clear full stop. */
      .site-footer {
        --footer-ink: var(--ac-color-action-darkest);
        --footer-text: var(--ac-color-text-on-action);
        --footer-muted: color-mix(in srgb, var(--ac-color-text-on-action) 72%, transparent);
        --footer-faint: color-mix(in srgb, var(--ac-color-text-on-action) 14%, transparent);
        background: var(--footer-ink);
        color: var(--footer-text);
        padding: 64px clamp(24px, 5vw, 72px) 28px;
      }

      .footer-main {
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr));
        gap: 40px;
      }

      .footer-about p {
        margin-top: 14px;
        max-width: 36ch;
        font-size: 15px;
        line-height: 1.6;
        color: var(--footer-muted);
      }

      .site-footer .footer-brand {
        color: var(--footer-text);
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }

      .footer-logo {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        overflow: hidden;
        flex: 0 0 auto;
        background: var(--ac-color-surface);
      }

      .footer-cta {
        margin-top: 20px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 42px;
        padding: 0 18px;
        border-radius: 999px;
        background: var(--ac-color-surface);
        color: var(--ac-color-action-darkest);
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
        transition: transform 160ms ease;
      }

      .footer-cta:hover {
        transform: translateY(-1px);
      }

      .footer-col {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .footer-col h2 {
        margin-bottom: 4px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--footer-muted);
      }

      .footer-col a,
      .footer-top {
        color: var(--footer-text);
        font-size: 15px;
        text-decoration: none;
        opacity: 0.9;
        transition: opacity 160ms ease;
      }

      .footer-col a:hover,
      .footer-top:hover {
        opacity: 1;
        text-decoration: underline;
        text-underline-offset: 4px;
      }

      .site-footer a:focus-visible,
      .site-footer button:focus-visible {
        outline: 2px solid var(--footer-text);
        outline-offset: 3px;
        border-radius: 4px;
      }

      .footer-notice {
        max-width: 1200px;
        margin: 48px auto 0;
        padding: 18px 20px;
        border: 1px solid var(--footer-faint);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px 24px;
        flex-wrap: wrap;
      }

      .footer-notice p {
        flex: 1 1 420px;
        display: flex;
        gap: 12px;
        align-items: flex-start;
        font-size: 13.5px;
        line-height: 1.55;
        color: var(--footer-muted);
      }

      .footer-notice svg {
        flex: 0 0 auto;
        width: 18px;
        height: 18px;
        margin-top: 1px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
      }

      .footer-crisis {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 16px;
        border-radius: 999px;
        background: var(--ac-color-red-tint-blush);
        color: var(--ac-color-alert-text);
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
      }

      .footer-crisis:hover {
        text-decoration: underline;
      }

      .footer-bottom {
        max-width: 1200px;
        margin: 28px auto 0;
        padding-top: 22px;
        border-top: 1px solid var(--footer-faint);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px 20px;
        flex-wrap: wrap;
      }

      .copyright {
        font-size: 13px;
        color: var(--footer-muted);
      }

      .footer-bottom-actions {
        display: flex;
        align-items: center;
        gap: 18px;
      }

      .footer-lang {
        height: 34px;
        padding: 0 14px;
        border: 1px solid var(--footer-faint);
        border-radius: 999px;
        background: transparent;
        color: var(--footer-text);
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 160ms ease;
      }

      .footer-lang:hover {
        background: var(--footer-faint);
      }

      .footer-top {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
      }

      .mobile-menu-toggle {
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 5px;
        width: 44px;
        height: 44px;
        padding: 0;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        cursor: pointer;
        transition: all 160ms ease;
      }

      .mobile-menu-toggle:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      .hamburger-bar {
        display: block;
        width: 18px;
        height: 2px;
        background: var(--ac-color-text-strong);
        border-radius: 999px;
        transition:
          transform 200ms ease,
          opacity 200ms ease;
      }

      .hamburger-bar.top.open {
        transform: translateY(7px) rotate(45deg);
      }

      .hamburger-bar.mid.open {
        opacity: 0;
      }

      .hamburger-bar.bot.open {
        transform: translateY(-7px) rotate(-45deg);
      }

      /* Mobile Drawer Overlay */
      .mobile-drawer-backdrop {
        position: fixed;
        inset: 0;
        background: color-mix(in srgb, var(--ac-color-shadow) 45%, transparent);
        backdrop-filter: blur(4px);
        z-index: 999;
        animation: fadeIn 180ms ease-out;
      }

      .mobile-drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(340px, 86vw);
        background: var(--ac-color-surface);
        z-index: 1000;
        box-shadow: -10px 0 36px color-mix(in srgb, var(--ac-color-shadow) 18%, transparent);
        display: flex;
        flex-direction: column;
        padding: 20px 18px 24px;
        overflow-y: auto;
        animation: slideInRight 220ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slideInRight {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      .mobile-drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 18px;
        border-bottom: 1px solid var(--ac-color-slate-100);
      }

      .mobile-drawer-header .brand {
        font-size: 22px;
        gap: 10px;
      }

      .mobile-drawer-close {
        width: 38px;
        height: 38px;
        border-radius: 9999px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-slate-50);
        color: var(--ac-color-text-slate);
        display: grid;
        place-items: center;
        cursor: pointer;
        transition: all 180ms ease;
      }

      .mobile-drawer-close:hover {
        background: var(--ac-color-slate-100);
        color: var(--ac-color-text-slate-strong);
        border-color: var(--ac-color-slate-300);
        transform: scale(1.04);
      }

      .mobile-drawer-close svg {
        width: 18px;
        height: 18px;
      }

      .mobile-drawer-nav {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 16px 0;
        flex: 1;
      }

      .mobile-drawer-nav a {
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 10px 12px;
        border-radius: 14px;
        font-size: 15px;
        font-weight: 600;
        color: var(--ac-color-slate-800);
        text-decoration: none;
        min-height: 48px;
        box-sizing: border-box;
        transition: all 180ms ease;
      }

      .mobile-drawer-nav a:hover,
      .mobile-drawer-nav a:focus-visible {
        background: color-mix(in srgb, var(--ac-brand-500) 6%, transparent);
        color: var(--ac-color-action);
      }

      .drawer-icon {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: color-mix(in srgb, var(--ac-brand-500) 8%, transparent);
        color: var(--ac-color-action);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 180ms ease;
      }

      .drawer-icon svg {
        width: 19px;
        height: 19px;
      }

      .mobile-drawer-nav a:hover .drawer-icon,
      .mobile-drawer-nav a:focus-visible .drawer-icon {
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        transform: scale(1.04);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--ac-brand-500) 25%, transparent);
      }

      .drawer-label {
        flex: 1;
        letter-spacing: -0.01em;
      }

      .drawer-arrow {
        color: var(--ac-color-slate-400);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 180ms ease;
      }

      .drawer-arrow svg {
        width: 15px;
        height: 15px;
      }

      .mobile-drawer-nav a:hover .drawer-arrow {
        color: var(--ac-color-action);
        transform: translateX(3px);
      }

      .mobile-drawer-footer {
        margin-top: auto;
        padding-top: 18px;
        border-top: 1px solid var(--ac-color-slate-100);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .mobile-drawer-primary-btn {
        height: 48px;
        border-radius: 9999px;
        background: linear-gradient(
          135deg,
          var(--ac-color-action) 0%,
          var(--ac-color-action-deep) 100%
        );
        color: var(--ac-color-text-on-action);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 20px;
        font-size: 15px;
        font-weight: 600;
        text-decoration: none;
        box-shadow: 0 4px 14px color-mix(in srgb, var(--ac-brand-500) 28%, transparent);
        transition: all 180ms ease;
      }

      .mobile-drawer-primary-btn:hover {
        background: linear-gradient(
          135deg,
          var(--ac-color-action-mid) 0%,
          var(--ac-color-action-deep) 100%
        );
        box-shadow: 0 6px 18px color-mix(in srgb, var(--ac-brand-500) 38%, transparent);
        transform: translateY(-1px);
      }

      .mobile-drawer-secondary-btn {
        height: 46px;
        border-radius: 9999px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        color: var(--ac-color-slate-700);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 20px;
        font-size: 15px;
        font-weight: 600;
        text-decoration: none;
        box-shadow: 0 1px 3px color-mix(in srgb, var(--ac-color-shadow) 4%, transparent);
        transition: all 180ms ease;
      }

      .mobile-drawer-secondary-btn:hover {
        background: var(--ac-color-slate-50);
        border-color: var(--ac-color-slate-300);
        color: var(--ac-color-text-slate-strong);
      }

      @media (max-width: 1024px) {
        .hero-section {
          min-height: 100svh;
          box-sizing: border-box;
          grid-template-columns: 1fr;
          gap: 36px;
          padding: 48px clamp(20px, 4vw, 40px) 44px;
        }

        .hero-copy {
          text-align: center;
          align-items: center;
          margin: 0 auto;
        }

        .hero-section h1,
        .hero-subtitle {
          text-align: center;
        }

        .hero-actions {
          justify-content: center;
        }

        .process-section {
          grid-template-columns: 1fr;
          gap: 40px;
          padding: 56px clamp(20px, 4vw, 40px);
        }

        .footer-main {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .footer-about {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 1180px) {
        .desktop-nav {
          display: none;
        }

        .mobile-menu-toggle {
          display: inline-flex;
        }

        .site-header {
          top: 12px;
          padding: 0 16px;
        }

        .nav-shell {
          height: 60px;
          padding: 0 10px 0 18px;
          gap: 12px;
        }

        .brand-text {
          font-size: 21px;
        }

        .brand-logo-frame {
          width: 32px;
          height: 32px;
        }

        .header-actions {
          gap: 8px;
        }
      }

      @media (max-width: 768px) {
        .site-header {
          top: 14px;
          padding: 0 16px;
        }

        .nav-shell {
          height: 66px;
          padding: 0 12px 0 20px;
          gap: 12px;
        }

        .brand,
        .footer-brand {
          font-size: 22px;
          gap: 10px;
        }

        .brand-text {
          font-size: 23px;
          font-weight: 800;
        }

        .brand-logo-frame {
          width: 38px;
          height: 38px;
        }

        .brand img,
        .footer-brand img {
          width: 38px;
          height: 38px;
        }

        .header-actions {
          gap: 9px;
        }

        .header-actions .login-link {
          display: none;
        }

        .header-actions .signup-link {
          display: none;
        }

        .topbar-lang-toggle {
          height: 44px;
          padding: 0 15px;
          gap: 8px;
          font-size: 14px;
        }

        .topbar-lang-toggle .lang-flag {
          font-size: 17px;
        }

        .topbar-lang-toggle .lang-text {
          font-size: 14px;
          font-weight: 600;
        }

        .mobile-menu-toggle {
          width: 46px;
          height: 46px;
        }

        .dashboard-link {
          height: 42px;
          padding: 0 16px;
          font-size: 14px;
        }

        .user-avatar {
          width: 38px;
          height: 38px;
          font-size: 14px;
        }

        .hero-section {
          min-height: 100svh;
          box-sizing: border-box;
          padding: 100px 16px 28px;
          gap: 18px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--ac-brand-50) 98%, transparent) 0%,
            color-mix(in srgb, var(--ac-brand-50) 70%, transparent) 100%
          );
        }

        .hero-copy {
          gap: 14px;
          text-align: center;
          align-items: center;
          margin: 0 auto;
        }

        .hero-section h1 {
          font-size: clamp(36px, 10.2vw, 52px);
          line-height: 1.18;
          font-weight: 900;
          color: var(--ac-color-text-slate-strong);
          letter-spacing: -0.025em;
          text-wrap: balance;
          text-align: center;
          word-break: normal;
          overflow-wrap: break-word;
        }

        .hero-subtitle {
          font-size: clamp(16px, 4.3vw, 18.5px);
          line-height: 1.52;
          color: var(--ac-color-slate-600);
          margin: 0 auto;
          text-align: center;
          max-width: 490px;
        }

        .hero-actions {
          display: flex;
          flex-direction: row;
          justify-content: center;
          width: 100%;
          gap: 12px;
          margin-top: 4px;
          align-items: center;
        }

        .primary-action,
        .secondary-action {
          width: auto;
          flex: 1;
          max-width: 200px;
          height: 44px;
          font-size: 14.5px;
          font-weight: 600;
          padding: 0 16px;
          border-radius: 999px;
          justify-content: center;
          text-align: center;
          box-sizing: border-box;
        }

        .primary-action {
          box-shadow: 0 8px 18px -4px color-mix(in srgb, var(--ac-brand-800) 28%, transparent);
        }

        .secondary-action {
          box-shadow: 0 2px 8px color-mix(in srgb, var(--ac-color-shadow) 5%, transparent);
        }

        .hero-media {
          max-width: min(440px, 94vw);
          margin: 0 auto;
          padding: 8px 6px 14px;
          box-shadow: none;
          border: none;
          border-radius: 0;
          overflow: visible;
        }

        .hero-frame-container {
          border-radius: 28px 52px 28px 44px;
          max-height: none;
        }

        .hero-frame-container img {
          max-height: none;
          width: 100%;
          height: auto;
          aspect-ratio: 1411 / 1115;
          object-fit: contain;
          background: var(--ac-color-surface);
        }

        .hero-floating-badge {
          bottom: 2px;
          right: -2px;
          padding: 6px 12px 6px 8px;
          gap: 8px;
          border-radius: 999px;
        }

        .badge-icon-wrap {
          width: 26px;
          height: 26px;
        }

        .badge-icon-wrap svg {
          width: 17px;
          height: 17px;
        }

        .badge-line-1,
        .badge-line-2 {
          font-size: 10.5px;
        }

        .badge-heart-wrap svg {
          width: 13px;
          height: 13px;
        }

        .hero-doodle-heart svg {
          width: 32px;
          height: 28px;
        }

        .hero-botanical-leaf svg {
          width: 46px;
          height: 46px;
        }

        .section-heading {
          margin-bottom: 24px;
          gap: 8px;
        }

        .section-heading h2 {
          font-size: clamp(22px, 5.2vw, 28px);
          line-height: 1.28;
        }

        .section-heading p {
          font-size: 14px;
          line-height: 1.5;
        }

        .tools-section {
          padding: 44px 16px;
        }

        .tool-grid {
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .tool-card {
          padding: 20px 16px;
          border-radius: 16px;
          gap: 10px;
        }

        .process-section {
          padding: 44px 16px;
          gap: 28px;
        }

        .step-list {
          margin-top: 18px;
        }

        .step-btn {
          gap: 12px;
          padding: 12px;
        }

        .step-num {
          width: 30px;
          height: 30px;
          font-size: 13px;
        }

        .step-text strong {
          font-size: 15.5px;
        }

        .step-text span {
          font-size: 13.5px;
        }

        .product-preview {
          padding: 16px 0 56px;
        }

        .product-preview::before {
          inset: 0;
          border-radius: 24px;
        }

        .preview-body {
          grid-template-columns: 1fr;
          padding: 12px;
          gap: 10px;
        }

        /* On a phone the cards stay readable: full opacity, highlight only. */
        .pv-card {
          opacity: 1;
          transform: none;
        }

        .pv-chat {
          left: 12px;
          bottom: 0;
          width: min(240px, 80%);
        }

        .autism-section {
          padding: 44px 16px;
        }

        .autism-grid {
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .autism-grid article {
          padding: 20px 16px;
          border-radius: 16px;
        }

        .cta-section {
          padding: 48px 16px;
          gap: 16px;
        }

        .cta-section h2 {
          font-size: clamp(24px, 5.5vw, 32px);
          line-height: 1.25;
        }

        .cta-section p {
          font-size: 15px;
        }

        .cta-section a {
          width: 100%;
          max-width: 300px;
          height: 48px;
          font-size: 15px;
        }

        .site-footer {
          padding: 44px 20px 24px;
        }

        .footer-main {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 32px 20px;
        }

        .footer-col a {
          min-height: 32px;
          display: inline-flex;
          align-items: center;
        }

        .footer-bottom {
          flex-direction: column-reverse;
          align-items: flex-start;
        }
      }

      @media (max-width: 420px) {
        .brand span {
          font-size: 19px;
        }

        .topbar-lang-toggle .lang-text {
          display: none;
        }

        .header-actions .signup-link {
          display: none;
        }
      }

      /* Trust points under the hero (replaces the trust-badge section) */
      .hero-trust {
        list-style: none;
        margin: 22px 0 0;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 10px 22px;
      }

      .hero-trust li {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: var(--ac-color-text-body);
      }

      .hero-trust ac-nav-icon {
        width: 18px;
        height: 18px;
        color: var(--ac-color-green-teal);
      }

      .tool-icon ac-nav-icon {
        width: 22px;
        height: 22px;
      }

      @media (max-width: 768px) {
        .hero-trust {
          justify-content: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);

  readonly currentLang = computed(() => this.i18n.currentLang());

  readonly features = computed(() => (this.currentLang() === 'km' ? KM_FEATURES : EN_FEATURES));
  readonly trustPoints = computed(() =>
    this.currentLang() === 'km' ? KM_TRUST_POINTS : EN_TRUST_POINTS,
  );
  readonly steps = computed(() => (this.currentLang() === 'km' ? KM_STEPS : EN_STEPS));
  readonly autismNotes = computed(() =>
    this.currentLang() === 'km' ? KM_AUTISM_NOTES : EN_AUTISM_NOTES,
  );
  readonly mobileMenuOpen = signal(false);
  readonly currentYear = new Date().getFullYear();

  readonly plans = computed(() => (this.currentLang() === 'km' ? KM_PLANS : EN_PLANS));
  readonly billing = signal<BillingPeriod>('monthly');

  /** Which "how it works" step is highlighted in the preview. */
  readonly activeStep = signal(0);

  /** Illustrative figures for the preview only; nothing here is real data. */
  readonly previewAreas = computed(() =>
    this.currentLang() === 'km'
      ? [
          { label: 'ការប្រាស្រ័យទាក់ទង', value: 68, tone: 'amber' },
          { label: 'សង្គម', value: 52, tone: 'amber' },
          { label: 'ការលេង', value: 28, tone: 'teal' },
        ]
      : [
          { label: 'Communication', value: 68, tone: 'amber' },
          { label: 'Social', value: 52, tone: 'amber' },
          { label: 'Play', value: 28, tone: 'teal' },
        ],
  );
  readonly previewBars = [35, 20, 55, 30, 80, 25, 45, 70, 30, 50, 85, 40, 65, 90].map(
    (value, index) => ({ value, night: [4, 7, 10, 13].includes(index) }),
  );

  readonly isAuthenticated = computed(() => this.auth.isAuthenticated());
  readonly currentParent = computed(() => this.auth.parent());

  readonly dashboardPath = computed(() => {
    const role = this.currentParent()?.role;
    if (role === 'HOSPITAL') return '/hospital/dashboard';
    if (role === 'SCHOOL') return '/schools/enrollments';
    return '/dashboard';
  });

  readonly userDisplayName = computed(() => {
    const parent = this.currentParent();
    if (!parent) return '';
    return `${parent.firstName} ${parent.lastName}`.trim();
  });

  readonly userInitials = computed(() => {
    const parent = this.currentParent();
    if (!parent) return '';
    const first = parent.firstName?.charAt(0) ?? '';
    const last = parent.lastName?.charAt(0) ?? '';
    return `${first}${last}`.toUpperCase() || 'U';
  });

  toggleLanguage(): void {
    this.i18n.toggleLanguage();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /** The saving from paying yearly, rounded; 0 for free plans. */
  discountPercent(plan: PricingPlan): number {
    const { monthly, yearly } = plan.price;
    return monthly > yearly ? Math.round(((monthly - yearly) / monthly) * 100) : 0;
  }

  priceLabel(amount: number): string {
    if (amount === 0) return this.currentLang() === 'km' ? 'ឥតគិតថ្លៃ' : 'Free';
    return `$${amount}`;
  }

  scrollToSection(sectionId: string, event: Event) {
    event.preventDefault();
    this.closeMobileMenu();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      history.pushState(null, '', `#${sectionId}`);
    }
  }
}
