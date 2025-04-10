import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomeLogin from './pages/common/HomeLogin.jsx';
import TeacherDashboard from './pages/instructor/TeacherDashboard.jsx';
import TeacherLayout from './components/layout/TeacherLayout';
import StudentAIChat from './pages/StudentAIChat.jsx';
import StudentSQLCamp from './pages/StudentSQLCamp.jsx';
import SQLExercise from './pages/SQLExercise.jsx';
import SQLExerciseManage from './pages/instructor/SQLExerciseManage.jsx'; // Make sure this import is correct
import './App.css';
import ModuleManage from "./pages/instructor/ModuleManage.jsx";
import CourseManage from "./pages/instructor/CourseManage.jsx";
import Profile from './pages/common/Profile.jsx';
// 导入 SQLExerciseTest 组件
import SQLExerciseTest from './pages/SQLExcerciseTest.jsx';


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
        <Route path="/student/sql/:moduleId" element={<SQLExerciseTest />} />
        <Route path="/student/sql/:moduleId/:exerciseId" element={<SQLExerciseTest />} />
        
        {/* Default redirect */}
        <Route path="/" element={<HomeLogin />} />
        <Route path="/profile/:userId" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;