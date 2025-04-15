import React, { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Button, Form, Input, Radio, Tabs, message, Modal, Row, Col, Divider, Statistic, List } from 'antd';
import { UserOutlined, EditOutlined, MailOutlined, SaveOutlined, CloseOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function Profile() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryUserId = queryParams.get('user_id');
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [form] = Form.useForm();
  const [enrollments, setEnrollments] = useState(null);
  
  const currentUserId = localStorage.getItem('user_id');
  const targetUserId = queryUserId || currentUserId;
  const isOwnProfile = !queryUserId || (currentUserId === queryUserId);
  
  useEffect(() => {
    fetchUserData();
  }, [targetUserId]);
  
  const fetchUserData = async () => {
    setLoading(true);
    setEnrollments(null);
    try {
      const response = await apiClient.get(`/api/users/profile/?user_id=${targetUserId}`);
      
      if (response.data.status === 'success') {
        const userData = response.data.data;
        setUser(userData);
        form.setFieldsValue({
          first_name: userData.first_name,
          last_name: userData.last_name,
          username: userData.username,
          email: userData.email,
          user_type: userData.user_type,
          profile_info: userData.profile_info
        });

        if (response.data.enrollments) {
          setEnrollments(response.data.enrollments);
        }

      } else {
        message.error(response.data.message || 'Get user data failed');
      }
    } catch (error) {
      message.error('Get user data failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdate = async (values) => {
    try {
      const response = await apiClient.put('/api/users/profile/update/', values);
      
      if (response.data.status === 'success') {
        message.success('Update successfully');
        setEditing(false);
        fetchUserData();
      } else {
        message.error(response.data.message || 'Update failed');
      }
    } catch (error) {
      message.error('Update failed: ' + (error.response?.data?.message || error.message));
    }
  };
  
  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      message.warning('Message content cannot be empty');
      return;
    }
    try {
      await apiClient.post('/api/messages/', {
        receiver_id: targetUserId,
        content: messageContent
      });
      message.success('Message sent successfully');
      setMessageModal(false);
      setMessageContent('');
    } catch (error) {
      message.error('Send message failed: ' + (error.response?.data?.message || error.message));
    }
  };
  
  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await apiClient.post('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUser(prev => ({...prev, avatar_url: response.data.avatar_url}));
      message.success('Avatar uploaded successfully');
    } catch (error) {
      message.error('Avatar upload failed');
    }
  };
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }
  
  if (!user) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>User not found</div>;
  }
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Card bordered={false} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          {isOwnProfile ? (
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => setEditing(true)}
              disabled={editing}
            >
              Edit profile
            </Button>
          ) : (
            <Button 
              type="primary" 
              icon={<MailOutlined />} 
              onClick={() => setMessageModal(true)}
            >
              Send message
            </Button>
          )}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '15px' }}>
            <Avatar 
              size={120} 
              icon={<UserOutlined />}
              src={user.avatar_url} 
              style={{ border: '4px solid #f0f0f0' }}
            />
            {isOwnProfile && (
              <div style={{ position: 'absolute', bottom: '0', right: '0' }}>
                <label htmlFor="avatar-upload" style={{ cursor: 'pointer', backgroundColor: '#1890ff', color: 'white', borderRadius: '50%', padding: '5px', display: 'flex' }}>
                  <EditOutlined />
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    style={{ display: 'none' }} 
                    accept="image/*"
                    onChange={handleUploadAvatar}
                  />
                </label>
              </div>
            )}
          </div>
          
          <Title level={2} style={{ margin: '0 0 5px 0' }}>
            {user.first_name} {user.last_name}
          </Title>
          
          <Text type="secondary" style={{ display: 'block', marginBottom: '10px' }}>
            <EnvironmentOutlined style={{ marginRight: '5px' }} />
            {user.user_type === 'Student' ? 'Student' : 'Instructor'}
          </Text>
          
          {!editing && (
            <Paragraph style={{ maxWidth: '500px', margin: '0 auto 20px' }}>
              {user.profile_info || 'User has not filled in their profile information yet'}
            </Paragraph>
          )}
        </div>
        
        {editing && isOwnProfile ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            style={{ maxWidth: '500px', margin: '0 auto' }}
          >
            <Form.Item name="username" label="Username">
              <Input disabled />
            </Form.Item>
            
            <Form.Item name="email" label="Email">
              <Input disabled />
            </Form.Item>
            
            <Form.Item name="user_type" label="User type">
              <Radio.Group disabled>
                <Radio value="Student">Student</Radio>
                <Radio value="Instructor">Instructor</Radio>
              </Radio.Group>
            </Form.Item>
            
            <Form.Item name="profile_info" label="Profile information">
              <TextArea rows={4} />
            </Form.Item>
            
            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button icon={<CloseOutlined />} onClick={() => setEditing(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Save</Button>
              </div>
            </Form.Item>
          </Form>
        ) : (
          <>
            <Divider style={{ margin: '10px 0 30px' }} />
            
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <Row gutter={[0, 20]} style={{ textAlign: 'left' }}>
                <Col span={24}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flex: '0 0 100px', fontWeight: 'bold' }}>Username:</div>
                    <div>{user.username}</div>
                  </div>
                </Col>
                
                <Col span={24}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flex: '0 0 100px', fontWeight: 'bold' }}>Name:</div>
                    <div>{user.first_name} {user.last_name}</div>
                  </div>
                </Col>
                
                <Col span={24}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flex: '0 0 100px', fontWeight: 'bold' }}>Email:</div>
                    <div>{user.email}</div>
                  </div>
                </Col>
                
                <Col span={24}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flex: '0 0 100px', fontWeight: 'bold' }}>User type:</div>
                    <div>{user.user_type === 'Student' ? 'Student' : 'Instructor'}</div>
                  </div>
                </Col>
              </Row>
            </div>

            {enrollments && enrollments.length > 0 && (
              <>
                <Divider />
                <Title level={4}>Course Enrollments (Your Courses)</Title>
                <List
                  itemLayout="horizontal"
                  dataSource={enrollments}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        title={<Link to={`/teacher/courses/${item.course_id}/modules`}>{item.course_name} ({item.course_code})</Link>}
                        description={`${item.year} ${item.term} - Status: ${item.status}`}
                      />
                      <div>Grade: {item.grade || 'N/A'}</div>
                    </List.Item>
                  )}
                />
              </>
            )}
            
            {enrollments && enrollments.length === 0 && (
              <>
                <Divider />
                <Text type="secondary">No enrollment records found for this student in your courses.</Text>
              </>
            )}
          </>
        )}
      </Card>
      
      <Modal
        title={`Send message to ${user?.first_name || ''} ${user?.last_name || ''}`}
        open={messageModal}
        onOk={handleSendMessage}
        onCancel={() => setMessageModal(false)}
        okText="Send"
        cancelText="Cancel"
        confirmLoading={loading}
      >
        <TextArea
          rows={4}
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="Please enter message content..."
        />
      </Modal>
    </div>
  );
}
