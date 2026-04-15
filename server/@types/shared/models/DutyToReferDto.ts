/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DtrSubmissionDto } from './DtrSubmissionDto';
export type DutyToReferDto = {
    caseId: string;
    crn: string;
    status: 'NOT_STARTED' | 'SUBMITTED' | 'ACCEPTED' | 'NOT_ACCEPTED';
    submission?: (DtrSubmissionDto | null);
};

