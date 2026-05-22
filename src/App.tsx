import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Enroll } from './pages/Enroll';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { Teachers } from './pages/Teachers';
import { Students } from './pages/Students';
import { CashRegister } from './pages/CashRegister';
import { Payments } from './pages/Payments';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="enroll" element={<Enroll />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="students" element={<Students />} />
          <Route path="cash-register" element={<CashRegister />} />
          <Route path="payments" element={<Payments />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
