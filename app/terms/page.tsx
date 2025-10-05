"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, X } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { toast } from "sonner"
import { logger } from "@/lib/logger"

export default function TermsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null)
  const [showAcceptanceDialog, setShowAcceptanceDialog] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)

  // Check terms acceptance status for authenticated users
  useEffect(() => {
    if (session?.user) {
      checkTermsAcceptance()
    } else {
      setTermsAccepted(null)
      // Don't show dialog for non-authenticated users on the terms page
      setShowAcceptanceDialog(false)
    }
  }, [session])

  const checkTermsAcceptance = async () => {
    try {
      const response = await fetch("/api/user/terms")
      if (response.ok) {
        const data = await response.json()
        setTermsAccepted(data.termsAccepted)
        if (!data.termsAccepted) {
          setShowAcceptanceDialog(true)
        }
      }
    } catch (error) {
      logger.error("Failed to check terms acceptance:", error)
    }
  }

  const handleAcceptTerms = async () => {
    setIsAccepting(true)
    try {
      const response = await fetch("/api/user/terms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accepted: true }),
      })

      if (response.ok) {
        setTermsAccepted(true)
        setShowAcceptanceDialog(false)
        toast.success("Terms of service accepted")
      } else {
        throw new Error("Failed to accept terms of service")
      }
    } catch (error) {
      logger.error("Failed to accept terms of service:", error)
      toast.error("Failed to accept terms of service")
    } finally {
      setIsAccepting(false)
    }
  }

  const handleRejectTerms = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <>
      {/* Layout for authenticated users (show regardless of acceptance status) */}
      {session && (
        <div className="flex min-h-screen bg-background">
          {termsAccepted && <Sidebar />}

          <main className="flex-1 p-3 md:p-6 lg:p-8 lg:ml-0 overflow-x-hidden">
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 lg:space-y-8">
              <div className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${termsAccepted ? 'pt-12 lg:pt-0' : 'pt-4'}`}>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">Terms of Service</h1>
                  <p className="text-muted-foreground text-pretty">
                    Review the terms and conditions for using Archer Fitness
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
                  <CardDescription className="text-center">
                    Please read these terms carefully before using our service.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="prose max-w-none">
                    <p className="text-sm text-muted-foreground mb-4">
                      Last Updated: October 5, 2025
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                    <p className="mb-4">
                      By accessing and using Archer Fitness (&quot;the Service&quot;), you accept and agree to be bound by the terms 
                      and provisions of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
                    <p className="mb-4">
                      Permission is granted to temporarily access and use the Service for personal, non-commercial purposes. 
                      This is the grant of a license, not a transfer of title, and under this license you may not:
                    </p>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>Modify or copy the Service materials</li>
                      <li>Use the materials for any commercial purpose or for any public display</li>
                      <li>Attempt to reverse engineer any software contained in the Service</li>
                      <li>Remove any copyright or other proprietary notations from the materials</li>
                      <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                    <p className="mb-4">
                      To access certain features of the Service, you must create an account. You agree to:
                    </p>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>Provide accurate, current, and complete information during registration</li>
                      <li>Maintain and update your information to keep it accurate, current, and complete</li>
                      <li>Maintain the security of your password and accept all risks of unauthorized access</li>
                      <li>Notify us immediately of any unauthorized use of your account</li>
                      <li>Be responsible for all activities that occur under your account</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mb-4">4. User-Generated Content</h2>
                    <p className="mb-4">
                      Our Service allows you to create, upload, and share fitness and nutrition data. You retain all rights 
                      to your content. By posting content on our Service, you grant us a non-exclusive license to use, 
                      modify, and display that content solely for the purpose of providing the Service to you.
                    </p>
                    <p className="mb-4">
                      You represent and warrant that:
                    </p>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>You own or have the necessary rights to your content</li>
                      <li>Your content does not violate any third-party rights</li>
                      <li>Your content is accurate to the best of your knowledge</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mb-4">5. Medical Disclaimer</h2>
                    <p className="mb-4 font-semibold text-red-600">
                      IMPORTANT: Archer Fitness is not a medical service and does not provide medical advice.
                    </p>
                    <p className="mb-4">
                      The fitness and nutrition information provided through our Service is for informational purposes only 
                      and is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always 
                      seek the advice of your physician or other qualified health provider with any questions you may have 
                      regarding a medical condition or fitness program.
                    </p>
                    <p className="mb-4">
                      Never disregard professional medical advice or delay in seeking it because of something you have read 
                      or accessed through the Service. If you think you may have a medical emergency, call your doctor or 
                      emergency services immediately.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">6. Assumption of Risk</h2>
                    <p className="mb-4">
                      You acknowledge that physical exercise and fitness activities involve inherent risks of injury. By 
                      using this Service, you voluntarily assume all such risks and release Archer Fitness and its creators 
                      from any liability for injuries or damages resulting from your use of the Service or participation in 
                      any fitness activities.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">7. Acceptable Use</h2>
                    <p className="mb-4">
                      You agree not to use the Service to:
                    </p>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>Violate any applicable laws or regulations</li>
                      <li>Infringe on the intellectual property rights of others</li>
                      <li>Upload or transmit viruses or malicious code</li>
                      <li>Attempt to gain unauthorized access to the Service or related systems</li>
                      <li>Interfere with or disrupt the Service or servers</li>
                      <li>Impersonate any person or entity</li>
                      <li>Collect or harvest information about other users</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mb-4">8. Open Source Software</h2>
                    <p className="mb-4">
                      Archer Fitness is open-source software distributed under the MIT License. The source code is 
                      available at{" "}
                      <a
                        href="https://github.com/AD-Archer/archer-fitness"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        https://github.com/AD-Archer/archer-fitness
                      </a>
                      . You may fork, modify, and distribute the software in accordance with the MIT License terms.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">9. Self-Hosting</h2>
                    <p className="mb-4">
                      If you choose to self-host Archer Fitness on your own infrastructure:
                    </p>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>You are responsible for maintaining the security and integrity of your installation</li>
                      <li>You are responsible for compliance with all applicable laws and regulations</li>
                      <li>The original creators are not liable for any issues arising from your self-hosted instance</li>
                      <li>You must maintain all copyright and attribution notices in the software</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mb-4">10. Service Modifications and Interruptions</h2>
                    <p className="mb-4">
                      We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part 
                      thereof) with or without notice. We shall not be liable to you or any third party for any modification, 
                      suspension, or discontinuance of the Service.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
                    <p className="mb-4">
                      THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
                      TO THE FULLEST EXTENT PERMITTED BY LAW, ARCHER FITNESS AND ITS CREATORS DISCLAIM ALL WARRANTIES, 
                      INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
                      AND NON-INFRINGEMENT.
                    </p>
                    <p className="mb-4">
                      IN NO EVENT SHALL ARCHER FITNESS OR ITS CREATORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                      CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR 
                      GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
                    <p className="mb-4">
                      You agree to indemnify, defend, and hold harmless Archer Fitness and its creators from any claims, 
                      liabilities, damages, losses, and expenses, including reasonable attorneys&apos; fees, arising out of or 
                      in any way connected with your access to or use of the Service, your violation of these Terms, or 
                      your violation of any rights of another party.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">13. Data Backup</h2>
                    <p className="mb-4">
                      While we strive to maintain data integrity, you are responsible for maintaining backups of your data. 
                      We recommend regularly exporting your fitness and nutrition data using the export feature provided in 
                      the Service.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">14. Termination</h2>
                    <p className="mb-4">
                      We may terminate or suspend your account and access to the Service immediately, without prior notice 
                      or liability, for any reason, including without limitation if you breach these Terms. Upon termination, 
                      your right to use the Service will immediately cease.
                    </p>
                    <p className="mb-4">
                      You may delete your account at any time through the Privacy settings page. Upon account deletion, all 
                      your data will be permanently removed from our systems.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">15. Third-Party Services</h2>
                    <p className="mb-4">
                      The Service may contain links to third-party websites or services that are not owned or controlled by 
                      Archer Fitness. We have no control over, and assume no responsibility for, the content, privacy policies, 
                      or practices of any third-party websites or services.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">16. Governing Law</h2>
                    <p className="mb-4">
                      These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which 
                      the Service is hosted, without regard to its conflict of law provisions.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">17. Changes to Terms</h2>
                    <p className="mb-4">
                      We reserve the right to modify or replace these Terms at any time. If a revision is material, we will 
                      provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material 
                      change will be determined at our sole discretion.
                    </p>
                    <p className="mb-4">
                      By continuing to access or use our Service after any revisions become effective, you agree to be bound 
                      by the revised terms. If you do not agree to the new terms, you must stop using the Service.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">18. Severability</h2>
                    <p className="mb-4">
                      If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed 
                      and interpreted to accomplish the objectives of such provision to the greatest extent possible under 
                      applicable law, and the remaining provisions will continue in full force and effect.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">19. Entire Agreement</h2>
                    <p className="mb-4">
                      These Terms, together with our Privacy Policy, constitute the entire agreement between you and Archer 
                      Fitness regarding the Service and supersede all prior agreements and understandings.
                    </p>

                    <h2 className="text-2xl font-semibold mb-4">20. Contact Information</h2>
                    <p className="mb-4">
                      If you have any questions about these Terms of Service, please contact us through:
                    </p>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      <li>GitHub Issues: <a
                        href="https://github.com/AD-Archer/archer-fitness/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        https://github.com/AD-Archer/archer-fitness/issues
                      </a></li>
                      <li>Developer Website: <a
                        href="https://www.antonioarcher.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        www.antonioarcher.com
                      </a></li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      )}

      {/* Simple read-only page for non-authenticated users */}
      {!session && (
        <div className="min-h-screen bg-background p-3 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 lg:space-y-8">
            <div className="flex flex-col gap-4 pt-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">Terms of Service</h1>
                <p className="text-muted-foreground text-pretty">
                  Review the terms and conditions for using Archer Fitness
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
                <CardDescription className="text-center">
                  Please read these terms carefully before using our service.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose max-w-none">
                  <p className="text-sm text-muted-foreground mb-4">
                    Last Updated: October 5, 2025
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                  <p className="mb-4">
                    By accessing and using Archer Fitness (&quot;the Service&quot;), you accept and agree to be bound by the terms 
                    and provisions of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
                  <p className="mb-4">
                    Permission is granted to temporarily access and use the Service for personal, non-commercial purposes. 
                    This is the grant of a license, not a transfer of title, and under this license you may not:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-1">
                    <li>Modify or copy the Service materials</li>
                    <li>Use the materials for any commercial purpose or for any public display</li>
                    <li>Attempt to reverse engineer any software contained in the Service</li>
                    <li>Remove any copyright or other proprietary notations from the materials</li>
                    <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                  <p className="mb-4">
                    To access certain features of the Service, you must create an account. You agree to:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-1">
                    <li>Provide accurate, current, and complete information during registration</li>
                    <li>Maintain and update your information to keep it accurate, current, and complete</li>
                    <li>Maintain the security of your password and accept all risks of unauthorized access</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                    <li>Be responsible for all activities that occur under your account</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mb-4">4. User-Generated Content</h2>
                  <p className="mb-4">
                    Our Service allows you to create, upload, and share fitness and nutrition data. You retain all rights 
                    to your content. By posting content on our Service, you grant us a non-exclusive license to use, 
                    modify, and display that content solely for the purpose of providing the Service to you.
                  </p>
                  <p className="mb-4">
                    You represent and warrant that:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-1">
                    <li>You own or have the necessary rights to your content</li>
                    <li>Your content does not violate any third-party rights</li>
                    <li>Your content is accurate to the best of your knowledge</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mb-4">5. Medical Disclaimer</h2>
                  <p className="mb-4 font-semibold text-red-600">
                    IMPORTANT: Archer Fitness is not a medical service and does not provide medical advice.
                  </p>
                  <p className="mb-4">
                    The fitness and nutrition information provided through our Service is for informational purposes only 
                    and is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always 
                    seek the advice of your physician or other qualified health provider with any questions you may have 
                    regarding a medical condition or fitness program.
                  </p>
                  <p className="mb-4">
                    Never disregard professional medical advice or delay in seeking it because of something you have read 
                    or accessed through the Service. If you think you may have a medical emergency, call your doctor or 
                    emergency services immediately.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">6. Assumption of Risk</h2>
                  <p className="mb-4">
                    You acknowledge that physical exercise and fitness activities involve inherent risks of injury. By 
                    using this Service, you voluntarily assume all such risks and release Archer Fitness and its creators 
                    from any liability for injuries or damages resulting from your use of the Service or participation in 
                    any fitness activities.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">7. Acceptable Use</h2>
                  <p className="mb-4">
                    You agree not to use the Service to:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-1">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on the intellectual property rights of others</li>
                    <li>Upload or transmit viruses or malicious code</li>
                    <li>Attempt to gain unauthorized access to the Service or related systems</li>
                    <li>Interfere with or disrupt the Service or servers</li>
                    <li>Impersonate any person or entity</li>
                    <li>Collect or harvest information about other users</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mb-4">8. Open Source Software</h2>
                  <p className="mb-4">
                    Archer Fitness is open-source software distributed under the MIT License. The source code is 
                    available at{" "}
                    <a
                      href="https://github.com/AD-Archer/archer-fitness"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      https://github.com/AD-Archer/archer-fitness
                    </a>
                    . You may fork, modify, and distribute the software in accordance with the MIT License terms.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">9. Self-Hosting</h2>
                  <p className="mb-4">
                    If you choose to self-host Archer Fitness on your own infrastructure:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-1">
                    <li>You are responsible for maintaining the security and integrity of your installation</li>
                    <li>You are responsible for compliance with all applicable laws and regulations</li>
                    <li>The original creators are not liable for any issues arising from your self-hosted instance</li>
                    <li>You must maintain all copyright and attribution notices in the software</li>
                  </ul>

                  <h2 className="text-2xl font-semibold mb-4">10. Service Modifications and Interruptions</h2>
                  <p className="mb-4">
                    We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part 
                    thereof) with or without notice. We shall not be liable to you or any third party for any modification, 
                    suspension, or discontinuance of the Service.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
                  <p className="mb-4">
                    THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
                    TO THE FULLEST EXTENT PERMITTED BY LAW, ARCHER FITNESS AND ITS CREATORS DISCLAIM ALL WARRANTIES, 
                    INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
                    AND NON-INFRINGEMENT.
                  </p>
                  <p className="mb-4">
                    IN NO EVENT SHALL ARCHER FITNESS OR ITS CREATORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                    CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR 
                    GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
                  <p className="mb-4">
                    You agree to indemnify, defend, and hold harmless Archer Fitness and its creators from any claims, 
                    liabilities, damages, losses, and expenses, including reasonable attorneys&apos; fees, arising out of or 
                    in any way connected with your access to or use of the Service, your violation of these Terms, or 
                    your violation of any rights of another party.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">13. Data Backup</h2>
                  <p className="mb-4">
                    While we strive to maintain data integrity, you are responsible for maintaining backups of your data. 
                    We recommend regularly exporting your fitness and nutrition data using the export feature provided in 
                    the Service.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">14. Termination</h2>
                  <p className="mb-4">
                    We may terminate or suspend your account and access to the Service immediately, without prior notice 
                    or liability, for any reason, including without limitation if you breach these Terms. Upon termination, 
                    your right to use the Service will immediately cease.
                  </p>
                  <p className="mb-4">
                    You may delete your account at any time through the Privacy settings page. Upon account deletion, all 
                    your data will be permanently removed from our systems.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">15. Third-Party Services</h2>
                  <p className="mb-4">
                    The Service may contain links to third-party websites or services that are not owned or controlled by 
                    Archer Fitness. We have no control over, and assume no responsibility for, the content, privacy policies, 
                    or practices of any third-party websites or services.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">16. Governing Law</h2>
                  <p className="mb-4">
                    These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which 
                    the Service is hosted, without regard to its conflict of law provisions.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">17. Changes to Terms</h2>
                  <p className="mb-4">
                    We reserve the right to modify or replace these Terms at any time. If a revision is material, we will 
                    provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material 
                    change will be determined at our sole discretion.
                  </p>
                  <p className="mb-4">
                    By continuing to access or use our Service after any revisions become effective, you agree to be bound 
                    by the revised terms. If you do not agree to the new terms, you must stop using the Service.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">18. Severability</h2>
                  <p className="mb-4">
                    If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed 
                    and interpreted to accomplish the objectives of such provision to the greatest extent possible under 
                    applicable law, and the remaining provisions will continue in full force and effect.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">19. Entire Agreement</h2>
                  <p className="mb-4">
                    These Terms, together with our Privacy Policy, constitute the entire agreement between you and Archer 
                    Fitness regarding the Service and supersede all prior agreements and understandings.
                  </p>

                  <h2 className="text-2xl font-semibold mb-4">20. Contact Information</h2>
                  <p className="mb-4">
                    If you have any questions about these Terms of Service, please contact us through:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-1">
                    <li>GitHub Issues: <a
                      href="https://github.com/AD-Archer/archer-fitness/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      https://github.com/AD-Archer/archer-fitness/issues
                    </a></li>
                    <li>Developer Website: <a
                      href="https://www.antonioarcher.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      www.antonioarcher.com
                    </a></li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Terms Acceptance Dialog for authenticated users who haven't accepted */}
      <Dialog open={showAcceptanceDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[80vh]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Terms of Service Acceptance Required</DialogTitle>
            <DialogDescription>
              To continue using Archer Fitness, you must review and accept our terms of service.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-4">
            <div className="prose max-w-none text-sm">
              <p className="text-xs text-muted-foreground mb-4">
                Last Updated: October 5, 2025
              </p>

              <h2 className="text-lg font-semibold mb-2">Key Points</h2>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>This Service is provided &quot;as is&quot; without warranties</li>
                <li>You must be 13 years or older to use the Service</li>
                <li>Physical exercise involves inherent risks - consult a doctor before starting any fitness program</li>
                <li>This is not medical advice - always seek professional medical guidance</li>
                <li>You retain ownership of your data</li>
                <li>The Service is open-source and can be self-hosted</li>
                <li>We may modify or discontinue the Service at any time</li>
                <li>You are responsible for maintaining backups of your data</li>
              </ul>

              <p className="mb-4">
                Please visit the full{" "}
                <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
                  Terms of Service page
                </a>{" "}
                to read all terms in detail.
              </p>
            </div>
          </div>
          <div className="flex gap-4 justify-end mt-4">
            <Button variant="outline" onClick={handleRejectTerms} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Sign Out
            </Button>
            <Button onClick={handleAcceptTerms} disabled={isAccepting} className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              {isAccepting ? "Accepting..." : "Accept & Continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
