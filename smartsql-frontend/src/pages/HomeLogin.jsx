import React, { useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Form,
  Input,
  Radio,
  Checkbox,
  message,
  Row,
  Col
} from 'antd';

const { Title, Text } = Typography;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function HomeLogin() {
  const [role, setRole] = useState('instructor');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const res = await fetch(`${BASE_URL}/api/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ identifier, password, role })
    });

    setLoading(false);

    if (res.ok) {
      message.success('Login successful!');
      window.location.href = '/dashboard';
    } else {
      const result = await res.json();
      message.error(result.message || 'Login failed!');
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Col xs={22} sm={20} md={16} lg={12} xl={10} style={{ maxWidth: '960px', width: '100%' }}>
        <Card bordered={false} style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <Row gutter={0}>
            {/* Left Side */}
            <Col span={12} style={{ backgroundColor: '#949eff', color: 'white', padding: '2rem', borderRadius: '16px 16px 16px 16px'}}>
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ color: 'white', marginBottom: '-1.5rem' }}>
                  The Smart Way to
                </Title>
                <Title level={3} style={{ color: 'white', marginBottom: '0.5rem' }}>
                  Learn SQL With AI 💡
                </Title>
                <Text style={{ color: '#cbd5e1' }}>Practice, Get Hints, Learn Fast</Text>
                <img
                  src="/student-illustration.png"
                  alt="Illustration"
                  style={{ width: '80%', marginTop: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}
                />
              </div>
            </Col>

            {/* Right Side: Login Form */}
            <Col span={12} style={{ padding: '2rem' }}>
              <Title level={4} style={{ textAlign: 'center', marginBottom: '2rem' }}>
                Login to SmartSQL
              </Title>

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <Radio.Group
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value="instructor">Instructor</Radio.Button>
                  <Radio.Button value="student">Student</Radio.Button>
                </Radio.Group>
              </div>

              <Form layout="vertical" onFinish={handleLogin}>
                <Form.Item
                  label="User ID / Email"
                  name="identifier"
                  rules={[{ required: true, message: 'Please enter your identifier' }]}
                >
                  <Input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your username or email"
                  />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: 'Please enter your password' }]}
                >
                  <Input.Password
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </Form.Item>

                <Form.Item>
                  <Checkbox>Remember me</Checkbox>
                  <a style={{ float: 'right' }} href="#">Forgot password?</a>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    Login
                  </Button>
                </Form.Item>
              </Form>

              <Text type="secondary" style={{ fontSize: '12px', display: 'block', textAlign: 'center' }}>
                Don’t have an account? <a href="/signup/">Sign up</a>
              </Text>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
}
