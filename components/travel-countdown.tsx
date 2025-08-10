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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plane, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const STORAGE_KEY = "travel-countdown-date";

export function TravelCountdown() {
  const [travelDate, setTravelDate] = useState<string>("");
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isActive, setIsActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempDate, setTempDate] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load saved travel date from localStorage
  useEffect(() => {
    const savedDate = localStorage.getItem(STORAGE_KEY);
    if (savedDate) {
      setTravelDate(savedDate);
      setIsActive(true);
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!isActive || !travelDate) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(travelDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsActive(false);
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

  const handleSetDate = useCallback(() => {
    if (!tempDate) {
      toast({
        title: "No Date Selected",
        description: "Please select a travel date.",
        variant: "destructive",
      });
      return;
    }

    const selectedDate = new Date(tempDate);
    const now = new Date();

    if (selectedDate <= now) {
      toast({
        title: "Invalid Date",
        description: "Travel date must be in the future.",
        variant: "destructive",
      });
      return;
    }

    setTravelDate(tempDate);
    setIsActive(true);
    setIsEditing(false);
    localStorage.setItem(STORAGE_KEY, tempDate);

    // Calculate time until travel
    const timeUntilTravel = selectedDate.getTime() - now.getTime();
    const daysUntilTravel = Math.ceil(timeUntilTravel / (1000 * 60 * 60 * 24));

    toast({
      title: "🎉 Countdown Started!",
      description: `Counting down to ${selectedDate.toLocaleDateString(
        "en-US",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )} (${daysUntilTravel} days away)`,
    });
  }, [tempDate, toast]);

  const handleClearDate = useCallback(() => {
    setTravelDate("");
    setIsActive(false);
    setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    localStorage.removeItem(STORAGE_KEY);
    setIsDeleteDialogOpen(false);
    toast({
      title: "🗑️ Countdown Cleared",
      description:
        "Travel countdown has been reset. You can set a new date anytime!",
    });
  }, [toast]);

  const handleEditDate = useCallback(() => {
    setTempDate(travelDate);
    setIsEditing(true);
    toast({
      title: "✏️ Editing Countdown",
      description: "Update your travel date below",
    });
  }, [travelDate, toast]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setTempDate("");
    toast({
      title: "❌ Edit Cancelled",
      description: "No changes were made to your countdown",
      variant: "destructive",
    });
  }, [toast]);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  if (isEditing) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Calendar className="h-5 w-5" />
            <span>Set Travel Date</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="travel-date" className="text-blue-700">
              When are you traveling?
            </Label>
            <Input
              id="travel-date"
              type="datetime-local"
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              className="border-blue-300 focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleSetDate}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Set Countdown
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isActive) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Plane className="h-5 w-5" />
            <span>Travel Countdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-slate-600">
            <p className="text-lg">
              Set your travel date to start the countdown!
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Track the time until your next adventure
            </p>
          </div>
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Set Travel Date
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-blue-800">
          <div className="flex items-center space-x-2">
            <Plane className="h-5 w-5" />
            <span>Travel Countdown</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditDate}
              className="h-8 w-8 p-0 hover:bg-blue-200 text-blue-700"
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-200 text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Countdown</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to clear the travel countdown? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearDate}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Clear Countdown
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardTitle>
        <p className="text-sm text-blue-600">
          Traveling on{" "}
          {new Date(travelDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
              <div className="text-2xl font-bold text-blue-900">
                {formatNumber(countdown.days)}
              </div>
              <div className="text-xs text-blue-600 font-medium">Days</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
              <div className="text-2xl font-bold text-blue-900">
                {formatNumber(countdown.hours)}
              </div>
              <div className="text-xs text-blue-600 font-medium">Hours</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
              <div className="text-2xl font-bold text-blue-900">
                {formatNumber(countdown.minutes)}
              </div>
              <div className="text-xs text-blue-600 font-medium">Minutes</div>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
              <div className="text-2xl font-bold text-blue-900">
                {formatNumber(countdown.seconds)}
              </div>
              <div className="text-xs text-blue-600 font-medium">Seconds</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
