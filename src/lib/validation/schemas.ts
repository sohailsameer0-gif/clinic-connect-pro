import { z } from "zod";

export const emailSchema = z.string().trim().email("Invalid email address").max(255);
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long");

export const nameSchema = z.string().trim().min(2, "Required").max(80);
export const phoneSchema = z.string().trim().min(5, "Required").max(30);

export const signupSchema = z
  .object({
    fullName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    role: z.enum(["patient", "clinic"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Required"),
});

export const forgotSchema = z.object({ email: emailSchema });
export const resetSchema = z
  .object({ password: passwordSchema, confirm: passwordSchema })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

export const profileSchema = z.object({
  fullName: nameSchema,
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
});

export const clinicSchema = z.object({
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(160).optional().or(z.literal("")),
  about: z.string().trim().max(2000).optional().or(z.literal("")),
  address: z.string().trim().max(240).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
  emergency_available: z.boolean().optional(),
});

export const doctorSchema = z.object({
  name: nameSchema,
  specialty: z.string().trim().min(2).max(80),
  qualification: z.string().trim().max(120).optional().or(z.literal("")),
  experience_years: z.coerce.number().int().min(0).max(80),
  fee: z.coerce.number().min(0).max(1_000_000),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  bio: z.string().max(1000).optional().or(z.literal("")),
  image_url: z.string().url().optional().or(z.literal("")),
  active: z.boolean().optional(),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(1).max(80),
  description: z.string().max(800).optional().or(z.literal("")),
  price: z.coerce.number().min(0),
  duration_min: z.coerce.number().int().min(5).max(480),
});

export const scheduleSchema = z.object({
  doctor_id: z.string().uuid(),
  weekday: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}/),
  end_time: z.string().regex(/^\d{2}:\d{2}/),
  slot_minutes: z.coerce.number().int().min(5).max(240),
  max_per_slot: z.coerce.number().int().min(1).max(20),
  buffer_min: z.coerce.number().int().min(0).max(120),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().or(z.literal("")),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ClinicInput = z.infer<typeof clinicSchema>;
export type DoctorInput = z.infer<typeof doctorSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
