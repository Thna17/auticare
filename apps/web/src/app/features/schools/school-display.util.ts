import type { SchoolAvailabilityStatus } from '@auticare/contracts';

/** Human label for an availability status. */
export const availabilityLabel = (
  status: SchoolAvailabilityStatus,
  lang: 'km' | 'en' = 'en',
): string => {
  if (lang === 'km') {
    switch (status) {
      case 'IMMEDIATE':
        return 'ចូលរៀនបានភ្លាមៗ';
      case 'WAITLIST':
        return 'បញ្ជីរង់ចាំ';
      case 'CLOSED':
        return 'បិទការទទួល';
    }
  }
  switch (status) {
    case 'IMMEDIATE':
      return 'Immediate';
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
