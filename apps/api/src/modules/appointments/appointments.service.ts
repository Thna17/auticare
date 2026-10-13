import type {
  CreateAppointmentRequest,
  DoctorAvailabilityQuery,
  DoctorAvailabilityResponse,
  DoctorSlot,
  ListAppointmentsQuery,
  RescheduleAppointmentRequest,
  UserRole,
} from '@auticare/contracts';
import { AppError, forbidden, notFound } from '../../common/errors/app-error.js';
import { AppointmentsRepository } from './appointments.repository.js';
import type { AppointmentWithRelations } from './appointments.repository.js';
import { toPaginationMeta, toSkipTake } from '../../common/http/pagination.js';

type Actor = { parentId: string; role: UserRole };

const map = (item: AppointmentWithRelations) => ({
  id: item.id,
  parentId: item.parentId,
  childId: item.childId,
  childName: item.child?.firstName ?? null,
  hospitalId: item.hospitalId,
  hospitalName: item.hospital.name,
  doctorId: item.doctorId,
  doctorName: item.doctor?.fullName ?? null,
  scheduledAt: item.scheduledAt.toISOString(),
  status: item.status,
  reason: item.reason,
  rejectionReason: item.rejectionReason,
  parentName: item.parent ? `${item.parent.firstName} ${item.parent.lastName}`.trim() : null,
  parentEmail: item.parent?.email ?? null,
  parentPhoneNumber: item.parent?.phoneNumber ?? null,
  childDateOfBirth: item.child?.dateOfBirth
    ? item.child.dateOfBirth.toISOString().slice(0, 10)
    : null,
  childNotes: item.child?.notes ?? null,
});

export class AppointmentsService {
  constructor(private readonly repository = new AppointmentsRepository()) {}

  async listDoctors(actor: Actor, hospitalId: string) {
    if (actor.role !== 'PARENT') throw forbidden();
    return (await this.repository.listDoctors(hospitalId)).map((d) => ({
      id: d.id,
      hospitalId: d.hospitalId,
      fullName: d.fullName,
      specialty: d.specialty,
      bio: d.bio,
      availableDays: d.availableDays,
      startHour: d.startHour,
      endHour: d.endHour,
      slotDurationMinutes: d.slotDurationMinutes,
      timezone: d.timezone,
    }));
  }

  async getDoctorSlots(
    actor: Actor,
    doctorId: string,
    query: DoctorAvailabilityQuery,
  ): Promise<DoctorAvailabilityResponse> {
    if (actor.role !== 'PARENT' && actor.role !== 'HOSPITAL' && actor.role !== 'ADMIN') {
      throw forbidden();
    }
    const doctor = await this.repository.findDoctor(doctorId);
    if (!doctor) throw notFound('Doctor was not found.');

    const timezone = query.timezone || doctor.timezone || 'Asia/Phnom_Penh';
    const dateStr = query.date; // YYYY-MM-DD

    // Parse date in doctor's/requested timezone
    // e.g. for Asia/Phnom_Penh (UTC+7), dateStr is 2026-10-15
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) {
      throw new AppError('VALIDATION_ERROR', 'Invalid date format.', 400);
    }

    // Determine day of week in timezone (0=Sun, 1=Mon, ..., 6=Sat)
    // Create an anchor at midday UTC to reliably inspect the date's weekday
    const dayOfWeek = getDayOfWeekForTimezone(year, month, day, timezone);
    const availableDaysList = doctor.availableDays.split(',').map((s) => Number(s.trim()));

    // Time boundaries for the requested day in that timezone
    const dayStartUtc = zonedDateTimeToUtc(year, month, day, 0, 0, timezone);
    const dayEndUtc = zonedDateTimeToUtc(year, month, day, 23, 59, timezone);

    // Fetch existing active appointments for that doctor on that day
    const bookedAppointments = await this.repository.findAppointmentsForDoctorBetween(
      doctorId,
      dayStartUtc,
      dayEndUtc,
    );
    const bookedTimestamps = new Set(bookedAppointments.map((a) => a.scheduledAt.getTime()));

