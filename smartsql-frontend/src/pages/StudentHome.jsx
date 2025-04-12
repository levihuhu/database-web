import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
  BookOutlined,
  DatabaseOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const StudentHome = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: 'courses',
      icon: <BookOutlined />,
      label: 'My Courses',
      onClick: () => navigate('/student')
    },
    {
      key: 'sql',
      icon: <DatabaseOutlined />,
      label: 'Dynamic Query',
      onClick: () => navigate('/student/sql')
    },
    {
      key: 'ai-chat',
      icon: <MessageOutlined />,
      label: 'AI Assistant',
      onClick: () => navigate('/student/ai-chat')
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile')
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Log Out',
      onClick: () => {
        localStorage.removeItem('access');
        navigate('/login');
      }
    }
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/student/course')) return 'courses';
    if (path.startsWith('/student/sql')) return 'sql';
    if (path.startsWith('/student/messages')) return 'messages';
    if (path.startsWith('/student/profile')) return 'profile';
    return 'courses';
  };

  return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{
          background: '#fff',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Title level={3} style={{ margin: 0 }}>SmartSQL</Title>
        </Header>
        <Layout>
          <Sider width={200} style={{ background: '#fff' }}>
            <Menu
                mode="inline"
                selectedKeys={[getSelectedKey()]}
                style={{ height: '100%', borderRight: 0 }}
                items={menuItems}
            />
          </Sider>
          <Layout style={{ padding: '24px' }}>
            <Content style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
              borderRadius: '8px'
            }}>
              <Outlet />
            </Content>
          </Layout>
        </Layout>
      </Layout>
  );
};

export default StudentHome;