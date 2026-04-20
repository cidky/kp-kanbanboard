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

  // Daftar team yang tersedia
  const categories = ["DEFA", "IPSN", "Transport"];

  // 1. Cek status login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // 2. Ambil data task dari Firestore
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

  // Helper: Konversi Firestore Timestamp ke format yyyy-mm-dd
  const getDateString = (t) => {
    if (!t || !t.seconds) return "";
    const d = new Date(t.seconds * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper: Mendapatkan nilai progress numerik
  const getProgressValue = (t) => {
    if (t.progress === undefined || t.progress === null || t.progress === "") {
      return (t.status || "").toLowerCase() === "done" ? 100 : 0;
    }
    const n = Number(t.progress);
    return Number.isNaN(n) ? 0 : n;
  };

  // 3. Filter data berdasarkan tanggal terpilih
  const dailyTasks = tasks.filter((t) => {
    if (!t.createdAt) return false;
    return getDateString(t.createdAt) === selectedDate;
  });

  // 4. Fungsi untuk menghitung statistik per team
  const getSummaryByteam = (teamName) => {
    const filtered = dailyTasks.filter(
      (t) => (t.team || "").toUpperCase() === teamName.toUpperCase()
    );
    const total = filtered.length;
    const done = filtered.filter(
      (t) => (t.status || "").toLowerCase() === "done"
    ).length;
    const inprogress = filtered.filter(
      (t) => (t.status || "").toLowerCase() === "inprogress"
    ).length;

    const avg =
      total > 0
        ? Math.round(
            filtered.reduce((sum, t) => sum + getProgressValue(t), 0) / total
          )
        : 0;

    return { total, done, inprogress, avg };
  };

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
          {/* Ringkasan Terpisah Tiap team */}
          <div className="report-summary-container">
            {categories.map((div) => {
              const stats = getSummaryByteam(div);
              return (
                <div key={div} className="summary-group">
                  <h3>team {div}</h3>
                  <div className="report-summary">
                    <div className="summary-card">
                      <h4>Total</h4>
                      <p>{stats.total}</p>
                    </div>
                    <div className="summary-card">
                      <h4>Selesai</h4>
                      <p>{stats.done}</p>
                    </div>
                    <div className="summary-card">
                      <h4>In Progress</h4>
                      <p>{stats.inprogress}</p>
                    </div>
                    <div className="summary-card">
                      <h4>Rata-rata Progress</h4>
                      <p>{stats.avg}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabel Detail Kegiatan */}
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>team</th>
                  <th>Judul Tugas</th>
                  <th>Deskripsi</th>
                  <th>Prioritas</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {dailyTasks
                  .slice() // Membuat copy array agar tidak mengubah state asli
                  .sort((a, b) => {
                    // Mengurutkan berdasarkan nama team secara alfabetis (A-Z)
                    const teamA = (a.team || "").toLowerCase();
                    const teamB = (b.team || "").toLowerCase();
                    if (teamA < teamB) return -1;
                    if (teamA > teamB) return 1;
                    return 0;
                  })
                  .map((t, idx) => {
                    const p = getProgressValue(t);
                    const divClass = `badge-${(
                      t.team || "default"
                    ).toLowerCase()}`;
                    return (
                      <tr key={t.id}>
                        <td>{idx + 1}</td>
                        <td>
                          <span className={divClass}>{t.team || "-"}</span>
                        </td>
                        <td>{t.title}</td>
                        <td>{t.note || "-"}</td>
                        <td>{t.priority || "-"}</td>
                        <td>{t.status || "-"}</td>
                        <td>{p}%</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>


          <div className="report-export">
            <button type="button" onClick={() => window.print()}>
              Cetak / Simpan PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
