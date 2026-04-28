/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DutyToReferDto } from './DutyToReferDto';
import type { ServiceResult } from './ServiceResult';
export type EligibilityDto = {
    crn: string;
    cas1: ServiceResult;
    cas3: ServiceResult;
    dtr: ServiceResult;
    caseActions: Array<string>;
    dutyToRefer?: (DutyToReferDto | null);
};

