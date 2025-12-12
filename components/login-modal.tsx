"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginModal() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Invalid password");
        setPassword("");
        return;
      }

      // Refresh the page to show the authenticated content
      router.refresh();
      window.location.reload();
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 volition-hero-bg flex items-center justify-center z-50 flex-col justify-between p-6">
      {/* College Project Banner */}
      <div className="absolute top-0 left-0 right-0 bg-yellow-50 border-b-2 border-yellow-200 px-4 md:px-6 py-3 text-center">
        <p className="text-sm md:text-base text-yellow-800 font-semibold">
          ⚠️ College Project: Some features will not work as they are not connected to an AI model
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        <div className="fun-card p-8 w-full max-w-md">
          <h1 className="text-4xl font-black text-center mb-6 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Volition
          </h1>
          <p className="text-center text-gray-600 mb-8 font-medium">
            Enter the password to continue
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 transition-all font-medium placeholder-gray-400"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-6 text-center font-medium">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full fun-button-primary disabled:bg-gray-400 text-white font-bold py-3 rounded-2xl transition-all active:scale-95 touch-manipulation"
            >
              {isLoading ? "Authenticating..." : "Enter"}
            </button>
          </form>
        </div>
      </div>

      <footer className="text-center text-sm text-gray-600 mt-4">
        Created by{" "}
        <a
          href="https://anthonymohun.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
        >
          Anthony Mohun
        </a>
      </footer>
    </div>
  );
}
