import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { useNavigate } from "react-router-dom";

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const navigate = useNavigate();

  // Detect if this is a password recovery session (token in URL hash or auth event)
  useEffect(() => {
    // Check URL hash for recovery token (Supabase puts tokens in hash fragment)
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setIsUpdateMode(true);
    }

    // Listen for PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsUpdateMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle password reset request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://house-finder-mate.vercel.app/reset-password",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage("If your email is registered, a password reset link has been sent.");
    }
  };

  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setUpdateSuccess(true);
      setMessage("Password updated! You can now log in with your new password.");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
        {isUpdateMode ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block mb-1 font-medium">New Password</label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                placeholder="Enter your new password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || updateSuccess}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
            {message && <p className="mt-4 text-green-600 text-center">{message}</p>}
            {error && <p className="mt-4 text-destructive text-center">{error}</p>}
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-1 font-medium">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            {message && <p className="mt-4 text-green-600 text-center">{message}</p>}
            {error && <p className="mt-4 text-destructive text-center">{error}</p>}
          </form>
        )}
      </div>
    </Layout>
  );
};

export default ResetPassword;