    const isWorkingDay = availableDaysList.includes(dayOfWeek);
    const slots: DoctorSlot[] = [];

    if (isWorkingDay) {
      const slotDuration = doctor.slotDurationMinutes || 30;
      const startHour = doctor.startHour;
      const endHour = doctor.endHour;
      const nowTime = Date.now();

      for (let hour = startHour; hour < endHour; hour++) {
        for (let min = 0; min < 60; min += slotDuration) {
          if (hour === endHour - 1 && min + slotDuration > 60) {
            // Last slot cannot exceed endHour
          }
          const slotUtc = zonedDateTimeToUtc(year, month, day, hour, min, timezone);
          const isPast = slotUtc.getTime() <= nowTime;
          const isBooked = bookedTimestamps.has(slotUtc.getTime());

          const timeLabel = formatTimeLabel(hour, min);
          slots.push({
            time: timeLabel,
            iso: slotUtc.toISOString(),
            available: !isPast && !isBooked,
          });
        }
      }
    }

    return {
      doctorId: doctor.id,
      date: dateStr,
      timezone,
      slots,
    };
  }

  async create(actor: Actor, input: CreateAppointmentRequest) {
    if (actor.role !== 'PARENT') throw forbidden();
    const child = await this.repository.findChild(input.childId);
    if (!child || child.parentId !== actor.parentId || child.archivedAt) throw forbidden();
    const doctor = await this.repository.findDoctor(input.doctorId);
    if (!doctor || doctor.hospitalId !== input.hospitalId)
      throw new AppError(
        'VALIDATION_ERROR',
        'The selected doctor does not belong to this hospital.',
        400,
      );
    const scheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date())
      throw new AppError('VALIDATION_ERROR', 'Appointments must be scheduled in the future.', 400);

    // Validate that the slot aligns with the doctor's working schedule
    this.validateDoctorSchedule(doctor, scheduledAt);

    let created;
    try {
      created = await this.repository.createWithCollisionCheck({
        parentId: actor.parentId,
        childId: child.id,
        hospitalId: input.hospitalId,
        doctorId: doctor.id,
        scheduledAt,
        reason: input.reason?.trim() || null,
      });
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err.code === 'P2034' || err.code === 'P2002')
      ) {
        throw new AppError(
          'CONFLICT',
          'The selected appointment slot is no longer available.',
          409,
        );
      }
      throw err;
    }

    if (!created) {
      throw new AppError('CONFLICT', 'The selected appointment slot is no longer available.', 409);
    }

    return map(created);
  }

  async reschedule(actor: Actor, id: string, input: RescheduleAppointmentRequest) {
    if (actor.role !== 'PARENT') throw forbidden();
    const appointment = await this.repository.findForParent(id, actor.parentId);
    if (!appointment) throw notFound('Appointment was not found.');

    const newScheduledAt = new Date(input.scheduledAt);
    if (Number.isNaN(newScheduledAt.getTime()) || newScheduledAt <= new Date()) {
      throw new AppError('VALIDATION_ERROR', 'Appointments must be scheduled in the future.', 400);
    }

    if (appointment.doctorId) {
      const doctor = await this.repository.findDoctor(appointment.doctorId);
      if (doctor) {
        this.validateDoctorSchedule(doctor, newScheduledAt);
      }
    }

    let result;
    try {
      result = await this.repository.rescheduleWithCollisionCheck(
        id,
        newScheduledAt,
        input.reason !== undefined ? input.reason.trim() || null : undefined,
      );
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err.code === 'P2034' || err.code === 'P2002')
      ) {
        throw new AppError(
          'CONFLICT',
          'The selected appointment slot is no longer available.',
          409,
        );
      }
      throw err;
    }

    if (result.notFound) throw notFound('Appointment was not found.');
    if (result.invalidStatus) {
      throw new AppError('VALIDATION_ERROR', 'This appointment can no longer be rescheduled.', 400);
    }
    if (result.collision) {
      throw new AppError('CONFLICT', 'The selected appointment slot is no longer available.', 409);
    }

    return map(result.appointment!);
  }

  async list(actor: Actor, query: ListAppointmentsQuery) {
    if (actor.role !== 'PARENT' && actor.role !== 'ADMIN') throw forbidden();
    const skipTake = toSkipTake(query);
    const filters = {
      ...(query.childId !== undefined ? { childId: query.childId } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    };
    const { items, total } =
      actor.role === 'ADMIN'
        ? await this.repository.listAll(skipTake, filters)
        : await this.repository.listForParent(actor.parentId, skipTake, filters);
    return { appointments: items.map(map), pagination: toPaginationMeta(query, total) };
  }

  async cancel(actor: Actor, id: string) {
    if (actor.role !== 'PARENT') throw forbidden();
    const appointment = await this.repository.findForParent(id, actor.parentId);
    if (!appointment) throw notFound('Appointment was not found.');
    if (!['REQUESTED', 'CONFIRMED'].includes(appointment.status))
      throw new AppError('VALIDATION_ERROR', 'This appointment can no longer be cancelled.', 400);
    return map(await this.repository.updateStatus(id, 'CANCELLED'));
  }

  private validateDoctorSchedule(
    doctor: {
      availableDays: string;
      startHour: number;
      endHour: number;
      timezone: string;
    },
    scheduledAt: Date,
  ) {
    const tz = doctor.timezone || 'Asia/Phnom_Penh';
    const dateParts = getDateTimePartsInTimezone(scheduledAt, tz);
    const availableDaysList = doctor.availableDays.split(',').map((s) => Number(s.trim()));

    if (!availableDaysList.includes(dateParts.dayOfWeek)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'The doctor is not available on this day of the week.',
        400,
      );
    }

    if (dateParts.hour < doctor.startHour || dateParts.hour >= doctor.endHour) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Appointments must be scheduled during doctor hours (${doctor.startHour}:00 - ${doctor.endHour}:00).`,
        400,
      );
    }
  }
}

/** Formats hour and minute into "09:00 AM" */
function formatTimeLabel(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const padH = String(hour12).padStart(2, '0');
  const padM = String(minute).padStart(2, '0');
  return `${padH}:${padM} ${period}`;
}

/** Get integer day of week (0=Sun, 1=Mon, ..., 6=Sat) for given year-month-day in timezone */
function getDayOfWeekForTimezone(
  year: number,
  month: number,
  day: number,
  timezone: string,
): number {
  const d = zonedDateTimeToUtc(year, month, day, 12, 0, timezone);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });
  const weekdayStr = formatter.format(d);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekdayStr] ?? 0;
}

/** Break down a UTC Date into its year, month, day, hour, minute, dayOfWeek in target timezone */
function getDateTimePartsInTimezone(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);
  let hour = 0;
  let minute = 0;
  let weekdayStr = 'Mon';

  for (const part of parts) {
    if (part.type === 'hour') hour = Number(part.value);
    if (part.type === 'minute') minute = Number(part.value);
    if (part.type === 'weekday') weekdayStr = part.value;
  }

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    hour,
    minute,
    dayOfWeek: map[weekdayStr] ?? 0,
  };
}

/** Given local date/time parts in a specific IANA timezone, returns corresponding UTC Date */
function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string,
): Date {
  // Create an ISO string assuming UTC first
  const pad = (n: number) => String(n).padStart(2, '0');
  const targetIso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00.000Z`;
  const initialUtc = new Date(targetIso);

  // Compute timezone offset at this timestamp
  // We can format initialUtc in the target timezone to find the offset difference
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(initialUtc);
  const partMap: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      partMap[p.type] = Number(p.value);
    }
  }

  // Target local time minus time observed in timezone
  const asTzUtc = Date.UTC(
    partMap['year'] ?? year,
    (partMap['month'] ?? month) - 1,
    partMap['day'] ?? day,
    partMap['hour'] ?? hour,
    partMap['minute'] ?? minute,
    0,
  );

  const diffMs = initialUtc.getTime() - asTzUtc;
  return new Date(initialUtc.getTime() + diffMs);
}
