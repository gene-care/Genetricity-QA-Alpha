import { useState } from "react";
import { login } from "../services/api";
import type { AuthState } from "../types";

interface LoginBoxProps {
  auth: AuthState;
  onAuthChange: (auth: AuthState) => void;
}

export function LoginBox({ auth, onAuthChange }: LoginBoxProps) {
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("");

    try {
      const result = await login(userid, password);
      setStatus(result.message);
      if (result.isAuthenticated) {
        onAuthChange(result);
      }
    } catch {
      setStatus("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (auth.isAuthenticated) {
    return (
      <div className="bg-white border border-gray-300 p-4">
        <h3 className="mb-2">Login</h3>
        <p className="text-sm text-green-600">✅ Logged in as <strong>{auth.userId}</strong></p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 p-4">
      <h3 className="mb-4">Login</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userid" className="block text-sm mb-1">
            Username
          </label>
          <input
            id="userid"
            type="text"
            value={userid}
            onChange={(e) => setUserid(e.target.value)}
            className="w-full border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter username"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter password"
            required
          />
        </div>

        {status && (
          <p className="text-sm text-red-600">{status}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
