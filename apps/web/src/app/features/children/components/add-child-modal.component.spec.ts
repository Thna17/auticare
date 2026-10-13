import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AddChildModalComponent } from './add-child-modal.component';
import { I18nService } from '../../../core/i18n/i18n.service';
import { API_BASE_URL } from '../../../core/config/api.config';
import { beforeEach, describe, expect, it } from 'vitest';

describe('AddChildModalComponent', () => {
  let fixture: ComponentFixture<AddChildModalComponent>;
  let component: AddChildModalComponent;
  let i18n: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AddChildModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });

    i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');

    fixture = TestBed.createComponent(AddChildModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  it('renders all required modal fields in English: First Name, Last Name, Date of Birth, Gender, Medical Notes, Cancel, Save Child', () => {
    expect(component).toBeTruthy();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('First Name');
    expect(el.textContent).toContain('Last Name');
    expect(el.textContent).toContain('Date of Birth');
    expect(el.textContent).toContain('Gender');
    expect(el.textContent).toContain('Medical Notes');
    expect(el.textContent).toContain('Cancel');
    expect(el.textContent).toContain('Save Child');
  });

  it('renders all modal fields with authentic Khmer translations in km mode without English parentheticals', () => {
    i18n.setLanguage('km');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('នាមខ្លួន');
    expect(el.textContent).toContain('គោត្តនាម');
    expect(el.textContent).toContain('ថ្ងៃខែឆ្នាំកំណើត');
    expect(el.textContent).toContain('ភេទ');
    expect(el.textContent).toContain('កំណត់ត្រាវេជ្ជសាស្ត្រ');
    expect(el.textContent).toContain('បោះបង់');
    expect(el.textContent).toContain('រក្សាទុកទិន្នន័យកុមារ');

    // Ensure zero English parentheticals
    expect(el.textContent).not.toContain('(First Name)');
    expect(el.textContent).not.toContain('(Last Name)');
    expect(el.textContent).not.toContain('(Save Child)');
  });
});
