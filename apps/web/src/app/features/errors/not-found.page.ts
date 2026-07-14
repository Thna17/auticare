import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  standalone: true,
  template: '<h1>Page not found</h1><p>The page you requested is not available.</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
