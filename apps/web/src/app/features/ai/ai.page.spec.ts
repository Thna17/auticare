/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AiPage } from './ai.page';
import { ChildrenApi } from '../children/data-access/children.api';
import { AiApi } from './data-access/ai.api';
import { I18nService } from '../../core/i18n/i18n.service';
import type {
  AiConversationDetailResponse,
  AiMessageResponse,
  AiStatusResponse,
  ChildResponse,
} from '@auticare/contracts';

describe('AiPage', () => {
  let fixture: ComponentFixture<AiPage>;
  let component: AiPage;

  const mockChild: ChildResponse = {
    id: 'child-1',
    firstName: 'Sophea',
    lastName: 'Chan',
    dateOfBirth: '2020-05-15',
    notes: null,
    archivedAt: null,
    questionnaireStatus: 'COMPLETED',
  };

  const mockStatus: AiStatusResponse = {
    configured: true,
    model: 'gemini-1.5-pro',
    dailyLimit: 20,
    usedToday: 3,
  };

  const mockAssistantMessage: AiMessageResponse = {
    id: 'msg-2',
    conversationId: 'conv-1',
    role: 'ASSISTANT',
    kind: 'ANSWER',
    content: 'Sensory breaks with calm music can help your child relax.',
    model: 'gemini-1.5-pro',
    sources: [],
    savedAt: null,
    feedback: null,
    relatedActivities: [
      {
        id: 'act-1',
        title: 'Calm Breathing Exercises',
        category: 'EMOTIONAL',
        description: 'Simple guided deep breaths with hand gestures.',
      },
    ],
    createdAt: new Date().toISOString(),
  };

  const mockConversation: AiConversationDetailResponse = {
    id: 'conv-1',
    childId: 'child-1',
    title: 'Bedtime and Sensory Routines',
    language: 'en',
    messageCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'USER',
        kind: 'ANSWER',
        content: 'How can I help with bedtime meltdowns?',
        model: null,
        sources: [],
        createdAt: new Date().toISOString(),
      },
      mockAssistantMessage,
    ],
  };

  const mockChildrenApi = {
    listChildren: vi.fn().mockReturnValue(of([mockChild])),
  };

  const mockAiApi = {
    status: vi.fn().mockReturnValue(of(mockStatus)),
    listConversations: vi.fn().mockReturnValue(of([mockConversation])),
    getConversation: vi.fn().mockReturnValue(of(mockConversation)),
    listSaved: vi.fn().mockReturnValue(of([])),
    toggleSave: vi
      .fn()
      .mockReturnValue(of({ ...mockAssistantMessage, savedAt: new Date().toISOString() })),
    sendFeedback: vi.fn().mockReturnValue(of({ ...mockAssistantMessage, feedback: 'HELPFUL' })),
    sendMessage: vi.fn(),
    createConversation: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiPage],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ChildrenApi, useValue: mockChildrenApi },
        { provide: AiApi, useValue: mockAiApi },
        I18nService,
      ],
    }).compileComponents();

    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('en');

    fixture = TestBed.createComponent(AiPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders conversation and assistant response with related activities', () => {
    expect(mockAiApi.listConversations).toHaveBeenCalled();
    expect(mockAiApi.getConversation).toHaveBeenCalledWith('conv-1');

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Sensory breaks with calm music');
    expect(text).toContain('Calm Breathing Exercises');
    expect(text).toContain('Related activities');
  });

  it('toggles saving an assistant message', () => {
    (component as any).toggleSave(mockAssistantMessage);
    expect(mockAiApi.toggleSave).toHaveBeenCalledWith('msg-2');
  });

  it('submits helpful feedback for an assistant message', () => {
    (component as any).sendFeedback(mockAssistantMessage, 'HELPFUL');
    expect(mockAiApi.sendFeedback).toHaveBeenCalledWith('msg-2', 'HELPFUL');
  });

  it('switches to saved answers tab', () => {
    (component as any).setTab('saved');
    fixture.detectChanges();

    expect((component as any).activeTab()).toBe('saved');
    expect(mockAiApi.listSaved).toHaveBeenCalled();
  });

  it('toggles child context inclusion', () => {
    expect((component as any).includeChildContext()).toBe(false);
    (component as any).includeChildContext.set(true);
    expect((component as any).includeChildContext()).toBe(true);
  });
});
