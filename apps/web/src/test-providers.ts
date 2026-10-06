import { provideZonelessChangeDetection } from '@angular/core';

/**
 * Providers every TestBed in this project starts with.
 *
 * Zoneless, because app.config.ts is: a TestBed running with zones would be
 * exercising a different change-detection runtime from the one that ships.
 */
export default [provideZonelessChangeDetection()];
