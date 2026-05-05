// Quick-start service templates seeded by clinic type.
export type ServiceTemplate = {
  name: string;
  category: string;
  price: number;
  duration_min: number;
  description?: string;
};

export const DENTAL_SERVICES: ServiceTemplate[] = [
  { name: "Dental Consultation", category: "Consultation", price: 30, duration_min: 20, description: "Initial assessment and oral exam." },
  { name: "Teeth Cleaning (Scaling & Polish)", category: "Hygiene", price: 50, duration_min: 30 },
  { name: "Tooth Filling (Composite)", category: "Restorative", price: 80, duration_min: 45 },
  { name: "Tooth Extraction", category: "Surgery", price: 70, duration_min: 30 },
  { name: "Root Canal Treatment", category: "Endodontics", price: 220, duration_min: 90 },
  { name: "Teeth Whitening", category: "Cosmetic", price: 180, duration_min: 60 },
  { name: "Dental Crown", category: "Prosthetics", price: 350, duration_min: 60 },
  { name: "Braces Consultation", category: "Orthodontics", price: 40, duration_min: 30 },
  { name: "X-Ray (OPG)", category: "Diagnostics", price: 25, duration_min: 15 },
];

export const GENERAL_SERVICES: ServiceTemplate[] = [
  { name: "General Consultation", category: "Consultation", price: 25, duration_min: 20, description: "Visit with a general physician." },
  { name: "Follow-up Visit", category: "Consultation", price: 15, duration_min: 15 },
  { name: "Vaccination", category: "Preventive", price: 35, duration_min: 15 },
  { name: "Blood Pressure Check", category: "Diagnostics", price: 10, duration_min: 10 },
  { name: "Diabetes Screening", category: "Diagnostics", price: 30, duration_min: 20 },
  { name: "ECG", category: "Diagnostics", price: 40, duration_min: 20 },
  { name: "Wound Dressing", category: "Procedures", price: 20, duration_min: 15 },
  { name: "Health Check-up Package", category: "Wellness", price: 120, duration_min: 60 },
];

export function templatesFor(type?: "dental" | "general" | "multi" | string | null): ServiceTemplate[] {
  if (type === "dental") return DENTAL_SERVICES;
  if (type === "multi") return [...DENTAL_SERVICES, ...GENERAL_SERVICES];
  return GENERAL_SERVICES;
}
