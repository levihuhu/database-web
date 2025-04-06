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
  Tabs,
  Tag,
  Popconfirm,
  message,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ExclamationCircleOutlined,
  DatabaseOutlined,
  CodeOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const SQLExerciseManagement = () => {
  const [exercises, setExercises] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');

  // Mock data for initial load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock modules data
        const mockModules = [
          {
            id: 'basics',
            title: 'SQL Basics',
            description: 'Learn the fundamentals of SQL including SELECT, INSERT, UPDATE, and DELETE statements.',
            exercises: 10,
          },
          {
            id: 'joins',
            title: 'SQL Joins',
            description: 'Master different types of joins: INNER, LEFT, RIGHT, and FULL OUTER joins.',
            exercises: 8,
          },
          {
            id: 'filtering',
            title: 'Filtering & Sorting',
            description: 'Learn to filter and sort data using WHERE, HAVING, ORDER BY, and GROUP BY clauses.',
            exercises: 12,
          },
          {
            id: 'subqueries',
            title: 'Subqueries',
            description: 'Understand how to use subqueries to create more complex SQL statements.',
            exercises: 10,
          },
          {
            id: 'functions',
            title: 'SQL Functions',
            description: 'Explore various SQL functions including aggregate, string, and date functions.',
            exercises: 15,
          }
        ];
        
        // Mock exercises data
        const mockExercises = [
          {
            id: 1,
            moduleId: 'basics',
            title: 'SELECT Statement Basics',
            description: 'Write a SQL query to select all columns from the "students" table.',
            hint: 'Use the * wildcard to select all columns.',
            expectedAnswer: 'SELECT * FROM students;',
            difficulty: 'Easy',
            tableSchema: [
              { name: 'students', columns: ['id', 'name', 'age', 'grade', 'email'] }
            ],
          },
          {
            id: 2,
            moduleId: 'basics',
            title: 'Filtering with WHERE',
            description: 'Write a SQL query to select all students who are older than 20 years.',
            hint: 'Use the WHERE clause with the > operator.',
            expectedAnswer: 'SELECT * FROM students WHERE age > 20;',
            difficulty: 'Easy',
            tableSchema: [
              { name: 'students', columns: ['id', 'name', 'age', 'grade', 'email'] }
            ],
          },
          {
            id: 3,
            moduleId: 'joins',
            title: 'Basic INNER JOIN',
            description: 'Write a SQL query to join the students and courses tables to show which courses each student is enrolled in.',
            hint: 'Use INNER JOIN with the ON keyword to specify the join condition.',
            expectedAnswer: 'SELECT students.name, courses.course_name FROM students INNER JOIN enrollments ON students.id = enrollments.student_id INNER JOIN courses ON enrollments.course_id = courses.id;',
            difficulty: 'Medium',
            tableSchema: [
              { name: 'students', columns: ['id', 'name', 'age', 'grade', 'email'] },
              { name: 'courses', columns: ['id', 'course_name', 'instructor', 'credits'] },
              { name: 'enrollments', columns: ['id', 'student_id', 'course_id', 'enrollment_date'] }
            ],
          },
        ];
        
        setModules(mockModules);
        setExercises(mockExercises);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
        message.error('Failed to load data');
      }
    };

    fetchData();
  }, []);

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
        // Update existing exercise
        const updatedExercises = exercises.map(ex => 
          ex.id === editingExercise.id ? { ...formattedExercise, id: editingExercise.id } : ex
        );
        setExercises(updatedExercises);
        message.success('Exercise updated successfully');
      } else {
        // Add new exercise
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
        if (difficulty === 'Medium') {
          color = 'orange';
        } else if (difficulty === 'Hard') {
          color = 'red';
        }
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
            <Button 
              icon={<DeleteOutlined />} 
              danger
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const moduleColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Exercises',
      dataIndex: 'exercises',
      key: 'exercises',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            size="small"
          >
            Edit
          </Button>
          <Button 
            type="primary"
            size="small"
          >
            View Exercises
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>SQL Exercise Management</Title>
      <Paragraph>
        Manage SQL exercises for students. You can add, edit, or delete exercises and organize them into modules.
      </Paragraph>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <CodeOutlined />
              Exercises
            </span>
          } 
          key="1"
        >
          <Card 
            title="SQL Exercises" 
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
        </TabPane>
        <TabPane 
          tab={
            <span>
              <DatabaseOutlined />
              Modules
            </span>
          } 
          key="2"
        >
          <Card 
            title="SQL Modules" 
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
              >
                Add Module
              </Button>
            }
          >
            <Table 
              columns={moduleColumns} 
              dataSource={modules} 
              rowKey="id" 
              loading={loading}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={editingExercise ? "Edit Exercise" : "Add New Exercise"}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="moduleId"
            label="Module"
            rules={[{ required: true, message: 'Please select a module' }]}
          >
            <Select placeholder="Select a module">
              {modules.map(module => (
                <Option key={module.id} value={module.id}>{module.title}</Option>
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
                }
              }
            ]}
          >
            <TextArea rows={6} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SQLExerciseManagement;