import type { SchoolAvailabilityStatus } from '@auticare/contracts';

/** Human label for an availability status. */
export const availabilityLabel = (status: SchoolAvailabilityStatus): string => {
  switch (status) {
    case 'IMMEDIATE':
      return 'Accepting now';
    case 'WAITLIST':
      return 'Waitlist';
    case 'CLOSED':
      return 'Closed';
  }
};

/** Tone class suffix (open/wait/closed) used to colour availability pills. */
export const availabilityTone = (status: SchoolAvailabilityStatus): 'open' | 'wait' | 'closed' => {
  switch (status) {
    case 'IMMEDIATE':
      return 'open';
    case 'WAITLIST':
      return 'wait';
    case 'CLOSED':
      return 'closed';
  }
};
