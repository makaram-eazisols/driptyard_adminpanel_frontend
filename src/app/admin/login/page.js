"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notifyError, notifySuccess } from "@/lib/toast";
import { ShoppingCart, Loader2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { apiClient } from "@/lib/api-client";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const forgotPasswordStep1Schema = z.object({
  email: z.string().email("Invalid email address"),
});

const forgotPasswordStep2Schema = z.object({
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Login() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: OTP + password
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetErrors, setResetErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/admin");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    // Validate inputs
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      notifySuccess("Welcome back to the admin dashboard!");
      router.push("/admin");
    } catch (error) {
      const message = error.message || "Invalid email or password. Please try again.";
      setServerError(message);
      notifyError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordStep1 = async (e) => {
    e.preventDefault();
    setResetErrors({});

    // Validate email
    const result = forgotPasswordStep1Schema.safeParse({ email: resetEmail });
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setResetErrors(fieldErrors);
      return;
    }

    setIsResetting(true);
    try {
      await apiClient.requestPasswordReset(resetEmail);
      notifySuccess("Password reset code sent to your email");
      setResetStep(2);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to send reset code. Please try again.";
      setResetErrors({ server: message });
      notifyError(message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleForgotPasswordStep2 = async (e) => {
    e.preventDefault();
    setResetErrors({});

    // Validate inputs
    const result = forgotPasswordStep2Schema.safeParse({
      otp,
      newPassword,
      confirmPassword,
    });
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setResetErrors(fieldErrors);
      return;
    }

    setIsResetting(true);
    try {
      await apiClient.verifyPasswordReset(resetEmail, otp, newPassword);
      notifySuccess("Password reset successfully. Please sign in with your new password.");
      // Reset forgot password state
      setShowForgotPassword(false);
      setResetStep(1);
      setResetEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setResetErrors({});
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to reset password. Please try again.";
      setResetErrors({ server: message });
      notifyError(message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetStep(1);
    setResetEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetErrors({});
  };

  if (isLoading && !isSubmitting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#E0B74F' }}>
              <ShoppingCart className="h-8 w-8" strokeWidth={2.5} style={{ color: '#0B0B0D' }} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-playfair" style={{ color: '#0B0B0D' }}>
            DRIPTYARD Admin
          </CardTitle>
          <CardDescription>
            {showForgotPassword 
              ? resetStep === 1 
                ? "Enter your email to receive a password reset code"
                : "Enter the code sent to your email and set a new password"
              : "Sign in to access the admin dashboard (Admin & Moderator access)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@driptyard.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className={errors.password ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {/* {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )} */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-[#1F4E79] hover:text-[#0B0B0D] transition-colors  cursor-pointer"
                    disabled={isSubmitting}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full gradient-driptyard-hover text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              {/* {serverError && (
                <p className="text-sm text-destructive text-center">{serverError}</p>
              )} */}
            </form>
          ) : resetStep === 1 ? (
            <form onSubmit={handleForgotPasswordStep1} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="admin@driptyard.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isResetting}
                  className={resetErrors.email ? "border-destructive" : ""}
                />
                {resetErrors.email && (
                  <p className="text-sm text-destructive">{resetErrors.email}</p>
                )}
              </div>
              {resetErrors.server && (
                <p className="text-sm text-destructive text-center">{resetErrors.server}</p>
              )}
              <Button
                type="submit"
                className="w-full gradient-driptyard-hover text-white cursor-pointer"
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Code"
                )}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-sm text-[#1F4E79] hover:text-[#0B0B0D] transition-colors cursor-pointer"
                  disabled={isResetting}
                >
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPasswordStep2} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Reset Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtp(value);
                  }}
                  disabled={isResetting}
                  className={resetErrors.otp ? "border-destructive" : ""}
                  maxLength={6}
                />
                {resetErrors.otp && (
                  <p className="text-sm text-destructive">{resetErrors.otp}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Code sent to {resetEmail}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isResetting}
                    className={resetErrors.newPassword ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    disabled={isResetting}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {resetErrors.newPassword && (
                  <p className="text-sm text-destructive">{resetErrors.newPassword}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isResetting}
                    className={resetErrors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    disabled={isResetting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {resetErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{resetErrors.confirmPassword}</p>
                )}
              </div>
              {resetErrors.server && (
                <p className="text-sm text-destructive text-center">{resetErrors.server}</p>
              )}
              <Button
                type="submit"
                className="w-full gradient-driptyard-hover text-white cursor-pointer"
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-sm text-[#1F4E79] hover:text-[#0B0B0D] transition-colors cursor-pointer"
                  disabled={isResetting}
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
