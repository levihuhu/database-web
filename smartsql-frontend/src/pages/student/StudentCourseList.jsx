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
  Empty
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

const { Title, Text } = Typography;

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
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      message.error('Failed to load courses');
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
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <LoadingOutlined style={{ fontSize: 48 }} />
        </div>
    );
  }

  return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Title level={2}>My Courses</Title>
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
                description="No courses enrolled yet"
                style={{ marginTop: 40 }}
            />
        ) : (
            <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
              {courses.map(course => (
                  <Col span={8} key={course.course_id}>
                    <Card
                        hoverable
                        onClick={() => navigate(`/student/courses/${course.course_id}`)}
                        cover={
                          <div style={{
                            padding: '20px',
                            background: '#f0f2f5',
                            textAlign: 'center'
                          }}>
                            <DatabaseOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                          </div>
                        }
                    >
                      <Card.Meta
                          title={
                            <>
                              <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                                {course.course_name}
                              </div>
                              <div style={{ marginTop: 4 }}>
                                {getStateTag(course.state)}
                              </div>
                            </>
                          }
                          description={
                            <div>
                              <Text type="secondary">{course.course_code}</Text>
                              <div style={{ marginTop: 8 }}>
                                <Text>{course.course_description}</Text>
                              </div>
                              {course.instructor_id && course.instructor_name && (
                                <div style={{ marginTop: 8 }}>
                                  <Text type="secondary">
                                    Instructor: 
                                    <a onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/profile/?user_id=${course.instructor_id}`);
                                    }}>
                                      {course.instructor_name}
                                    </a>
                                  </Text>
                                </div>
                              )}
                              <div style={{ marginTop: 16 }}>
                                <Space>
                                  <Tag icon={<BookOutlined />}>
                                    {course.year} {getTermText(course.term)}
                                  </Tag>
                                </Space>
                              </div>
                              <div style={{ marginTop: 16 }}>
                                <Space>
                                  <Text type="secondary">Modules: {course.total_modules}</Text>
                                  <Text type="secondary">Exercises: {course.total_exercises}</Text>
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