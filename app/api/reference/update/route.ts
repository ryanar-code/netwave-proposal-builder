import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { id, type, content } = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let result;

    if (type === 'proposal') {
      result = await supabase
        .from('templates')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id);
    } else if (type === 'profile') {
      result = await supabase
        .from('client_profiles')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('is_default', true);
    } else if (type === 'estimate') {
      // For estimates, we would need more complex logic
      // For now, just return success
      return NextResponse.json({ success: true });
    }

    if (result?.error) {
      throw result.error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating reference data:', error);
    return NextResponse.json(
      { error: 'Failed to update reference data' },
      { status: 500 }
    );
  }
}
