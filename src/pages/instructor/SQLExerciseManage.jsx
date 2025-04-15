import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Import useParams, useNavigate, Link
import {
  Typography,
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  Spin,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CodeOutlined,
  EyeOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import apiClient from "../../services/api.js";
import { debounce } from 'lodash';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function SQLExerciseManage() {
  const { moduleId } = useParams(); // Get moduleId from URL if present
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [modules, setModules] = useState([]); // For module dropdown in modal
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ courseId: null, moduleId: null, difficulty: null }); // Add moduleId to filters
  const [sortBy, setSortBy] = useState('id_asc'); // Add sort state
  const [courses, setCourses] = useState([]); // Need courses for filtering

  // Fetch exercises based on moduleId or all exercises
  const fetchExercises = useCallback(async (currentSearch, currentFilters, currentSort) => {
    setLoading(true);
    try {
      const params = {};
      const targetModuleId = moduleId; // Use moduleId from URL param if present
      let url = '/api/instructor/exercises/';

      if (targetModuleId) {
        params.module_id = targetModuleId;
      } else {
        if (currentFilters.courseId) params.course_id = currentFilters.courseId;
        if (currentFilters.moduleId) params.module_id = currentFilters.moduleId;
      }
      if (currentFilters.difficulty) params.difficulty = currentFilters.difficulty;
      if (currentSearch) params.search = currentSearch;
      params.sort = currentSort;

      const res = await apiClient.get(url, { params });
      setExercises(res.data?.exercises || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
      message.error('Failed to load exercises');
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

   // Fetch modules for the Add/Edit Modal dropdown
  const fetchModulesForDropdown = async () => {
     try {
        // Use the existing endpoint to get all modules for the instructor
        const res = await apiClient.get('/api/instructor/modules/');
        setModules(res.data?.modules || []);
     } catch (error) {
        console.error('Error loading modules for dropdown:', error);
     }
  };

  // Fetch courses for filter dropdown
  const fetchCoursesForDropdown = async () => {
     try {
        const res = await apiClient.get('/api/instructor/courses/');
        setCourses(res.data?.courses || []);
     } catch (error) { console.error('Error loading courses for filter:', error); }
  };

  useEffect(() => {
    fetchExercises(searchTerm, filters, sortBy); // Pass sortBy
    if (!moduleId) { // Only fetch dropdown data if not viewing specific module
        fetchModulesForDropdown();
        fetchCoursesForDropdown();
    }
  }, [moduleId, fetchExercises, sortBy]); // Add sortBy dependency

  // Debounced search handler
  const debouncedSearch = useCallback(
     debounce((value) => {
         setSearchTerm(value);
         fetchExercises(value, filters, sortBy);
     }, 300),
     [fetchExercises, filters, sortBy]
  );

  const handleSearchChange = (e) => {
     debouncedSearch(e.target.value);
  };

   const handleFilterChange = (changedFilters) => {
      const newFilters = { ...filters, ...changedFilters };
      setFilters(newFilters);
      fetchExercises(searchTerm, newFilters, sortBy); // Pass sortBy
  };

  const handleTableChange = (pagination, filters, sorter) => {
    // Handle Ant Design Table's sorting changes
    let newSortBy = 'id_asc'; // Default
    if (sorter.field === 'id' && sorter.order) {
        newSortBy = sorter.order === 'ascend' ? 'id_asc' : 'id_desc';
    } else if (sorter.field === 'title' && sorter.order) {
         newSortBy = sorter.order === 'ascend' ? 'title_asc' : 'title_desc';
    }
    // Add other sortable fields if needed
    setSortBy(newSortBy);
    // Fetching is handled by useEffect dependency on sortBy
  };

  const handleAddExercise = () => {
    setEditingExercise(null);
    form.resetFields();
     if (moduleId) {
        form.setFieldsValue({ moduleId: parseInt(moduleId, 10) });
    }
    if (modules.length === 0 && !moduleId) fetchModulesForDropdown();
    setModalVisible(true);
  };

  const handleEditExercise = (exercise) => {
    setEditingExercise(exercise);
     // Ensure tableSchema is a string for the TextArea
     let schemaString = exercise.tableSchema;
     if (typeof schemaString !== 'string') {
         try { schemaString = JSON.stringify(schemaString, null, 2); }
         catch (e) { schemaString = ''; }
     }
    form.setFieldsValue({
      moduleId: exercise.moduleId,
      title: exercise.title,
      description: exercise.description,
      hint: exercise.hint,
      expectedAnswer: exercise.expectedAnswer,
      difficulty: exercise.difficulty,
      tableSchema: schemaString,
    });
    if (modules.length === 0 && !moduleId) fetchModulesForDropdown();
    setModalVisible(true);
  };

  const handleDeleteExercise = async (exerciseId) => {
     setLoading(true);
     try {
        await apiClient.delete(`/api/instructor/exercises/${exerciseId}/`);
        message.success('Exercise deleted successfully');
        fetchExercises(searchTerm, filters, sortBy); // Refresh list
     } catch (error) {
        console.error('Failed to delete exercise:', error);
        message.error(error.response?.data?.error || 'Failed to delete exercise');
     } finally {
        setLoading(false);
     }
  };

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      // The validator already checks JSON format for tableSchema
      let tableSchemaValue = values.tableSchema;
      // Backend expects JSON object/array, not string for create/update
       try {
           tableSchemaValue = JSON.parse(values.tableSchema);
       } catch(e) {
           // Should not happen if validator works, but as fallback
           message.error("Table Schema is not valid JSON.");
           return;
       }

      const payload = {
         ...values,
         tableSchema: tableSchemaValue, // Send parsed object/array
      };

      setLoading(true);
      try {
        if (editingExercise) {
          // Update existing exercise
          await apiClient.put(`/api/instructor/exercises/${editingExercise.id}/`, payload);
          message.success('Exercise updated successfully');
        } else {
          // Add new exercise
          await apiClient.post('/api/instructor/exercises/', payload);
          message.success('Exercise added successfully');
        }
        setModalVisible(false);
        form.resetFields();
        fetchExercises(searchTerm, filters, sortBy); // Refresh list
      } catch (error) {
        console.error('Failed to save exercise:', error);
        message.error(error.response?.data?.error || 'Failed to save exercise');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const exerciseColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
      sortOrder: sortBy.startsWith('id_') ? (sortBy === 'id_asc' ? 'ascend' : 'descend') : false,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      sortOrder: sortBy.startsWith('title_') ? (sortBy === 'title_asc' ? 'ascend' : 'descend') : false,
    },
    {
      title: 'Module',
      dataIndex: 'module', // Use the 'module' key returned by the backend
      key: 'module',
      hidden: !!moduleId, // Hide if moduleId is present in URL
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty) => {
        let color = 'green';
        if (difficulty === 'Medium') color = 'orange';
        else if (difficulty === 'Hard') color = 'red';
        return <Tag color={color}>{difficulty}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
           {/* Link to view exercise detail */}
           <Link to={`/teacher/exercises/${record.id}`}>
             <Button icon={<EyeOutlined />} size="small">View</Button>
           </Link>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEditExercise(record)}>Edit</Button>
          <Popconfirm
            title="Are you sure you want to delete this exercise?"
            onConfirm={() => handleDeleteExercise(record.id)}
            okText="Yes" cancelText="No"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button icon={<DeleteOutlined />} danger size="small">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ].filter(col => !col.hidden);

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>{moduleId ? `Exercises for Module ${moduleId}` : 'SQL Exercise Management'}</Title>
      <Paragraph>
        Manage SQL exercises for students.
      </Paragraph>

      {/* Toolbar */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
         <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddExercise}> Add Exercise </Button>
         </Col>
         <Col>
            <Space>
                <Input
                    placeholder="Search Exercises..."
                    prefix={<SearchOutlined />}
                    onChange={handleSearchChange}
                    style={{ width: 200 }}
                    allowClear
                />
                 {/* Show filters only when viewing ALL exercises */}
                 {!moduleId && (
                     <>
                        <Select
                            placeholder="Filter by Course"
                            allowClear
                            style={{ width: 180 }}
                            onChange={(value) => handleFilterChange({ courseId: value })}
                            loading={courses.length === 0}
                            showSearch
                             filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {courses.map(course => (
                                <Option key={course.course_id} value={course.course_id}>
                                    {course.course_name}
                                </Option>
                            ))}
                        </Select>
                        <Select
                            placeholder="Filter by Module"
                            allowClear
                            style={{ width: 180 }}
                            onChange={(value) => handleFilterChange({ moduleId: value })}
                            loading={modules.length === 0}
                            showSearch
                             filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
                        >
                            {modules.map(mod => (
                                <Option key={mod.module_id} value={mod.module_id}>
                                    {mod.module_name} ({mod.course_name || 'No Course'})
                                </Option>
                            ))}
                        </Select>
                     </>
                 )}
                <Select
                    placeholder="Filter by Difficulty"
                    allowClear
                    style={{ width: 140 }}
                    onChange={(value) => handleFilterChange({ difficulty: value })}
                >
                    <Option value="Easy">Easy</Option>
                    <Option value="Medium">Medium</Option>
                    <Option value="Hard">Hard</Option>
                </Select>
            </Space>
         </Col>
      </Row>

      <Card
        title={<span><CodeOutlined /> {moduleId ? 'Exercises in this Module' : 'All Exercises'}</span>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddExercise}>Add Exercise</Button>}
      >
        <Table
          columns={exerciseColumns}
          dataSource={exercises}
          rowKey="id"
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modal for Add/Edit */}
      <Modal
        title={editingExercise ? 'Edit Exercise' : 'Add New Exercise'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
      >
        <Form form={form} layout="vertical" initialValues={{ hint: '', description: ''}}>
          <Form.Item
            name="moduleId" label="Module"
            rules={[{ required: true, message: 'Please select a module' }]}
          >
             <Select placeholder="Select a module" loading={!moduleId && modules.length === 0} disabled={!!moduleId}>
                 {moduleId ? (
                    <Option key={moduleId} value={parseInt(moduleId, 10)}>Module ID: {moduleId}</Option> // Fetch module name?
                 ) : (
                     modules.map(mod => (
                        <Option key={mod.module_id} value={mod.module_id}>
                           {mod.module_name} ({mod.course_name || 'Unknown Course'})
                        </Option>
                     ))
                 )}
             </Select>
          </Form.Item>
          <Form.Item name="title" label="Exercise Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="hint" label="Hint">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="expectedAnswer" label="Expected Answer (SQL Query)" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="difficulty" label="Difficulty" rules={[{ required: true }]}>
            <Select>
              <Option value="Easy">Easy</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Hard">Hard</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="tableSchema" label="Table Schema (JSON format)"
            rules={[ { required: true }, { validator: (_, value) => {/* JSON validator */} } ]}
          >
            <TextArea rows={6} placeholder='[{"name": "table_name", "columns": ["col1", "col2"]}]' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
