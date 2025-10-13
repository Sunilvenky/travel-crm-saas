import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // create a tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Travel Co',
      domain: 'demo.travelco',
      subscription_tier: 'starter',
      settings: JSON.stringify({ currency: 'USD' })
    }
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.travelco',
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: 'User',
      role: 'ADMIN',
      tenant_id: tenant.id
    }
  });

  const agent = await prisma.user.create({
    data: {
      email: 'agent@demo.travelco',
      password_hash: passwordHash,
      first_name: 'Agent',
      last_name: 'One',
      role: 'AGENT',
      tenant_id: tenant.id
    }
  });

  const lead = await prisma.lead.create({
    data: {
      email: 'lead1@example.com',
      first_name: 'Lead',
      last_name: 'One',
      source: 'web',
      tenant_id: tenant.id,
      destination: 'Hawaii',
      budget: 3000,
      adults: 2
    }
  });

  const customer = await prisma.customer.create({
    data: {
      lead_id: lead.id,
      customer_type: 'individual',
      loyalty_level: 'bronze',
      tenant_id: tenant.id
    }
  });

  const pkg = await prisma.travelPackage.create({
    data: {
      name: '7-Day Hawaii Escape',
      description: 'Relaxing beaches and tours',
      base_price: 2500,
      duration: 7,
      destination: 'Hawaii',
      tenant_id: tenant.id
    }
  });

  const booking = await prisma.booking.create({
    data: {
      customer_id: customer.id,
      package_id: pkg.id,
      status: 'confirmed',
      total_amount: 2500,
      travel_date: new Date(),
      pax_count: 2,
      tenant_id: tenant.id
    }
  });

  console.log('Seed data created for tenant', tenant.domain);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
