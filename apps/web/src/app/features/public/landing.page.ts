import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../design-system/components/ui-button.component';
@Component({
  standalone: true,
  imports: [RouterLink, UiButtonComponent],
  template: `<section class="landing">
    <h1>AutiCare</h1>
    <p>
      Calm support planning for parents and caregivers. Screening information is not a medical
      diagnosis.
    </p>
    <a routerLink="/register"><ac-ui-button>Create account</ac-ui-button></a
    ><a routerLink="/login">Sign in</a>
  </section>`,
  styles: [
    '.landing{max-width:720px;padding:4rem 1rem}h1{font-size:3rem;color:var(--ac-color-text-dark)}p{font-size:1.2rem;line-height:1.6}a{margin-right:1rem}',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {}
