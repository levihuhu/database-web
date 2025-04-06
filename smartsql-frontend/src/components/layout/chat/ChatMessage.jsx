import React from 'react';
import { Avatar, Typography } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';

const { Text } = Typography;

const ChatMessage = ({ message, isUser }) => {
  return (
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
        {isUser ? (
          <Text>{message.content}</Text>
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;