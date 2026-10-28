import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NavIconComponent } from '../../../core/layout/nav-icon.component';
import { FreeCheckinComponent } from './free-checkin.component';
import { PublicAiChatComponent } from './public-ai-chat.component';

export type ShowcaseFeature = {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
};

type Lang = 'en' | 'km';

/** Words for the small app windows, which stand in for real screens. */
const COPY = {
  en: {
    kicker: 'What you get',
    heading: 'Help for the weeks between noticing and being seen',
    lead: 'AutiCare does not replace a specialist. It makes the waiting time less empty.',
    rail: ['Check-in', 'Ask AutiCare', 'Daily notes', 'Guidance'],
    railLabel: 'Features',
    windows: ['Check-in', 'Ask AutiCare', 'Notes · last 14 days', 'Guidance library'],
    questions: [
      'Does Dara turn when you call their name?',
      'Does Dara point to show you something?',
      'Do loud sounds upset Dara?',
    ],
    answers: ['Often', 'Sometimes', 'Rarely'],
    progress: 'Question 7 of 10',
    band: 'Starting point: some areas to watch',
    notDiagnosis: 'Not a diagnosis',
    ask: 'He covers his ears at the market. Is that something to worry about?',
    reply:
      'Many young children find loud, busy places hard. Try a short quiet break or ear defenders. If it happens often or worries you, a doctor can check his hearing and development.',
    languages: ['Khmer', 'English'],
    notes: [
      ['Sleep', 'Woke at 2am, settled with a song'],
      ['Sensory', 'Covered ears at the market'],
      ['Routine', 'Calm when the day was planned'],
    ],
    pattern: 'Pattern: harder nights after busy days',
    layers: ['Your child’s age', 'Daily routines', 'Calming strategies', 'Reviewed sources'],
    layerNotes: [
      'Ideas matched to where your child is now.',
      'Small steps that fit family life.',
      'What to try when a moment gets hard.',
      'Every tip shows where it came from.',
    ],
  },
  km: {
    kicker: 'អ្វីដែលអ្នកទទួលបាន',
    heading: 'ជំនួយសម្រាប់ពេលវេលារវាងការកត់សម្គាល់ និងការជួបអ្នកជំនាញ',
    lead: 'AutiCare មិនជំនួសអ្នកជំនាញទេ។ វាជួយឱ្យពេលរង់ចាំមិនទទេ។',
    rail: ['ការពិនិត្យ', 'សួរ AutiCare', 'កំណត់ត្រាប្រចាំថ្ងៃ', 'ការណែនាំ'],
    railLabel: 'មុខងារ',
    windows: ['ការពិនិត្យ', 'សួរ AutiCare', 'កំណត់ត្រា · ១៤ ថ្ងៃ', 'បណ្ណាល័យការណែនាំ'],
    questions: [
      'តើដារ៉ាងាកមក នៅពេលអ្នកហៅឈ្មោះទេ?',
      'តើដារ៉ាចង្អុលបង្ហាញអ្វីមួយដល់អ្នកទេ?',
      'តើសំឡេងខ្លាំងធ្វើឱ្យដារ៉ាមិនស្រួលទេ?',
    ],
    answers: ['ញឹកញាប់', 'ពេលខ្លះ', 'កម្រ'],
    progress: 'សំណួរទី ៧ នៃ ១០',
    band: 'ចំណុចចាប់ផ្តើម៖ មានផ្នែកខ្លះត្រូវតាមដាន',
    notDiagnosis: 'មិនមែនការធ្វើរោគវិនិច្ឆ័យ',
    ask: 'កូនខ្ញុំបិទត្រចៀកនៅផ្សារ។ តើត្រូវព្រួយបារម្ភទេ?',
    reply:
      'កុមារតូចៗជាច្រើនពិបាកនៅកន្លែងអ៊ូអរ។ សាកល្បងសម្រាកនៅកន្លែងស្ងាត់មួយភ្លែត ឬប្រើកាសការពារត្រចៀក។ បើវាកើតឡើងញឹកញាប់ ឬអ្នកព្រួយបារម្ភ វេជ្ជបណ្ឌិតអាចពិនិត្យការស្តាប់ និងការលូតលាស់របស់គាត់បាន។',
    languages: ['ខ្មែរ', 'English'],
    notes: [
      ['ដំណេក', 'ភ្ញាក់ម៉ោង ២ យប់ ស្ងប់វិញដោយចម្រៀង'],
      ['អារម្មណ៍', 'បិទត្រចៀកនៅផ្សារ'],
      ['ទម្លាប់', 'ស្ងប់នៅពេលថ្ងៃមានផែនការ'],
    ],
    pattern: 'លំនាំ៖ យប់ពិបាកជាង ក្រោយថ្ងៃមមាញឹក',
    layers: ['អាយុកូនរបស់អ្នក', 'ទម្លាប់ប្រចាំថ្ងៃ', 'វិធីជួយឱ្យស្ងប់', 'ប្រភពដែលបានពិនិត្យ'],
    layerNotes: [
      'គំនិតដែលសមនឹងកូនរបស់អ្នកឥឡូវនេះ។',
      'ជំហានតូចៗដែលសមនឹងជីវិតគ្រួសារ។',
      'អ្វីដែលត្រូវសាកល្បង នៅពេលពិបាក។',
      'ការណែនាំនីមួយៗបង្ហាញពីប្រភព។',
    ],
  },
} as const;

