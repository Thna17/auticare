import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ButtonSize, ButtonVariant } from './ui-button.component';
import { UiButtonComponent } from './ui-button.component';
import type { CardVariant } from './ui-card.component';
import { UiCardComponent } from './ui-card.component';
import { UiFieldComponent } from './ui-field.component';
import type { BadgeTone } from './ui-badge.component';
import { UiBadgeComponent } from './ui-badge.component';
import { UiEmptyStateComponent } from './ui-empty-state.component';

@Component({
  standalone: true,
  imports: [
    UiButtonComponent,
    UiCardComponent,
    UiFieldComponent,
    UiBadgeComponent,
    UiEmptyStateComponent,
  ],
  template: `
    <ac-ui-button
      [variant]="btnVariant()"
      [size]="btnSize()"
      [disabled]="btnDisabled()"
      [loading]="btnLoading()"
    >
      Click me
    </ac-ui-button>

    <ac-ui-card [interactive]="cardInteractive()" [variant]="cardVariant()">
      <p>Card content</p>
    </ac-ui-card>

    <ac-ui-field
      [label]="fieldLabel()"
      [required]="fieldRequired()"
      [optional]="fieldOptional()"
      [hint]="fieldHint()"
      [error]="fieldError()"
    >
      <input type="text" />
    </ac-ui-field>

    <ac-ui-badge [tone]="badgeTone()">Status Label</ac-ui-badge>

    <ac-ui-empty-state
      [title]="emptyTitle()"
      [message]="emptyMessage()"
      [icon]="emptyIcon()"
      [actionText]="emptyActionText()"
      (action)="onActionInvoked()"
    >
      <button type="button" class="empty-action">Take Action</button>
    </ac-ui-empty-state>
  `,
})
class TestHostComponent {
  readonly btnVariant = signal<ButtonVariant>('primary');
  readonly btnSize = signal<ButtonSize>('md');
  readonly btnDisabled = signal(false);
  readonly btnLoading = signal(false);

  readonly cardInteractive = signal(false);
  readonly cardVariant = signal<CardVariant>('default');

  readonly fieldLabel = signal('Test Field');
  readonly fieldRequired = signal(false);
  readonly fieldOptional = signal(false);
  readonly fieldHint = signal<string | null>(null);
  readonly fieldError = signal<string | null>(null);

  readonly badgeTone = signal<BadgeTone>('positive');

  readonly emptyTitle = signal('No Records Found');
  readonly emptyMessage = signal('There are no records matching your request.');
  readonly emptyIcon = signal<string | null>(null);
  readonly emptyActionText = signal<string | null>(null);
  readonly actionInvoked = signal(false);

  onActionInvoked() {
    this.actionInvoked.set(true);
  }
}

