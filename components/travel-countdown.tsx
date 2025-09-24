"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDatabase } from "@/hooks/use-database";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, Clock, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

interface CountdownTime {
  days: number;
  hours: number;
  mins: number;
  secs: number;
}

export const TravelCountdown = memo(function TravelCountdown({
  travelProfileId,
  isLoading: isLoadingProp,
}: {
  travelProfileId: string;
  isLoading?: boolean;
}) {
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);
  const [tempTime, setTempTime] = useState<string>("12:00");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hasShownTravelDayNotification, setHasShownTravelDayNotification] =
    useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { toast } = useToast();

  // Use database hook with travel profile ID (can be empty string for personal use)
  const {
    travelCountdown,
    setTravelCountdown,
    clearTravelCountdown,
    isLoading,
  } = useDatabase(travelProfileId || null);

  // Combine internal and external loading states
  const isLoadingCountdown = isLoadingProp || isLoading;

  // Get travel date from database state
  const travelDate = travelCountdown?.travelDate || "";
  const isActive = travelCountdown?.isActive || false;

  const totalDurationInMs = useMemo(() => {
    if (!travelCountdown?.travelDate || !travelCountdown?.createdAt) return 0;
    const targetTime = new Date(travelCountdown.travelDate).getTime();
    const startTime = travelCountdown.createdAt.getTime();
    return Math.max(0, targetTime - startTime);
  }, [travelCountdown?.travelDate, travelCountdown?.createdAt]);

  const currentProgressPercentage = useMemo(() => {
    if (totalDurationInMs === 0) return 0; // Avoid division by zero

    const now = new Date().getTime();
    const targetTime = new Date(travelDate).getTime();

    // Calculate time remaining from now until target date
    const timeRemainingMs = Math.max(0, targetTime - now);

    // Percentage of time remaining relative to the total initial duration
    // The bar should visually represent this remaining percentage.
    return Math.min(
      100,
      Math.max(0, (timeRemainingMs / totalDurationInMs) * 100)
    );
  }, [travelDate, totalDurationInMs]);

  // Initialize notification state from localStorage and handle travel date changes
  useEffect(() => {
    if (!travelDate) {
      setHasShownTravelDayNotification(false);
      setIsInitialLoad(false);
      return;
    }

    // Create a unique key for this specific travel date
    const notificationKey = `travel-notification-${travelDate}`;
    const hasShown = localStorage.getItem(notificationKey) === "true";

    setHasShownTravelDayNotification(hasShown);
    setIsInitialLoad(false);
  }, [travelDate]);

  // Countdown timer effect
  useEffect(() => {
    if (!isActive || !travelDate || isInitialLoad) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(travelDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });

        // Only show the notification once and save to localStorage
        if (!hasShownTravelDayNotification) {
          const notificationKey = `travel-notification-${travelDate}`;
          localStorage.setItem(notificationKey, "true");
          setHasShownTravelDayNotification(true);

          toast({
            title: "🎉 Travel Day! 🎉",
            description:
              "Your travel date has arrived! Have a fantastic trip and safe travels! ✈️",
          });
        }

        // Clear the timer to prevent further execution
        clearInterval(timer);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((difference % (1000 * 60)) / 1000);

      // Show milestone notifications
      if (days === 1 && countdown.days > 1) {
        toast({
          title: "🚨 Last Day!",
          description:
            "Tomorrow is your travel day! Make sure everything is ready!",
        });
      } else if (days === 7 && countdown.days > 7) {
        toast({
          title: "📅 One Week Left!",
          description:
            "Your trip is just a week away! Time to start packing! 🧳",
        });
      } else if (days === 30 && countdown.days > 30) {
        toast({
          title: "📆 One Month Left!",
          description: "Your adventure begins in exactly one month! 🗓️",
        });
      }

      setCountdown({ days, hours, mins, secs });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isActive,
    travelDate,
    toast,
    countdown.days,
    hasShownTravelDayNotification,
    isInitialLoad,
  ]);

  const handleSetDate = useCallback(async () => {
    if (!tempDate) {
      toast({
        title: "❌ No Date Selected",
        description: "Please select a travel date to start the countdown.",
        variant: "destructive",
      });
      return;
    }

    // Create a new date object and set the exact time
    const selectedDate = new Date(tempDate);
    const [hours, minutes] = tempTime.split(":").map(Number);
    selectedDate.setHours(hours, minutes, 0, 0);

    const now = new Date();

    if (selectedDate <= now) {
      toast({
        title: "❌ Invalid Date",
        description:
          "Please select a future date and time for your travel countdown.",
        variant: "destructive",
      });
      return;
    }

    // Store as ISO string (Supabase timestamptz will handle UTC conversion)
    const dateTimeString = selectedDate.toISOString();

    try {
      const success = await setTravelCountdown(dateTimeString);
      if (success) {
        // Reset notification state for the new travel date
        setHasShownTravelDayNotification(false);
        setIsEditing(false);
        setTempDate(undefined);
        setTempTime("12:00");
        toast({
          title: "🎉 Countdown Started!",
          description: `Your travel countdown is now active for ${format(
            selectedDate,
            "PPP"
          )} at ${tempTime}!`,
        });
      }
    } catch (error) {
      toast({
        title: "❌ Failed to Set Countdown",
        description:
          "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    }
  }, [tempDate, tempTime, setTravelCountdown, toast]);

  const handleClearCountdown = useCallback(async () => {
    try {
      const success = await clearTravelCountdown();
      if (success) {
        toast({
          title: "🗑️ Countdown Cleared",
          description: "Your travel countdown has been reset.",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Failed to Clear Countdown",
        description:
          "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    }
  }, [clearTravelCountdown, toast]);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  // Show loading skeleton if the countdown data is still being fetched
  if (isLoadingCountdown) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center space-y-6 animate-pulse">
            <div className="h-8 w-3/4 mx-auto bg-blue-200 rounded"></div>
            <div className="h-4 w-1/2 mx-auto bg-blue-100 rounded"></div>
            <div className="h-10 w-48 mx-auto bg-blue-300 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no countdown is set, show the setup interface
  if (!isActive || !travelDate) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-blue-900">
                  Travel Countdown
                </h3>
              </div>
              <p className="text-blue-700 max-w-md mx-auto">
                Set up a countdown to your next adventure and get excited about
                your trip!
              </p>
            </div>

            {/* Setup Form */}
            {isEditing ? (
              <div className="space-y-6 max-w-sm mx-auto">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label
                      htmlFor="travel-date"
                      className="text-blue-800 font-semibold text-sm block"
                    >
                      Travel Date
                    </Label>
                    <div
                      className="relative cursor-pointer"
                      onClick={() => {
                        const input = document.getElementById(
                          "travel-date"
                        ) as HTMLInputElement;
                        if (input) {
                          input.focus();
                          setTimeout(() => {
                            try {
                              input.showPicker?.();
                            } catch (e) {
                              // Fallback: trigger click on the input
                              input.click();
                            }
                          }, 10);
                        }
                      }}
                    >
                      <input
                        id="travel-date"
                        type="date"
                        value={tempDate ? format(tempDate, "yyyy-MM-dd") : ""}
                        onChange={(e) =>
                          setTempDate(
                            e.target.value
                              ? new Date(e.target.value)
                              : undefined
                          )
                        }
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full h-14 px-4 text-base font-medium text-slate-800 bg-white border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200 hover:border-blue-400 cursor-pointer shadow-sm [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:h-6 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:scale-110"
                        style={{
                          colorScheme: "light",
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="travel-time"
                      className="text-blue-800 font-semibold text-sm block"
                    >
                      Travel Time
                    </Label>
                    <div
                      className="relative cursor-pointer"
                      onClick={() => {
                        const input = document.getElementById(
                          "travel-time"
                        ) as HTMLInputElement;
                        if (input) {
                          input.focus();
                          setTimeout(() => {
                            try {
                              input.showPicker?.();
                            } catch (e) {
                              // Fallback: trigger click on the input
                              input.click();
                            }
                          }, 10);
                        }
                      }}
                    >
                      <input
                        id="travel-time"
                        type="time"
                        value={tempTime}
                        onChange={(e) => setTempTime(e.target.value)}
                        className="w-full h-14 px-4 text-base font-medium text-slate-800 bg-white border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200 hover:border-blue-400 cursor-pointer shadow-sm [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:h-6 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:scale-110"
                        style={{
                          colorScheme: "light",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setTempDate(undefined);
                      setTempTime("12:00");
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100 h-11 px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSetDate}
                    className="bg-blue-600 hover:bg-blue-700 h-11 px-6"
                  >
                    Start Countdown
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-6 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <Calendar className="h-6 w-6 text-blue-500" />
                    <span className="text-lg text-blue-700">
                      No countdown set
                    </span>
                  </div>
                  <p className="text-blue-600 text-sm mb-4">
                    Ready to start counting down to your next adventure?
                  </p>
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 px-6"
                  >
                    Set Travel Date
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center space-x-3 text-emerald-800">
          <div className="p-2 bg-emerald-100 rounded-full">
            <Clock className="h-6 w-6 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold">Travel Countdown</span>
        </CardTitle>
        <p className="text-emerald-700 font-medium">
          {(() => {
            const date = new Date(travelDate);
            return (
              <>
                {date.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {" at "}
                {date.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </>
            );
          })()}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Countdown Timer */}
        <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
          <div className="text-center">
            <div className="bg-white rounded-lg border border-emerald-200 p-4 shadow-sm">
              <div className="text-3xl font-bold text-emerald-900">
                {formatNumber(countdown.days)}
              </div>
              <div className="text-sm text-emerald-600 font-medium">Days</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg border border-emerald-200 p-4 shadow-sm">
              <div className="text-3xl font-bold text-emerald-900">
                {formatNumber(countdown.hours)}
              </div>
              <div className="text-sm text-emerald-600 font-medium">Hours</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg border border-emerald-200 p-4 shadow-sm">
              <div className="text-3xl font-bold text-emerald-900">
                {formatNumber(countdown.mins)}
              </div>
              <div className="text-sm text-emerald-600 font-medium">Mins</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg border border-emerald-200 p-4 shadow-sm">
              <div className="text-3xl font-bold text-emerald-900">
                {formatNumber(countdown.secs)}
              </div>
              <div className="text-sm text-emerald-600 font-medium">Secs</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm text-emerald-700">
            <span>Time until travel</span>
            <span className="font-medium">
              {countdown.days} days, {countdown.hours} hours
            </span>
          </div>
          <div className="w-full bg-emerald-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${currentProgressPercentage}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const currentDate = new Date(travelDate);
              setTempDate(currentDate);
              setTempTime(currentDate.toTimeString().slice(0, 5));
              setIsEditing(true);
            }}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Edit Date
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-slate-900">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <span>Update Travel Date</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label
                  htmlFor="edit-travel-date"
                  className="text-emerald-800 font-semibold text-sm block"
                >
                  Travel Date
                </Label>
                <div
                  className="relative cursor-pointer"
                  onClick={() => {
                    const input = document.getElementById(
                      "edit-travel-date"
                    ) as HTMLInputElement;
                    if (input) {
                      input.focus();
                      setTimeout(() => {
                        try {
                          input.showPicker?.();
                        } catch (e) {
                          // Fallback: trigger click on the input
                          input.click();
                        }
                      }, 10);
                    }
                  }}
                >
                  <input
                    id="edit-travel-date"
                    type="date"
                    value={tempDate ? format(tempDate, "yyyy-MM-dd") : ""}
                    onChange={(e) =>
                      setTempDate(
                        e.target.value ? new Date(e.target.value) : undefined
                      )
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full h-14 px-4 text-base font-medium text-slate-800 bg-white border-2 border-emerald-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all duration-200 hover:border-emerald-400 cursor-pointer shadow-sm [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:h-6 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:scale-110"
                    style={{
                      colorScheme: "light",
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="edit-travel-time"
                  className="text-emerald-800 font-semibold text-sm block"
                >
                  Travel Time
                </Label>
                <div
                  className="relative cursor-pointer"
                  onClick={() => {
                    const input = document.getElementById(
                      "edit-travel-time"
                    ) as HTMLInputElement;
                    if (input) {
                      input.focus();
                      setTimeout(() => {
                        try {
                          input.showPicker?.();
                        } catch (e) {
                          // Fallback: trigger click on the input
                          input.click();
                        }
                      }, 10);
                    }
                  }}
                >
                  <input
                    id="edit-travel-time"
                    type="time"
                    value={tempTime}
                    onChange={(e) => setTempTime(e.target.value)}
                    className="w-full h-14 px-4 text-base font-medium text-slate-800 bg-white border-2 border-emerald-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all duration-200 hover:border-emerald-400 cursor-pointer shadow-sm [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:h-6 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:scale-110"
                    style={{
                      colorScheme: "light",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setTempDate(undefined);
                  setTempTime("12:00");
                }}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 bg-white h-11 px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetDate}
                className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6"
              >
                Update Date
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Travel Countdown?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your current travel countdown. You can set a new
              one anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCountdown}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear Countdown
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
});
