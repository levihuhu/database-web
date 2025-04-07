import React, { useState, useEffect } from 'react';
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import apiClient from "../services/api.js";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function SQLExerciseManage() {
  const [exercises, setExercises] = useState([]);
  const [modules, setModules] = useState([]); // 如果要在下拉里选module, 需要保留
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [form] = Form.useForm();

  // 仅获取 exercises
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/api/instructor/exercises/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access')}`
          }
        });
        const data = res.data?.exercises || [];
        setExercises(data);
      } catch (error) {
        console.error('Error loading exercises:', error);
        message.error('Failed to load exercises');
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  // 如果需要下拉选择 module，就把这里解注释并实现后端接口 /api/instructor/modules
  /*
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await apiClient.get('/api/instructor/modules/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access')}`
          }
        });
        const data = res.data?.modules || [];
        setModules(data);
      } catch (error) {
        console.error('Error loading modules:', error);
      }
    };
    fetchModules();
  }, []);
  */

  const handleAddExercise = () => {
    setEditingExercise(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditExercise = (exercise) => {
    setEditingExercise(exercise);
    form.setFieldsValue({
      moduleId: exercise.moduleId,
      title: exercise.title,
      description: exercise.description,
      hint: exercise.hint,
      expectedAnswer: exercise.expectedAnswer,
      difficulty: exercise.difficulty,
      tableSchema: JSON.stringify(exercise.tableSchema, null, 2),
    });
    setModalVisible(true);
  };

  const handleDeleteExercise = (exerciseId) => {
    // 简单在前端移除
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
    message.success('Exercise deleted successfully');
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      let tableSchemaObj;
      try {
        tableSchemaObj = JSON.parse(values.tableSchema);
      } catch (error) {
        message.error('Invalid table schema JSON format');
        return;
      }

      const formattedExercise = {
        ...values,
        tableSchema: tableSchemaObj,
      };

      if (editingExercise) {
        // update
        const updated = exercises.map(ex =>
          ex.id === editingExercise.id
            ? { ...formattedExercise, id: editingExercise.id }
            : ex
        );
        setExercises(updated);
        message.success('Exercise updated successfully');
      } else {
        // create new
        const newExercise = {
          ...formattedExercise,
          id: Math.max(...exercises.map(ex => ex.id), 0) + 1,
        };
        setExercises([...exercises, newExercise]);
        message.success('Exercise added successfully');
      }

      setModalVisible(false);
      form.resetFields();
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
      width: 60,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Module',
      dataIndex: 'moduleId',
      key: 'moduleId',
      render: (moduleId) => {
        // 如果没加载 modules，就显示 moduleId
        // 如果需要根据 moduleId 找 module name：
        const module = modules.find(m => m.id === moduleId);
        return module ? module.title : moduleId;
      },
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
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditExercise(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this exercise?"
            onConfirm={() => handleDeleteExercise(record.id)}
            okText="Yes"
            cancelText="No"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button icon={<DeleteOutlined />} danger size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>SQL Exercises</Title>
      <Paragraph>
        Manage SQL exercises for students. You can add, edit, or delete exercises here.
      </Paragraph>

      <Card
        title="All Exercises"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddExercise}
          >
            Add Exercise
          </Button>
        }
      >
        <Table
          columns={exerciseColumns}
          dataSource={exercises}
          rowKey="id"
          loading={loading}
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
        <Form form={form} layout="vertical">
          <Form.Item
            name="moduleId"
            label="Module"
            rules={[{ required: true, message: 'Please select a module' }]}
          >
            <Select placeholder="Select a module">
              {modules.map(module => (
                <Option key={module.id} value={module.id}>
                  {module.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Exercise Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="hint"
            label="Hint"
          >
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="expectedAnswer"
            label="Expected Answer"
            rules={[{ required: true, message: 'Please enter the expected answer' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="difficulty"
            label="Difficulty"
            rules={[{ required: true, message: 'Please select a difficulty level' }]}
          >
            <Select placeholder="Select difficulty">
              <Option value="Easy">Easy</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Hard">Hard</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="tableSchema"
            label="Table Schema (JSON format)"
            rules={[
              { required: true, message: 'Please enter the table schema' },
              {
                validator: (_, value) => {
                  try {
                    JSON.parse(value);
                    return Promise.resolve();
                  } catch (error) {
                    return Promise.reject('Invalid JSON format');
                  }
                },
              },
            ]}
          >
            <TextArea rows={6} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
