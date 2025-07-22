import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ShineBorder from "../components/ui/ShineBorder"; // Restored original import path

export default function Login() {
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secretKey }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data in local storage
        localStorage.setItem("secretKey", secretKey);
        localStorage.setItem("userName", data.user.user_name);
        localStorage.setItem("userRole", data.user.role); // Store the explicit role from backend
        localStorage.setItem("userId", data.user.id); // Store the internal database ID

        // Store IDs for accounts, projects, tasks, updates, and delivery statuses
        localStorage.setItem("accountIds", JSON.stringify(data.accounts.map(acc => acc.id)));
        localStorage.setItem("projectIds", JSON.stringify(data.projects.map(proj => proj.id)));
        localStorage.setItem("taskIdsAssigned", JSON.stringify(data.tasks_assigned_to.map(task => task.id)));
        localStorage.setItem("taskIdsCreated", JSON.stringify(data.tasks_created_by.map(task => task.id)));
        localStorage.setItem("updateIds", JSON.stringify(data.updates.map(update => update.id)));
        localStorage.setItem("deliveryStatusIds", JSON.stringify(data.delivery_statuses.map(ds => ds.id))); // Store new delivery status IDs

        // Redirect based on role
        if (data.user.role === "admin") {
          navigate("/admin/dashboard");
        } else if (data.user.role === "delivery_head") {
          navigate("/delivery-head/dashboard");
        } else {
          navigate("/home"); // Default for sales_executive and any other roles
        }
      } else {
        setError(data.error || "Login failed. Please check your secret key.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error or server unreachable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <ShineBorder
          className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-card p-8 shadow-lg"
          color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
        >
          <h2 className="mb-6 text-center text-3xl font-light text-foreground">
            Welcome Back!
          </h2>
          <form onSubmit={handleLogin} className="w-full space-y-6">
            <div>
              <label htmlFor="secretKey" className="sr-only">
                Secret Key
              </label>
              <input
                id="secretKey"
                name="secretKey"
                type="password"
                required
                className="relative block w-full appearance-none rounded-md border border-border bg-secondary px-3 py-2 text-foreground placeholder-muted-foreground focus:z-10 focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                placeholder="Enter your secret key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-center text-sm font-medium text-red-500">
                {error}
              </p>
            )}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-background hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </ShineBorder>
      </motion.div>
    </div>
  );
}
