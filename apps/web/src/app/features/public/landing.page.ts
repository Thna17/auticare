import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface ProgressionStep {
  id: string;
  stepNumber: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  ctaLabel: string;
  ctaLink: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  avatarInitials: string;
}

interface TrustBadge {
  title: string;
  description: string;
  icon: string;
}

const PROGRESSION_STEPS: ProgressionStep[] = [
  {
    id: 'screening',
    stepNumber: '01',
    badge: 'Clinical Screening',
    title: 'Evidence-Based Developmental Screening',
    subtitle: 'M-CHAT-aligned assessment with gentle, non-alarmist clarity',
    description:
      'Answer guided developmental questionnaires observing communication, social engagement, and sensory sensitivities. Receive non-alarmist risk band insights with domain-by-domain clarity.',
    highlights: [
      'Calming, distraction-free assessment workflow',
      'Category breakdown across Communication, Social, and Sensory',
      'Downloadable clinical summary to share with your pediatrician',
    ],
    ctaLabel: 'Explore Screening Tools',
    ctaLink: '/screening',
  },
  {
    id: 'care-plan',
    stepNumber: '02',
    badge: 'Care & Activities',
    title: 'Personalized Daily Milestones & Sensory Play',
    subtitle: 'Routines tailored directly to your child’s unique needs',
    description:
      'Turn screening insights into joyful daily progress. Access hundreds of sensory-friendly play activities, speech prompts, and routine-building exercises tailored to your child.',
    highlights: [
      'Filtered by sensory intensity, motor focus, and daily living',
      'Recommended priority activities addressing identified screening needs',
      'Parent reflection notes and milestone completion tracker',
    ],
    ctaLabel: 'Browse Activity Library',
    ctaLink: '/activities',
  },
  {
    id: 'specialists',
    stepNumber: '03',
    badge: 'Clinical Network',
    title: 'Pediatric Specialist Discovery & Booking',
    subtitle: 'Connect with developmental pediatricians and therapists',
    description:
      'Find accredited developmental pediatricians, speech-language pathologists, and occupational therapists. Request consultations with your child’s history already organized.',
    highlights: [
      'Verified partner hospitals and licensed clinical specialists',
      'Consultation slot availability and real-time appointment tracking',
      'Care notes and developmental records securely linked to requests',
    ],
    ctaLabel: 'Find Hospital Specialists',
    ctaLink: '/hospitals',
  },
  {
    id: 'schools',
    stepNumber: '04',
    badge: 'Education Support',
    title: 'Special Education Collaboration & Reports',
    subtitle: 'Bridge home routines with inclusive classroom support',
    description:
      'Search specialized schools with autism support programs, transparent student-to-teacher ratios, and sensory rooms. Exchange structured observation reports with teachers.',
    highlights: [
      'Specialized school directory with facilities & program filters',
      'Shared teacher observation reports and milestone logs',
      'Streamlined parent admission & enrollment request tracker',
    ],
    ctaLabel: 'Explore Inclusive Schools',
    ctaLink: '/schools',
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'AutiCare changed how we communicate with our developmental pediatrician. Having structured observations and screening history in one place gave our family clarity instead of anxiety.',
    author: 'Elena Rostova',
    role: 'Parent of 4-year-old with ASD',
    avatarInitials: 'ER',
  },
  {
    quote:
      'The consistency of observation records between home and school saves our clinic weeks during evaluations. Families arrive informed, calm, and prepared.',
    author: 'Dr. Marcus Chen',
    role: 'Developmental Pediatrician & Clinical Director',
    avatarInitials: 'MC',
  },
  {
    quote:
      'Being able to submit and review classroom observation reports directly with parents bridges the gap between home routines and classroom accommodations.',
    author: 'Sarah Jenkins, M.Ed.',
    role: 'Special Education Inclusion Coordinator',
    avatarInitials: 'SJ',
  },
];

const TRUST_BADGES: TrustBadge[] = [
  {
    title: 'Evidence-Based Framework',
    description:
      'Screening aligned with validated pediatric developmental milestones and clinical M-CHAT principles.',
    icon: 'shield',
  },
  {
    title: 'Private & Secure Family Data',
    description:
      'Zero third-party advertising, zero data brokers. All observations belong strictly to your family.',
    icon: 'lock',
  },
  {
    title: 'Multidisciplinary Team Care',
    description:
      'Brings parents, developmental pediatricians, therapists, and educators onto one collaborative continuum.',
    icon: 'users',
  },
  {
    title: 'Sensory-Friendly Design',
    description:
      'Designed around neuro-inclusive accessibility: gentle colors, clear typography, and zero sensory overload.',
    icon: 'heart',
  },
];

