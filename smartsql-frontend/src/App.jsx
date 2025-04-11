import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/common/HomeLogin.jsx';
import StudentHome from './pages/StudentHome';
import StudentCourseList from './components/layout/StudentCourseList';
import StudentCourseModules from './components/layout/StudentCourseModules';
import ModuleExercises from './components/layout/ModuleExercises';
import StudentSQLCamp from './pages/StudentSQLCamp';
import SQLExercise from './pages/SQLExercise';
import StudentAIChat from './pages/StudentAIChat';
// import StudentProfile from './pages/StudentProfile';
// import StudentMessages from './pages/StudentMessages';
import HomeLogin from './pages/common/HomeLogin.jsx';
import TeacherDashboard from './pages/instructor/TeacherDashboard.jsx';
import TeacherLayout from './components/layout/TeacherLayout';
import SQLExerciseManage from './pages/instructor/SQLExerciseManage.jsx'; // Make sure this import is correct
import './App.css';
import ModuleManage from "./pages/instructor/ModuleManage.jsx";
import CourseManage from "./pages/instructor/CourseManage.jsx";
import Profile from './pages/common/Profile.jsx';
// 导入 SQLExerciseTest 组件
import SQLExerciseTest from './pages/SQLExcerciseTest.jsx';

const App = () => {
  const isAuthenticated = localStorage.getItem('access');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {isAuthenticated ? (
          <Route path="/student" element={<StudentHome />}>
            <Route index element={<StudentCourseList />} />
            <Route path="course/:courseId" element={<StudentCourseModules />} />
            <Route path="course/:courseId/module/:moduleId" element={<ModuleExercises />} />
            <Route path="course/:courseId/module/:moduleId/exercise/:exerciseId" element={<SQLExercise />} />
            <Route path="sql" element={<StudentSQLCamp />} />
            <Route path="ai-chat" element={<StudentAIChat />} />
            {/*<Route path="profile" element={<StudentProfile />} />*/}
            {/*<Route path="messages" element={<StudentMessages />} />*/}
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
        
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="sql-exercises" element={<SQLExerciseManage />} />
          <Route path="modules" element={<ModuleManage />} />
          <Route path="courses" element={<CourseManage />} />
          {/* 更多 teacher 页都加在这 */}
        </Route>
        
        <Route path="/" element={<HomeLogin />} />
        <Route path="/profile/:userId" element={<Profile />} />
      </Routes>
    </Router>
  );
};

export default App;