const { z } = require('zod');

const customerSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName:  z.string().min(1, 'Last name required'),
  email:     z.string().email('Invalid email'),
  phone: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().optional(),
  gender: z.enum(['Male','Female','Other']).optional(),
  age: z.coerce.number().nonnegative().int().optional(),   // <-- ADDED
  notes: z.string().optional()
});

module.exports = { customerSchema };
