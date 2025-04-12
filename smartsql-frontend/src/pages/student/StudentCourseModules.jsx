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
  Breadcrumb,
  Empty,
  Spin
} from 'antd';
import {
  DatabaseOutlined,
  BookOutlined,
  LockOutlined,
  HomeOutlined,
  TrophyOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title, Text } = Typography;

const StudentCourseModules = () => {
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { courseId } = useParams();

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/student/courses/${courseId}/modules/`);
        if (response.data.status === 'success') {
          setCourse(response.data.data.course);
          setModules(response.data.data.modules);
        } else {
          message.error('Failed to fetch course data');
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        message.error('Error loading course data');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const getTermText = (term) => {
    switch(term) {
      case 1: return 'Spring';
      case 2: return 'Summer';
      case 3: return 'Fall';
      default: return 'Unknown Term';
    }
  };

  const getModuleProgress = (module) => {
    if (module.completed_exercises === undefined || module.total_exercises === undefined) {
      return 0;
    }
    return Math.round((module.completed_exercises / module.total_exercises) * 100);
  };

  if (loading) {
    return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <Spin size="large" />
        </div>
    );
  }

  if (!course) {
    return (
        <Empty
            description="Course not found"
            style={{ marginTop: 40 }}
        />
    );
  }

  return (
      <div style={{ padding: '20px' }}>
        <Breadcrumb
            items={[
              {
                title: <HomeOutlined />,
                onClick: () => navigate('/student'),
              },
              {
                title: course.course_name,
              }
            ]}
            style={{ marginBottom: 20 }}
        />

        <Card style={{ marginBottom: 20 }}>
          <Title level={3}>{course.course_name}</Title>
          <Text type="secondary">{course.course_code}</Text>
          <div style={{ marginTop: 8 }}>
            <Text>{course.course_description}</Text>
          </div>
          <div style={{ marginTop: 16 }}>
            <Space>
              <Tag icon={<BookOutlined />}>
                {course.year} {getTermText(course.term)}
              </Tag>
              {course.total_score !== null && (
                  <Tag icon={<TrophyOutlined />}>
                    Score: {course.total_score}
                  </Tag>
              )}
              {course.rank !== null && (
                  <Tag icon={<TeamOutlined />}>
                    Rank: {course.rank}
                  </Tag>
              )}
            </Space>
          </div>
        </Card>

        <Title level={4}>SQL Bootcamp</Title>
        <Text type="secondary">Select a module to start learning</Text>

        {modules.length === 0 ? (
            <Empty
                description="No modules available"
                style={{ marginTop: 40 }}
            />
        ) : (
            <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
              {modules.map(module => (
                  <Col span={8} key={module.module_id}>
                    <Card
                        hoverable={!module.locked}
                        onClick={() => !module.locked && navigate(`/student/courses/${courseId}/modules/${module.module_id}`)}
                        style={{
                          opacity: module.locked ? 0.7 : 1,
                          cursor: module.locked ? 'not-allowed' : 'pointer'
                        }}
                    >
                      <Card.Meta
                          title={
                            <Space>
                              <span>{module.module_name}</span>
                              {module.locked && <LockOutlined />}
                            </Space>
                          }
                          description={
                            <div>
                              <Text>{module.module_description}</Text>
                              <div style={{ marginTop: 16 }}>
                                <Progress
                                    percent={getModuleProgress(module)}
                                    status={getModuleProgress(module) === 100 ? "success" : "active"}
                                    format={percent => `${module.completed_exercises || 0}/${module.total_exercises || 0}`}
                                />
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

export default StudentCourseModules;