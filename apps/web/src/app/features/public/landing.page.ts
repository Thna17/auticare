import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';

interface ProgressionStep {
  readonly id: string;
  readonly stepNumber: string;
  readonly badge: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly ctaLabel: string;
  readonly ctaLink: string;
}

interface Testimonial {
  readonly quote: string;
  readonly author: string;
  readonly role: string;
  readonly avatarInitials: string;
}

interface TrustBadge {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

const EN_PROGRESSION_STEPS: readonly ProgressionStep[] = [
  {
    id: 'screening',
    stepNumber: '01',
    badge: 'Screening',
    title: 'Evidence-Based Developmental Screening',
    subtitle: 'M-CHAT-aligned assessment with gentle clarity',
    description:
      'Gentle questionnaires observing communication, social interaction, and sensory cues with domain-by-domain clarity.',
    highlights: [
      'Calming, distraction-free assessment',
      'Downloadable summary for your pediatrician',
    ],
    ctaLabel: 'Explore Screening Tools',
    ctaLink: '/screening',
  },
  {
    id: 'care-plan',
    stepNumber: '02',
    badge: 'Activities',
    title: 'Daily Milestones & Sensory Play',
    subtitle: 'Routines tailored directly to your child',
    description:
      'Turn screening insights into joyful daily progress with sensory-friendly play and communication prompts.',
    highlights: [
      'Filtered by sensory intensity and daily living',
      'Parent reflection notes and milestone tracker',
    ],
    ctaLabel: 'Browse Activity Library',
    ctaLink: '/activities',
  },
  {
    id: 'specialists',
    stepNumber: '03',
    badge: 'Specialists',
    title: 'Specialist Discovery & Booking',
    subtitle: 'Connect with developmental pediatricians and therapists',
    description:
      'Find accredited pediatricians, speech therapists, and occupational therapists with your child’s history organized.',
    highlights: [
      'Verified hospitals and licensed specialists',
      'Real-time appointment requests and tracking',
    ],
    ctaLabel: 'Find Hospital Specialists',
    ctaLink: '/hospitals',
  },
  {
    id: 'schools',
    stepNumber: '04',
    badge: 'Schools',
    title: 'Inclusive Education Collaboration',
    subtitle: 'Bridge home routines with classroom support',
    description:
      'Search specialized schools with autism support programs, small class sizes, and shared teacher observation logs.',
    highlights: [
      'Specialized school directory and program filters',
      'Shared observation reports with teachers',
    ],
    ctaLabel: 'Explore Inclusive Schools',
    ctaLink: '/schools',
  },
];

const KM_PROGRESSION_STEPS: readonly ProgressionStep[] = [
  {
    id: 'screening',
    stepNumber: '01',
    badge: 'ការវាយតម្លៃ',
    title: 'ការវាយតម្លៃការលូតលាស់ M-CHAT',
    subtitle: 'កម្រងសំណួរតាមដានការលូតលាស់ប្រកបដោយភាពទន់ភ្លន់',
    description: 'ឆ្លើយកម្រងសំណួរងាយៗតាមដានការប្រាស្រ័យទាក់ទង ទំនាក់ទំនងសង្គម និងវិញ្ញាណរបស់កុមារ។',
    highlights: ['កម្រងសំណួរងាយស្រួលឆ្លើយ គ្មានការរំខាន', 'ទាញយករបាយការណ៍សង្ខេបសម្រាប់វេជ្ជបណ្ឌិត'],
    ctaLabel: 'ស្វែងយល់ពីការវាយតម្លៃ',
    ctaLink: '/screening',
  },
  {
    id: 'care-plan',
    stepNumber: '02',
    badge: 'សកម្មភាព',
    title: 'សកម្មភាពលេងបែបវិញ្ញាណ និងការវិវត្ត',
    subtitle: 'ទម្លាប់លេងដែលរៀបចំសម្រាប់តម្រូវការជាក់ស្តែង',
    description:
      'បង្វែរការវាយតម្លៃទៅជាភាពរីកចម្រើនប្រចាំថ្ងៃ ជាមួយគំនិតលេងសម្រួលវិញ្ញាណ និងលំហាត់និយាយ។',
    highlights: [
      'គំនិតលេងសម្រួលដល់វិញ្ញាណ និងជីវិតប្រចាំថ្ងៃ',
      'តាមដានការបញ្ចប់សកម្មភាព និងការវិវត្ត',
    ],
    ctaLabel: 'មើលបណ្ណាល័យសកម្មភាព',
    ctaLink: '/activities',
  },
  {
    id: 'specialists',
    stepNumber: '03',
    badge: 'អ្នកជំនាញ',
    title: 'ស្វែងរក និងកក់វេជ្ជបណ្ឌិតឯកទេស',
    subtitle: 'តភ្ជាប់ជាមួយវេជ្ជបណ្ឌិតកុមារ និងអ្នកព្យាបាល',
    description:
      'ស្វែងរកវេជ្ជបណ្ឌិតការលូតលាស់កុមារ អ្នកព្យាបាលការនិយាយ និងមុខងារដោយមានប្រវត្តិកុមាររួចជាស្រេច។',
    highlights: [
      'មន្ទីរពេទ្យដៃគូ និងអ្នកជំនាញមានអាជ្ញាប័ណ្ណ',
      'កក់ និងតាមដានការណាត់ជួបយ៉ាងងាយស្រួល',
    ],
    ctaLabel: 'ស្វែងរកវេជ្ជបណ្ឌិតជំនាញ',
    ctaLink: '/hospitals',
  },
  {
    id: 'schools',
    stepNumber: '04',
    badge: 'ការអប់រំ',
    title: 'ការសហការជាមួយសាលារៀនបរិយាបន្ន',
    subtitle: 'ភ្ជាប់ទម្លាប់នៅផ្ទះជាមួយការគាំទ្រក្នុងថ្នាក់រៀន',
    description:
      'ស្វែងរកសាលាដែលមានកម្មវិធីគាំទ្រអូទីសឹម និងផ្លាស់ប្តូររបាយការណ៍សង្កេតជាមួយគ្រូបង្រៀន។',
    highlights: ['បញ្ជីសាលាបរិយាបន្នដែលបានផ្ទៀងផ្ទាត់', 'ផ្លាស់ប្តូររបាយការណ៍សង្កេតជាមួយគ្រូ'],
    ctaLabel: 'ស្វែងរកសាលារៀនបរិយាបន្ន',
    ctaLink: '/schools',
  },
];

const EN_TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      'AutiCare gave our family clarity instead of anxiety. Having our screening history and observations in one place made pediatric visits calm and productive.',
    author: 'Elena Rostova',
    role: 'Parent of 4-year-old',
    avatarInitials: 'ER',
  },
  {
    quote:
      'Consistent observation records between home and school save weeks during evaluations. Families arrive informed, calm, and prepared.',
    author: 'Dr. Marcus Chen',
    role: 'Developmental Pediatrician',
    avatarInitials: 'MC',
  },
  {
    quote:
      'Sharing classroom observations directly with parents bridges home routines and classroom accommodations effortlessly.',
    author: 'Sarah Jenkins, M.Ed.',
    role: 'Inclusion Coordinator',
    avatarInitials: 'SJ',
  },
];

