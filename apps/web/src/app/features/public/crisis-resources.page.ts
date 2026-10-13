import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  type OnDestroy,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';

interface CrisisHotline {
  name: string;
  nameKm: string;
  phone: string;
  text?: string;
  hours: string;
  hoursKm: string;
  description: string;
  descriptionKm: string;
  actionText: string;
  actionTextKm: string;
  actionHref: string;
  tone: 'emergency' | 'primary' | 'support';
}

const CAMBODIA_CRISIS_HOTLINES: CrisisHotline[] = [
  {
    name: 'TPO Cambodia (Mental Health Crisis Support)',
    nameKm: 'អង្គការចិត្តសង្គមអន្តរវប្បធម៌ (TPO Cambodia)',
    phone: '023 63 66 991 / 017 222 372',
    hours: '24/7 Mental Health & Psychological Distress Counseling',
    hoursKm: 'ប្រឹក្សាវិបត្តិផ្លូវចិត្ត និងបញ្ហាអារម្មណ៍ ២៤/៧',
    description:
      'Cambodia’s foremost mental health and trauma support NGO providing confidential crisis counseling, psychological first aid, and neurodiversity-informed emotional care in Khmer and English.',
    descriptionKm:
      'អង្គការឈានមុខគេនៅកម្ពុជាផ្តល់ការប្រឹក្សាវិបត្តិផ្លូវចិត្ត ការសង្គ្រោះបឋមផ្លូវចិត្ត និងការគាំទ្រដល់ក្រុមគ្រួសារកុមារមានអូទីសឹមជាភាសាខ្មែរ និងអង់គ្លេស។',
    actionText: 'Call 023 63 66 991',
    actionTextKm: 'ហៅទៅលេខ 023 63 66 991',
    actionHref: 'tel:0236366991',
    tone: 'emergency',
  },
  {
    name: 'Child Helpline Cambodia',
    nameKm: 'ខ្សែទូរស័ព្ទជំនួយកុមារកម្ពុជា (Child Helpline)',
    phone: '1280 (Toll-Free)',
    text: 'Dial 1280',
    hours: '24/7 Free Across Smart, Cellcard & Metfone',
    hoursKm: 'ឥតគិតថ្លៃ ២៤/៧ គ្រប់ប្រព័ន្ធទូរស័ព្ទទាំងអស់',
    description:
      'Free, confidential national helpline providing immediate crisis counseling, child safety intervention, and emotional distress guidance for neurodivergent children and their families.',
    descriptionKm:
      'សេវាទូរស័ព្ទទាន់ហេតុការណ៍ជាតិឥតគិតថ្លៃ ផ្តល់ការប្រឹក្សាវិបត្តិ និងការការពារកុមារបន្ទាន់សម្រាប់កុមារ និងក្រុមគ្រួសារនៅទូទាំងប្រទេសកម្ពុជា។',
    actionText: 'Dial 1280 (Free)',
    actionTextKm: 'ហៅទៅលេខ ១២៨០ (ឥតគិតថ្លៃ)',
    actionHref: 'tel:1280',
    tone: 'emergency',
  },
  {
    name: 'National Pediatric Hospital (Phnom Penh)',
    nameKm: 'មន្ទីរពេទ្យកុមារជាតិ (ភ្នំពេញ)',
    phone: '023 880 475 / 012 899 923',
    hours: 'Mon-Fri 7:30 AM - 5:00 PM · Emergency 24/7',
    hoursKm: 'ច័ន្ទ-សុក្រ ៧:៣០ ព្រឹក - ៥:០០ ល្ងាច · សង្គ្រោះបន្ទាន់ ២៤/៧',
    description:
      'Cambodia’s leading national referral hospital on Russian Federation Blvd, Phnom Penh, offering child neurology, autism developmental screening, speech therapy, and pediatric psychiatric triage.',
    descriptionKm:
      'មន្ទីរពេទ្យជាតិឯកទេសកុមារនៅមហាវិថីសហព័ន្ធរុស្ស៊ី រាជធានីភ្នំពេញ ផ្តល់សេវាពិនិត្យប្រព័ន្ធប្រសាទកុមារ ការវាយតម្លៃការលូតលាស់អូទីសឹម និងព្យាបាលការនិយាយ។',
    actionText: 'Call 023 880 475',
    actionTextKm: 'ហៅទៅលេខ 023 880 475',
    actionHref: 'tel:023880475',
    tone: 'primary',
  },
  {
    name: 'Kantha Bopha Children’s Hospital',
    nameKm: 'មន្ទីរពេទ្យគន្ធបុប្ផា (ភ្នំពេញ និងសៀមរាប)',
    phone: '023 722 724 (PP) / 063 760 295 (SR)',
    hours: '24/7 Free Pediatric Emergency Care',
    hoursKm: 'សង្គ្រោះបន្ទាន់កុមារ ២៤/៧ ឥតគិតថ្លៃ ១០០%',
    description:
      '100% free comprehensive inpatient, neurology consultation, and emergency medical treatment for Cambodian children across Phnom Penh and Jayavarman VII Hospital in Siem Reap.',
    descriptionKm:
      'ផ្តល់ការព្យាបាលវេជ្ជសាស្ត្រ និងការសង្គ្រោះបន្ទាន់កុមារឥតគិតថ្លៃ ១០០% សម្រាប់កុមារកម្ពុជា នៅភ្នំពេញ និងមន្ទីរពេទ្យជ័យវរ្ម័នទី៧ ខេត្តសៀមរាប។',
    actionText: 'Call 023 722 724',
    actionTextKm: 'ហៅទៅលេខ 023 722 724',
    actionHref: 'tel:023722724',
    tone: 'primary',
  },
  {
    name: 'Rabbit School Organization (Special Education)',
    nameKm: 'អង្គការសាលាទន្សាយ (ការអប់រំពិសេស)',
    phone: '023 214 747 / 012 844 703',
    hours: 'Mon-Fri 8:00 AM - 5:00 PM',
    hoursKm: 'ច័ន្ទ-សុក្រ ៨:០០ ព្រឹក - ៥:០០ ល្ងាច',
    description:
      'Pioneer Cambodian non-profit organization providing specialized early intervention, autism classrooms, vocational skills, and parental behavioral counseling across Phnom Penh, Kandal, and Siem Reap.',
    descriptionKm:
      'អង្គការមិនស្វែងរកប្រាក់ចំណេញឈានមុខគេ ផ្តល់ការអប់រំពិសេស ថ្នាក់រៀនសម្រាប់កុមារមានអូទីសឹម និងការប្រឹក្សាអាកប្បកិរិយាដល់មាតាបិតា។',
    actionText: 'Call 023 214 747',
    actionTextKm: 'ហៅទៅលេខ 023 214 747',
    actionHref: 'tel:023214747',
    tone: 'support',
  },
  {
    name: 'Hands of Hope Community',
    nameKm: 'សហគមន៍ដៃនៃក្តីសង្ឃឹម (Hands of Hope)',
    phone: '012 906 186 / 024 985 111',
    hours: 'Mon-Sat 8:00 AM - 5:00 PM',
    hoursKm: 'ច័ន្ទ-សៅរ៍ ៨:០០ ព្រឹក - ៥:០០ ល្ងាច',
    description:
      'Specialized community center in Takhmao & Phnom Penh delivering behavioral therapy, sensory development support, and caregiver training for autistic children.',
    descriptionKm:
      'មជ្ឈមណ្ឌលសហគមន៍ឯកទេសនៅក្រុងតាខ្មៅ និងភ្នំពេញ ផ្តល់ការបណ្តុះបណ្តាលអាកប្បកិរិយា ការអភិវឌ្ឍញាណដឹង និងការបណ្តុះបណ្តាលមាតាបិតា។',
    actionText: 'Call 012 906 186',
    actionTextKm: 'ហៅទៅលេខ 012 906 186',
    actionHref: 'tel:012906186',
    tone: 'support',
  },
];

