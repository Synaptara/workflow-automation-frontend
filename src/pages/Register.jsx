import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(username, email, password);
      navigate("/");
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(" ") : "Registration failed");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-base-950">
      <form onSubmit={handleSubmit} className="bg-base-900 border border-border rounded p-8 w-80 flex flex-col gap-3">
        <h1 className="text-lg font-semibold mb-2">Create account</h1>
        {error && <p className="text-status-danger text-sm">{error}</p>}
        <input
          className="bg-base-800 border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          className="bg-base-800 border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="bg-base-800 border border-border rounded px-3 py-2 text-sm outline-none focus:border-accent"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-accent hover:bg-accent-hover text-base-950 font-medium rounded py-2 mt-2 transition-colors">
          Register
        </button>
        <p className="text-text-muted text-sm text-center mt-2">
          Have an account? <Link to="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
