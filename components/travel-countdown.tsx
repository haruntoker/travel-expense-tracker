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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDatabase } from "@/hooks/use-database";
import { useToast } from "@/hooks/use-toast";
import { Calendar, X, Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function TravelCountdown({
  travelProfileId,
}: {
  travelProfileId: string;
}) {
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempDate, setTempDate] = useState<string>("");
  const [tempTime, setTempTime] = useState<string>("12:00");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Use database hook with travel profile ID (can be empty string for personal use)
  const { travelCountdown, setTravelCountdown, clearTravelCountdown } =
    useDatabase(travelProfileId || null);

  // Get travel date from database state
  const travelDate = travelCountdown?.travelDate || "";
  const isActive = travelCountdown?.isActive || false;

  // Countdown timer effect
  useEffect(() => {
    if (!isActive || !travelDate) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(travelDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        toast({
          title: "🎉 Travel Day! 🎉",
          description:
            "Your travel date has arrived! Have a fantastic trip and safe travels! ✈️",
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

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

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, travelDate, toast, countdown.days]);

  const handleSetDate = useCallback(async () => {
    if (!tempDate.trim()) {
      toast({
        title: "❌ No Date Selected",
        description: "Please select a travel date to start the countdown.",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const dateTimeString = `${tempDate}T${tempTime}`;
    const selectedDate = new Date(dateTimeString);
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

    try {
      const success = await setTravelCountdown(dateTimeString);
      if (success) {
        setIsEditing(false);
        setTempDate("");
        setTempTime("12:00");
        toast({
          title: "🎉 Countdown Started!",
          description: `Your travel countdown is now active for ${tempDate} at ${tempTime}!`,
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
              <div className="space-y-4 max-w-sm mx-auto">
                <div className="space-y-2">
                  <Label
                    htmlFor="travel-date"
                    className="text-blue-800 font-medium"
                  >
                    When are you traveling?
                  </Label>
                  <Input
                    id="travel-date"
                    type="date"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="text-center text-lg border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="travel-time"
                    className="text-blue-800 font-medium"
                  >
                    What time?
                  </Label>
                  <Input
                    id="travel-time"
                    type="time"
                    value={tempTime}
                    onChange={(e) => setTempTime(e.target.value)}
                    className="text-center text-lg border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setTempDate("");
                      setTempTime("12:00");
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSetDate}
                    className="bg-blue-600 hover:bg-blue-700 px-6"
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

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

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
          {new Date(travelDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          {" at "}
          {new Date(travelDate).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
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
                {formatNumber(countdown.minutes)}
              </div>
              <div className="text-sm text-emerald-600 font-medium">
                Minutes
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg border border-emerald-200 p-4 shadow-sm">
              <div className="text-3xl font-bold text-emerald-900">
                {formatNumber(countdown.seconds)}
              </div>
              <div className="text-sm text-emerald-600 font-medium">
                Seconds
              </div>
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
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    ((countdown.days * 24 + countdown.hours) / (365 * 24)) * 100
                  )
                )}%`,
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
              // Populate current values for editing
              setTempDate(travelDate.split("T")[0]);
              setTempTime(travelDate.split("T")[1]?.substring(0, 5) || "12:00");
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <span>Update Travel Date</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="edit-travel-date"
                className="text-emerald-800 font-medium"
              >
                New travel date
              </Label>
              <Input
                id="edit-travel-date"
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="text-center text-lg border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-travel-time"
                className="text-emerald-800 font-medium"
              >
                New travel time
              </Label>
              <Input
                id="edit-travel-time"
                type="time"
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className="text-center text-lg border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setTempDate("");
                  setTempTime("12:00");
                }}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetDate}
                className="bg-emerald-600 hover:bg-emerald-700"
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
}
