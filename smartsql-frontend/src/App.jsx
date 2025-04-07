import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomeLogin from './pages/HomeLogin';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherLayout from './components/layout/TeacherLayout';
import StudentAIChat from './pages/StudentAIChat';
import StudentSQLCamp from './pages/StudentSQLCamp';
import SQLExercise from './pages/SQLExercise';
import SQLExerciseManagement from './pages/SQLExerciseManagement'; // Make sure this import is correct
import './App.css';


function App() {
  return (
    <Router>
      <Routes>
        {/* Teacher routes */}
        <Route path="/teacher" element={
          <TeacherLayout>
            <TeacherDashboard />
          </TeacherLayout>
        } />
        
        {/* Add the SQL exercises route */}
        <Route path="/sql-exercises" element={
          <TeacherLayout>
            <SQLExerciseManagement />
          </TeacherLayout>
        } />
        
        {/* Student routes */}
        <Route path="/student" element={<StudentAIChat />} />
        <Route path="/student/sql" element={<StudentSQLCamp />} />
        <Route path="/student/sql/:moduleId" element={<SQLExercise />} />
        <Route path="/student/sql/:moduleId/:exerciseId" element={<SQLExercise />} />
        
        {/* Default redirect */}
        <Route path="/" element={<HomeLogin />} />
      </Routes>
    </Router>
  );
}

export default App;