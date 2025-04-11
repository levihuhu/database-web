import React, { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Button, Form, Input, Radio, Tabs, message, Modal, Row, Col, Divider, Statistic, List } from 'antd';
import { UserOutlined, EditOutlined, MailOutlined, SaveOutlined, CloseOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function Profile() {
  const { userId } = useParams(); // 从URL获取用户ID
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [form] = Form.useForm();
  const [enrollments, setEnrollments] = useState(null); // Add state for enrollments
  
  // 获取当前登录用户ID
  const currentUserId = localStorage.getItem('user_id');
  const isOwnProfile = currentUserId === userId || !userId;
  
  useEffect(() => {
    fetchUserData();
  }, [userId]);
  
  const fetchUserData = async () => {
    setLoading(true);
    setEnrollments(null); // Reset enrollments on fetch
    try {
      const targetId = userId || currentUserId;
      const response = await apiClient.get(`/api/users/profile/?user_id=${targetId}`);
      
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

        // Check if enrollment data is present (added by backend for instructor view)
        if (response.data.enrollments) {
          setEnrollments(response.data.enrollments);
        }

      } else {
        message.error(response.data.message || '获取用户数据失败');
      }
    } catch (error) {
      message.error('获取用户数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdate = async (values) => {
    try {
      const response = await apiClient.put('/api/users/profile/update/', values);
      
      if (response.data.status === 'success') {
        message.success('个人资料更新成功');
        setEditing(false);
        fetchUserData();
      } else {
        message.error(response.data.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败: ' + (error.response?.data?.message || error.message));
    }
  };
  
  const handleSendMessage = async () => {
    try {
      console.log(userId)
      console.log(messageContent)
      await apiClient.post('/api/messages/', {
        receiver_id: userId,
        content: messageContent
      });
      message.success('消息发送成功');
      setMessageModal(false);
      setMessageContent('');
    } catch (error) {
      message.error('发送失败: ' + (error.response?.data?.message || error.message));
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
      message.success('头像上传成功');
    } catch (error) {
      message.error('头像上传失败');
    }
  };
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>;
  }
  
  if (!user) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>未找到用户</div>;
  }
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Card bordered={false} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        {/* 顶部操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          {isOwnProfile ? (
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => setEditing(true)}
              disabled={editing}
            >
              编辑资料
            </Button>
          ) : (
            <Button 
              type="primary" 
              icon={<MailOutlined />} 
              onClick={() => setMessageModal(true)}
            >
              发送消息
            </Button>
          )}
        </div>

        {/* 个人资料主体 */}
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
            {user.user_type === 'Student' ? '学生' : '教师'}
          </Text>
          
          {!editing && (
            <Paragraph style={{ maxWidth: '500px', margin: '0 auto 20px' }}>
              {user.profile_info || '用户暂未填写个人简介'}
            </Paragraph>
          )}
        </div>
        
        {/* 编辑表单 */}
        {editing ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdate}
            style={{ maxWidth: '500px', margin: '0 auto' }}
          >
            <Form.Item name="username" label="用户名">
              <Input disabled />
            </Form.Item>
            
            <Form.Item name="email" label="邮箱">
              <Input disabled />
            </Form.Item>
            
            <Form.Item name="user_type" label="用户类型">
              <Radio.Group disabled>
                <Radio value="Student">学生</Radio>
                <Radio value="Instructor">教师</Radio>
              </Radio.Group>
            </Form.Item>
            
            <Form.Item name="profile_info" label="个人简介">
              <TextArea rows={4} />
            </Form.Item>
            
            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button icon={<CloseOutlined />} onClick={() => setEditing(false)}>取消</Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>保存</Button>
              </div>
            </Form.Item>
          </Form>
        ) : (
          <>
            <Divider style={{ margin: '10px 0 30px' }} />
            
            {/* 用户详细信息 */}
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <Row gutter={[0, 20]} style={{ textAlign: 'left' }}>
                <Col span={24}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flex: '0 0 100px', fontWeight: 'bold' }}>用户名：</div>
                    <div>{user.username}</div>
                  </div>
                </Col>
                
                <Col span={24}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flex: '0 0 100px', fontWeight: 'bold' }}>姓名：</div>
                    <div>{user.first_name} {user.last_name}</div>
                  </div>
                </Col>
                
                <Col span={24}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flex: '0 0 100px', fontWeight: 'bold' }}>邮箱：</div>
                    <div>{user.email}</div>
                  </div>
                </Col>
                
                <Col span={24}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ flex: '0 0 100px', fontWeight: 'bold' }}>用户类型：</div>
                    <div>{user.user_type === 'Student' ? '学生' : '教师'}</div>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Display Enrollments if available (viewed by instructor) */}
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
      
      {/* 发送消息弹窗 */}
      <Modal
        title={`发送消息给 ${user.first_name} ${user.last_name}`}
        open={messageModal}
        onOk={handleSendMessage}
        onCancel={() => setMessageModal(false)}
        okText="发送"
        cancelText="取消"
      >
        <TextArea
          rows={4}
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="请输入消息内容..."
        />
      </Modal>
    </div>
  );
}