@Component({
  standalone: true,
  selector: 'ac-crisis-resources-page',
  imports: [RouterLink],
  template: `
    <div class="crisis-page">
      <!-- Urgent 119 Cambodian Emergency Top Banner -->
      <aside class="urgent-banner" role="alert">
        <div class="urgent-content">
          <span class="urgent-icon" aria-hidden="true">⚠️</span>
          <p>
            <strong>{{
              currentLang() === 'km'
                ? 'ភាពអាសន្នវេជ្ជសាស្ត្រ ឬសុវត្ថិភាពភ្លាមៗ៖'
                : 'Immediate Medical or Safety Emergency:'
            }}</strong>
            {{
              currentLang() === 'km'
                ? 'ប្រសិនបើកុមារ ឬសមាជិកគ្រួសារស្ថិតក្នុងគ្រោះថ្នាក់បន្ទាន់ សូមទូរស័ព្ទទៅកាន់'
                : 'If your child, family member, or anyone else is in immediate life-threatening physical danger, call'
            }}
            <a href="tel:119" class="urgent-dial"><strong>119</strong></a>
            ({{ currentLang() === 'km' ? 'រថយន្តសង្គ្រោះបន្ទាន់' : 'Ambulance / SAMU' }})
            {{ currentLang() === 'km' ? 'ឬ' : 'or' }}
            <a href="tel:117" class="urgent-dial"><strong>117</strong></a>
            ({{ currentLang() === 'km' ? 'នគរបាលជាតិ' : 'Police' }})
            {{
              currentLang() === 'km'
                ? 'ឬទៅកាន់មន្ទីរពេទ្យដែលនៅជិតបំផុតជាបន្ទាន់។'
                : 'or go to your nearest emergency department immediately.'
            }}
          </p>
        </div>
      </aside>

      <!-- Site Navigation Header -->
      <header class="page-header">
        <a class="brand" routerLink="/" aria-label="AutiCare home">
          <img src="/images/auticare-logo.jpg" alt="" aria-hidden="true" width="36" height="34" />
          <span>AutiCare</span>
        </a>
        <nav class="header-nav" aria-label="Crisis resource navigation">
          <!-- Accessible Language Switcher Toggle -->
          <button
            type="button"
            class="topbar-lang-toggle"
            (click)="toggleLanguage()"
            [attr.aria-label]="
              currentLang() === 'km'
                ? 'Switch language to English (ប្តូរទៅភាសាអង់គ្លេស)'
                : 'Switch language to Khmer (ប្តូរទៅភាសាខ្មែរ)'
            "
            [title]="
              currentLang() === 'km'
                ? 'ប្តូរទៅភាសាអង់គ្លេស (Switch to English)'
                : 'ប្តូរទៅភាសាខ្មែរ (Switch to Khmer)'
            "
          >
            <span class="lang-flag" aria-hidden="true">{{
              currentLang() === 'km' ? '🇰🇭' : '🇬🇧'
            }}</span>
            <span class="lang-text">{{ currentLang() === 'km' ? 'ភាសាខ្មែរ' : 'English' }}</span>
          </button>

          @if (isAuthenticated()) {
            <a class="nav-btn primary" [routerLink]="dashboardPath()">
              {{ currentLang() === 'km' ? 'ទៅកាន់ផ្ទាំងគ្រប់គ្រង' : 'Go to Dashboard' }}
            </a>
          } @else {
            <a class="nav-btn" routerLink="/">{{ currentLang() === 'km' ? 'ទំព័រដើម' : 'Home' }}</a>
            <a class="nav-btn" routerLink="/login">{{
              currentLang() === 'km' ? 'ចូលប្រើ' : 'Sign In'
            }}</a>
          }
          <a href="tel:119" class="emergency-call-pill">
            <span aria-hidden="true">📞</span>
            <span>{{
              currentLang() === 'km' ? 'ហៅ ១១៩ (សង្គ្រោះបន្ទាន់)' : 'Call 119 (Ambulance)'
            }}</span>
          </a>
        </nav>
      </header>

      <main class="main-content" id="main">
        <!-- Hero Section -->
        <section class="hero-section">
          <span class="meta-tag">
            {{
              currentLang() === 'km'
                ? 'ការគាំទ្របន្ទាន់សម្រាប់គ្រួសារនៅកម្ពុជា'
                : 'Urgent Family Support & Care · Cambodia'
            }}
          </span>
          <h1>
            {{
              currentLang() === 'km'
                ? 'មជ្ឈមណ្ឌលជំនួយបន្ទាន់ និងសង្គ្រោះវិបត្តិ'
                : 'Crisis & Emergency Support Hub'
            }}
          </h1>
          <p class="hero-subtext">
            {{
              currentLang() === 'km'
                ? 'ទូរស័ព្ទទាន់ហេតុការណ៍សុខភាពផ្លូវចិត្ត ២៤/៧ ការគ្រប់គ្រងអារម្មណ៍តានតឹង និងការណែនាំវេជ្ជសាស្ត្រកុមារសម្រាប់ក្រុមគ្រួសារកម្ពុជា។'
                : 'Immediate 24/7 mental health hotlines, sensory crisis de-escalation protocols, and specialized pediatric emergency guidance tailored for neurodiverse families in Cambodia.'
            }}
          </p>
        </section>

        <!-- Calming Sensory Breathing Exercise Widget -->
        <section class="breathing-section" aria-label="Calming breathing exercise">
          <div class="breathing-card">
            <div class="breathing-card-header">
              <span class="breathing-icon" aria-hidden="true">🌿</span>
              <div>
                <h2>
                  {{
                    currentLang() === 'km'
                      ? 'លំហាត់ដកដង្ហើមបន្ធូរអារម្មណ៍'
                      : 'Calming Sensory Breathing Exercise'
                  }}
                </h2>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'ដកដង្ហើមប្រអប់ (៤-៤-៤-៤) ដើម្បីជួយសម្រួលប្រព័ន្ធប្រសាទក្នុងពេលមានអារម្មណ៍ភ័យខ្លាច តានតឹង ឬរំញោចខ្លាំង។'
                      : 'Box breathing (4-4-4-4) to help calm the nervous system during overwhelming sensory distress, anxiety, or emotional dysregulation.'
                  }}
                </p>
              </div>
            </div>

            <div class="breathing-visual-container">
              <div
                class="breathing-circle-outer"
                [class.active]="breathingActive()"
                [attr.data-phase]="breathPhase()"
              >
                <div class="breathing-circle-inner">
                  <span class="breathing-phase-text">
                    {{
                      breathingActive()
                        ? breathPhaseText()
                        : currentLang() === 'km'
                          ? 'ដង្ហើមស្មើគ្នា'
                          : 'Paced Breathing'
                    }}
                  </span>
                  <span class="breathing-timer-text">
                    {{
                      breathingActive()
                        ? breathSeconds() + 's'
                        : currentLang() === 'km'
                          ? 'ចុចចាប់ផ្តើម'
                          : 'Press Start'
                    }}
                  </span>
                </div>
              </div>
            </div>

            <div class="breathing-controls">
              <button
                type="button"
                class="breathing-toggle-btn"
                [class.active]="breathingActive()"
                (click)="toggleBreathing()"
              >
                <span>
                  {{
                    breathingActive()
                      ? currentLang() === 'km'
                        ? 'ផ្អាកលំហាត់'
                        : 'Pause Exercise'
                      : currentLang() === 'km'
                        ? 'ចាប់ផ្តើមលំហាត់ដកដង្ហើម'
                        : 'Start Calming Exercise'
                  }}
                </span>
              </button>
            </div>

            <div class="grounding-cues">
              <p class="grounding-tip">
                💡
                <strong>{{
                  currentLang() === 'km' ? 'គន្លឹះសម្រួលញាណដឹង៖' : 'Sensory Grounding Tip:'
                }}</strong>
                {{
                  currentLang() === 'km'
                    ? 'ដាក់ជើងទាំងពីរឱ្យជាប់នឹងកម្រាល។ ដកដង្ហើមវែងៗ ៣ ដងដោយស្ងប់ចិត្ត។ អ្នក និងកូនរបស់អ្នកមានសុវត្ថិភាពនៅពេលនេះ។'
                    : 'Place your feet firmly on the floor. Take in three slow, steady breaths. You and your child are safe right now.'
                }}
              </p>
            </div>
          </div>
        </section>

        <!-- 24/7 Hotlines Grid -->
        <section class="hotlines-section" aria-label="Immediate 24/7 hotlines">
          <div class="section-title-wrap">
            <span class="section-badge" aria-hidden="true">⚡</span>
            <h2>
              {{
                currentLang() === 'km'
                  ? 'ទូរស័ព្ទទាន់ហេតុការណ៍ជំនួយបន្ទាន់នៅកម្ពុជា'
                  : 'Immediate Crisis & Support Hotlines in Cambodia'
              }}
            </h2>
          </div>
          <div class="hotlines-grid">
            @for (hotline of hotlines; track hotline.name) {
              <article class="hotline-card" [attr.data-tone]="hotline.tone">
                <div class="hotline-card-head">
                  <div class="hotline-title-group">
                    <h3>{{ currentLang() === 'km' ? hotline.nameKm : hotline.name }}</h3>
                    <span class="hours-badge">{{
                      currentLang() === 'km' ? hotline.hoursKm : hotline.hours
                    }}</span>
                  </div>
                  <span class="hotline-phone-number">{{ hotline.phone }}</span>
                </div>
                <p class="hotline-desc">
                  {{ currentLang() === 'km' ? hotline.descriptionKm : hotline.description }}
                </p>
                <div class="hotline-actions">
                  <a
                    [href]="hotline.actionHref"
                    class="call-btn"
                    [class.danger]="hotline.tone === 'emergency'"
                  >
                    <span>{{
                      currentLang() === 'km' ? hotline.actionTextKm : hotline.actionText
                    }}</span>
                  </a>
                </div>
              </article>
            }
          </div>
        </section>

        <!-- Autism Sensory Meltdown De-escalation Protocol -->
        <section class="protocol-section">
          <div class="section-title-wrap">
            <span class="section-badge" aria-hidden="true">🛡️</span>
            <h2>
              {{
                currentLang() === 'km'
                  ? 'វិធីសាស្ត្រសម្រួលអារម្មណ៍នៅពេលកុមាររំញោចខ្លាំង (Meltdown)'
                  : 'Autism Sensory Meltdown De-escalation Protocol'
              }}
            </h2>
          </div>
          <p class="protocol-intro">
            {{
              currentLang() === 'km'
                ? 'ការផ្ទុះអារម្មណ៍ (Meltdown) គឺជាប្រតិកម្មដោយស្វ័យប្រវត្តិនៃប្រព័ន្ធប្រសាទចំពោះការលើសទម្ងន់ញាណដឹង ឬអារម្មណ៍ — មិនមែនជាការរឹងរូសឡើយ។ សូមអនុវត្តតាមជំហានខាងក្រោម៖'
                : 'A meltdown is an involuntary neurological reaction to sensory, emotional, or cognitive overload — not willful behavioral defiance. Follow these evidence-based de-escalation steps:'
            }}
          </p>

          <div class="steps-grid">
            <article class="step-card">
              <div class="step-num">1</div>
              <div class="step-content">
                <h3>
                  {{
                    currentLang() === 'km'
                      ? 'កាត់បន្ថយការរំញោចញាណដឹងខ្លាំង'
                      : 'Eliminate Sensory Overload'
                  }}
                </h3>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'បន្ថយពន្លឺភ្លើងខ្លាំង បិទសំឡេងរំខាន និងនាំមនុស្សជុំវិញចេញដោយថ្នមៗ។ បង្កើតទីធ្លាស្ងប់ស្ងាត់សម្រាប់កុមារជាបន្ទាន់។'
                      : 'Dim harsh fluorescent lighting, turn off loud media/appliances, and gently direct onlookers away. Create an immediate buffer of quiet space.'
                  }}
                </p>
              </div>
            </article>

            <article class="step-card">
              <div class="step-num">2</div>
              <div class="step-content">
                <h3>
                  {{
                    currentLang() === 'km'
                      ? 'កាត់បន្ថយការនិយាយ ឬបញ្ជា'
                      : 'Minimize Verbal Communication'
                  }}
                </h3>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'ក្នុងពេលមានវិបត្តិ ការស្តាប់របស់កុមារត្រូវបិទ។ ចៀសវាងការសួរដេញដោល ឬបន្ទោស។ និយាយដោយសំឡេងស្រទន់៖ «កូនមានសុវត្ថិភាព»។'
                      : 'During overload, auditory processing shuts down. Avoid reasoning, questions, or scolding. Speak in a low, gentle voice using 1–3 comforting words: "You are safe."'
                  }}
                </p>
              </div>
            </article>

            <article class="step-card">
              <div class="step-num">3</div>
              <div class="step-content">
                <h3>
                  {{
                    currentLang() === 'km'
                      ? 'ផ្តល់ឧបករណ៍ជួយសម្រួលអារម្មណ៍'
                      : 'Provide Regulating Tools'
                  }}
                </h3>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'ផ្តល់ឧបករណ៍ដែលកុមារចូលចិត្តដោយមិនបង្ខំ៖ កាសការពារសំឡេង ភួយទម្ងន់ ឬការឱបសង្កត់ស្រាលៗប្រសិនបើកុមារស្វាគមន៍។'
                      : 'Offer preferred sensory comfort items without forcing: noise-canceling headphones, a weighted lap pad, a soft blanket, or deep joint compression if child welcomes it.'
                  }}
                </p>
              </div>
            </article>

            <article class="step-card">
              <div class="step-num">4</div>
              <div class="step-content">
                <h3>
                  {{
                    currentLang() === 'km'
                      ? 'អនុញ្ញាតឱ្យធ្វើចលនាបន្ធូរអារម្មណ៍ និងផ្តល់ពេលសម្រាក'
                      : 'Allow Safe Stimming & Recovery Time'
                  }}
                </h3>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'គាំទ្រចលនាសុវត្ថិភាពដដែលៗ (ដូចជាគ្រវីដៃ ឬយោលខ្លួន)។ ការផ្ទុះអារម្មណ៍ធ្វើឱ្យអស់កម្លាំងខ្លាំង — ផ្តល់ទឹកត្រជាក់ និងពេលសម្រាកស្ងប់ស្ងាត់។'
                      : 'Support safe repetitive movement (rocking, pacing, flapping). Meltdowns are physiologically exhausting — offer cool water and undisturbed rest before processing.'
                  }}
                </p>
              </div>
            </article>
          </div>
        </section>

        <!-- Emergency Department & Hospital Preparation -->
        <section class="hospital-prep-section">
          <div class="section-title-wrap">
            <span class="section-badge" aria-hidden="true">🏥</span>
            <h2>
              {{
                currentLang() === 'km'
                  ? 'ការត្រៀមខ្លួនទៅកាន់ផ្នែកសង្គ្រោះបន្ទាន់កុមារ'
                  : 'Pediatric Emergency Department Preparation'
              }}
            </h2>
          </div>
          <div class="prep-grid">
            <div class="prep-card">
              <h3>
                {{
                  currentLang() === 'km'
                    ? 'ពេលណាដែលត្រូវស្វែងរកការព្យាបាលនៅមន្ទីរពេទ្យ'
                    : 'When to Seek Hospital Care'
                }}
              </h3>
              <ul class="checklist">
                <li>
                  {{
                    currentLang() === 'km'
                      ? 'អាកប្បកិរិយាធ្វើបាបខ្លួនឯងធ្ងន់ធ្ងរដែលមិនអាចគ្រប់គ្រងបាន និងប្រឈមគ្រោះថ្នាក់'
                      : 'Uncontrollable self-injurious behavior risking severe physical harm'
                  }}
                </li>
                <li>
                  {{
                    currentLang() === 'km'
                      ? 'ប្រតិកម្មធ្ងន់ធ្ងរភ្លាមៗចំពោះថ្នាំប្រព័ន្ធប្រសាទ ឬចិត្តសាស្ត្រ'
                      : 'Sudden severe adverse reaction to neurological or psychiatric medication'
                  }}
                </li>
                <li>
                  {{
                    currentLang() === 'km'
                      ? 'មិនអាចគ្រប់គ្រងសុវត្ថិភាពនៅផ្ទះបាន បន្ទាប់ពីអនុវត្តវិធានការសម្រួលអារម្មណ៍'
                      : 'Inability to maintain physical safety after home de-escalation protocols'
                  }}
                </li>
                <li>
                  {{
                    currentLang() === 'km'
                      ? 'របួសរាងកាយធ្ងន់ធ្ងរ ការប្រកាច់ ឬសន្លប់បាត់បង់ស្មារតី'
                      : 'Acute physical injury, seizure, or loss of consciousness'
                  }}
                </li>
              </ul>
            </div>

            <div class="prep-card">
              <h3>
                {{
                  currentLang() === 'km'
                    ? 'អ្វីដែលត្រូវយកទៅផ្នែកសង្គ្រោះបន្ទាន់'
                    : 'What to Take to the ER'
                }}
              </h3>
              <ul class="checklist">
                <li>
                  <strong>{{
                    currentLang() === 'km' ? 'ឧបករណ៍សម្រួលញាណដឹង៖' : "Child's Sensory Kit:"
                  }}</strong>
                  {{
                    currentLang() === 'km'
                      ? 'កាសបិទសំឡេង វ៉ែនតាការពារពន្លឺ ឬរបស់លេងដែលកុមារចូលចិត្ត'
                      : 'Preferred fidgets, ear defenders, sunglasses'
                  }}
                </li>
                <li>
                  <strong>{{
                    currentLang() === 'km' ? 'បញ្ជីឈ្មោះថ្នាំ៖' : 'Medication List:'
                  }}</strong>
                  {{
                    currentLang() === 'km'
                      ? 'ឈ្មោះថ្នាំបច្ចុប្បន្ន កម្រិតថ្នាំ និងវេជ្ជបញ្ជាគ្រូពេទ្យ'
                      : 'Current prescriptions, dosages, and prescribing doctors'
                  }}
                </li>
                <li>
                  <strong>{{
                    currentLang() === 'km' ? 'កំណត់ត្រាទំនាក់ទំនង៖' : 'Communication Passport:'
                  }}</strong>
                  {{
                    currentLang() === 'km'
                      ? 'សញ្ញាបង្ហាញអារម្មណ៍ ចំណុចបង្កភាពភ័យខ្លាច និងវិធីសម្រួល'
                      : 'Notes on non-verbal signs, triggers, and calming cues'
                  }}
                </li>
                <li>
                  <strong>{{
                    currentLang() === 'km' ? 'របស់លួងចិត្ត៖' : 'Comfort Object:'
                  }}</strong>
                  {{
                    currentLang() === 'km'
                      ? 'ថេប្លេត ភួយ ឬអាវដែលធ្លាប់ស្គាល់ដើម្បីរក្សាភាពកក់ក្តៅ'
                      : 'Familiar tablet, blanket, or jacket to maintain grounding'
                  }}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- AutiCare Platform Quick Resources -->
        <section class="auticare-resources-section">
          <h2>
            {{
              currentLang() === 'km'
                ? 'តំណភ្ជាប់សម្របសម្រួលការថែទាំ AutiCare'
                : 'AutiCare Care Coordination Links'
            }}
          </h2>
          <div class="resource-links-grid">
            <a class="resource-card" routerLink="/hospitals">
              <span class="resource-icon" aria-hidden="true">🏥</span>
              <div class="resource-text">
                <h3>
                  {{
                    currentLang() === 'km'
                      ? 'ស្វែងរកមន្ទីរពេទ្យឯកទេស'
                      : 'Find Specialized Hospitals'
                  }}
                </h3>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'ស្វែងរកមន្ទីរពេទ្យកុមារជាតិ គន្ធបុប្ផា និងគ្លីនិកឯកទេសលូតលាស់កុមារ។'
                      : 'Browse pediatric autism centers, developmental clinics, and emergency facilities.'
                  }}
                </p>
              </div>
              <span class="resource-arrow" aria-hidden="true">→</span>
            </a>

            <a class="resource-card" routerLink="/children">
              <span class="resource-icon" aria-hidden="true">📋</span>
              <div class="resource-text">
                <h3>
                  {{
                    currentLang() === 'km' ? 'ទិន្នន័យសង្ខេបរបស់កុមារ' : 'Child Support Snapshot'
                  }}
                </h3>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'ពិនិត្យ និងទាញយកទិន្នន័យប្រវត្តិ ញាណដឹង និងទម្លាប់ប្រចាំថ្ងៃរបស់កូនអ្នក។'
                      : "Review and export your child's profile notes, routines, and clinical status."
                  }}
                </p>
              </div>
              <span class="resource-arrow" aria-hidden="true">→</span>
            </a>

            <a class="resource-card" routerLink="/support">
              <span class="resource-icon" aria-hidden="true">❓</span>
              <div class="resource-text">
                <h3>
                  {{
                    currentLang() === 'km'
                      ? 'មជ្ឈមណ្ឌលជំនួយ និងសហគមន៍'
                      : 'Help Center & Support Groups'
                  }}
                </h3>
                <p>
                  {{
                    currentLang() === 'km'
                      ? 'ភ្ជាប់ទំនាក់ទំនងជាមួយសហគមន៍មាតាបិតា បណ្តាញគាំទ្រ និងការណែនាំវេទិកា។'
                      : 'Connect with peer communities, parent advocacy networks, and platform guides.'
                  }}
                </p>
              </div>
              <span class="resource-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="page-footer">
        <div class="footer-inner">
          <p class="disclaimer">
            <strong>{{
              currentLang() === 'km' ? 'សេចក្តីបញ្ជាក់ផ្នែកវេជ្ជសាស្ត្រ៖' : 'Medical Disclaimer:'
            }}</strong>
            {{
              currentLang() === 'km'
                ? 'AutiCare ផ្តល់ព័ត៌មានអប់រំ និងធនធានសម្របសម្រួលការថែទាំ។ ព័ត៌មាននេះមិនមែនជាការជំនួសឱ្យការពិគ្រោះយោបល់វេជ្ជសាស្ត្រវិជ្ជាជីវៈ ការធ្វើរោគវិនិច្ឆ័យ ឬការព្យាបាលចិត្តសាស្ត្របន្ទាន់ឡើយ។'
                : 'AutiCare provides educational, organizational, and support navigation resources. The information provided is not a substitute for clinical medical advice, psychological diagnosis, or emergency psychiatric intervention.'
            }}
          </p>
          <nav class="footer-nav" aria-label="Footer links">
            <a routerLink="/privacy">{{
              currentLang() === 'km' ? 'គោលការណ៍ឯកជនភាព' : 'Privacy Policy'
            }}</a>
            <a routerLink="/terms">{{
              currentLang() === 'km' ? 'លក្ខខណ្ឌប្រើប្រាស់' : 'Terms of Service'
            }}</a>
            <a routerLink="/support">{{
              currentLang() === 'km' ? 'មជ្ឈមណ្ឌលជំនួយ' : 'Help Center'
            }}</a>
            <a routerLink="/crisis" class="active">{{
              currentLang() === 'km' ? 'ជំនួយបន្ទាន់' : 'Crisis Support'
            }}</a>
          </nav>
          <p class="copy">© {{ currentYear }} AutiCare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      .crisis-page {
        min-height: 100vh;
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-strong);
        display: flex;
        flex-direction: column;
      }

      /* Urgent Top Banner */
      .urgent-banner {
        background: var(--ac-color-alert-strong);
        color: var(--ac-color-text-on-action);
        padding: 12px 24px;
        position: sticky;
        top: 0;
        z-index: 50;
        box-shadow: 0 4px 12px rgb(162 52 52 / 0.25);
      }

      .urgent-content {
        max-width: 1100px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        line-height: 1.4;
      }

      .urgent-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .urgent-content p {
        margin: 0;
      }

      .urgent-dial {
        color: var(--ac-color-text-on-action);
        text-decoration: underline;
        font-size: 15px;
      }

      /* Page Header */
      .page-header {
        background: var(--ac-color-surface);
        border-bottom: 1px solid var(--ac-color-border-slate);
        padding: 16px clamp(20px, 4vw, 48px);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        color: var(--ac-color-action-mid);
        font-size: 24px;
        font-weight: 700;
      }

      .brand img {
        width: 32px;
        height: 32px;
        border-radius: 999px;
        object-fit: cover;
      }

      .header-nav {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .topbar-lang-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        height: 38px;
        border: 1px solid var(--ac-color-border-grey);
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 160ms ease;
      }

      .topbar-lang-toggle:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      .topbar-lang-toggle:focus-visible {
        outline: 2px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .nav-btn {
        padding: 8px 16px;
        border-radius: 8px;
        border: 1px solid var(--ac-color-border-grey);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-strong);
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
        transition: all 160ms ease;
      }

      .nav-btn:hover {
        background: var(--ac-color-surface-info);
        border-color: var(--ac-color-action);
      }

      .nav-btn.primary {
        background: var(--ac-color-action);
        border-color: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      .nav-btn.primary:hover {
        background: var(--ac-color-action-alt);
      }

      .emergency-call-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-alert-surface);
        border: 1px solid var(--ac-color-alert-strong);
        color: var(--ac-color-alert-strong);
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
        transition: all 160ms ease;
      }

      .emergency-call-pill:hover {
        background: var(--ac-color-alert-strong);
        color: var(--ac-color-text-on-action);
      }

      /* Main Content */
      .main-content {
        max-width: 1080px;
        width: 100%;
        margin: 0 auto;
        padding: 36px 20px 64px;
        display: flex;
        flex-direction: column;
        gap: 40px;
      }

      /* Hero Section */
      .hero-section {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .meta-tag {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 4px 12px;
        border-radius: var(--ac-radius-pill);
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-mid);
      }

      .hero-section h1 {
        font-size: clamp(28px, 4vw, 42px);
        font-weight: 800;
        color: var(--ac-color-action-deep);
        margin: 0;
        line-height: 1.2;
      }

      .hero-subtext {
        max-width: 680px;
        font-size: 16px;
        color: var(--ac-color-text-muted);
        line-height: 1.6;
        margin: 0;
      }

      /* Calming Breathing Exercise */
      .breathing-section {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-info);
        border-radius: 16px;
        padding: 32px 24px;
        box-shadow: 0 4px 16px var(--ac-color-surface-info);
      }

      .breathing-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 24px;
      }

      .breathing-card-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        max-width: 580px;
      }

      .breathing-icon {
        font-size: 32px;
      }

      .breathing-card-header h2 {
        font-size: 22px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        margin: 0;
      }

      .breathing-card-header p {
        font-size: 14px;
        color: var(--ac-color-text-muted);
        margin: 0;
        line-height: 1.5;
      }

      .breathing-visual-container {
        padding: 20px;
      }

      .breathing-circle-outer {
        width: 180px;
        height: 180px;
        border-radius: 999px;
        background: var(--ac-color-surface-info);
        border: 4px solid var(--ac-color-action-light);
        display: grid;
        place-items: center;
        transition:
          transform 4s cubic-bezier(0.4, 0, 0.2, 1),
          border-color 0.4s ease;
      }

      .breathing-circle-outer.active[data-phase='inhale'] {
        transform: scale(1.25);
        border-color: var(--ac-color-action-mid);
      }

      .breathing-circle-outer.active[data-phase='hold1'],
      .breathing-circle-outer.active[data-phase='hold2'] {
        border-color: var(--ac-color-warning);
      }

      .breathing-circle-outer.active[data-phase='exhale'] {
        transform: scale(0.9);
        border-color: var(--ac-color-action-alt);
      }

      .breathing-circle-inner {
        width: 140px;
        height: 140px;
        border-radius: 999px;
        background: var(--ac-color-surface);
        box-shadow: 0 4px 12px var(--ac-color-surface-info);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 12px;
      }

      .breathing-phase-text {
        font-size: 13px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        line-height: 1.2;
      }

      .breathing-timer-text {
        font-size: 22px;
        font-weight: 800;
        color: var(--ac-color-action-mid);
      }

      .breathing-controls {
        display: flex;
        gap: 12px;
      }

      .breathing-toggle-btn {
        padding: 10px 24px;
        border-radius: var(--ac-radius-pill);
        border: none;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition:
          background 160ms ease,
          transform 120ms ease;
      }

      .breathing-toggle-btn:hover {
        background: var(--ac-color-action-alt);
      }

      .breathing-toggle-btn.active {
        background: var(--ac-color-text-slate);
      }

      .grounding-cues {
        max-width: 540px;
        background: var(--ac-color-surface-info);
        border-radius: 8px;
        padding: 12px 18px;
      }

      .grounding-tip {
        font-size: 13px;
        color: var(--ac-color-action-deep);
        margin: 0;
        line-height: 1.5;
      }

      /* Section Titles */
      .section-title-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
      }

      .section-badge {
        font-size: 22px;
      }

      .section-title-wrap h2 {
        font-size: 22px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        margin: 0;
      }

      /* Hotlines Grid */
      .hotlines-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 20px;
      }

      .hotline-card {
        background: var(--ac-color-surface);
        border-radius: 12px;
        padding: 24px;
        border: 1px solid var(--ac-color-border-slate);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 16px;
        box-shadow: 0 2px 8px rgb(0 0 0 / 0.04);
        transition:
          transform 160ms ease,
          box-shadow 160ms ease;
      }

      .hotline-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgb(0 0 0 / 0.08);
      }

      .hotline-card[data-tone='emergency'] {
        border-left: 5px solid var(--ac-color-alert-strong);
      }

      .hotline-card[data-tone='primary'] {
        border-left: 5px solid var(--ac-color-action);
      }

      .hotline-card[data-tone='support'] {
        border-left: 5px solid var(--ac-color-accent-teal);
      }

      .hotline-card-head {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .hotline-title-group {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
      }

      .hotline-title-group h3 {
        font-size: 18px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        margin: 0;
      }

      .hours-badge {
        font-size: 11px;
        font-weight: 600;
        background: var(--ac-color-surface-slate);
        color: var(--ac-color-text-muted);
        padding: 3px 8px;
        border-radius: var(--ac-radius-pill);
      }

      .hotline-phone-number {
        font-size: 15px;
        font-weight: 700;
        color: var(--ac-color-action-mid);
      }

      .hotline-desc {
        font-size: 14px;
        color: var(--ac-color-text-muted);
        line-height: 1.5;
        margin: 0;
      }

      .hotline-actions {
        display: flex;
        gap: 10px;
      }

      .call-btn {
        flex: 1;
        padding: 10px 16px;
        border-radius: 8px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        font-size: 14px;
        font-weight: 700;
        text-align: center;
        text-decoration: none;
        transition: background 160ms ease;
      }

      .call-btn:hover {
        background: var(--ac-color-action-alt);
      }

      .call-btn.danger {
        background: var(--ac-color-alert-strong);
      }

      .call-btn.danger:hover {
        background: var(--ac-color-alert-deep);
      }

      /* Sensory Meltdown Steps */
      .steps-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }

      .step-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .step-num {
        width: 32px;
        height: 32px;
        border-radius: 999px;
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-mid);
        font-weight: 800;
        font-size: 16px;
        display: grid;
        place-items: center;
      }

      .step-content h3 {
        font-size: 16px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        margin: 0 0 6px;
      }

      .step-content p {
        font-size: 13px;
        color: var(--ac-color-text-muted);
        line-height: 1.5;
        margin: 0;
      }

      .protocol-intro {
        font-size: 15px;
        color: var(--ac-color-text-muted);
        line-height: 1.5;
        margin: 0;
      }

      /* Hospital Prep Section */
      .prep-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 20px;
      }

      .prep-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        padding: 24px;
      }

      .prep-card h3 {
        font-size: 17px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        margin: 0 0 16px;
      }

      .checklist {
        margin: 0;
        padding-left: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        font-size: 14px;
        color: var(--ac-color-text-muted);
        line-height: 1.5;
      }

      .checklist strong {
        color: var(--ac-color-text-strong);
      }

      /* AutiCare Coordination Links */
      .auticare-resources-section h2 {
        font-size: 20px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        margin: 0 0 16px;
      }

      .resource-links-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }

      .resource-card {
        background: var(--ac-color-surface);
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        text-decoration: none;
        color: inherit;
        transition:
          transform 160ms ease,
          border-color 160ms ease;
      }

      .resource-card:hover {
        transform: translateY(-2px);
        border-color: var(--ac-color-action);
      }

      .resource-icon {
        font-size: 28px;
        flex-shrink: 0;
      }

      .resource-text {
        flex: 1;
      }

      .resource-text h3 {
        font-size: 15px;
        font-weight: 700;
        color: var(--ac-color-action-deep);
        margin: 0 0 4px;
      }

      .resource-text p {
        font-size: 12px;
        color: var(--ac-color-text-muted);
        margin: 0;
        line-height: 1.4;
      }

      .resource-arrow {
        font-size: 18px;
        color: var(--ac-color-action-mid);
        font-weight: 700;
      }

      /* Footer */
      .page-footer {
        background: var(--ac-color-surface);
        border-top: 1px solid var(--ac-color-border-slate);
        padding: 32px 20px;
        margin-top: auto;
      }

      .footer-inner {
        max-width: 1080px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .disclaimer {
        font-size: 12px;
        color: var(--ac-color-text-muted);
        line-height: 1.6;
        margin: 0;
      }

      .footer-nav {
        display: flex;
        justify-content: center;
        gap: 20px;
        flex-wrap: wrap;
      }

      .footer-nav a {
        font-size: 13px;
        color: var(--ac-color-action-mid);
        text-decoration: none;
      }

      .footer-nav a.active {
        font-weight: 700;
        text-decoration: underline;
      }

      .copy {
        font-size: 12px;
        color: var(--ac-color-text-muted);
        margin: 0;
      }

      @media (max-width: 640px) {
        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .header-nav {
          width: 100%;
          justify-content: space-between;
          flex-wrap: wrap;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrisisResourcesPage implements OnDestroy {
  private readonly auth = inject(AuthService, { optional: true });
  private readonly i18n = inject(I18nService, { optional: true });

  readonly hotlines = CAMBODIA_CRISIS_HOTLINES;
  readonly currentYear = new Date().getFullYear();

  readonly currentLang = computed(() => this.i18n?.currentLang() ?? 'km');

  readonly isAuthenticated = computed(() => Boolean(this.auth?.isAuthenticated()));
  readonly dashboardPath = computed(() => {
    const role = this.auth?.parent()?.role;
    if (role === 'HOSPITAL') return '/hospital/dashboard';
    return '/dashboard';
  });

  toggleLanguage(): void {
    this.i18n?.toggleLanguage();
  }

  // Breathing Exercise State
  readonly breathingActive = signal(false);
  readonly breathPhase = signal<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  readonly breathSeconds = signal(4);
  private timerId: ReturnType<typeof setInterval> | null = null;

  readonly breathPhaseText = computed(() => {
    const isKm = this.currentLang() === 'km';
    switch (this.breathPhase()) {
      case 'inhale':
        return isKm ? 'ដកដង្ហើមចូលយឺតៗ' : 'Breathe In Slowly';
      case 'hold1':
        return isKm ? 'ទប់ដង្ហើមថ្នមៗ' : 'Hold Gently';
      case 'exhale':
        return isKm ? 'ដកដង្ហើមចេញយឺតៗ' : 'Breathe Out Slowly';
      case 'hold2':
        return isKm ? 'សម្រាកដោយស្ងប់' : 'Rest Peacefully';
    }
  });

  toggleBreathing() {
    if (this.breathingActive()) {
      this.stopBreathing();
    } else {
      this.startBreathing();
    }
  }

  private startBreathing() {
    this.breathingActive.set(true);
    this.breathPhase.set('inhale');
    this.breathSeconds.set(4);

    this.timerId = setInterval(() => {
      const currentSec = this.breathSeconds();
      if (currentSec > 1) {
        this.breathSeconds.set(currentSec - 1);
      } else {
        this.advanceBreathPhase();
        this.breathSeconds.set(4);
      }
    }, 1000);
  }

  private advanceBreathPhase() {
    const current = this.breathPhase();
    if (current === 'inhale') {
      this.breathPhase.set('hold1');
    } else if (current === 'hold1') {
      this.breathPhase.set('exhale');
    } else if (current === 'exhale') {
      this.breathPhase.set('hold2');
    } else {
      this.breathPhase.set('inhale');
    }
  }

  private stopBreathing() {
    this.breathingActive.set(false);
    this.breathSeconds.set(4);
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
