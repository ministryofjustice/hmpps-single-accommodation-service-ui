/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignedToDto } from './AssignedToDto';
import type { CurrentAccommodationDto } from './CurrentAccommodationDto';
import type { NextAccommodationDto } from './NextAccommodationDto';
export type CaseDto = {
    name: string;
    dateOfBirth?: string;
    crn?: string;
    prisonNumber?: string;
    tier?: string;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    pncReference?: string;
    assignedTo?: AssignedToDto;
    currentAccommodation?: CurrentAccommodationDto;
    nextAccommodation?: NextAccommodationDto;
};

