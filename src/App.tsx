import { Navigate, Route, Routes } from "react-router-dom";
import { AdminEmployee } from "./pages/AdminEmployee";
import { AdminHome } from "./pages/AdminHome";
import { AdminLayout } from "./pages/AdminLayout";
import { Gate } from "./pages/Gate";
import { LearnCard } from "./pages/LearnCard";
import { LearnHome } from "./pages/LearnHome";
import { DEFAULT_EMPLOYEE_ID, LearnLayout } from "./pages/LearnLayout";
import { LearnRanking } from "./pages/LearnRanking";
import { LearnQuiz } from "./pages/LearnQuiz";
import { LearnSheet } from "./pages/LearnSheet";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Gate />} />
      <Route path="/learn" element={<Navigate to={`/learn/${DEFAULT_EMPLOYEE_ID}`} replace />} />
      <Route path="/learn/ranking" element={<LearnRanking />} />
      <Route path="/learn/:employeeId" element={<LearnLayout />}>
        <Route index element={<LearnHome />} />
        <Route path="sheet" element={<LearnSheet />} />
        <Route path="part/:partId" element={<LearnCard />} />
        <Route path="quiz/:partId" element={<LearnQuiz />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path=":employeeId" element={<AdminEmployee />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
