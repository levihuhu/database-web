import React, { useState, useEffect, useCallback } from 'react';
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
    Button,
    Modal,
    Select,
    Radio,
    Form,
    Divider,
    Row,
    Col
} from 'antd';
import { 
    MailOutlined, 
    SoundOutlined, 
    UserOutlined, 
    ClockCircleOutlined, 
    SearchOutlined,
    SendOutlined,
    PlusOutlined
} from '@ant-design/icons';
import apiClient from '../../services/api';
import { debounce } from 'lodash';
import dayjs from 'dayjs'; // For date formatting
import relativeTime from 'dayjs/plugin/relativeTime'; // For 'time ago'

dayjs.extend(relativeTime);

const { Title, Paragraph, Text } = Typography;
const { Search, TextArea } = Input;
const { Option } = Select;

const MessagesPage = () => {
    const [messagesData, setMessagesData] = useState([]);
    const [recipients, setRecipients] = useState({ students: [], courses: [] });
    const [loading, setLoading] = useState(true);
    const [loadingRecipients, setLoadingRecipients] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    // Fetch received messages and sent announcements
    const fetchMessages = useCallback(async (currentSearch) => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (currentSearch) {
                params.search = currentSearch;
            }
            // Use the correct API endpoint
            const response = await apiClient.get('/api/instructor/messages/', { params }); 
            setMessagesData(response.data?.messages || []);
        } catch (err) {
            console.error('Error fetching messages:', err);
            const errorMsg = err.response?.data?.error || 'Failed to load messages.';
            setError(errorMsg);
            message.error(errorMsg);
            setMessagesData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch potential recipients (students and courses)
    const fetchRecipients = async () => {
        setLoadingRecipients(true);
        try {
            const response = await apiClient.get('/api/instructor/recipients/');
            setRecipients(response.data || { students: [], courses: [] });
        } catch (err) {
            console.error('Error fetching recipients:', err);
            message.error('Failed to load recipient list.');
        } finally {
            setLoadingRecipients(false);
        }
    };

    useEffect(() => {
        fetchMessages(searchTerm);
        // Fetch recipients only once on mount, or when needed
        // fetchRecipients(); 
    }, [fetchMessages, searchTerm]); // Rerun fetchMessages when searchTerm changes

    const debouncedSearch = useCallback(
        debounce((value) => {
            setSearchTerm(value);
            // fetchMessages(value); // fetchMessages is now called via useEffect
        }, 500), 
        [] // No need for fetchMessages here anymore
    );

    const handleSearch = (value) => {
        debouncedSearch(value);
    };

    const showModal = () => {
        fetchRecipients(); // Fetch recipients when modal is opened
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const handleSend = async (values) => {
        setLoading(true); // Indicate loading state for sending
        try {
            let payload = { 
                message_type: values.message_type, 
                content: values.content 
            };

            if (values.message_type === 'private') {
                if (!values.receiver_id) {
                    message.error('Please select a student recipient for private messages.');
                    setLoading(false);
                    return;
                }
                payload.receiver_id = values.receiver_id;
            } else { // announcement
                // course_id can be null/undefined if sending to all
                payload.course_id = values.course_id; 
            }

            await apiClient.post('/api/instructor/messages/', payload);
            message.success('Message sent successfully!');
            setIsModalVisible(false);
            form.resetFields();
            // Optionally re-fetch messages if you want to see sent announcements immediately
            // fetchMessages(searchTerm);
        } catch (err) {
            console.error('Error sending message:', err);
            message.error(err.response?.data?.error || 'Failed to send message.');
        } finally {
            setLoading(false);
        }
    };

    // Watch for message type changes to adjust recipient field requirement/visibility
    const messageType = Form.useWatch('message_type', form);

    return (
        <div style={{ padding: '24px' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Title level={3} style={{ marginBottom: 0 }}>Messages & Announcements</Title>
                </Col>
                <Col>
                    <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                        Compose Message
                    </Button>
                </Col>
            </Row>
            <Paragraph>View received private messages and announcements you've sent.</Paragraph>

            <Card>
                <Search
                    placeholder="Search by content, sender, or course..."
                    allowClear
                    enterButton={<><SearchOutlined /> Search</>}
                    size="large"
                    onSearch={handleSearch}
                    onChange={(e) => handleSearch(e.target.value)} 
                    style={{ marginBottom: '20px' }}
                    value={searchTerm} // Control the input value
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
                            // Sender is always the instructor for announcements shown here
                            const titleColor = isAnnouncement ? '#fa8c16' : '#1890ff'; 
                            const icon = isAnnouncement ? <SoundOutlined /> : <MailOutlined />;
                            const senderName = `${item.sender_first_name || ''} ${item.sender_last_name || ''}`.trim() || item.sender_username;

                            return (
                                <List.Item key={item.message_id}>
                                    <List.Item.Meta
                                        avatar={<span style={{ fontSize: '24px', color: titleColor }}>{icon}</span>}
                                        title={
                                            <Space>
                                                <Text strong style={{ color: titleColor }}>
                                                    {isAnnouncement ? `Announcement: ${item.course_context_name || 'All Courses'}` : 'Private Message'}
                                                </Text>
                                                <Tag color={isAnnouncement ? "warning" : "processing"}>
                                                    {isAnnouncement ? "Announcement" : "Private"}
                                                </Tag>
                                            </Space>
                                        }
                                        description={
                                            <Space size="small" wrap>
                                                <Text type="secondary"><UserOutlined /> 
                                                    {isAnnouncement ? 'Sent by: You' : `From: ${senderName}`}
                                                </Text>
                                                 <Text type="secondary"> | <ClockCircleOutlined /> {dayjs(item.timestamp).fromNow()} ({dayjs(item.timestamp).format('YYYY-MM-DD HH:mm')})</Text>
                                            </Space>
                                        }
                                    />
                                    <div style={{ marginLeft: '48px' }}> 
                                      {item.message_content}
                                    </div>
                                </List.Item>
                            );
                        }}
                    />
                )}
            </Card>

            {/* Compose Message Modal */}
            <Modal
                title="Compose New Message"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null} // Use Form's buttons
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSend}
                    initialValues={{ message_type: 'private' }} // Default to private
                >
                    <Form.Item
                        name="message_type"
                        label="Message Type"
                        rules={[{ required: true }]}
                    >
                        <Radio.Group>
                            <Radio value="private">Private Message</Radio>
                            <Radio value="announcement">Announcement</Radio>
                        </Radio.Group>
                    </Form.Item>

                    {messageType === 'private' && (
                        <Form.Item
                            name="receiver_id"
                            label="Recipient (Student)"
                            rules={[{ required: true, message: 'Please select a student' }]}
                        >
                            <Select
                                showSearch
                                placeholder="Select a student"
                                optionFilterProp="children"
                                loading={loadingRecipients}
                                filterOption={(input, option) => 
                                    option.children.toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {recipients.students.map(student => (
                                    <Option key={student.user_id} value={student.user_id}>
                                        {`${student.first_name || ''} ${student.last_name || ''} (${student.username})`}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    {messageType === 'announcement' && (
                        <Form.Item
                            name="course_id"
                            label="Target Course (Optional)"
                            help="Leave blank to send to all students in all your courses."
                        >
                            <Select
                                allowClear
                                placeholder="Select a course (or send to all)"
                                loading={loadingRecipients}
                                showSearch
                                filterOption={(input, option) => 
                                    option.children.toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                <Option value={null}>All My Courses</Option>
                                {recipients.courses.map(course => (
                                    <Option key={course.course_id} value={course.course_id}>
                                        {`${course.course_name} (${course.course_code} - ${course.year} ${course.term})`}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    <Form.Item
                        name="content"
                        label="Message Content"
                        rules={[{ required: true, message: 'Please enter message content' }]}
                    >
                        <TextArea rows={5} placeholder="Type your message here..." />
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right' }}>
                        <Space>
                            <Button onClick={handleCancel}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />}>
                                Send Message
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default MessagesPage;
