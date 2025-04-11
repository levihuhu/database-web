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
import InstructorExerciseView from './pages/instructor/InstructorExerciseView.jsx';
import StudentManagement from './pages/instructor/StudentManagement.jsx'; // Import new component
import MessagesPage from './pages/instructor/MessagesPage'; // Adjust path as needed


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="courses" element={<CourseManage />} />
          <Route path="courses/:courseId/modules" element={<ModuleManage />} />
          <Route path="modules" element={<ModuleManage />} />
          <Route path="modules/:moduleId/exercises" element={<SQLExerciseManage />} />
          <Route path="sql-exercises" element={<SQLExerciseManage />} />
          <Route path="exercises/:exerciseId" element={<InstructorExerciseView />} />
          <Route path="students" element={<StudentManagement />} /> {/* Add student management route */}
          <Route path="courses/:courseId/students" element={<StudentManagement />} /> {/* Optional: Route to filter students by course */}
          <Route path="messages" element={<MessagesPage />} />
        </Route>
        
        {/* Student routes */}
        <Route path="/student" element={<StudentAIChat />} />
        <Route path="/student/sql" element={<StudentSQLCamp />} />
        {/*<Route path="/student/sql/:moduleId" element={<SQLExercise />} />*/}
        {/* <Route path="/student/sql/:moduleId" element={<SQLExerciseTest />} /> */}
        <Route path="/student/sql/:moduleId/:exerciseId" element={<SQLExerciseTest />} />
        
        {/* Default redirect */}
        <Route path="/" element={<HomeLogin />} />
        <Route path="/profile/:userId?" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;