// ─── All shared types for the signup flow ────────────────────────────────────

export interface Step1Data {
  email: string;
  emailConfirm: string;
  password: string;
  passwordConfirm: string;
  accepted: boolean;
}

export interface SecurityAddons {
  privateEmail: boolean;
  twoFA: boolean;
}

export interface Step3Data {
  pressRelease100: any;
  sendToRecipients: boolean;
  pressRelease250: boolean;
  pressRelease500: boolean;
  pressRelease1000: boolean;
  pressCategory: string;
}

export interface Step4Data {
  extraStorageGB: number;
  checkInService: string;
  checkInTerm: string;
}

export interface PricingBreakdown {
  basePrice: number;
  storagePrice: number;
  pressPrice: number;
  twoFAPrice: number;
  privateEmailPrice: number;
  total: number;
}


// ─── All shared types for login + dashboard ───

// ── Login 
export interface LoginCredentials {
  username: string;
  password: string;
}

// ── Dashboard Tabs ──────

export type DashboardTab =
  | "check-in-email"
  | "check-in-schedule"
  | "trusted-recipients"
  | "email-to-recipients"
  | "press-release"
  | "documents-and-images"
  | "setup-accounting";

export interface TabConfig {
  id: DashboardTab;
  label: string; // newline-separated for 2-line labels
}

export const TABS: TabConfig[] = [
  { id: "check-in-email", label: "CHECK-IN\nEMAIL" },
  { id: "check-in-schedule", label: "CHECK-IN\nSCHEDULE" },
  { id: "trusted-recipients", label: "TRUSTED\nRECIPIENTS" },
  { id: "email-to-recipients", label: "EMAIL TO\nRECIPIENTS" },
  { id: "press-release", label: "PRESS\nRELEASE" },
  { id: "documents-and-images", label: "DOCUMENTS\nAND IMAGES" },
  { id: "setup-accounting", label: "SETUP &\nACCOUNTING" },
];

// ── Trusted Recipients ────────────────────────────────────────────────────────

export interface TrustedRecipient {
  id: string;
  firstName: string;
  email: string;
}

// ── Documents & Images ────────────────────────────────────────────────────────

export interface UploadedFile {
  id: string;
  name: string;
  sizeMB: string;
}

// ── Setup & Accounting ────────────────────────────────────────────────────────

export interface ActiveService {
  name: string;
  additionalInfo: string;
  activeUntil: string;
  isPurchased: boolean;
}

export interface BillingRecord {
  date: string;
  description: string;
  amount: string;
  isIncluded?: boolean;
}

export interface CheckInHistoryRecord {
  date: string;
  time: string;
  ip: string;
  loginName: string;
  deviceOS: string;
}

// ── New Orders sub-steps (inside Setup & Accounting → New Orders accordion) ──

export type NewOrderStep = "addons" | "press-release" | "payment";

export interface NewOrderAddons {
  privateEmail: boolean;
  twoFA: boolean;
}

export interface NewOrderPressRelease {
  sendToRecipients: boolean;
  press250: boolean;
  press500: boolean;
  press1000: boolean;
  category: string;
}

export interface NewOrderPayment {
  extraStorageGB: number;
  checkInService: string;
  checkInTerm: string;
}

// Convenience union for the current step number
export type StepNumber = 1 | 2 | 3 | 4;