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
import { useNavigate, useParams, Link } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title, Text, Paragraph } = Typography;

const ModuleExercises = () => {
  const [moduleInfo, setModuleInfo] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { courseId, moduleId } = useParams();

  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/student/courses/${courseId}/modules/${moduleId}/exercises/`);
        if (response.data.status === 'success') {
          setModuleInfo(response.data.data.module);
          setExercises(response.data.data.exercises);
        } else {
          message.error(response.data.message || 'Failed to fetch module data');
          setModuleInfo(null);
          setExercises([]);
        }
      } catch (error) {
        console.error('Error fetching module data:', error);
        message.error('Failed to load module data');
        setModuleInfo(null);
        setExercises([]);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && moduleId) {
       fetchModuleData();
    }
  }, [courseId, moduleId]);

  const getDifficultyTag = (difficulty) => {
    switch(String(difficulty).toLowerCase()) {
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
    if (!exercises || exercises.length === 0) return 0;
    const completedCount = exercises.filter(ex => ex.completed).length;
    return Math.round((completedCount / exercises.length) * 100);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 150px)' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!moduleInfo) {
    return (
      <div style={{ padding: '20px' }}>
        <Empty description="Module not found or failed to load." style={{ marginTop: 40 }} />
        <Button onClick={() => navigate(`/student/courses/${courseId}`)} style={{ marginTop: 16 }}>
          Back to Modules
        </Button>
      </div>
    );
  }

  const progress = calculateModuleProgress();

  return (
    <div style={{ padding: '20px' }}>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <Link to='/student/courses'>My Courses</Link> },
          { title: <Link to={`/student/courses/${courseId}`}>{moduleInfo.course_name || 'Course'}</Link> },
          { title: moduleInfo.module_name },
        ]}
      />

      <Card style={{ marginBottom: 20 }}>
        <Title level={3} style={{ marginBottom: 5 }}>{moduleInfo.module_name}</Title>
        <Paragraph type="secondary">{moduleInfo.module_description || 'No module description.'}</Paragraph>
        <div style={{ marginTop: 16 }}>
          <Text>Module Progress:</Text>
          <Progress
            percent={progress}
            status={progress === 100 ? 'success' : 'active'}
            format={percent => `${percent}%`}
            style={{ margin: '8px 0' }}
          />
          <Text type="secondary" style={{ display: 'block' }}>
            {exercises.filter(ex => ex.completed).length} of {exercises.length} exercises completed
          </Text>
        </div>
      </Card>

      <Title level={4} style={{ marginTop: 30 }}>Exercises</Title>
      {exercises.length === 0 ? (
        <Empty description="No exercises available in this module yet." style={{ marginTop: 40 }} />
      ) : (
        <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
          {exercises.map(exercise => (
            <Col xs={24} sm={12} md={8} key={exercise.exercise_id}>
              <Card
                hoverable
                onClick={() => navigate(`/student/courses/${courseId}/modules/${moduleId}/exercises/${exercise.exercise_id}`)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: '200px',
                  borderLeft: exercise.completed ? '4px solid #52c41a' : '4px solid transparent',
                }}
                bodyStyle={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}
              >
                <Card.Meta
                  style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                  title={
                    <div style={{ flexShrink: 0, marginBottom: 8 }}>
                      <Paragraph ellipsis={{ rows: 2, tooltip: exercise.title }} style={{ fontWeight: 'bold', minHeight: '44px' }}>
                        {exercise.title}
                      </Paragraph>
                    </div>
                  }
                  description={
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ flexShrink: 0, marginTop: 'auto' }}>
                        <Space wrap size={[4, 4]}>
                          {getDifficultyTag(exercise.difficulty)}
                          {getStatusTag(exercise.completed)}
                          {exercise.hint ? (
                            <Tooltip title={exercise.hint}>
                              <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
                            </Tooltip>
                          ) : null}
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