import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const registerSchema = z.object({
  nama_lengkap: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  konfirmasi_password: z.string(),
}).refine((data) => data.password === data.konfirmasi_password, {
  message: 'Konfirmasi password tidak cocok',
  path: ['konfirmasi_password'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  konfirmasi_password: z.string(),
}).refine((data) => data.password === data.konfirmasi_password, {
  message: 'Konfirmasi password tidak cocok',
  path: ['konfirmasi_password'],
});

export const profileSchema = z.object({
  nama_lengkap: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  mata_uang: z.string().default('IDR'),
  bahasa: z.string().default('id'),
});

export const pinSchema = z.object({
  pin: z.string().length(6, 'PIN harus 6 digit'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PinInput = z.infer<typeof pinSchema>;
