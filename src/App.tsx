import { Navigate, Route, Routes } from "react-router-dom";
import { AdminEmployee } from "./pages/AdminEmployee";
import { AdminHome } from "./pages/AdminHome";
import { Gate } from "./pages/Gate";
import { LearnCard } from "./pages/LearnCard";
import { LearnHome } from "./pages/LearnHome";
import { LearnLayout } from "./pages/LearnLayout";
import { LearnPick } from "./pages/LearnPick";
import { LearnRanking } from "./pages/LearnRanking";
import { LearnQuiz } from "./pages/LearnQuiz";
import { LearnSheet } from "./pages/LearnSheet";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Gate />} />
      <Route path="/learn" element={<LearnLayout />}>
        <Route index element={<LearnPick />} />
        <Route path="ranking" element={<LearnRanking />} />
        <Route path=":employeeId" element={<LearnHome />} />
        <Route path=":employeeId/sheet" element={<LearnSheet />} />
        <Route path=":employeeId/part/:partId" element={<LearnCard />} />
        <Route path=":employeeId/quiz/:partId" element={<LearnQuiz />} />
      </Route>
      <Route path="/admin" element={<AdminHome />} />
      <Route path="/admin/:employeeId" element={<AdminEmployee />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
