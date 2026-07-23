/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssignedToDto } from './AssignedToDto'
import type { FieldChange } from './FieldChange'
export type AuditRecordDto = {
  type: 'CREATE' | 'UPDATE' | 'NOTE'
  /**
   * author will be removed in the future - use authorDetails
   * @deprecated
   */
  author: string
  authorDetails?: AssignedToDto | null
  commitDate?: string | null
  changes: Array<FieldChange>
  extraInformation?: any | null
}
