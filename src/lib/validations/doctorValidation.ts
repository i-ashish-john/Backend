import { z } from 'zod';

export const doctorSignupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
 
});

export type DoctorSignupData = z.infer<typeof doctorSignupSchema>;