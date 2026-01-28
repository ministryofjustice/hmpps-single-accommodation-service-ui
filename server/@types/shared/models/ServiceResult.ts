/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RuleAction } from './RuleAction';
export type ServiceResult = {
    serviceStatus: 'NOT_ELIGIBLE' | 'UPCOMING' | 'NOT_STARTED' | 'REJECTED' | 'WITHDRAWN' | 'SUBMITTED' | 'CONFIRMED';
    suitableApplicationId?: string;
    action?: RuleAction;
};

