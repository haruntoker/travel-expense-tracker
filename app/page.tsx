"use client";

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
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  CheckCircle,
  Euro,
  Plane,
  Settings,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

export interface Expense {
  id: string;
  category: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const INITIAL_EXPENSES: Expense[] = [
  {
    id: "1",
    category: "Airline Ticket",
    amount: 450,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    category: "Rental Car",
    amount: 280,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    category: "Accommodation",
    amount: 600,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const DEFAULT_BUDGET = 2000;
const STORAGE_KEYS = {
  EXPENSES: "travel-expenses",
  BUDGET: "travel-budget",
} as const;

export default function TravelExpensesTracker() {
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [budget, setBudget] = useState<number>(DEFAULT_BUDGET);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [tempBudget, setTempBudget] = useState<number>(DEFAULT_BUDGET);
  const [isExporting, setIsExporting] = useState(false);
  const [showBudgetAlert, setShowBudgetAlert] = useState(false);
  const { toast } = useToast();

  // Memoized calculations
  const totalSpent = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  const remainingBudget = useMemo(
    () => budget - totalSpent,
    [budget, totalSpent]
  );
  const budgetUsagePercentage = useMemo(
    () => Math.round((totalSpent / budget) * 100),
    [totalSpent, budget]
  );

  const isOverBudget = useMemo(() => remainingBudget < 0, [remainingBudget]);
  const isNearBudget = useMemo(
    () => budgetUsagePercentage >= 80 && budgetUsagePercentage < 100,
    [budgetUsagePercentage]
  );

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      const savedBudget = localStorage.getItem(STORAGE_KEYS.BUDGET);

      if (savedExpenses) {
        const parsedExpenses = JSON.parse(savedExpenses);
        // Convert date strings back to Date objects
        const expensesWithDates = parsedExpenses.map((expense: any) => ({
          ...expense,
          createdAt: new Date(expense.createdAt),
          updatedAt: new Date(expense.updatedAt),
        }));
        setExpenses(expensesWithDates);
      }

      if (savedBudget) {
        const budgetValue = Number(savedBudget);
        if (!isNaN(budgetValue) && budgetValue > 0) {
          setBudget(budgetValue);
          setTempBudget(budgetValue);
        }
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      toast({
        title: "⚠️ Data Load Error",
        description:
          "Failed to load saved data. Starting with default values. Your data may be corrupted.",
        variant: "destructive",
      });
    } finally {
      setIsLoaded(true);
    }
  }, [toast]);

  // Save to localStorage whenever expenses or budget change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
        localStorage.setItem(STORAGE_KEYS.BUDGET, budget.toString());
      } catch (error) {
        console.error("Error saving to localStorage:", error);
        toast({
          title: "⚠️ Save Warning",
          description:
            "Failed to save data to browser storage. Please check your browser storage settings or try clearing some space.",
          variant: "destructive",
        });
      }
    }
  }, [expenses, budget, isLoaded, toast]);

  // Check budget status and show alert if needed
  useEffect(() => {
    if (isLoaded && totalSpent > budget) {
      setShowBudgetAlert(true);
    } else if (isLoaded && totalSpent <= budget) {
      setShowBudgetAlert(false);
    }
  }, [isLoaded, totalSpent, budget]);

  // Budget management
  const handleBudgetUpdate = useCallback(() => {
    if (tempBudget <= 0) {
      toast({
        title: "❌ Invalid Budget",
        description:
          "Budget must be greater than 0. Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    setBudget(tempBudget);
    setIsBudgetDialogOpen(false);

    // Check if new budget resolves the alert
    if (totalSpent <= tempBudget) {
      setShowBudgetAlert(false);
    }

    const budgetChange = tempBudget - budget;
    const changeText =
      budgetChange > 0
        ? `increased by €${budgetChange.toLocaleString()}`
        : budgetChange < 0
        ? `decreased by €${Math.abs(budgetChange).toLocaleString()}`
        : "remains the same";

    toast({
      title: "💰 Budget Updated Successfully!",
      description: `Your budget has been ${changeText}. New total: €${tempBudget.toLocaleString()}`,
    });
  }, [tempBudget, totalSpent, budget, toast]);

  // Expense management
  const updateExpense = useCallback(
    (id: string, amount: number, category?: string) => {
      if (amount < 0) {
        toast({
          title: "❌ Invalid Amount",
          description:
            "Amount cannot be negative. Please enter a valid positive amount.",
          variant: "destructive",
        });
        return;
      }

      if (category && !category.trim()) {
        toast({
          title: "❌ Invalid Category",
          description:
            "Category name cannot be empty. Please enter a valid category name.",
          variant: "destructive",
        });
        return;
      }

      const oldExpense = expenses.find((exp) => exp.id === id);
      const oldAmount = oldExpense?.amount || 0;
      const amountChange = amount - oldAmount;
      const changeText =
        amountChange > 0
          ? `increased by €${amountChange.toLocaleString()}`
          : amountChange < 0
          ? `decreased by €${Math.abs(amountChange).toLocaleString()}`
          : "remains the same";

      setExpenses((prev) =>
        prev.map((expense) =>
          expense.id === id
            ? {
                ...expense,
                amount,
                category: category ? category.trim() : expense.category,
                updatedAt: new Date(),
              }
            : expense
        )
      );

      // Check budget after update
      const newTotalSpent = expenses.reduce(
        (sum, exp) => (exp.id === id ? sum + amount : sum + exp.amount),
        0
      );

      if (newTotalSpent > budget) {
        setShowBudgetAlert(true);
        toast({
          title: "⚠️ Budget Exceeded!",
          description: `You've exceeded your budget by €${(
            newTotalSpent - budget
          ).toLocaleString()}. Consider adjusting your budget or reducing expenses.`,
          variant: "destructive",
        });
      }

      const updateMessage = category
        ? `Expense "${category.trim()}" updated successfully! Amount ${changeText}.`
        : `Expense amount updated successfully! ${changeText}.`;

      toast({
        title: "✏️ Expense Updated!",
        description: updateMessage,
      });
    },
    [expenses, budget, toast]
  );

  const addExpense = useCallback(
    (category: string, amount: number) => {
      if (!category.trim()) {
        toast({
          title: "❌ Invalid Category",
          description:
            "Category name cannot be empty. Please enter a valid category name.",
          variant: "destructive",
        });
        return;
      }

      if (amount < 0) {
        toast({
          title: "❌ Invalid Amount",
          description:
            "Amount cannot be negative. Please enter a valid positive amount.",
          variant: "destructive",
        });
        return;
      }

      const newExpense: Expense = {
        id: Date.now().toString(),
        category: category.trim(),
        amount,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setExpenses((prev) => [...prev, newExpense]);

      // Check budget after adding
      const newTotalSpent = totalSpent + amount;
      if (newTotalSpent > budget) {
        setShowBudgetAlert(true);
        toast({
          title: "⚠️ Budget Exceeded!",
          description: `You've exceeded your budget by €${(
            newTotalSpent - budget
          ).toLocaleString()}. Consider adjusting your budget or reducing expenses.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ New Expense Added!",
          description: `Successfully added "${category.trim()}" for €${amount.toLocaleString()}. You have €${(
            budget - newTotalSpent
          ).toLocaleString()} remaining.`,
        });
      }
    },
    [totalSpent, budget, toast]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      const expenseToDelete = expenses.find((exp) => exp.id === id);
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));

      if (expenseToDelete) {
        const newTotalSpent = totalSpent - expenseToDelete.amount;
        const remainingText =
          newTotalSpent <= budget
            ? `You now have €${(
                budget - newTotalSpent
              ).toLocaleString()} remaining.`
            : `You're still over budget by €${(
                newTotalSpent - budget
              ).toLocaleString()}.`;

        toast({
          title: "🗑️ Expense Deleted!",
          description: `"${
            expenseToDelete.category
          }" (€${expenseToDelete.amount.toLocaleString()}) has been removed. ${remainingText}`,
        });
      }
    },
    [expenses, totalSpent, budget, toast]
  );

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
            { Metric: "Total Budget", Value: `€${budget.toLocaleString()}` },
            { Metric: "Total Spent", Value: `€${totalSpent.toLocaleString()}` },
            {
              Metric: "Remaining Budget",
              Value: `€${remainingBudget.toLocaleString()}`,
            },
            { Metric: "Budget Usage", Value: `${budgetUsagePercentage}%` },
            {
              Metric: "Budget Status",
              Value: isOverBudget
                ? "EXCEEDED"
                : isNearBudget
                ? "WARNING"
                : "GOOD",
            },
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
            budget,
            expenses,
            totalSpent,
            remainingBudget,
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
      budget,
      expenses,
      totalSpent,
      remainingBudget,
      budgetUsagePercentage,
      toast,
    ]
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-lg text-slate-700">
            Loading your travel expenses...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="hidden md:block p-3 bg-blue-100 rounded-full">
              <Plane className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Travel Expenses Tracker
            </h1>
          </div>
          <p className="text-slate-700 text-lg max-w-2xl mx-auto">
            Smart budget management for your travels. Track expenses, visualize
            spending patterns, and stay within budget.
          </p>

          {/* Export Buttons */}
          <div className="flex justify-center space-x-3">
            {/* <Button
              onClick={() => exportData("json")}
              disabled={isExporting}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Euro className="h-4 w-4 mr-2" />
                  Export JSON
                </>
              )}
            </Button> */}
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
        </div>

        {/* Budget Alert Banner */}
        {showBudgetAlert && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4 shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">
                    Budget Exceeded!
                  </h3>
                  <p className="text-red-700">
                    You've exceeded your budget by €
                    {Math.abs(remainingBudget).toLocaleString()}. Consider
                    adjusting your budget or reducing expenses.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBudgetAlert(false)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Near Budget Warning */}
        {!showBudgetAlert && isNearBudget && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
                <div>
                  <h3 className="text-lg font-semibold text-amber-800">
                    Budget Warning
                  </h3>
                  <p className="text-amber-700">
                    You've used {budgetUsagePercentage}% of your budget. You
                    have €{remainingBudget.toLocaleString()} remaining.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBudgetDialogOpen(true)}
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                Adjust Budget
              </Button>
            </div>
          </div>
        )}

        {/* Travel Countdown */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <TravelCountdown />
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Budget Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                Total Budget
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-blue-700" />
                <Dialog
                  open={isBudgetDialogOpen}
                  onOpenChange={setIsBudgetDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-blue-200 transition-colors"
                    >
                      <Settings className="h-3 w-3 text-blue-700" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Budget</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="budget">Budget Amount (€)</Label>
                        <Input
                          id="budget"
                          type="number"
                          value={tempBudget}
                          onChange={(e) =>
                            setTempBudget(Number(e.target.value))
                          }
                          placeholder="Enter budget amount"
                          min="0"
                          step="0.01"
                          className="text-lg"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsBudgetDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleBudgetUpdate}>
                          Update Budget
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                €{budget.toLocaleString()}
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Customizable travel budget
              </p>
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
                {budgetUsagePercentage}% of budget used
              </p>
            </CardContent>
          </Card>

          {/* Remaining Budget Card */}
          <Card
            className={`bg-gradient-to-br ${
              isOverBudget
                ? "from-red-50 to-red-100 border-red-200"
                : isNearBudget
                ? "from-yellow-50 to-amber-100 border-yellow-200"
                : "from-emerald-50 to-green-100 border-green-200"
            } shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle
                className={`text-sm font-medium ${
                  isOverBudget
                    ? "text-red-800"
                    : isNearBudget
                    ? "text-amber-800"
                    : "text-emerald-800"
                }`}
              >
                Remaining Budget
              </CardTitle>
              <div className="flex items-center space-x-2">
                {isOverBudget ? (
                  <AlertTriangle className="h-4 w-4 text-red-700" />
                ) : isNearBudget ? (
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-emerald-700" />
                )}
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress Bar */}
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
                  <span>€{budget.toLocaleString()}</span>
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Table */}
          <div className="space-y-6">
            <ExpenseTable
              expenses={expenses}
              onUpdateExpense={updateExpense}
              onAddExpense={addExpense}
              onDeleteExpense={deleteExpense}
            />
          </div>

          {/* Charts */}
          <div className="space-y-6">
            <ExpenseCharts expenses={expenses} />
          </div>
        </div>
      </div>
    </div>
  );
}
