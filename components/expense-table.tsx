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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Check,
  Edit3,
  Plus,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";

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
      setEditingId(id);
      setEditValue(currentAmount.toString());
      setEditCategory(currentCategory);
    },
    []
  );

  const saveEdit = useCallback(() => {
    if (editingId) {
      const amount = Number.parseFloat(editValue);
      if (isNaN(amount) || amount < 0) {
        return;
      }
      onUpdateExpense(editingId, amount, editCategory);
      setEditingId(null);
      setEditValue("");
      setEditCategory("");
    }
  }, [editingId, editValue, editCategory, onUpdateExpense]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue("");
    setEditCategory("");
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
      onDeleteExpense(expenseToDelete.id);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
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
    <Card className="shadow-lg border-slate-200">
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="text-slate-900 text-base sm:text-lg">
              Expense Breakdown
            </span>
            <Badge
              variant="secondary"
              className="text-xs bg-slate-100 text-slate-700 border-slate-300"
            >
              {filteredAndSortedExpenses.length} categories
            </Badge>
          </div>
          <Button
            onClick={() => setIsAddingNew(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 transition-colors text-white w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </CardTitle>

        {/* Search and Stats */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-300 focus:border-blue-500 w-full"
            />
          </div>

          <div className="flex items-center justify-center sm:justify-start text-sm text-slate-600">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4" />
              <span>Avg: €{averageAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-100">
                    <TableHead
                      className="font-semibold cursor-pointer hover:bg-slate-100 transition-colors text-slate-700 text-xs sm:text-sm"
                      onClick={() => handleSort("category")}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="hidden sm:inline">
                          Expense Category
                        </span>
                        <span className="sm:hidden">Category</span>
                        <SortIcon field="category" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors text-slate-700 text-xs sm:text-sm"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span className="hidden sm:inline">Amount (€)</span>
                        <span className="sm:hidden">Amount</span>
                        <SortIcon field="amount" />
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center text-slate-700 text-xs sm:text-sm hidden sm:table-cell">
                      Created
                    </TableHead>
                    <TableHead className="w-[80px] sm:w-[120px] text-center text-slate-700 text-xs sm:text-sm">
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
                          placeholder="Enter expense category"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddNew();
                            if (e.key === "Escape") cancelAddNew();
                          }}
                          className="border-blue-300 focus:border-blue-500 text-sm"
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
                          className="text-right border-blue-300 focus:border-blue-500 text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-center text-slate-500 hidden sm:table-cell">
                        -
                      </TableCell>
                      <TableCell className="p-2 sm:p-4">
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleAddNew}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelAddNew}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
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
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="border-blue-300 focus:border-blue-500 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="flex flex-col space-y-1">
                            <span className="text-sm sm:text-base">
                              {expense.category}
                            </span>
                            {expense.amount === 0 && (
                              <Badge
                                variant="outline"
                                className="text-xs text-amber-600 border-amber-300 bg-amber-50 w-fit"
                              >
                                No amount set
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-right p-2 sm:p-4">
                        {editingId === expense.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-20 sm:w-24 text-right border-blue-300 focus:border-blue-500 text-sm"
                              min="0"
                              step="0.01"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit();
                                if (e.key === "Escape") cancelEdit();
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={saveEdit}
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              startEditing(
                                expense.id,
                                expense.amount,
                                expense.category
                              )
                            }
                            className={cn(
                              "text-right hover:bg-blue-50 px-2 sm:px-3 py-2 rounded transition-all duration-200 text-sm sm:text-base",
                              "hover:shadow-sm border border-transparent hover:border-blue-200",
                              expense.amount === 0 &&
                                "text-amber-600 font-medium"
                            )}
                          >
                            €{expense.amount.toLocaleString()}
                          </button>
                        )}
                      </TableCell>

                      <TableCell className="text-center text-xs sm:text-sm text-slate-500 hidden sm:table-cell">
                        <div className="flex items-center justify-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(expense.createdAt)}</span>
                        </div>
                      </TableCell>

                      <TableCell className="p-2 sm:p-4">
                        <div className="flex items-center justify-center space-x-1">
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
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(expense)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total Row */}
                  <TableRow className="border-t-2 bg-gradient-to-r from-slate-50 to-blue-50 font-semibold">
                    <TableCell className="text-base sm:text-lg text-slate-900 p-2 sm:p-4">
                      Total
                    </TableCell>
                    <TableCell className="text-right text-base sm:text-lg text-blue-700 p-2 sm:p-4">
                      €{totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center text-slate-600 hidden sm:table-cell p-2 sm:p-4">
                      {filteredAndSortedExpenses.length} categories
                    </TableCell>
                    <TableCell className="p-2 sm:p-4"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
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
                  No expenses yet. Add your first expense category to get
                  started!
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <span>Delete Expense</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{expenseToDelete?.category}" with
              amount €{expenseToDelete?.amount?.toLocaleString()}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={cancelDelete}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
});
