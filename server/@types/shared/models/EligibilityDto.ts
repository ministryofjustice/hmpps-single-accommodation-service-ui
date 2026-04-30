/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Cas1ServiceResult } from './Cas1ServiceResult';
import type { Cas3ServiceResult } from './Cas3ServiceResult';
import type { DtrServiceResult } from './DtrServiceResult';
export type EligibilityDto = {
    crn: string;
    cas1: Cas1ServiceResult;
    cas3: Cas3ServiceResult;
    dtr: DtrServiceResult;
    caseActions: Array<string>;
};

