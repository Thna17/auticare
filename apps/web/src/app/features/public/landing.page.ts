import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

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
          <img src="/images/auticare-logo.jpg" alt="" aria-hidden="true" />
          <span>AutiCare</span>
        </a>

        <nav class="desktop-nav" aria-label="Main navigation">
          <a href="#home" aria-current="page" (click)="scrollToSection('home', $event)">Home</a>
          <a href="#how-it-works" (click)="scrollToSection('how-it-works', $event)">
            How it works
          </a>
          <a href="#support" (click)="scrollToSection('support', $event)">Find support</a>
          <a href="#activities" (click)="scrollToSection('activities', $event)">Activities</a>
          <a href="#about-autism" (click)="scrollToSection('about-autism', $event)">
            About autism
          </a>
        </nav>

        <div class="header-actions">
          <a class="login-link" routerLink="/login">Login</a>
          <a class="signup-link" routerLink="/register">Signup</a>
        </div>
      </header>

      <section id="home" class="hero-section">
        <div class="hero-copy">
          <p class="eyebrow">
            <span aria-hidden="true"></span>
            Neuro-inclusive Support Platform
          </p>
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
            <a class="primary-action" routerLink="/register">Get started</a>
            <a
              class="secondary-action"
              href="#how-it-works"
              (click)="scrollToSection('how-it-works', $event)"
            >
              Learn how it works
            </a>
          </div>
        </div>

        <div class="hero-media" aria-label="Parent and child support illustration">
          <img src="/images/signup-hero.png" alt="" />
        </div>
      </section>

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

      <section id="start" class="cta-section" aria-labelledby="cta-title">
        <h2 id="cta-title">Ready to start the journey?</h2>
        <p>
          Create a family account and begin organizing screening, activities, and support resources
          in one calm workspace.
        </p>
        <a routerLink="/register">Create account</a>
      </section>

      <footer class="site-footer">
        <section>
          <a class="footer-brand" routerLink="/" aria-label="AutiCare home">
            <img src="/images/auticare-logo.jpg" alt="" aria-hidden="true" />
            <span>AutiCare</span>
          </a>
          <p>
            Empowering neurodiverse families through accessible support tools and coordinated care.
          </p>
        </section>

        <nav aria-label="Resources">
          <h2>Resources</h2>
          <a routerLink="/support">Emergency resources</a>
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

        <p class="copyright">(c) 2024 AutiCare. All rights reserved.</p>
      </footer>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        background: #faf8f2;
        color: #001e2b;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      .landing-page {
        min-height: 100svh;
        background:
          linear-gradient(120deg, rgb(250 248 242 / 0.96) 0 38%, rgb(232 246 255 / 0.72) 100%),
          #faf8f2;
      }

      .site-header {
        position: sticky;
        top: 0;
        z-index: 10;
        min-height: 76px;
        border-bottom: 1px solid rgb(193 211 220 / 0.56);
        background: rgb(250 248 242 / 0.92);
        backdrop-filter: blur(18px);
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 28px;
        padding: 0 clamp(24px, 5vw, 64px);
      }

      .brand,
      .footer-brand {
        color: #315d72;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        font-size: 32px;
        line-height: 1;
        font-weight: var(--ac-font-weight-bold);
      }

      .brand img,
      .footer-brand img {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        object-fit: cover;
        box-shadow: 0 0 0 1px #9bc6d8;
      }

      .desktop-nav {
        justify-self: center;
        display: flex;
        align-items: center;
        gap: 28px;
      }

      .desktop-nav a,
      .login-link {
        color: #41484b;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
        text-decoration: none;
      }

      .desktop-nav a {
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        border-bottom: 2px solid transparent;
      }

      .desktop-nav a:hover,
      .desktop-nav a[aria-current='page'] {
        color: #315d72;
        border-bottom-color: #315d72;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 18px;
      }

      .signup-link,
      .primary-action,
      .cta-section a {
        min-height: 48px;
        border-radius: 12px;
        background: #3d6375;
        color: #ffffff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 24px;
        text-decoration: none;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
        box-shadow: 0 10px 22px rgb(61 99 117 / 0.16);
      }

      .hero-section {
        min-height: min(820px, calc(100svh - 76px));
        display: grid;
        grid-template-columns: minmax(0, 0.95fr) minmax(340px, 1fr);
        align-items: center;
        gap: clamp(48px, 8vw, 116px);
        padding: clamp(56px, 7vw, 92px) clamp(24px, 5vw, 64px);
      }

      .hero-section,
      .tools-section,
      .process-section,
      .activities-section,
      .autism-section,
      .cta-section {
        scroll-margin-top: 92px;
      }

      .hero-copy {
        max-width: 640px;
        display: grid;
        justify-items: start;
        gap: 28px;
      }

      .eyebrow {
        border-radius: 999px;
        background: #d7e9c0;
        color: #586947;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-semibold);
      }

      .eyebrow span {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #7ea563;
      }

      .hero-section h1 {
        max-width: 620px;
        color: #001e2b;
        font-size: clamp(40px, 6vw, 64px);
        line-height: 1.12;
        font-weight: var(--ac-font-weight-bold);
      }

      .hero-subtitle {
        max-width: 610px;
        color: #4c575c;
        font-size: 18px;
        line-height: 1.65;
      }

      .medical-note {
        max-width: 460px;
        border: 1px solid #c1d3dc;
        border-radius: 12px;
        background: #ffffff;
        color: #41484b;
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr);
        gap: 12px;
        padding: 16px 18px;
        box-shadow: 0 8px 26px rgb(41 74 90 / 0.05);
      }

      .medical-note p {
        font-size: var(--ac-type-meta);
        line-height: 1.5;
      }

      .info-icon {
        width: 20px;
        height: 20px;
        border-radius: 999px;
        border: 2px solid #8db4c8;
        color: #315d72;
        display: grid;
        place-items: center;
        font-size: 12px;
        font-weight: var(--ac-font-weight-bold);
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
      }

      .secondary-action {
        min-height: 48px;
        border: 2px solid #63899b;
        border-radius: 12px;
        color: #315d72;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 24px;
        text-decoration: none;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-semibold);
      }

      .hero-media {
        border-radius: 28px;
        overflow: hidden;
        background: #e8f6ff;
        box-shadow: 0 24px 46px rgb(41 74 90 / 0.18);
      }

      .hero-media img {
        width: 100%;
        aspect-ratio: 16 / 9;
        display: block;
        object-fit: cover;
      }

      .tools-section,
      .process-section,
      .autism-section {
        padding: 88px clamp(24px, 5vw, 64px);
        background: #ffffff;
      }

      .section-heading {
        max-width: 640px;
        margin: 0 auto 48px;
        text-align: center;
        display: grid;
        gap: 16px;
      }

      .section-heading h2,
      .process-section h2,
      .activities-section h2,
      .cta-section h2 {
        color: #001e2b;
        font-size: clamp(32px, 4vw, 44px);
        line-height: 1.18;
        font-weight: var(--ac-font-weight-bold);
      }

      .section-heading p,
      .activities-section > div:first-child > p:last-child,
      .cta-section p {
        color: #5b666b;
        font-size: 17px;
        line-height: 1.65;
      }

      .section-kicker {
        color: #546343;
        font-size: var(--ac-type-meta);
        font-weight: var(--ac-font-weight-bold);
        text-transform: uppercase;
      }

      .tool-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 26px;
      }

      .tool-card {
        min-height: 260px;
        border: 1px solid rgb(221 229 228 / 0.72);
        border-radius: 24px;
        background: #ffffff;
        display: grid;
        align-content: start;
        gap: 18px;
        padding: 34px;
        box-shadow: 0 16px 34px rgb(41 74 90 / 0.07);
      }

      .tool-card h3 {
        color: #123443;
        font-size: 20px;
        line-height: 1.3;
        font-weight: var(--ac-font-weight-bold);
      }

      .tool-card p {
        color: #586369;
        line-height: 1.58;
      }

      .tool-icon {
        width: 58px;
        height: 58px;
        border-radius: 14px;
        background: #ceedff;
        color: #3d6375;
        position: relative;
      }

      .tool-icon::before,
      .tool-icon::after {
        content: '';
        position: absolute;
        box-sizing: border-box;
      }

      .tool-icon::before {
        inset: 16px;
        border: 2px solid currentColor;
        border-radius: 4px;
      }

      .tool-icon::after {
        left: 19px;
        top: 19px;
        width: 20px;
        height: 20px;
        border-top: 2px solid currentColor;
        border-right: 2px solid currentColor;
      }

      .tool-icon.map {
        background: #d7e9c0;
        color: #5a6949;
      }

      .tool-icon.activity {
        background: #d5c2a5;
        color: #4f412d;
      }

      .process-section {
        background: #faf8f2;
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(340px, 1fr);
        align-items: center;
        gap: clamp(48px, 8vw, 112px);
      }

      .process-copy {
        max-width: 620px;
        display: grid;
        gap: 42px;
      }

      .step-list {
        list-style: none;
        display: grid;
        gap: 28px;
        margin: 0;
        padding: 0;
      }

      .step-list li {
        display: grid;
        grid-template-columns: 48px minmax(0, 1fr);
        gap: 22px;
      }

      .step-list span {
        width: 48px;
        height: 48px;
        border-radius: 999px;
        background: #3d6375;
        color: #ffffff;
        display: grid;
        place-items: center;
        font-weight: var(--ac-font-weight-bold);
      }

      .step-list h3 {
        color: #123443;
        font-size: 18px;
        line-height: 1.3;
        font-weight: var(--ac-font-weight-bold);
        margin-bottom: 8px;
      }

      .step-list p {
        color: #5b666b;
        line-height: 1.58;
      }

      .product-preview {
        border-radius: 28px;
        background: #ffffff;
        padding: 18px;
        box-shadow: 0 18px 44px rgb(41 74 90 / 0.1);
      }

      .preview-window {
        border: 1px solid #d4e6ef;
        border-radius: 20px;
        overflow: hidden;
        background: #f2f9fd;
      }

      .preview-window header {
        min-height: 44px;
        border-bottom: 1px solid #d4e6ef;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 18px;
      }

      .preview-window header span {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: #8db4c8;
      }

      .preview-body {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 16px;
        padding: 18px;
      }

      .preview-panel {
        min-height: 118px;
        border: 1px solid rgb(193 211 220 / 0.72);
        border-radius: 16px;
        background: #ffffff;
        display: grid;
        align-content: start;
        gap: 8px;
        padding: 18px;
      }

      .preview-panel.large {
        grid-row: span 2;
      }

      .preview-panel.blue {
        background: #e8f6ff;
      }

      .preview-panel p {
        color: #5b666b;
        font-size: var(--ac-type-meta);
      }

      .preview-panel strong {
        color: #001e2b;
        font-size: 20px;
      }

      .preview-bars {
        margin-top: 28px;
        display: flex;
        align-items: end;
        gap: 12px;
      }

      .preview-bars span {
        width: 42px;
        border-radius: 12px 12px 0 0;
        background: #ceedff;
      }

      .preview-bars span:nth-child(1) {
        height: 80px;
      }

      .preview-bars span:nth-child(2) {
        height: 116px;
        background: #3d6375;
      }

      .preview-bars span:nth-child(3) {
        height: 52px;
      }

      .activities-section {
        display: grid;
        grid-template-columns: minmax(0, 0.92fr) minmax(320px, 1fr);
        align-items: center;
        gap: clamp(42px, 7vw, 96px);
        padding: 88px clamp(24px, 5vw, 64px);
        background: #ffffff;
      }

      .activities-section > div:first-child {
        max-width: 620px;
        display: grid;
        gap: 18px;
      }

      .activity-list {
        display: grid;
        gap: 18px;
      }

      .activity-list article {
        min-height: 86px;
        border: 1px solid rgb(193 211 220 / 0.7);
        border-radius: 18px;
        background: #f2f9fd;
        display: grid;
        grid-template-columns: 46px minmax(0, 1fr);
        align-items: center;
        gap: 18px;
        padding: 18px 22px;
      }

      .activity-list span {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        background: #d7e9c0;
        position: relative;
      }

      .activity-list span::before,
      .activity-list span::after {
        content: '';
        position: absolute;
        background: #5a6949;
        border-radius: 3px;
      }

      .activity-list span::before {
        left: 20px;
        top: 11px;
        width: 6px;
        height: 24px;
      }

      .activity-list span::after {
        left: 11px;
        top: 20px;
        width: 24px;
        height: 6px;
      }

      .activity-list p {
        color: #123443;
        font-size: 18px;
        font-weight: var(--ac-font-weight-semibold);
      }

      .autism-section {
        background: #faf8f2;
      }

      .autism-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 24px;
      }

      .autism-grid article {
        min-height: 210px;
        border: 1px solid rgb(221 229 228 / 0.74);
        border-radius: 24px;
        background: #ffffff;
        display: grid;
        align-content: start;
        gap: 14px;
        padding: 28px;
        box-shadow: 0 14px 30px rgb(41 74 90 / 0.06);
      }

      .autism-grid h3 {
        color: #123443;
        font-size: 20px;
        line-height: 1.3;
      }

      .autism-grid p {
        color: #5b666b;
        line-height: 1.58;
      }

      .cta-section {
        margin: 88px clamp(24px, 5vw, 64px);
        border-radius: 28px;
        background: #8db4c8;
        color: #123443;
        display: grid;
        justify-items: center;
        gap: 22px;
        text-align: center;
        padding: 58px 24px;
        overflow: hidden;
      }

      .cta-section p {
        max-width: 720px;
        color: #315d72;
      }

      .cta-section a {
        min-width: 210px;
        background: #194b61;
      }

      .site-footer {
        background: #ceedff;
        display: grid;
        grid-template-columns: 1.3fr 1fr 1fr 1.2fr;
        gap: clamp(32px, 6vw, 84px);
        padding: 58px clamp(24px, 5vw, 64px) 34px;
      }

      .site-footer section,
      .site-footer nav {
        display: grid;
        align-content: start;
        justify-items: start;
        gap: 14px;
      }

      .site-footer h2 {
        color: #315d72;
        font-size: var(--ac-type-label);
        font-weight: var(--ac-font-weight-bold);
      }

      .site-footer p,
      .site-footer a {
        color: #315d72;
        font-size: var(--ac-type-label);
        line-height: 1.55;
      }

      .footer-brand {
        font-size: 28px;
        text-decoration: none;
      }

      .disclaimer {
        font-style: italic;
      }

      .copyright {
        grid-column: 1 / -1;
        border-top: 1px solid rgb(49 93 114 / 0.14);
        margin-top: 22px;
        padding-top: 28px;
      }

      @media (max-width: 1040px) {
        .site-header {
          grid-template-columns: 1fr auto;
        }

        .desktop-nav {
          display: none;
        }

        .hero-section,
        .process-section,
        .activities-section {
          grid-template-columns: 1fr;
        }

        .hero-copy,
        .process-copy {
          max-width: none;
        }

        .tool-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .autism-grid {
          grid-template-columns: 1fr;
        }

        .site-footer {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 700px) {
        .site-header {
          min-height: auto;
          align-items: start;
          gap: 18px;
          padding: 18px 20px;
        }

        .brand {
          font-size: 26px;
        }

        .header-actions {
          gap: 10px;
        }

        .login-link {
          display: none;
        }

        .signup-link {
          min-height: 42px;
          padding: 0 16px;
        }

        .hero-section,
        .tools-section,
        .process-section,
        .activities-section,
        .autism-section {
          padding: 56px 20px;
        }

        .hero-section h1 {
          font-size: 40px;
        }

        .hero-subtitle,
        .section-heading p,
        .cta-section p {
          font-size: var(--ac-type-body);
        }

        .tool-grid,
        .preview-body,
        .activities-section,
        .site-footer {
          grid-template-columns: 1fr;
        }

        .tool-card {
          min-height: auto;
          padding: 26px;
        }

        .product-preview {
          padding: 12px;
        }

        .cta-section {
          margin: 56px 20px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  protected readonly tools = tools;
  protected readonly steps = steps;
  protected readonly activityHighlights = activityHighlights;
  protected readonly autismNotes = autismNotes;

  protected scrollToSection(sectionId: string, event: Event) {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (!section) return;

    history.pushState(null, '', `#${sectionId}`);
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
