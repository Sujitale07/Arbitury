import { NextResponse } from 'next/server';
import { runCronUpdate } from '@/lib/actions/seo';

/**
 * DAILY SEO CRON JOB
 * 
 * This route should be called periodically (e.g., once every 24 hours)
 * to simulate the "drifting" of keyword rankings over time.
 * 
 * SECURITY: If deployed, a CRON_SECRET header should be checked to prevent 
 * unauthorized calls to this endpoint.
 */
export async function GET(req: Request) {
  try {
    // 1. (Optional) Check for a secret to prevent manual/unwanted execution
    // const authHeader = req.headers.get('Authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    // }

    // 2. Perform the ranking update simulation
    const result = await runCronUpdate();
    
    // 3. Return summary of what was updated
    return NextResponse.json({ 
      success: true, 
      message: 'Rankings updated successfully', 
      updatedCount: result.updated,
      alertsFound: result.alerts.length,
      alerts: result.alerts 
    });
  } catch (err: any) {
    console.error('SEO Cron Error:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to run ranking update' 
    }, { status: 500 });
  }
}
