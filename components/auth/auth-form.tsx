"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { memo, useState } from "react";

export const AuthForm = memo(function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { toast } = useToast();
  const { signIn, signUp, signInWithMagicLink, testEmailConfiguration } =
    useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "❌ Missing Information",
        description: "Please enter both email and password to sign in.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await signIn(email, password);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "✅ Welcome Back!",
        description: "Successfully signed in! Loading your travel data...",
      });
    } else {
      toast({
        title: "❌ Sign In Failed",
        description: result.error || "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast({
        title: "❌ Missing Information",
        description: "Please fill in all fields to create your account.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "❌ Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "❌ Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await signUp(email, password);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "✅ Account Created!",
        description:
          result.message ||
          "Please check your email to confirm your account, then sign in.",
      });
      setActiveTab("signin");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } else {
      toast({
        title: "❌ Sign Up Failed",
        description:
          result.error || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "❌ Missing Email",
        description: "Please enter your email address to receive a magic link.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await signInWithMagicLink(email);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "✅ Magic Link Sent!",
        description: "Check your email and click the secure link to sign in.",
      });
    } else {
      toast({
        title: "❌ Magic Link Failed",
        description:
          result.error || "Failed to send magic link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTestEmailConfig = async () => {
    setIsLoading(true);
    const result = await testEmailConfiguration();
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "✅ Email Test Successful",
        description:
          result.message || "Email configuration appears to be working.",
      });
    } else {
      toast({
        title: "❌ Email Test Failed",
        description: result.error || "Email configuration test failed.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Welcome to Travel Tracker
          </CardTitle>
          <CardDescription className="text-slate-600">
            Sign in to manage your travel expenses and track your budget
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="signin" onClick={resetForm}>
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" onClick={resetForm}>
                Sign Up
              </TabsTrigger>
              <TabsTrigger value="magic" onClick={resetForm}>
                Magic Link
              </TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                {isLoading && (
                  <p className="text-xs text-slate-500 text-center">
                    Please wait while we verify your credentials...
                  </p>
                )}
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password (min 6 chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="signup-confirm"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                {isLoading && (
                  <p className="text-xs text-slate-500 text-center">
                    Creating your account and sending confirmation email...
                  </p>
                )}
              </form>
            </TabsContent>

            {/* Magic Link Tab */}
            <TabsContent value="magic" className="space-y-4">
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    "Send Magic Link"
                  )}
                </Button>
                {isLoading && (
                  <p className="text-xs text-slate-500 text-center">
                    Sending secure magic link to your email...
                  </p>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-slate-500 text-center">
                    We'll send you a secure link to sign in without a password
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 text-center">
                      💡 <strong>Tip:</strong> Magic links are perfect if you
                      forgot your password or prefer passwordless sign-in
                    </p>
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          {/* Debug Section - Only in Development */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-2">Debug Tools</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestEmailConfig}
                  disabled={isLoading}
                  className="text-xs border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Test Email Configuration
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
