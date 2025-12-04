import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import "../styles/board.css";
import { useNavigate } from "react-router-dom";

export default function DailyReport() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10) // yyyy-mm-dd
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // cek user login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // ambil semua task user
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTasks(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // helper: ubah Timestamp ke string yyyy-mm-dd
  const getDateString = (t) => {
    if (!t || !t.seconds) return "";
    const d = new Date(t.seconds * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // task yang termasuk ke tanggal laporan
  const dailyTasks = tasks.filter((t) => {
    if (!t.createdAt) return false;
    return getDateString(t.createdAt) === selectedDate;
  });

  // ringkasan
  const total = dailyTasks.length;
  const done = dailyTasks.filter((t) => (t.status || "todo") === "done").length;
  const inprogress = dailyTasks.filter(
    (t) => (t.status || "todo") === "inprogress"
  ).length;
  const todo = dailyTasks.filter((t) => (t.status || "todo") === "todo").length;
  const getProgressValue = (t) => {
    // belum ada progress sama sekali
    if (t.progress === undefined || t.progress === null || t.progress === "") {
      const status = (t.status || "").toLowerCase();
      // kalau done tapi tidak ada progress -> anggap 100
      if (status === "done") return 100;
      // selain itu berarti belum diisi
      return null;
    }

    // ada progress, konversi ke number (bisa dari string atau number)
    const n = Number(t.progress);
    if (Number.isNaN(n)) return null;
    return n;
  };

  const avgProgress =
    dailyTasks.length > 0
      ? Math.round(
          dailyTasks.reduce((sum, t) => sum + getProgressValue(t), 0) /
            dailyTasks.length
        )
      : 0;

  if (!user) {
    return (
      <div className="report-container">
        <h2>Laporan Kegiatan Harian</h2>
        <p>Silakan login terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="report-container">
      <div className="report-header">
        <div>
          <h2>Laporan Kegiatan Harian</h2>
          <p>Pengguna: {user.email}</p>
        </div>

        <div className="report-controls">
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate("/board")}
          >
            ← Kembali ke Dashboard
          </button>

          <label className="date-label">
            Tanggal:
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </label>
        </div>
      </div>

      {loading ? (
        <p>Sedang memuat data...</p>
      ) : dailyTasks.length === 0 ? (
        <p>Tidak ada kegiatan pada tanggal ini.</p>
      ) : (
        <>
          {/* Ringkasan */}
          <div className="report-summary">
            <div className="summary-card">
              <h4>Total Tugas</h4>
              <p>{total}</p>
            </div>
            <div className="summary-card">
              <h4>Selesai</h4>
              <p>{done}</p>
            </div>
            <div className="summary-card">
              <h4>Sedang Dikerjakan</h4>
              <p>{inprogress}</p>
            </div>
            <div className="summary-card">
              <h4>Belum Dikerjakan</h4>
              <p>{todo}</p>
            </div>
            <div className="summary-card">
              <h4>Rata-rata Progress</h4>
              <p>{avgProgress}%</p>
            </div>
          </div>

          {/* 🔹 WRAPPER TABEL – penting untuk HP */}
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Judul Tugas</th>
                  <th>Deskripsi</th>
                  <th>Prioritas</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {dailyTasks.map((t, idx) => {
                  const p = getProgressValue(t);
                  return (
                    <tr key={t.id}>
                      <td>{idx + 1}</td>
                      <td>{t.title}</td>
                      <td>{t.note || "-"}</td>
                      <td>{t.priority || "-"}</td>
                      <td>{t.status || "-"}</td>
                      <td>{p === null ? "-" : p + "%"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tombol export di bawah kanan */}
          <div className="report-export">
            <button type="button" onClick={() => window.print()}>
              Cetak / Simpan PDF
            </button>
          </div>
        </>
      )}

      {/* Catatan: kalau nanti sudah ada photoUrl, kita bisa tampilkan eviden foto di bawah sini */}
    </div>
  );
}
