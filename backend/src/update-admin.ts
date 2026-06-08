import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config/env';
import { User } from './models/User';

async function updateAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Fel: ADMIN_EMAIL och ADMIN_PASSWORD måste finnas i .env');
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri);
  console.log('Ansluten till MongoDB');

  const hashedPassword = await bcrypt.hash(password, 12);

  // Hitta användaren med den nya e-posten (oavsett roll)
  const targetUser = await User.findOne({ email });

  if (targetUser) {
    await User.updateOne(
      { _id: targetUser._id },
      { $set: { role: 'admin', password: hashedPassword } }
    );
    // Ta bort eventuell annan admin
    await User.deleteMany({ role: 'admin', _id: { $ne: targetUser._id } });
  } else {
    // Ingen användare med den e-posten — uppdatera befintlig admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      console.error('Fel: Ingen admin-användare hittades. Kör "npm run seed" först.');
      await mongoose.disconnect();
      process.exit(1);
    }
    await User.updateOne(
      { _id: existingAdmin._id },
      { $set: { email, password: hashedPassword } }
    );
  }

  console.log('✓ Admin-uppgifter uppdaterade!');
  console.log(`  E-post:   ${email}`);
  console.log(`  Lösenord: (krypterat i databasen)`);

  await mongoose.disconnect();
}

updateAdmin().catch((err) => {
  console.error('Skriptet misslyckades:', err);
  process.exit(1);
});
