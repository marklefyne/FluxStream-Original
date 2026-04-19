import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/loyalty?node_id=xxx
export async function GET(req: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ xp: 0, total_minutes: 0 });

    const node_id = req.nextUrl.searchParams.get("node_id");
    if (!node_id) {
      return NextResponse.json({ xp: 0, total_minutes: 0 });
    }

    const { data, error } = await supabase
      .from("user_loyalty")
      .select("xp, total_minutes")
      .eq("node_id", node_id)
      .single();

    if (error || !data) {
      return NextResponse.json({ xp: 0, total_minutes: 0 });
    }

    return NextResponse.json({
      xp: data.xp || 0,
      total_minutes: data.total_minutes || 0,
    });
  } catch {
    return NextResponse.json({ xp: 0, total_minutes: 0 });
  }
}

// POST /api/loyalty — add XP
export async function POST(req: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ ok: true, total_xp: 0 });

    const body = await req.json();
    const { node_id, xp_added } = body;

    if (!node_id) {
      return NextResponse.json({ ok: true, total_xp: 0 });
    }

    const xpToAdd = xp_added || 10;

    // Check if user exists
    const { data: existing } = await supabase
      .from("user_loyalty")
      .select("xp, total_minutes")
      .eq("node_id", node_id)
      .single();

    if (existing) {
      const { data: updated, error } = await supabase
        .from("user_loyalty")
        .update({
          xp: (existing.xp || 0) + xpToAdd,
          total_minutes: (existing.total_minutes || 0) + 5,
          last_active: new Date().toISOString(),
        })
        .eq("node_id", node_id)
        .select("xp, total_minutes")
        .single();

      if (error) {
        return NextResponse.json({ ok: true, total_xp: existing.xp });
      }

      return NextResponse.json({
        ok: true,
        total_xp: updated?.xp || 0,
        total_minutes: updated?.total_minutes || 0,
      });
    } else {
      const { data: created, error } = await supabase
        .from("user_loyalty")
        .insert({
          node_id,
          xp: xpToAdd,
          total_minutes: 5,
          last_active: new Date().toISOString(),
        })
        .select("xp, total_minutes")
        .single();

      if (error) {
        return NextResponse.json({ ok: true, total_xp: xpToAdd });
      }

      return NextResponse.json({
        ok: true,
        total_xp: created?.xp || 0,
        total_minutes: created?.total_minutes || 0,
      });
    }
  } catch {
    return NextResponse.json({ ok: true, total_xp: 0 });
  }
}
