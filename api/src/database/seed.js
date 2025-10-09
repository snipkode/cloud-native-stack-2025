import { User, Deployment, Transaction, Plan } from '../models/index.js';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';
import { seedRBAC } from './rbac/seed-rbac.js';

async function seed() {
  try {
    console.log('Starting database seeding...');

    await sequelize.sync({ force: true }); // Force sync to recreate tables

    // Create plans first
    const freePlan = await Plan.create({
      name: 'Free',
      price: 0,
      maxApps: 1,
      maxRAM: 256, // in MB
      maxCPU: 1, // number of vCPUs
      maxStorage: 1, // in GB
      maxTeamMembers: 1,
      description: 'Free plan with basic features',
      isActive: true,
      features: ['Basic support', '1 Application', '256MB RAM', '1GB Storage']
    });

    const basicPlan = await Plan.create({
      name: 'Basic',
      price: 149000, // ~$9.99 * 15000
      maxApps: 3,
      maxRAM: 1024, // in MB
      maxCPU: 1, // number of vCPUs
      maxStorage: 5, // in GB
      maxTeamMembers: 2,
      description: 'Basic plan with more resources',
      isActive: true,
      features: ['Email support', '3 Applications', '1GB RAM per app', '5GB Storage', 'Up to 2 team members']
    });

    const proPlan = await Plan.create({
      name: 'Pro',
      price: 449000, // ~$29.99 * 15000
      maxApps: 10,
      maxRAM: 2048, // in MB
      maxCPU: 2, // number of vCPUs
      maxStorage: 20, // in GB
      maxTeamMembers: 5,
      description: 'Professional plan with high resources',
      isActive: true,
      features: ['Priority support', '10 Applications', '2GB RAM per app', '20GB Storage', 'Up to 5 team members', 'Custom domains']
    });

    const enterprisePlan = await Plan.create({
      name: 'Enterprise',
      price: 1499000, // ~$99.99 * 15000
      maxApps: 50,
      maxRAM: 8192, // in MB
      maxCPU: 4, // number of vCPUs
      maxStorage: 100, // in GB
      maxTeamMembers: 20,
      description: 'Enterprise plan with maximum resources',
      isActive: true,
      features: ['24/7 dedicated support', 'Unlimited Applications', '8GB RAM per app', '100GB Storage', 'Up to 20 team members', 'Custom domains', 'SLA guarantee']
    });

    console.log('Plans created successfully');

    // Create users with encrypted passwords using model creation (which triggers hooks)
    const adminUser = await User.create({
      email: 'admin@example.com',
      password: 'password123',
      name: 'Admin User',
      credits: 1000,
      status: 'online',
      role: 'admin',
      planId: proPlan.id // Assign Pro plan to admin
    });

    const regularUser = await User.create({
      email: 'user@example.com',
      password: 'password123',
      name: 'Regular User',
      credits: 500,
      status: 'offline',
      role: 'user',
      planId: basicPlan.id // Assign Basic plan to regular user
    });

    await Deployment.bulkCreate([
      {
        userId: adminUser.id,
        name: 'my-app',
        repositoryUrl: 'https://github.com/example/my-app',
        branch: 'main',
        status: 'deployed',
        appUrl: 'https://my-app.example.com',
        dokkuAppName: 'my-app-prod',
        cost: 10,
      },
      {
        userId: regularUser.id,
        name: 'test-app',
        repositoryUrl: 'https://github.com/example/test-app',
        branch: 'develop',
        status: 'pending',
        cost: 5,
      },
    ]);

    await Transaction.bulkCreate([
      {
        userId: adminUser.id,
        type: 'topup',
        amount: 1000,
        status: 'completed',
        paymentMethod: 'midtrans',
        description: 'Initial credit topup',
      },
      {
        userId: regularUser.id,
        type: 'topup',
        amount: 500,
        status: 'completed',
        paymentMethod: 'midtrans',
        description: 'Initial credit topup',
      },
    ]);

    // Seed RBAC system after basic data is created
    await seedRBAC();

    console.log('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();