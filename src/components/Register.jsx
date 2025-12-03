import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      alert("Email dan password tidak boleh kosong!");
      return;
    }

    if (password.length < 6) {
      alert("Password harus minimal 6 karakter!");
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Akun berhasil dibuat! Silakan login.");
      navigate("/"); // ⬅ kembali ke halaman login
    } catch (error) {
      alert("Gagal daftar: " + error.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Daftar Akun</h2>

        <input
          type="email"
          placeholder="Email"
          className="auth-input"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password (min 6 karakter)"
          className="auth-input"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleRegister}
          className="auth-button"
          disabled={loading}
        >
          {loading ? "Membuat akun..." : "Daftar"}
        </button>

        <p className="auth-switch">
          Sudah punya akun? <span onClick={() => navigate("/")}>Login</span>
        </p>
      </div>
    </div>
  );
}
