/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ServiceResult } from './ServiceResult';
export type EligibilityDto = {
    crn: string;
    cas1: ServiceResult;
    cas2Hdc?: ServiceResult;
    cas2PrisonBail?: ServiceResult;
    cas2CourtBail?: ServiceResult;
    cas3?: ServiceResult;
    caseActions: Array<string>;
    caseStatus: 'NO_ACTION_NEEDED' | 'ACTION_UPCOMING' | 'ACTION_NEEDED';
};

