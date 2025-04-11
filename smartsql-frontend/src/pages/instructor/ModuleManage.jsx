import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Typography,
  Card,
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Select,
  Spin,
  Popconfirm,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import apiClient from "../../services/api.js";
import { debounce } from 'lodash';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ModuleManage = () => {
  const { courseId } = useParams();
  const [courseName, setCourseName] = useState('');

  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourseId, setFilterCourseId] = useState(courseId || null);

  const fetchModules = useCallback(async (currentSearch, currentCourseFilter) => {
    setLoading(true);
    try {
      const params = {};
      const targetCourseId = courseId || currentCourseFilter;
      let url = '/api/instructor/modules/';
      if (targetCourseId) {
        params.course_id = targetCourseId;
      }
      if (currentSearch) {
        params.search = currentSearch;
      }

      const res = await apiClient.get(url, { params });
      setModules(res.data?.modules || []);
    } catch (error) {
      console.error('Error loading modules:', error);
      message.error('Failed to load modules');
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchCourses = async () => {
    try {
      const res = await apiClient.get('/api/instructor/courses/');
      setCourses(res.data?.courses || []);
    } catch (error) {
      console.error('Error loading courses for dropdown:', error);
    }
  };

  useEffect(() => {
    fetchModules(searchTerm, filterCourseId);
    if (!courseId) {
      fetchCourses();
    }
  }, [courseId, fetchModules]);

  useEffect(() => {
    const loadCourseName = async () => {
      if (courseId) {
        try {
          if (courses.length > 0) {
            const foundCourse = courses.find(c => String(c.course_id) === courseId);
            setCourseName(foundCourse?.course_name || '');
          } else {
            const res = await apiClient.get('/api/instructor/courses/');
            const allCourses = res.data?.courses || [];
            setCourses(allCourses);
            const foundCourse = allCourses.find(c => String(c.course_id) === courseId);
            setCourseName(foundCourse?.course_name || '');
          }
        } catch (error) {
          console.error("Failed to fetch course name", error);
          setCourseName('');
        }
      } else {
        setCourseName('');
      }
    };
    loadCourseName();
  }, [courseId, courses]);

  const handleAddModule = () => {
    setEditingModule(null);
    form.resetFields();
    if (courseId) {
      form.setFieldsValue({ course_id: parseInt(courseId, 10) });
    }
    if (courses.length === 0 && !courseId) fetchCourses();
    setModalVisible(true);
  };

  const handleEditModule = (module) => {
    setEditingModule(module);
    form.setFieldsValue({
      module_name: module.module_name,
      module_description: module.module_description,
      course_id: module.course_id,
    });
    if (courses.length === 0 && !courseId) fetchCourses();
    setModalVisible(true);
  };

  const handleDeleteModule = async (moduleId) => {
    setLoading(true);
    try {
      await apiClient.delete(`/api/instructor/modules/${moduleId}/`);
      message.success('Module deleted successfully');
      fetchModules(searchTerm, filterCourseId);
    } catch (error) {
      console.error('Failed to delete module:', error);
      message.error(error.response?.data?.error || 'Failed to delete module');
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      try {
        if (editingModule) {
          await apiClient.put(`/api/instructor/modules/${editingModule.module_id}/`, values);
          message.success('Module updated successfully');
        } else {
          await apiClient.post('/api/instructor/modules/', values);
          message.success('Module added successfully');
        }
        setModalVisible(false);
        form.resetFields();
        fetchModules(searchTerm, filterCourseId);
      } catch (error) {
        console.error('Failed to save module:', error);
        message.error(error.response?.data?.error || 'Failed to save module');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      fetchModules(value, filterCourseId);
    }, 300),
    [fetchModules, filterCourseId]
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleCourseFilterChange = (value) => {
    setFilterCourseId(value);
    fetchModules(searchTerm, value);
  };

  const moduleColumns = [
    {
      title: 'ID',
      dataIndex: 'module_id',
      key: 'module_id',
      width: 80
    },
    {
      title: 'Title',
      dataIndex: 'module_name',
      key: 'module_name',
      width: 250
    },
    {
      title: 'Description',
      dataIndex: 'module_description',
      key: 'module_description',
      ellipsis: true,
    },
    {
      title: 'Exercises',
      dataIndex: 'exercise_count',
      key: 'exercise_count',
      width: 100,
      align: 'center'
    },
    {
      title: 'Course',
      dataIndex: 'course_name',
      key: 'course_name',
      hidden: !!courseId,
      render: (text, record) => (
        <Link to={`/teacher/courses/${record.course_id}/modules`}>{text}</Link>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Module">
            <Button icon={<EditOutlined />} size="small" onClick={() => handleEditModule(record)} />
          </Tooltip>
          <Tooltip title="View Exercises">
            <Link to={`/teacher/modules/${record.module_id}/exercises`}>
              <Button type="primary" size="small" icon={<UnorderedListOutlined />} />
            </Link>
          </Tooltip>
          <Popconfirm
            title="Are you sure to delete this module?"
            description="This might also delete associated exercises depending on database setup."
            onConfirm={() => handleDeleteModule(record.module_id)}
            okText="Yes"
            cancelText="No"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Tooltip title="Delete Module">
              <Button icon={<DeleteOutlined />} danger size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ].filter(col => !col.hidden);

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>{courseId ? `Modules for ${courseName || `Course ${courseId}`}` : 'SQL Module Management'}</Title>
      <Paragraph>
        Manage modules for organizing SQL exercises. You can view and edit module information.
      </Paragraph>

      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddModule}>
            Add Module
          </Button>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="Search Modules..."
              prefix={<SearchOutlined />}
              onChange={handleSearchChange}
              style={{ width: 200 }}
              allowClear
            />
            {!courseId && (
              <Select
                placeholder="Filter by Course"
                allowClear
                style={{ width: 200 }}
                onChange={handleCourseFilterChange}
                loading={courses.length === 0}
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {courses.map(course => (
                  <Option key={course.course_id} value={course.course_id}>
                    {course.course_name} ({course.course_code})
                  </Option>
                ))}
              </Select>
            )}
          </Space>
        </Col>
      </Row>

      <Card
        title={<span><DatabaseOutlined /> {courseId ? 'Modules in this Course' : 'All Modules'}</span>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddModule}>
            Add Module
          </Button>
        }
      >
        <Table
          columns={moduleColumns}
          dataSource={modules}
          rowKey="module_id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingModule ? 'Edit Module' : 'Add New Module'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ module_description: '' }}>
          <Form.Item
            name="module_name"
            label="Module Name"
            rules={[{ required: true, message: 'Please enter a module name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="module_description"
            label="Description"
          >
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="course_id"
            label="Course"
            rules={[{ required: true, message: 'Please select the course' }]}
          >
            <Select placeholder="Select a course" loading={!courseId && courses.length === 0} disabled={!!courseId}>
              {courseId ? (
                <Option key={courseId} value={parseInt(courseId, 10)}>Course ID: {courseId}</Option>
              ) : (
                courses.map(course => (
                  <Option key={course.course_id} value={course.course_id}>
                    {course.course_name} ({course.course_code})
                  </Option>
                ))
              )}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ModuleManage;
