/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignedTo } from './AssignedTo';
import type { CurrentAccommodation } from './CurrentAccommodation';
import type { NextAccommodation } from './NextAccommodation';
export type Case = {
    name: string;
    dateOfBirth?: string;
    crn?: string;
    prisonNumber?: string;
    tier?: string;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    pncReference?: string;
    assignedTo?: AssignedTo;
    currentAccommodation?: CurrentAccommodation;
    nextAccommodation?: NextAccommodation;
};

