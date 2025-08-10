"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Expense {
  id: string;
  category: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ExpenseChartsProps {
  expenses: Expense[];
}

// Enhanced color palette with better contrast and accessibility
const CHART_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#F43F5E", // Rose
];

// Custom tooltip component for better UX
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const category = entry?.payload?.category || entry?.name || "Unknown";
    const amount = entry?.value || 0;

    // Get the user-friendly index from the payload data
    const userIndex = entry?.payload?.userIndex || 1;

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        {/* Mobile: Show minimal info */}
        <p className="font-semibold text-gray-900 md:hidden">
          {userIndex}: {category}
        </p>
        {/* Desktop: Show full info */}
        <p className="font-semibold text-gray-900 hidden md:block">
          {userIndex}: {category} €{amount.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export function ExpenseCharts({ expenses }: ExpenseChartsProps) {
  // Memoized chart data calculations
  const chartData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    // Group expenses by category and calculate totals
    const categoryMap = new Map<string, number>();

    expenses.forEach((expense) => {
      if (expense.amount > 0) {
        const current = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, current + expense.amount);
      }
    });

    // Convert to array and sort by amount (descending)
    const sortedData = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    return sortedData;
  }, [expenses]);

  // Memoized total amount
  const totalAmount = useMemo(
    () => chartData.reduce((sum, item) => sum + item.amount, 0),
    [chartData]
  );

  // Memoized percentage calculations
  const chartDataWithPercentages = useMemo(
    () =>
      chartData.map((item) => ({
        ...item,
        percentage:
          totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0,
      })),
    [chartData, totalAmount]
  );

  // Memoized color assignments with user-friendly indexing (starting from 1)
  const chartDataWithColors = useMemo(
    () =>
      chartDataWithPercentages.map((item, index) => ({
        ...item,
        color: CHART_COLORS[index % CHART_COLORS.length],
        userIndex: index + 1, // Start indexing from 1 instead of 0
      })),
    [chartDataWithPercentages]
  );

  // Check if we have data to display
  const hasData = chartData.length > 0;

  if (!hasData) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-gray-600" />
            <span>Expense Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Activity className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium">No expense data available</p>
            <p className="text-sm">
              Add expenses with amounts to see charts and analytics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-slate-900">Expense Analytics</span>
          </div>
          <Badge
            variant="secondary"
            className="text-xs bg-slate-100 text-slate-700 border-slate-300"
          >
            €{totalAmount.toLocaleString()} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pie" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100">
            <TabsTrigger
              value="pie"
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Pie Chart</span>
            </TabsTrigger>
            <TabsTrigger
              value="bar"
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Bar Chart</span>
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
          </TabsList>

          {/* Pie Chart Tab */}
          <TabsContent value="pie" className="mt-6">
            {chartData.length > 0 ? (
              <div className="space-y-6">
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartDataWithColors}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ payload, percent, index }) => {
                          const category = payload?.category || "";
                          const percentage = ((percent || 0) * 100).toFixed(0);
                          const userIndex = (index || 0) + 1; // Convert to user-friendly index (1-based)
                          return (
                            <g>
                              {/* Mobile: Show minimal info */}
                              <text
                                x="0"
                                y="0"
                                textAnchor="middle"
                                className="text-xs fill-current md:hidden"
                              >
                                {userIndex}
                              </text>
                              {/* Desktop: Show full info */}
                              <text
                                x="0"
                                y="0"
                                textAnchor="middle"
                                className="text-xs fill-current hidden md:block"
                              >
                                {userIndex}: {category} €
                                {payload?.amount?.toLocaleString() || 0}
                              </text>
                            </g>
                          );
                        }}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {chartDataWithColors.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-1 gap-2 md:gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {chartDataWithColors.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {/* Mobile: Show minimal info */}
                        <span className="md:hidden">
                          {item.userIndex}: {item.category}
                        </span>
                        {/* Desktop: Show full info */}
                        <span className="hidden md:inline">
                          {item.userIndex}: {item.category} €
                          {item.amount.toLocaleString()} ({item.percentage}%)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <TrendingUp className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p>No expense data available for charting</p>
              </div>
            )}
          </TabsContent>

          {/* Bar Chart Tab */}
          <TabsContent value="bar" className="mt-6">
            {chartData.length > 0 ? (
              <div className="space-y-6">
                <div className="h-64 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataWithColors}>
                      <XAxis
                        dataKey="category"
                        tick={{ fontSize: 12, fill: "#475569" }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#475569" }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {chartDataWithColors.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Chart Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-lg font-semibold text-slate-900">
                      €
                      {Math.max(
                        ...chartData.map((d) => d.amount)
                      ).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-600">
                      Highest Expense
                    </div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-lg font-semibold text-slate-900">
                      €
                      {Math.min(
                        ...chartData.map((d) => d.amount)
                      ).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-600">Lowest Expense</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <BarChart3 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p>No expense data available for charting</p>
              </div>
            )}
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="mt-6">
            {chartData.length > 0 ? (
              <div className="space-y-6">
                {/* Top Expenses */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    Top Expenses
                  </h4>
                  <div className="space-y-2">
                    {chartDataWithColors
                      .sort((a, b) => b.amount - a.amount)
                      .slice(0, 3)
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium text-slate-700">
                              {/* Mobile: Show minimal info */}
                              <span className="md:hidden">
                                {item.userIndex}: {item.category}
                              </span>
                              {/* Desktop: Show full info */}
                              <span className="hidden md:inline">
                                {item.userIndex}: {item.category} €
                                {item.amount.toLocaleString()} (
                                {item.percentage}%)
                              </span>
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Largest vs Smallest */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-900 mb-2">
                      Largest Expense
                    </h5>
                    <div className="text-2xl font-bold text-blue-900">
                      €
                      {Math.max(
                        ...chartData.map((d) => d.amount)
                      ).toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700">
                      {/* Mobile: Show minimal info */}
                      <span className="md:hidden">
                        {
                          chartData.find(
                            (d) =>
                              d.amount ===
                              Math.max(...chartData.map((d) => d.amount))
                          )?.category
                        }
                      </span>
                      {/* Desktop: Show full info */}
                      <span className="hidden md:inline">
                        {
                          chartDataWithColors.find(
                            (d) =>
                              d.amount ===
                              Math.max(...chartData.map((d) => d.amount))
                          )?.userIndex
                        }
                        :{" "}
                        {
                          chartData.find(
                            (d) =>
                              d.amount ===
                              Math.max(...chartData.map((d) => d.amount))
                          )?.category
                        }{" "}
                        €
                        {Math.max(
                          ...chartData.map((d) => d.amount)
                        ).toLocaleString()}{" "}
                        (
                        {Math.round(
                          (Math.max(...chartData.map((d) => d.amount)) /
                            chartData.reduce((sum, d) => sum + d.amount, 0)) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h5 className="font-semibold text-emerald-900 mb-2">
                      Smallest Expense
                    </h5>
                    <div className="text-2xl font-bold text-emerald-900">
                      €
                      {Math.min(
                        ...chartData.map((d) => d.amount)
                      ).toLocaleString()}
                    </div>
                    <div className="text-sm text-emerald-700">
                      {/* Mobile: Show minimal info */}
                      <span className="md:hidden">
                        {
                          chartData.find(
                            (d) =>
                              d.amount ===
                              Math.min(...chartData.map((d) => d.amount))
                          )?.category
                        }
                      </span>
                      {/* Desktop: Show full info */}
                      <span className="hidden md:inline">
                        {
                          chartDataWithColors.find(
                            (d) =>
                              d.amount ===
                              Math.min(...chartData.map((d) => d.amount))
                          )?.userIndex
                        }
                        :{" "}
                        {
                          chartData.find(
                            (d) =>
                              d.amount ===
                              Math.min(...chartData.map((d) => d.amount))
                          )?.category
                        }{" "}
                        €
                        {Math.min(
                          ...chartData.map((d) => d.amount)
                        ).toLocaleString()}{" "}
                        (
                        {Math.round(
                          (Math.min(...chartData.map((d) => d.amount)) /
                            chartData.reduce((sum, d) => sum + d.amount, 0)) *
                            100
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Distribution Analysis */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    Distribution Analysis
                  </h4>
                  <div className="space-y-2">
                    {chartDataWithColors.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-slate-700">
                            {/* Mobile: Show minimal info */}
                            <span className="md:hidden">
                              {item.userIndex}: {item.category}
                            </span>
                            {/* Desktop: Show full info */}
                            <span className="hidden md:inline">
                              {item.userIndex}: {item.category} €
                              {item.amount.toLocaleString()} ({item.percentage}
                              %)
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${item.percentage}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-900 w-16 text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Activity className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p>No expense data available for analysis</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
