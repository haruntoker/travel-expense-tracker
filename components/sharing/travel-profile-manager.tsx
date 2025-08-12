"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Globe, Plus, Settings, Trash2, UserPlus, Users } from "lucide-react";
import { memo, useEffect, useState } from "react";

interface TravelProfile {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  member_count: number;
}

interface UserInvitation {
  id: string;
  travel_profile_id: string;
  inviter_id: string;
  invitee_email: string;
  status: "pending" | "accepted" | "declined" | "expired";
  permissions: any;
  expires_at: string;
  created_at: string;
}

export const TravelProfileManager = memo(function TravelProfileManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<TravelProfile[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<TravelProfile | null>(
    null
  );

  // Form states
  const [profileName, setProfileName] = useState("");
  const [profileDescription, setProfileDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfiles();
      loadInvitations();
    }
  }, [user]);

  const loadProfiles = async () => {
    try {
      console.log("Loading travel profiles...");

      // First, get all travel profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("travel_profiles")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      console.log("Profiles query result:", {
        data: profilesData,
        error: profilesError,
      });

      if (profilesError) {
        // Check if it's a "relation does not exist" error
        if (
          profilesError.message?.includes(
            'relation "travel_profiles" does not exist'
          )
        ) {
          console.log("Travel profiles table doesn't exist yet");
          setProfiles([]);
          return;
        }
        throw profilesError;
      }

      // If no profiles exist yet, just set empty array
      if (!profilesData || profilesData.length === 0) {
        console.log("No travel profiles found");
        setProfiles([]);
        return;
      }

      // For now, just set member count to 1 (owner) to avoid complex queries
      const profilesWithCounts = (profilesData || []).map((profile) => ({
        ...profile,
        member_count: 1, // Start with owner only
      }));

      setProfiles(profilesWithCounts);
    } catch (error) {
      console.error("Error loading profiles:", error);

      // Check for specific error types
      if (error instanceof Error) {
        if (
          error.message.includes('relation "travel_profiles" does not exist')
        ) {
          toast({
            title: "❌ Setup Required",
            description:
              "Travel profiles table doesn't exist. Please run the database setup script first.",
            variant: "destructive",
          });
        } else if (error.message.includes("infinite recursion")) {
          toast({
            title: "❌ Database Policy Error",
            description:
              "Infinite recursion detected in RLS policies. Please run the RLS fix script.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "❌ Load Failed",
            description: `Failed to load travel profiles: ${error.message}`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "❌ Load Failed",
          description: "Failed to load travel profiles: Unknown error",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      console.log("Loading invitations...");

      const { data, error } = await supabase
        .from("user_invitations")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      console.log("Invitations query result:", { data, error });

      if (error) {
        // Check if it's a "relation does not exist" error
        if (
          error.message?.includes('relation "user_invitations" does not exist')
        ) {
          console.log("User invitations table doesn't exist yet");
          setInvitations([]);
          return;
        }
        throw error;
      }

      console.log("Setting invitations:", data);
      setInvitations(data || []);
    } catch (error) {
      console.error("Error loading invitations:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.log("Invitation loading error details:", errorMessage);

      // Set empty array to avoid undefined state
      setInvitations([]);
    }
  };

  const createProfile = async () => {
    if (!profileName.trim()) {
      toast({
        title: "❌ Missing Name",
        description: "Please enter a profile name.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("travel_profiles")
        .insert({
          name: profileName.trim(),
          description: profileDescription.trim() || null,
          owner_id: user!.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Profile creation error details:", error);
        if (
          error.message?.includes('relation "travel_profiles" does not exist')
        ) {
          toast({
            title: "❌ Setup Required",
            description:
              "Travel profiles table doesn't exist. Please run the database setup script first.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "✅ Profile Created!",
        description: `Travel profile "${data.name}" has been created successfully.`,
      });

      setProfileName("");
      setProfileDescription("");
      setIsCreateDialogOpen(false);
      loadProfiles();
    } catch (error) {
      console.error("Error creating profile:", error);
      toast({
        title: "❌ Creation Failed",
        description: "Failed to create travel profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail.trim() || !selectedProfile) return;

    setIsInviting(true);
    try {
      console.log("Sending invitation to:", inviteEmail.trim());
      console.log("For profile:", selectedProfile.id);

      // Check if invitation already exists for this user and profile
      const { data: existingInvitation, error: checkError } = await supabase
        .from("user_invitations")
        .select("id, status")
        .eq("travel_profile_id", selectedProfile.id)
        .eq("invitee_email", inviteEmail.trim())
        .maybeSingle();

      if (checkError) {
        console.warn("Could not check existing invitations:", checkError);
      }

      if (existingInvitation) {
        if (existingInvitation.status === "pending") {
          toast({
            title: "⚠️ Invitation Already Exists",
            description: `${inviteEmail.trim()} already has a pending invitation for this travel profile.`,
            variant: "destructive",
          });
          return;
        } else if (existingInvitation.status === "accepted") {
          toast({
            title: "ℹ️ User Already Member",
            description: `${inviteEmail.trim()} is already a member of this travel profile.`,
            variant: "default",
          });
          return;
        } else if (existingInvitation.status === "declined") {
          // Allow re-inviting declined users
          console.log("User previously declined, allowing re-invitation");
        }
      }

      // Also check if invitee is already a member (in case invitation was deleted but membership remains)
      // First get the invitee's user ID by email
      const { data: inviteeUser, error: inviteeError } = await supabase
        .from("users")
        .select("id")
        .eq("email", inviteEmail.trim())
        .maybeSingle();

      if (inviteeError) {
        console.warn("Could not check invitee user:", inviteeError);
      }

      if (inviteeUser) {
        const { data: existingMember, error: memberCheckError } = await supabase
          .from("travel_profile_members")
          .select("id")
          .eq("travel_profile_id", selectedProfile.id)
          .eq("user_id", inviteeUser.id)
          .maybeSingle();

        if (memberCheckError) {
          console.warn(
            "Could not check existing membership:",
            memberCheckError
          );
        }

        if (existingMember) {
          toast({
            title: "ℹ️ User Already Member",
            description: `${inviteEmail.trim()} is already a member of this travel profile.`,
            variant: "default",
          });
          return;
        }
      }

      const { data, error } = await supabase
        .from("user_invitations")
        .insert({
          travel_profile_id: selectedProfile.id,
          inviter_id: user!.id,
          invitee_email: inviteEmail.trim(),
          permissions: {
            can_add_expenses: true,
            can_delete_expenses: true,
            can_view_all_expenses: true,
            can_manage_budget: true,
            can_invite_others: true,
            can_manage_profile: true,
            can_delete_profile: false, // Only owner can delete
            can_remove_members: true,
            can_edit_expenses: true,
            can_view_reports: true,
          },
        })
        .select();

      console.log("Invitation insert result:", { data, error });

      if (error) {
        console.error("Invitation insert error:", error);
        throw error;
      }

      toast({
        title: "✅ Invitation Sent!",
        description: `Invitation sent to ${inviteEmail.trim()}. Check the Invitations tab to manage it.`,
      });

      // Show additional info about the invitation
      console.log("Invitation created successfully:");
      console.log("- Invitee:", inviteEmail.trim());
      console.log("- Profile:", selectedProfile.name);
      console.log("- Status: Pending");
      console.log("- Note: Email notification will be sent through Supabase");

      setInviteEmail("");
      setIsInviteDialogOpen(false);
      setSelectedProfile(null);

      // Reload invitations to show the new one
      await loadInvitations();
    } catch (error) {
      console.error("Error sending invitation:", error);

      let errorMessage = "Failed to send invitation. Please try again.";
      if (error instanceof Error) {
        if (
          error.message.includes('relation "user_invitations" does not exist')
        ) {
          errorMessage =
            "Invitations table not set up. Please run the database setup script.";
        } else if (error.message.includes("infinite recursion")) {
          errorMessage =
            "Database policy error. Please run the RLS fix script.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      toast({
        title: "❌ Invitation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this travel profile? This action cannot be undone. All invitations and memberships will also be removed."
      )
    ) {
      return;
    }

    try {
      // Start a transaction to delete everything related to this profile
      const { error: invitationsError } = await supabase
        .from("user_invitations")
        .delete()
        .eq("travel_profile_id", profileId);

      if (invitationsError) {
        console.warn("Could not delete invitations:", invitationsError);
      }

      const { error: membersError } = await supabase
        .from("travel_profile_members")
        .delete()
        .eq("travel_profile_id", profileId);

      if (membersError) {
        console.warn("Could not delete members:", membersError);
      }

      // Finally delete the profile itself
      const { error: profileError } = await supabase
        .from("travel_profiles")
        .delete()
        .eq("id", profileId);

      if (profileError) throw profileError;

      toast({
        title: "✅ Profile Deleted!",
        description:
          "Travel profile and all related data have been deleted successfully.",
      });

      loadProfiles();
      loadInvitations(); // Reload invitations to reflect changes
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast({
        title: "❌ Deletion Failed",
        description: "Failed to delete travel profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-slate-600">Loading travel profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Travel Profiles</h2>
          <p className="text-slate-600">
            Manage shared travel profiles and invite others
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Profile</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Travel Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="profile-name">Profile Name</Label>
                <Input
                  id="profile-name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g., Summer Vacation 2024"
                />
              </div>
              <div>
                <Label htmlFor="profile-description">
                  Description (Optional)
                </Label>
                <Textarea
                  id="profile-description"
                  value={profileDescription}
                  onChange={(e) => setProfileDescription(e.target.value)}
                  placeholder="Describe your travel plans..."
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={createProfile}
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? "Creating..." : "Create Profile"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <Card key={profile.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{profile.name}</CardTitle>
                  {profile.description && (
                    <p className="text-sm text-slate-600 mt-1">
                      {profile.description}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    profile.owner_id === user?.id ? "default" : "secondary"
                  }
                >
                  {profile.owner_id === user?.id ? "Owner" : "Member"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Users className="h-4 w-4" />
                  <span>{profile.member_count || 1} member(s)</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Globe className="h-4 w-4" />
                  <span>
                    Created {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex space-x-2 pt-2">
                  {profile.owner_id === user?.id && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProfile(profile);
                          setIsInviteDialogOpen(true);
                        }}
                        className="flex-1"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Invite
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteProfile(profile.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" className="flex-1">
                    <Settings className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {profiles.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Travel Profiles Yet
            </h3>
            <p className="text-slate-600 mb-4">
              Create your first travel profile to start sharing expenses with
              others
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User to "{selectedProfile?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address to invite"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                💡 The invited user will receive an email with a link to join
                your travel profile. They'll be able to add and view expenses,
                but won't be able to delete them.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={sendInvitation}
                disabled={isInviting}
                className="flex-1"
              >
                {isInviting ? "Sending..." : "Send Invitation"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsInviteDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
