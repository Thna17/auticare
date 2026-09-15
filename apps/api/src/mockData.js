// src/app/mock-data.ts

export const mockHospitals = [
  {
    id: 1,
    name: 'AutiCare Central Hospital',
    location: 'Downtown',
    rating: 4.8,
    image: 'https://via.placeholder.com/150', // You can replace this with a real image link later
  },
  {
    id: 2,
    name: "St. Mary's Child Care Clinic",
    location: 'Westside',
    rating: 4.5,
    image: 'https://via.placeholder.com/150',
  },
  {
    id: 3,
    name: 'Sunshine Pediatric Center',
    location: 'North Hills',
    rating: 4.9,
    image: 'https://via.placeholder.com/150',
  },
];

export const mockAppointmentSlots = [
  '09:00 AM',
  '10:00 AM',
  '11:30 AM',
  '01:00 PM',
  '02:30 PM',
  '04:00 PM',
];

export const mockDoctors = [
  { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Pediatrician' },
  { id: 2, name: 'Dr. Michael Lee', specialty: 'Child Psychologist' },
];
