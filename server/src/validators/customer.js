const { z } = require('zod');

const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

const customerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name required'),
  lastName:  z.string().trim().min(1, 'Last name required'),
  email:     z.string().trim().email('Invalid email format').refine(val => gmailRegex.test(val), {
    message: 'Email must be a gmail.com address',
  }),
  phone: z.string().trim().min(1, 'Phone number required'),
  dateOfBirth: z.coerce.date({ invalid_type_error: 'Date of birth required' }),
  nationality: z.string().trim().min(1, 'Nationality required'),
  gender: z.enum(['Male','Female','Other'], { required_error: 'Gender required' }),
  age: z.coerce.number().int().min(18, 'Age must be at least 18'),
  yearlyIncome: z.coerce.number().nonnegative('Yearly income must be positive'),
  currentAddress: z.string().trim().min(1, 'Current address required'),
  permanentAddress: z.string().trim().min(1, 'Permanent address required'),
  notes: z.string().optional()
});

module.exports = { customerSchema };
