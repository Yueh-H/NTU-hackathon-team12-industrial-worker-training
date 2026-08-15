import { Navigate, Route, Routes } from "react-router-dom";
import { AdminEmployee } from "./pages/AdminEmployee";
import { AdminHome } from "./pages/AdminHome";
import { Gate } from "./pages/Gate";
import { LearnCard } from "./pages/LearnCard";
import { LearnHome } from "./pages/LearnHome";
import { LearnPick } from "./pages/LearnPick";
import { LearnQuiz } from "./pages/LearnQuiz";
import { LearnSheet } from "./pages/LearnSheet";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Gate />} />
      <Route path="/learn" element={<LearnPick />} />
      <Route path="/learn/:employeeId" element={<LearnHome />} />
      <Route path="/learn/:employeeId/sheet" element={<LearnSheet />} />
      <Route path="/learn/:employeeId/part/:partId" element={<LearnCard />} />
      <Route path="/learn/:employeeId/quiz/:partId" element={<LearnQuiz />} />
      <Route path="/admin" element={<AdminHome />} />
      <Route path="/admin/:employeeId" element={<AdminEmployee />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
