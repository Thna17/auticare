import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  AssignTeachersRequest,
  ConnectionCode,
  CreateConnectionCodeRequest,
  CreatedConnectionCodeResponse,
  CreateTeacherRequest,
  SchoolStaffMember,
  TeacherCredentialsResponse,
} from '@auticare/contracts';
import { map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

export type AssignedTeachersResponse = {
  childId: string;
  teachers: { id: string; firstName: string; lastName: string; title: string | null }[];
};

/** The school admin's team: teacher accounts, assignment and family codes. */
@Injectable({ providedIn: 'root' })
export class SchoolTeamApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/schools`;

  listStaff() {
    return this.http
      .get<{ data: SchoolStaffMember[] }>(`${this.base}/staff`)
      .pipe(map((response) => response.data));
  }

  createTeacher(input: CreateTeacherRequest) {
    return this.http
      .post<{ data: TeacherCredentialsResponse }>(`${this.base}/staff`, input)
      .pipe(map((response) => response.data));
  }

  issueSetupCode(staffId: string) {
    return this.http
      .post<{ data: TeacherCredentialsResponse }>(`${this.base}/staff/${staffId}/setup-code`, {})
      .pipe(map((response) => response.data));
  }

  deactivate(staffId: string) {
    return this.http
      .post<{ data: SchoolStaffMember }>(`${this.base}/staff/${staffId}/deactivate`, {})
      .pipe(map((response) => response.data));
  }

  reactivate(staffId: string) {
    return this.http
      .post<{ data: SchoolStaffMember }>(`${this.base}/staff/${staffId}/reactivate`, {})
      .pipe(map((response) => response.data));
  }

  assignTeachers(childId: string, input: AssignTeachersRequest) {
    return this.http
      .put<{ data: AssignedTeachersResponse }>(
        `${this.base}/enrollments/${childId}/teachers`,
        input,
      )
      .pipe(map((response) => response.data));
  }

  listConnectionCodes() {
    return this.http
      .get<{ data: ConnectionCode[] }>(`${this.base}/connection-codes`)
      .pipe(map((response) => response.data));
  }

  createConnectionCode(input: CreateConnectionCodeRequest) {
    return this.http
      .post<{ data: CreatedConnectionCodeResponse }>(`${this.base}/connection-codes`, input)
      .pipe(map((response) => response.data));
  }

  revokeConnectionCode(codeId: string) {
    return this.http
      .delete<{ data: { revoked: true } }>(`${this.base}/connection-codes/${codeId}`)
      .pipe(map((response) => response.data));
  }
}
