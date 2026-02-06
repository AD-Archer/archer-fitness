"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Chrome, X } from "lucide-react";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!privacyAccepted) {
      setError("You must accept the privacy policy to create an account");
      setIsLoading(false);
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the terms of service to create an account");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          "Account created but sign in failed. Please try signing in manually.",
        );
      } else {
        router.push("/");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          {/* Logo and Navigation */}
          <div className="flex flex-col items-center space-y-4">
            <Link href="/" className="transition-transform hover:scale-105">
              <Image
                src="/android-chrome-512x512.png"
                alt="Archer Fitness Logo"
                width={120}
                height={120}
                className="rounded-2xl shadow-lg"
                priority
              />
            </Link>
          </div>

          <Card className="w-full">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Create an account
              </CardTitle>
              <CardDescription className="text-center">
                Enter your information to create your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                variant="outline"
                type="button"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="privacyAccept"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="privacyAccept"
                    className="text-sm font-normal leading-tight cursor-pointer"
                  >
                    I have read and accept the{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="font-medium text-blue-600 hover:text-blue-500 underline"
                    >
                      Privacy Policy
                    </button>
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="termsAccept"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="termsAccept"
                    className="text-sm font-normal leading-tight cursor-pointer"
                  >
                    I have read and accept the{" "}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="font-medium text-blue-600 hover:text-blue-500 underline"
                    >
                      Terms of Service
                    </button>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !privacyAccepted || !termsAccepted}
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <p className="text-center text-sm text-gray-600 w-full">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Privacy Policy
            </DialogTitle>
            <DialogDescription>
              Your privacy is important to us. Please read this policy carefully
              before creating an account.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="prose max-w-none">
              <h2 className="text-xl font-semibold mb-4">
                What Data We Collect
              </h2>
              <p className="mb-4">
                Archer Fitness collects the following types of data to provide
                you with personalized fitness and nutrition tracking:
              </p>

              <h3 className="text-lg font-medium mb-2">Account Information</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Name, email address, and password</li>
                <li>Profile picture (if provided)</li>
                <li>Account creation and last update timestamps</li>
                <li>Authentication provider data (Google, etc.)</li>
                <li>Session tokens and verification tokens</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">
                Personal Fitness Profile
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Height, weight, age, gender</li>
                <li>Fitness goals and objectives</li>
                <li>Activity level and experience level</li>
                <li>Weight tracking history with dates and notes</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Workout Data</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Workout templates (custom and AI-generated)</li>
                <li>Workout sessions with start/end times and duration</li>
                <li>
                  Exercise performance data (sets, reps, weights, rest times)
                </li>
                <li>Exercise completion status and perfection scores</li>
                <li>Workout notes and progress tracking</li>
                <li>Saved workout states for resuming paused sessions</li>
                <li>Completed workout days calendar</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Nutrition Data</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Daily nutrition logs (calories, protein, carbs, fat)</li>
                <li>Meal entries with detailed food composition</li>
                <li>Custom foods and recipes with nutritional information</li>
                <li>Meal planning and scheduling data</li>
                <li>Food database usage and custom food additions</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Schedule Data</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Weekly workout and meal schedules</li>
                <li>Schedule templates for recurring plans</li>
                <li>Calendar integration for planned activities</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">
                Preferences and Settings
              </h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>App preferences (theme, units, notifications)</li>
                <li>Workout preferences (difficulty, equipment, duration)</li>
                <li>
                  Nutrition preferences (daily targets, dietary restrictions)
                </li>
                <li>Notification settings and schedules</li>
                <li>Admin notification preferences for error reporting</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Technical Data</h3>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Push notification subscriptions</li>
                <li>Authentication tokens and sessions</li>
                <li>Anonymous usage analytics (if enabled)</li>
                <li>Error reports and crash logs (if enabled)</li>
                <li>Device and browser information for compatibility</li>
              </ul>

              <h2 className="text-xl font-semibold mb-4">
                How We Use Your Data
              </h2>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>
                  To provide personalized fitness and nutrition recommendations
                </li>
                <li>To track your progress and generate performance reports</li>
                <li>To send notifications and reminders for workouts/meals</li>
                <li>To calculate nutrition targets based on your profile</li>
                <li>To generate AI-powered workout and meal plans</li>
                <li>To improve our app through anonymous analytics</li>
                <li>To troubleshoot issues and provide technical support</li>
                <li>
                  To maintain account security and prevent unauthorized access
                </li>
              </ul>

              <h2 className="text-xl font-semibold mb-4">Data Security</h2>
              <p className="mb-4">
                We take data security seriously. All data is encrypted in
                transit and at rest. We use industry-standard security practices
                including secure authentication, data encryption, and regular
                security audits to protect your information.
              </p>

              <h2 className="text-xl font-semibold mb-4">Data Sharing</h2>
              <p className="mb-4">
                We do not sell your personal data to third parties. We may share
                anonymous, aggregated data for research purposes only if you
                explicitly opt-in to data sharing. Your data is never shared
                with advertisers or marketing companies.
              </p>

              <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Access your data at any time through the app</li>
                <li>Export your data in JSON format</li>
                <li>Delete your account and all associated data permanently</li>
                <li>Opt-out of data sharing and analytics at any time</li>
                <li>Update your preferences and notification settings</li>
                <li>Request data correction or deletion</li>
              </ul>
            </div>
          </ScrollArea>
          <div className="flex gap-4 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowPrivacyModal(false)}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Terms of Service
            </DialogTitle>
            <DialogDescription>
              Please read these terms carefully before creating an account.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="prose max-w-none">
              <p className="text-sm text-muted-foreground mb-4">
                Last Updated: October 5, 2025
              </p>

              <h2 className="text-xl font-semibold mb-4">Key Points</h2>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>
                  This Service is provided &quot;as is&quot; without warranties
                </li>
                <li>
                  Physical exercise involves inherent risks - consult a doctor
                  before starting
                </li>
                <li>
                  This is not medical advice - always seek professional medical
                  guidance
                </li>
                <li>You retain ownership of your data</li>
                <li>The Service is open-source and can be self-hosted</li>
                <li>We may modify or discontinue the Service at any time</li>
                <li>
                  You are responsible for maintaining backups of your data
                </li>
              </ul>

              <h2 className="text-xl font-semibold mb-4">Medical Disclaimer</h2>
              <p className="mb-4 font-semibold text-red-600">
                IMPORTANT: Archer Fitness is not a medical service and does not
                provide medical advice.
              </p>
              <p className="mb-4">
                The fitness and nutrition information provided is for
                informational purposes only. Always seek the advice of your
                physician before starting any fitness program.
              </p>

              <h2 className="text-xl font-semibold mb-4">Assumption of Risk</h2>
              <p className="mb-4">
                You acknowledge that physical exercise involves inherent risks
                of injury. By using this Service, you voluntarily assume all
                such risks and release Archer Fitness from liability.
              </p>

              <p className="mb-4">
                For the complete terms, please visit our{" "}
                <a
                  href="/terms"
                  target="_blank"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Terms of Service page
                </a>
                .
              </p>
            </div>
          </ScrollArea>
          <div className="flex gap-4 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowTermsModal(false)}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
