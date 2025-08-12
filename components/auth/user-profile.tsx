"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ChevronDown, LogOut, Settings, User, Users } from "lucide-react";
import { useState } from "react";
import { ProfileModal } from "./profile-modal";
import { SettingsModal } from "./settings-modal";

export function UserProfile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast({
        title: "👋 Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "❌ Sign Out Failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center space-x-2 hover:bg-slate-100"
          >
            <Avatar className="h-8 w-8">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                  {getUserInitials(user.email || "")}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="hidden md:block text-sm font-medium text-slate-700">
              {user.user_metadata?.full_name || user.email}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-900">{user.email}</p>
            <p className="text-xs text-slate-500">Signed in</p>
          </div>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setIsProfileOpen(true);
              setIsDropdownOpen(false);
            }}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              // Navigate to sharing dashboard
              window.location.href = "/sharing";
              setIsDropdownOpen(false);
            }}
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Travel Sharing</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setIsSettingsOpen(true);
              setIsDropdownOpen(false);
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
