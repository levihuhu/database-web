import React, { useState } from 'react';
import { Form, Input, Button, Select, Card, Typography, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title, Text } = Typography;

const SignUp = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Ensure user_type is always 'Student' for this form
            const payload = { ...values, user_type: 'Student' };
            console.log('Signup Payload:', payload);
            const response = await apiClient.post('/api/signup/', payload);

            if (response.data.status === 'success') {
                message.success(response.data.message || '注册成功！现在您可以登录了。');
                navigate('/login'); // Redirect to login page after successful signup
            } else {
                // Handle specific field errors returned from backend
                if (response.data.errors) {
                    const errorFields = Object.keys(response.data.errors).map(key => ({
                        name: key,
                        errors: [response.data.errors[key]]
                    }));
                    form.setFields(errorFields);
                    message.error('请修正表单中的错误。');
                } else {
                    message.error(response.data.message || '注册失败，请稍后重试。');
                }
            }
        } catch (error) {
            console.error('Signup failed:', error);
            message.error(error.response?.data?.message || '注册过程中发生错误。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Col xs={22} sm={16} md={12} lg={8} xl={6}>
                <Card title={<Title level={3} style={{ textAlign: 'center', marginBottom: 0 }}>创建 SmartSQL 账户</Title>} bordered={false}>
                    <Form
                        form={form}
                        name="signup"
                        onFinish={onFinish}
                        layout="vertical"
                        requiredMark={false}
                    >
                        <Form.Item
                            name="username"
                            rules={[
                                { required: true, message: '请输入用户名!' },
                                { min: 8, message: '用户名至少需要8位!' },
                                { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户名只能包含字母、数字、下划线或连字符!' }
                            ]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="用户名 (至少8位, 字母/数字/-/_)" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: '请输入邮箱!' },
                                { type: 'email', message: '请输入有效的邮箱地址!' }
                            ]}
                        >
                            <Input prefix={<MailOutlined />} placeholder="邮箱" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: '请输入密码!' },
                                { min: 8, message: '密码至少需要8位!' }
                            ]}
                            hasFeedback
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="密码 (至少8位)" />
                        </Form.Item>

                        <Form.Item
                            name="confirm"
                            dependencies={['password']}
                            hasFeedback
                            rules={[
                                { required: true, message: '请确认您的密码!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('两次输入的密码不匹配!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
                        </Form.Item>

                        <Form.Item
                            name="first_name"
                            rules={[{ required: true, message: '请输入名字!' }]}
                        >
                            <Input prefix={<IdcardOutlined />} placeholder="名字 (First Name)" />
                        </Form.Item>

                        <Form.Item
                            name="last_name"
                            rules={[{ required: true, message: '请输入姓氏!' }]}
                        >
                            <Input prefix={<IdcardOutlined />} placeholder="姓氏 (Last Name)" />
                        </Form.Item>

                        {/* User Type is fixed to Student, so no input needed */}

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block>
                                注册
                            </Button>
                        </Form.Item>
                        <div style={{ textAlign: 'center' }}>
                            <Text>已有账户? </Text><Link to="/login">立即登录</Link>
                        </div>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};

export default SignUp;
 