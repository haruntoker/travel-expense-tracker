"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { Mail, Users } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { InvitationManager } from "./invitation-manager";
import { TravelProfileManager } from "./travel-profile-manager";

export const SharingDashboard = memo(function SharingDashboard() {
  const [activeTab, setActiveTab] = useState("profiles");
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">(
    "checking"
  );

  // Test database connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log("Testing database connection...");

        // Test basic connection first
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("count")
          .limit(1);

        if (userError) {
          console.error("Users table test failed:", userError);

          // Check if it's a recursion error
          if (userError.message?.includes("infinite recursion")) {
            console.error("Infinite recursion detected - RLS policy issue");
            setDbStatus("error");
            return;
          }

          // Try travel_profiles table
          const { data: profileData, error: profileError } = await supabase
            .from("travel_profiles")
            .select("count")
            .limit(1);

          if (profileError) {
            console.error("Travel profiles table test failed:", profileError);

            if (profileError.message?.includes("infinite recursion")) {
              console.error(
                "Infinite recursion in travel_profiles - RLS policy issue"
              );
              setDbStatus("error");
            } else {
              setDbStatus("error");
            }
          } else {
            console.log("Travel profiles table accessible");
            setDbStatus("connected");
          }
        } else {
          console.log("Users table accessible");
          setDbStatus("connected");
        }
      } catch (err) {
        console.error("Database connection error:", err);
        setDbStatus("error");
      }
    };

    testConnection();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Travel Sharing
        </h1>
        <p className="text-slate-600">
          Create shared travel profiles and collaborate with others on expenses
        </p>
        {/* <div className="mt-2 space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const { data, error } = await supabase
                  .from("travel_profiles")
                  .select("count")
                  .limit(1);
                if (error) {
                  console.log("Table test error:", error);
                  alert(`Table test failed: ${error.message}`);
                } else {
                  console.log("Table test successful:", data);
                  alert("Table test successful! Tables exist.");
                }
              } catch (err) {
                console.error("Table test exception:", err);
                alert(`Table test exception: ${err}`);
              }
            }}
          >
            Test Tables
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                // Test all required tables
                const tables = [
                  "travel_profiles",
                  "user_invitations",
                  "travel_profile_members",
                ];
                const results: Record<
                  string,
                  { success: boolean; error?: string }
                > = {};

                for (const table of tables) {
                  try {
                    const { data, error } = await supabase
                      .from(table)
                      .select("count")
                      .limit(1);
                    results[table] = { success: !error, error: error?.message };
                  } catch (err) {
                    const errorMessage =
                      err instanceof Error ? err.message : "Unknown error";
                    results[table] = { success: false, error: errorMessage };
                  }
                }

                console.log("Table verification results:", results);
                alert(
                  `Table verification:\n${Object.entries(results)
                    .map(
                      ([table, result]) =>
                        `${table}: ${result.success ? "✅" : "❌"} ${
                          result.error || "OK"
                        }`
                    )
                    .join("\n")}`
                );
              } catch (err) {
                const errorMessage =
                  err instanceof Error ? err.message : "Unknown error";
                console.error("Table verification exception:", err);
                alert(`Table verification failed: ${errorMessage}`);
              }
            }}
          >
            Verify All Tables
          </Button>
        </div> */}
        {dbStatus === "checking" && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Checking database connection...</span>
          </div>
        )}
        {dbStatus === "error" && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <span>⚠️ Database connection failed. Please check your setup.</span>
          </div>
        )}
        {dbStatus === "connected" && (
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <span>✅ Database connected successfully</span>
          </div>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profiles" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>My Profiles</span>
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="flex items-center space-x-2"
          >
            <Mail className="h-4 w-4" />
            <span>Invitations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-6">
          <TravelProfileManager />
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          <InvitationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
});
