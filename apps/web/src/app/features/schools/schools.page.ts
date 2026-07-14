import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiCardComponent } from '../../design-system/components/ui-card.component';
@Component({
  standalone: true,
  imports: [UiCardComponent],
  template:
    '<ac-ui-card><h1>Schools</h1><p>This workspace is ready for feature implementation.</p></ac-ui-card>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolsPage {}
