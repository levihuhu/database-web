import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomeLogin from './pages/HomeLogin';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherLayout from './components/layout/TeacherLayout';
import StudentAIChat from './pages/StudentAIChat';
import StudentSQLCamp from './pages/StudentSQLCamp';
import SQLExercise from './pages/SQLExercise';
import SQLExerciseManage from './pages/SQLExerciseManage.jsx'; // Make sure this import is correct
import './App.css';
import ModuleManage from "./pages/ModuleManage.jsx";
import CourseManage from "./pages/CourseManage.jsx";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/teacher" element={<TeacherLayout />}>
        <Route index element={<TeacherDashboard />} />
        <Route path="sql-exercises" element={<SQLExerciseManage />} />
        <Route path="modules" element={<ModuleManage />} />
        <Route path="courses" element={<CourseManage />} />
        {/* 更多 teacher 页都加在这 */}
      </Route>
        
        {/* Student routes */}
        <Route path="/student" element={<StudentAIChat />} />
        <Route path="/student/sql" element={<StudentSQLCamp />} />
        {/*<Route path="/student/sql/:moduleId" element={<SQLExercise />} />*/}
        <Route path="/student/sql1/" element={<SQLExercise />} />
        <Route path="/student/sql/:moduleId/:exerciseId" element={<SQLExercise />} />
        
        {/* Default redirect */}
        <Route path="/" element={<HomeLogin />} />
      </Routes>
    </Router>
  );
}

export default App;