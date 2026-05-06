import { z } from 'zod';

export const guestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.object({
    dialCode: z.string(),
    number: z.string(),
  }),
  guestType: z.enum(['adult', 'child']),
  age: z.union([z.number(), z.string()]).optional(),
  isPrimary: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.isPrimary) {
    if (!data.email) {
      ctx.addIssue({ code: 'custom', message: 'Primary guest email is required', path: ['email'] });
    }
    const phnNum = data.phone.dialCode + data.phone.number;
    if (phnNum[0] !== '+' || !+phnNum.slice(1)) {
      ctx.addIssue({ code: 'custom', message: 'Invalid phone number', path: ['phone'] });
    }
    if (data.guestType !== 'adult') {
      ctx.addIssue({ code: 'custom', message: 'Primary guest must be an adult', path: ['guestType'] });
    }
    if (!data.firstName) ctx.addIssue({ code: 'custom', message: 'Primary guest first name is required', path: ['firstName'] });
    if (!data.lastName) ctx.addIssue({ code: 'custom', message: 'Primary guest last name is required', path: ['lastName'] });
  } else {
    if (!data.firstName) ctx.addIssue({ code: 'custom', message: 'First name is required', path: ['firstName'] });
    if (!data.lastName) ctx.addIssue({ code: 'custom', message: 'Last name is required', path: ['lastName'] });
    if (!data.guestType) ctx.addIssue({ code: 'custom', message: 'Guest type is required', path: ['guestType'] });
    if (data.guestType !== 'adult' && !data.age) {
      ctx.addIssue({ code: 'custom', message: 'Age is required for child guest', path: ['age'] });
    }
  }
});

export default function validateGuestForm(data: any) {
  const { success, error, data: validData } = guestSchema.safeParse(data);
  const errors: Record<string, string> = {};
  let successFlag = success;
  if (!success) {
    successFlag = false;
    error.issues.forEach((issue) => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
  }
  return { success: successFlag, errors: Object.keys(errors).length ? errors : undefined, data: validData };
}