describe('Design System Components', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  describe('UiButtonComponent', () => {
    it('renders with default primary variant and md size', () => {
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('ac-ui-button button');
      expect(btn).not.toBeNull();
      expect(btn.classList.contains('btn-md')).toBe(true);
      expect(btn.classList.contains('secondary')).toBe(false);
      expect(btn.textContent.trim()).toBe('Click me');
    });

    it('applies secondary variant class', () => {
      host.btnVariant.set('secondary');
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('ac-ui-button button');
      expect(btn.classList.contains('secondary')).toBe(true);
    });

    it('applies destructive variant class', () => {
      host.btnVariant.set('destructive');
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('ac-ui-button button');
      expect(btn.classList.contains('destructive')).toBe(true);
    });

    it('applies size classes sm and lg', () => {
      host.btnSize.set('sm');
      fixture.detectChanges();
      const btnSm = fixture.nativeElement.querySelector('ac-ui-button button');
      expect(btnSm.classList.contains('btn-sm')).toBe(true);
    });

    it('applies size class lg', () => {
      host.btnSize.set('lg');
      fixture.detectChanges();
      const btnLg = fixture.nativeElement.querySelector('ac-ui-button button');
      expect(btnLg.classList.contains('btn-lg')).toBe(true);
    });

    it('handles disabled state', () => {
      host.btnDisabled.set(true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('ac-ui-button button');
      expect(btn.disabled).toBe(true);
    });

    it('applies ghost variant class', () => {
      host.btnVariant.set('ghost');
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('ac-ui-button button');
      expect(btn.classList.contains('ghost')).toBe(true);
    });

    it('renders spinner and sets aria-busy when loading', () => {
      host.btnLoading.set(true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('ac-ui-button button');
      expect(btn.classList.contains('loading')).toBe(true);
      expect(btn.disabled).toBe(true);
      expect(btn.getAttribute('aria-busy')).toBe('true');
      expect(btn.querySelector('.spinner')).not.toBeNull();
    });
  });

  describe('UiCardComponent', () => {
    it('renders card content without interactive class by default', () => {
      fixture.detectChanges();
      const card = fixture.nativeElement.querySelector('ac-ui-card section');
      expect(card).not.toBeNull();
      expect(card.classList.contains('interactive')).toBe(false);
      expect(card.textContent).toContain('Card content');
    });

    it('adds interactive class when interactive is true', () => {
      host.cardInteractive.set(true);
      fixture.detectChanges();
      const card = fixture.nativeElement.querySelector('ac-ui-card section');
      expect(card.classList.contains('interactive')).toBe(true);
    });

    it('applies elevated variant class', () => {
      host.cardVariant.set('elevated');
      fixture.detectChanges();
      const card = fixture.nativeElement.querySelector('ac-ui-card section');
      expect(card.classList.contains('variant-elevated')).toBe(true);
    });

    it('applies outlined variant class', () => {
      host.cardVariant.set('outlined');
      fixture.detectChanges();
      const card = fixture.nativeElement.querySelector('ac-ui-card section');
      expect(card.classList.contains('variant-outlined')).toBe(true);
    });
  });

  describe('UiFieldComponent', () => {
    it('renders label and connects input attributes', () => {
      fixture.detectChanges();
      const label = fixture.nativeElement.querySelector('ac-ui-field label');
      const input = fixture.nativeElement.querySelector('ac-ui-field input');
      expect(label.textContent).toContain('Test Field');
      expect(input.id).toBe(label.getAttribute('for'));
    });

    it('renders required indicator when required is true', () => {
      host.fieldRequired.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.required-indicator')).not.toBeNull();
    });

    it('renders optional indicator when optional is true', () => {
      host.fieldOptional.set(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.optional')).not.toBeNull();
    });

    it('displays error with warning glyph and marks input aria-invalid', () => {
      host.fieldError.set('Field is required');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const error = compiled.querySelector('.error');
      const input = compiled.querySelector('input');

      expect(error).not.toBeNull();
      expect(error?.textContent).toContain('Field is required');
      expect(error?.textContent).toContain('⚠');
      expect(input?.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('UiBadgeComponent', () => {
    it('renders positive tone with checkmark glyph', () => {
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('ac-ui-badge .badge');
      expect(badge.classList.contains('positive')).toBe(true);
      expect(badge.textContent).toContain('Status Label');
      expect(badge.textContent).toContain('\u2713');
    });

    it('renders caution tone with pending glyph', () => {
      host.badgeTone.set('caution');
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('ac-ui-badge .badge');
      expect(badge.classList.contains('caution')).toBe(true);
      expect(badge.textContent).toContain('\u25CF');
    });

    it('renders alert tone with x glyph', () => {
      host.badgeTone.set('alert');
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('ac-ui-badge .badge');
      expect(badge.classList.contains('alert')).toBe(true);
      expect(badge.textContent).toContain('\u2715');
    });

    it('renders neutral tone', () => {
      host.badgeTone.set('neutral');
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('ac-ui-badge .badge');
      expect(badge.classList.contains('neutral')).toBe(true);
    });

    it('normalizes success tone to positive styling', () => {
      host.badgeTone.set('success');
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('ac-ui-badge .badge');
      expect(badge.classList.contains('positive')).toBe(true);
      expect(badge.textContent).toContain('\u2713');
    });

    it('normalizes warning tone to caution styling', () => {
      host.badgeTone.set('warning');
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('ac-ui-badge .badge');
      expect(badge.classList.contains('caution')).toBe(true);
      expect(badge.textContent).toContain('\u25CF');
    });

    it('normalizes error tone to alert styling', () => {
      host.badgeTone.set('error');
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('ac-ui-badge .badge');
      expect(badge.classList.contains('alert')).toBe(true);
      expect(badge.textContent).toContain('\u2715');
    });

    it('renders info tone with info glyph', () => {
      host.badgeTone.set('info');
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector('ac-ui-badge .badge');
      expect(badge.classList.contains('info')).toBe(true);
      expect(badge.textContent).toContain('\u2139');
    });
  });

  describe('UiEmptyStateComponent', () => {
    it('renders title, message, default icon, and projected actions', () => {
      fixture.detectChanges();
      const empty = fixture.nativeElement.querySelector('ac-ui-empty-state');
      expect(empty.textContent).toContain('No Records Found');
      expect(empty.textContent).toContain('There are no records matching your request.');
      expect(empty.textContent).toContain('📂');

      const action = empty.querySelector('.empty-action');
      expect(action).not.toBeNull();
      expect(action.textContent).toBe('Take Action');
    });

    it('renders custom icon when provided', () => {
      host.emptyIcon.set('🔍');
      fixture.detectChanges();
      const empty = fixture.nativeElement.querySelector('ac-ui-empty-state');
      expect(empty.textContent).toContain('🔍');
    });

    it('renders primary action button and emits action event when clicked', () => {
      host.emptyActionText.set('Create First Entry');
      fixture.detectChanges();
      const actionBtn = fixture.nativeElement.querySelector('.empty-primary-btn');
      expect(actionBtn).not.toBeNull();
      expect(actionBtn.textContent).toContain('Create First Entry');

      actionBtn.click();
      expect(host.actionInvoked()).toBe(true);
    });
  });
});