const KM_TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      'AutiCare ជួយឱ្យគ្រួសារយើងមានភាពស្ងប់ចិត្ត។ ការមានប្រវត្តិវាយតម្លៃនៅកន្លែងតែមួយ ធ្វើឱ្យការពិគ្រោះជាមួយគ្រូពេទ្យកាន់តែច្បាស់លាស់។',
    author: 'Elena Rostova',
    role: 'មាតាបិតាកុមារអាយុ ៤ ឆ្នាំ',
    avatarInitials: 'ER',
  },
  {
    quote:
      'កំណត់ត្រាសង្កេតច្បាស់លាស់រវាងផ្ទះ និងសាលារៀន ជួយសន្សំពេលវេលាក្នុងគ្លីនិក។ គ្រួសារមកដល់ដោយមានព័ត៌មានគ្រប់គ្រាន់។',
    author: 'Dr. Marcus Chen',
    role: 'វេជ្ជបណ្ឌិតឯកទេសការលូតលាស់កុមារ',
    avatarInitials: 'MC',
  },
  {
    quote:
      'ការចែករំលែករបាយការណ៍សង្កេតពីថ្នាក់រៀនដោយផ្ទាល់ជាមួយឪពុកម្តាយ ជួយសម្រួលដល់ការគាំទ្រកុមារឱ្យកាន់តែមានប្រសិទ្ធភាព។',
    author: 'Sarah Jenkins, M.Ed.',
    role: 'អ្នកសម្របសម្រួលការអប់រំបរិយាបន្ន',
    avatarInitials: 'SJ',
  },
];

const EN_TRUST_BADGES: readonly TrustBadge[] = [
  {
    title: 'Evidence-Based Framework',
    description: 'Screening aligned with validated pediatric guidelines and M-CHAT principles.',
    icon: 'shield',
  },
  {
    title: '100% Private Family Data',
    description: 'Zero third-party ads or brokers. All records belong strictly to your family.',
    icon: 'lock',
  },
  {
    title: 'Multidisciplinary Care',
    description: 'Brings parents, pediatricians, therapists, and educators onto one platform.',
    icon: 'users',
  },
  {
    title: 'Sensory-Friendly Design',
    description: 'Calm colors, legible typography, and zero sensory overload.',
    icon: 'heart',
  },
];

const KM_TRUST_BADGES: readonly TrustBadge[] = [
  {
    title: 'ស្តង់ដារផ្អែកលើភស្តុតាង',
    description: 'ការវាយតម្លៃស្របតាមគោលការណ៍ M-CHAT និងការអភិវឌ្ឍកុមារ។',
    icon: 'shield',
  },
  {
    title: 'ឯកជនភាព ១០០%',
    description: 'ទិន្នន័យត្រូវបានការពារយ៉ាងតឹងរ៉ឹង ដោយគ្មានការចែករំលែកពាណិជ្ជកម្ម។',
    icon: 'lock',
  },
  {
    title: 'កិច្ចសហការជាក្រុម',
    description: 'ភ្ជាប់ទំនាក់ទំនងរវាងឪពុកម្តាយ វេជ្ជបណ្ឌិត និងគ្រូបង្រៀន។',
    icon: 'users',
  },
  {
    title: 'ការរចនាទន់ភ្លន់',
    description: 'ពណ៌ស្រទន់ គ្មានការរំខាន និងងាយស្រួលប្រើប្រាស់។',
    icon: 'heart',
  },
];

const EN_TOOLS = [
  {
    title: 'Developmental Screening',
    description: 'Gentle M-CHAT questionnaires to spot strengths and support needs.',
    icon: 'checklist',
  },
  {
    title: 'Specialist Directory',
    description: 'Find accredited pediatric clinics, hospitals, and therapists.',
    icon: 'map',
  },
  {
    title: 'Daily Activities',
    description: 'Sensory-friendly play and routine ideas tailored for home.',
    icon: 'activity',
  },
  {
    title: 'Milestone Tracking',
    description: 'Calm, structured progress records in one organized workspace.',
    icon: 'trend',
  },
] as const;

const KM_TOOLS = [
  {
    title: 'ការវាយតម្លៃការលូតលាស់',
    description: 'កម្រងសំណួរ M-CHAT ស្វែងយល់ពីចំណុចខ្លាំង និងតម្រូវការគាំទ្រ។',
    icon: 'checklist',
  },
  {
    title: 'ស្វែងរកអ្នកជំនាញ',
    description: 'រុករកមន្ទីរពេទ្យ គ្លីនិក និងអ្នកព្យាបាលឯកទេសនៅកម្ពុជា។',
    icon: 'map',
  },
  {
    title: 'សកម្មភាពប្រចាំថ្ងៃ',
    description: 'គំនិតលេងសម្រួលវិញ្ញាណ និងការបង្កើតទម្លាប់ល្អនៅផ្ទះ។',
    icon: 'activity',
  },
  {
    title: 'តាមដានការរីកចម្រើន',
    description: 'កត់ត្រាវឌ្ឍនភាព និងចំណុចសំខាន់ៗនៃការលូតលាស់។',
    icon: 'trend',
  },
] as const;

const EN_STEPS = [
  {
    title: 'Create child profile',
    description: 'Add basic details to personalize screening and activity recommendations.',
  },
  {
    title: 'Complete quick screening',
    description: 'Answer gentle questions on communication, social play, and sensory cues.',
  },
  {
    title: 'Receive practical guidance',
    description: 'Access tailored daily routines, activity prompts, and local resources.',
  },
  {
    title: 'Coordinate with experts',
    description: 'Share organized observation records with doctors and educators.',
  },
] as const;

const KM_STEPS = [
  {
    title: 'បង្កើតប្រវត្តិរូបកុមារ',
    description: 'បញ្ចូលព័ត៌មានមូលដ្ឋានដើម្បីកំណត់ការវាយតម្លៃសមស្រប។',
  },
  {
    title: 'បំពេញការវាយតម្លៃដំបូង',
    description: 'ឆ្លើយសំណួរងាយៗតាមដានការប្រាស្រ័យទាក់ទង និងការលេង។',
  },
  {
    title: 'ទទួលបានការណែនាំជាក់ស្តែង',
    description: 'ពិនិត្យសកម្មភាពលេង និងធនធានគាំទ្រដែលបានណែនាំ។',
  },
  {
    title: 'សហការជាមួយអ្នកជំនាញ',
    description: 'ចែករំលែកកំណត់ត្រាសង្កេតជាមួយវេជ្ជបណ្ឌិត និងសាលារៀន។',
  },
] as const;

const EN_ACTIVITY_HIGHLIGHTS = [
  'Sensory-friendly play ideas',
  'Communication practice prompts',
  'Routine-building activities',
] as const;