const tools = [
  {
    title: 'Early risk screening',
    description:
      'Use guided questionnaires and behavioral observations to understand where extra support may help.',
    icon: 'checklist',
  },
  {
    title: 'Find specialists',
    description:
      'Browse schools, hospitals, and care providers that support neurodiverse children and families.',
    icon: 'map',
  },
  {
    title: 'Personalized activities',
    description:
      'Keep activity ideas connected to each child profile, support needs, and family routines.',
    icon: 'activity',
  },
  {
    title: 'Track progress',
    description:
      'Follow milestones, appointments, and reports in one calm workspace built for repeated use.',
    icon: 'trend',
  },
] as const;

const steps = [
  {
    title: "Create your child's profile",
    description: 'Add the context that helps AutiCare tailor screening and support planning.',
  },
  {
    title: 'Complete initial screening',
    description: 'Map strengths, routines, and areas where your child may need additional support.',
  },
  {
    title: 'Receive practical guidance',
    description: 'Review recommended activities, school options, and care next steps.',
  },
  {
    title: 'Coordinate with experts',
    description: 'Connect family records, providers, school reports, and appointments over time.',
  },
] as const;

const activityHighlights = [
  'Sensory-friendly play ideas',
  'Communication practice prompts',
  'Routine-building activities',
] as const;

