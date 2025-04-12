import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography } from 'antd';
import { 
  UserOutlined, 
  MessageOutlined, 
  BookOutlined,
  DatabaseOutlined,
  CodeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const StudentLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(['/student']);
  const location = useLocation();
  const navigate = useNavigate();

  // Update selected menu item based on current path
  useEffect(() => {
    const pathname = location.pathname;
    
    // Find the most specific matching menu item
    const menuPaths = [
      '/student/courses',
      '/student/browse-courses',
      '/student/exercises',
      '/student/sql',
      '/student/ai-chat',
      '/student/messages',
      '/student'
    ];
    
    // Sort by specificity (length) to match the most specific path first
    const matchedPath = menuPaths
      .sort((a, b) => b.length - a.length)
      .find(path => pathname.startsWith(path));
    
    if (matchedPath) {
      setSelectedKeys([matchedPath]);
    }
  }, [location.pathname]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login');
  };

  // Menu items
  const menuItems = [
    {
      key: '/student',
      icon: <DashboardOutlined />,
      label: <Link to="/student">Dashboard</Link>,
    },
    {
      key: '/student/courses',
      icon: <BookOutlined />,
      label: <Link to="/student/courses">My Courses</Link>,
    },
    {
      key: '/student/browse-courses',
      icon: <BookOutlined />,
      label: <Link to="/student/browse-courses">Browse Courses</Link>,
    },
    {
      key: '/student/exercises',
      icon: <DatabaseOutlined />,
      label: <Link to="/student/exercises">Exercises</Link>,
    },
    {
      key: '/student/sql',
      icon: <CodeOutlined />,
      label: <Link to="/student/sql">Dynamic Query</Link>,
    },
    {
      key: '/student/ai-chat',
      icon: <MessageOutlined />,
      label: <Link to="/student/ai-chat">AI Assistant</Link>,
    },
    {
      key: '/student/messages',
      icon: <MessageOutlined />,
      label: <Link to="/student/messages">Messages</Link>,
    }
  ];

  // User menu items
  const userMenuItems = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
        onClick: () => navigate('/profile')
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: handleLogout
      },
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        theme="light"
        width={200}
        style={{ 
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0
        }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            {collapsed ? 'SQL' : 'SmartSQL Learning'}
          </Title>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultSelectedKeys={['/student']}
          items={menuItems}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{ 
          padding: 0, 
          background: '#fff', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 1,
          width: '100%',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <div style={{ paddingLeft: 16 }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: '18px' }
            })}
          </div>
          <div style={{ paddingRight: 24 }}>
            <Dropdown menu={userMenuItems} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <Text>{localStorage.getItem('username')}</Text>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            borderRadius: 4,
            background: '#fff',
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;