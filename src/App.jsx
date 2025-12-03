import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Board from "./components/Board";
import DailyReport from "./components/DailyReport";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/board" element={<Board />} />
      <Route path="/report" element={<DailyReport />} />
    </Routes>
  );
}
