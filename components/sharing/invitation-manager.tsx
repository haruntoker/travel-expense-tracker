"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Check, Clock, Globe, Mail, Users, X } from "lucide-react";
import { memo, useEffect, useState } from "react";

interface UserInvitation {
  id: string;
  travel_profile_id: string;
  inviter_id: string;
  invitee_email: string;
  status: "pending" | "accepted" | "declined" | "expired";
  permissions: any;
  expires_at: string;
  created_at: string;
  travel_profile: {
    name: string;
    description: string | null;
    owner_id: string;
  };
  inviter: {
    email: string;
    user_metadata: {
      full_name?: string;
    };
  };
}

export const InvitationManager = memo(function InvitationManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    try {
      // Get invitations where the current user is the invitee
      console.log("🔍 DEBUG: Looking for invitations for email:", user?.email);

      const { data: invitationsData, error: invitationsError } = await supabase
        .from("user_invitations")
        .select("*")
        .ilike("invitee_email", user?.email || "")
        .order("created_at", { ascending: false });

      console.log("🔍 DEBUG: Raw query result:", {
        data: invitationsData,
        error: invitationsError,
      });

      console.log("🔍 DEBUG: Found invitations:", invitationsData);
      console.log("🔍 DEBUG: Invitation count:", invitationsData?.length || 0);

      // Debug: Show each invitation's details
      if (invitationsData && invitationsData.length > 0) {
        invitationsData.forEach((inv, index) => {
          console.log(`🔍 DEBUG: Invitation ${index + 1}:`, {
            id: inv.id,
            profile_id: inv.travel_profile_id,
            invitee_email: inv.invitee_email,
            status: inv.status,
            created_at: inv.created_at,
          });
        });
      }

      if (invitationsError) {
        console.error("Error loading invitations:", invitationsError);
        throw invitationsError;
      }

      // Get profile details for each invitation
      const invitationsWithDetails = await Promise.all(
        (invitationsData || []).map(async (invitation) => {
          try {
            // Get travel profile details - handle case where profile might not exist
            let profileData = null;
            try {
              const { data, error } = await supabase
                .from("travel_profiles")
                .select("name, description, owner_id")
                .eq("id", invitation.travel_profile_id)
                .maybeSingle(); // Use maybeSingle() instead of single() to avoid coercion errors

              if (error) {
                console.warn("Could not fetch profile details:", error.message);
              } else if (data) {
                profileData = data;
              }
            } catch (err) {
              console.warn("Error fetching profile:", err);
            }

            // Get inviter details - handle case where inviter might not exist
            let inviterData = null;
            try {
              const { data, error } = await supabase
                .from("users")
                .select("email")
                .eq("id", invitation.inviter_id)
                .single();

              if (error) {
                console.warn("Could not fetch inviter details:", error.message);
              } else {
                inviterData = { email: data.email, user_metadata: {} };
              }
            } catch (err) {
              console.warn("Error fetching inviter:", err);
            }

            return {
              ...invitation,
              travel_profile: profileData || {
                name: invitation.travel_profile_id
                  ? "Loading Profile..."
                  : "Unknown Profile",
                description: null,
                owner_id: invitation.travel_profile_id || "",
              },
              inviter: inviterData || {
                email: invitation.inviter_id
                  ? "Loading User..."
                  : "Unknown User",
                user_metadata: { full_name: "Unknown User" },
              },
            };
          } catch (error) {
            console.error("Error processing invitation:", invitation.id, error);
            return {
              ...invitation,
              travel_profile: {
                name: "Error Loading Profile",
                description: null,
                owner_id: "",
              },
              inviter: {
                email: "Error Loading User",
                user_metadata: {},
              },
            };
          }
        })
      );

      setInvitations(invitationsWithDetails);
    } catch (error) {
      console.error("Error loading invitations:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "❌ Load Failed",
        description: `Failed to load invitations: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const respondToInvitation = async (
    invitationId: string,
    status: "accepted" | "declined"
  ) => {
    setIsProcessing(invitationId);
    try {
      // Update invitation status
      const { error: updateError } = await supabase
        .from("user_invitations")
        .update({ status })
        .eq("id", invitationId);

      if (updateError) throw updateError;

      // If accepted, add user to travel profile members
      if (status === "accepted") {
        const invitation = invitations.find((inv) => inv.id === invitationId);
        if (invitation) {
          // Check if user is already a member
          const { data: existingMember, error: checkError } = await supabase
            .from("travel_profile_members")
            .select("id")
            .eq("travel_profile_id", invitation.travel_profile_id)
            .eq("user_id", user!.id)
            .maybeSingle();

          if (checkError) {
            console.warn("Could not check existing membership:", checkError);
          }

          // Only insert if not already a member
          if (!existingMember) {
            const { error: memberError } = await supabase
              .from("travel_profile_members")
              .insert({
                travel_profile_id: invitation.travel_profile_id,
                user_id: user!.id,
                permissions: invitation.permissions,
              });

            if (memberError) {
              // If it's a duplicate key error, that's fine - user is already a member
              if (memberError.code === "23505") {
                console.log("User is already a member of this profile");
              } else {
                throw memberError;
              }
            }
          } else {
            console.log("User is already a member of this profile");
          }
        }
      }

      toast({
        title: `✅ Invitation ${
          status === "accepted" ? "Accepted" : "Declined"
        }!`,
        description:
          status === "accepted"
            ? "You are now a member of this travel profile."
            : "Invitation has been declined.",
      });

      loadInvitations();
    } catch (error) {
      console.error("Error responding to invitation:", error);
      toast({
        title: "❌ Action Failed",
        description: "Failed to respond to invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();

    if (isExpired) return <Badge variant="destructive">Expired</Badge>;

    switch (status) {
      case "pending":
        return <Badge variant="default">Pending</Badge>;
      case "accepted":
        return <Badge variant="secondary">Accepted</Badge>;
      case "declined":
        return <Badge variant="outline">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInviterName = (invitation: UserInvitation) => {
    return (
      invitation.inviter?.user_metadata?.full_name ||
      invitation.inviter?.email ||
      "Unknown User"
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-slate-600">Loading invitations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Travel Invitations
        </h2>
        <p className="text-slate-600">
          Manage invitations to join travel profiles
        </p>
      </div>

      {/* Invitations List */}
      <div className="space-y-4">
        {invitations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Mail className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Invitations
              </h3>
              <p className="text-slate-600">
                You haven't received any travel profile invitations yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          invitations.map((invitation) => (
            <Card
              key={invitation.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span>{invitation.travel_profile.name}</span>
                    </CardTitle>
                    {invitation.travel_profile.description && (
                      <p className="text-sm text-slate-600 mt-1">
                        {invitation.travel_profile.description}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(invitation.status, invitation.expires_at)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Users className="h-4 w-4" />
                    <span>Invited by: {getInviterName(invitation)}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      Invited{" "}
                      {new Date(invitation.created_at).toLocaleDateString()}
                      {invitation.status === "pending" && (
                        <span className="text-amber-600">
                          {" • Expires "}
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Permissions Info */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-700 font-medium mb-2">
                      🎉 Full Access Permissions:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center space-x-1">
                        <Check className="h-3 w-3 text-green-600" />
                        <span>Add expenses</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Check className="h-3 w-3 text-green-600" />
                        <span>Delete expenses</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Check className="h-3 w-3 text-green-600" />
                        <span>View all expenses</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Check className="h-3 w-3 text-green-600" />
                        <span>Manage budget</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Check className="h-3 w-3 text-green-600" />
                        <span>Invite others</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Check className="h-3 w-3 text-green-600" />
                        <span>Manage profile</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 italic">
                      You'll have full access to collaborate on this travel
                      profile!
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {invitation.status === "pending" &&
                    new Date(invitation.expires_at) > new Date() && (
                      <div className="flex space-x-3 pt-2">
                        <Button
                          onClick={() =>
                            respondToInvitation(invitation.id, "accepted")
                          }
                          disabled={isProcessing === invitation.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {isProcessing === invitation.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Accepting...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Accept Invitation
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            respondToInvitation(invitation.id, "declined")
                          }
                          disabled={isProcessing === invitation.id}
                          className="flex-1"
                        >
                          {isProcessing === invitation.id ? (
                            "Processing..."
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Decline
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                  {/* Status Messages */}
                  {invitation.status === "accepted" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-700">
                        ✅ You've accepted this invitation and are now a member
                        of this travel profile.
                      </p>
                    </div>
                  )}

                  {invitation.status === "declined" && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="text-sm text-slate-700">
                        ❌ You've declined this invitation.
                      </p>
                    </div>
                  )}

                  {invitation.status === "pending" &&
                    new Date(invitation.expires_at) <= new Date() && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">
                          ⏰ This invitation has expired. Please ask the profile
                          owner to send a new one.
                        </p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
});
