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
      <DialogContent className="max-w-md bg-white border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-slate-900">
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
                <Label htmlFor="notifications" className="text-sm text-slate-700">
                  Enable notifications
                </Label>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="budget-alerts" className="text-sm text-slate-700">
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode" className="text-sm text-slate-700">
                  Dark mode
                </Label>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
            </div>
          </div>

          {/* Data Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
              <Database className="h-4 w-4 text-slate-500" />
              <span>Data</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="data-export" className="text-sm text-slate-700">
                  Allow data export
                </Label>
                <Switch
                  id="data-export"
                  checked={dataExport}
                  onCheckedChange={setDataExport}
                />
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
              <Shield className="h-4 w-4 text-slate-500" />
              <span>Privacy</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="data-visibility" className="text-sm text-slate-700">
                  Data visibility
                </Label>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Private</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
