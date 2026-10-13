import { inject, Pipe, type PipeTransform } from '@angular/core';
import { I18nService } from './i18n.service';

/**
 * Standalone Angular pipe for reactive internationalization.
 * Marked as pure: false so it reactively re-evaluates whenever I18nService's
 * currentLang signal updates without requiring manual template refreshes.
 *
 * Usage:
 *   {{ 'screening.start' | translate }}
 *   {{ 'progress.streakLabel' | translate:{ days: 5 } }}
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string | null | undefined, params?: Record<string, string | number>): string {
    if (!key) {
      return '';
    }
    return this.i18n.t(key, params);
  }
}
