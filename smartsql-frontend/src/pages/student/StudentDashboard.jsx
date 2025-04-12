import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Statistic, Progress, Table, Tag, Spin, List, Space, Empty } from 'antd';
import { 
  BookOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  FireOutlined,
  TrophyOutlined,
  DatabaseOutlined,
  LoadingOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title, Text } = Typography;

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('fetching dashboard data')
        const response = await apiClient.get('/api/student/dashboard/');
        if (response.data.status === 'success') {
          setDashboardData(response.data.data);
        } else {
          console.error('Failed to fetch dashboard data:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getTermText = (term) => {
    switch (term) {
      case 1: return 'Spring';
      case 2: return 'Summer';
      case 3: return 'Fall';
      default: return 'Unknown Term';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  if (!dashboardData) {
    return <Empty description="Unable to load dashboard data" />;
  }

  const { user, course_stats, exercise_stats, recent_courses, recent_exercises } = dashboardData;

  return (
    <div style={{ padding: '20px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Title level={2}>Welcome back, {user.first_name || user.username}!</Title>
          <Text type="secondary">View your learning progress and recent activities</Text>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Enrolled Courses"
              value={course_stats.total_courses}
              prefix={<BookOutlined />}
              suffix={<Text type="secondary" style={{ fontSize: '14px' }}>courses</Text>}
            />
            <div style={{ marginTop: 16 }}>
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Statistic 
                    title="Active Courses" 
                    value={course_stats.active_courses} 
                    valueStyle={{ fontSize: '18px' }} 
                    prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />} 
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="Completed Courses" 
                    value={course_stats.completed_courses} 
                    valueStyle={{ fontSize: '18px' }} 
                    prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />} 
                  />
                </Col>
              </Row>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total SQL Exercises"
              value={exercise_stats.total_exercises}
              prefix={<DatabaseOutlined />}
              suffix={<Text type="secondary" style={{ fontSize: '14px' }}>exercises</Text>}
            />
            <div style={{ marginTop: 16 }}>
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Statistic 
                    title="Attempted" 
                    value={exercise_stats.attempted_exercises} 
                    valueStyle={{ fontSize: '18px' }} 
                    prefix={<FireOutlined style={{ color: '#fa8c16' }} />} 
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="Correct" 
                    value={exercise_stats.correct_exercises} 
                    valueStyle={{ fontSize: '18px' }} 
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} 
                  />
                </Col>
              </Row>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={exercise_stats.completion_rate}
              precision={1}
              valueStyle={{ color: '#3f8600' }}
              prefix={<TrophyOutlined />}
              suffix="%"
            />
            <Progress 
              percent={exercise_stats.completion_rate} 
              status="active" 
              strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} 
              style={{ marginTop: 16 }} 
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Accuracy Rate: {exercise_stats.accuracy_rate}%</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24} md={12}>
          <Card 
            title={<Title level={4}>Recent Courses</Title>} 
            extra={<a onClick={() => navigate('/student/courses')}>View All</a>}
          >
            {recent_courses.length === 0 ? (
              <Empty description="No courses enrolled yet" />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={recent_courses}
                renderItem={(item) => (
                  <List.Item 
                    onClick={() => navigate(`/student/courses/${item.course_id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <List.Item.Meta
                      avatar={<BookOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
                      title={
                        <Space>
                          <Text strong>{item.course_name}</Text>
                          <Tag color={item.state === 'active' ? 'green' : 'blue'}>
                            {item.state === 'active' ? 'Active' : 'Completed'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>
                            <Text type="secondary">{item.course_code} · {item.year} {getTermText(item.term)}</Text>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <Progress 
                              percent={item.progress} 
                              size="small" 
                              status={item.progress === 100 ? "success" : "active"} 
                              format={percent => `${percent.toFixed(0)}%`}
                            />
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <Space>
                              <Text type="secondary">Modules: {item.module_count}</Text>
                              <Text type="secondary">Exercises: {item.exercise_count}</Text>
                              {item.score > 0 && <Text type="secondary">Score: {item.score}</Text>}
                            </Space>
                          </div>
                        </div>
                      }
                    />
                    <RightOutlined />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col span={24} md={12}>
          <Card 
            title={<Title level={4}>Recent Exercises</Title>} 
            extra={<a onClick={() => navigate('/student/exercises')}>View All</a>}
          >
            {recent_exercises.length === 0 ? (
              <Empty description="No exercises completed yet" />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={recent_exercises}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => navigate(`/student/courses/${item.course_id}/modules/${item.module_id}/exercises/${item.exercise_id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <List.Item.Meta
                      avatar={<DatabaseOutlined style={{ fontSize: 32, color: '#722ed1' }} />}
                      title={
                        <Space>
                          <Text strong>{item.title}</Text>
                          <Tag color={getDifficultyColor(item.difficulty)}>
                            {item.difficulty}
                          </Tag>
                          <Tag color={item.is_correct ? '#52c41a' : '#f5222d'}>
                            {item.is_correct ? 'Correct' : 'Incorrect'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>
                            <Text type="secondary">Course: {item.course_name} · Module: {item.module_name}</Text>
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary">
                              <ClockCircleOutlined /> {new Date(item.completed_at).toLocaleString('en-US', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit' 
                              })}
                            </Text>
                          </div>
                        </div>
                      }
                    />
                    <RightOutlined />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDashboard; 