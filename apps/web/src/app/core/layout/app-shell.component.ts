import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
@Component({
  selector: 'ac-app-shell',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `<a class="skip" href="#main">Skip to content</a>
    <header class="topbar">
      <a class="brand" routerLink="/dashboard">AutiCare</a>
      <nav aria-label="Main navigation">
        <a routerLink="/children">Children</a><a routerLink="/screening">Screening</a
        ><a routerLink="/schools">Schools</a><a routerLink="/hospitals">Hospitals</a
        ><a routerLink="/activities">Activities</a><a routerLink="/progress">Progress</a
        ><a routerLink="/settings">Settings</a>
      </nav>
    </header>
    <main id="main" class="shell"><router-outlet /></main>`,
  styles: [
    '.skip{position:absolute;left:-999px}.skip:focus{left:1rem;top:1rem;z-index:99;background:white;padding:.5rem}.topbar{position:sticky;top:0;z-index:var(--ac-z-header);display:flex;gap:1rem;align-items:center;justify-content:space-between;padding:1rem 1.5rem;background:var(--ac-color-surface);border-bottom:var(--ac-border-subtle)}.brand{font-weight:800;color:var(--ac-color-text-dark);text-decoration:none}nav{display:flex;gap:.75rem;flex-wrap:wrap}nav a{color:var(--ac-color-text);text-decoration:none;min-height:44px;display:inline-flex;align-items:center}.shell{max-width:1120px;margin:0 auto;padding:var(--ac-space-8) var(--ac-space-4)}@media(max-width:720px){.topbar{align-items:flex-start;flex-direction:column}}',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {}
