/**
 * Staff domain exports
 * @module domains/staff
 */

// Repository
export { StaffRepository, staffRepository } from './repository';
export type { StaffRow, StaffListOptions } from './repository';

// Service
export { StaffService, staffService, VALID_ROLES, isValidRole } from './service';
export type { CreateStaffInput, UpdateStaffInput, StaffRole } from './service';

// Resolvers
export { staffResolvers } from './resolvers';
