import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  standalone: true,
  template: '<h1>Unauthorized</h1><p>Please sign in to continue.</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnauthorizedPage {}
