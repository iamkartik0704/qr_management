import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { Admin } from './features/qr/model/admin.model.js'; 
import { Counter } from './features/qr/model/counter.model.js'; 

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env') });

const seedDatabase = async () => {
  console.log("Looking for .env at:", path.join(process.cwd(), '.env'));
  
  try {
//connect db
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI is missing in .env");
    
    // console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const countersToSeed = ['ticket_sequence_81', 'ticket_sequence_82'];
    for (const key of countersToSeed) {
      const existingCounter = await Counter.findOne({ key });
      if (!existingCounter) {
        await Counter.create({ key, sequence: 0 });
        console.log(`Initialized ticket counter: ${key}`);
      } else {
        console.log(`Counter ${key} already exists. Skipping.`);
      }
    }

    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env");
    }

    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      console.log(`Hashing password and creating Admin: ${adminEmail}...`);
      const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
      
      await Admin.create({
        email: adminEmail,
        password: adminPasswordHash, //save the hash, not the raw password
        role: "ADMIN"
      });
      console.log("Admin user seeded successfully!");
    } else {
      console.log(`Admin with email ${adminEmail} already exists. Skipping.`);
    }


    const volunteerEmailsRaw = process.env.SEED_VOLUNTEER_EMAILS;
    const volunteerPassword = process.env.SEED_VOLUNTEER_PASSWORD;

    if (volunteerEmailsRaw && volunteerPassword) {
      // Split the comma-separated string into an array and trim spaces
      const volunteerEmails = volunteerEmailsRaw.split(',').map(email => email.trim());
      
      console.log(`Hashing password for ${volunteerEmails.length} volunteers...`);
      const volPasswordHash = await bcrypt.hash(volunteerPassword, 10);

      for (const email of volunteerEmails) {
        if (!email) continue; 
        
        const existingVolunteer = await Admin.findOne({ email });
        if (!existingVolunteer) {
          await Admin.create({
            email: email,
            password: volPasswordHash, // All volunteers get the same hashed base password
            role: "VOLUNTEER"
          });
          console.log(`Created Volunteer account: ${email}`);
        } else {
          console.log(`Volunteer ${email} already exists. Skipping.`);
        }
      }
    } else {
      console.log("Missing VOLUNTEER_EMAILS or VOLUNTEER_PASSWORD in .env. Skipping volunteer creation.");
    }

    console.log("Entire database seeded successfully!");
    process.exit(0);

  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};


seedDatabase();