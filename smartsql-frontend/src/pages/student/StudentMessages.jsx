import React, { useState, useEffect } from 'react';
import { 
  List, 
  Spin, 
  Input, 
  Card, 
  Typography, 
  Tag, 
  Empty, 
  message, 
  Space,
  Tabs
} from 'antd';
import { 
  MailOutlined, 
  SoundOutlined, 
  UserOutlined, 
  ClockCircleOutlined, 
  SearchOutlined,
  SendOutlined
} from '@ant-design/icons';
import apiClient from '../../services/api';
import { debounce } from 'lodash';
import dayjs from 'dayjs'; // For date formatting
import relativeTime from 'dayjs/plugin/relativeTime'; // For "time ago" functionality

// Add dayjs plugins
dayjs.extend(relativeTime);

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

const StudentMessages = () => {
  const [messagesData, setMessagesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/student/messages/');
        if (response.data.status === 'success') {
          setMessagesData(response.data.data);
          setFilteredMessages(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to fetch messages');
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError(error.message || 'Failed to load messages');
        message.error(error.message || 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  useEffect(() => {
    let filtered = messagesData;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.message_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sender_first_name && item.sender_first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.sender_last_name && item.sender_last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.sender_username && item.sender_username.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by category
    if (activeTab !== 'all') {
      filtered = filtered.filter(item => item.message_type === activeTab);
    }
    
    setFilteredMessages(filtered);
  }, [searchTerm, activeTab, messagesData]);

  const handleSearch = debounce((value) => {
    setSearchTerm(value);
  }, 300);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Title level={2}>Messages</Title>
        <Card>
          <Text type="danger">{error}</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>Messages</Title>
      <Paragraph>View your private messages and course announcements</Paragraph>

      <Card bodyStyle={{ padding: 0 }}>
        <div style={{ padding: '20px 20px 0' }}>
          <Search
            placeholder="Search message content or sender..."
            allowClear
            enterButton={<><SearchOutlined /> Search</>}
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ marginBottom: '16px' }}
          />
        </div>
        
        <Tabs 
          defaultActiveKey="all" 
          onChange={handleTabChange}
          style={{ padding: '0 16px' }}
        >
          <TabPane tab="All Messages" key="all" />
          <TabPane tab="Private Messages" key="private" />
          <TabPane tab="Announcements" key="announcement" />
        </Tabs>

        {filteredMessages.length === 0 ? (
          <Empty 
            description="No messages found" 
            style={{ padding: '40px 0' }}
          />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={filteredMessages}
            renderItem={item => {
              const isAnnouncement = item.message_type === 'announcement';
              const isSent = item.is_sent_by_me;
              let title = '';
              let titleColor = '#1890ff'; // Default blue
              let icon = <MailOutlined />;
              let roleText = '';
              let targetName = '';

              if (isAnnouncement) {
                title = 'Course Announcement';
                titleColor = '#fa8c16'; // Orange
                icon = <SoundOutlined />;
                roleText = 'From';
                targetName = `${item.sender_first_name || ''} ${item.sender_last_name || ''}`.trim() || item.sender_username;
              } else if (isSent) {
                title = 'Sent Private Message';
                titleColor = '#52c41a'; // Green
                icon = <SendOutlined />;
                roleText = 'To';
                targetName = `${item.receiver_first_name || ''} ${item.receiver_last_name || ''}`.trim() || item.receiver_username;
              } else { // Received Private Message
                title = 'Received Private Message';
                titleColor = '#1890ff'; // Blue
                icon = <MailOutlined />;
                roleText = 'From';
                targetName = `${item.sender_first_name || ''} ${item.sender_last_name || ''}`.trim() || item.sender_username;
              }

              return (
                <List.Item style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    avatar={<span style={{ fontSize: '24px', color: titleColor }}>{icon}</span>}
                    title={
                      <Space>
                        <Text strong style={{ color: titleColor }}>
                          {title}
                        </Text>
                        <Tag color={isAnnouncement ? "warning" : (isSent ? "success" : "processing")}>
                          {isAnnouncement ? "Announcement" : "Private"}
                          {isSent && !isAnnouncement && " (Sent)"}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Space size="small" wrap>
                          <Text type="secondary"><UserOutlined /> {roleText}: {targetName}</Text>
                          <Text type="secondary">
                            <ClockCircleOutlined /> {dayjs(item.timestamp).fromNow()} 
                            ({dayjs(item.timestamp).format('YYYY-MM-DD HH:mm')})
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                  <div style={{ marginLeft: '48px', marginTop: '8px' }}> 
                    <div>{item.message_content}</div>
                  </div>
                </List.Item>
              );
            }}
            style={{ width: '100%' }}
          />
        )}
      </Card>
    </div>
  );
};

export default StudentMessages; 