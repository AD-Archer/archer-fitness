import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { z } from "zod"
import nodemailer from "nodemailer"

const bugReportSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  severity: z.string().min(1, "Severity is required"),
  description: z.string().min(1, "Description is required"),
  stepsToReproduce: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  browserInfo: z.string().optional(),
  userEmail: z.string().email().optional(),
  userName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Allow both authenticated and anonymous bug reports
    const body = await request.json()
    const bugReport = bugReportSchema.parse(body)

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Format the bug report email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #dc2626;
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 0 0 8px 8px;
            }
            .field {
              margin-bottom: 20px;
            }
            .field-label {
              font-weight: bold;
              color: #6b7280;
              text-transform: uppercase;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .field-value {
              background-color: white;
              padding: 12px;
              border-radius: 6px;
              border: 1px solid #e5e7eb;
            }
            .severity-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .severity-critical {
              background-color: #dc2626;
              color: white;
            }
            .severity-high {
              background-color: #f97316;
              color: white;
            }
            .severity-medium {
              background-color: #eab308;
              color: white;
            }
            .severity-low {
              background-color: #22c55e;
              color: white;
            }
            .pre-wrap {
              white-space: pre-wrap;
              word-wrap: break-word;
              font-family: monospace;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">🐛 New Bug Report</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">${bugReport.title}</p>
            </div>
            <div class="content">
              <!-- User Information -->
              ${session?.user || bugReport.userEmail ? `
                <div class="field">
                  <div class="field-label">Reported By</div>
                  <div class="field-value">
                    ${bugReport.userName || "Anonymous User"}<br>
                    ${bugReport.userEmail || "No email provided"}
                    ${session?.user?.id ? `<br>User ID: ${session.user.id}` : ""}
                  </div>
                </div>
              ` : ""}

              <!-- Category and Severity -->
              <div class="field">
                <div class="field-label">Category & Severity</div>
                <div class="field-value">
                  <strong>Category:</strong> ${bugReport.category}<br>
                  <strong>Severity:</strong> 
                  <span class="severity-badge severity-${bugReport.severity}">
                    ${bugReport.severity}
                  </span>
                </div>
              </div>

              <!-- Description -->
              <div class="field">
                <div class="field-label">Description</div>
                <div class="field-value">
                  ${bugReport.description}
                </div>
              </div>

              <!-- Steps to Reproduce -->
              ${bugReport.stepsToReproduce ? `
                <div class="field">
                  <div class="field-label">Steps to Reproduce</div>
                  <div class="field-value pre-wrap">${bugReport.stepsToReproduce}</div>
                </div>
              ` : ""}

              <!-- Expected Behavior -->
              ${bugReport.expectedBehavior ? `
                <div class="field">
                  <div class="field-label">Expected Behavior</div>
                  <div class="field-value">${bugReport.expectedBehavior}</div>
                </div>
              ` : ""}

              <!-- Actual Behavior -->
              ${bugReport.actualBehavior ? `
                <div class="field">
                  <div class="field-label">Actual Behavior</div>
                  <div class="field-value">${bugReport.actualBehavior}</div>
                </div>
              ` : ""}

              <!-- Browser Information -->
              ${bugReport.browserInfo ? `
                <div class="field">
                  <div class="field-label">Browser/Device Information</div>
                  <div class="field-value pre-wrap">${bugReport.browserInfo}</div>
                </div>
              ` : ""}

              <!-- Timestamp -->
              <div class="field">
                <div class="field-label">Reported At</div>
                <div class="field-value">${new Date().toLocaleString()}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email to admin
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `🐛 Bug Report: ${bugReport.title} [${bugReport.severity.toUpperCase()}]`,
      html: emailHtml,
    })

    // Send confirmation email to user if they provided an email
    if (bugReport.userEmail) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: bugReport.userEmail,
        subject: "Bug Report Received - Archer Fitness",
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Thank You for Your Bug Report!</h2>
                <p>Hi ${bugReport.userName || "there"},</p>
                <p>We've received your bug report about "<strong>${bugReport.title}</strong>" and our development team will review it shortly.</p>
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Report Summary:</strong></p>
                  <p style="margin: 5px 0;"><strong>Category:</strong> ${bugReport.category}</p>
                  <p style="margin: 5px 0;"><strong>Severity:</strong> ${bugReport.severity}</p>
                  <p style="margin: 5px 0;"><strong>Description:</strong> ${bugReport.description}</p>
                </div>
                <p>We appreciate you taking the time to help us improve Archer Fitness!</p>
                <p>Best regards,<br>The Archer Fitness Team</p>
              </div>
            </body>
          </html>
        `,
      })
    }

    logger.info("Bug report submitted", {
      userId: session?.user?.id,
      category: bugReport.category,
      severity: bugReport.severity,
    })

    return NextResponse.json({
      message: "Bug report submitted successfully",
      success: true,
    })
  } catch (error) {
    logger.error("Failed to submit bug report", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid bug report data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to submit bug report" },
      { status: 500 }
    )
  }
}
