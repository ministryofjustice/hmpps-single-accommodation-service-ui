/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ServiceResult } from './ServiceResult';
export type EligibilityDto = {
    crn: string;
    cas1: ServiceResult;
    caseStatus?: 'ACTION_NEEDED' | 'NO_ACTION_NEEDED';
    caseActions: Array<string>;
    cas2Hdc?: ServiceResult;
    cas2PrisonBail?: ServiceResult;
    cas2CourtBail?: ServiceResult;
    cas3?: ServiceResult;
};

