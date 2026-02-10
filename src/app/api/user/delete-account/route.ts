import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { DataDeletionProcessor } from "@/workers/processors/DataDeletionProcessor";
import { logSecurityEvent } from "@/lib/securityAudit";
import { successResponse, errorResponse } from "@/lib/apiResponse";

/**
 * Delete account: removes or anonymizes all user data (GDPR Right to Erasure).
 * Uses DataDeletionProcessor so posts are anonymized, all other personal data is deleted.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
    }

    const processor = new DataDeletionProcessor();
    await processor.deleteUserData(session.user.id, "USER_REQUEST");

    await logSecurityEvent({
      action: "ACCOUNT_DELETED",
      userId: session.user.id,
      resource: "user",
      resourceId: session.user.id,
      details: { fullDeletion: true },
    });

    return successResponse({
      message: "Account deleted. You have been signed out.",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to delete account", 500);
  }
}
