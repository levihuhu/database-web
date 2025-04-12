import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FloatButton, Drawer, Input, Button, List, Avatar, Spin, message, Space, Typography, Switch, Select, Tooltip } from 'antd';
import { MessageOutlined, RobotOutlined, UserOutlined, CloseOutlined, PaperClipOutlined } from '@ant-design/icons';
import axios from 'axios'; // Direct axios usage for flexibility
import apiClient from '../services/api'; // Use apiClient for other instructor data if needed

const { TextArea } = Input;
const { Paragraph, Text } = Typography;
const { Option } = Select;

const InstructorAIChatbot = () => {
    const [visible, setVisible] = useState(false);
    const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hello Instructor! How can I help you today?' }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [includeContext, setIncludeContext] = useState(true); // Default to including context
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null); // For context of a specific student
    const [studentProgress, setStudentProgress] = useState(null); // Detailed progress for selected student

    const messagesEndRef = useRef(null);
    const token = localStorage.getItem('access'); // Get token for API calls

    // Scroll to bottom when new messages are added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch initial data needed for context (courses, students)
    const fetchInstructorContextData = useCallback(async () => {
        if (!visible || !token) return; // Only fetch if drawer is open and logged in
        setIsFetchingData(true);
        try {
            // Fetch courses taught by this instructor
            const courseRes = await apiClient.get('/api/instructor/courses/');
            setCourses(courseRes.data?.courses || []);

            // Fetch students enrolled in their courses
            const studentRes = await apiClient.get('/api/instructor/students/');
            setStudents(studentRes.data?.students || []);

        } catch (error) {
            console.error("Error fetching instructor context data:", error);
            message.error("Failed to load data for AI context.");
        } finally {
            setIsFetchingData(false);
        }
    }, [visible, token]);

    useEffect(() => {
        fetchInstructorContextData();
    }, [fetchInstructorContextData]);

    // Fetch detailed data for a selected student
    const fetchStudentDetailContext = async (studentId) => {
        if (!studentId || !token) {
            setStudentProgress(null);
            return;
        }
        setIsFetchingData(true);
        setStudentProgress(null); // Clear previous data
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            // Example: Fetch progress, knowledge graph, errors for the student
            // Replace with your actual endpoints if they exist
            const [progressRes, kgRes, errorRes] = await Promise.all([
                axios.get(`${API_URL}/api/instructor/students/${studentId}/progress/`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(e => { console.warn('Progress fetch failed'); return { data: {} }; }),
                axios.get(`${API_URL}/api/instructor/students/${studentId}/knowledge-graph/`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(e => { console.warn('KG fetch failed'); return { data: {} }; }),
                axios.get(`${API_URL}/api/instructor/students/${studentId}/error-logs/`, { headers: { 'Authorization': `Bearer ${token}` } }).catch(e => { console.warn('Errors fetch failed'); return { data: {} }; })
            ]);

            const studentFullData = students.find(s => s.user_id === studentId) || {};

            setStudentProgress({
                ...studentFullData, // Basic info
                detailed_progress: progressRes.data.progress || [],
                knowledge_graphs: kgRes.data.knowledge_graphs || [],
                error_logs: errorRes.data.error_logs || [],
                error_summary: errorRes.data.error_summary || {}
            });
            message.success(`Loaded context for student: ${studentFullData.first_name || studentFullData.username}`);

        } catch (error) {
            console.error("Error fetching student detail context:", error);
            message.error("Failed to load detailed context for the selected student.");
            setStudentProgress(null);
        } finally {
            setIsFetchingData(false);
        }
    };

    // Handle sending message to the backend AI API
    const handleSendMessage = async () => {
        if (!input.trim() || !token) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        let contextInfo = "You are an AI assistant helping an INSTRUCTOR. ";
        if (includeContext) {
            contextInfo += `Instructor manages ${courses.length} courses. `;
            if (selectedStudent && studentProgress) {
                contextInfo += `Currently focusing on student: ${studentProgress.first_name || studentProgress.username}. `;
                // Add specific student context (simplified example)
                if (studentProgress.detailed_progress?.length > 0) {
                    contextInfo += `Recent progress: ${studentProgress.detailed_progress.slice(0, 1).map(p => `${p.course_name}: ${p.progress}%`).join(', ')}. `;
                }
                if (studentProgress.error_summary && Object.keys(studentProgress.error_summary).length > 0) {
                     contextInfo += `Common errors: ${Object.entries(studentProgress.error_summary).map(([type, count]) => `${count} ${type}`).join(', ')}. `;
                }
            } else {
                 contextInfo += `There are ${students.length} students enrolled overall. `;
            }
        }

        const apiMessages = [
            { role: 'system', content: contextInfo },
            ...messages.slice(-6), // Include recent history
            userMessage
        ];

        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const response = await axios.post(
                `${API_URL}/api/ai/chat/`, // Use the central AI chat endpoint
                { messages: apiMessages },
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );

            if (response.data && response.data.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.data.content }]);
            } else {
                throw new Error('Invalid response format from AI API');
            }
        } catch (error) {
            console.error("Chat API error:", error);
            message.error(error.response?.data?.message || 'Failed to get response from AI assistant.');
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
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

    return (
        <>
            <FloatButton 
                icon={<MessageOutlined />} 
                type="primary" 
                style={{ right: 24, bottom: 24 }} 
                onClick={() => setVisible(true)} 
            />
            <Drawer
                title="AI Assistant (Instructor)"
                placement="right"
                onClose={() => setVisible(false)}
                open={visible}
                width={400}
                mask={false}
                extra={
                    <Tooltip title="Include course/student context in prompts">
                        <Space>
                            <Text>Context:</Text>
                            <Switch 
                                checked={includeContext} 
                                onChange={setIncludeContext} 
                                size="small" 
                            />
                        </Space>
                    </Tooltip>
                }
                footer={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <TextArea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask about courses, students, or SQL..."
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            disabled={loading}
                        />
                        <Button type="primary" onClick={handleSendMessage} loading={loading} disabled={!input.trim()}>
                            Send
                        </Button>
                    </div>
                }
            >
                <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
                    <Text type="secondary">Select student for specific context:</Text>
                    <Select
                        showSearch
                        allowClear
                        placeholder="Select a student (optional)"
                        style={{ width: '100%' }}
                        value={selectedStudent}
                        onChange={(value) => {
                            setSelectedStudent(value);
                            fetchStudentDetailContext(value);
                        }}
                        loading={isFetchingData}
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                             option.children.toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {students.map(s => (
                            <Option key={s.user_id} value={s.user_id}>
                                {`${s.first_name || ''} ${s.last_name || ''} (${s.username})`}
                            </Option>
                        ))}
                    </Select>
                </Space>
                
                <List
                    dataSource={messages}
                    renderItem={item => (
                        <List.Item style={{ borderBottom: 'none', padding: '8px 0' }}>
                           <div style={{
                                display: 'flex',
                                flexDirection: item.role === 'user' ? 'row-reverse' : 'row'
                            }}>
                                <Avatar 
                                    icon={item.role === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                                    style={{ 
                                        backgroundColor: item.role === 'user' ? '#1890ff' : '#52c41a',
                                        marginRight: item.role === 'user' ? 0 : 8,
                                        marginLeft: item.role === 'user' ? 8 : 0,
                                        flexShrink: 0
                                    }}
                                />
                                <div style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: item.role === 'user' ? '#e6f7ff' : '#f6ffed',
                                    maxWidth: '80%',
                                    wordBreak: 'break-word'
                                }}>
                                    <Paragraph style={{ margin: 0 }}>{item.content}</Paragraph>
                                </div>
                           </div>
                        </List.Item>
                    )}
                />
                <div ref={messagesEndRef} />
                {loading && <Spin style={{ position: 'absolute', bottom: 70, left: '50%', transform: 'translateX(-50%)' }}/>}
            </Drawer>
        </>
    );
};

export default InstructorAIChatbot; 