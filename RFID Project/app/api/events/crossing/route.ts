import { NextResponse } from 'next/server';

// POST /api/events/crossing — internal IoT Hub consumer only (STORY-007)
// Not exposed to browser clients — called by the IoT Hub event consumer process.
export async function POST(request: Request) {
  // In STORY-007 this will be restricted to internal calls only.
  return NextResponse.json({ message: 'Crossing event consumer — implemented in STORY-007' }, { status: 501 });
}
