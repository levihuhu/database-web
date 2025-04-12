import React, { useState, useEffect } from 'react';
import { Input, Button, Card, Typography, Spin, Avatar, Divider, message, Switch, Select } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const StudentAIChat = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your SQL learning assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState('student');
  const [userCourses, setUserCourses] = useState([]);
  const [studentProgress, setStudentProgress] = useState({});
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [includeProgressContext, setIncludeProgressContext] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // Get token and user data on component mount
  useEffect(() => {
    const authToken = localStorage.getItem('access');
    const role = localStorage.getItem('role');
    console.log('Auth token available:', !!authToken);
    console.log('User role:', role);
    setToken(authToken);
    setUserRole(role);

    if (authToken) {
      fetchUserData(authToken, role);
    } else {
      console.error('No authentication token found in localStorage');
      message.error('You need to login to use the AI chat feature');
    }
  }, []);

  // Fetch user data based on role
  const fetchUserData = async (authToken, role) => {
    setIsFetchingData(true);
    console.log('Fetching user data for role:', role);
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      console.log('Using API URL:', API_URL);

      // For all users, fetch their course data
      if (role === 'student') {
        console.log('Fetching student courses...');
        try {
          const coursesResponse = await axios.get(
              `${API_URL}/api/student/courses/`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                }
              }
          );

          console.log('Student courses response:', coursesResponse.data);

          if (coursesResponse.data && coursesResponse.data.courses) {
            setUserCourses(coursesResponse.data.courses);

            // Fetch detailed progress information
            try {
              console.log('Fetching student progress...');
              const progressResponse = await axios.get(
                  `${API_URL}/api/student/progress/`,
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${authToken}`
                    }
                  }
              );

              console.log('Student progress response:', progressResponse.data);

              // Fetch knowledge graph data
              console.log('Fetching student knowledge graph...');
              const knowledgeGraphResponse = await axios.get(
                  `${API_URL}/api/student/knowledge-graph/`,
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${authToken}`
                    }
                  }
              );

              console.log('Student knowledge graph response:', knowledgeGraphResponse.data);

              // Fetch error logs
              console.log('Fetching student error logs...');
              const errorLogsResponse = await axios.get(
                  `${API_URL}/api/student/error-logs/`,
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${authToken}`
                    }
                  }
              );

              console.log('Student error logs response:', errorLogsResponse.data);

              // Combine all the data
              const progressData = progressResponse.data.progress || [];
              const knowledgeGraphs = knowledgeGraphResponse.data.knowledge_graphs || [];
              const errorLogs = errorLogsResponse.data.error_logs || [];
              const errorSummary = errorLogsResponse.data.error_summary || {};

              // Create a comprehensive student progress object
              const studentProgressData = {
                courses: progressData,
                knowledge_graphs: knowledgeGraphs,
                error_logs: errorLogs,
                error_summary: errorSummary
              };

              setStudentProgress(studentProgressData);
            } catch (error) {
              console.error('Error fetching detailed student data:', error.response || error);
            }
          } else if (coursesResponse.data && coursesResponse.data.data) {
            // Handle alternative response format
            console.log('Alternative data format detected');
            setUserCourses(coursesResponse.data.data);
            // ... adapt the rest of the code
          } else {
            console.error('Unexpected response format:', coursesResponse.data);
          }
        } catch (error) {
          console.error('Error fetching student courses:', error.response || error);
        }
      }
      else if (role === 'instructor') {
        console.log('Fetching instructor courses...');
        try {
          const coursesResponse = await axios.get(
              `${API_URL}/api/instructor/courses/`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                }
              }
          );

          console.log('Instructor courses response:', coursesResponse.data);

          if (coursesResponse.data && coursesResponse.data.courses) {
            setUserCourses(coursesResponse.data.courses);
          } else {
            console.error('Unexpected instructor courses response format:', coursesResponse.data);
          }
        } catch (error) {
          console.error('Error fetching instructor courses:', error.response || error);
        }

        console.log('Fetching students...');
        try {
          const studentsResponse = await axios.get(
              `${API_URL}/api/instructor/students/`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`
                }
              }
          );

          console.log('Students response:', studentsResponse.data);

          if (studentsResponse.data && studentsResponse.data.students) {
            setStudents(studentsResponse.data.students);
          } else {
            console.error('Unexpected students response format:', studentsResponse.data);
          }
        } catch (error) {
          console.error('Error fetching students:', error.response || error);
        }
      } else {
        console.error('Unknown role:', role);
      }
    } catch (error) {
      console.error('Error fetching user data:', error.response || error);
      message.error('Failed to load your course data');
    } finally {
      setIsFetchingData(false);
    }
  };

  // Handle student selection (for instructors)
  const handleStudentChange = async (studentId) => {
    setSelectedStudent(studentId);

    if (!studentId) return;

    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

      // Fetch student basic data
      const progressResponse = await axios.get(
          `${API_URL}/api/instructor/students/?student_id=${studentId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
      );

      // Fetch detailed progress information for this student
      const studentProgressResponse = await axios.get(
          `${API_URL}/api/instructor/students/${studentId}/progress/`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
      );

      // Fetch knowledge graph data
      const knowledgeGraphResponse = await axios.get(
          `${API_URL}/api/instructor/students/${studentId}/knowledge-graph/`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
      );

      // Fetch error logs
      const errorLogsResponse = await axios.get(
          `${API_URL}/api/instructor/students/${studentId}/error-logs/`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
      );

      // Get basic student info from the regular endpoint
      const studentData = progressResponse.data.students.find(s => s.user_id === studentId) || {};

      // Combine all the data
      const progress = studentProgressResponse.data.progress || [];
      const knowledgeGraphs = knowledgeGraphResponse.data.knowledge_graphs || [];
      const errorLogs = errorLogsResponse.data.error_logs || [];
      const errorSummary = errorLogsResponse.data.error_summary || {};

      // Create a comprehensive student progress object
      const studentProgressData = {
        ...studentData,
        courses: studentData.courses || [],
        detailed_progress: progress,
        knowledge_graphs: knowledgeGraphs,
        error_logs: errorLogs,
        error_summary: errorSummary
      };

      setStudentProgress(studentProgressData);
    } catch (error) {
      console.error('Error fetching student progress:', error);
      message.error('Failed to load student progress data');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Check if token exists
      if (!token) {
        console.error('No token available when sending message');
        message.error('Authentication error. Please login again.');
        setLoading(false);
        return;
      }

      // Prepare context info based on user role and settings
      let contextInfo = '';

      if (includeProgressContext) {
        console.log('Building context for role:', userRole);
        console.log('User courses:', userCourses);
        console.log('Student progress:', studentProgress);

        if (userRole === 'student' && userCourses.length > 0) {
          contextInfo = `Student's enrolled courses: ${userCourses.map(c => `${c.course_name} (${c.status})`).join(', ')}. `;
          console.log('Student context info:', contextInfo);

          // Add detailed progress information if available
          if (studentProgress.courses && studentProgress.courses.length > 0) {
            console.log('Adding detailed progress info');
            contextInfo += "Progress details: ";

            // Add course progress information
            studentProgress.courses.forEach(course => {
              contextInfo += `${course.course_name}: ${course.completed_questions}/${course.total_exercises || 'unknown'} exercises completed (${course.completion_percentage || 0}% complete), accuracy rate: ${course.accuracy_rate}%. `;

              if (course.learning_goals) {
                contextInfo += `Learning goals: ${course.learning_goals}. `;
              }
            });

            // Add knowledge graph information
            if (studentProgress.knowledge_graphs && studentProgress.knowledge_graphs.length > 0) {
              contextInfo += "Knowledge assessment: ";

              studentProgress.knowledge_graphs.forEach(kg => {
                if (kg.weak_areas && kg.weak_areas.length > 0) {
                  contextInfo += `Weak areas: ${kg.weak_areas.join(', ')}. `;
                }

                if (kg.suggestions) {
                  contextInfo += `Suggestions: ${kg.suggestions}. `;
                }
              });
            }

            // Add error summary information
            if (studentProgress.error_logs && studentProgress.error_logs.length > 0) {
              contextInfo += "Recent errors: ";

              // Group errors by type
              const errorTypes = {};
              studentProgress.error_logs.forEach(error => {
                if (!errorTypes[error.error_type]) {
                  errorTypes[error.error_type] = 0;
                }
                errorTypes[error.error_type]++;
              });

              // Add summary of error types
              for (const [type, count] of Object.entries(errorTypes)) {
                contextInfo += `${count} ${type} errors, `;
              }
              contextInfo = contextInfo.slice(0, -2) + ". ";

              // Add most recent error details (max 2)
              const recentErrors = studentProgress.error_logs.slice(0, 2);
              if (recentErrors.length > 0) {
                contextInfo += "Most recent error: ";
                recentErrors.forEach(error => {
                  contextInfo += `"${error.question_text}" - ${error.error_type}: ${error.feedback}. `;
                });
              }
            }
          } else {
            console.log('No detailed progress data available');
            contextInfo += "No detailed progress data is available yet. ";
          }
        } else if (userRole === 'instructor' && selectedStudent && studentProgress) {
          const student = students.find(s => s.user_id === selectedStudent);
          console.log('Instructor helping student:', student);

          // Basic student info
          contextInfo = `You are helping ${student?.first_name} ${student?.last_name} (${student?.email}) as an instructor. `;

          // Add course enrollment info
          if (studentProgress.courses && studentProgress.courses.length > 0) {
            contextInfo += `Student's enrolled courses: ${studentProgress.courses.map(c =>
                `${c.course_name} (Status: ${c.status}, Grade: ${c.grade || 'Not graded yet'})`).join(', ')}. `;
          }

          // Add detailed progress if available
          if (studentProgress.detailed_progress && studentProgress.detailed_progress.length > 0) {
            contextInfo += "Progress details: ";

            studentProgress.detailed_progress.forEach(progress => {
              contextInfo += `${progress.course_name}: ${progress.completed_questions}/${progress.total_exercises || 'unknown'} exercises completed (${progress.completion_percentage || 0}% complete), accuracy rate: ${progress.accuracy_rate}%. `;

              if (progress.learning_goals) {
                contextInfo += `Learning goals: ${progress.learning_goals}. `;
              }
            });
          }

          // Add knowledge graph information
          if (studentProgress.knowledge_graphs && studentProgress.knowledge_graphs.length > 0) {
            contextInfo += "Knowledge assessment: ";

            studentProgress.knowledge_graphs.forEach(kg => {
              if (kg.weak_areas && kg.weak_areas.length > 0) {
                contextInfo += `Weak areas: ${kg.weak_areas.join(', ')}. `;
              }

              if (kg.suggestions) {
                contextInfo += `Suggestions: ${kg.suggestions}. `;
              }
            });
          }

          // Add error summary
          if (studentProgress.error_logs && studentProgress.error_logs.length > 0) {
            contextInfo += "Error analysis: ";

            // Add error type summary
            if (studentProgress.error_summary) {
              for (const [type, count] of Object.entries(studentProgress.error_summary)) {
                contextInfo += `${count} ${type} errors, `;
              }
              contextInfo = contextInfo.slice(0, -2) + ". ";
            }

            // Add recent error details
            const recentErrors = studentProgress.error_logs.slice(0, 2);
            if (recentErrors.length > 0) {
              contextInfo += "Recent errors: ";
              recentErrors.forEach(error => {
                contextInfo += `"${error.question_text}" - ${error.error_type}: ${error.feedback}. `;
              });
            }
          }
        } else {
          console.log('Not enough data for context:', { userRole, hasUserCourses: userCourses.length > 0, hasSelectedStudent: !!selectedStudent, hasStudentProgress: !!studentProgress });
        }
      } else {
        console.log('Progress context disabled');
      }

      // Log the final context
      console.log('Final context being sent to AI:', contextInfo);

      // Format messages for the API
      // Add a system message to guide the AI response
      const apiMessages = [
        {
          role: 'system',
          content: `You are an AI assistant specialized in teaching SQL. ${contextInfo}Provide clear, concise answers to SQL questions.`
        },
        ...messages,
        userMessage
      ];

      console.log('API messages being sent:', apiMessages);

      // Use the API base URL from environment variables or use a default
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

      // Make actual API call to backend
      console.log('Sending request to API endpoint:', `${API_URL}/api/ai/chat/`);
      const response = await axios.post(
          `${API_URL}/api/ai/chat/`,
          { messages: apiMessages },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
      );

      if (response.data && response.data.content) {
        const aiResponse = {
          role: 'assistant',
          content: response.data.content
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        // Fallback for unexpected response format
        const aiResponse = {
          role: 'assistant',
          content: 'Sorry, I received an unexpected response format. Please try again later.'
        };
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('Chat API error:', error);

      // Handle different error types
      if (error.response) {
        // Server responded with an error status code
        if (error.response.status === 401) {
          message.error('Authentication failed. Please login again.');
        } else {
          message.error(`Error: ${error.response.data.message || 'Something went wrong'}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        message.error('No response from server. Please check your connection.');
      } else {
        // Other errors
        message.error('Failed to send message. Please try again.');
      }

      // Add error message to chat
      const aiResponse = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again later.'
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Simple message component directly embedded
  const ChatMessageComponent = ({ message, isUser }) => (
      <div style={{
        display: 'flex',
        marginBottom: 16,
        flexDirection: isUser ? 'row-reverse' : 'row'
      }}>
        <Avatar
            icon={isUser ? <UserOutlined /> : <RobotOutlined />}
            style={{
              backgroundColor: isUser ? '#1890ff' : '#52c41a',
              marginRight: isUser ? 0 : 12,
              marginLeft: isUser ? 12 : 0
            }}
        />
        <div
            style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: isUser ? '#e6f7ff' : '#f6ffed',
              textAlign: 'left'
            }}
        >
          <Paragraph style={{ margin: 0 }}>{message.content}</Paragraph>
        </div>
      </div>
  );

  // Add this function after fetchUserData
  useEffect(() => {
    // Display a message about progress status once data fetching is complete
    if (!isFetchingData && token) {
      const statusMessage = {
        role: 'assistant',
        content: getStatusMessage()
      };

      // Only add if we don't already have a status message
      if (messages.length === 1) {
        setMessages(prev => [...prev, statusMessage]);
      }
    }
  }, [isFetchingData, userCourses, studentProgress]);

  // Function to generate an appropriate status message
  const getStatusMessage = () => {
    if (!token) {
      return "You need to be logged in to track your progress. Please log in to get personalized assistance.";
    }

    if (userRole === 'student') {
      if (userCourses.length === 0) {
        return "I notice you haven't enrolled in any courses yet. Once you enroll in SQL courses, I'll be able to provide more personalized assistance based on your progress.";
      }

      if (!studentProgress.courses || studentProgress.courses.length === 0) {
        return "I can see you've enrolled in courses, but I don't have access to your detailed progress yet. Please continue with your SQL exercises, and I'll be able to track your progress soon.";
      }

      return "I can see your course progress data. Feel free to ask me any SQL questions, and I'll provide personalized assistance based on your current learning stage.";
    }

    if (userRole === 'instructor') {
      if (students.length === 0) {
        return "I notice you're an instructor, but I don't see any students in your courses yet. Once students enroll, you can select them from the dropdown to provide targeted assistance.";
      }

      if (!selectedStudent) {
        return "Please select a student from the dropdown menu to provide personalized assistance based on their progress.";
      }

      return `You're currently providing assistance as an instructor. You've selected a student, and I can see their progress data.`;
    }

    return "I don't have access to your learning progress data. Make sure you're logged in with the correct account.";
  };

  return (
      <div style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
        {/* Debug panel - remove in production - made more compact */}
        {import.meta.env.DEV && (
            <Card size="small" style={{ marginBottom: '10px', backgroundColor: '#f0f0f0', maxHeight: '80px', overflowY: 'auto' }}>
              <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div><strong>Debug:</strong> {token ? 'Logged in' : 'Not logged in'} | Role: {userRole || 'Unknown'} | Courses: {userCourses.length}</div>
                </div>
                <div>
                  <Button
                      size="small"
                      onClick={() => console.log('Current state:', {token, userRole, userCourses, studentProgress})}
                  >
                    Log
                  </Button>
                  <Button
                      size="small"
                      onClick={() => {localStorage.clear(); window.location.href = '/login';}}
                      danger
                      style={{ marginLeft: '4px' }}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </Card>
        )}

        <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RobotOutlined style={{ fontSize: 24, color: '#52c41a', marginRight: 8 }} />
                  <Title level={4} style={{ margin: 0 }}>AI SQL Learning Assistant</Title>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ marginRight: '16px' }}>
                    <Text>Include progress</Text>
                    <Switch
                        checked={includeProgressContext}
                        onChange={setIncludeProgressContext}
                        style={{ marginLeft: 8 }}
                    />
                  </div>

                  {userRole === 'instructor' && (
                      <div>
                        <Select
                            placeholder="Select student"
                            style={{ width: 200 }}
                            onChange={handleStudentChange}
                            loading={isFetchingData}
                        >
                          {students.map(student => (
                              <Option key={student.user_id} value={student.user_id}>
                                {student.first_name} {student.last_name}
                              </Option>
                          ))}
                        </Select>
                      </div>
                  )}
                </div>
              </div>
            }
            style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
            bodyStyle={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '12px' }}
        >
          <Divider style={{ margin: '0 0 12px 0' }} />

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {messages.map((message, index) => (
                <ChatMessageComponent
                    key={index}
                    message={message}
                    isUser={message.role === 'user'}
                />
            ))}
            {loading && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Spin tip="AI is thinking..." />
                </div>
            )}
          </div>

          <div style={{ display: 'flex', marginTop: 'auto' }}>
            <TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your SQL question here..."
                autoSize={{ minRows: 2, maxRows: 4 }}
                disabled={loading}
                style={{ marginRight: 8, width: '100%' }}
            />
            <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!input.trim() || loading}
                style={{ height: 'auto' }}
            >
              Send
            </Button>
          </div>
        </Card>
      </div>
  );
};

export default StudentAIChat;