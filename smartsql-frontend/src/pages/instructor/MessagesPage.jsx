import React, { useState, useEffect, useCallback } from 'react';
import { List, Spin, Input, Card, Typography, Tag, Empty, message, Space } from 'antd';
import { MailOutlined, SoundOutlined, UserOutlined, ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';
import apiClient from '../../services/api';
import { debounce } from 'lodash';
import dayjs from 'dayjs'; // For date formatting
import relativeTime from 'dayjs/plugin/relativeTime'; // For 'time ago'

dayjs.extend(relativeTime);

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

const MessagesPage = () => {
    const [messagesData, setMessagesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchMessages = useCallback(async (currentSearch) => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (currentSearch) {
                params.search = currentSearch;
            }
            const response = await apiClient.get('/api/instructor/messages/', { params });
            setMessagesData(response.data?.messages || []);
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError(err.response?.data?.error || 'Failed to load messages.');
            message.error(err.response?.data?.error || 'Failed to load messages.');
            setMessagesData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMessages(searchTerm);
    }, [fetchMessages]); // Fetch on initial mount and when searchTerm changes dependency array

    const debouncedSearch = useCallback(
        debounce((value) => {
            setSearchTerm(value);
            fetchMessages(value); // Trigger fetch with new search term
        }, 500), // 500ms delay
        [fetchMessages] // fetchMessages is stable due to useCallback
    );

    const handleSearch = (value) => {
        debouncedSearch(value);
    };

    return (
        <div style={{ padding: '24px' }}>
            <Title level={3}>Messages & Announcements</Title>
            <Paragraph>View your private messages and course announcements.</Paragraph>

            <Card>
                <Search
                    placeholder="Search by content, user, or course..."
                    allowClear
                    enterButton={<><SearchOutlined /> Search</>}
                    size="large"
                    onSearch={handleSearch}
                    onChange={(e) => handleSearch(e.target.value)} // Trigger search on change with debounce
                    style={{ marginBottom: '20px' }}
                />

                {loading && <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>}
                {!loading && error && <Text type="danger">Error: {error}</Text>}
                {!loading && !error && messagesData.length === 0 && <Empty description="No messages found." />}

                {!loading && !error && messagesData.length > 0 && (
                    <List
                        itemLayout="vertical"
                        dataSource={messagesData}
                        renderItem={item => {
                            const isAnnouncement = item.message_type_val === 'announcement';
                            const titleColor = isAnnouncement ? '#fa8c16' : '#1890ff'; // Orange for announcement, blue for private
                            const icon = isAnnouncement ? <SoundOutlined /> : <MailOutlined />;

                            return (
                                <List.Item key={item.message_id}>
                                    <List.Item.Meta
                                        avatar={<span style={{ fontSize: '24px', color: titleColor }}>{icon}</span>}
                                        title={
                                            <Space>
                                                <Text strong style={{ color: titleColor }}>
                                                    {isAnnouncement ? `Announcement: ${item.course_context_name || 'General'}` : 'Private Message'}
                                                </Text>
                                                <Tag color={isAnnouncement ? "warning" : "processing"}>
                                                    {isAnnouncement ? "Announcement" : "Private"}
                                                </Tag>
                                            </Space>
                                        }
                                        description={
                                            <Space size="small" wrap>
                                                <Text type="secondary"><UserOutlined /> From: {item.sender_name || item.sender_username}</Text>
                                                {!isAnnouncement && item.related_user_name &&
                                                    <Text type="secondary">| To: {item.related_user_name} ({item.related_user_username})</Text>
                                                }
                                                 <Text type="secondary"> | <ClockCircleOutlined /> {dayjs(item.timestamp).fromNow()} ({dayjs(item.timestamp).format('YYYY-MM-DD HH:mm')})</Text>
                                            </Space>
                                        }
                                    />
                                    <div style={{ marginLeft: '48px' }}> {/* Align content with title */}
                                      {item.message_content}
                                    </div>
                                </List.Item>
                            );
                        }}
                    />
                )}
            </Card>
        </div>
    );
};

export default MessagesPage;
