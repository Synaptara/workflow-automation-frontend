import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      navigate("/");
    } catch {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-base-950">
      <form onSubmit={handleSubmit} className="bg-base-900 border border-border rounded p-8 w-80 flex flex-col gap-3">
        <h1 className="text-lg font-semibold mb-2">Sign in</h1>
        {error && <p className="text-status-danger text-sm">{error}</p>}
        <input
          className="bg-base-800 border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="bg-base-800 border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-accent hover:bg-accent-hover text-base-950 font-medium rounded py-2 mt-2 transition-colors">
          Sign in
        </button>
        <p className="text-text-muted text-sm text-center mt-2">
          No account? <Link to="/register" className="text-accent hover:underline">Register</Link>
        </p>
      </form>
    </div>
  );
}
