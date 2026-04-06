import "dotenv/config";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 0. Ensure a User and Workspace exist
  const user = await prisma.user.upsert({
    where: { clerkId: 'seed_clerk_user_id' },
    update: {},
    create: {
      clerkId: 'seed_clerk_user_id',
      email: 'seed@example.com',
      name: 'Seed User',
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { id: 'seed_workspace_id' },
    update: {},
    create: {
      id: 'seed_workspace_id',
      name: 'Default Workspace',
      ownerId: user.id,
    },
  });

  const workspaceId = workspace.id;

  // 1. Create Products
  const products = [
    {
      workspaceId,
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
      workspaceId,
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
      workspaceId,
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
      where: { 
        workspaceId_sku: { 
          workspaceId: p.workspaceId, 
          sku: p.sku 
        } 
      },
      update: {},
      create: p,
    });
  }

  // 2. Create Customers
  await prisma.customer.upsert({
    where: { 
      workspaceId_email: { 
        workspaceId, 
        email: 'lifestyle@example.com' 
      } 
    },
    update: {},
    create: {
      workspaceId,
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
        workspaceId,
        type: 'restock' as any,
        title: 'Priority Restock: Organic White',
        description: 'Inventory levels (150) are sufficient but velocity is up 40% due to TikTok trends.',
        urgency: 'medium' as any,
      },
      {
        workspaceId,
        type: 'pricing' as any,
        title: 'Upsell Opportunity detected',
        description: 'Bundling Black Chia with recipe books has 3x conversion potential.',
        urgency: 'low' as any,
      },
    ],
    skipDuplicates: true,
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

