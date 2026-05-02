import { NextResponse, type NextRequest } from "next/server";

import {
  finalizePasswordLoginSessionWithClient,
  type FinalizePasswordSessionResult,
} from "@/features/auth/finalize-password-login-session";
import {
  finalizeSignInServerFaultUserMessage,
  SIGN_IN_NOT_CONFIGURED,
} from "@/lib/errors/safe-user-feedback";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { passwordLoginSessionTokensSchema } from "@/validations/auth-session";

export async function POST(
  request: NextRequest,
): Promise<NextResponse<FinalizePasswordSessionResult>> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: SIGN_IN_NOT_CONFIGURED },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not finalize sign-in. Try again." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const parsed = passwordLoginSessionTokensSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Could not finalize sign-in. Try again." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const response = NextResponse.json<{ ok: true }>({ ok: true });

  try {
    const supabase = createRouteHandlerSupabaseClient(request, response);
    const result = await finalizePasswordLoginSessionWithClient(
      supabase,
      parsed.data.access_token,
      parsed.data.refresh_token,
    );
    if (!result.ok) {
      return NextResponse.json(result, {
        status: 401,
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: finalizeSignInServerFaultUserMessage(),
      },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
