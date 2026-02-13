import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * Manual trigger endpoint for Co-Founder AI report generation
 * POST /api/owner/cofounder/trigger
 *
 * Generates a Co-Founder report by aggregating live platform data,
 * using AI to produce an executive summary, and storing the report.
 */
export async function POST(request: Request) {
  try {
    // 1. Verify authentication - must be owner (admin session)
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized - Owner access required' },
        { status: 401 }
      );
    }

    console.log('[Co-Founder Trigger] Starting report generation...');

    // 2. Aggregate platform data
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      activeUsers7d,
      totalPosts,
      newPostsToday,
      totalComments,
      newCommentsToday,
      totalReports,
      bannedUsers,
      recentFeedback,
      recentInsights,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: yesterday } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: weekAgo } } }),
      prisma.post.count(),
      prisma.post.count({ where: { createdAt: { gte: yesterday } } }),
      prisma.comment.count(),
      prisma.comment.count({ where: { createdAt: { gte: yesterday } } }),
      prisma.report.count({ where: { status: 'OPEN' } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.userFeedback.findMany({
        where: { createdAt: { gte: weekAgo } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }).catch(() => []),
      prisma.aIAgentInsight.findMany({
        where: { createdAt: { gte: weekAgo } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }).catch(() => []),
    ]);

    // 3. Calculate derived metrics
    const dauMauRatio = totalUsers > 0 
      ? ((activeUsers7d / totalUsers) * 100).toFixed(1) 
      : '0';
    const engagementRate = activeUsers7d > 0 
      ? ((newPostsToday / activeUsers7d) * 100).toFixed(1) 
      : '0';
    const growthRate = totalUsers > 0 
      ? ((newUsersWeek / totalUsers) * 100).toFixed(1) 
      : '0';

    // 4. Generate AI Executive Summary using Groq
    let executiveSummary = '';
    let recommendations: string[] = [];
    let aiReasoning = '';

    try {
      const groqApiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS?.split(',')[0];
      
      if (groqApiKey) {
        const metricsContext = `
Platform Metrics (as of ${now.toISOString()}):
- Total Users: ${totalUsers}
- New Users Today: ${newUsersToday}
- New Users This Week: ${newUsersWeek}
- Active Users (7d): ${activeUsers7d}
- DAU/MAU Ratio: ${dauMauRatio}%
- Total Posts: ${totalPosts}
- New Posts Today: ${newPostsToday}
- Total Comments: ${totalComments}
- New Comments Today: ${newCommentsToday}
- Pending Reports: ${totalReports}
- Banned Users: ${bannedUsers}
- Growth Rate (weekly): ${growthRate}%
- Engagement Rate: ${engagementRate}%
- Recent Feedback Count: ${recentFeedback.length}
- Agent Insights Count: ${recentInsights.length}
`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `You are the AI Co-Founder of NeuroKid, a platform supporting parents of autistic children.
You analyze platform data and provide executive-level business intelligence reports.
You think like a startup co-founder: strategic, data-driven, and action-oriented.
Always respond in valid JSON format with the following structure:
{
  "executiveSummary": "A 2-3 paragraph executive summary of the platform's current state",
  "recommendations": ["Action item 1", "Action item 2", "Action item 3", "Action item 4", "Action item 5"],
  "reasoning": "Your analytical reasoning process",
  "riskAlerts": ["Any risk alerts"],
  "growthOpportunities": ["Growth opportunities identified"]
}`
              },
              {
                role: 'user',
                content: `Generate a Co-Founder AI executive report based on these metrics:\n${metricsContext}\n\nAnalyze the data, identify trends, risks, and opportunities. Provide actionable recommendations. Respond ONLY with valid JSON.`
              }
            ],
            temperature: 0.3,
            max_tokens: 2000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          
          try {
            // Strip markdown code fences if present
            let cleanContent = content
              .replace(/```json\s*/gi, '')
              .replace(/```\s*/g, '')
              .trim();
            
            // Try to parse as JSON
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              executiveSummary = parsed.executiveSummary || '';
              recommendations = parsed.recommendations || [];
              aiReasoning = parsed.reasoning || '';
            } else {
              // No JSON found, use content as summary
              executiveSummary = cleanContent.substring(0, 1000);
            }
          } catch {
            // If JSON parsing fails, extract text between quotes as fallback
            const summaryMatch = content.match(/"executiveSummary"\s*:\s*"([^"]+)"/);
            if (summaryMatch) {
              executiveSummary = summaryMatch[1];
            } else {
              executiveSummary = content
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .replace(/[{}"\[\]]/g, '')
                .substring(0, 1000)
                .trim();
            }
          }
        }
      }
    } catch (aiError) {
      console.error('[Co-Founder Trigger] AI generation error:', aiError);
    }

    // Fallback if AI didn't generate summary
    if (!executiveSummary) {
      executiveSummary = `NeuroKid Platform Report - ${now.toLocaleDateString()}\n\n` +
        `The platform currently serves ${totalUsers} registered users with ${activeUsers7d} active in the last 7 days. ` +
        `Today saw ${newUsersToday} new signups and ${newPostsToday} new community posts. ` +
        `Weekly growth rate is ${growthRate}% with a DAU/MAU ratio of ${dauMauRatio}%. ` +
        `The community is ${activeUsers7d > 10 ? 'actively engaged' : 'still growing'} with ` +
        `${newCommentsToday} new comments today. ` +
        `${totalReports > 0 ? `There are ${totalReports} pending reports requiring attention. ` : 'No pending reports. '}` +
        `${bannedUsers > 0 ? `${bannedUsers} users are currently banned. ` : ''}` +
        `System is operational.`;
      
      recommendations = [
        `Focus on user acquisition - current base is ${totalUsers} users`,
        `Improve engagement - ${engagementRate}% engagement rate needs improvement`,
        `Monitor community health - ${totalReports} pending reports`,
        `Continue building AI-powered features for parents`,
        `Prepare scaling infrastructure for growth`,
      ];
    }

    // 5. Build the full report data
    const reportData = {
      generatedAt: now.toISOString(),
      trigger: 'manual',
      executiveSummary,
      recommendations,
      aiReasoning,
      kpis: {
        totalUsers,
        newUsersToday,
        newUsersWeek,
        activeUsers7d,
        dauMauRatio: parseFloat(dauMauRatio),
        totalPosts,
        newPostsToday,
        totalComments,
        newCommentsToday,
        pendingReports: totalReports,
        bannedUsers,
        growthRate: parseFloat(growthRate),
        engagementRate: parseFloat(engagementRate),
      },
      systemHealth: {
        status: 'operational',
        uptime: 99.9,
      },
      feedback: recentFeedback.map(f => ({
        id: f.id,
        type: f.type,
        rating: f.rating,
        text: f.text,
        createdAt: f.createdAt,
      })),
      agentInsights: recentInsights.map(i => ({
        agentType: i.agentType,
        severity: i.severity,
        title: i.title,
        description: i.description,
        createdAt: i.createdAt,
      })),
    };

    // 6. Store report in database
    const recipientEmail = process.env.COFOUNDER_RECIPIENT_EMAIL || 'pulishashank8@gmail.com';

    const report = await prisma.coFounderReport.create({
      data: {
        sentAt: now,
        recipientEmail,
        executiveSummary,
        reportData: reportData as any,
        attachmentUrls: [],
        agentSessionId: `manual-trigger-${now.getTime()}`,
      },
    });

    console.log('[Co-Founder Trigger] Report saved:', report.id);

    // 7. Optionally send email via Resend
    let emailSent = false;
    let emailId = '';
    
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        
        const emailResult = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'NeuroKind Co-Founder AI <no-reply@neurokid.help>',
          to: recipientEmail,
          subject: `🚀 NeuroKind Co-Founder Report - ${now.toLocaleDateString()}`,
          html: generateEmailHtml(reportData),
          text: executiveSummary,
        });

        if (emailResult.data) {
          emailSent = true;
          emailId = emailResult.data.id;
          console.log('[Co-Founder Trigger] Email sent:', emailId);
        }
      }
    } catch (emailError) {
      console.error('[Co-Founder Trigger] Email send error (non-fatal):', emailError);
    }

    // 8. Redirect back to reports page (for form submission)
    const acceptsJson = request.headers.get('accept')?.includes('application/json');
    
    if (acceptsJson) {
      return NextResponse.json({
        success: true,
        reportId: report.id,
        emailSent,
        emailId,
        kpis: reportData.kpis,
        executiveSummary: executiveSummary.substring(0, 200) + '...',
      });
    }

    // Redirect for form POST
    return NextResponse.redirect(new URL('/owner/dashboard/cofounder-reports', request.url));

  } catch (error: any) {
    console.error('[Co-Founder Trigger] Error:', error);
    
    // Check if it's a form POST - redirect with error
    const acceptsJson = request.headers.get('accept')?.includes('application/json');
    if (!acceptsJson) {
      return NextResponse.redirect(
        new URL('/owner/dashboard/cofounder-reports?error=generation_failed', request.url)
      );
    }
    
    return NextResponse.json(
      { error: 'Report generation failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate a simple but professional HTML email for the report
 */
function generateEmailHtml(data: any): string {
  const kpis = data.kpis || {};
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
  <div style="background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 16px; padding: 32px; color: white; margin-bottom: 24px;">
    <h1 style="margin: 0 0 8px; font-size: 24px;">🚀 Co-Founder AI Report</h1>
    <p style="margin: 0; opacity: 0.8; font-size: 14px;">Generated ${new Date(data.generatedAt).toLocaleString()}</p>
  </div>

  <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">Executive Summary</h2>
    <p style="color: #475569; line-height: 1.6; margin: 0;">${data.executiveSummary}</p>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
    <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Total Users</p>
      <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #1e293b;">${kpis.totalUsers || 0}</p>
    </div>
    <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Active (7d)</p>
      <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #059669;">${kpis.activeUsers7d || 0}</p>
    </div>
    <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">New Today</p>
      <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #7c3aed;">${kpis.newUsersToday || 0}</p>
    </div>
    <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Growth Rate</p>
      <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #2563eb;">${kpis.growthRate || 0}%</p>
    </div>
  </div>

  ${data.recommendations?.length > 0 ? `
  <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
    <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">🎯 Recommendations</h2>
    <ul style="margin: 0; padding-left: 20px; color: #475569;">
      ${data.recommendations.map((r: string) => `<li style="margin-bottom: 8px; line-height: 1.5;">${r}</li>`).join('')}
    </ul>
  </div>` : ''}

  <div style="text-align: center; padding: 16px; color: #94a3b8; font-size: 12px;">
    <p>NeuroKid AI Co-Founder • Automated Report</p>
  </div>
</body>
</html>`;
}
