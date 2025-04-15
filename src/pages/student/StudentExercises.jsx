import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  message,
  Spin,
  Empty,
  Select,
  Table,
  Divider,
  Input,
  Badge
} from 'antd';
import {
  DatabaseOutlined,
  BookOutlined,
  SearchOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const StudentExercises = () => {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState(null);
  const navigate = useNavigate();

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const params = {};
      if (difficultyFilter) {
        params.difficulty = difficultyFilter;
      }
      
      const response = await apiClient.get('/api/student/exercises/', { params });
      if (response.data.status === 'success') {
        setExercises(response.data.data);
        setFilteredExercises(response.data.data);
      } else {
        message.error('Failed to fetch exercise data');
      }
    } catch (error) {
      console.error('Error fetching exercise list:', error);
      message.error('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [difficultyFilter]);

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredExercises(exercises);
      return;
    }
    
    const filtered = exercises.filter(exercise => 
      exercise.title.toLowerCase().includes(value.toLowerCase()) || 
      exercise.description.toLowerCase().includes(value.toLowerCase()) ||
      exercise.course_name.toLowerCase().includes(value.toLowerCase()) ||
      exercise.course_code.toLowerCase().includes(value.toLowerCase()) ||
      exercise.module_name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredExercises(filtered);
  };

  const handleDifficultyChange = (value) => {
    setDifficultyFilter(value);
  };

  const getDifficultyTag = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return <Tag color="success">Easy</Tag>;
      case 'Medium':
        return <Tag color="warning">Medium</Tag>;
      case 'Hard':
        return <Tag color="error">Hard</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  const columns = [
    {
      title: 'Exercise Name',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          {text}
          {record.completed ? 
            <Badge status="success" /> : 
            <Badge status="default" />
          }
        </Space>
      ),
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: difficulty => getDifficultyTag(difficulty),
      filters: [
        { text: 'Easy', value: 'Easy' },
        { text: 'Medium', value: 'Medium' },
        { text: 'Hard', value: 'Hard' },
      ],
      onFilter: (value, record) => record.difficulty === value,
    },
    {
      title: 'Course',
      dataIndex: 'course_name',
      key: 'course_name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text>{text}</Text>
          <Text type="secondary">{record.course_code}</Text>
        </Space>
      ),
    },
    {
      title: 'Module',
      dataIndex: 'module_name',
      key: 'module_name',
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        if (!record.completed) {
          return <Tag>Not Completed</Tag>;
        }
        return record.is_correct ? 
          <Tag icon={<CheckCircleOutlined />} color="success">Correct</Tag> : 
          <Tag icon={<CloseCircleOutlined />} color="error">Incorrect</Tag>;
      },
      filters: [
        { text: 'Not Completed', value: 'incomplete' },
        { text: 'Correct', value: 'correct' },
        { text: 'Incorrect', value: 'incorrect' },
      ],
      onFilter: (value, record) => {
        if (value === 'incomplete') return !record.completed;
        if (value === 'correct') return record.completed && record.is_correct;
        if (value === 'incorrect') return record.completed && !record.is_correct;
        return true;
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<RightOutlined />}
          onClick={() => navigate(`/student/courses/${record.course_id}/modules/${record.module_id}/exercises/${record.exercise_id}`)}
        >
          Open
        </Button>
      ),
    },
  ];

  if (loading && exercises.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={2}>All SQL Exercises</Title>
        <Paragraph>Browse all SQL exercises from your enrolled courses</Paragraph>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={16}>
            <Search
              placeholder="Search exercise name"
              allowClear
              enterButton={<><SearchOutlined /> Search</>}
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </Col>
          <Col span={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by difficulty"
              allowClear
              onChange={handleDifficultyChange}
            >
              <Option value="Easy">Easy</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Hard">Hard</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {filteredExercises.length === 0 ? (
        <Empty description="No exercises found" />
      ) : (
        <Table 
          columns={columns} 
          dataSource={filteredExercises} 
          rowKey="exercise_id"
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Total ${total} exercises`
          }}
        />
      )}
    </div>
  );
};

export default StudentExercises; 