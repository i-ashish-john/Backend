import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin';
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin'], default: 'admin' },
});

// Hash password before saving
AdminSchema.pre('save', async function (next) {
  const admin = this as unknown as IAdmin;
  
  if (!admin.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(admin.password, salt) ;
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error as Error);
  }
});

// Method to compare passwords
AdminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  const admin = this as IAdmin;
  return bcrypt.compare(candidatePassword, admin.password);
};

const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);

// Seed default admin on startup with error handling
const seedDefaultAdmin = async () => {
  try {
    const defaultEmail = 'admin@healsync.com';
    const defaultPassword = 'admin123';

    // Check if an admin user already exists
    const existingAdmin = await Admin.findOne({ email: defaultEmail });

    if (!existingAdmin) {
      const defaultAdmin = new Admin({
        name: 'Admin User',
        email: defaultEmail,
        password: defaultPassword, // Will be hashed by pre-save hook
        role: 'admin',
      });

      await defaultAdmin.save();

      console.log(`Default admin created: ${defaultEmail} / ${defaultPassword}`);
    } else {
      // Admin exists, check if password matches the default
      const isPasswordMatch = await existingAdmin.comparePassword(defaultPassword);
      if (!isPasswordMatch) {
        // Update the password if it doesn't match
        existingAdmin.password = defaultPassword; // Will be hashed by pre-save hook
        await existingAdmin.save();
        console.log(`Updated password for existing admin: ${defaultEmail} / ${defaultPassword}`);
      } else {
        console.log(`Admin already exists with correct credentials: ${defaultEmail}`);
      }
    }
  } catch (error) {
    console.error('Error seeding default admin:', error);
  }
};

// Call the seeding function after connecting to the database
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected, running admin seeding...');
  seedDefaultAdmin();
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

export default Admin;





// const defaultEmail = 'admin@healsync.com';
//     const defaultPassword = 'admin123';
