import React, { useEffect, useState } from 'react';
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
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
// 你已有的 axios 实例
import apiClient from '../services/api';

const { Title, Text } = Typography;
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

  // 1. 加载课程列表
  const fetchInstructorCourses = async () => {
    const res = await apiClient.get('/api/instructor/courses/');
    // 后端返回 { courses: [...] }
    return res.data?.courses || [];
  };

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        // 也可以改成后端真实数据
        const result = await fetchInstructorCourses();

        // 如果你后端没有 enrolled_count，mock 一个
        const mockWithEnrolledCount = result.map((c) => ({
          ...c,
          enrolled_count: c.enrolled_count || 0, // 默认 0
        }));

        setCourses(mockWithEnrolledCount);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        message.error('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    loadCourses();
  }, []);

  // 2. “Add Course” 按钮
  const handleAddCourse = () => {
    setEditingCourse(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 3. “Edit” 按钮
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

  // 4. “Delete” 按钮
  const handleDeleteCourse = (course) => {
    // 如果有学生选课 enrolled_count > 0，就不能删除
    if (course.enrolled_students > 0) {
      // message.warning(`Cannot delete: ${course.course_name} has enrolled students.`);
      alert(`Cannot delete: ${course.course_name} has enrolled students.`);
      return;
    }
    // 向后端发请求或在前端移除
    const updated = courses.filter((c) => c.course_id !== course.course_id);
    setCourses(updated);
    message.success('Course deleted successfully');
  };

  // 5. Modal “OK”提交
  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingCourse) {
        // Update existing course
        const newList = courses.map((c) =>
          c.course_id === editingCourse.course_id
            ? { ...c, ...values }
            : c
        );
        setCourses(newList);
        message.success('Course updated successfully');
      } else {
        // Add new course
        const newId = Math.max(0, ...courses.map((c) => c.course_id)) + 1;
        const newCourse = {
          course_id: newId,
          enrolled_count: 0, // 默认 0
          ...values,
        };
        setCourses([...courses, newCourse]);
        message.success('Course added successfully');
      }

      setModalVisible(false);
      form.resetFields();
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
      <Button
        type="primary"
        icon={<PlusOutlined />}
        style={{ marginBottom: 16 }}
        onClick={handleAddCourse}
      >
        Add Course
      </Button>

      {loading ? (
        <Spin size="large" />
      ) : courses.length === 0 ? (
        <Empty description="No courses found." />
      ) : (
       <Row gutter={[16, 16]}>
        {courses.map((course) => (
          <Col xs={24} sm={12} md={12} lg={12} key={course.course_id}>
            <Card
              title={
                <div style={{ color: '#096dd9', fontWeight: 600 }}>
                  {course.course_name}
                </div>
              }
              bordered={false}
              style={{
                borderRadius: '10px',
                boxShadow: '0 4px 4px 4px rgba(0, 0, 0, 0.06)',
                minHeight: '240px',
              }}
              actions={[
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => handleEditCourse(course)}
                >
                  Edit
                </Button>,
                <Popconfirm
                  title="Are you sure to delete this course?"
                  icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                  onConfirm={() => handleDeleteCourse(course)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button icon={<DeleteOutlined />} size="small" danger>
                    Delete
                  </Button>
                </Popconfirm>,
              ]}
            >
              <Row gutter={[8, 6]}>
                <Col span={12}>
                  <Text type="secondary">Code: {course.course_code}</Text>
                </Col>
                <Col span={12}>
                  <Text>Year: {course.year}</Text>
                </Col>

                <Col span={12}>
                  <Text>Term: {course.term}</Text>
                </Col>
                <Col span={12}>
                  <Text>Status: {course.state}</Text>
                </Col>

                <Col span={12}>
                  <Text>Enrolled: {course.enrolled_students}</Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary">{course.course_description}</Text>
                </Col>
              </Row>
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
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="course_name"
            label="Course Name"
            rules={[{ required: true, message: 'Please enter a course name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="course_code"
            label="Course Code"
            rules={[{ required: true, message: 'Please enter a course code' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="year"
            label="Year"
            rules={[{ required: true, message: 'Please enter a year' }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="term"
            label="Term"
            rules={[{ required: true, message: 'Please enter term' }]}
          >
            <Select>
              <Option value="Spring">Spring</Option>
              <Option value="Summer">Summer</Option>
              <Option value="Fall">Fall</Option>
              <Option value="Winter">Winter</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="state"
            label="State"
            rules={[{ required: true, message: 'Please select a state' }]}
          >
            <Select>
              <Option value="active">Active</Option>
              <Option value="completed">Completed</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
