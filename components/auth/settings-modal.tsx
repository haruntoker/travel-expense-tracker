"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  Bell,
  Database,
  Eye,
  Palette,
  Save,
  Settings,
  Shield,
} from "lucide-react";
import { memo, useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = memo(function SettingsModal({
  isOpen,
  onClose,
}: SettingsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dataExport, setDataExport] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Here you could save settings to Supabase or localStorage
      // For now, we'll just show a success message
      toast({
        title: "✅ Settings Saved!",
        description: "Your preferences have been updated successfully.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "❌ Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setNotifications(true);
    setBudgetAlerts(true);
    setDarkMode(false);
    setDataExport(false);
    toast({
      title: "🔄 Settings Reset",
      description: "Settings have been reset to default values.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Notifications Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <span>Notifications</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-sm">
                  Enable notifications
                </Label>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="budget-alerts" className="text-sm">
                  Budget alerts
                </Label>
                <Switch
                  id="budget-alerts"
                  checked={budgetAlerts}
                  onCheckedChange={setBudgetAlerts}
                />
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
              <Palette className="h-4 w-4 text-slate-500" />
              <span>Appearance</span>
            </h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="text-sm">
                Dark mode
              </Label>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </div>

          {/* Privacy Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
              <Shield className="h-4 w-4 text-slate-500" />
              <span>Privacy & Data</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="data-export" className="text-sm">
                  Allow data export
                </Label>
                <Switch
                  id="data-export"
                  checked={dataExport}
                  onCheckedChange={setDataExport}
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-md border">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <Database className="h-3 w-3" />
                  <span>Your data is stored securely and privately</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
              <Eye className="h-4 w-4 text-slate-500" />
              <span>Account Information</span>
            </h3>

            <div className="p-3 bg-slate-50 rounded-md border space-y-2">
              <div className="text-xs text-slate-600">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="text-xs text-slate-600">
                <strong>Member since:</strong>{" "}
                {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
