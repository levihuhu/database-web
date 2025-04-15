import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Progress,
  Tag,
  Button,
  Space,
  message,
  Popconfirm,
  Empty,
  Divider,
  Spin
} from 'antd';
import {
  DatabaseOutlined,
  BookOutlined,
  TrophyOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title, Text, Paragraph } = Typography;

const StudentCourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/student/courses/');
      if (response.data.status === 'success') {
        setCourses(response.data.data);
      } else {
        message.error('Failed to fetch course data');
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      message.error('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const getTermText = (term) => {
    switch(term) {
      case 1: return 'Spring';
      case 2: return 'Summer';
      case 3: return 'Fall';
      default: return 'Unknown Term';
    }
  };

  const getStateTag = (state) => {
    switch(state) {
      case 'active':
        return <Tag color="green">Active</Tag>;
      case 'complete':
        return <Tag color="blue">Completed</Tag>;
      case 'discontinued':
        return <Tag color="red">Discontinued</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 150px)' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Title level={2} style={{ marginBottom: 0 }}>My Courses</Title>
        <Button 
          type="primary" 
          icon={<SearchOutlined />}
          onClick={() => navigate('/student/browse-courses')}
        >
          Browse All Courses
        </Button>
      </div>
      <Text type="secondary">Your enrolled courses</Text>

      {courses.length === 0 ? (
        <Empty
          description="You are not enrolled in any courses yet."
          style={{ marginTop: 60 }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {courses.map(course => (
            <Col xs={24} sm={12} md={8} key={course.course_id}>
              <Card
                hoverable
                onClick={() => navigate(`/student/courses/${course.course_id}`)}
                style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '380px' }}
                bodyStyle={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ padding: '10px', background: '#f0f2f5', textAlign: 'center', marginBottom: '16px', flexShrink: 0 }}>
                  <DatabaseOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                </div>
                <Card.Meta
                  style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                  title={
                    <div style={{ marginBottom: 8, flexShrink: 0 }}>
                      <Paragraph ellipsis={{ rows: 2, tooltip: course.course_name }} style={{ marginBottom: 4, fontWeight: 'bold', minHeight: '44px' }}>
                        {course.course_name}
                      </Paragraph>
                      <Space wrap size={[4, 4]}>
                        <Tag color="blue">{course.course_code}</Tag>
                        <Tag color="green">Enrolled</Tag>
                      </Space>
                    </div>
                  }
                  description={
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Paragraph ellipsis={{ rows: 3, tooltip: course.course_description || 'No description available' }} style={{ marginBottom: 'auto', minHeight: '66px' }}>
                        {course.course_description || 'No description available'}
                      </Paragraph>
                      <div style={{ flexShrink: 0 }}>
                        <Divider style={{ margin: '8px 0' }} />
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <div>
                            <Text type="secondary"><BookOutlined /> {course.year} {getTermText(course.term)}</Text>
                          </div>
                          <div>
                            <Space wrap size={[8, 4]}>
                              <Text type="secondary">Modules: {course.total_modules ?? 0}</Text>
                              <Text type="secondary">Exercises: {course.total_exercises ?? 0}</Text>
                            </Space>
                          </div>
                        </Space>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default StudentCourseList;