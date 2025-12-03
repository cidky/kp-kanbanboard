import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import "../styles/board.css";
import { useNavigate } from "react-router-dom";

export default function Board() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);

  //navigate
  const navigate = useNavigate();

  // input fields
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState("Low");
  const [progress, setProgress] = useState(0);

  // EDIT states
  const [editTask, setEditTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editPriority, setEditPriority] = useState("Low");
  const [editProgress, setEditProgress] = useState(0);

  // Check user login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Realtime Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(data);
    });

    return () => unsub();
  }, [user]);

  // Add Task
  const addTask = async () => {
    if (!user) return alert("User belum terdeteksi. Coba beberapa detik lagi.");
    if (!title.trim()) return;

    const progressValue = Number(progress) || 0;

    await addDoc(collection(db, "tasks"), {
      title,
      note,
      priority,
      progress: progressValue,
      status: progressValue === 100 ? "done" : "todo",
      uid: user.uid,
      createdAt: serverTimestamp(),
    });

    setTitle("");
    setNote("");
    setPriority("Low");
    setProgress(0);
  };

  // Change Status
  const changeStatus = async (id, newStatus) => {
    const ref = doc(db, "tasks", id);
    await updateDoc(ref, { status: newStatus });
  };

  // Delete Task
  const deleteTask = async (id) => {
    await deleteDoc(doc(db, "tasks", id));
  };

  // Open Edit Modal
  const openEdit = (t) => {
    setEditTask(t);
    setEditTitle(t.title);
    setEditNote(t.note || "");
    setEditPriority(t.priority || "Low");
    setEditProgress(t.progress || 0);
  };

  // Drag & Drop: handle selesai drag
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Kalau tidak ada tujuan (dropped di luar kolom) → abaikan
    if (!destination) return;

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;

    // Kalau masih di kolom yang sama, untuk sementara tidak kita urus re-order
    if (sourceStatus === destStatus) return;

    // Update status di Firestore sesuai kolom tujuan
    const ref = doc(db, "tasks", draggableId);
    await updateDoc(ref, { status: destStatus });
  };

  // Ubah progress di task (inline, dari card)
  const updateProgress = async (task, newValue) => {
    const ref = doc(db, "tasks", task.id);

    const updateData = {
      progress: newValue,
    };

    // kalau progress 100%, otomatis set status "done"
    if (newValue === 100 && (task.status || "").toLowerCase() !== "done") {
      updateData.status = "done";
    }

    await updateDoc(ref, updateData);
  };

  // Save Edit
  const saveEdit = async () => {
    if (!editTask) return;

    const ref = doc(db, "tasks", editTask.id);
    const progressValue = Number(editProgress) || 0;

    const updateData = {
      title: editTitle,
      note: editNote,
      priority: editPriority,
      progress: progressValue,
    };

    if (progressValue === 100) {
      updateData.status = "done";
    }

    await updateDoc(ref, updateData);
    setEditTask(null);
  };
  return (
    <div className="board-container">
      {/* Header */}
      <div className="board-header">
        <h2>📋 Kanban Board Arnet Semarang</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => navigate("/report")}>Laporan Harian</button>
          <button onClick={() => signOut(auth)}>Logout</button>
        </div>
      </div>

      {/* Create Task Section */}
      <div className="create-task-box">
        <h3>Buat Tugas Baru</h3>

        <input
          placeholder="Judul tugas..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Catatan / deskripsi..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        ></textarea>

        <div className="row">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>

          <div className="progress-input">
            <label>Progress: {progress}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
            />
          </div>
        </div>

        <button className="add-btn" onClick={addTask} disabled={!user}>
          Tambah
        </button>
      </div>

      {/* EDIT MODAL */}
      {editTask && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Edit Task</h3>

            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />

            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
            ></textarea>

            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <div className="progress-input">
              <label>Progress: {editProgress}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={editProgress}
                onChange={(e) => setEditProgress(Number(e.target.value))}
              />
            </div>

            <div className="modal-buttons">
              <button onClick={() => setEditTask(null)} className="cancel-btn">
                Batal
              </button>
              <button onClick={saveEdit} className="save-btn">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KANBAN layout dengan Drag & Drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="columns">
          {[
            { key: "todo", label: "To Do", color: "pink" },
            { key: "inprogress", label: "In Progress", color: "orange" },
            { key: "done", label: "Completed", color: "purple" },
          ].map((col) => (
            <Droppable droppableId={col.key} key={col.key}>
              {(provided) => (
                <div
                  className={`column ${col.color}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <h3>{col.label}</h3>

                  {tasks
                    .filter((t) => (t.status || "todo") === col.key)
                    .map((t, index) => {
                      const priority = t.priority || "Low";
                      const note = t.note || "";
                      const progress = t.progress || 0;

                      // untuk tanggal
                      let dateStr = "-";
                      if (t.createdAt && t.createdAt.seconds) {
                        const d = new Date(t.createdAt.seconds * 1000);
                        const dd = String(d.getDate()).padStart(2, "0");
                        const mm = String(d.getMonth() + 1).padStart(2, "0");
                        const yyyy = d.getFullYear();
                        dateStr = `${dd}/${mm}/${yyyy}`; // contoh: 30/11/2025
                      }

                      return (
                        <Draggable key={t.id} draggableId={t.id} index={index}>
                          {(provided) => (
                            <div
                              className="task-card"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <div className="card-header">
                                <div className="card-title-group">
                                  <h4 className="task-title">{t.title}</h4>
                                  <span className="task-date">{dateStr}</span>
                                </div>

                                <span
                                  className={`badge ${priority.toLowerCase()}`}
                                >
                                  {priority}
                                </span>
                              </div>

                              <p className="task-note">{note}</p>

                              <div className="progress-inline">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={progress}
                                  onChange={(e) =>
                                    updateProgress(t, Number(e.target.value))
                                  }
                                />
                                <span className="progress-inline-label">
                                  {progress}%
                                </span>
                              </div>

                              {/* Footer */}
                              <div className="task-footer">
                                {/* kiri bawah: hapus */}
                                <div className="task-footer-left">
                                  <button onClick={() => deleteTask(t.id)}>
                                    🗑️
                                  </button>
                                </div>

                                {/* kanan bawah: edit + tombol status */}
                                <div className="task-footer-right">
                                  <button onClick={() => openEdit(t)}>
                                    ✏️
                                  </button>

                                  <div className="move-buttons">
                                    {col.key !== "todo" && (
                                      <button
                                        onClick={() =>
                                          changeStatus(t.id, "todo")
                                        }
                                      >
                                        🕐
                                      </button>
                                    )}

                                    {col.key !== "inprogress" && (
                                      <button
                                        onClick={() =>
                                          changeStatus(t.id, "inprogress")
                                        }
                                      >
                                        ⚙️
                                      </button>
                                    )}

                                    {col.key !== "done" && (
                                      <button
                                        onClick={() =>
                                          changeStatus(t.id, "done")
                                        }
                                      >
                                        ✅
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
