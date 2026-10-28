// @vitest-environment jsdom
import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { I18nService } from '../../../core/i18n/i18n.service';
import { FreeCheckinComponent } from './free-checkin.component';

TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

describe('FreeCheckinComponent language switching', () => {
  let i18n: I18nService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeCheckinComponent],
      providers: [provideZonelessChangeDetection(), I18nService],
    }).compileComponents();
    i18n = TestBed.inject(I18nService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('shows the full Khmer introduction, then keeps the selected answer when switching to English', () => {
    i18n.setLanguage('km');
    const fixture = TestBed.createComponent(FreeCheckinComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('ការពិនិត្យបឋមអំពីការអភិវឌ្ឍរបស់កុមារ ដោយឥតគិតថ្លៃ');
    expect(root.textContent).toContain('ឥតគិតថ្លៃ · រក្សាឯកជនភាព · មិនចាំបាច់បង្កើតគណនី');
    expect(root.textContent).toContain('អាយុរបស់កូន');
    expect(root.textContent).toContain('ឈ្មោះហៅក្រៅ (មិនចាំបាច់)');
    expect(root.textContent).toContain('យល់ព្រមឱ្យដំណើរការចម្លើយ');

    fixture.componentInstance.age.set('36');
    fixture.componentInstance.consent.set(true);
    fixture.componentInstance.start();
    fixture.detectChanges();
    expect(root.textContent).toContain('សំណួរទី ១ ក្នុងចំណោម ១០');
    expect(root.textContent).toContain('នៅពេលអ្នកហៅឈ្មោះកូន តើកូនងាកមកមើល ឬឆ្លើយតបញឹកញាប់ប៉ុណ្ណា?');
    expect(root.textContent).toContain('មិនទាន់សង្កេតឃើញ');

    fixture.componentInstance.choose('Rarely');
    i18n.setLanguage('en');
    fixture.detectChanges();
    expect(root.textContent).toContain("When you call your child's name");
    expect(root.textContent).toContain('Question 1 of 10');
    expect(root.querySelector('.options button.selected')?.textContent).toContain('Rarely');
    expect(fixture.componentInstance.answers()[0]).toBe('Rarely');
  });

  it('translates the result and preserves its answer-based score when changing languages', () => {
    i18n.setLanguage('km');
    const fixture = TestBed.createComponent(FreeCheckinComponent);
    fixture.detectChanges();
    fixture.componentInstance.answers.set(Array.from({ length: 10 }, () => 'Often' as const));
    fixture.componentInstance.analyze();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('លទ្ធផលនៃការពិនិត្យបឋមរបស់កូន');
    expect(root.textContent).toContain('ពិន្ទុចម្លើយ');
    expect(root.textContent).toContain('៣០%');
    expect(root.textContent).toContain('ទាញយកលទ្ធផល');
    expect(root.textContent).toContain('ធ្វើការវាយតម្លៃម្តងទៀត');
    expect(root.textContent).toContain('ស្វែងរកជំនួយ');
    expect(root.textContent).toContain('នេះជាការពិនិត្យបឋមសម្រាប់ព័ត៌មានអប់រំ');

    i18n.setLanguage('en');
    fixture.detectChanges();
    expect(root.textContent).toContain("Your Child's Check-In Result");
    expect(root.textContent).toContain('30%');
    expect(root.textContent).toContain('Download Result');
    expect(root.textContent).toContain(
      'This is an educational check-in, not an autism diagnosis or probability estimate.',
    );
    expect(fixture.componentInstance.answers()).toHaveLength(10);
    expect(fixture.componentInstance.result()?.percentage).toBe(30);
  });

  it('shows a Khmer descriptive result for all unknown answers and switches it back to English', () => {
    i18n.setLanguage('km');
    const fixture = TestBed.createComponent(FreeCheckinComponent);
    fixture.detectChanges();
    fixture.componentInstance.answers.set(
      Array.from({ length: 10 }, () => 'Not sure / Not observed' as const),
    );
    fixture.componentInstance.analyze();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.score-gauge')).toBeNull();
    expect(root.textContent).toContain('លទ្ធផលជាពាក្យពិពណ៌នា');
    expect(root.textContent).toContain('មិនមានចម្លើយគ្រប់គ្រាន់សម្រាប់បង្ហាញជាភាគរយទេ');

    i18n.setLanguage('en');
    fixture.detectChanges();
    expect(root.textContent).toContain('Descriptive result');
    expect(root.textContent).toContain(
      'there are not enough scored responses to show a percentage',
    );
    expect(fixture.componentInstance.result()?.notSureResponses).toBe(10);
  });
});
