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
  Input,
  Divider
} from 'antd';
import {
  DatabaseOutlined,
  BookOutlined,
  SearchOutlined,
  PlusOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const BrowseCourses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/student/browse-courses/');
      if (response.data.status === 'success') {
        setCourses(response.data.data);
        setFilteredCourses(response.data.data);
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

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredCourses(courses);
      return;
    }
    
    const filtered = courses.filter(course => 
      course.course_name.toLowerCase().includes(value.toLowerCase()) || 
      course.course_code.toLowerCase().includes(value.toLowerCase()) ||
      (course.course_description && course.course_description.toLowerCase().includes(value.toLowerCase()))
    );
    setFilteredCourses(filtered);
  };

  const handleEnroll = async (courseId) => {
    try {
      setLoading(true);
      const response = await apiClient.post(`/api/student/courses/${courseId}/enroll/`);
      if (response.data.status === 'success') {
        message.success(response.data.message || 'Successfully enrolled in course');
        await fetchCourses(); // Refresh course list
      } else {
        message.error(response.data.message || 'Failed to enroll in course');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      message.error(error.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setLoading(false);
    }
  };

  const getTermText = (term) => {
    switch(term) {
      case 1: return 'Spring';
      case 2: return 'Summer';
      case 3: return 'Fall';
      default: return 'Unknown Term';
    }
  };

  if (loading && courses.length === 0) {
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
        <Title level={2}>Browse All Courses</Title>
        <Paragraph>Explore all available courses and enroll</Paragraph>
      </div>

      <Search
        placeholder="Search course name or code"
        allowClear
        enterButton={<><SearchOutlined /> Search</>}
        size="large"
        onSearch={handleSearch}
        onChange={(e) => handleSearch(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      {filteredCourses.length === 0 ? (
        <Empty description="No courses found" />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredCourses.map(course => (
            <Col xs={24} sm={12} md={8} key={course.course_id}>
              <Card
                hoverable
                style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '380px' }}
                bodyStyle={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                actions={[
                  course.is_enrolled ? (
                    <Button 
                      type="text" 
                      icon={<CheckCircleOutlined />} 
                      disabled 
                      block
                    >
                      Enrolled
                    </Button>
                  ) : (
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnroll(course.course_id);
                      }} 
                      block
                    >
                      Enroll in Course
                    </Button>
                  )
                ]}
                onClick={() => course.is_enrolled && navigate(`/student/courses/${course.course_id}`)}
              >
                <div style={{
                  padding: '10px',
                  background: '#f0f2f5',
                  textAlign: 'center',
                  marginBottom: '16px',
                  flexShrink: 0
                }}>
                  <DatabaseOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                </div>
                <Card.Meta
                  style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                  title={
                    <div style={{ marginBottom: 8, flexShrink: 0 }}>
                      <Paragraph ellipsis={{ rows: 2, tooltip: course.course_name }} style={{ marginBottom: 4, fontWeight: 'bold' }}>
                        {course.course_name}
                      </Paragraph>
                      <Space wrap size={[4, 4]}>
                        <Tag color="blue">{course.course_code}</Tag>
                        <Tag color="green">Active</Tag>
                        {course.is_enrolled && <Tag color="purple">Enrolled</Tag>}
                      </Space>
                    </div>
                  }
                  description={
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Paragraph ellipsis={{ rows: 3, tooltip: course.course_description || 'No description available' }} style={{ marginBottom: 'auto' }}>
                        {course.course_description || 'No description available'}
                      </Paragraph>
                      <div style={{ flexShrink: 0 }}>
                        <Divider style={{ margin: '8px 0' }} />
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <div>
                            <Text type="secondary">
                              <BookOutlined /> {course.year} {getTermText(course.term)}
                            </Text>
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

export default BrowseCourses; 