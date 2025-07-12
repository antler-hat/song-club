import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-brutalist shadow-brutalist">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {isSignUp ? "CREATE ACCOUNT" : "LOGIN"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-brutalist font-mono uppercase placeholder:text-muted-foreground"
              />
            </div>
            
            {isSignUp && (
              <div>
                <Input
                  type="text"
                  placeholder="USERNAME"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="border-brutalist font-mono uppercase placeholder:text-muted-foreground"
                />
              </div>
            )}
            
            <div>
              <Input
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-brutalist font-mono uppercase placeholder:text-muted-foreground"
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full border-brutalist shadow-brutalist brutalist-press bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
            >
              {loading ? "..." : (isSignUp ? "SIGN UP" : "LOGIN")}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-muted-foreground hover:text-foreground font-mono text-sm underline"
            >
              {isSignUp ? "ALREADY HAVE AN ACCOUNT? LOGIN" : "NEED AN ACCOUNT? SIGN UP"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;