const autismNotes = [
  {
    title: 'Support needs are individual',
    description:
      'AutiCare organizes observations around the child, not a one-size-fits-all checklist.',
  },
  {
    title: 'Screening is a starting point',
    description:
      'Families can use structured notes to prepare better conversations with licensed specialists.',
  },
  {
    title: 'Progress works best as a team',
    description:
      'Parents, schools, hospitals, and support providers all need clear shared context.',
  },
] as const;

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="landing-page">
      <header class="site-header">
        <a class="brand" routerLink="/" aria-label="AutiCare home">
          <img src="/images/auticare-logo.jpg" alt="" aria-hidden="true" width="40" height="37" />
          <span>AutiCare</span>
        </a>

        <nav class="desktop-nav" aria-label="Main navigation">
          <a href="#home" aria-current="page" (click)="scrollToSection('home', $event)">Home</a>
          <a href="#progression" (click)="scrollToSection('progression', $event)">Features</a>
          <a href="#how-it-works" (click)="scrollToSection('how-it-works', $event)">How it works</a>
          <a href="#support" (click)="scrollToSection('support', $event)">Find support</a>
          <a href="#activities" (click)="scrollToSection('activities', $event)">Activities</a>
          <a href="#testimonials" (click)="scrollToSection('testimonials', $event)">Testimonials</a>
          <a href="#about-autism" (click)="scrollToSection('about-autism', $event)">About autism</a>
        </nav>

        <div class="header-actions">
          @if (isAuthenticated()) {
            <a class="dashboard-link" [routerLink]="dashboardPath()">Go to Dashboard</a>
            <span
              class="user-avatar"
              [attr.aria-label]="userDisplayName()"
              [title]="userDisplayName()"
            >
              {{ userInitials() }}
            </span>
          } @else {
            <a class="login-link" routerLink="/login">Login</a>
            <a class="signup-link" routerLink="/register">Signup</a>
          }
        </div>
      </header>

      <!-- High-Impact Hero Section -->
      <section id="home" class="hero-section">
        <div class="hero-copy">
          <div class="hero-trust-badge-pill">
            <span class="live-dot" aria-hidden="true"></span>
            <span>Neuro-inclusive Developmental Support Platform</span>
          </div>

          <h1>Support for every step of your child's journey</h1>
          <p class="hero-subtitle">
            Help parents, schools, and care providers understand each child with structured
            screening, personalized activities, and coordinated support records.
          </p>

          <aside class="medical-note">
            <span class="info-icon" aria-hidden="true">i</span>
            <p>
              <strong>Important note:</strong> AutiCare screening is not a medical diagnosis. Always
              consult a licensed pediatrician for clinical evaluations.
            </p>
          </aside>

          <div class="hero-actions">
            @if (isAuthenticated()) {
              <a class="primary-action" [routerLink]="dashboardPath()">Go to Dashboard</a>
            } @else {
              <a class="primary-action" routerLink="/register">Get started</a>
            }
            <a
              class="secondary-action"
              href="#how-it-works"
              (click)="scrollToSection('how-it-works', $event)"
            >
              Learn how it works
            </a>
          </div>

          <!-- Trust Badges Strip -->
          <div class="trust-strip">
            <div class="trust-pill">
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path
                  d="M10 2l6 3v5c0 4-3 7-6 8-3-1-6-4-6-8V5l6-3z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
                <path
                  d="M7 10l2 2 4-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              <span>Evidence-Based Screening</span>
            </div>
            <div class="trust-pill">
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path
                  d="M13 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM10 11c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4z"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
              </svg>
              <span>Multidisciplinary Network</span>
            </div>
            <div class="trust-pill">
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <rect
                  x="3"
                  y="8"
                  width="14"
                  height="10"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
                <path
                  d="M6 8V5a4 4 0 0 1 8 0v3"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
              </svg>
              <span>100% Private Family Data</span>
            </div>
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
          <p class="section-kicker">Unified Care Journey</p>
          <h2 id="progression-title">How AutiCare Guides Your Care Continuum</h2>
          <p>
            From early heuristic observations to clinical evaluations and classroom adaptations,
            experience seamless progression at every milestone.
          </p>
        </div>

        <!-- Interactive Stepper Tabs -->
        <div class="stepper-tabs" role="tablist" aria-label="Care progression steps">
          @for (step of progressionSteps; track step.id; let i = $index) {
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
                <span class="step-order">Step {{ active.stepNumber }} of 04</span>
              </div>
              <h3>{{ active.title }}</h3>
              <p class="step-subtitle">{{ active.subtitle }}</p>
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
                      <span class="mock-label">Developmental Screening</span>
                      <div class="mock-risk-meter">
                        <div class="mock-risk-bar"></div>
                      </div>
                      <span class="mock-status">Low Heuristic Risk · 85% Completed</span>
                    </div>
                  } @else if (active.id === 'care-plan') {
                    <div class="mock-activity-card">
                      <span class="mock-tag">Sensory Play</span>
                      <h4>Texture Discovery & Calming Corner</h4>
                      <span class="mock-time">15 mins · Gentle Sensory</span>
                    </div>
                  } @else if (active.id === 'specialists') {
                    <div class="mock-doctor-card">
                      <div class="mock-avatar">MC</div>
                      <div class="mock-doc-info">
                        <strong>Dr. Marcus Chen</strong>
                        <span>Developmental Pediatrics</span>
                      </div>
                    </div>
                  } @else {
                    <div class="mock-school-card">
                      <span class="mock-badge">Verified Inclusive School</span>
                      <h4>Sunrise Special Learning Academy</h4>
                      <span>1:4 Student-to-Teacher Ratio</span>
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
          <h2 id="tools-title">Comprehensive tools for development</h2>
          <p>
            AutiCare keeps core support tasks organized without overwhelming families or care teams.
          </p>
        </div>

        <div class="tool-grid">
          @for (tool of tools; track tool.title) {
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
          <h2 id="process-title">How AutiCare supports you</h2>

          <ol class="step-list">
            @for (step of steps; track step.title; let index = $index) {
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
                <p>Child profile</p>
                <strong>Support overview</strong>
                <div class="preview-bars" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </section>
              <section class="preview-panel">
                <p>School report</p>
                <strong>Ready</strong>
              </section>
              <section class="preview-panel blue">
                <p>Next action</p>
                <strong>Speech activity</strong>
              </section>
            </div>
          </div>
        </div>
      </section>

      <!-- Activities Section -->
      <section id="activities" class="activities-section" aria-labelledby="activities-title">
        <div>
          <p class="section-kicker">Activities</p>
          <h2 id="activities-title">Turn support goals into practical routines</h2>
          <p>
            Activity planning in AutiCare is built for real family life: simple prompts, repeatable
            routines, and enough structure for parents and professionals to review what is working.
          </p>
        </div>

        <div class="activity-list">
          @for (activity of activityHighlights; track activity) {
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
          <p class="section-kicker">Voices of Our Community</p>
          <h2 id="testimonials-title">Trusted by Families, Clinicians & Educators</h2>
          <p>
            Real stories from the parents and professionals who build brighter futures together.
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
              aria-label="Previous testimonial"
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
              @for (item of testimonials; track item.author; let idx = $index) {
                <button
                  type="button"
                  class="carousel-dot"
                  [class.active]="activeTestimonial() === idx"
                  [attr.aria-label]="'Go to testimonial ' + (idx + 1)"
                  (click)="setTestimonial(idx)"
                ></button>
              }
            </div>

            <button
              type="button"
              class="carousel-btn next"
              aria-label="Next testimonial"
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
          <h2 id="trust-title">Built with Clinical Integrity & Safety First</h2>
          <p>Every feature in AutiCare is engineered to respect privacy and empower families.</p>
        </div>

        <div class="trust-cards-grid">
          @for (badge of trustBadges; track badge.title) {
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
          <p class="section-kicker">About autism</p>
          <h2 id="autism-title">Designed around clarity, dignity, and coordination</h2>
          <p>
            Autism support is strongest when families can understand needs, record context, and
            bring better information to qualified professionals.
          </p>
        </div>

        <div class="autism-grid">
          @for (note of autismNotes; track note.title) {
            <article>
              <h3>{{ note.title }}</h3>
              <p>{{ note.description }}</p>
            </article>
          }
        </div>
      </section>

      <!-- Final Call to Action -->
      <section id="start" class="cta-section" aria-labelledby="cta-title">
        <h2 id="cta-title">Ready to start the journey?</h2>
        <p>
          Create a family account and begin organizing screening, activities, and support resources
          in one calm workspace.
        </p>
        @if (isAuthenticated()) {
          <a [routerLink]="dashboardPath()">Go to Dashboard</a>
        } @else {
          <a routerLink="/register">Create account</a>
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
            Empowering neurodiverse families through accessible support tools and coordinated care.
          </p>
        </section>

        <nav aria-label="Resources">
          <h2>Resources</h2>
          <a routerLink="/crisis">Emergency resources</a>
          <a href="#about-autism" (click)="scrollToSection('about-autism', $event)">
            About autism
          </a>
          <a routerLink="/support">Support groups</a>
        </nav>

        <nav aria-label="Legal">
          <h2>Legal</h2>
          <a routerLink="/privacy">Privacy</a>
          <a routerLink="/terms">Terms</a>
          <a routerLink="/support">Medical disclaimer</a>
        </nav>

        <section>
          <h2>Contact</h2>
          <a routerLink="/support">Contact</a>
          <p class="disclaimer">
            Medical disclaimer: AutiCare provides screening tools and educational resources. We do
            not provide clinical diagnosis or treatment plans.
          </p>
        </section>

        <p class="copyright">(c) {{ currentYear }} AutiCare. All rights reserved.</p>
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

      .site-header {
        position: sticky;
        top: 0;
        z-index: 20;
        min-height: 76px;
        border-bottom: 1px solid var(--ac-color-border-slate);
        background: rgb(250 248 242 / 0.94);
        backdrop-filter: blur(18px);
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 28px;
        padding: 0 clamp(24px, 5vw, 64px);
      }

      .brand,
      .footer-brand {
        color: var(--ac-color-action-mid);
        display: inline-flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        font-size: 30px;
        line-height: 1;
        font-weight: var(--ac-font-weight-bold);
      }

      .brand img,
      .footer-brand img {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        object-fit: cover;
        box-shadow: 0 0 0 1px var(--ac-color-sky-light);
      }

      .desktop-nav {
        justify-self: center;
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .desktop-nav a,
      .login-link {
        color: var(--ac-color-text-body);
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        transition: color 160ms ease;
      }

      .desktop-nav a:hover,
      .login-link:hover {
        color: var(--ac-color-action-deep);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .signup-link,
      .dashboard-link {
        height: 44px;
        border-radius: 12px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 20px;
        font-size: 14px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        transition: background 160ms ease;
      }

      .signup-link:hover,
      .dashboard-link:hover {
        background: var(--ac-color-action-alt);
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 999px;
        background: var(--ac-color-primary);
        color: var(--ac-color-text-strong);
        display: grid;
        place-items: center;
        font-size: 14px;
        font-weight: var(--ac-font-weight-bold);
      }

      /* Hero Section */
      .hero-section {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.95fr);
        align-items: center;
        gap: 48px;
        padding: 64px clamp(24px, 5vw, 72px) 56px;
        background: linear-gradient(
          135deg,
          rgb(250 248 242 / 0.95) 0%,
          rgb(232 246 255 / 0.75) 100%
        );
      }

      .hero-copy {
        display: grid;
        gap: 20px;
        max-width: 620px;
      }

      .hero-trust-badge-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        border: 1px solid var(--ac-color-border-info);
        color: var(--ac-color-action-deep);
        font-size: 13px;
        font-weight: var(--ac-font-weight-semibold);
        width: fit-content;
      }

      .live-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--ac-color-green-600);
      }

      .hero-section h1 {
        font-size: clamp(34px, 4.2vw, 52px);
        line-height: 1.15;
        font-weight: var(--ac-font-weight-bold);
        color: var(--ac-color-text-strong);
        letter-spacing: -0.02em;
      }

      .hero-subtitle {
        font-size: clamp(16px, 1.8vw, 19px);
        line-height: 1.55;
        color: var(--ac-color-text-body);
      }

      .medical-note {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 12px;
        background: var(--ac-color-blue-tint-wash);
        border: 1px solid var(--ac-color-border-info);
        font-size: 13px;
        line-height: 1.45;
        color: var(--ac-color-text-body);
      }

      .info-icon {
        width: 20px;
        height: 20px;
        border-radius: 999px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: grid;
        place-items: center;
        font-weight: bold;
        font-style: italic;
        font-size: 12px;
        flex-shrink: 0;
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-top: 6px;
      }

      .primary-action {
        height: 52px;
        border-radius: 14px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 28px;
        font-size: 16px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        box-shadow: 0 8px 20px rgb(41 74 90 / 0.16);
        transition:
          background 160ms ease,
          box-shadow 160ms ease;
      }

      .primary-action:hover {
        background: var(--ac-color-action-alt);
        box-shadow: 0 10px 24px rgb(41 74 90 / 0.22);
      }

      .secondary-action {
        height: 52px;
        border-radius: 14px;
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-grey);
        color: var(--ac-color-text-strong);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 24px;
        font-size: 16px;
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
        transition:
          background 160ms ease,
          border-color 160ms ease;
      }

      .secondary-action:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      .trust-strip {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-top: 10px;
        padding-top: 18px;
        border-top: 1px solid var(--ac-color-border-slate);
      }

      .trust-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: var(--ac-font-weight-semibold);
        color: var(--ac-color-text-muted);
      }

      .trust-pill svg {
        width: 16px;
        height: 16px;
        color: var(--ac-color-action);
      }

      .hero-media {
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 24px 60px rgb(41 74 90 / 0.12);
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

      @media (max-width: 1024px) {
        .hero-section {
          grid-template-columns: 1fr;
        }

        .progression-card {
          grid-template-columns: 1fr;
        }

        .process-section {
          grid-template-columns: 1fr;
        }

        .activities-section {
          grid-template-columns: 1fr;
        }

        .site-footer {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 768px) {
        .desktop-nav {
          display: none;
        }

        .site-header {
          grid-template-columns: 1fr auto;
        }

        .site-footer {
          grid-template-columns: 1fr;
        }

        .testimonial-card {
          padding: 32px 24px;
        }

        .testimonial-text {
          font-size: 16px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  private readonly auth = inject(AuthService);

  readonly tools = tools;
  readonly steps = steps;
  readonly activityHighlights = activityHighlights;
  readonly autismNotes = autismNotes;
  readonly progressionSteps = PROGRESSION_STEPS;
  readonly testimonials = TESTIMONIALS;
  readonly trustBadges = TRUST_BADGES;

  readonly activeProgressionStep = signal(0);
  readonly activeTestimonial = signal(0);
  readonly currentYear = new Date().getFullYear();

  readonly isAuthenticated = computed(() => this.auth.isAuthenticated());
  readonly currentParent = computed(() => this.auth.parent());

  readonly currentProgressionStep = computed(
    () => this.progressionSteps[this.activeProgressionStep()] ?? this.progressionSteps[0],
  );

  readonly currentTestimonial = computed(
    () => this.testimonials[this.activeTestimonial()] ?? this.testimonials[0],
  );

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

  selectProgressionStep(index: number) {
    this.activeProgressionStep.set(index);
  }

  nextTestimonial() {
    this.activeTestimonial.update((curr) => (curr + 1) % this.testimonials.length);
  }

  prevTestimonial() {
    this.activeTestimonial.update((curr) => (curr === 0 ? this.testimonials.length - 1 : curr - 1));
  }

  setTestimonial(index: number) {
    this.activeTestimonial.set(index);
  }

  scrollToSection(sectionId: string, event: Event) {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      history.pushState(null, '', `#${sectionId}`);
    }
  }
}