const KM_ACTIVITY_HIGHLIGHTS = [
  'គំនិតលេងសម្រួលដល់វិញ្ញាណ',
  'លំហាត់អនុវត្តការប្រាស្រ័យទាក់ទង',
  'សកម្មភាពបង្កើតទម្លាប់ប្រចាំថ្ងៃ',
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
  imports: [RouterLink],
  template: `
    <main class="landing-page">
      <header class="site-header">
        <div class="nav-shell">
          <a class="brand" routerLink="/" aria-label="AutiCare home">
            <span class="brand-logo-frame">
              <img
                src="/images/auticare-logo.jpg"
                alt=""
                aria-hidden="true"
                width="36"
                height="34"
              />
            </span>
            <span class="brand-text">AutiCare</span>
          </a>

          <nav class="desktop-nav" aria-label="Main navigation">
            <a href="#home" aria-current="page" (click)="scrollToSection('home', $event)">{{
              currentLang() === 'km' ? 'ទំព័រដើម' : 'Home'
            }}</a>
            <a href="#progression" (click)="scrollToSection('progression', $event)">{{
              currentLang() === 'km' ? 'លក្ខណៈពិសេស' : 'Features'
            }}</a>
            <a href="#how-it-works" (click)="scrollToSection('how-it-works', $event)">{{
              currentLang() === 'km' ? 'ដំណើរការ' : 'How it works'
            }}</a>
            <a href="#support" (click)="scrollToSection('support', $event)">{{
              currentLang() === 'km' ? 'ស្វែងរកជំនួយ' : 'Find support'
            }}</a>
            <a href="#activities" (click)="scrollToSection('activities', $event)">{{
              currentLang() === 'km' ? 'សកម្មភាពលេង' : 'Activities'
            }}</a>
            <a href="#testimonials" (click)="scrollToSection('testimonials', $event)">{{
              currentLang() === 'km' ? 'មតិអ្នកប្រើប្រាស់' : 'Testimonials'
            }}</a>
            <a href="#about-autism" (click)="scrollToSection('about-autism', $event)">{{
              currentLang() === 'km' ? 'អំពីអូទីសឹម' : 'About autism'
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
                  src="/images/auticare-logo.jpg"
                  alt=""
                  aria-hidden="true"
                  width="32"
                  height="30"
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
              ✕
            </button>
          </div>

          <nav class="mobile-drawer-nav" aria-label="Mobile navigation links">
            <a href="#home" (click)="scrollToSection('home', $event)">
              <span class="drawer-icon" aria-hidden="true">🏠</span>
              <span>{{ currentLang() === 'km' ? 'ទំព័រដើម' : 'Home' }}</span>
            </a>
            <a href="#progression" (click)="scrollToSection('progression', $event)">
              <span class="drawer-icon" aria-hidden="true">✨</span>
              <span>{{ currentLang() === 'km' ? 'លក្ខណៈពិសេស' : 'Features' }}</span>
            </a>
            <a href="#how-it-works" (click)="scrollToSection('how-it-works', $event)">
              <span class="drawer-icon" aria-hidden="true">🧭</span>
              <span>{{ currentLang() === 'km' ? 'ដំណើរការ' : 'How it works' }}</span>
            </a>
            <a href="#support" (click)="scrollToSection('support', $event)">
              <span class="drawer-icon" aria-hidden="true">🛠️</span>
              <span>{{ currentLang() === 'km' ? 'ស្វែងរកជំនួយ' : 'Find support' }}</span>
            </a>
            <a href="#activities" (click)="scrollToSection('activities', $event)">
              <span class="drawer-icon" aria-hidden="true">🎨</span>
              <span>{{ currentLang() === 'km' ? 'សកម្មភាពលេង' : 'Activities' }}</span>
            </a>
            <a href="#testimonials" (click)="scrollToSection('testimonials', $event)">
              <span class="drawer-icon" aria-hidden="true">💬</span>
              <span>{{ currentLang() === 'km' ? 'មតិអ្នកប្រើប្រាស់' : 'Testimonials' }}</span>
            </a>
            <a href="#about-autism" (click)="scrollToSection('about-autism', $event)">
              <span class="drawer-icon" aria-hidden="true">💙</span>
              <span>{{ currentLang() === 'km' ? 'អំពីអូទីសឹម' : 'About autism' }}</span>
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
        </div>

        <div class="hero-media">
          <picture>
            <source srcset="/images/signup-hero.webp" type="image/webp" />
            <img
              src="/images/signup-hero.png"
              alt="Parent and child developmental support illustration"
              width="1376"
              height="768"
              fetchpriority="high"
            />
          </picture>
        </div>
      </section>

      <!-- Interactive Feature Progression: Screening -> Care Plan -> Hospital Specialists -> School Collaboration -->
      <section id="progression" class="progression-section" aria-labelledby="progression-title">
        <div class="section-heading">
          <p class="section-kicker">
            {{ currentLang() === 'km' ? 'ដំណើរការថែទាំរួមគ្នា' : 'Unified Care Journey' }}
          </p>
          <h2 id="progression-title">
            {{
              currentLang() === 'km'
                ? 'របៀបដែល AutiCare ណែនាំដំណើរការថែទាំ'
                : 'How AutiCare Guides Your Care Journey'
            }}
          </h2>
          <p>
            {{
              currentLang() === 'km'
                ? 'ដំណើរការច្បាស់លាស់ ចាប់ពីការវាយតម្លៃ រហូតដល់ការសហការជាមួយអ្នកជំនាញ។'
                : 'A clear, simple progression from screening to specialist collaboration.'
            }}
          </p>
        </div>

        <!-- Interactive Stepper Tabs -->
        <div class="stepper-tabs" role="tablist" aria-label="Care progression steps">
          @for (step of progressionSteps(); track step.id; let i = $index) {
            <button
              type="button"
              role="tab"
              class="stepper-tab"
              [class.active]="activeProgressionStep() === i"
              [attr.aria-selected]="activeProgressionStep() === i"
              (click)="selectProgressionStep(i)"
            >
              <span class="tab-number">{{ step.stepNumber }}</span>
              <span class="tab-label">{{ step.badge }}</span>
            </button>
          }
        </div>

        <!-- Active Step Card -->
        @if (currentProgressionStep(); as active) {
          <article class="progression-card" role="tabpanel">
            <div class="progression-card-content">
              <div class="step-meta">
                <span class="step-badge">{{ active.badge }}</span>
                <span class="step-order">{{
                  currentLang() === 'km'
                    ? 'ជំហាន ' + active.stepNumber + ' នៃ ០៤'
                    : 'Step ' + active.stepNumber + ' of 04'
                }}</span>
              </div>
              <h3>{{ active.title }}</h3>
              <p class="step-desc">{{ active.description }}</p>

              <ul class="step-highlights">
                @for (item of active.highlights; track item) {
                  <li>
                    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                      <path
                        d="M5 10l3 3 7-7"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.2"
                        stroke-linecap="round"
                      />
                    </svg>
                    <span>{{ item }}</span>
                  </li>
                }
              </ul>

              <div class="step-action-row">
                <a [routerLink]="active.ctaLink" class="step-cta-btn">
                  <span>{{ active.ctaLabel }}</span>
                  <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                    <path
                      d="M4 10h11M11 5l5 5-5 5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div class="progression-card-visual" aria-hidden="true">
              <div class="visual-box">
                <div class="visual-header"><span></span><span></span><span></span></div>
                <div class="visual-body">
                  @if (active.id === 'screening') {
                    <div class="mock-score-card">
                      <span class="mock-label">{{
                        currentLang() === 'km' ? 'ការវាយតម្លៃការលូតលាស់' : 'Developmental Screening'
                      }}</span>
                      <div class="mock-risk-meter">
                        <div class="mock-risk-bar"></div>
                      </div>
                      <span class="mock-status">{{
                        currentLang() === 'km'
                          ? 'កម្រិតហានិភ័យទាប · បញ្ចប់ ៨៥%'
                          : 'Low Heuristic Risk · 85% Completed'
                      }}</span>
                    </div>
                  } @else if (active.id === 'care-plan') {
                    <div class="mock-activity-card">
                      <span class="mock-tag">{{
                        currentLang() === 'km' ? 'ការលេងបែបវិញ្ញាណ' : 'Sensory Play'
                      }}</span>
                      <h4>
                        {{
                          currentLang() === 'km'
                            ? 'ការស្វែងយល់ពីវត្ថុធាតុ និងជ្រុងស្ងប់ស្ងាត់'
                            : 'Texture Discovery & Calming Corner'
                        }}
                      </h4>
                      <span class="mock-time">{{
                        currentLang() === 'km'
                          ? '១៥ នាទី · វិញ្ញាណទន់ភ្លន់'
                          : '15 mins · Gentle Sensory'
                      }}</span>
                    </div>
                  } @else if (active.id === 'specialists') {
                    <div class="mock-doctor-card">
                      <div class="mock-avatar">MC</div>
                      <div class="mock-doc-info">
                        <strong>Dr. Marcus Chen</strong>
                        <span>{{
                          currentLang() === 'km'
                            ? 'វេជ្ជសាស្ត្រការលូតលាស់កុមារ'
                            : 'Developmental Pediatrics'
                        }}</span>
                      </div>
                    </div>
                  } @else {
                    <div class="mock-school-card">
                      <span class="mock-badge">{{
                        currentLang() === 'km'
                          ? 'សាលាបរិយាបន្នដែលបានផ្ទៀងផ្ទាត់'
                          : 'Verified Inclusive School'
                      }}</span>
                      <h4>
                        {{
                          currentLang() === 'km'
                            ? 'សាលារៀនពិសេសពន្លឺថ្ងៃ'
                            : 'Sunrise Special Learning Academy'
                        }}
                      </h4>
                      <span>{{
                        currentLang() === 'km'
                          ? 'សមាមាត្រសិស្សនិងគ្រូ ១:៤'
                          : '1:4 Student-to-Teacher Ratio'
                      }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </article>
        }
      </section>

      <!-- Tools Section -->
      <section id="support" class="tools-section" aria-labelledby="tools-title">
        <div class="section-heading">
          <h2 id="tools-title">
            {{
              currentLang() === 'km'
                ? 'ឧបករណ៍សំខាន់ៗសម្រាប់ការលូតលាស់'
                : 'Core tools for development'
            }}
          </h2>
          <p>
            {{
              currentLang() === 'km'
                ? 'រៀបចំការងារគាំទ្រសំខាន់ៗឱ្យមានរបៀបរៀបរយ និងងាយស្រួលតាមដាន។'
                : 'Essential support tools organized for clarity and calm family routines.'
            }}
          </p>
        </div>

        <div class="tool-grid">
          @for (tool of tools(); track tool.title) {
            <article class="tool-card">
              <span class="tool-icon" [class]="tool.icon" aria-hidden="true"></span>
              <h3>{{ tool.title }}</h3>
              <p>{{ tool.description }}</p>
            </article>
          }
        </div>
      </section>

      <!-- How It Works Section -->
      <section id="how-it-works" class="process-section" aria-labelledby="process-title">
        <div class="process-copy">
          <h2 id="process-title">
            {{
              currentLang() === 'km' ? 'របៀបដែល AutiCare គាំទ្រអ្នក' : 'How AutiCare supports you'
            }}
          </h2>

          <ol class="step-list">
            @for (step of steps(); track step.title; let index = $index) {
              <li>
                <span>{{ index + 1 }}</span>
                <div>
                  <h3>{{ step.title }}</h3>
                  <p>{{ step.description }}</p>
                </div>
              </li>
            }
          </ol>
        </div>

        <div class="product-preview" aria-label="AutiCare dashboard preview">
          <div class="preview-window">
            <header>
              <span></span>
              <span></span>
              <span></span>
            </header>
            <div class="preview-body">
              <section class="preview-panel large">
                <p>{{ currentLang() === 'km' ? 'ព័ត៌មានកុមារ' : 'Child profile' }}</p>
                <strong>{{
                  currentLang() === 'km' ? 'ទិដ្ឋភាពទូទៅនៃការគាំទ្រ' : 'Support overview'
                }}</strong>
                <div class="preview-bars" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </section>
              <section class="preview-panel">
                <p>{{ currentLang() === 'km' ? 'របាយការណ៍សាលា' : 'School report' }}</p>
                <strong>{{ currentLang() === 'km' ? 'រួចរាល់' : 'Ready' }}</strong>
              </section>
              <section class="preview-panel blue">
                <p>{{ currentLang() === 'km' ? 'សកម្មភាពបន្ទាប់' : 'Next action' }}</p>
                <strong>{{
                  currentLang() === 'km' ? 'សកម្មភាពហាត់និយាយ' : 'Speech activity'
                }}</strong>
              </section>
            </div>
          </div>
        </div>
      </section>

      <!-- Activities Section -->
      <section id="activities" class="activities-section" aria-labelledby="activities-title">
        <div>
          <p class="section-kicker">{{ currentLang() === 'km' ? 'សកម្មភាព' : 'Activities' }}</p>
          <h2 id="activities-title">
            {{
              currentLang() === 'km'
                ? 'បង្វែរគោលដៅទៅជាទម្លាប់ប្រចាំថ្ងៃ'
                : 'Turn support goals into practical routines'
            }}
          </h2>
          <p>
            {{
              currentLang() === 'km'
                ? 'គំនិតលេងសាមញ្ញ និងទម្លាប់ប្រចាំថ្ងៃដែលងាយស្រួលអនុវត្តនៅផ្ទះ។'
                : 'Simple, practical play routines you can easily use at home.'
            }}
          </p>
        </div>

        <div class="activity-list">
          @for (activity of activityHighlights(); track activity) {
            <article>
              <span aria-hidden="true"></span>
              <p>{{ activity }}</p>
            </article>
          }
        </div>
      </section>

      <!-- Testimonials Carousel Section -->
      <section id="testimonials" class="testimonials-section" aria-labelledby="testimonials-title">
        <div class="section-heading">
          <p class="section-kicker">
            {{ currentLang() === 'km' ? 'សំឡេងពីសហគមន៍របស់យើង' : 'Voices of Our Community' }}
          </p>
          <h2 id="testimonials-title">
            {{
              currentLang() === 'km'
                ? 'ទទួលបានការទុកចិត្តពីគ្រួសារ និងអ្នកជំនាញ'
                : 'Trusted by Families, Clinicians & Educators'
            }}
          </h2>
          <p>
            {{
              currentLang() === 'km'
                ? 'រឿងរ៉ាវពិតពីឪពុកម្តាយ និងអ្នកជំនាញដែលរួមដំណើជាមួយគ្នា។'
                : 'Real stories from parents and professionals building brighter futures together.'
            }}
          </p>
        </div>

        <div class="testimonials-carousel">
          @if (currentTestimonial(); as item) {
            <article class="testimonial-card">
              <div class="quote-icon" aria-hidden="true">“</div>
              <p class="testimonial-text">{{ item.quote }}</p>

              <footer class="testimonial-author-row">
                <div class="author-avatar">{{ item.avatarInitials }}</div>
                <div class="author-details">
                  <strong>{{ item.author }}</strong>
                  <span>{{ item.role }}</span>
                </div>
              </footer>
            </article>
          }

          <div class="carousel-controls">
            <button
              type="button"
              class="carousel-btn prev"
              [attr.aria-label]="currentLang() === 'km' ? 'មតិមុន' : 'Previous testimonial'"
              (click)="prevTestimonial()"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path
                  d="M13 16l-6-6 6-6"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>

            <div class="carousel-dots" role="tablist" aria-label="Testimonial slides">
              @for (item of testimonials(); track item.author; let idx = $index) {
                <button
                  type="button"
                  class="carousel-dot"
                  [class.active]="activeTestimonial() === idx"
                  [attr.aria-label]="
                    currentLang() === 'km'
                      ? 'ទៅកាន់មតិទី ' + (idx + 1)
                      : 'Go to testimonial ' + (idx + 1)
                  "
                  (click)="setTestimonial(idx)"
                ></button>
              }
            </div>

            <button
              type="button"
              class="carousel-btn next"
              [attr.aria-label]="currentLang() === 'km' ? 'មតិបន្ទាប់' : 'Next testimonial'"
              (click)="nextTestimonial()"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path
                  d="M7 4l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <!-- Clinical Accreditation & Trust Badges Section -->
      <section class="trust-badges-section" aria-labelledby="trust-title">
        <div class="section-heading">
          <h2 id="trust-title">
            {{
              currentLang() === 'km'
                ? 'បង្កើតឡើងដោយសុចរិតភាព និងសុវត្ថិភាព'
                : 'Built with Clinical Integrity & Safety First'
            }}
          </h2>
          <p>
            {{
              currentLang() === 'km'
                ? 'សុវត្ថិភាព និងឯកជនភាពគ្រួសារជាចម្បង។'
                : 'Safety, privacy, and clinical standards come first.'
            }}
          </p>
        </div>

        <div class="trust-cards-grid">
          @for (badge of trustBadges(); track badge.title) {
            <article class="trust-card">
              <div class="trust-card-icon" aria-hidden="true">
                @if (badge.icon === 'shield') {
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path
                      d="M12 2l7 3.5v6c0 5-3.5 9-7 10.5-3.5-1.5-7-5.5-7-10.5v-6L12 2z"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                    <path
                      d="M9 12l2 2 4-4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                } @else if (badge.icon === 'lock') {
                  <svg viewBox="0 0 24 24" focusable="false">
                    <rect
                      x="4"
                      y="10"
                      width="16"
                      height="11"
                      rx="2"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                    <path
                      d="M8 10V7a4 4 0 0 1 8 0v3"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                  </svg>
                } @else if (badge.icon === 'users') {
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path
                      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path
                      d="M12 21s-7-4.4-9.1-8.3C.9 8 .7 4.8 3.2 3.2c2.2-1.4 5-.6 6.4 1.5L12 8l2.4-3.3c1.5-2.1 4.2-2.9 6.4-1.5 2.5 1.6 2.3 4.8.3 8.5C19 15.6 12 20 12 20Z"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                  </svg>
                }
              </div>
              <h3>{{ badge.title }}</h3>
              <p>{{ badge.description }}</p>
            </article>
          }
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
        <section>
          <a class="footer-brand" routerLink="/" aria-label="AutiCare home">
            <img
              src="/images/auticare-logo.jpg"
              alt=""
              aria-hidden="true"
              width="40"
              height="37"
              loading="lazy"
            />
            <span>AutiCare</span>
          </a>
          <p>
            {{
              currentLang() === 'km'
                ? 'ពង្រឹងសមត្ថភាពគ្រួសារកុមារអូទីសឹម តាមរយៈឧបករណ៍គាំទ្រដែលអាចប្រើប្រាស់បាន និងការថែទាំរួមគ្នា។'
                : 'Empowering neurodiverse families through accessible support tools and coordinated care.'
            }}
          </p>
        </section>

        <nav aria-label="Resources">
          <h2>{{ currentLang() === 'km' ? 'ធនធាន' : 'Resources' }}</h2>
          <a routerLink="/crisis">{{
            currentLang() === 'km' ? 'ធនធានសង្គ្រោះបន្ទាន់' : 'Emergency resources'
          }}</a>
          <a href="#about-autism" (click)="scrollToSection('about-autism', $event)">
            {{ currentLang() === 'km' ? 'អំពីអូទីសឹម' : 'About autism' }}
          </a>
          <a routerLink="/support">{{
            currentLang() === 'km' ? 'ក្រុមគាំទ្រ' : 'Support groups'
          }}</a>
        </nav>

        <nav aria-label="Legal">
          <h2>{{ currentLang() === 'km' ? 'ច្បាប់ និងលក្ខខណ្ឌ' : 'Legal' }}</h2>
          <a routerLink="/privacy">{{ currentLang() === 'km' ? 'ឯកជនភាព' : 'Privacy' }}</a>
          <a routerLink="/terms">{{ currentLang() === 'km' ? 'លក្ខខណ្ឌប្រើប្រាស់' : 'Terms' }}</a>
          <a routerLink="/support">{{
            currentLang() === 'km' ? 'ការមិនទទួលខុសត្រូវផ្នែកវេជ្ជសាស្ត្រ' : 'Medical disclaimer'
          }}</a>
        </nav>

        <section>
          <h2>{{ currentLang() === 'km' ? 'ទំនាក់ទំនង' : 'Contact' }}</h2>
          <a routerLink="/support">{{ currentLang() === 'km' ? 'ទំនាក់ទំនង' : 'Contact' }}</a>
          <p class="disclaimer">
            {{
              currentLang() === 'km'
                ? 'ការមិនទទួលខុសត្រូវផ្នែកវេជ្ជសាស្ត្រ៖ AutiCare ផ្តល់ឧបករណ៍វាយតម្លៃ និងធនធានអប់រំ។ យើងមិនផ្តល់ការធ្វើរោគវិនិច្ឆ័យគ្លីនិក ឬផែនការព្យាបាលវេជ្ជសាស្ត្រឡើយ។'
                : 'Medical disclaimer: AutiCare provides screening tools and educational resources. We do not provide clinical diagnosis or treatment plans.'
            }}
          </p>
        </section>

        <p class="copyright">
          (c) {{ currentYear }}
          {{
            currentLang() === 'km'
              ? 'AutiCare។ រក្សាសិទ្ធិគ្រប់យ៉ាង។'
              : 'AutiCare. All rights reserved.'
          }}
        </p>
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
        height: 64px;
        background: #ffffff;
        border-radius: 9999px;
        box-shadow:
          0 12px 32px -4px rgba(15, 23, 42, 0.08),
          0 2px 8px rgba(15, 23, 42, 0.04),
          0 0 0 1px rgba(0, 0, 0, 0.04);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 10px 0 22px;
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
        width: 34px;
        height: 34px;
        border-radius: 9999px;
        overflow: hidden;
        display: grid;
        place-items: center;
        background: #ffffff;
        box-shadow: 0 2px 10px rgba(14, 116, 144, 0.14);
        border: 1px solid rgba(14, 116, 144, 0.16);
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
        font-size: 23px;
        font-weight: 800;
        letter-spacing: -0.03em;
        background: linear-gradient(135deg, #0f766e 0%, #0e7490 50%, #0369a1 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        line-height: 1;
      }

      /* Floating Center Pill Navigation */
      .desktop-nav {
        display: flex;
        align-items: center;
        gap: 2px;
        background: transparent;
        padding: 0;
        border: none;
        box-shadow: none;
      }

      .desktop-nav a {
        display: inline-flex;
        align-items: center;
        padding: 7px 11px;
        border-radius: 9999px;
        color: #4b5563;
        font-size: 13.5px;
        font-weight: 500;
        white-space: nowrap;
        text-decoration: none;
        line-height: 1.25;
        transition: all 0.18s ease;
      }

      .desktop-nav a:hover {
        color: #0e7490;
        background: rgba(14, 116, 144, 0.06);
      }

      .desktop-nav a[aria-current='page'],
      .desktop-nav a.active {
        color: #0e7490;
        background: rgba(14, 116, 144, 0.1);
        font-weight: 600;
        padding: 7px 15px;
        box-shadow: none;
      }

      /* Header Actions */
      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .topbar-lang-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 0 12px;
        height: 38px;
        border: 1px solid #e2e8f0;
        border-radius: 9999px;
        background: #f8fafc;
        color: #475569;
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        transition: all 0.18s ease;
      }

      .topbar-lang-toggle:hover {
        background: #ffffff;
        border-color: #0e7490;
        color: #0e7490;
      }

      .topbar-lang-toggle:focus-visible {
        outline: 2px solid #0e7490;
        outline-offset: 2px;
      }

      .topbar-lang-toggle .lang-flag {
        font-size: 15px;
        line-height: 1;
      }

      .topbar-lang-toggle .lang-text {
        font-size: 13px;
        line-height: 1;
        font-weight: 600;
      }

      .signup-link {
        height: 38px;
        padding: 0 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 9999px;
        color: #4b5563;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.18s ease;
      }

      .signup-link:hover {
        color: #0e7490;
        background: rgba(14, 116, 144, 0.08);
      }

      /* Prominent Pill Button with AutiCare Original Brand Palette */
      .login-link,
      .dashboard-link {
        height: 42px;
        padding: 0 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 9999px;
        background: linear-gradient(135deg, #0e7490 0%, #0369a1 100%);
        color: #ffffff;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        box-shadow: 0 4px 14px rgba(14, 116, 144, 0.28);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .login-link:hover,
      .dashboard-link:hover {
        background: linear-gradient(135deg, #0891b2 0%, #0284c7 100%);
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(14, 116, 144, 0.38);
        color: #ffffff;
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
        background: linear-gradient(135deg, #0e7490, #38bdf8);
        color: #ffffff;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 8px rgba(14, 116, 144, 0.25);
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
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.95fr);
        align-items: center;
        gap: 56px;
        padding: 40px clamp(24px, 5vw, 72px) 64px;
        background: linear-gradient(
          135deg,
          rgb(250 248 242 / 0.95) 0%,
          rgb(232 246 255 / 0.75) 100%
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
        box-shadow: 0 8px 20px rgb(41 74 90 / 0.18);
        transition:
          background 160ms ease,
          transform 160ms ease,
          box-shadow 160ms ease;
      }

      .primary-action:hover {
        background: var(--ac-color-action-alt);
        transform: translateY(-1px);
        box-shadow: 0 12px 24px rgb(41 74 90 / 0.24);
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

      .hero-media {
        border-radius: 24px;
        overflow: hidden;
        box-shadow:
          0 24px 60px rgb(41 74 90 / 0.14),
          0 0 0 1px rgba(15, 23, 42, 0.06);
        border: 1px solid var(--ac-color-border-slate);
      }

      .hero-media img {
        display: block;
        width: 100%;
        height: auto;
        object-fit: cover;
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

      /* Interactive Feature Progression Section */
      .progression-section {
        padding: 72px clamp(24px, 5vw, 72px);
        background: var(--ac-color-surface);
        border-top: 1px solid var(--ac-color-border-slate);
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .stepper-tabs {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 36px;
      }

      .stepper-tab {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 18px;
        border-radius: var(--ac-radius-pill);
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        font-size: 14px;
        font-weight: var(--ac-font-weight-semibold);
        cursor: pointer;
        transition: all 160ms ease;
      }

      .stepper-tab:hover {
        border-color: var(--ac-color-action);
        background: var(--ac-color-surface-info);
      }

      .stepper-tab.active {
        border-color: var(--ac-color-action);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        box-shadow: 0 4px 14px rgb(41 74 90 / 0.16);
      }

      .tab-number {
        font-size: 12px;
        font-weight: var(--ac-font-weight-bold);
        opacity: 0.8;
      }

      .progression-card {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
        gap: 40px;
        align-items: center;
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        border-radius: 24px;
        padding: 44px;
        max-width: 1040px;
        margin: 0 auto;
        box-shadow: 0 12px 32px rgb(41 74 90 / 0.08);
      }

      .progression-card-content {
        display: grid;
        gap: 14px;
      }

      .step-meta {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .step-badge {
        font-size: 12px;
        font-weight: var(--ac-font-weight-bold);
        padding: 4px 10px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .step-order {
        font-size: 13px;
        color: var(--ac-color-text-muted);
        font-weight: var(--ac-font-weight-semibold);
      }

      .progression-card-content h3 {
        font-size: clamp(22px, 2.4vw, 28px);
        line-height: 1.25;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .step-subtitle {
        font-size: 16px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-action-deep);
      }

      .step-desc {
        font-size: 15px;
        line-height: 1.55;
        color: var(--ac-color-text-body);
      }

      .step-highlights {
        list-style: none;
        padding: 0;
        margin: 8px 0;
        display: grid;
        gap: 10px;
      }

      .step-highlights li {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--ac-color-text-strong);
      }

      .step-highlights svg {
        width: 18px;
        height: 18px;
        color: var(--ac-color-green-600);
        flex-shrink: 0;
      }

      .step-action-row {
        margin-top: 10px;
      }

      .step-cta-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        height: 48px;
        border-radius: 12px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        padding: 0 22px;
        font-size: 15px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        transition: background 160ms ease;
      }

      .step-cta-btn svg {
        width: 16px;
        height: 16px;
      }

      .step-cta-btn:hover {
        background: var(--ac-color-action-alt);
      }

      .visual-box {
        border-radius: 16px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        overflow: hidden;
        box-shadow: 0 8px 24px rgb(41 74 90 / 0.1);
      }

      .visual-header {
        height: 28px;
        background: var(--ac-color-surface-slate);
        border-bottom: 1px solid var(--ac-color-border-slate);
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 12px;
      }

      .visual-header span {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--ac-color-border-grey);
      }

      .visual-body {
        padding: 24px;
        display: grid;
        place-items: center;
        min-height: 180px;
      }

      .mock-score-card,
      .mock-activity-card,
      .mock-doctor-card,
      .mock-school-card {
        width: 100%;
        display: grid;
        gap: 8px;
      }

      .mock-label {
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-muted);
      }

      .mock-risk-meter {
        height: 10px;
        border-radius: 999px;
        background: var(--ac-color-border-slate);
        overflow: hidden;
      }

      .mock-risk-bar {
        width: 85%;
        height: 100%;
        background: var(--ac-color-green-600);
      }

      .mock-status {
        font-size: 13px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-green-700);
      }

      .mock-tag {
        font-size: 11px;
        font-weight: var(--ac-font-weight-bold);
        padding: 2px 8px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
        width: fit-content;
      }

      .mock-activity-card h4,
      .mock-school-card h4 {
        font-size: 16px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .mock-time,
      .mock-school-card span {
        font-size: 13px;
        color: var(--ac-color-text-muted);
      }

      .mock-doctor-card {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .mock-avatar {
        width: 44px;
        height: 44px;
        border-radius: 999px;
        background: var(--ac-color-primary);
        color: var(--ac-color-text-strong);
        display: grid;
        place-items: center;
        font-weight: bold;
      }

      .mock-doc-info {
        display: grid;
        gap: 2px;
      }

      .mock-doc-info strong {
        font-size: 15px;
      }

      .mock-doc-info span {
        font-size: 13px;
        color: var(--ac-color-text-muted);
      }

      /* Tools Section */
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
        box-shadow: 0 10px 28px rgb(41 74 90 / 0.08);
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
        padding: 72px clamp(24px, 5vw, 72px);
        background: var(--ac-color-surface);
        border-top: 1px solid var(--ac-color-border-slate);
        border-bottom: 1px solid var(--ac-color-border-slate);
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        align-items: center;
        gap: 56px;
      }

      .step-list {
        list-style: none;
        padding: 0;
        margin: 28px 0 0;
        display: grid;
        gap: 20px;
      }

      .step-list li {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      .step-list li > span {
        width: 32px;
        height: 32px;
        border-radius: 999px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
        font-size: 14px;
        font-weight: bold;
        flex-shrink: 0;
      }

      .step-list h3 {
        font-size: 17px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        margin-bottom: 4px;
      }

      .step-list p {
        font-size: 14px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
      }

      .product-preview {
        border-radius: 20px;
        background: var(--ac-color-surface-slate);
        border: 1px solid var(--ac-color-border-slate);
        overflow: hidden;
        box-shadow: 0 16px 40px rgb(41 74 90 / 0.1);
      }

      .preview-window header {
        height: 32px;
        background: var(--ac-color-surface-slate);
        border-bottom: 1px solid var(--ac-color-border-slate);
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 14px;
      }

      .preview-window header span {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: var(--ac-color-border-grey);
      }

      .preview-body {
        padding: 24px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .preview-panel {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 14px;
        padding: 16px;
        display: grid;
        gap: 6px;
      }

      .preview-panel.large {
        grid-column: span 2;
      }

      .preview-panel.blue {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-border-info);
      }

      .preview-panel p {
        font-size: 12px;
        color: var(--ac-color-text-muted);
      }

      .preview-panel strong {
        font-size: 16px;
        color: var(--ac-color-text-strong);
      }

      .preview-bars {
        display: flex;
        gap: 6px;
        margin-top: 6px;
      }

      .preview-bars span {
        height: 6px;
        flex: 1;
        border-radius: 999px;
        background: var(--ac-color-border-slate);
      }

      .preview-bars span:first-child {
        background: var(--ac-color-action);
      }

      /* Activities Section */
      .activities-section {
        padding: 72px clamp(24px, 5vw, 72px);
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        gap: 48px;
      }

      .activities-section h2 {
        font-size: 32px;
        font-weight: var(--ac-font-weight-bold);
        margin: 8px 0 14px;
      }

      .activities-section p {
        font-size: 16px;
        line-height: 1.6;
        color: var(--ac-color-text-body);
      }

      .activity-list {
        display: grid;
        gap: 16px;
      }

      .activity-list article {
        display: flex;
        align-items: center;
        gap: 14px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 14px;
        padding: 18px 22px;
        font-size: 16px;
        font-weight: var(--ac-font-weight-semibold);
      }

      .activity-list article span {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--ac-color-action);
      }

      /* Testimonials Section */
      .testimonials-section {
        padding: 72px clamp(24px, 5vw, 72px);
        background: var(--ac-color-surface-info);
        border-top: 1px solid var(--ac-color-border-info);
        border-bottom: 1px solid var(--ac-color-border-info);
      }

      .testimonials-carousel {
        max-width: 820px;
        margin: 0 auto;
        display: grid;
        gap: 28px;
      }

      .testimonial-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 24px;
        padding: 44px 48px;
        box-shadow: 0 12px 36px rgb(41 74 90 / 0.08);
        position: relative;
      }

      .quote-icon {
        font-size: 64px;
        line-height: 1;
        font-family: Georgia, serif;
        color: var(--ac-color-primary);
        margin-bottom: 12px;
      }

      .testimonial-text {
        font-size: 19px;
        line-height: 1.6;
        font-style: italic;
        color: var(--ac-color-text-strong);
        margin-bottom: 24px;
      }

      .testimonial-author-row {
        display: flex;
        align-items: center;
        gap: 16px;
        border-top: 1px solid var(--ac-color-border-slate);
        padding-top: 20px;
      }

      .author-avatar {
        width: 48px;
        height: 48px;
        border-radius: 999px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
        font-size: 16px;
        font-weight: bold;
      }

      .author-details {
        display: grid;
        gap: 2px;
      }

      .author-details strong {
        font-size: 16px;
        color: var(--ac-color-text-strong);
      }

      .author-details span {
        font-size: 14px;
        color: var(--ac-color-text-muted);
      }

      .carousel-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
      }

      .carousel-btn {
        width: 42px;
        height: 42px;
        border-radius: 999px;
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        display: grid;
        place-items: center;
        cursor: pointer;
        transition:
          background 160ms ease,
          border-color 160ms ease;
      }

      .carousel-btn svg {
        width: 18px;
        height: 18px;
      }

      .carousel-btn:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      .carousel-dots {
        display: flex;
        gap: 8px;
      }

      .carousel-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        border: 0;
        background: var(--ac-color-border-grey);
        cursor: pointer;
        padding: 0;
        transition:
          background 160ms ease,
          transform 160ms ease;
      }

      .carousel-dot.active {
        width: 24px;
        background: var(--ac-color-action);
      }

      /* Trust Badges Section */
      .trust-badges-section {
        padding: 72px clamp(24px, 5vw, 72px);
      }

      .trust-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 24px;
      }

      .trust-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 20px;
        padding: 32px 24px;
        text-align: center;
        display: grid;
        justify-items: center;
        gap: 12px;
      }

      .trust-card-icon {
        width: 48px;
        height: 48px;
        border-radius: 999px;
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
        display: grid;
        place-items: center;
      }

      .trust-card-icon svg {
        width: 24px;
        height: 24px;
      }

      .trust-card h3 {
        font-size: 17px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
      }

      .trust-card p {
        font-size: 14px;
        line-height: 1.5;
        color: var(--ac-color-text-body);
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

      /* Site Footer */
      .site-footer {
        padding: 64px clamp(24px, 5vw, 72px) 36px;
        background: var(--ac-color-background);
        border-top: 1px solid var(--ac-color-border-slate);
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1.5fr;
        gap: 40px;
      }

      .site-footer h2 {
        font-size: 15px;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        margin-bottom: 16px;
      }

      .site-footer nav {
        display: grid;
        gap: 10px;
      }

      .site-footer a {
        color: var(--ac-color-text-body);
        font-size: 14px;
        text-decoration: none;
        transition: color 160ms ease;
      }

      .site-footer a:hover {
        color: var(--ac-color-action-deep);
        text-decoration: underline;
      }

      .site-footer p {
        font-size: 14px;
        line-height: 1.55;
        color: var(--ac-color-text-muted);
        margin-top: 10px;
      }

      .site-footer .disclaimer {
        font-size: 12px;
        line-height: 1.5;
        color: var(--ac-color-text-muted);
        margin-top: 12px;
      }

      .copyright {
        grid-column: 1 / -1;
        padding-top: 24px;
        border-top: 1px solid var(--ac-color-border-slate);
        font-size: 13px;
        color: var(--ac-color-text-muted);
        text-align: center;
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
        background: rgb(15 23 42 / 0.45);
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
        box-shadow: -8px 0 32px rgb(15 23 42 / 0.2);
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
        padding-bottom: 16px;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .mobile-drawer-header .brand {
        font-size: 22px;
      }

      .mobile-drawer-close {
        width: 40px;
        height: 40px;
        border-radius: 999px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
        font-size: 16px;
        display: grid;
        place-items: center;
        cursor: pointer;
        transition: all 160ms ease;
      }

      .mobile-drawer-close:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      .mobile-drawer-nav {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 16px 0;
        flex: 1;
      }

      .mobile-drawer-nav a {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-radius: 12px;
        font-size: 15px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-strong);
        text-decoration: none;
        min-height: 44px;
        transition:
          background 140ms ease,
          color 140ms ease;
      }

      .mobile-drawer-nav a:hover,
      .mobile-drawer-nav a:focus-visible {
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
      }

      .drawer-icon {
        font-size: 18px;
        width: 24px;
        display: inline-flex;
        justify-content: center;
      }

      .mobile-drawer-footer {
        margin-top: auto;
        padding-top: 16px;
        border-top: 1px solid var(--ac-color-border-slate);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .mobile-drawer-primary-btn {
        height: 48px;
        border-radius: 9999px;
        background: linear-gradient(135deg, #0e7490 0%, #0369a1 100%);
        color: #ffffff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 20px;
        font-size: 15px;
        font-weight: 600;
        text-decoration: none;
        box-shadow: 0 4px 14px rgba(14, 116, 144, 0.28);
      }

      .mobile-drawer-secondary-btn {
        height: 46px;
        border-radius: 9999px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        color: #334155;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 20px;
        font-size: 15px;
        font-weight: 600;
        text-decoration: none;
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

        .progression-card {
          grid-template-columns: 1fr;
          gap: 28px;
          padding: 32px 24px;
        }

        .process-section {
          grid-template-columns: 1fr;
          gap: 40px;
          padding: 56px clamp(20px, 4vw, 40px);
        }

        .activities-section {
          grid-template-columns: 1fr;
          gap: 36px;
          padding: 56px clamp(20px, 4vw, 40px);
        }

        .site-footer {
          grid-template-columns: 1fr 1fr;
          gap: 32px;
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
          top: 10px;
          padding: 0 12px;
        }

        .nav-shell {
          height: 56px;
          padding: 0 8px 0 14px;
          gap: 8px;
        }

        .brand,
        .footer-brand {
          font-size: 19px;
          gap: 8px;
        }

        .brand-text {
          font-size: 19px;
        }

        .brand-logo-frame,
        .brand img,
        .footer-brand img {
          width: 30px;
          height: 30px;
        }

        .header-actions {
          gap: 6px;
        }

        .header-actions .login-link {
          display: none;
        }

        .header-actions .signup-link {
          display: none;
        }

        .topbar-lang-toggle {
          height: 34px;
          padding: 0 8px;
          font-size: 12px;
        }

        .topbar-lang-toggle .lang-text {
          font-size: 12px;
        }

        .dashboard-link {
          height: 34px;
          padding: 0 12px;
          font-size: 12.5px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          font-size: 12px;
        }

        .hero-section {
          min-height: 100svh;
          box-sizing: border-box;
          padding: 36px 16px 48px;
          gap: 28px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: linear-gradient(
            180deg,
            rgb(250 248 242 / 0.98) 0%,
            rgb(238 247 255 / 0.7) 100%
          );
        }

        .hero-copy {
          gap: 20px;
          text-align: center;
          align-items: center;
          margin: 0 auto;
        }

        .hero-section h1 {
          font-size: clamp(38px, 10.5vw, 54px);
          line-height: 1.1;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.03em;
          text-wrap: balance;
          text-align: center;
          word-break: normal;
          overflow-wrap: break-word;
        }

        .hero-subtitle {
          font-size: clamp(16.5px, 4.4vw, 19px);
          line-height: 1.55;
          color: #475569;
          margin: 0 auto;
          text-align: center;
          max-width: 480px;
        }

        .hero-actions {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 12px;
          margin-top: 6px;
          align-items: center;
        }

        .primary-action,
        .secondary-action {
          width: 100%;
          height: 52px;
          font-size: 16px;
          font-weight: 600;
          padding: 0 20px;
          border-radius: 999px;
          justify-content: center;
          text-align: center;
          box-sizing: border-box;
        }

        .primary-action {
          box-shadow: 0 10px 24px -4px rgba(41, 74, 90, 0.28);
        }

        .secondary-action {
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
        }

        .hero-media {
          margin-top: 4px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 20px 40px -12px rgba(15, 23, 42, 0.15),
            0 0 0 1px rgba(226, 232, 240, 0.85);
          border: none;
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

        .progression-section {
          padding: 44px 16px;
        }

        .stepper-tabs {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x mandatory;
          gap: 8px;
          padding: 4px 4px 12px;
          justify-content: flex-start;
          scrollbar-width: none;
        }

        .stepper-tabs::-webkit-scrollbar {
          display: none;
        }

        .stepper-tab {
          flex-shrink: 0;
          scroll-snap-align: start;
          padding: 8px 14px;
          font-size: 13px;
          border-radius: var(--ac-radius-pill);
        }

        .progression-card {
          padding: 20px 16px;
          border-radius: 18px;
          gap: 20px;
        }

        .progression-card-content h3 {
          font-size: 20px;
          line-height: 1.3;
        }

        .step-subtitle {
          font-size: 14px;
        }

        .step-desc {
          font-size: 13.5px;
        }

        .step-highlights li {
          font-size: 13px;
          gap: 8px;
        }

        .step-cta-btn {
          width: 100%;
          height: 46px;
          justify-content: center;
          font-size: 14px;
          border-radius: 10px;
        }

        .visual-body {
          padding: 16px;
          min-height: 140px;
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
          gap: 16px;
        }

        .step-list li {
          gap: 12px;
        }

        .step-list li > span {
          width: 28px;
          height: 28px;
          font-size: 13px;
        }

        .step-list h3 {
          font-size: 15px;
        }

        .step-list p {
          font-size: 13px;
        }

        .product-preview {
          border-radius: 16px;
        }

        .preview-body {
          grid-template-columns: 1fr;
          gap: 10px;
          padding: 14px;
        }

        .preview-panel.large {
          grid-column: span 1;
        }

        .activities-section {
          padding: 44px 16px;
          gap: 24px;
        }

        .activities-section h2 {
          font-size: clamp(22px, 5.2vw, 28px);
        }

        .activity-list article {
          padding: 12px 14px;
          font-size: 13.5px;
          border-radius: 12px;
          gap: 10px;
        }

        .testimonials-section {
          padding: 44px 16px;
        }

        .testimonials-carousel {
          gap: 20px;
        }

        .testimonial-card {
          padding: 24px 16px 20px;
          border-radius: 18px;
        }

        .quote-icon {
          font-size: 42px;
          margin-bottom: 4px;
        }

        .testimonial-text {
          font-size: 15px;
          line-height: 1.55;
          margin-bottom: 16px;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          font-size: 14px;
        }

        .author-details strong {
          font-size: 15px;
        }

        .author-details span {
          font-size: 13px;
        }

        .carousel-btn {
          width: 44px;
          height: 44px;
        }

        .trust-badges-section {
          padding: 44px 16px;
        }

        .trust-cards-grid {
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .trust-card {
          padding: 20px 16px;
          border-radius: 16px;
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
          padding: 40px 16px 24px;
          grid-template-columns: 1fr;
          gap: 28px;
        }

        .site-footer nav a {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
        }

        .footer-brand {
          font-size: 22px;
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
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);

  readonly currentLang = computed(() => this.i18n.currentLang());

  readonly tools = computed(() => (this.currentLang() === 'km' ? KM_TOOLS : EN_TOOLS));
  readonly steps = computed(() => (this.currentLang() === 'km' ? KM_STEPS : EN_STEPS));
  readonly activityHighlights = computed(() =>
    this.currentLang() === 'km' ? KM_ACTIVITY_HIGHLIGHTS : EN_ACTIVITY_HIGHLIGHTS,
  );
  readonly autismNotes = computed(() =>
    this.currentLang() === 'km' ? KM_AUTISM_NOTES : EN_AUTISM_NOTES,
  );
  readonly progressionSteps = computed(() =>
    this.currentLang() === 'km' ? KM_PROGRESSION_STEPS : EN_PROGRESSION_STEPS,
  );
  readonly testimonials = computed(() =>
    this.currentLang() === 'km' ? KM_TESTIMONIALS : EN_TESTIMONIALS,
  );
  readonly trustBadges = computed(() =>
    this.currentLang() === 'km' ? KM_TRUST_BADGES : EN_TRUST_BADGES,
  );

  readonly activeProgressionStep = signal(0);
  readonly activeTestimonial = signal(0);
  readonly mobileMenuOpen = signal(false);
  readonly currentYear = new Date().getFullYear();

  readonly isAuthenticated = computed(() => this.auth.isAuthenticated());
  readonly currentParent = computed(() => this.auth.parent());

  readonly currentProgressionStep = computed(() => {
    const list = this.progressionSteps();
    return list[this.activeProgressionStep()] ?? list[0];
  });

  readonly currentTestimonial = computed(() => {
    const list = this.testimonials();
    return list[this.activeTestimonial()] ?? list[0];
  });

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

  selectProgressionStep(index: number) {
    this.activeProgressionStep.set(index);
  }

  nextTestimonial() {
    const count = this.testimonials().length;
    this.activeTestimonial.update((curr) => (curr + 1) % count);
  }

  prevTestimonial() {
    const count = this.testimonials().length;
    this.activeTestimonial.update((curr) => (curr === 0 ? count - 1 : curr - 1));
  }

  setTestimonial(index: number) {
    this.activeTestimonial.set(index);
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
