import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  standalone: true,
  template: '<h1>Something went wrong</h1><p>Please try again when you are ready.</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericErrorPage {}
