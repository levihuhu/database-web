import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Card, Input, List, Avatar, Spin, Alert, Tabs, Switch, Tooltip, message, Popover, Select, Typography } from 'antd';
import { MessageOutlined, RobotOutlined, UserOutlined, SendOutlined, CloseOutlined, SettingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import apiClient from '../../services/api';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../../context/AuthContext'; // Assuming AuthContext provides role
import './ChatWidget.css'; // We'll need some CSS for positioning

const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;
const { Text } = Typography;

const ChatWidget = ({ initialStudentId = null }) => { // Allow passing initial student context
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('general'); 
    const [showThoughtProcess, setShowThoughtProcess] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId);
    const [studentList, setStudentList] = useState([]);
    const messagesEndRef = useRef(null);
    const { role } = useAuth(); // Get current user's role

    // Effect to clear messages when widget is closed (optional)
    // useEffect(() => {
    //     if (!isOpen) {
    //         setMessages([]);
    //         setError(null);
    //     }
    // }, [isOpen]);

    // Scroll to bottom whenever messages update
    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Fetch student list for instructor when widget opens (and role is instructor)
    useEffect(() => {
        console.log(role)
        if (isOpen && role?.toLowerCase() === 'instructor') {
            const fetchStudents = async () => {
                try {
                    const response = await apiClient.get('/api/instructor/my-students/');
                    if (response.data && response.data.students) {
                        setStudentList(response.data.students);
                    } else {
                        setStudentList([]);
                    }
                } catch (error) {
                    console.error("Failed to fetch student list for chat widget:", error);
                    message.error("Could not load student list.");
                    setStudentList([]);
                }
            };
            fetchStudents();
        }
    }, [isOpen, role]); // Rerun if widget opens or role changes (though role shouldn't change)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleSendMessage = useCallback(async () => {
        if (!inputValue.trim()) return;

        const userMessage = { sender: 'user', text: inputValue };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setInputValue('');
        setLoading(true);
        setError(null);

        const payload = {
            message: userMessage.text,
            mode: mode,
            show_thought_process: showThoughtProcess
        };

        // Always include selected_student_id for instructors, sending null if none selected.
        if (role?.toLowerCase() === 'instructor') {
            payload.selected_student_id = selectedStudentId; // Can be an ID or null
        }

        console.log("Sending payload to /api/ai/chat/:", payload);

        try {
            const response = await apiClient.post('/api/ai/chat/', payload);

            let aiReplyText = "Sorry, I couldn't get a response.";
            let thoughtProcess = null;

            if (response.data) {
                if (response.data.reply) {
                    aiReplyText = response.data.reply;
                } else if(response.data.error) {
                     aiReplyText = `Error: ${response.data.error}`;
                     setError(response.data.error); // Set error state as well
                }
                
                if (response.data.thought_process) {
                    thoughtProcess = response.data.thought_process;
                }
            } 
            
            const aiMessage = { 
                sender: 'ai', 
                text: aiReplyText, 
                isError: !!response.data.error,
                thoughtProcess: thoughtProcess // Attach thought process if available
            };
            setMessages(prevMessages => [...prevMessages, aiMessage]);

        } catch (err) {
            console.error("AI Chat Widget Error:", err);
            const errorMsg = err.response?.data?.error || 'Failed to get response from AI. Please try again.';
            setError(errorMsg);
            const errorMessage = { sender: 'ai', text: errorMsg, isError: true };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setLoading(false);
        }
    }, [inputValue, mode, showThoughtProcess, selectedStudentId, role]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleSendMessage();
        }
    };

    const handleModeChange = (key) => {
        setMode(key);
        setError(null); 
    };

    const toggleWidget = () => {
        setIsOpen(!isOpen);
    };
    
    const handleStudentChange = (value) => {
        setSelectedStudentId(value); // value will be student_id or null
        // Optional: Clear messages or add a system message indicating context change?
        setMessages(prev => [...prev, {sender:'system', text: `Context switched to ${value ? `student ID ${value}` : 'Instructor General'}`}])
    };

    const ThoughtProcessDisplay = ({ data }) => {
        if (!data) return null;
        return (
            <Card size="small" style={{ marginTop: '5px', borderColor: '#1890ff' }}>
                <p><strong>AI Thought Process:</strong></p>
                <p>Generated SQL (Attempted):</p>
                <SyntaxHighlighter language="sql" style={oneDark} customStyle={{ fontSize: '0.8em', margin: '0', padding: '5px' }}>
                    {String(data.generated_sql)}
                </SyntaxHighlighter>
                <p>Executed SQL:</p>
                <SyntaxHighlighter language="sql" style={oneDark} customStyle={{ fontSize: '0.8em', margin: '0', padding: '5px' }}>
                    {String(data.executed_sql)}
                </SyntaxHighlighter>
                 <p>Params Used: {JSON.stringify(data.params_used)}</p>
                <p>Results Count: {data.results_count}</p>
                {/* Optionally show preview 
                <p>Results Preview:</p>
                <pre style={{fontSize: '0.75em', maxHeight: '50px', overflow: 'auto'}}>{JSON.stringify(data.raw_results_preview, null, 2)}</pre> 
                */}
            </Card>
        );
    };
    
    const settingsContent = (
        
        <div style={{width: '250px'}}> {/* Increased width */}
            <Switch 
                checkedChildren="Show Thoughts"
                unCheckedChildren="Hide Thoughts"
                checked={showThoughtProcess}
                onChange={setShowThoughtProcess}
                style={{ marginRight: '10px' }}
            />
            <Tooltip title="If enabled, the AI will show the SQL query it generated and executed (if applicable) along with the final answer.">
                 <QuestionCircleOutlined style={{ cursor: 'help' }} />
            </Tooltip>
            
            {/* Instructor Only: Student Selector */}
            {role?.toLowerCase() === 'instructor' && (
                <div style={{ marginTop: '15px' }}>
                    <h4>Query Context</h4>
                    <Select
                        showSearch
                        allowClear
                        placeholder="Select a student (optional)"
                        value={selectedStudentId}
                        onChange={handleStudentChange}
                        style={{ width: '100%' }}
                        filterOption={(input, option) => 
                           (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={[
                            { value: null, label: 'Instructor General' }, // Option for instructor general context
                            ...studentList // Spread the fetched student list
                        ]}
                    />
                    <Text type="secondary" style={{fontSize: '11px', display: 'block'}}>
                        Select a student to ask questions about their specific data.
                    </Text>
                 </div>
            )}
        </div>
    );

    return (
        <>
            <div className="chat-widget-fab" onClick={toggleWidget}>
                <MessageOutlined style={{ fontSize: '24px', color: 'white' }} />
            </div>

            {isOpen && (
                <Card 
                    className="chat-widget-window"
                    title={<>SmartSQL AI Assistant <Popover content={settingsContent} title="Settings" trigger="click" placement="bottomRight"><Button type="text" icon={<SettingOutlined />} size="small" style={{float: 'right'}} /></Popover></>}
                    bordered={false}
                    extra={<Button type="text" icon={<CloseOutlined />} onClick={toggleWidget} />}
                >
                    <Tabs defaultActiveKey="general" onChange={handleModeChange}>
                        <TabPane tab="General" key="general">
                            {/* Optional: Add context specific info here */}
                        </TabPane>
                        {/* Only show Platform Helper if logged in? Based on useAuth maybe */}
                        <TabPane tab="Platform" key="system">
                           {/* Optional: Add student selector for instructor */}
                        </TabPane>
                    </Tabs>

                    <div className="chat-widget-messages" style={{ /* height: '300px', */ overflowY: 'auto', marginBottom: '10px' }}> {/* Adjusted height potentially */}
                        <List
                            dataSource={messages}
                            renderItem={(item) => (
                                <List.Item className={`${item.sender}-message`}> {/* Add class for CSS targeting */}
                                    {/* Removed List.Item.Meta, build custom structure */}
                                    <div className={`message-container ${item.sender}-message`}>
                                         <div className="message-avatar-label">
                                             <Avatar 
                                                 icon={item.sender === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                                                 style={item.sender === 'ai' && item.isError ? { backgroundColor: '#ff4d4f' } : item.sender === 'ai' ? {backgroundColor: '#1890ff'} : {}}
                                             />
                                            <span className="label-text">
                                                 {item.sender === 'user' ? 'You' : 'AI'} 
                                             </span>
                                        </div>
                                        <div className={`message-bubble ${item.sender} ${item.isError ? 'error' : ''}`}>
                                            <ReactMarkdown
                                                components={{
                                                    code({ node, inline, className, children, ...props }) {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        return !inline && match ? (
                                                            <SyntaxHighlighter
                                                                style={oneDark}
                                                                language={match[1]}
                                                                PreTag="div"
                                                                {...props}
                                                            >
                                                                {String(children).replace(/\n$/, '')}
                                                            </SyntaxHighlighter>
                                                        ) : (
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    }
                                                }}
                                            >
                                                {item.text}
                                            </ReactMarkdown>
                                            {item.thoughtProcess && (
                                                  <ThoughtProcessDisplay data={item.thoughtProcess} />
                                              )}
                                        </div>
                                    </div>
                                </List.Item>
                            )}
                        />
                        {loading && <div style={{ textAlign: 'center', padding: '10px' }}><Spin /></div>}
                        <div ref={messagesEndRef} />
                    </div>

                    {error && !loading && <Alert message={error} type="error" showIcon style={{ marginBottom: '10px' }} />}

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <TextArea
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={`Ask the ${mode === 'general' ? 'General' : 'Platform'} Helper${role === 'Instructor' && selectedStudentId ? ` about student ${selectedStudentId}` : role === 'Instructor' ? ' (Instructor Context)' : ''}...`}
                            autoSize={{ minRows: 1, maxRows: 3 }}
                            style={{ marginRight: '8px' }}
                            disabled={loading}
                        />
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={handleSendMessage}
                            loading={loading}
                            disabled={!inputValue.trim()}
                        />
                    </div>
                </Card>
            )}
        </>
    );
};

export default ChatWidget; 