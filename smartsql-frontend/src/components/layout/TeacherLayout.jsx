import React, { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  BookOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DatabaseOutlined, OrderedListOutlined
} from '@ant-design/icons';


const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;


const TeacherLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const teacherPrefix= '/teacher'

  const menuItems = [
    {
      key: `${teacherPrefix}/courses`,
      icon: <BookOutlined />,
      label: <Link to={`${teacherPrefix}/courses`}>Course Management</Link>,
    },
    {
      key: `${teacherPrefix}/modules`,
      icon: <OrderedListOutlined />,
      label: <Link to={`${teacherPrefix}/modules`}>Module Management</Link>,
    },
    {
      key: `${teacherPrefix}/sql-exercises`,
      icon: <DatabaseOutlined />,
      label: <Link to={`${teacherPrefix}/sql-exercises`}>Exercises Management</Link>,
    },
    {
      key: `${teacherPrefix}/students`,
      icon: <TeamOutlined />,
      label: <Link to={`${teacherPrefix}/students`}>Student Management</Link>,
    },
    {
      key: `${teacherPrefix}/grades`,
      icon: <BarChartOutlined />,
      label: <Link to={`${teacherPrefix}/grades`}>Grade Management</Link>,
    },
    {
      key: '/settings', //
      icon: <SettingOutlined />,
      label: <Link to="/settings">System Settings</Link>,
    },
  ];

  const handleMenuClick = ({ key }) => {
    switch (key) {
      case 'profile':
        navigate(`/profile/${localStorage.getItem('user_id')}`);
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        // logout logic here
        localStorage.clear();
        navigate('/login');
        break;
      default:
        break;
    }
  };

  const userMenuItems = {
    onClick: handleMenuClick,
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Account Settings',
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
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
            {collapsed ? 'SMS' : 'Management System'}
          </Title>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
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
          width: '100%'
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
                <Text>Mr. Smith</Text>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            minHeight: 280,
            borderRadius: 4
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default TeacherLayout;