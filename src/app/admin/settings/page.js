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
import { Mail, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function Settings() {
  const { toast } = useToast();
  const [emailProvider, setEmailProvider] = useState("smtp");
  const [testEmail, setTestEmail] = useState("");

  const handleTestEmail = () => {
    toast({
      title: "Test Email Sent",
      description: `A test email has been sent to ${testEmail}`,
    });
  };

  const handleSaveEmailSettings = () => {
    toast({
      title: "Email Settings Saved",
      description: "Your email configuration has been updated successfully.",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-[#0B0B0D]">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your store settings</p>
        </div>
        <Card>
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
        </Card>
        <Card>
          <CardHeader>
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="provider">Provider</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              <TabsContent value="provider" className="space-y-4 mt-4">
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
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input id="smtp-host" placeholder="smtp.gmail.com" />
                    </div>
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
                    <div className="space-y-2">
                      <Label htmlFor="smtp-username">SMTP Username</Label>
                      <Input id="smtp-username" type="email" placeholder="your-email@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-password">SMTP Password</Label>
                      <Input id="smtp-password" type="password" placeholder="••••••••" />
                    </div>
                  </>
                )}
                {emailProvider === "resend" && (
                  <div className="space-y-2">
                    <Label htmlFor="resend-api-key">Resend API Key</Label>
                    <Input id="resend-api-key" type="password" placeholder="re_••••••••" />
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
                    <Input id="sendgrid-api-key" type="password" placeholder="SG.••••••••" />
                  </div>
                )}
                {emailProvider === "mailgun" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="mailgun-domain">Mailgun Domain</Label>
                      <Input id="mailgun-domain" placeholder="mg.yourdomain.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mailgun-api-key">Mailgun API Key</Label>
                      <Input id="mailgun-api-key" type="password" placeholder="key-••••••••" />
                    </div>
                  </>
                )}
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input id="from-name" placeholder="DRIPTYARD" defaultValue="DRIPTYARD" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input id="from-email" type="email" placeholder="noreply@driptyard.com" />
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
        <Card>
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
        </Card>
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
