import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// 页面组件的引入（请确保这些组件路径正确）
import HomeLogin from './pages/common/HomeLogin.jsx';
import TeacherLayout from './components/layout/TeacherLayout';
import TeacherDashboard from './pages/instructor/TeacherDashboard.jsx';
import CourseManage from './pages/instructor/CourseManage.jsx';
import ModuleManage from './pages/instructor/ModuleManage.jsx';
import SQLExerciseManage from './pages/instructor/SQLExerciseManage.jsx';
import InstructorExerciseView from './pages/instructor/InstructorExerciseView.jsx';
import StudentManagement from './pages/instructor/StudentManagement.jsx';
import MessagesPage from './pages/instructor/MessagesPage.jsx';

import StudentLayout from './components/layout/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import StudentCourseList from './pages/student/StudentCourseList.jsx';
import BrowseCourses from './pages/student/BrowseCourses.jsx';
import StudentCourseModules from './pages/student/StudentCourseModules.jsx';
import ModuleExercises from './components/layout/ModuleExercises';
import SQLExercise from './pages/student/SQLExercise.jsx';
import StudentExercises from './pages/student/StudentExercises.jsx';
import StudentSQLCamp from './pages/student/StudentSQLCamp.jsx';
import StudentAIChat from './pages/student/StudentAIChat.jsx';
import StudentMessages from './pages/student/StudentMessages.jsx';

import Profile from './pages/common/Profile.jsx';
import SignUp from './pages/common/SignUp.jsx';

const App = () => {
  // Get authentication state from context
  const { isAuthenticated } = useAuth();
  
  // Remove localStorage check here
  // const token = localStorage.getItem('access');
  // const isAuthenticated = Boolean(token);
  const isProduction = import.meta.env.MODE === 'production';

  // console.log("Token from localStorage:", token); // Remove this log
  // console.log("isAuthenticated:", isAuthenticated); // Context value will be logged
  console.log("🔄 App.jsx render - isAuthenticated from context:", isAuthenticated);
  console.log("当前环境模式:", import.meta.env.MODE);

  return (
    // Remove BrowserRouter wrapper here
    <Routes>
        {/* 登录页面单独处理，不受 isAuthenticated 限制 */}
        <Route path="/login" element={<HomeLogin />} />
        <Route path="/signup" element={<SignUp />} />

        {/* 如果用户未登录，所有路由都重定向到 /login */}
        {!isAuthenticated && (
           // Redirect any other path to /login if not authenticated
           <Route path="*" element={<Navigate to="/login" replace />} />
        )}

        {/* 以下路由仅对已登录用户有效 */}
        {isAuthenticated && (
          <>
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

            <Route path="/profile" element={<Profile />} />
            
            {/* Add a default authenticated route or redirect */}
            {/* Example: Redirect root to appropriate dashboard */}
            <Route path="/" element={<Navigate to={localStorage.getItem('role') === 'instructor' ? '/teacher' : '/student'} replace />} /> 
            
            {/* Catch-all for authenticated users, could redirect to dashboard or show 404 */}
            {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
          </>
        )}
    </Routes>
  );
};

export default App;
