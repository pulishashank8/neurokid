import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { dataGovernanceService } from "@/application/services/DataGovernanceService";
import { logSecurityEvent } from "@/lib/securityAudit";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    const userData = await dataGovernanceService.exportUserData(session.user.id);

    await logSecurityEvent({
      action: 'ADMIN_ACTION',
      userId: session.user.id,
      resource: 'data_export',
      details: { action: 'self_data_export' },
    });

    return successResponse(userData);
  } catch (error) {
    console.error("Data export error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to export data", 500);
  }
}
