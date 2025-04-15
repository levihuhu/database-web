import React, { useState } from 'react';
import { Form, Input, Button, Select, Card, Typography, message, Row, Col, Radio } from 'antd';
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
                setLoading(false);
                message.success(response.data.message || 'Registration successful! You can now log in.');
                form.resetFields();
                navigate('/login'); // Redirect to login page after successful signup
            } else {
                // Handle specific field errors returned from backend
                if (response.data.errors) {
                    const errorFields = Object.keys(response.data.errors).map(key => ({
                        name: key,
                        errors: [response.data.errors[key]]
                    }));
                    form.setFields(errorFields);
                    message.error('Please correct the errors in the form.');
                } else {
                    message.error(response.data.message || 'Registration failed. Please try again later.');
                }
            }
        } catch (error) {
            console.error('Signup failed:', error);
            message.error(error.response?.data?.message || 'An error occurred during registration.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUpFailure = (error) => {
        setLoading(false);
        if (error.response && error.response.data) {
            // Handle specific error messages from the backend
            const errors = error.response.data;
            let errorMessage = 'Registration failed. Please try again later.'; // Default message
            if (typeof errors === 'object' && errors !== null) {
                // Extract specific field errors if available
                const fieldErrors = Object.keys(errors).map(key => `${key}: ${errors[key].join(', ')}`).join('\n');
                if (fieldErrors) {
                    errorMessage = fieldErrors; 
                } else if (errors.detail) {
                    errorMessage = errors.detail; // Use general detail error if present
                }
            }
            message.error(errorMessage);
        } else {
            // Handle network errors or other unexpected issues
            message.error(error.message || 'An error occurred during registration.');
        }
    };

    return (
        <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Col xs={22} sm={16} md={12} lg={8} xl={6}>
                <Card title={<Title level={3} style={{ textAlign: 'center', marginBottom: 0 }}>Create SmartSQL Account</Title>} bordered={false}>
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
                                { required: true, message: 'Please input your username!' },
                                { min: 8, message: 'Username must be at least 8 characters long!' },
                                { pattern: /^[a-zA-Z0-9_-]+$/, message: 'Username can only contain letters, numbers, underscores, or hyphens!' }
                            ]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Username (min 8 chars, letters/numbers/_-)" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Please input your email!' },
                                { type: 'email', message: 'The input is not a valid email address!' }
                            ]}
                        >
                            <Input prefix={<MailOutlined />} placeholder="Email" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: 'Please input your password!' },
                                { min: 8, message: 'Password must be at least 8 characters long!' }
                            ]}
                            hasFeedback
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Password (min 8 chars)" />
                        </Form.Item>

                        <Form.Item
                            name="confirm"
                            dependencies={['password']}
                            hasFeedback
                            rules={[
                                { required: true, message: 'Please confirm your password!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
                        </Form.Item>

                        <Form.Item
                            name="first_name"
                            rules={[{ required: true, message: 'Please input your first name!' }]}
                        >
                            <Input prefix={<IdcardOutlined />} placeholder="First Name" />
                        </Form.Item>

                        <Form.Item
                            name="last_name"
                            rules={[{ required: true, message: 'Please input your last name!' }]}
                        >
                            <Input prefix={<IdcardOutlined />} placeholder="Last Name" />
                        </Form.Item>

                        <Form.Item
                            name="user_type"
                            rules={[{ required: true, message: 'Please select your role!' }]}
                        >
                            <Radio.Group>
                                <Radio value="student">Student</Radio>
                                <Radio value="instructor">Instructor</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block>
                                Create Account
                            </Button>
                        </Form.Item>
                        <div style={{ textAlign: 'center' }}>
                            Already have an account? <Link to="/login">Log in here</Link>
                        </div>
                    </Form>
                </Card>
            </Col>
        </Row>
    );
};

export default SignUp;
 