import { NextResponse, type NextRequest } from "next/server";
import { updateMember, type UpdateMemberInput } from "@/backend/api/members";
import { routeError, supabaseFromRequest } from "@/app/lib/api-route";

const ALLOWED = new Set<keyof UpdateMemberInput>([
  "name",
  "membership_no",
  "father_spouse_name",
  "email",
  "alternate_email",
  "phone",
  "alternate_phone",
  "ownership",
  "status",
  "parking_slot",
  "vehicle_number",
  "vehicle_make_model",
  "notes"
]);

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const body = await req.json();
    const patch = Object.fromEntries(
      Object.entries(body).filter(([key]) => ALLOWED.has(key as keyof UpdateMemberInput))
    ) as UpdateMemberInput;
    const supabase = supabaseFromRequest(req);
    return NextResponse.json(await updateMember(supabase, params.id, patch, { asAdmin: true }));
  } catch (error) {
    return routeError(error);
  }
}
