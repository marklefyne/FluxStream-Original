import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { node_id, session_id, integrity_score } = body;

    const { error } = await supabase
      .from('stream_integrity')
      .insert([
        { 
          node_id, 
          session_id, 
          integrity_score,
          is_active: true 
        },
      ]);

    if (error) throw error;

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
