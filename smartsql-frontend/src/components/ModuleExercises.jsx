import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  message,
  Breadcrumb,
  Empty,
  Spin,
  Button,
  Progress,
  Tooltip
} from 'antd';
import {
  DatabaseOutlined,
  BookOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  LockOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title, Text } = Typography;

const ModuleExercises = () => {
  const [module, setModule] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { courseId, moduleId } = useParams();

  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/student/courses/${courseId}/modules/${moduleId}/exercises/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access')}`
          }
        });
        if (response.data.status === 'success') {
          setModule(response.data.data.module);
          setExercises(response.data.data.exercises);
        } else {
          message.error('Failed to fetch module data');
        }
      } catch (error) {
        console.error('Error fetching module data:', error);
        message.error('Failed to load module data');
      } finally {
        setLoading(false);
      }
    };

    fetchModuleData();
  }, [courseId, moduleId]);

  const getDifficultyTag = (difficulty) => {
    switch(difficulty.toLowerCase()) {
      case 'easy':
        return <Tag color="green">Easy</Tag>;
      case 'medium':
        return <Tag color="orange">Medium</Tag>;
      case 'hard':
        return <Tag color="red">Hard</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  const getStatusTag = (completed) => {
    return completed ? (
        <Tag color="success" icon={<CheckCircleOutlined />}>Completed</Tag>
    ) : (
        <Tag color="default">Incomplete</Tag>
    );
  };

  const calculateModuleProgress = () => {
    if (!exercises.length) return 0;
    const completedCount = exercises.filter(ex => ex.completed).length;
    return Math.round((completedCount / exercises.length) * 100);
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

  if (!module) {
    return (
        <Empty
            description="Module not found"
            style={{ marginTop: 40 }}
        />
    );
  }

  const progress = calculateModuleProgress();

  return (
      <div style={{ padding: '20px' }}>
        <Breadcrumb
            items={[
              {
                title: <HomeOutlined />,
                onClick: () => navigate('/student'),
              },
              {
                title: module.course_name,
                onClick: () => navigate(`/student/course/${courseId}`),
              },
              {
                title: module.module_name,
              }
            ]}
            style={{ marginBottom: 20 }}
        />

        <Card style={{ marginBottom: 20 }}>
          <Title level={3}>{module.module_name}</Title>
          <Text type="secondary">{module.course_code}</Text>
          <div style={{ marginTop: 8 }}>
            <Text>{module.module_description}</Text>
          </div>
          <div style={{ marginTop: 16 }}>
            <Progress
                percent={progress}
                status={progress === 100 ? 'success' : 'active'}
                format={percent => `${percent}%`}
            />
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              {exercises.filter(ex => ex.completed).length} of {exercises.length} exercises completed
            </Text>
          </div>
        </Card>

        <Title level={4}>Exercise List</Title>
        <Text type="secondary">Select an exercise to begin</Text>

        {exercises.length === 0 ? (
            <Empty
                description="No exercises available"
                style={{ marginTop: 40 }}
            />
        ) : (
            <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
              {exercises.map(exercise => (
                  <Col span={8} key={exercise.exercise_id}>
                    <Card
                        hoverable
                        onClick={() => navigate(`/student/courses/${courseId}/modules/${moduleId}/exercises/${exercise.exercise_id}`)}
                        style={{
                          cursor: 'pointer',
                          border: exercise.completed ? '1px solid #52c41a' : '1px solid #d9d9d9'
                        }}
                    >
                      <Card.Meta
                          title={
                            <Space>
                              <span>{exercise.title}</span>
                              {exercise.completed && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            </Space>
                          }
                          description={
                            <div>
                              <Text>{exercise.description}</Text>
                              <div style={{ marginTop: 16 }}>
                                <Space>
                                  {getDifficultyTag(exercise.difficulty)}
                                  {getStatusTag(exercise.completed)}
                                  {exercise.hint && (
                                      <Tooltip title={exercise.hint}>
                                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                                      </Tooltip>
                                  )}
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

export default ModuleExercises;