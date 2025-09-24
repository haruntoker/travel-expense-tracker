"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CalendarDays,
  Check,
  Circle,
  Clock,
  Edit3,
  List,
  Loader2,
  Plus,
  SaveIcon,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Expense {
  id: string;
  category: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ExpenseTableProps {
  expenses: Expense[];
  onUpdateExpense: (id: string, amount: number, category?: string) => void;
  onAddExpense: (category: string, amount: number) => void;
  onDeleteExpense: (id: string) => void;
}

type SortField = "category" | "amount" | "createdAt";
type SortDirection = "asc" | "desc";

interface TimelineDay {
  date: string;
  displayDate: string;
  fullDate: string;
  expenses: Expense[];
  totalAmount: number;
  isToday: boolean;
  isYesterday: boolean;
  dayOfWeek: string;
}

export const ExpenseTable = memo(function ExpenseTable({
  expenses,
  onUpdateExpense,
  onAddExpense,
  onDeleteExpense,
}: ExpenseTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("table");

  const categoryInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Effect to prevent auto-focus when the edit dialog opens
  useEffect(() => {
    if (editDialogOpen) {
      // Blur any active element to prevent unwanted keyboard appearance
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      // Explicitly blur the input fields if they exist
      categoryInputRef.current?.blur();
      amountInputRef.current?.blur();
    }
  }, [editDialogOpen]);

  // Memoized filtered and sorted expenses
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = expenses.filter((expense) =>
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortField) {
        case "category":
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "createdAt":
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [expenses, searchTerm, sortField, sortDirection]);

  // Sorting handler
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField]
  );

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <SortAsc className="h-3 w-3 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <SortAsc className="h-3 w-3 text-blue-600" />
    ) : (
      <SortDesc className="h-3 w-3 text-blue-600" />
    );
  };

  // Edit handlers
  const startEditing = useCallback(
    (id: string, currentAmount: number, currentCategory: string) => {
      setExpenseToEdit({
        id,
        amount: currentAmount,
        category: currentCategory,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setEditValue(currentAmount.toString());
      setEditCategory(currentCategory);
      setEditDialogOpen(true);
    },
    []
  );

  const saveEditConfirmed = useCallback(() => {
    if (expenseToEdit) {
      setIsSaving(true);
      const amount = Number.parseFloat(editValue);
      if (isNaN(amount) || amount < 0) {
        setIsSaving(false);
        return;
      }
      try {
        onUpdateExpense(expenseToEdit.id, amount, editCategory);
        setEditDialogOpen(false);
        setExpenseToEdit(null);
        setEditingId(null); // Reset editingId from inline edit
      } finally {
        setIsSaving(false);
      }
    }
  }, [expenseToEdit, editValue, editCategory, onUpdateExpense]);

  const cancelEditDialog = useCallback(() => {
    setEditDialogOpen(false);
    setEditValue("");
    setEditCategory("");
    setExpenseToEdit(null);
    setEditingId(null);
  }, []);

  // Add new expense handlers
  const handleAddNew = useCallback(() => {
    if (newCategory.trim() && newAmount.trim()) {
      const amount = Number.parseFloat(newAmount);
      if (isNaN(amount) || amount < 0) {
        return;
      }
      onAddExpense(newCategory.trim(), amount);
      setNewCategory("");
      setNewAmount("");
      setIsAddingNew(false);
    }
  }, [newCategory, newAmount, onAddExpense]);

  const cancelAddNew = useCallback(() => {
    setNewCategory("");
    setNewAmount("");
    setIsAddingNew(false);
  }, []);

  // Delete handlers
  const handleDeleteClick = useCallback((expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (expenseToDelete) {
      setIsDeleting(true);
      try {
        onDeleteExpense(expenseToDelete.id);
        setDeleteDialogOpen(false);
        setExpenseToDelete(null);
      } finally {
        setIsDeleting(false);
      }
    }
  }, [expenseToDelete, onDeleteExpense]);

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
  }, []);

  // Calculations
  const totalAmount = useMemo(
    () =>
      filteredAndSortedExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      ),
    [filteredAndSortedExpenses]
  );

  const averageAmount = useMemo(
    () =>
      filteredAndSortedExpenses.length > 0
        ? totalAmount / filteredAndSortedExpenses.length
        : 0,
    [filteredAndSortedExpenses.length, totalAmount]
  );

  // Timeline data processing
  const timelineData = useMemo(() => {
    if (!expenses.length) return [];

    // Group expenses by date
    const grouped = expenses.reduce((acc, expense) => {
      const date = new Date(expense.createdAt);
      const dateKey = date.toDateString();

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          expenses: [],
          totalAmount: 0,
        };
      }

      acc[dateKey].expenses.push(expense);
      acc[dateKey].totalAmount += expense.amount;

      return acc;
    }, {} as Record<string, { date: string; expenses: Expense[]; totalAmount: number }>);

    // Convert to array and sort by date (most recent first)
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    return Object.values(grouped)
      .map((group) => {
        const date = new Date(group.date);
        return {
          date: group.date,
          displayDate: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          fullDate: date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          dayOfWeek: date.toLocaleDateString("en-US", { weekday: "short" }),
          expenses: group.expenses.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
          totalAmount: group.totalAmount,
          isToday: group.date === today,
          isYesterday: group.date === yesterday,
        } as TimelineDay;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses]);

  // Timeline statistics
  const averagePerDay = useMemo(
    () => (timelineData.length > 0 ? totalAmount / timelineData.length : 0),
    [totalAmount, timelineData.length]
  );

  // Format date helper
  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, []);

  return (
    <>
      <Card className="shadow-lg border-slate-200 h-full flex flex-col">
        <CardHeader className="p-4 sm:p-6 flex-1 flex flex-col">
          <CardTitle className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <span className="text-slate-900 text-sm sm:text-lg">
                Expense Breakdown
              </span>
              <Badge
                variant="secondary"
                className="text-xs bg-slate-100 text-slate-700 border-slate-300"
              >
                {expenses.length} categories
              </Badge>
            </div>
            <div className="flex-shrink-0 ml-auto">
              <Button
                onClick={() => setIsAddingNew(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 transition-colors text-white text-xs sm:text-sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Add Expense
              </Button>
            </div>
          </CardTitle>

          {/* Tabs Navigation */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full flex-1 flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
              <TabsTrigger
                value="table"
                className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
              >
                <List className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Table</span>
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
              >
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Timeline</span>
              </TabsTrigger>
            </TabsList>

            {/* Table View */}
            <TabsContent
              value="table"
              className="space-y-4 mt-4 flex-1 flex flex-col"
            >
              {/* Search and Stats */}
              <div className="flex flex-col gap-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                  <Input
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 border-slate-300 focus:border-blue-500 w-full text-xs sm:text-sm"
                  />
                </div>

                <div className="flex items-center justify-center sm:justify-start text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Avg: €{averageAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="w-full">
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <div className="min-w-[320px]">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-100">
                          <TableHead
                            className="font-semibold cursor-pointer hover:bg-slate-100 transition-colors text-slate-700 text-xs sm:text-sm w-2/5 min-w-[120px]"
                            onClick={() => handleSort("category")}
                          >
                            <div className="flex items-center space-x-1 truncate">
                              <span className="hidden sm:inline">
                                Expense Category
                              </span>
                              <span className="sm:hidden">Category</span>
                              <SortIcon field="category" />
                            </div>
                          </TableHead>
                          <TableHead
                            className="font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors text-slate-700 text-xs sm:text-sm w-1/5 min-w-[80px]"
                            onClick={() => handleSort("amount")}
                          >
                            <div className="flex items-center justify-end space-x-1">
                              <span className="hidden sm:inline">
                                Amount (€)
                              </span>
                              <span className="sm:hidden">Amount</span>
                              <SortIcon field="amount" />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-center text-slate-700 text-xs sm:text-sm hidden sm:table-cell w-1/4">
                            Created
                          </TableHead>
                          <TableHead className="font-semibold text-center text-slate-700 text-xs sm:text-sm w-1/5 min-w-[80px]">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Add New Row - Now at the top */}
                        {isAddingNew && (
                          <TableRow className="bg-blue-50 border-2 border-blue-200">
                            <TableCell className="p-2 sm:p-4">
                              <Input
                                placeholder="Category"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAddNew();
                                  if (e.key === "Escape") cancelAddNew();
                                }}
                                className="border-blue-300 focus:border-blue-500 text-xs sm:text-sm w-full"
                              />
                            </TableCell>
                            <TableCell className="p-2 sm:p-4">
                              <Input
                                placeholder="0.00"
                                value={newAmount}
                                onChange={(e) => setNewAmount(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAddNew();
                                  if (e.key === "Escape") cancelAddNew();
                                }}
                                type="number"
                                min="0"
                                step="0.01"
                                className="text-right border-blue-300 focus:border-blue-500 text-xs sm:text-sm w-full"
                              />
                            </TableCell>
                            <TableCell className="text-center text-slate-500 hidden sm:table-cell">
                              -
                            </TableCell>
                            <TableCell className="p-1 sm:p-2">
                              <div className="flex justify-center gap-1 max-w-full">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleAddNew}
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-6 w-6 sm:h-7 sm:w-7 p-0 flex-shrink-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelAddNew}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 sm:h-7 sm:w-7 p-0 flex-shrink-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}

                        {filteredAndSortedExpenses.map((expense) => (
                          <TableRow
                            key={expense.id}
                            className="hover:bg-slate-50 transition-colors group border-slate-200"
                          >
                            <TableCell className="font-medium text-slate-900 p-2 sm:p-4">
                              {editingId === expense.id ? (
                                <Input
                                  value={editCategory}
                                  onChange={(e) =>
                                    setEditCategory(e.target.value)
                                  }
                                  className="border-blue-300 focus:border-blue-500 text-xs sm:text-sm w-full"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEditConfirmed();
                                    if (e.key === "Escape") cancelEditDialog();
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col space-y-1">
                                  <span className="text-xs sm:text-sm font-medium truncate">
                                    {expense.category}
                                  </span>
                                  {expense.amount === 0 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-amber-600 border-amber-300 bg-amber-50 w-fit flex-shrink-0"
                                    >
                                      No amount set
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="text-right p-2 sm:p-4">
                              {editingId === expense.id ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) =>
                                      setEditValue(e.target.value)
                                    }
                                    className="w-14 sm:w-20 text-right border-blue-300 focus:border-blue-500 text-xs sm:text-sm"
                                    min="0"
                                    step="0.01"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        saveEditConfirmed();
                                      if (e.key === "Escape")
                                        cancelEditDialog();
                                    }}
                                  />
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={saveEditConfirmed}
                                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-5 w-5 sm:h-6 sm:w-6 p-0"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={cancelEditDialog}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-5 w-5 sm:h-6 sm:w-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-right">
                                  <button
                                    onClick={() =>
                                      startEditing(
                                        expense.id,
                                        expense.amount,
                                        expense.category
                                      )
                                    }
                                    className={cn(
                                      "w-full text-right hover:bg-blue-50 px-1 sm:px-2 py-1 rounded transition-all duration-200 text-xs sm:text-sm",
                                      "hover:shadow-sm border border-transparent hover:border-blue-200 truncate",
                                      expense.amount === 0 &&
                                        "text-amber-600 font-medium"
                                    )}
                                  >
                                    €{expense.amount.toLocaleString()}
                                  </button>
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="text-center text-xs sm:text-sm text-slate-500 hidden sm:table-cell">
                              <div className="flex items-center justify-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(expense.createdAt)}</span>
                              </div>
                            </TableCell>

                            <TableCell className="p-1 sm:p-2">
                              <div className="flex items-center justify-center gap-1 max-w-full">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    startEditing(
                                      expense.id,
                                      expense.amount,
                                      expense.category
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 sm:h-7 sm:w-7 p-0 flex-shrink-0"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteClick(expense)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 sm:h-7 sm:w-7 p-0 flex-shrink-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Total Row */}
                        <TableRow className="border-t-2 bg-gradient-to-r from-slate-50 to-blue-50 font-semibold">
                          <TableCell className="text-sm sm:text-base text-slate-900 p-2 sm:p-4">
                            Total
                          </TableCell>
                          <TableCell className="text-right text-sm sm:text-base text-blue-700 p-2 sm:p-4">
                            €{totalAmount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center text-slate-600 hidden sm:table-cell p-2 sm:p-4">
                            {filteredAndSortedExpenses.length} categories
                          </TableCell>
                          <TableCell className="p-1 sm:p-2"></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Empty State */}
                  {filteredAndSortedExpenses.length === 0 && (
                    <div className="text-center py-8 text-slate-500 px-4">
                      {searchTerm ? (
                        <div className="space-y-2">
                          <Search className="h-12 w-12 mx-auto text-slate-300" />
                          <p className="text-sm sm:text-base">
                            No expenses found matching "{searchTerm}"
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => setSearchTerm("")}
                            className="border-slate-300 text-slate-700 hover:bg-slate-100 w-full sm:w-auto"
                          >
                            Clear search
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Plus className="h-12 w-12 mx-auto text-slate-300" />
                          <p className="text-sm sm:text-base">
                            No expenses yet. Add your first expense category to
                            get started!
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Timeline View */}
            <TabsContent
              value="timeline"
              className="space-y-4 flex-1 flex flex-col overflow-y-auto"
            >
              {/* Timeline Stats Header - Minimalistic */}
              <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
                {/* Subtle Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-blue-50"></div>

                {/* Content */}
                <div className="relative flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm">
                        Timeline View
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-600">
                        <span className="px-2 py-0.5 bg-blue-50 rounded-full border border-blue-200 text-blue-700">
                          {timelineData.length} days
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-medium text-slate-700">
                          €{totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      €{averagePerDay.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      avg per day
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Content */}
              {timelineData.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CalendarDays className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    No Timeline Data
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Add some expenses to see your spending timeline
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline Line - Minimalistic */}
                  <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-slate-300 rounded-full"></div>

                  <div className="space-y-6">
                    {timelineData.map((day, dayIndex) => (
                      <div key={day.date} className="relative group">
                        {/* Timeline Dot - Minimalistic */}
                        <div className="absolute left-5 sm:left-7 flex items-center justify-center z-10">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full transition-colors duration-200",
                              day.isToday
                                ? "bg-emerald-500"
                                : day.isYesterday
                                ? "bg-amber-500"
                                : "bg-blue-500"
                            )}
                          />
                        </div>

                        {/* Day Card - Minimalistic */}
                        <div className="ml-10 sm:ml-12 transition-all duration-200">
                          <Card
                            className={cn(
                              "border shadow-sm hover:shadow-md transition-all duration-200",
                              day.isToday
                                ? "border-emerald-200 bg-emerald-50"
                                : day.isYesterday
                                ? "border-amber-200 bg-amber-50"
                                : "border-slate-200 bg-white"
                            )}
                          >
                            <CardContent className="p-4">
                              {/* Date Header - Minimalistic */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={cn(
                                      "w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0",
                                      day.isToday
                                        ? "bg-emerald-500"
                                        : day.isYesterday
                                        ? "bg-amber-500"
                                        : "bg-blue-500"
                                    )}
                                  >
                                    <div className="text-center">
                                      <div className="text-xs font-medium">
                                        {day.dayOfWeek}
                                      </div>
                                      <div className="text-sm font-bold">
                                        {new Date(day.date).getDate()}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="text-lg font-semibold text-slate-800">
                                      {day.isToday
                                        ? "Today"
                                        : day.isYesterday
                                        ? "Yesterday"
                                        : day.displayDate}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                      {day.fullDate}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <div
                                      className={cn(
                                        "text-xl font-bold",
                                        day.totalAmount > averagePerDay
                                          ? "text-red-600"
                                          : "text-emerald-600"
                                      )}
                                    >
                                      €{day.totalAmount.toLocaleString()}
                                    </div>
                                    {day.totalAmount > averagePerDay ? (
                                      <TrendingUp className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <TrendingDown className="h-4 w-4 text-emerald-500" />
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    {day.expenses.length} expense
                                    {day.expenses.length !== 1 ? "s" : ""}
                                  </div>
                                </div>
                              </div>

                              {/* Expenses List - Minimalistic */}
                              <div className="space-y-2">
                                {day.expenses.map((expense, expenseIndex) => {
                                  const time = new Date(
                                    expense.createdAt
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  });
                                  const percentage = (
                                    (expense.amount / day.totalAmount) *
                                    100
                                  ).toFixed(1);

                                  return (
                                    <div
                                      key={expense.id}
                                      className="group/expense rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-all duration-200 hover:shadow-sm"
                                    >
                                      <div className="flex items-center justify-between p-3">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                          <div className="min-w-0">
                                            <div className="font-semibold text-slate-800 text-sm">
                                              {expense.category}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center space-x-1">
                                              <Clock className="h-3 w-3 text-slate-400" />
                                              <span>{time}</span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="text-right">
                                          <div className="font-bold text-slate-800 text-sm">
                                            €{expense.amount.toLocaleString()}
                                          </div>
                                          <div className="text-xs text-slate-500">
                                            {percentage}%
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Day Summary */}
                              {day.expenses.length > 1 && (
                                <div className="mt-4 pt-3 border-t border-slate-200">
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2 text-slate-600">
                                      <Circle className="h-3 w-3" />
                                      <span>Day Summary</span>
                                    </div>
                                    <Badge
                                      variant="secondary"
                                      className={cn(
                                        "text-xs font-medium",
                                        day.totalAmount > averagePerDay
                                          ? "bg-red-100 text-red-800 border-red-200"
                                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                                      )}
                                    >
                                      {day.totalAmount > averagePerDay
                                        ? "Above Average"
                                        : "Below Average"}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Timeline End */}
                  <div className="relative mt-8">
                    <div className="absolute left-4 sm:left-6 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 border-2 border-slate-200"></div>
                    </div>
                    <div className="ml-12 sm:ml-16">
                      <div className="text-center py-4">
                        <p className="text-sm text-slate-500">
                          Timeline Start • {timelineData.length} days tracked
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-50 border-zinc-200 rounded-2xl shadow-xl p-6 transform transition-all sm:w-full sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4 text-center">
            <DialogTitle className="flex flex-col items-center space-y-2 text-red-600 font-extrabold text-2xl">
              <Trash2 className="h-10 w-10 text-red-400 mb-2" />
              <span>Confirm Deletion</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-600 text-base leading-relaxed mt-2 mx-4">
              You are about to delete the expense "
              <span className="font-semibold text-zinc-800">
                {expenseToDelete?.category}
              </span>
              " with amount €
              <span className="font-semibold text-zinc-800">
                {expenseToDelete?.amount?.toLocaleString()}
              </span>
              . This action cannot be undone and the data will be permanently
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-6 w-full">
            <Button
              variant="outline"
              onClick={cancelDelete}
              className="w-full sm:w-1/2 border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition-all duration-200 rounded-lg py-2"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className={cn(
                "w-full sm:w-1/2 bg-red-500 hover:bg-red-600 text-white transition-all duration-200 rounded-lg py-2",
                isDeleting && "opacity-70 cursor-not-allowed"
              )}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Expense
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Confirmation Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          className="sm:max-w-md bg-zinc-50 border-zinc-200 rounded-2xl shadow-xl p-6 transform transition-all sm:w-full sm:mx-auto max-h-[90vh] overflow-y-auto"
          tabIndex={-1}
        >
          <DialogHeader className="mb-4 text-center">
            <DialogTitle className="flex flex-col items-center space-y-2 text-blue-600 font-extrabold text-2xl">
              <Edit3 className="h-10 w-10 text-blue-400 mb-2" />
              <span>Edit Expense</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-600 text-base leading-relaxed mt-2 mx-4 mb-4">
              Make changes to the expense below. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 px-4">
            <div className="flex items-center gap-4">
              <Label
                htmlFor="editCategory"
                className="text-zinc-700 font-medium text-left w-[100px] flex-shrink-0"
              >
                Category
              </Label>
              <Input
                id="editCategory"
                ref={categoryInputRef}
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEditConfirmed();
                  if (e.key === "Escape") cancelEditDialog();
                }}
                className="text-right border-blue-300 focus:border-blue-500 text-base rounded-lg px-4 py-2 flex-grow"
                autoFocus={false}
              />
            </div>
            <div className="flex items-center gap-4">
              <Label
                htmlFor="editAmount"
                className="text-zinc-700 font-medium text-left w-[100px] flex-shrink-0"
              >
                Amount (€)
              </Label>
              <Input
                id="editAmount"
                ref={amountInputRef}
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEditConfirmed();
                  if (e.key === "Escape") cancelEditDialog();
                }}
                min="0"
                step="0.01"
                className="text-right border-blue-300 focus:border-blue-500 text-base rounded-lg px-4 py-2 flex-grow"
                autoFocus={false}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-6 w-full">
            <Button
              variant="outline"
              onClick={cancelEditDialog}
              className="w-full sm:w-1/2 border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition-all duration-200 rounded-lg py-2"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={saveEditConfirmed}
              className={cn(
                "w-full sm:w-1/2 bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 rounded-lg py-2",
                isSaving && "opacity-70 cursor-not-allowed"
              )}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <SaveIcon className="h-4 w-4 mr-2" /> Save Changes
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

/*
  TODO: Add confirmation dialog for editing expenses with a soft blue/green color scheme for the edit action.
*/
