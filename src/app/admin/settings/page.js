"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, CheckCircle, Eye, EyeOff, Lock, Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notifySuccess } from "@/lib/toast";

function Settings() {
  const { user } = useAuth();
  const [emailProvider, setEmailProvider] = useState("smtp");
  const [testEmail, setTestEmail] = useState("");
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showResendApiKey, setShowResendApiKey] = useState(false);
  const [showSendgridApiKey, setShowSendgridApiKey] = useState(false);
  const [showMailgunApiKey, setShowMailgunApiKey] = useState(false);
  
  // Password reset states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleTestEmail = () => {
    notifySuccess(`A test email has been sent to ${testEmail}`);
  };

  const handleSaveEmailSettings = () => {
    notifySuccess("Your email configuration has been updated successfully.");
  };

  const handleChangePassword = async () => {
    setPasswordErrors({});
    setErrorMessage("");
    
    // Validation
    if (!user?.email) {
      setErrorMessage("User email not found. Please log in again.");
      return;
    }
    
    if (!currentPassword) {
      setPasswordErrors({ currentPassword: "Current password is required" });
      return;
    }
    
    if (!newPassword) {
      setPasswordErrors({ newPassword: "New password is required" });
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordErrors({ newPassword: "Password must be at least 8 characters" });
      return;
    }

    if (newPassword.length > 15) {
      setPasswordErrors({ newPassword: "Password must be at most 15 characters" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    
    if (currentPassword === newPassword) {
      setPasswordErrors({ newPassword: "New password must be different from current password" });
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.verifyPasswordResetAdmin(
        user.email,
        newPassword,
        currentPassword
      );
      notifySuccess("Your password has been reset successfully.");
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
      setErrorMessage("");
    } catch (error) {
      // Check for message field first, then detail, then fallback
      const apiMessage = error.response?.data?.message;
      const apiDetail = error.response?.data?.detail;
      const errorMsg = apiMessage || apiDetail || error.message || "Failed to reset password";
      
      if (errorMsg.toLowerCase().includes("current password") || errorMsg.toLowerCase().includes("incorrect")) {
        const displayMessage = apiMessage || "Current password is incorrect";
        setErrorMessage(displayMessage);
        setPasswordErrors({ currentPassword: displayMessage });
      } else {
        setErrorMessage(errorMsg);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your store settings</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle style={{ color: "#E74C3C" }}>Error</AlertTitle>
                <AlertDescription style={{ color: "#E74C3C" }}>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined }));
                    }
                    if (errorMessage) {
                      setErrorMessage("");
                    }
                  }}
                  className="pr-10"
                  style={passwordErrors.currentPassword ? { borderColor: "#E74C3C" } : {}}
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isChangingPassword}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-sm" style={{ color: "#E74C3C" }}>{passwordErrors.currentPassword}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordErrors.newPassword) {
                      setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }));
                    }
                    if (passwordErrors.confirmPassword && e.target.value === confirmPassword) {
                      setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                    if (errorMessage) {
                      setErrorMessage("");
                    }
                  }}
                  className="pr-10"
                  style={passwordErrors.newPassword ? { borderColor: "#E74C3C" } : {}}
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isChangingPassword}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-sm" style={{ color: "#E74C3C" }}>{passwordErrors.newPassword}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Password must be between 8 and 15 characters long
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                    if (errorMessage) {
                      setErrorMessage("");
                    }
                  }}
                  className="pr-10"
                  style={passwordErrors.confirmPassword ? { borderColor: "#E74C3C" } : {}}
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isChangingPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-sm" style={{ color: "#E74C3C" }}>{passwordErrors.confirmPassword}</p>
              )}
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="gradient-driptyard-hover text-white shadow-md"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Configure email service provider and notification templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="provider" className="w-full">
              {/* <TabsList className="grid w-full grid-cols-3"> */}
                {/* <TabsTrigger value="provider">Provider</TabsTrigger> */}
                {/* <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger> */}
              {/* </TabsList> */}
              <TabsContent value="provider" className="space-y-4 ">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-provider">Email Service Provider</Label>
                    <Select value={emailProvider} onValueChange={setEmailProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smtp">SMTP</SelectItem>
                        <SelectItem value="resend">Resend</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {emailProvider === "smtp" && (
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input id="smtp-host" placeholder="smtp.gmail.com" />
                    </div>
                  )}
                </div>
                {emailProvider === "smtp" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">SMTP Port</Label>
                        <Input id="smtp-port" type="number" placeholder="587" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-encryption">Encryption</Label>
                        <Select defaultValue="tls">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tls">TLS</SelectItem>
                            <SelectItem value="ssl">SSL</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-username">SMTP Username</Label>
                        <Input id="smtp-username" type="email" placeholder="your-email@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-password">SMTP Password</Label>
                        <div className="relative">
                          <Input 
                            id="smtp-password" 
                            type={showSmtpPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showSmtpPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {emailProvider === "resend" && (
                  <div className="space-y-2">
                    <Label htmlFor="resend-api-key">Resend API Key</Label>
                    <div className="relative">
                      <Input 
                        id="resend-api-key" 
                        type={showResendApiKey ? "text" : "password"} 
                        placeholder="re_••••••••" 
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResendApiKey(!showResendApiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showResendApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get your API key from{" "}
                      <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        resend.com/api-keys
                      </a>
                    </p>
                  </div>
                )}
                {emailProvider === "sendgrid" && (
                  <div className="space-y-2">
                    <Label htmlFor="sendgrid-api-key">SendGrid API Key</Label>
                    <div className="relative">
                      <Input 
                        id="sendgrid-api-key" 
                        type={showSendgridApiKey ? "text" : "password"} 
                        placeholder="SG.••••••••" 
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSendgridApiKey(!showSendgridApiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showSendgridApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {emailProvider === "mailgun" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mailgun-domain">Mailgun Domain</Label>
                        <Input id="mailgun-domain" placeholder="mg.yourdomain.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mailgun-api-key">Mailgun API Key</Label>
                        <div className="relative">
                          <Input 
                            id="mailgun-api-key" 
                            type={showMailgunApiKey ? "text" : "password"} 
                            placeholder="key-••••••••" 
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowMailgunApiKey(!showMailgunApiKey)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showMailgunApiKey ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from-name">From Name</Label>
                    <Input id="from-name" placeholder="DRIPTYARD" defaultValue="DRIPTYARD" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-email">From Email</Label>
                    <Input id="from-email" type="email" placeholder="noreply@driptyard.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reply-to">Reply-To Email</Label>
                  <Input id="reply-to" type="email" placeholder="support@driptyard.com" />
                </div>
                <Separator />
                <div className="space-y-3">
                  <Label>Test Email Configuration</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="test@example.com" 
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                    <Button 
                      onClick={handleTestEmail}
                      variant="outline"
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Send Test
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Send a test email to verify your configuration
                  </p>
                </div>
                <Button onClick={handleSaveEmailSettings} className="gradient-driptyard-hover text-white shadow-md w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Email Settings
                </Button>
              </TabsContent>
              <TabsContent value="templates" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcome-subject">Welcome Email Subject</Label>
                    <Input id="welcome-subject" defaultValue="Welcome to DRIPTYARD!" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="welcome-template">Welcome Email Template</Label>
                    <Textarea 
                      id="welcome-template" 
                      rows={6}
                      defaultValue="Hi {{name}},\n\nWelcome to DRIPTYARD! We're excited to have you join our community of sneaker enthusiasts.\n\nStart exploring exclusive drops and rare finds today!\n\nBest regards,\nThe DRIPTYARD Team"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="order-subject">Order Confirmation Subject</Label>
                    <Input id="order-subject" defaultValue="Your DRIPTYARD Order #{{order_id}}" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order-template">Order Confirmation Template</Label>
                    <Textarea 
                      id="order-template" 
                      rows={6}
                      defaultValue="Hi {{name}},\n\nThanks for your order! We've received your order #{{order_id}}.\n\nOrder Total: ${{total}}\n\nWe'll send you another email once your items ship.\n\nThe DRIPTYARD Team"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="payout-subject">Payout Approved Subject</Label>
                    <Input id="payout-subject" defaultValue="Your Payout Has Been Approved" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payout-template">Payout Approved Template</Label>
                    <Textarea 
                      id="payout-template" 
                      rows={6}
                      defaultValue="Hi {{seller_name}},\n\nGreat news! Your payout request of ${{amount}} has been approved.\n\nThe funds will be transferred to your account within 2-3 business days.\n\nThe DRIPTYARD Team"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Available variables: {'{{'} name {'}}'}, {'{{'} email {'}}'}, {'{{'} order_id {'}}'}, {'{{'} total {'}}'}, {'{{'} amount {'}}'}, {'{{'} seller_name {'}}'}
                  </p>
                  <Button className="gradient-driptyard-hover text-white shadow-md w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Email Templates
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="notifications" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New User Registration</Label>
                      <p className="text-sm text-muted-foreground">Send welcome email to new users</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Order Confirmation</Label>
                      <p className="text-sm text-muted-foreground">Send confirmation email after order placement</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Order Shipped</Label>
                      <p className="text-sm text-muted-foreground">Notify customers when order ships</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payout Approved</Label>
                      <p className="text-sm text-muted-foreground">Notify sellers when payout is approved</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Business Verification</Label>
                      <p className="text-sm text-muted-foreground">Notify sellers about verification status</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Product Spotlight</Label>
                      <p className="text-sm text-muted-foreground">Notify sellers when product is featured</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Appeal Decision</Label>
                      <p className="text-sm text-muted-foreground">Notify sellers about appeal outcomes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Account Banned</Label>
                      <p className="text-sm text-muted-foreground">Send notification when account is banned</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Button className="gradient-driptyard-hover text-white shadow-md w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </div>
        {/* <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input id="store-name" defaultValue="DRIPTYARD" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-email">Contact Email</Label>
              <Input id="store-email" type="email" defaultValue="contact@driptyard.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-phone">Phone Number</Label>
              <Input id="store-phone" type="tel" defaultValue="+1 (555) 123-4567" />
            </div>
            <Button className="gradient-driptyard-hover text-white shadow-md">
              Save Changes
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Order Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications for new orders</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when products are low in stock</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">Receive weekly performance reports</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card> */}
   
        {/* <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" defaultValue="USD ($)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Tax Rate (%)</Label>
              <Input id="tax-rate" type="number" defaultValue="8.5" />
            </div>
            <Button className="gradient-driptyard-hover text-white shadow-md">
              Update Payment Settings
            </Button>
          </CardContent>
        </Card> */}
      </div>
    </AdminLayout>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  );
}
