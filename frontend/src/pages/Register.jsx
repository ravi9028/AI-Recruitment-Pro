import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");

  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Registration failed");
      }

      await res.json(); // consume response safely

      alert("Registration successful! Please login.");
      nav("/login");
    } catch (err) {
      alert("Registration failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1834]">
      <div className="bg-white w-[900px] h-[520px] rounded-xl shadow-xl grid grid-cols-2 overflow-hidden">

        {/* LEFT SIDE */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-700 to-blue-900 flex flex-col justify-center items-center text-white p-10">
          <div className="text-4xl font-bold mb-4">AI Recruitment Pro</div>
          <p className="opacity-80 text-center">
            Create your account to get started.
          </p>
        </div>

        {/* RIGHT FORM */}
        <div className="flex flex-col justify-center p-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Register</h2>

          <form onSubmit={submit} className="space-y-5">
            <input
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="Email"
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="Password"
              value={password}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <select
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="candidate">Candidate</option>
              <option value="hr">HR</option>
            </select>

            <button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition"
            >
              Register
            </button>
          </form>

          <p className="text-sm text-gray-600 mt-4">
            Already have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => nav("/login")}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
