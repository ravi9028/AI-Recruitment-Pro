import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Login failed");
      }

      const data = await res.json();
      const { access_token, role, user_id, name } = data; // 👈 Expect 'name' from backend

      if (!access_token) {
        throw new Error("Token missing in login response");
      }

      // ✅ Store auth data
      localStorage.setItem("token", access_token);
      localStorage.setItem("role", role);
      localStorage.setItem("user_id", user_id);

      // 👇 THIS IS THE FIX: Save Name and Email
      // If backend sends 'name', use it. Otherwise use a placeholder.
      localStorage.setItem("user_name", name || data.user?.name || "Candidate");
      // We save the email the user typed in
      localStorage.setItem("email", email);

       // ✅ SIMPLIFIED Redirect by role
      if (role === "hr") {
        nav("/hr/dashboard");
      } else {
        nav("/candidate/dashboard");
      }
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1834]">
      <div className="bg-white w-[900px] h-[520px] rounded-xl shadow-xl grid grid-cols-2 overflow-hidden">

        {/* LEFT GRADIENT SIDE */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-700 to-blue-900 flex flex-col justify-center items-center text-white p-10">
          <div className="text-4xl font-bold mb-4">AI Recruitment Pro</div>
          <p className="opacity-80 text-center">
            Welcome back! Login to continue.
          </p>
        </div>

        {/* RIGHT LOGIN FORM */}
        <div className="flex flex-col justify-center p-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Log In</h2>

          <form onSubmit={submit} className="space-y-5">
            <input
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
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

            <button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition"
            >
              Login
            </button>
          </form>

          <p className="text-sm text-gray-600 mt-4">
            Don’t have an account?{" "}
            <span
              className="text-blue-600 cursor-pointer hover:underline"
              onClick={() => nav("/register")}
            >
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}