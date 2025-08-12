"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { UserProfile } from "@/components/auth/user-profile";
import { ExpenseCharts } from "@/components/expense-charts";
import { ExpenseTable } from "@/components/expense-table";
import { TravelCountdown } from "@/components/travel-countdown";
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
import { useDatabase } from "@/hooks/use-database";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Euro,
  Plane,
  Settings,
  Wallet,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

export interface Expense {
  id: string;
  category: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_BUDGET = 2000;
const STORAGE_KEYS = {
  EXPENSES: "travel-expenses",
  BUDGET: "travel-budget",
  SELECTED_TRAVEL_PROFILE: "selected-travel-profile",
} as const;

const TravelExpensesTracker = memo(function TravelExpensesTracker() {
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [tempBudget, setTempBudget] = useState<number>(DEFAULT_BUDGET);
  const [isExporting, setIsExporting] = useState(false);
  const [showBudgetAlert, setShowBudgetAlert] = useState(false);
  const [selectedTravelProfile, setSelectedTravelProfile] = useState<
    string | null
  >(null);
  const [travelProfiles, setTravelProfiles] = useState<any[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const {
    expenses,
    budget,
    isLoading,
    isInitialized,
    addExpense,
    updateExpense,
    deleteExpense,
    setBudget: setDatabaseBudget,
    removeBudget,
    loadData,
    clearData,
    isRefreshing,
  } = useDatabase(selectedTravelProfile);

  // Debounced refresh function to prevent rapid successive calls
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    const timeout = setTimeout(() => {
      if (loadData) {
        loadData(true); // Force reload
      }
    }, 300); // 300ms debounce

    setRefreshTimeout(timeout);
  }, [refreshTimeout, loadData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [refreshTimeout]);

  // Debug: Log data state changes
  useEffect(() => {
    console.log("🔍 Main page data state:", {
      expenses: expenses.length,
      budget: budget ? `€${budget.amount}` : "none",
      selectedTravelProfile,
      isLoading,
      isInitialized,
    });
  }, [expenses, budget, selectedTravelProfile, isLoading, isInitialized]);

  // Load selected travel profile from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedProfile = localStorage.getItem(
        STORAGE_KEYS.SELECTED_TRAVEL_PROFILE
      );
      if (savedProfile) {
        setSelectedTravelProfile(savedProfile);
      }
    }
  }, []);

  // Save selected travel profile to localStorage when it changes
  useEffect(() => {
    if (selectedTravelProfile && typeof window !== "undefined") {
      localStorage.setItem(
        STORAGE_KEYS.SELECTED_TRAVEL_PROFILE,
        selectedTravelProfile
      );
    }
  }, [selectedTravelProfile]);

  // Load user's travel profiles
  useEffect(() => {
    const loadTravelProfiles = async () => {
      if (!user) {
        // Clear localStorage when user logs out
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEYS.SELECTED_TRAVEL_PROFILE);
        }
        setSelectedTravelProfile(null);
        return;
      }

      setIsLoadingProfiles(true);
      try {
        // Use the existing Supabase client from auth context
        // const { supabase } = await import("@/lib/supabase");

        // Get profiles where user is owner
        const { data: ownedProfiles } = await supabase
          .from("travel_profiles")
          .select("*")
          .eq("owner_id", user.id);

        // Get profiles where user is a member
        const { data: memberProfiles } = await supabase
          .from("travel_profile_members")
          .select(
            `
          travel_profile_id,
          travel_profiles (*)
        `
          )
          .eq("user_id", user.id);

        const allProfiles = [
          ...(ownedProfiles || []),
          ...(memberProfiles?.map((m) => m.travel_profiles).filter(Boolean) ||
            []),
        ];

        setTravelProfiles(allProfiles);

        // Check if the currently selected profile still exists
        if (selectedTravelProfile) {
          const profileExists = allProfiles.some(
            (profile) =>
              profile &&
              typeof profile === "object" &&
              "id" in profile &&
              profile.id === selectedTravelProfile
          );
          if (!profileExists) {
            // Clear the saved profile if it no longer exists
            if (typeof window !== "undefined") {
              localStorage.removeItem(STORAGE_KEYS.SELECTED_TRAVEL_PROFILE);
            }
            setSelectedTravelProfile(null);
          }
        }

        // Auto-select first profile if none selected and no saved profile
        if (!selectedTravelProfile && allProfiles.length > 0) {
          const firstProfile = allProfiles[0];
          if (
            firstProfile &&
            typeof firstProfile === "object" &&
            "id" in firstProfile
          ) {
            setSelectedTravelProfile(firstProfile.id as string);
          }
        }
      } catch (error) {
        console.error("Error loading travel profiles:", error);
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    loadTravelProfiles();
  }, [user]); // Remove selectedTravelProfile from dependencies to prevent infinite loops

  // Handle travel profile selection change
  const handleTravelProfileChange = useCallback(
    async (profileId: string | null) => {
      setIsSwitchingProfile(true);

      // Clear existing data before switching profiles
      if (clearData) {
        clearData();
      }

      setSelectedTravelProfile(profileId);

      // Load data for the new profile
      if (profileId) {
        console.log("Switching to travel profile:", profileId);
        // Load data for the new profile
        if (loadData) {
          await loadData();
        }
      } else {
        console.log("No travel profile selected");
      }

      setIsSwitchingProfile(false);
    },
    [loadData, clearData]
  );

  // Create a stable reference for the travel profile change handler
  const stableHandleTravelProfileChange = useCallback(
    async (profileId: string | null) => {
      await handleTravelProfileChange(profileId);
    },
    [handleTravelProfileChange]
  );

  // Reload data when travel profile changes - only when necessary
  useEffect(() => {
    if (selectedTravelProfile && loadData && isInitialized) {
      console.log("Travel profile changed to:", selectedTravelProfile);
      loadData(); // Refresh data for the new profile immediately
    }
  }, [selectedTravelProfile, isInitialized]); // Remove loadData from dependencies

  // Create a stable reference for loadData to prevent unnecessary re-renders
  const stableLoadData = useCallback(() => {
    if (loadData) {
      loadData();
    }
  }, [loadData]);

  // Only show database loading when user is authenticated (removed travel profile requirement)
  // Temporarily disabled to fix RLS policy issues
  const shouldShowDatabaseLoading = false; // user && (!isInitialized || (isLoading && expenses.length === 0));

  // Show a subtle refresh indicator instead of full loading when refreshing existing data
  const shouldShowRefreshIndicator =
    user && isRefreshing && expenses.length > 0;

  // Memoized calculations
  const totalSpent = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  const budgetAmount = budget?.amount || DEFAULT_BUDGET;
  const remainingBudget = useMemo(
    () => budgetAmount - totalSpent,
    [budgetAmount, totalSpent]
  );
  const budgetUsagePercentage = useMemo(
    () => (budget?.amount ? Math.round((totalSpent / budgetAmount) * 100) : 0),
    [totalSpent, budgetAmount, budget]
  );

  const isOverBudget = useMemo(
    () => budget?.amount && remainingBudget < 0,
    [remainingBudget, budget]
  );
  const isNearBudget = useMemo(
    () =>
      budget?.amount &&
      budgetUsagePercentage >= 80 &&
      budgetUsagePercentage < 100,
    [budgetUsagePercentage, budget]
  );

  // Memoize handlers to prevent unnecessary re-renders
  const handleBudgetUpdate = useCallback(async () => {
    if (!tempBudget || tempBudget <= 0) {
      toast({
        title: "❌ Invalid Budget",
        description: "Please enter a valid budget amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await setDatabaseBudget(tempBudget);
      if (success) {
        setIsBudgetDialogOpen(false);
        toast({
          title: "✅ Budget Updated!",
          description: `Your travel budget is now €${tempBudget.toLocaleString()}`,
        });
      }
    } catch (error) {
      console.error("Error updating budget:", error);
      toast({
        title: "❌ Update Failed",
        description: "Failed to update budget. Please try again.",
        variant: "destructive",
      });
    }
  }, [tempBudget, setDatabaseBudget, toast]);

  // Create a stable reference for the budget update handler
  const stableHandleBudgetUpdate = useCallback(() => {
    handleBudgetUpdate();
  }, [handleBudgetUpdate]);

  const handleExpenseAdd = useCallback(
    async (category: string, amount: number) => {
      const success = await addExpense(category, amount);
      if (success) {
        // Reset form or show success message
        console.log("Expense added successfully");
      }
    },
    [addExpense]
  );

  const handleExpenseUpdate = useCallback(
    async (id: string, amount: number, category?: string) => {
      const success = await updateExpense(id, amount, category);
      if (success) {
        console.log("Expense updated successfully");
      }
    },
    [updateExpense]
  );

  const handleExpenseDelete = useCallback(
    async (id: string) => {
      const success = await deleteExpense(id);
      if (success) {
        console.log("Expense deleted successfully");
      }
    },
    [deleteExpense]
  );

  // Create stable references for expense handlers
  const stableHandleExpenseAdd = useCallback(
    (category: string, amount: number) => {
      handleExpenseAdd(category, amount);
    },
    [handleExpenseAdd]
  );

  const stableHandleExpenseUpdate = useCallback(
    (id: string, amount: number, category?: string) => {
      handleExpenseUpdate(id, amount, category);
    },
    [handleExpenseUpdate]
  );

  const stableHandleExpenseDelete = useCallback(
    (id: string) => {
      handleExpenseDelete(id);
    },
    [handleExpenseDelete]
  );

  // Initialize temp budget when database budget loads or dialog opens
  useEffect(() => {
    if (budget && !tempBudget) {
      setTempBudget(budget.amount);
    }
  }, [budget, tempBudget]);

  // Update tempBudget when budget dialog opens
  useEffect(() => {
    if (isBudgetDialogOpen) {
      setTempBudget(budget?.amount || 0);
    }
  }, [isBudgetDialogOpen, budget]);

  // No migration needed - starting fresh
  useEffect(() => {
    // Just mark as ready when initialized
    if (isInitialized && !isLoading) {
      console.log("App initialized and ready for fresh data entry");
    }
  }, [isInitialized, isLoading]);

  // Check budget status and show alert if needed (only if budget is set)
  useEffect(() => {
    if (
      isInitialized &&
      !isLoading &&
      budget?.amount &&
      totalSpent > budgetAmount
    ) {
      setShowBudgetAlert(true);
    } else if (isInitialized && !isLoading) {
      setShowBudgetAlert(false);
    }
  }, [isInitialized, isLoading, totalSpent, budgetAmount, budget]);

  // Budget management
  // Expense management
  // Export functionality
  const exportData = useCallback(
    async (format: "json" | "excel" = "json") => {
      setIsExporting(true);
      try {
        if (format === "excel") {
          // Create Excel workbook
          const workbook = XLSX.utils.book_new();

          // Create expenses worksheet
          const expensesData = expenses.map((expense) => ({
            Category: expense.category,
            Amount: expense.amount,
            "Created Date": new Date(expense.createdAt).toLocaleDateString(),
            "Last Updated": new Date(expense.updatedAt).toLocaleDateString(),
          }));

          const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
          XLSX.utils.book_append_sheet(workbook, expensesSheet, "Expenses");

          // Create summary worksheet
          const summaryData = [
            {
              Metric: "Budget Status",
              Value: budget?.amount ? "Set" : "Not Set",
            },
            ...(budget?.amount
              ? [
                  {
                    Metric: "Total Budget",
                    Value: `€${budgetAmount.toLocaleString()}`,
                  },
                  {
                    Metric: "Remaining Budget",
                    Value: `€${remainingBudget.toLocaleString()}`,
                  },
                  {
                    Metric: "Budget Usage",
                    Value: `${budgetUsagePercentage}%`,
                  },
                  {
                    Metric: "Budget Status",
                    Value: isOverBudget
                      ? "EXCEEDED"
                      : isNearBudget
                      ? "WARNING"
                      : "GOOD",
                  },
                ]
              : []),
            { Metric: "Total Spent", Value: `€${totalSpent.toLocaleString()}` },
            { Metric: "Total Expenses", Value: expenses.length },
            { Metric: "Export Date", Value: new Date().toLocaleDateString() },
          ];

          const summarySheet = XLSX.utils.json_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

          // Create category breakdown worksheet
          const categoryData = expenses.reduce((acc, expense) => {
            const existing = acc.find(
              (item) => item.Category === expense.category
            );
            if (existing) {
              existing.Amount += expense.amount;
              existing.Count += 1;
            } else {
              acc.push({
                Category: expense.category,
                Amount: expense.amount,
                Count: 1,
                Percentage: 0, // Will be calculated below
              });
            }
            return acc;
          }, [] as Array<{ Category: string; Amount: number; Count: number; Percentage: number }>);

          // Calculate percentages
          categoryData.forEach((item) => {
            item.Percentage = Math.round((item.Amount / totalSpent) * 100);
          });

          // Sort by amount descending
          categoryData.sort((a, b) => b.Amount - a.Amount);

          const categorySheet = XLSX.utils.json_to_sheet(categoryData);
          XLSX.utils.book_append_sheet(workbook, categorySheet, "Categories");

          // Auto-size columns
          expensesSheet["!cols"] = [
            { wch: 20 }, // Category
            { wch: 15 }, // Amount
            { wch: 15 }, // Created Date
            { wch: 15 }, // Last Updated
          ];

          summarySheet["!cols"] = [
            { wch: 20 }, // Metric
            { wch: 20 }, // Value
          ];

          categorySheet["!cols"] = [
            { wch: 20 }, // Category
            { wch: 15 }, // Amount
            { wch: 15 }, // Count
            { wch: 15 }, // Percentage
          ];

          // Export Excel file
          XLSX.writeFile(
            workbook,
            `travel-expenses-${new Date().toISOString().split("T")[0]}.xlsx`
          );

          toast({
            title: "📊 Excel Export Successful!",
            description: `Your travel expenses data has been exported to Excel with ${expenses.length} expenses and detailed analytics.`,
          });
        } else {
          // JSON export (existing functionality)
          const data = {
            budget: budget?.amount ? budgetAmount : null,
            expenses,
            totalSpent,
            remainingBudget: budget?.amount ? remainingBudget : null,
            exportDate: new Date().toISOString(),
          };

          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          });

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `travel-expenses-${
            new Date().toISOString().split("T")[0]
          }.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast({
            title: "📄 JSON Export Successful!",
            description: `Your travel expenses data has been exported with ${expenses.length} expenses and budget information.`,
          });
        }
      } catch (error) {
        toast({
          title: "❌ Export Failed",
          description:
            "Failed to export data. Please check your browser permissions and try again.",
          variant: "destructive",
        });
      } finally {
        setIsExporting(false);
      }
    },
    [
      budgetAmount,
      expenses,
      totalSpent,
      remainingBudget,
      budgetUsagePercentage,
      budget,
      toast,
    ]
  );

  // Show auth form if user is not authenticated
  if (!user && !authLoading) {
    return <AuthForm />;
  }

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-lg text-slate-700">Initializing...</div>
        </div>
      </div>
    );
  }

  if (shouldShowDatabaseLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-lg text-slate-700">
            {isSwitchingProfile
              ? "Switching travel profiles..."
              : "Loading your travel expenses..."}
          </div>
          {isSwitchingProfile && (
            <p className="text-sm text-slate-500">
              Please wait while we load data for the new profile...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1"></div>
            <div className="flex items-center justify-center space-x-3">
              <div className="hidden md:block p-3 bg-blue-100 rounded-full">
                <Plane className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Travel Expenses Tracker
              </h1>
            </div>
            <div className="flex-1 flex justify-end">
              {/* User Profile */}
              {user && (
                <div className="mb-6">
                  <UserProfile />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center space-x-4">
            <p className="text-slate-700 text-lg max-w-2xl mx-auto">
              Smart budget management for your travels. Track expenses,
              visualize spending patterns, and stay within budget.
            </p>
            {/* Manual Refresh Button */}
            {/* {user && isInitialized && !isLoading && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData && loadData(true)} // Force reload
                disabled={isRefreshing}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                <div className="h-4 w-4 mr-2">
                  {isRefreshing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                  ) : (
                    <div className="h-4 w-4">🔄</div>
                  )}
                </div>
                Refresh
              </Button>
            )} */}
          </div>
        </div>

        {/* Subtle Refresh Indicator */}
        {shouldShowRefreshIndicator && (
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-lg py-2 px-4 max-w-xs mx-auto">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Refreshing data...</span>
          </div>
        )}

        {/* Last Updated Indicator */}
        {user && isInitialized && !isLoading && expenses.length > 0 && (
          <div className="text-center">
            <p className="text-xs text-slate-500">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Travel Profile Selector */}
        {/* {user && travelProfiles.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
                  <Plane className="h-5 w-5 text-blue-600" />
                  <span>Travel Profile</span>
                </h2>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadData && loadData()}
                    disabled={isLoading || isSwitchingProfile}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <div className="h-4 w-4 mr-2">
                      {isLoading || isSwitchingProfile ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <div className="h-4 w-4">🔄</div>
                      )}
                    </div>
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("/sharing", "_blank")}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    Manage Profiles
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Label
                  htmlFor="profile-select"
                  className="text-sm font-medium text-slate-700"
                >
                  Select Profile:
                </Label>
                <select
                  id="profile-select"
                  value={selectedTravelProfile || ""}
                  onChange={(e) =>
                    stableHandleTravelProfileChange(e.target.value || null)
                  }
                  disabled={isSwitchingProfile}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
                >
                  {travelProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}{" "}
                      {profile.owner_id === user?.id ? "(Owner)" : "(Member)"}
                    </option>
                  ))}
                </select>
                {isSwitchingProfile && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </div>
              {selectedTravelProfile && (
                <div className="mt-3">
                  <p className="text-sm text-slate-600">
                    Currently tracking expenses for:{" "}
                    <strong className="text-blue-600">
                      {
                        travelProfiles.find((p) => p.id === selectedTravelProfile)
                          ?.name
                      }
                    </strong>
                  </p>
                  {(isLoading || isSwitchingProfile) && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                      {isSwitchingProfile
                        ? "Switching profiles..."
                        : "Loading data..."}
                    </p>
                  )}
                </div>
              )}
            </div>
          )} */}

        {/* Optional Travel Profile Creation - Not blocking */}
        {/* {user && travelProfiles.length === 0 && !isLoadingProfiles && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-lg">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <Plane className="h-8 w-8 text-blue-600" />
                  <h3 className="text-xl font-semibold text-blue-900">
                    Want to Collaborate?
                  </h3>
                </div>
                <p className="text-blue-700 max-w-2xl mx-auto">
                  Create a travel profile to collaborate with friends and family
                  on shared expenses. This is completely optional - you can
                  continue using the app for personal expense tracking.
                </p>
                <div className="flex justify-center space-x-3">
                  <Button
                    onClick={() => window.open("/sharing", "_blank")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create Travel Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Hide this message for the session
                      setTravelProfiles([{ id: "hidden", name: "Hidden" }]);
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          )} */}

        {/* No Travel Profiles Message - REMOVED since profiles are now optional */}
        {/* {user && travelProfiles.length === 0 && !isLoadingProfiles && (
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
              <div className="text-center py-6">
                <Plane className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No Travel Profiles Yet
                </h3>
                <p className="text-slate-600 mb-4">
                  Create a travel profile to start collaborating with others on
                  expenses.
                </p>
                <Button
                  onClick={() => window.open("/sharing", "_blank")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Your First Profile
                </Button>
              </div>
            </div>
          )} */}

        {/* Debug Section - Remove in production */}
        {process.env.NODE_ENV === "development" && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🔧 Debug Panel
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("🔍 Manual data load triggered");
                  loadData();
                }}
                className="text-gray-700"
              >
                Reload Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("🔍 Current state:", {
                    expenses: expenses.length,
                    budget: budget ? `€${budget.amount}` : "none",
                    selectedTravelProfile,
                    isLoading,
                    isInitialized,
                  });
                }}
                className="text-gray-700"
              >
                Log State
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("🔍 Testing database connection...");
                  // Remove dynamic import to prevent initialization issues
                  console.log("Database connection test skipped in production");
                }}
                className="text-gray-700"
              >
                Test DB Connection
              </Button>
            </div>
          </div>
        )}

        {/* Budget Exceeded Alert - Mobile Optimized */}
        {budget?.amount && showBudgetAlert && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-red-800">
                    Budget Exceeded!
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    You've exceeded your budget by €
                    {Math.abs(remainingBudget).toLocaleString()}. Consider
                    adjusting your budget or reducing expenses.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBudgetDialogOpen(true)}
                  className="border-red-300 text-red-700 hover:bg-red-100 w-full sm:w-auto"
                >
                  Adjust Budget
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBudgetAlert(false)}
                  className="text-red-600 hover:bg-red-100 w-full sm:w-auto"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Travel Countdown */}
        {user && isInitialized && !isLoading && (
          <div className="mb-8">
            <TravelCountdown
              key={selectedTravelProfile || "personal"}
              travelProfileId={selectedTravelProfile || ""}
            />
          </div>
        )}

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Budget Card - Now includes warnings */}
          <Card
            className={`bg-gradient-to-br border shadow-lg hover:shadow-xl transition-all duration-300 ${
              !budget?.amount
                ? "from-slate-50 to-slate-100 border-slate-200"
                : isOverBudget
                ? "from-red-50 to-red-100 border-red-200"
                : isNearBudget
                ? "from-amber-50 to-yellow-100 border-amber-200"
                : "from-blue-50 to-blue-100 border-blue-200"
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle
                className={`text-sm font-medium ${
                  !budget?.amount
                    ? "text-slate-800"
                    : isOverBudget
                    ? "text-red-800"
                    : isNearBudget
                    ? "text-amber-800"
                    : "text-blue-800"
                }`}
              >
                Total Budget
                {budget?.amount && (
                  <span
                    className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isOverBudget
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : isNearBudget
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {isOverBudget
                      ? "⚠️ Exceeded"
                      : isNearBudget
                      ? "⚠️ Warning"
                      : "✅ Safe"}
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center space-x-2">
                {!budget?.amount ? (
                  <Wallet className="h-4 w-4 text-slate-700" />
                ) : isOverBudget ? (
                  <AlertTriangle className="h-4 w-4 text-red-700" />
                ) : isNearBudget ? (
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                ) : (
                  <Wallet className="h-4 w-4 text-blue-700" />
                )}
                <Dialog
                  open={isBudgetDialogOpen}
                  onOpenChange={setIsBudgetDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-6 w-6 p-0 transition-colors ${
                        !budget?.amount
                          ? "hover:bg-slate-200"
                          : isOverBudget
                          ? "hover:bg-red-200"
                          : isNearBudget
                          ? "hover:bg-amber-200"
                          : "hover:bg-blue-200"
                      }`}
                    >
                      <Settings
                        className={`h-3 w-3 ${
                          !budget?.amount
                            ? "text-slate-700"
                            : isOverBudget
                            ? "text-red-700"
                            : isNearBudget
                            ? "text-amber-700"
                            : "text-blue-700"
                        }`}
                      />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-slate-200">
                    <DialogHeader>
                      <DialogTitle className="text-slate-900">Set Budget (Optional)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="budget" className="text-slate-700 font-medium">Budget Amount (€)</Label>
                        <Input
                          id="budget"
                          type="number"
                          value={tempBudget}
                          onChange={(e) =>
                            setTempBudget(Number(e.target.value))
                          }
                          placeholder="Enter budget amount (optional)"
                          min="0"
                          step="0.01"
                          className="text-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500">
                          Leave empty if you don't want to set a budget
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <Button
                          variant="outline"
                          onClick={async () => {
                            console.log("Remove Budget button clicked!");
                            console.log("Current budget:", budget);
                            console.log("Calling removeBudget directly...");

                            const success = await removeBudget();
                            if (success) {
                              setIsBudgetDialogOpen(false);
                              setShowBudgetAlert(false);
                            }
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50 bg-white"
                        >
                          Remove Budget
                        </Button>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsBudgetDialogOpen(false)}
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-white"
                          >
                            Cancel
                          </Button>
                          <Button onClick={stableHandleBudgetUpdate} className="bg-blue-600 hover:bg-blue-700">
                            {budget ? "Update Budget" : "Set Budget"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {budget?.amount ? (
                <>
                  <div
                    className={`text-3xl font-bold ${
                      isOverBudget
                        ? "text-red-900"
                        : isNearBudget
                        ? "text-amber-900"
                        : "text-blue-900"
                    }`}
                  >
                    €{budgetAmount.toLocaleString()}
                  </div>

                  {/* Warning/Status Info - Mobile Optimized */}
                  <div className="mt-2 space-y-1">
                    {isOverBudget ? (
                      <div className="text-sm text-red-700 font-medium">
                        ⚠️ Over budget by €
                        {Math.abs(remainingBudget).toLocaleString()}
                      </div>
                    ) : isNearBudget ? (
                      <div className="text-sm text-amber-700 font-medium">
                        ⚠️ {budgetUsagePercentage}% used - €
                        {remainingBudget.toLocaleString()} remaining
                      </div>
                    ) : (
                      <div className="text-sm text-blue-700 font-medium">
                        ✅ {budgetUsagePercentage}% used - €
                        {remainingBudget.toLocaleString()} remaining
                      </div>
                    )}

                    {/* Quick Action Button for Warnings */}
                    {(isOverBudget || isNearBudget) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsBudgetDialogOpen(true)}
                        className={`mt-2 w-full text-xs ${
                          isOverBudget
                            ? "border-red-300 text-red-700 hover:bg-red-100"
                            : "border-amber-300 text-amber-700 hover:bg-amber-100"
                        }`}
                      >
                        {isOverBudget ? "Increase Budget" : "Adjust Budget"}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-medium text-slate-600">
                    No Budget Set
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Click settings to set a budget (optional)
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Spent Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">
                Total Spent
              </CardTitle>
              <Plane className="h-4 w-4 text-orange-700" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                €{totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-orange-700 mt-1">
                {budget?.amount
                  ? `${budgetUsagePercentage}% of budget used`
                  : `${expenses.length} expense categories`}
              </p>
            </CardContent>
          </Card>

          {/* Remaining Budget Card */}
          <Card
            className={`bg-gradient-to-br ${
              !budget?.amount
                ? "from-slate-50 to-slate-100 border-slate-200"
                : isOverBudget
                ? "from-red-50 to-red-100 border-red-200"
                : isNearBudget
                ? "from-yellow-50 to-amber-100 border-yellow-200"
                : "from-emerald-50 to-green-100 border-green-200"
            } shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle
                className={`text-sm font-medium ${
                  !budget?.amount
                    ? "text-slate-800"
                    : isOverBudget
                    ? "text-red-800"
                    : isNearBudget
                    ? "text-amber-700"
                    : "text-emerald-800"
                }`}
              >
                {budget?.amount ? "Remaining Budget" : "Budget Status"}
              </CardTitle>
              <div className="flex items-center space-x-2">
                {!budget?.amount ? (
                  <Wallet className="h-4 w-4 text-slate-700" />
                ) : isOverBudget ? (
                  <AlertTriangle className="h-4 w-4 text-red-700" />
                ) : isNearBudget ? (
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-emerald-700" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {budget?.amount ? (
                <>
                  <div
                    className={`text-3xl font-bold ${
                      isOverBudget
                        ? "text-red-900"
                        : isNearBudget
                        ? "text-amber-900"
                        : "text-emerald-900"
                    }`}
                  >
                    €{remainingBudget.toLocaleString()}
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      isOverBudget
                        ? "text-red-700 font-semibold"
                        : isNearBudget
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {isOverBudget
                      ? `⚠️ Over budget by €${Math.abs(
                          remainingBudget
                        ).toLocaleString()}`
                      : isNearBudget
                      ? "⚠️ Near budget limit"
                      : "✅ Within budget"}
                  </p>

                  {/* Mobile-friendly progress indicator */}
                  <div className="mt-3">
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isOverBudget
                            ? "bg-red-500"
                            : isNearBudget
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${Math.min(budgetUsagePercentage, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 mt-1">
                      <span>0%</span>
                      <span>{budgetUsagePercentage}%</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-medium text-slate-700">
                    No Budget Set
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Set a budget to track spending
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress Bar - Only show if budget is set */}
        {budget?.amount && (
          <Card className="bg-white shadow-lg border-slate-200">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Progress Header */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Budget Progress
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-slate-600">Used</div>
                      <div className="font-bold text-lg text-slate-900">
                        {budgetUsagePercentage}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-600">Remaining</div>
                      <div className="font-bold text-lg text-slate-900">
                        {Math.max(100 - budgetUsagePercentage, 0)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ${
                        isOverBudget
                          ? "bg-red-500"
                          : isNearBudget
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(budgetUsagePercentage, 100)}%`,
                      }}
                    ></div>
                  </div>

                  {/* Progress Labels */}
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>€0</span>
                    <span>€{budgetAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Detailed Progress Stats */}
                {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-800">
                    €{totalSpent.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-600">Total Spent</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-800">
                    €{remainingBudget.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-600">Remaining</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-800">
                    {expenses.length}
                  </div>
                  <div className="text-xs text-slate-600">Expenses</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-800">
                    {expenses.length > 0
                      ? `€${Math.round(
                          totalSpent / expenses.length
                        ).toLocaleString()}`
                      : "€0"}
                  </div>
                  <div className="text-xs text-slate-600">Average</div>
                </div>
              </div> */}

                {/* Budget Status Indicator */}
                <div className="flex justify-center">
                  <div
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                      isOverBudget
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : isNearBudget
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {isOverBudget ? (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Budget Exceeded
                      </>
                    ) : isNearBudget ? (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Near Budget Limit
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Within Budget
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Table */}
          <div className="space-y-6">
            <ExpenseTable
              key={`table-${selectedTravelProfile || "personal"}`}
              expenses={expenses}
              onUpdateExpense={stableHandleExpenseUpdate}
              onAddExpense={stableHandleExpenseAdd}
              onDeleteExpense={stableHandleExpenseDelete}
            />
          </div>

          {/* Charts */}
          <div className="space-y-6">
            {/* Expense Analytics */}
            {user && isInitialized && !isLoading && expenses.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Expense Analytics</span>
                  </h2>
                </div>
                <ExpenseCharts
                  key={`charts-${selectedTravelProfile || "personal"}`}
                  expenses={expenses}
                />
              </div>
            )}
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex justify-center space-x-3">
          <Button
            onClick={() => exportData("excel")}
            disabled={isExporting}
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Euro className="h-4 w-4 mr-2" />
                Export Excel
              </>
            )}
          </Button>
        </div>

        {/* Debug Information (Development Only) */}
        {process.env.NODE_ENV === "development" && user && (
          <div className="bg-slate-100 rounded-lg border border-slate-300 p-4 text-xs">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>Selected Profile: {selectedTravelProfile || "None"}</div>
              <div>Profile Count: {travelProfiles.length}</div>
              <div>Expenses: {expenses.length}</div>
              <div>Budget: {budget ? `€${budget.amount}` : "None"}</div>
              <div>Loading: {isLoading ? "Yes" : "No"}</div>
              <div>Initialized: {isInitialized ? "Yes" : "No"}</div>
              <div>Switching: {isSwitchingProfile ? "Yes" : "No"}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default TravelExpensesTracker;