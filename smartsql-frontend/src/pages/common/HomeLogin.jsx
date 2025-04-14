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
  Modal,
  Row,
  Col,
} from 'antd';
import { handleError } from "../../services/utils.js";
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const isProduction = import.meta.env.MODE === 'production';


export default function HomeLogin() {
  const [loading, setLoading] = useState(false);
  const [form]  = Form.useForm();
  const { login } = useAuth();

  
  console.log("✅ 当前环境变量:", import.meta.env.MODE);
  console.log("✅ 当前环境变量:", import.meta.env.VITE_API_BASE_URL);

  const handleLogin = async (values) => {
    const { identifier, password, role } = values;
    console.log("handleLogin triggered, values:", values);
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier, password, role })
      });

      const result = await res.json();

      if (res.ok && result.status === 'success') {
        console.log("✅ Login API Success. Calling context login...");
        login(result.data);
      } else {
        message.error(result.message || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error(handleError(error));
    } finally {
      setLoading(false);
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
                  src="./student-illustration.png"
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
              <Form layout="vertical" form={form} onFinish={handleLogin}>
                <Form.Item name="role" initialValue="instructor" style={{ textAlign: 'center' }}>
                  <Radio.Group buttonStyle="solid">
                    <Radio.Button value="instructor">Instructor</Radio.Button>
                    <Radio.Button value="student">Student</Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  label="User ID / Email"
                  name="identifier"
                  rules={[{ required: true, message: 'Please enter your identifier' }]}
                >
                  <Input placeholder="Enter your username or email" />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: 'Please enter your password' }]}
                >
                  <Input.Password placeholder="Enter your password" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>
                    Login
                  </Button>
                </Form.Item>
              </Form>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Text type="secondary">Don't have an account? </Text>
                <Link to="/signup">Sign up</Link>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
}
