/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FieldChange } from './FieldChange';
export type AuditRecordDto = {
    type: 'CREATE' | 'UPDATE' | 'NOTE';
    author: string;
    commitDate: string;
    changes: Array<FieldChange>;
};

