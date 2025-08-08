import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link, Navigate, useLocation } from "react-router-dom";

const Auth = () => {
  const { user, signIn, signUp, resetPassword, updatePassword } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  // Password reset (recovery) flow
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("type") === "recovery") {
      setIsRecovery(true);
    }
  }, [location.search]);

  if (user && !isRecovery) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRecovery) {
        if (newPassword !== confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        const { error } = await updatePassword(newPassword);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Password updated",
            description: "Your password has been reset. You can now use your new password.",
          });
          setRecoverySuccess(true);
        }
      } else if (isReset) {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Password reset email sent",
            description: "Check your email for a link to reset your password.",
          });
          setIsReset(false);
        }
      } else if (isSignUp) {
        const { error } = await signUp(email, password, username);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created",
            description: "Check your email to verify your account",
          });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center flex-col bg-background p-4">
      <div className="mb-4 sm:mb-20">
        <Link to="/"><h1 className="text-2xl font-bold">Song Club</h1></Link>
      </div>
      <Card className="w-full max-w-md  p-8">
        <CardHeader>
          <CardTitle className="text-center text-lg font-bold">
            {isRecovery
              ? "Set New Password"
              : isSignUp
                ? "Sign up"
                : "Log in"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isRecovery ? (
            recoverySuccess ? (
              <div className="text-center">
                <p className="mb-4">Your password has been reset.</p>
                <Link to="/">
                  <Button>
                    Go to Home
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="placeholder:text-muted-foreground"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full  bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                >
                  {loading ? "..." : "Set new password"}
                </Button>
              </form>
            )
          ) : isReset ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="placeholder:text-muted-foreground"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                variant="default"
                className="w-full"
              >
                {loading ? "..." : "Send reset email"}
              </Button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                <div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="placeholder:text-muted-foreground"
                  />
                </div>

                {isSignUp && (
                  <div>
                    <Input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="placeholder:text-muted-foreground"
                    />
                  </div>
                )}

                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="placeholder:text-muted-foreground"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  variant="default"
                  className="w-full"
                >
                  {loading ? "..." : (isSignUp ? "Sign up" : "Log in")}
                </Button>
              </form>
              {!isSignUp && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsReset(true)}
                    className="text-sm underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </>
          )}
          {!isRecovery && (
            <div className="mt-2 text-center">
              {isReset ? (
                <button
                  type="button"
                  onClick={() => setIsReset(false)}
                  className="text-sm underline"
                >
                  Back to login
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm underline"
                >
                  {isSignUp ? "Got an account? Log in" : "Need to create an account? Sign up"}
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
