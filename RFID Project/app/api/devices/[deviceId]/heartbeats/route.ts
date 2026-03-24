import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { IT_ADMIN } from '@/lib/auth/roles';
import { getDeviceHeartbeats } from '@/lib/devices/deviceService';
import { makeDeviceDb } from '@/lib/devices/deviceDb';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
  try {
    await requireRole(IT_ADMIN);
  } catch (err) {
    return err as Response;
  }

  const { deviceId } = await params;
  const heartbeats = await getDeviceHeartbeats(makeDeviceDb(), deviceId);
  return NextResponse.json({ heartbeats });
}
