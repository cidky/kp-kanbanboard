import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css"; // buat file ini kalau mau UI rapi

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/board"); // ⬅ pindah ke dashboard
    } catch (error) {
      alert("Login gagal: " + error.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Masuk</h2>

        <input
          type="email"
          placeholder="Email"
          className="auth-input"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="auth-input"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="auth-button"
          disabled={loading}
        >
          {loading ? "Sedang masuk..." : "Login"}
        </button>

        <p className="auth-switch">
          Belum punya akun?{" "}
          <span onClick={() => navigate("/register")}>Daftar</span>
        </p>
      </div>
    </div>
  );
}
