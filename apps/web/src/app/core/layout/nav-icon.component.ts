import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Line icons for the shell's navigation, drawn on one 24px grid with one stroke
 * weight so the sidebar, the mobile bar and the drawer all read as one set.
 * Names match `NavItem.icon`; an unknown name renders an empty frame rather than
 * shifting the label.
 */
@Component({
  selector: 'ac-nav-icon',
  standalone: true,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('grid') {
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        }
        @case ('report') {
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
        }
        @case ('checklist') {
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="m9 14 2 2 4-4" />
        }
        @case ('trend') {
          <path d="M3 3v16a2 2 0 0 0 2 2h16" />
          <path d="m7 14 4-4 3 3 5-6" />
        }
        @case ('ai') {
          <path
            d="M9.94 15.5a2 2 0 0 0-1.44-1.44l-6.13-1.58a.5.5 0 0 1 0-.96l6.13-1.58a2 2 0 0 0 1.44-1.44l1.58-6.14a.5.5 0 0 1 .96 0l1.58 6.14a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z"
          />
          <path d="M20 3v4M22 5h-4" />
        }
        @case ('school') {
          <path d="M22 10 12 5 2 10l10 5 10-5Z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5M22 10v6" />
        }
        @case ('hospital') {
          <path d="M12 6v4M10 8h4" />
          <path d="M18 22V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v17" />
          <path d="M18 11h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2" />
          <path d="M10 22v-4h4v4" />
        }
        @case ('activity') {
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <circle cx="17.5" cy="6.5" r="3.5" />
          <path d="M6.5 14 10 21H3l3.5-7Z" />
          <rect x="14" y="14" width="7" height="7" rx="3.5" />
        }
        @case ('calendar') {
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        }
        @case ('family') {
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        }
        @case ('children') {
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 14.5s1.3 1.8 3.5 1.8 3.5-1.8 3.5-1.8M9 9.5h.01M15 9.5h.01" />
        }
        @case ('bell') {
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        }
        @case ('person') {
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
        }
        @case ('settings') {
          <path d="M20 7h-9M14 17H5" />
          <circle cx="17" cy="17" r="3" />
          <circle cx="7" cy="7" r="3" />
        }
        @case ('help') {
          <circle cx="12" cy="12" r="9" />
          <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('check') {
          <path d="M20 6 9 17l-5-5" />
        }
        @case ('close') {
          <path d="M18 6 6 18M6 6l12 12" />
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        }
        @case ('star') {
          <path
            d="M11.5 2.8a.6.6 0 0 1 1 0l2.6 5.3 5.8.8a.6.6 0 0 1 .3 1l-4.2 4.1 1 5.8a.6.6 0 0 1-.8.6L12 17.7l-5.2 2.7a.6.6 0 0 1-.8-.6l1-5.8-4.2-4.1a.6.6 0 0 1 .3-1l5.8-.8Z"
          />
        }
        @case ('stethoscope') {
          <path d="M5 3H4a1 1 0 0 0-1 1v5a6 6 0 0 0 12 0V4a1 1 0 0 0-1-1h-1" />
          <path d="M9 15v1a5 5 0 0 0 10 0v-3" />
          <circle cx="19" cy="11" r="2" />
        }
        @case ('pen') {
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        }
        @case ('shield') {
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        }
        @case ('chat') {
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
        }
        @case ('motor') {
          <circle cx="13.5" cy="4.5" r="2" />
          <path d="m7 21 3-6 3 2v5M10 15l1-6 4 2 3 1M6 11l3-2h2" />
        }
        @case ('building') {
          <path d="M3 21h18M5 21V10l7-5 7 5v11" />
          <path d="M9 21v-5h6v5M9 11h.01M15 11h.01M12 11h.01" />
        }
        @case ('brain') {
          <path
            d="M12 5a3 3 0 0 0-5.9-.8A3 3 0 0 0 4 9a3 3 0 0 0 .5 5.5A3 3 0 0 0 8 19a3 3 0 0 0 4 1Z"
          />
          <path
            d="M12 5a3 3 0 0 1 5.9-.8A3 3 0 0 1 20 9a3 3 0 0 1-.5 5.5A3 3 0 0 1 16 19a3 3 0 0 1-4 1Z"
          />
          <path d="M12 5v15" />
        }
        @case ('book') {
          <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z" />
          <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z" />
        }
        @case ('pin') {
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        }
        @case ('card') {
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20M6 15h4" />
        }
        @case ('receipt') {
          <path d="M5 2h14v20l-3-2-2 2-2-2-2 2-2-2-3 2Z" />
          <path d="M9 7h6M9 11h6M9 15h4" />
        }
        @case ('gift') {
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
          <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
        }
        @case ('handshake') {
          <path d="m11 17 2 2a1 1 0 1 0 3-3" />
          <path
            d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a5 5 0 0 1 6 .8L21 9"
          />
          <path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8" />
        }
        @case ('chart') {
          <path d="M6 20v-6M12 20V4M18 20v-10" />
        }
        @case ('megaphone') {
          <path d="m3 11 15-6v14L3 13Z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6M21 9v4" />
        }
        @case ('file') {
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6M8 13h8M8 17h5" />
        }
        @case ('gear') {
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
          />
        }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-grid;
        place-items: center;
        width: 20px;
        height: 20px;
        flex: 0 0 auto;
        color: currentColor;
      }

      svg {
        width: 100%;
        height: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavIconComponent {
  readonly name = input.required<string>();
}
