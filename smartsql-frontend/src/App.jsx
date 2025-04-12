import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/common/HomeLogin.jsx';
import StudentHome from './pages/student/StudentHome.jsx';
import StudentCourseList from './pages/student/StudentCourseList.jsx';
import StudentCourseModules from './pages/student/StudentCourseModules.jsx';
import ModuleExercises from './components/layout/ModuleExercises';
import StudentSQLCamp from './pages/student/StudentSQLCamp.jsx';
import SQLExercise from './pages/student/SQLExercise.jsx';
import StudentAIChat from './pages/student/StudentAIChat.jsx';
import StudentMessages from './pages/student/StudentMessages.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import BrowseCourses from './pages/student/BrowseCourses.jsx';
import StudentExercises from './pages/student/StudentExercises.jsx';
import HomeLogin from './pages/common/HomeLogin.jsx';
import TeacherDashboard from './pages/instructor/TeacherDashboard.jsx';
import TeacherLayout from './components/layout/TeacherLayout';
import StudentLayout from './components/layout/StudentLayout';
import SQLExerciseManage from './pages/instructor/SQLExerciseManage.jsx';
import './App.css';
import ModuleManage from "./pages/instructor/ModuleManage.jsx";
import CourseManage from "./pages/instructor/CourseManage.jsx";
import Profile from './pages/common/Profile.jsx';
// 导入 SQLExerciseTest 组件
import SQLExerciseTest from './pages/SQLExcerciseTest.jsx';
import InstructorExerciseView from './pages/instructor/InstructorExerciseView.jsx';
import StudentManagement from './pages/instructor/StudentManagement.jsx';
import MessagesPage from './pages/instructor/MessagesPage';

const App = () => {
  const isAuthenticated = localStorage.getItem('access');

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
          <Route path="students" element={<StudentManagement />} />
          <Route path="courses/:courseId/students" element={<StudentManagement />} />
          <Route path="messages" element={<MessagesPage />} />
        </Route>

        <Route path="/login" element={<Login />} />
        
        {isAuthenticated ? (
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="courses" element={<StudentCourseList />} />
            <Route path="browse-courses" element={<BrowseCourses />} />
            <Route path="courses/:courseId" element={<StudentCourseModules />} />
            <Route path="courses/:courseId/modules/:moduleId" element={<ModuleExercises />} />
            <Route path="courses/:courseId/modules/:moduleId/exercises/:exerciseId" element={<SQLExercise />} />
            <Route path="exercises" element={<StudentExercises />} />
            <Route path="sql" element={<StudentSQLCamp />} />
            <Route path="ai-chat" element={<StudentAIChat />} />
            <Route path="messages" element={<StudentMessages />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}

        <Route path="/" element={<HomeLogin />} />
        <Route path="/profile/" element={<Profile />} />
      </Routes>
    </Router>
  );
};

export default App;