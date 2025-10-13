export type UUID = string;

export type Role = 'ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER';

export interface TenantSettings {
  currency?: string;
  timezone?: string;
}
