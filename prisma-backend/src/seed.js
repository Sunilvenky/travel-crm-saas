const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main(){
  await prisma.tenant.deleteMany();
  await prisma.user.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.travelPackage.deleteMany();
  await prisma.booking.deleteMany();

  const tenant = await prisma.tenant.create({ data: { name: 'Demo TravelCo', domain: 'demo.travelco', subscription_tier: 'starter' } });
  const adminPw = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.create({ data: { email: 'admin@demo.travelco', password_hash: adminPw, first_name: 'Admin', last_name: 'User', role: 'ADMIN', tenant_id: tenant.id } });

  const lead = await prisma.lead.create({ data: { email: 'lead1@example.com', phone: '555-0101', first_name: 'Lead', last_name: 'One', source: 'web', tenant_id: tenant.id } });
  const customer = await prisma.customer.create({ data: { lead_id: lead.id, customer_type: 'individual', tenant_id: tenant.id } });
  const pkg = await prisma.travelPackage.create({ data: { name: 'Caribbean Escape', description: '7 nights', base_price: 1999, destination: 'Caribbean', tenant_id: tenant.id, duration: 7 } });
  const booking = await prisma.booking.create({ data: { customer_id: customer.id, package_id: pkg.id, status: 'confirmed', total_amount: 1999, travel_date: new Date(), pax_count: 2, tenant_id: tenant.id } });

  console.log('Seed complete');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