/** Heights (percent) of the 14 bars in the notes window; taller on harder nights. */
const BARS = [30, 45, 25, 60, 35, 40, 80, 30, 50, 28, 70, 38, 44, 85] as const;

/**
 * The landing page's "What you get" section: a sticky menu of the four tools
 * on the left whose active dot follows the scroll, and on the right one block
 * per tool with a small animated window of that part of the app. Blocks fade
 * and slide in as they reach the screen; with reduced motion everything is
 * simply shown.
 */
@Component({
  // Used as <section acFeatureShowcase id="features">, so the page keeps one
  // <section> per part of the landing page.
  selector: 'section[acFeatureShowcase]',
  host: { class: 'showcase', 'aria-labelledby': 'tools-title' },
  standalone: true,
  imports: [NavIconComponent, FreeCheckinComponent, PublicAiChatComponent],
  template: `
    <div class="grid-bg" aria-hidden="true"></div>

    <header class="section-heading reveal" data-reveal>
      <p class="section-kicker">{{ copy().kicker }}</p>
      <h2 id="tools-title" class="words">
        @for (word of headingWords(); track $index) {
          <span class="word" [style.--w]="$index">{{ word }}</span>
        }
      </h2>
      <p class="lead">{{ copy().lead }}</p>
    </header>

    <div class="layout">
      <nav class="rail" [attr.aria-label]="copy().railLabel">
        <span class="rail-dot" aria-hidden="true" [style.--i]="active()"></span>
        @for (label of copy().rail; track label; let i = $index) {
          <button
            type="button"
            class="rail-item"
            [class.active]="active() === i"
            [attr.aria-current]="active() === i ? 'true' : null"
            (click)="scrollTo(i)"
          >
            {{ label }}
          </button>
        }
      </nav>

      <div class="items">
        @for (feature of features(); track feature.title; let i = $index) {
          <article class="showcase-item reveal" data-reveal [attr.data-index]="i">
            <div class="item-copy">
              <span class="tool-icon" aria-hidden="true"
                ><ac-nav-icon [name]="feature.icon"
              /></span>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>

            @if (i === 0) {
              <ac-free-checkin />
            } @else if (i === 1) {
              <ac-public-ai-chat />
            } @else {
              <div class="window" aria-hidden="true">
                <header class="window-bar">
                  <span class="light red"></span>
                  <span class="light amber"></span>
                  <span class="light green"></span>
                  <span class="window-title">{{ copy().windows[i] }}</span>
                </header>
                <div class="window-body">
                  @switch (i) {
                    @case (0) {
                      <div class="check">
                        <div class="progress">
                          <span class="progress-fill"></span>
                        </div>
                        <small class="muted">{{ copy().progress }}</small>
                        @for (question of copy().questions; track question; let q = $index) {
                          <div class="question" [style.--s]="q">
                            <p>{{ question }}</p>
                            <div class="chips">
                              @for (answer of copy().answers; track answer; let a = $index) {
                                <span class="chip" [class.on]="a === (q + 1) % 3">{{
                                  answer
                                }}</span>
                              }
                            </div>
                          </div>
                        }
                        <div class="band" [style.--s]="3">
                          <span>{{ copy().band }}</span>
                          <small>{{ copy().notDiagnosis }}</small>
                        </div>
                      </div>
                    }
                    @case (1) {
                      <div class="chat">
                        <div class="langs">
                          @for (language of copy().languages; track language; let l = $index) {
                            <span class="chip" [class.on]="l === 0">{{ language }}</span>
                          }
                        </div>
                        <p class="bubble you" [style.--s]="0">{{ copy().ask }}</p>
                        <p class="bubble bot" [style.--s]="1">
                          {{ copy().reply }}<span class="cursor"></span>
                        </p>
                      </div>
                    }
                    @case (2) {
                      <div class="notes">
                        <div class="bars">
                          @for (bar of bars; track $index) {
                            <span
                              class="bar"
                              [class.hard]="bar >= 70"
                              [style.--h]="bar"
                              [style.--s]="$index"
                            ></span>
                          }
                        </div>
                        <ul class="note-list">
                          @for (note of copy().notes; track note[0]; let n = $index) {
                            <li [style.--s]="n">
                              <strong>{{ note[0] }}</strong
                              ><span>{{ note[1] }}</span>
                            </li>
                          }
                        </ul>
                        <p class="pattern" [style.--s]="3">{{ copy().pattern }}</p>
                      </div>
                    }
                    @case (3) {
                      <div class="stack">
                        <svg viewBox="-200 -260 400 470" class="stack-art">
                          @for (layer of [0, 1, 2, 3]; track layer) {
                            <g class="layer" [style.--s]="layer">
                              <g [attr.transform]="'translate(0,' + (150 - layer * 100) + ')'">
                                <path class="side-r" d="M 0 100 L 160 20 L 160 44 L 0 124 Z" />
                                <path class="side-l" d="M 0 100 L -160 20 L -160 44 L 0 124 Z" />
                                <path class="top" d="M 0 100 L 160 20 L 0 -60 L -160 20 Z" />
                                <path class="inset" d="M 0 78 L 116 20 L 0 -38 L -116 20 Z" />
                              </g>
                            </g>
                          }
                          <line class="guide" x1="-160" y1="-170" x2="-160" y2="190" />
                          <line class="guide" x1="160" y1="-170" x2="160" y2="190" />
                        </svg>
                        <ul class="stack-labels">
                          @for (label of copy().layers; track label; let l = $index) {
                            <li [class]="'label-' + l" [style.--s]="l">
                              <strong>{{ label }}</strong>
                              <span>{{ copy().layerNotes[l] }}</span>
                            </li>
                          }
                        </ul>
                      </div>
                    }
                  }
                </div>
              </div>
            }
          </article>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        --ease: cubic-bezier(0.22, 1, 0.36, 1);
        --spring: cubic-bezier(0.34, 1.56, 0.64, 1);
        --rail-step: 52px;
        position: relative;
        padding: 96px var(--lp-x, clamp(16px, 4vw, 48px));
        background: var(--ac-color-surface);
        /* clip, not hidden: overflow: hidden would turn this section into a
           scroll container and stop the sticky menu from pinning. */
        overflow: clip;
      }

      /* Faint grid that fades out towards the bottom, as in the reference. */
      .grid-bg {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(to right, var(--ac-color-border-slate) 1px, transparent 1px),
          linear-gradient(to bottom, var(--ac-color-border-slate) 1px, transparent 1px);
        background-size: 4rem 4rem;
        opacity: 0.5;
        mask-image: radial-gradient(
          ellipse 60% 50% at 50% 0%,
          var(--ac-color-ink-a) 70%,
          transparent 100%
        );
        pointer-events: none;
      }

      .section-heading {
        position: relative;
        max-width: 860px;
        margin: 0 auto 72px;
        text-align: center;
        display: grid;
        gap: 16px;
      }

      .section-kicker {
        margin: 0;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--ac-color-action-deep);
      }

      h2 {
        margin: 0;
        font-size: clamp(30px, 4.4vw, 52px);
        line-height: 1.12;
        font-weight: 800;
        color: var(--ac-color-text-strong);
      }

      .word {
        display: inline-block;
        margin-right: 0.28em;
        opacity: 0;
        transform: translateY(0.45em);
        transition:
          opacity 600ms var(--ease),
          transform 600ms var(--ease);
        transition-delay: calc(var(--w) * 60ms);
      }

      .in-view .word {
        opacity: 1;
        transform: none;
      }

      .lead {
        margin: 0;
        font-size: clamp(17px, 1.6vw, 20px);
        line-height: 1.6;
        color: var(--ac-color-text-muted);
      }

      /* Everything marked data-reveal fades and rises once it reaches the screen. */
      .reveal .lead,
      .showcase-item .item-copy,
      .showcase-item .window {
        opacity: 0;
        transform: translateY(24px);
        transition:
          opacity 700ms var(--ease),
          transform 700ms var(--ease);
      }

      .reveal .lead {
        transition-delay: 250ms;
      }

      .showcase-item .window {
        transform: translateY(40px) scale(0.98);
        transition-delay: 150ms;
      }

      .in-view .lead,
      .in-view .item-copy,
      .in-view .window {
        opacity: 1;
        transform: none;
      }

      .layout {
        position: relative;
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr);
        gap: 72px;
      }

      /* Sticky menu; one dot springs to the active item. */
      .rail {
        position: sticky;
        top: 140px;
        align-self: start;
        display: grid;
        gap: 8px;
        padding-left: 22px;
      }

      .rail-dot {
        position: absolute;
        left: 4px;
        top: 19px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ac-color-action);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--ac-color-action) 18%, transparent);
        transform: translateY(calc(var(--i, 0) * var(--rail-step)));
        transition: transform 520ms var(--spring);
      }

      .rail-item {
        height: 44px;
        border: 0;
        border-radius: 10px;
        background: none;
        padding: 0 12px;
        text-align: left;
        font: inherit;
        font-size: 15px;
        font-weight: 600;
        color: var(--ac-color-text-muted);
        cursor: pointer;
        transition:
          color 200ms ease,
          background 200ms ease;
      }

      .rail-item:hover {
        color: var(--ac-color-text-body);
        background: color-mix(in srgb, var(--ac-color-action) 6%, transparent);
      }

      .rail-item.active {
        color: var(--ac-color-text-strong);
      }

      .rail-item:focus-visible {
        outline: 3px solid var(--ac-color-focus);
        outline-offset: 2px;
      }

      .items {
        display: grid;
        gap: 120px;
        min-width: 0;
      }

      .showcase-item {
        display: grid;
        gap: 28px;
        scroll-margin-top: 120px;
      }

      .item-copy {
        display: grid;
        gap: 12px;
        max-width: 640px;
      }

      .tool-icon {
        display: inline-grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--ac-color-surface-info);
        color: var(--ac-color-action-deep);
      }

      h3 {
        margin: 0;
        font-size: clamp(26px, 3vw, 38px);
        line-height: 1.15;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--ac-color-text-strong);
      }

      .item-copy p {
        margin: 0;
        font-size: 18px;
        line-height: 1.6;
        color: var(--ac-color-text-muted);
      }

      /* The app window. Lifts and lights its three dots on hover. */
      .window {
        position: relative;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 16px;
        background: var(--ac-color-surface);
        box-shadow: 0 24px 60px -30px
          color-mix(in srgb, var(--ac-color-action-deep) 35%, transparent);
        overflow: hidden;
      }

      .in-view .window {
        transition:
          opacity 700ms var(--ease) 150ms,
          transform 400ms var(--ease),
          box-shadow 400ms var(--ease),
          border-color 400ms var(--ease);
      }

      .in-view .window:hover {
        transform: translateY(-6px);
        border-color: color-mix(in srgb, var(--ac-color-action) 45%, transparent);
        box-shadow: 0 32px 70px -30px
          color-mix(in srgb, var(--ac-color-action-deep) 50%, transparent);
      }

      .window-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface-slate);
      }

      .light {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--ac-color-border-slate);
        transition: background 500ms ease;
      }

      .window:hover .light.red {
        background: var(--ac-color-alert-text);
      }

      .window:hover .light.amber {
        background: var(--ac-color-amber-500);
        transition-delay: 75ms;
      }

      .window:hover .light.green {
        background: var(--ac-color-green-500);
        transition-delay: 150ms;
      }

      .window-title {
        margin-left: auto;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: var(--ac-color-text-muted);
      }

      .window-body {
        position: relative;
        padding: clamp(18px, 3vw, 32px);
        min-height: 300px;
        background-image: radial-gradient(var(--ac-color-border-slate) 1px, transparent 1px);
        background-size: 16px 16px;
      }

      /* Pieces inside a window appear one after another (--s is the order). */
      .question,
      .band,
      .bubble,
      .note-list li,
      .pattern,
      .stack-labels li {
        opacity: 0;
        transform: translateX(-16px);
        transition:
          opacity 500ms var(--ease),
          transform 500ms var(--ease);
        transition-delay: calc(400ms + var(--s, 0) * 140ms);
      }

      .in-view .question,
      .in-view .band,
      .in-view .bubble,
      .in-view .note-list li,
      .in-view .pattern,
      .in-view .stack-labels li {
        opacity: 1;
        transform: none;
      }

      .muted {
        color: var(--ac-color-text-muted);
        font-size: 12px;
      }

      .chip {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        font-size: 13px;
        font-weight: 600;
        color: var(--ac-color-text-body);
      }

      .chip.on {
        border-color: var(--ac-color-action);
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
      }

      /* 1 · Check-in */
      .check {
        display: grid;
        gap: 14px;
        max-width: 560px;
      }

      .progress {
        height: 8px;
        border-radius: 999px;
        background: var(--ac-color-surface-slate);
        overflow: hidden;
      }

      .progress-fill {
        display: block;
        height: 100%;
        width: 70%;
        border-radius: inherit;
        background: var(--ac-color-action);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 1200ms var(--ease) 300ms;
      }

      .in-view .progress-fill {
        transform: none;
      }

      .question {
        display: grid;
        gap: 10px;
        padding: 14px 16px;
        border: 1px solid var(--ac-color-border-slate);
        border-radius: 12px;
        background: var(--ac-color-surface);
      }

      .question p {
        margin: 0;
        font-weight: 600;
        color: var(--ac-color-text-strong);
      }

      .chips {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .band {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        padding: 12px 16px;
        border-radius: 12px;
        background: var(--ac-color-amber-tint-cream);
        color: var(--ac-color-amber-dark);
        font-weight: 700;
      }

      .band small {
        font-weight: 600;
      }

      /* 2 · Ask AutiCare */
      .chat {
        display: grid;
        gap: 14px;
        max-width: 620px;
      }

      .langs {
        display: flex;
        gap: 8px;
      }

      .bubble {
        margin: 0;
        padding: 14px 16px;
        border-radius: 16px;
        line-height: 1.55;
        max-width: 88%;
      }

      .bubble.you {
        justify-self: end;
        border-bottom-right-radius: 4px;
        background: var(--ac-color-action);
        color: var(--ac-color-text-on-action);
        transform: translateX(16px);
      }

      .bubble.bot {
        border-bottom-left-radius: 4px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
      }

      .cursor {
        display: inline-block;
        width: 6px;
        height: 1em;
        margin-left: 3px;
        vertical-align: -0.15em;
        background: var(--ac-color-action);
        animation: blink 1s steps(2, start) infinite;
      }

      @keyframes blink {
        to {
          visibility: hidden;
        }
      }

      /* 3 · Daily notes */
      .notes {
        display: grid;
        gap: 18px;
      }

      .bars {
        display: grid;
        grid-template-columns: repeat(14, minmax(0, 1fr));
        align-items: end;
        gap: 6px;
        height: 140px;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--ac-color-border-slate);
      }

      .bar {
        display: block;
        height: calc(var(--h) * 1%);
        border-radius: 6px 6px 2px 2px;
        background: color-mix(in srgb, var(--ac-color-action) 55%, transparent);
        transform: scaleY(0);
        transform-origin: bottom;
        transition: transform 700ms var(--spring);
        transition-delay: calc(300ms + var(--s) * 45ms);
      }

      .bar.hard {
        background: var(--ac-color-amber-500);
      }

      .in-view .bar {
        transform: none;
      }

      .note-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 8px;
      }

      .note-list li {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid var(--ac-color-border-slate);
        background: var(--ac-color-surface);
        color: var(--ac-color-text-body);
        transition-delay: calc(900ms + var(--s, 0) * 140ms);
      }

      .note-list strong {
        min-width: 72px;
        color: var(--ac-color-action-deep);
      }

      .pattern {
        margin: 0;
        font-weight: 700;
        color: var(--ac-color-text-strong);
        transition-delay: 1400ms;
      }

      /* 4 · Guidance: layers rise into a stack, labels fade in beside it. */
      .stack {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        align-items: center;
        gap: 24px;
      }

      .stack-art {
        width: 100%;
        max-width: 360px;
        justify-self: center;
        overflow: visible;
      }

      .layer {
        opacity: 0;
        transform: translateY(60px);
        transition:
          opacity 900ms var(--ease),
          transform 900ms var(--ease);
        transition-delay: calc(var(--s) * 180ms);
      }

      .in-view .layer {
        opacity: 1;
        transform: none;
      }

      .top {
        fill: var(--ac-color-surface);
        stroke: var(--ac-color-action);
        stroke-width: 1.5;
      }

      .inset {
        fill: color-mix(in srgb, var(--ac-color-action) 10%, transparent);
        stroke: color-mix(in srgb, var(--ac-color-action) 55%, transparent);
        stroke-width: 1;
      }

      .side-r {
        fill: color-mix(in srgb, var(--ac-color-action) 22%, var(--ac-color-surface));
      }

      .side-l {
        fill: color-mix(in srgb, var(--ac-color-action) 10%, var(--ac-color-surface));
      }

      .guide {
        stroke: var(--ac-color-border-slate);
        stroke-dasharray: 4 4;
      }

      .stack-labels {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 18px;
      }

      .stack-labels li {
        display: grid;
        gap: 4px;
        padding-left: 14px;
        border-left: 2px solid var(--ac-color-border-slate);
        transition-delay: calc(900ms + var(--s, 0) * 150ms);
      }

      .stack-labels strong {
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ac-color-text-strong);
      }

      .stack-labels span {
        font-size: 14px;
        line-height: 1.5;
        color: var(--ac-color-text-muted);
      }

      @media (max-width: 1023px) {
        .layout {
          grid-template-columns: minmax(0, 1fr);
          gap: 0;
        }

        .rail {
          display: none;
        }

        .items {
          gap: 80px;
        }
      }

      @media (max-width: 720px) {
        :host {
          padding: 56px var(--lp-x, clamp(16px, 4vw, 48px));
        }

        .section-heading {
          margin-bottom: 48px;
        }

        .stack {
          grid-template-columns: minmax(0, 1fr);
        }

        .bars {
          gap: 3px;
        }

        .window-body {
          min-height: 0;
        }
      }

      /* With reduced motion, show the finished state and skip every animation. */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          transition: none !important;
          animation: none !important;
        }

        .word,
        .lead,
        .item-copy,
        .window,
        .question,
        .band,
        .bubble,
        .note-list li,
        .pattern,
        .stack-labels li,
        .layer {
          opacity: 1 !important;
          transform: none !important;
        }

        .progress-fill,
        .bar {
          transform: none !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureShowcaseComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly lang = input<Lang>('en');
  readonly features = input.required<readonly ShowcaseFeature[]>();

  protected readonly copy = computed(() => COPY[this.lang()]);
  protected readonly headingWords = computed(() => this.copy().heading.split(' '));
  protected readonly active = signal(0);
  protected readonly bars = BARS;

  constructor() {
    afterNextRender(() => this.observe());
  }

  protected scrollTo(index: number): void {
    const target = this.host.nativeElement.querySelector(`[data-index="${index}"]`);
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
  }

  /**
   * Two observers: one reveals each block the first time it is on screen, the
   * other moves the menu dot to the block most in view. Without
   * IntersectionObserver (old browsers, tests) everything is simply shown.
   */
  private observe(): void {
    const root = this.host.nativeElement;
    const revealables = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (typeof IntersectionObserver === 'undefined') {
      revealables.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('in-view');
          reveal.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );
    revealables.forEach((el) => reveal.observe(el));

    const track = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const index = Number(best?.target.getAttribute('data-index'));
        if (best && !Number.isNaN(index)) this.active.set(index);
      },
      { threshold: [0.3, 0.6], rootMargin: '-20% 0px -40% 0px' },
    );
    root.querySelectorAll('[data-index]').forEach((el) => track.observe(el));

    this.destroyRef.onDestroy(() => {
      reveal.disconnect();
      track.disconnect();
    });
  }
}
