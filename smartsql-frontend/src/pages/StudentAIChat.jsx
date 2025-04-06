import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Spin, Typography, Divider, Card, Alert, Space } from 'antd';
import { SendOutlined, RobotOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { sendMessageToGPT } from '../services/getService';
import ChatMessage from '../components/layout/chat/ChatMessage';

const { TextArea } = Input;
const { Title, Text } = Typography;

const StudentAIChat = () => {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'I am your learning assistant, ready to help you with questions, explain concepts, and assist with homework.' },
    { role: 'assistant', content: 'Hello! I\'m your learning assistant. I can help you answer questions, explain concepts, or assist with homework. What do you need help with?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);
    
    try {
      // Prepare messages to send to API
      const messagesToSend = [
        { role: 'system', content: 'You are a friendly learning assistant, helping students answer questions, explain concepts, and assist with homework.' },
        ...messages.filter(msg => msg.role !== 'system'),
        userMessage
      ];
      
      const response = await sendMessageToGPT(messagesToSend);
      setMessages(prev => [...prev, response]);
    } catch (err) {
      console.error('Error sending message to GPT:', err);
      setError('Error communicating with AI assistant. Please try again later.');
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
    <div style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <RobotOutlined style={{ fontSize: 24, color: '#52c41a' }} />
          <Title level={4} style={{ margin: 0 }}>AI Learning Assistant</Title>
        </Space>
        <Divider />
        <Text>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          The AI assistant can help you answer questions, explain concepts, and assist with homework, but remember that AI may make mistakes. Please verify important information with your teacher.
        </Text>
      </Card>
      
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}
      
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '16px', 
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        {messages.filter(msg => msg.role !== 'system').map((message, index) => (
          <ChatMessage 
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
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ display: 'flex', marginTop: 'auto' }}>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your question..."
          autoSize={{ minRows: 2, maxRows: 6 }}
          disabled={loading}
          style={{ marginRight: 8 }}
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
    </div>
  );
};

export default StudentAIChat;