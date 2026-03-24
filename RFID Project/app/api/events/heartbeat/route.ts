import { NextResponse } from 'next/server';

// POST /api/events/heartbeat — internal IoT Hub consumer only (STORY-007)
export async function POST(request: Request) {
  return NextResponse.json({ message: 'Heartbeat consumer — implemented in STORY-007' }, { status: 501 });
}
