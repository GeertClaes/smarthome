import { NextResponse } from "next/server";
import { AdminAuthError } from "@/lib/adminAuth";

export function jsonOk(data, init) {
  return NextResponse.json(data, init);
}

export function jsonError(error, fallbackStatus = 500) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ error: message }, { status: fallbackStatus });
}
