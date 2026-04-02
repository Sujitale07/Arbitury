import { NextResponse } from 'next/server';
import { analyzeSeo } from '@/lib/actions/seo';
import { z } from 'zod';

const analyzeSchema = z.object({
  projectName: z.string().optional(),
  businessType: z.string().min(1, 'Business type is required'),
  location: z.string().optional(),
  seedKeywords: z.array(z.string()).default([]),
  competitors: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = analyzeSchema.parse(body);
    
    const result = await analyzeSeo({
      projectName: validated.projectName || '',
      businessType: validated.businessType,
      location: validated.location,
      seedKeywords: validated.seedKeywords,
      competitors: validated.competitors,
    });
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        data: result.data 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request data', 
        details: err.issues 
      }, { status: 400 });
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
