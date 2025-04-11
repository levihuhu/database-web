import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Table, 
  Typography, 
  Spin, 
  Select, 
  Tabs,
  Progress,
  Button,
  Divider,
  Empty,
  message,
  Tag,
} from 'antd';
import { 
  UserOutlined, 
  BookOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
} from 'recharts';
import apiClient from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    active_courses_count: 0,
    total_enrolled_students: 0,
    top_courses_summary: [],
    average_grade_completed: null,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/api/instructor/dashboard/');
        setDashboardData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.error || 'Failed to load dashboard data.');
        message.error(err.response?.data?.error || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const topCoursesColumns = [
    { title: 'Course Name', dataIndex: 'course_name', key: 'course_name', width: '30%' },
    { title: 'Code', dataIndex: 'course_code', key: 'course_code', width: '15%' },
    { title: 'Year', dataIndex: 'year', key: 'year', width: '10%', align: 'center'},
    { title: 'Term', dataIndex: 'term', key: 'term', width: '10%', align: 'center'},
    {
        title: 'State',
        dataIndex: 'state',
        key: 'state',
        width: '15%',
        align: 'center',
        render: (state) => {
            let color = 'default';
            if (state === 'active') color = 'processing';
            else if (state === 'completed') color = 'success';
            else if (state === 'archived' || state === 'discontinued') color = 'warning';
            return <Tag color={color}>{state}</Tag>;
        }
    },
    { title: 'Enrolled', dataIndex: 'enrolled_count', key: 'enrolled_count', width: '10%', align: 'right' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Title level={4}>Instructor Dashboard</Title>
        <Card>
          <Text type="danger">Error loading dashboard data: {error}</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard" style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4}>Instructor Dashboard</Title>
                <Text type="secondary">Overview of your courses and students.</Text>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Active Courses"
              value={dashboardData.active_courses_count}
              valueStyle={{ color: '#1890ff' }}
              prefix={<BookOutlined />}
            />
            <Text type="secondary">Currently running courses</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Total Enrolled Students"
              value={dashboardData.total_enrolled_students}
              valueStyle={{ color: '#52c41a' }}
              prefix={<TeamOutlined />}
            />
            <Text type="secondary">In your active courses</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={dashboardData.average_grade_completed ?? 'N/A'}
              precision={1}
              valueStyle={{ color: dashboardData.average_grade_completed ? '#3f8600' : '#8c8c8c' }}
              prefix={<BarChartOutlined />}
              suffix={dashboardData.average_grade_completed ? "pts" : ''}
            />
            <Text type="secondary">Across all your courses</Text>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Top 5 Active Courses by Enrollment">
            {dashboardData.top_courses_summary && dashboardData.top_courses_summary.length > 0 ? (
              <Table
                columns={topCoursesColumns}
                dataSource={dashboardData.top_courses_summary}
                rowKey="course_id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="No active course data available" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherDashboard;