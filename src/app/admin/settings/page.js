"use client";

import { useEffect, useState } from "react";
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
import { Mail, Send, CheckCircle, Eye, EyeOff, Lock, Loader2, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notifyError, notifySuccess } from "@/lib/toast";
import { MembershipSettingsSection } from "@/components/admin/MembershipSettingsSection";

function Settings() {
  const { user } = useAuth();
  const [emailProvider, setEmailProvider] = useState("smtp");
  const [testEmail, setTestEmail] = useState("");
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showResendApiKey, setShowResendApiKey] = useState(false);
  const [showSendgridApiKey, setShowSendgridApiKey] = useState(false);
  const [showMailgunApiKey, setShowMailgunApiKey] = useState(false);
  const [showStripeSecretKey, setShowStripeSecretKey] = useState(false);
  const [showStripeWebhookSecret, setShowStripeWebhookSecret] = useState(false);
  const [showEasyparcelClientSecret, setShowEasyparcelClientSecret] = useState(false);
  const [showEasyparcelEncryptionKey, setShowEasyparcelEncryptionKey] = useState(false);
  const [showGoogleClientSecret, setShowGoogleClientSecret] = useState(false);
  const [showGoogleMapApiKey, setShowGoogleMapApiKey] = useState(false);
  
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
  const [promoCodes, setPromoCodes] = useState([]);
  const [isLoadingPromoCodes, setIsLoadingPromoCodes] = useState(false);
  const [isSavingPromoCode, setIsSavingPromoCode] = useState(false);
  const [educationalTips, setEducationalTips] = useState([]);
  const [isLoadingEducationalTips, setIsLoadingEducationalTips] = useState(false);
  const [isSavingEducationalTip, setIsSavingEducationalTip] = useState(false);
  const [editingTipId, setEditingTipId] = useState(null);
  const [educationalTipForm, setEducationalTipForm] = useState({
    title: "",
    content: "",
    is_active: true,
  });
  const [platformFees, setPlatformFees] = useState({
    buyer_fee_percentage: "",
    seller_fee_percentage: "",
    seller_stripe_fee_percentage: "",
  });
  const [isSavingPlatformFees, setIsSavingPlatformFees] = useState(false);
  const [isSavingIntegrations, setIsSavingIntegrations] = useState(false);
  const [integrationSettings, setIntegrationSettings] = useState({
    stripe_publish_key: "",
    stripe_secret_key: "",
    stripe_webhook_secret: "",
    easyparcel_client_id: "",
    easyparcel_client_secret: "",
    easyparcel_auth_url: "https://api.easyparcel.com/oauth/login",
    easyparcel_token_url: "https://api.easyparcel.com/oauth/token",
    easyparcel_api_base_url: "https://api.easyparcel.com",
    easyparcel_redirect_uri: "",
    easyparcel_encryption_key: "",
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_password: "",
    smtp_tls: true,
    email_from_name: "Driptyard",
    email_from_address: "noreply@driptyard.com",
    google_client_id: "",
    google_client_secret: "",
    google_map_api_key: "",
  });
  const [promoForm, setPromoForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    start_date: "",
    end_date: "",
    max_uses: "",
    is_active: true,
  });

  const loadPromoCodes = async () => {
    setIsLoadingPromoCodes(true);
    try {
      const data = await apiClient.getPromoCodes();
      setPromoCodes(Array.isArray(data) ? data : []);
    } catch (error) {
      notifyError(error?.response?.data?.message || "Failed to load promo codes.");
    } finally {
      setIsLoadingPromoCodes(false);
    }
  };

  const loadEducationalTips = async () => {
    setIsLoadingEducationalTips(true);
    try {
      const data = await apiClient.getEducationalTips();
      setEducationalTips(Array.isArray(data) ? data : []);
    } catch (error) {
      notifyError(error?.response?.data?.message || "Failed to load educational tips.");
    } finally {
      setIsLoadingEducationalTips(false);
    }
  };

  useEffect(() => {
    loadPromoCodes();
    loadEducationalTips();
    const loadIntegrationSettings = async () => {
      try {
        const config = await apiClient.getIntegrationSettings();
        setIntegrationSettings((prev) => ({ ...prev, ...config }));
      } catch (error) {
        notifyError(error?.response?.data?.message || "Failed to load integration settings.");
      }
    };
    const loadPlatformFees = async () => {
      try {
        const fees = await apiClient.getPlatformFees();
        setPlatformFees({
          buyer_fee_percentage: String(fees?.buyer_fee_percentage ?? "0"),
          seller_fee_percentage: String(fees?.seller_fee_percentage ?? "0"),
          seller_stripe_fee_percentage: String(fees?.seller_stripe_fee_percentage ?? "2.9"),
        });
      } catch (error) {
        notifyError(error?.response?.data?.message || "Failed to load platform fee settings.");
      }
    };
    loadPlatformFees();
    loadIntegrationSettings();
  }, []);

  const resetEducationalTipForm = () => {
    setEducationalTipForm({
      title: "",
      content: "",
      is_active: true,
    });
    setEditingTipId(null);
  };

  const handleSaveEducationalTip = async () => {
    const title = educationalTipForm.title.trim();
    const content = educationalTipForm.content.trim();
    if (!title || !content) {
      notifyError("Tip title and content are required.");
      return;
    }

    setIsSavingEducationalTip(true);
    try {
      if (editingTipId) {
        await apiClient.updateEducationalTip(editingTipId, {
          title,
          content,
          is_active: educationalTipForm.is_active,
        });
        notifySuccess("Educational tip updated.");
      } else {
        await apiClient.createEducationalTip({
          title,
          content,
          is_active: educationalTipForm.is_active,
        });
        notifySuccess("Educational tip created.");
      }
      resetEducationalTipForm();
      await loadEducationalTips();
    } catch (error) {
      notifyError(error?.response?.data?.message || "Failed to save educational tip.");
    } finally {
      setIsSavingEducationalTip(false);
    }
  };

  const handleEditEducationalTip = (tip) => {
    setEditingTipId(tip.id);
    setEducationalTipForm({
      title: tip.title || "",
      content: tip.content || "",
      is_active: !!tip.is_active,
    });
  };

  const handleDeleteEducationalTip = async (tipId) => {
    try {
      await apiClient.deleteEducationalTip(tipId);
      notifySuccess("Educational tip deleted.");
      if (editingTipId === tipId) {
        resetEducationalTipForm();
      }
      await loadEducationalTips();
    } catch (error) {
      notifyError(error?.response?.data?.message || "Failed to delete educational tip.");
    }
  };

  const handleToggleEducationalTipStatus = async (tip) => {
    try {
      await apiClient.updateEducationalTip(tip.id, { is_active: !tip.is_active });
      notifySuccess("Educational tip status updated.");
      await loadEducationalTips();
    } catch (error) {
      notifyError(error?.response?.data?.message || "Failed to update tip status.");
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      notifyError("Please enter a test email address.");
      return;
    }
    try {
      await apiClient.sendIntegrationTestEmail(testEmail);
      notifySuccess(`A test email has been sent to ${testEmail}`);
    } catch (error) {
      notifyError(error?.response?.data?.message || "Failed to send test email.");
    }
  };

  const handleSaveIntegrations = async () => {
    setIsSavingIntegrations(true);
    try {
      await apiClient.updateIntegrationSettings(integrationSettings);
      notifySuccess("Integration settings have been updated successfully.");
    } catch (error) {
      notifyError(error?.response?.data?.message || "Failed to update integration settings.");
    } finally {
      setIsSavingIntegrations(false);
    }
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

  const handleCreatePromoCode = async () => {
    const code = promoForm.code.trim().toUpperCase();
    if (!code) {
      notifyError("Promo code is required.");
      return;
    }
    if (!promoForm.discount_value || Number(promoForm.discount_value) <= 0) {
      notifyError("Discount value must be greater than 0.");
      return;
    }

    setIsSavingPromoCode(true);
    try {
      await apiClient.createPromoCode({
        code,
        discount_type: promoForm.discount_type,
        discount_value: Number(promoForm.discount_value),
        start_date: promoForm.start_date ? new Date(promoForm.start_date).toISOString() : null,
        end_date: promoForm.end_date ? new Date(promoForm.end_date).toISOString() : null,
        max_uses: promoForm.max_uses ? Number(promoForm.max_uses) : null,
        is_active: promoForm.is_active,
      });
      notifySuccess("Promo code created successfully.");
      setPromoForm({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        start_date: "",
        end_date: "",
        max_uses: "",
        is_active: true,
      });
      await loadPromoCodes();
    } catch (error) {
      notifyError(error?.response?.data?.message || "Failed to create promo code.");
    } finally {
      setIsSavingPromoCode(false);
    }
  };

  const togglePromoCodeStatus = async (promo) => {
    try {
      await apiClient.updatePromoCode(promo.id, { is_active: !promo.is_active });
      notifySuccess("Promo code updated.");
      await loadPromoCodes();
    } catch (error) {
      notifyError(error?.response?.data?.message || "Failed to update promo code.");
    }
  };

  const savePlatformFees = async () => {
    const buyerFee = Number(platformFees.buyer_fee_percentage);
    const sellerFee = Number(platformFees.seller_fee_percentage);
    const sellerStripeFee = Number(platformFees.seller_stripe_fee_percentage);
    if (!Number.isFinite(buyerFee) || buyerFee < 0 || buyerFee > 100) {
      notifyError("Buyer fee must be between 0 and 100.");
      return;
    }
    if (!Number.isFinite(sellerFee) || sellerFee < 0 || sellerFee > 100) {
      notifyError("Seller fee must be between 0 and 100.");
      return;
    }
    if (!Number.isFinite(sellerStripeFee) || sellerStripeFee < 0 || sellerStripeFee > 100) {
      notifyError("Seller Stripe fee must be between 0 and 100.");
      return;
    }

    setIsSavingPlatformFees(true);
    try {
      await apiClient.updatePlatformFees({
        buyer_fee_percentage: buyerFee,
        seller_fee_percentage: sellerFee,
        seller_stripe_fee_percentage: sellerStripeFee,
      });
      notifySuccess("Platform fees updated successfully.");
    } catch (error) {
      notifyError(error?.response?.data?.message || "Failed to update platform fee settings.");
    } finally {
      setIsSavingPlatformFees(false);
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
          <CardHeader>
            <CardTitle>Educational Tips</CardTitle>
            <CardDescription>
              Manage in-app educational notifications shown to users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="educational-tip-title">Title</Label>
              <Input
                id="educational-tip-title"
                placeholder="Tip title"
                value={educationalTipForm.title}
                onChange={(e) => setEducationalTipForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="educational-tip-content">Content</Label>
              <Textarea
                id="educational-tip-content"
                rows={4}
                placeholder="Tip content"
                value={educationalTipForm.content}
                onChange={(e) => setEducationalTipForm((prev) => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={educationalTipForm.is_active}
                  onCheckedChange={(value) => setEducationalTipForm((prev) => ({ ...prev, is_active: !!value }))}
                />
                <Label>Enabled</Label>
              </div>
              <div className="flex items-center gap-2">
                {editingTipId && (
                  <Button variant="outline" onClick={resetEducationalTipForm}>
                    Cancel Edit
                  </Button>
                )}
                <Button
                  onClick={handleSaveEducationalTip}
                  disabled={isSavingEducationalTip}
                  className="gradient-driptyard-hover text-white shadow-md"
                >
                  {isSavingEducationalTip ? "Saving..." : editingTipId ? "Update Tip" : "Create Tip"}
                </Button>
              </div>
            </div>

            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Existing Educational Tips</h3>
              {isLoadingEducationalTips ? (
                <p className="text-sm text-muted-foreground">Loading educational tips...</p>
              ) : educationalTips.length === 0 ? (
                <p className="text-sm text-muted-foreground">No educational tips yet.</p>
              ) : (
                <div className="space-y-2">
                  {educationalTips.map((tip) => (
                    <div key={tip.id} className="border border-border rounded-md p-3 flex items-start justify-between gap-4">
                      <div className="text-sm">
                        <p className="font-semibold">{tip.title}</p>
                        <p className="text-muted-foreground line-clamp-2">{tip.content}</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          Status: {tip.is_active ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleEditEducationalTip(tip)}>
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleToggleEducationalTipStatus(tip)}>
                          {tip.is_active ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteEducationalTip(tip.id)}>
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <MembershipSettingsSection />
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Google Maps Configuration</CardTitle>
            <CardDescription>
              Configure the Google Maps API key used for address autocomplete across storefront and checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google-map-api-key">Google Maps API Key</Label>
              <div className="relative">
                <Input
                  id="google-map-api-key"
                  type={showGoogleMapApiKey ? "text" : "password"}
                  className="pr-10"
                  value={integrationSettings.google_map_api_key || ""}
                  onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, google_map_api_key: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowGoogleMapApiKey(!showGoogleMapApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showGoogleMapApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handleSaveIntegrations} disabled={isSavingIntegrations} className="gradient-driptyard-hover text-white shadow-md">
              {isSavingIntegrations ? "Saving..." : "Save Google Maps Settings"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Google OAuth Configuration</CardTitle>
            <CardDescription>
              Configure Google login credentials used by backend authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="google-client-id">Google Client ID</Label>
                <Input
                  id="google-client-id"
                  value={integrationSettings.google_client_id || ""}
                  onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, google_client_id: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="google-client-secret">Google Client Secret</Label>
                <div className="relative">
                  <Input
                    id="google-client-secret"
                    type={showGoogleClientSecret ? "text" : "password"}
                    className="pr-10"
                    value={integrationSettings.google_client_secret || ""}
                    onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, google_client_secret: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGoogleClientSecret(!showGoogleClientSecret)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showGoogleClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <Button onClick={handleSaveIntegrations} disabled={isSavingIntegrations} className="gradient-driptyard-hover text-white shadow-md">
              {isSavingIntegrations ? "Saving..." : "Save Google Settings"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Stripe & EasyParcel Configuration</CardTitle>
            <CardDescription>
              Configure live credentials used by checkout, webhook, and EasyParcel APIs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stripe-publish-key">Stripe Publishable Key</Label>
                <Input id="stripe-publish-key" value={integrationSettings.stripe_publish_key || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, stripe_publish_key: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe-secret-key">Stripe Secret Key</Label>
                <div className="relative">
                  <Input id="stripe-secret-key" type={showStripeSecretKey ? "text" : "password"} className="pr-10" value={integrationSettings.stripe_secret_key || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, stripe_secret_key: e.target.value }))} />
                  <button type="button" onClick={() => setShowStripeSecretKey(!showStripeSecretKey)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showStripeSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe-webhook-secret">Stripe Webhook Secret</Label>
                <div className="relative">
                  <Input id="stripe-webhook-secret" type={showStripeWebhookSecret ? "text" : "password"} className="pr-10" value={integrationSettings.stripe_webhook_secret || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, stripe_webhook_secret: e.target.value }))} />
                  <button type="button" onClick={() => setShowStripeWebhookSecret(!showStripeWebhookSecret)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showStripeWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep-client-id">EasyParcel Client ID</Label>
                <Input id="ep-client-id" value={integrationSettings.easyparcel_client_id || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, easyparcel_client_id: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep-client-secret">EasyParcel Client Secret</Label>
                <div className="relative">
                  <Input id="ep-client-secret" type={showEasyparcelClientSecret ? "text" : "password"} className="pr-10" value={integrationSettings.easyparcel_client_secret || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, easyparcel_client_secret: e.target.value }))} />
                  <button type="button" onClick={() => setShowEasyparcelClientSecret(!showEasyparcelClientSecret)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showEasyparcelClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep-redirect-uri">EasyParcel Redirect URI</Label>
                <Input id="ep-redirect-uri" value={integrationSettings.easyparcel_redirect_uri || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, easyparcel_redirect_uri: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep-token-url">EasyParcel Token URL</Label>
                <Input id="ep-token-url" value={integrationSettings.easyparcel_token_url || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, easyparcel_token_url: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep-api-base-url">EasyParcel API Base URL</Label>
                <Input id="ep-api-base-url" value={integrationSettings.easyparcel_api_base_url || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, easyparcel_api_base_url: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep-encryption-key">EasyParcel Encryption Key</Label>
                <div className="relative">
                  <Input id="ep-encryption-key" type={showEasyparcelEncryptionKey ? "text" : "password"} className="pr-10" value={integrationSettings.easyparcel_encryption_key || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, easyparcel_encryption_key: e.target.value }))} />
                  <button type="button" onClick={() => setShowEasyparcelEncryptionKey(!showEasyparcelEncryptionKey)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showEasyparcelEncryptionKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
            </div>
            <Button onClick={handleSaveIntegrations} disabled={isSavingIntegrations} className="gradient-driptyard-hover text-white shadow-md">
              {isSavingIntegrations ? "Saving..." : "Save Stripe & EasyParcel"}
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
                      <Input id="smtp-host" placeholder="smtp.gmail.com" value={integrationSettings.smtp_host || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, smtp_host: e.target.value }))} />
                    </div>
                  )}
                </div>
                {emailProvider === "smtp" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">SMTP Port</Label>
                        <Input id="smtp-port" type="number" placeholder="587" value={integrationSettings.smtp_port || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, smtp_port: Number(e.target.value || 0) }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-encryption">Encryption</Label>
                        <Select value={integrationSettings.smtp_tls ? "tls" : "ssl"} onValueChange={(value) => setIntegrationSettings((prev) => ({ ...prev, smtp_tls: value === "tls" }))}>
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
                        <Input id="smtp-username" type="email" placeholder="your-email@example.com" value={integrationSettings.smtp_user || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, smtp_user: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-password">SMTP Password</Label>
                        <div className="relative">
                          <Input 
                            id="smtp-password" 
                            type={showSmtpPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="pr-10"
                            value={integrationSettings.smtp_password || ""}
                            onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, smtp_password: e.target.value }))}
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
                    <Input id="from-name" placeholder="DRIPTYARD" value={integrationSettings.email_from_name || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, email_from_name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-email">From Email</Label>
                    <Input id="from-email" type="email" placeholder="noreply@driptyard.com" value={integrationSettings.email_from_address || ""} onChange={(e) => setIntegrationSettings((prev) => ({ ...prev, email_from_address: e.target.value }))} />
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
                <Button onClick={handleSaveIntegrations} disabled={isSavingIntegrations} className="gradient-driptyard-hover text-white shadow-md w-full">
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
                      defaultValue="Hi {{name}},\n\nThanks for your order! We've received your order #{{order_id}}.\n\nOrder Total: S${{total}}\n\nWe'll send you another email once your items ship.\n\nThe DRIPTYARD Team"
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
                      defaultValue="Hi {{seller_name}},\n\nGreat news! Your payout request of S${{amount}} has been approved.\n\nThe funds will be transferred to your account within 2-3 business days.\n\nThe DRIPTYARD Team"
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
        <Card>
          <CardHeader>
            <CardTitle>Promo Code Settings</CardTitle>
            <CardDescription>Create and manage checkout promo codes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo-code">Code</Label>
                <Input
                  id="promo-code"
                  placeholder="WELCOME10"
                  value={promoForm.code}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={promoForm.discount_type}
                  onValueChange={(value) => setPromoForm((prev) => ({ ...prev, discount_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-value">Discount Value</Label>
                <Input
                  id="discount-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={promoForm.discount_value}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, discount_value: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={promoForm.start_date}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={promoForm.end_date}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-uses">Max Uses (optional)</Label>
                <Input
                  id="max-uses"
                  type="number"
                  min="1"
                  value={promoForm.max_uses}
                  onChange={(e) => setPromoForm((prev) => ({ ...prev, max_uses: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={promoForm.is_active}
                  onCheckedChange={(value) => setPromoForm((prev) => ({ ...prev, is_active: !!value }))}
                />
                <Label>Active</Label>
              </div>
              <Button
                onClick={handleCreatePromoCode}
                disabled={isSavingPromoCode}
                className="gradient-driptyard-hover text-white shadow-md"
              >
                {isSavingPromoCode ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Promo Code"
                )}
              </Button>
            </div>

            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Existing Promo Codes</h3>
              {isLoadingPromoCodes ? (
                <p className="text-sm text-muted-foreground">Loading promo codes...</p>
              ) : promoCodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No promo codes yet.</p>
              ) : (
                <div className="space-y-2">
                  {promoCodes.map((promo) => (
                    <div key={promo.id} className="border border-border rounded-md p-3 flex items-center justify-between">
                      <div className="text-sm">
                        <p className="font-semibold">{promo.code}</p>
                        <p className="text-muted-foreground">
                          {promo.discount_type === "percentage" ? `${promo.discount_value}%` : `S$${promo.discount_value}`} •
                          Used {promo.used_count}{promo.max_uses ? ` / ${promo.max_uses}` : ""}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => togglePromoCodeStatus(promo)}>
                        {promo.is_active ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Platform Fee Settings</CardTitle>
            <CardDescription>
              Configure buyer and seller platform/admin fee percentages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyer-platform-fee">Buyer Platform Fee (%)</Label>
                <Input
                  id="buyer-platform-fee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={platformFees.buyer_fee_percentage}
                  onChange={(e) => setPlatformFees((prev) => ({ ...prev, buyer_fee_percentage: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Added to buyer total at checkout.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-platform-fee">Seller Platform Fee (%)</Label>
                <Input
                  id="seller-platform-fee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={platformFees.seller_fee_percentage}
                  onChange={(e) => setPlatformFees((prev) => ({ ...prev, seller_fee_percentage: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Deducted from seller payout.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller-stripe-fee">Seller Stripe Fee (%)</Label>
                <Input
                  id="seller-stripe-fee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={platformFees.seller_stripe_fee_percentage}
                  onChange={(e) => setPlatformFees((prev) => ({ ...prev, seller_stripe_fee_percentage: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Deducted from seller payout as Stripe fee.
                </p>
              </div>
            </div>
            <Button onClick={savePlatformFees} disabled={isSavingPlatformFees} className="gradient-driptyard-hover text-white shadow-md">
              {isSavingPlatformFees ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Platform Fees"
              )}
            </Button>
          </CardContent>
        </Card>
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
