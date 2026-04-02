import "dotenv/config";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create Products
  const products = [
    {
      name: 'Organic White Chia Seeds',
      sku: 'CHIA-WHT-ORG',
      category: 'seed' as any,
      variant: 'white' as any,
      quantity: 150,
      costPrice: 8.5,
      salePrice: 18.0,
      expiryDate: new Date('2026-12-01'),
      supplier: 'Andean Heritage Corp',
      lotNumber: 'LOT-2024-001',
      harvestDate: new Date('2024-03-01'),
      lowStockThreshold: 20,
    },
    {
      name: 'Roasted Black Chia Seeds',
      sku: 'CHIA-BLK-RST',
      category: 'seed' as any,
      variant: 'black' as any,
      quantity: 85,
      costPrice: 9.0,
      salePrice: 22.5,
      expiryDate: new Date('2027-01-15'),
      supplier: 'Andean Heritage Corp',
      lotNumber: 'LOT-2024-005',
      harvestDate: new Date('2024-04-10'),
      lowStockThreshold: 15,
    },
    {
      name: 'Superfood Mixed Blend',
      sku: 'CHIA-BND-SF',
      category: 'bundle' as any,
      variant: 'mixed' as any,
      quantity: 40,
      costPrice: 12.0,
      salePrice: 35.0,
      expiryDate: new Date('2026-11-20'),
      supplier: 'In-House Blend',
      lotNumber: 'LOT-2024-MIX',
      harvestDate: new Date('2024-05-01'),
      lowStockThreshold: 10,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  // 2. Create Customers
  const customer = await prisma.customer.upsert({
    where: { email: 'lifestyle@example.com' },
    update: {},
    create: {
      name: 'Elena Boutique',
      email: 'lifestyle@example.com',
      phone: '+1 555 0123',
      segment: 'vip' as any,
    },
  });

  // 3. Create initial AI Insights
  await prisma.aIInsight.createMany({
    data: [
      {
        type: 'restock' as any,
        title: 'Priority Restock: Organic White',
        description: 'Inventory levels (150) are sufficient but velocity is up 40% due to TikTok trends.',
        urgency: 'medium' as any,
      },
      {
        type: 'pricing' as any,
        title: 'Upsell Opportunity detected',
        description: 'Bundling Black Chia with recipe books has 3x conversion potential.',
        urgency: 'low' as any,
      },
    ],
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
