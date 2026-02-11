import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { dataGovernanceService } from "@/services/dataGovernanceService";
import { logSecurityEvent } from "@/lib/securityAudit";
import { successResponse, errorResponse } from "@/lib/api/apiResponse";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
    }

    const body = await request.json().catch(() => ({}));
    const deleteType = body.deleteType || 'anonymize';

    if (deleteType === 'complete') {
      await dataGovernanceService.deleteUserCompletely(session.user.id, session.user.id);
    } else {
      await dataGovernanceService.anonymizeUserData(session.user.id, session.user.id);
    }

    await logSecurityEvent({
      action: 'ACCOUNT_DELETED',
      userId: session.user.id,
      resource: 'user',
      resourceId: session.user.id,
      details: { deleteType },
    });

    return successResponse({
      message: deleteType === 'complete' 
        ? "Account permanently deleted" 
        : "Account data anonymized successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to delete account", 500);
  }
}
