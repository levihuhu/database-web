import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Empty,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Space,
  Tooltip,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, SearchOutlined, FilterOutlined, DatabaseOutlined, TeamOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { debounce } from 'lodash';
// 你已有的 axios 实例
import apiClient from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

/**
 * 示例组件：展示并管理 Instructor 负责的课程
 */
export default function InstructorCourseManage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 新增/编辑相关
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form] = Form.useForm();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ term: null, state: null });

  const fetchInstructorCourses = useCallback(async (currentSearch, currentFilters) => {
    try {
      setLoading(true);
      const params = {};
      if (currentSearch) params.search = currentSearch;
      if (currentFilters.term) params.term = currentFilters.term;
      if (currentFilters.state) params.state = currentFilters.state;

      const res = await apiClient.get('/api/instructor/courses/', { params });
      const coursesData = res.data?.courses || res.data || [];
      setCourses(coursesData);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      message.error('Failed to load courses');
      setCourses([]); // 出错时清空列表
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      fetchInstructorCourses(value, filters);
    }, 300), // 300ms delay
    [fetchInstructorCourses, filters] // Dependencies for useCallback
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleFilterChange = (changedFilters) => {
    const newFilters = { ...filters, ...changedFilters };
    setFilters(newFilters);
    fetchInstructorCourses(searchTerm, newFilters);
  };

  useEffect(() => {
    fetchInstructorCourses(searchTerm, filters);
  }, [fetchInstructorCourses]); // Fetch on initial mount

  // 2. "Add Course" 按钮
  const handleAddCourse = () => {
    setEditingCourse(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 3. "Edit" 按钮
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    form.setFieldsValue({
      course_name: course.course_name,
      course_code: course.course_code,
      year: course.year,
      term: course.term,
      state: course.state,
      // 视需求添加更多字段
    });
    setModalVisible(true);
  };

  // 4. "Delete" 按钮
  const handleDeleteCourse = async (course) => {
    // 如果后端会处理这个逻辑，可以去掉前端检查
    // if (course.enrolled_students > 0) {
    //   message.warning(`Cannot delete: ${course.course_name} has enrolled students.`);
    //   return;
    // }
    
    try {
      setLoading(true); // 开始加载状态
      await apiClient.delete(`/api/instructor/courses/delete/?course_id=${course.course_id}`);
      message.success('Course deleted successfully');
      await fetchInstructorCourses(searchTerm, filters); // 重新获取最新课程列表
    } catch (error) {
      console.error('Failed to delete course:', error);
      message.error('Failed to delete course: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false); // 结束加载状态
    }
  };

  // 5. Modal "OK"提交
  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      try {
        setLoading(true);
        if (editingCourse) {
          // 更新现有课程
          await apiClient.put(`/api/instructor/courses/update/?course_id=${editingCourse.course_id}`, values);
          message.success('Course updated successfully');
        } else {
          // 添加新课程
          await apiClient.post('/api/instructor/courses/insert/', values);
          message.success('Course added successfully');
        }
        setModalVisible(false);
        form.resetFields();
        await fetchInstructorCourses(searchTerm, filters);
      } catch (error) {
        console.error('Failed to save course:', error);
        message.error('Failed to save course: ' + (error.response?.data?.detail || error.message));
      } finally {
        setLoading(false);
      }
    });
  };

  // Modal 取消
  const handleModalCancel = () => {
    setModalVisible(false);
  };

  // 你可以改成表格 Table，也可保持卡片+编辑
  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>My Courses</Title>

      {/* Toolbar: Add Button, Search, Filters */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCourse}>
            Add Course
          </Button>
        </Col>
        <Col>
          <Space wrap>
            <Input
              placeholder="Search Courses..."
              prefix={<SearchOutlined />}
              onChange={handleSearchChange}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="Filter by Term"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => handleFilterChange({ term: value })}
              value={filters.term}
            >
              <Option value="Spring">Spring</Option>
              <Option value="Summer">Summer</Option>
              <Option value="Fall">Fall</Option>
            </Select>
            <Select
              placeholder="Filter by State"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => handleFilterChange({ state: value })}
              value={filters.state}
            >
              <Option value="active">Active</Option>
              <Option value="completed">Completed</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </Space>
        </Col>
      </Row>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <Spin size="large" />
        </div>
      ) : courses.length === 0 ? (
        <Empty description="No courses match your criteria." style={{ marginTop: 40 }} />
      ) : (
        <Row gutter={[16, 16]}>
          {courses.map((course) => (
            <Col xs={24} sm={12} md={8} lg={8} key={course.course_id}>
              <Card
                hoverable
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: '300px',
                }}
                bodyStyle={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}
                actions={[
                  <Tooltip title="View Modules">
                    <Link to={`/teacher/courses/${course.course_id}/modules`}>
                      <Button type="text" icon={<DatabaseOutlined />} />
                    </Link>
                  </Tooltip>,
                  <Tooltip title="View Students">
                    <Link to={`/teacher/courses/${course.course_id}/students`}>
                      <Button type="text" icon={<TeamOutlined />} />
                    </Link>
                  </Tooltip>,
                  <Tooltip title="Edit Course">
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEditCourse(course)} />
                  </Tooltip>,
                  <Popconfirm
                    title="Delete Course?"
                    description={`Are you sure you want to delete "${course.course_name}"? This action might be irreversible.`}
                    icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                    onConfirm={() => handleDeleteCourse(course)}
                    okText="Yes, Delete"
                    cancelText="No"
                  >
                    <Tooltip title="Delete Course">
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                   style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                   title={
                     <div style={{ flexShrink: 0, marginBottom: 8 }}>
                       <Paragraph ellipsis={{ rows: 2, tooltip: course.course_name }} style={{ fontWeight: 'bold', minHeight: '44px' }}>
                         {course.course_name}
                       </Paragraph>
                       <Space wrap size={[4, 4]}>
                         <Tag color="blue">{course.course_code}</Tag>
                         <Tag>{course.year} {course.term}</Tag>
                         <Tag>{course.state}</Tag>
                       </Space>
                     </div>
                   }
                   description={
                     <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                       <Paragraph ellipsis={{ rows: 3, tooltip: course.course_description }} style={{ marginBottom: 'auto', minHeight: '66px' }}>
                         {course.course_description || 'No description provided.'}
                       </Paragraph>
                       <div style={{ flexShrink: 0, marginTop: 10 }}>
                         <Text type="secondary">Enrolled Students: {course.enrolled_students ?? 0}</Text>
                       </div>
                     </div>
                   }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 添加/编辑 Modal */}
      <Modal
        title={editingCourse ? 'Edit Course' : 'Add New Course'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        destroyOnClose
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" initialValues={{ state: 'active' }}>
          <Form.Item
            name="course_name"
            label="Course Name"
            rules={[{ required: true, message: 'Please enter a course name' }]}
          >
            <Input placeholder="e.g., Introduction to Databases" />
          </Form.Item>

          <Form.Item
            name="course_code"
            label="Course Code"
            rules={[{ required: true, message: 'Please enter a course code' }]}
          >
            <Input placeholder="e.g., CS5200" />
          </Form.Item>

          <Form.Item
            name="year"
            label="Year"
            rules={[
              { required: true, message: 'Please enter a year' },
              { type: 'number', min: 2020, max: 2050, message: 'Please enter a valid year', transform: value => Number(value) }
            ]}
          >
            <Input type="number" placeholder="e.g., 2024" />
          </Form.Item>

          <Form.Item
            name="term"
            label="Term"
            rules={[{ required: true, message: 'Please select a term' }]}
          >
            <Select placeholder="Select term">
              <Option value="Spring">Spring</Option>
              <Option value="Summer">Summer</Option>
              <Option value="Fall">Fall</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="state"
            label="State"
            rules={[{ required: true, message: 'Please select a state' }]}
          >
            <Select placeholder="Select course state">
              <Option value="active">Active</Option>
              <Option value="completed">Completed</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="course_description"
            label="Description (Optional)"
          >
            <Input.TextArea rows={3} placeholder="Enter a brief description of the course" />
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
}
