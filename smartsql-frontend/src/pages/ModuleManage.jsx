import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Table,
  Button,
  Space,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import apiClient from "../services/api.js";

const { Title, Paragraph } = Typography;

const ModuleManage = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchModules = async () => {
    try {
      setLoading(true);

      const res = await apiClient.get('/api/instructor/modules/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access')}`
        }
      });

      const data = res.data?.modules || [];
      setModules(data);
    } catch (error) {
      console.error('Error loading modules:', error);
      message.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  fetchModules();
}, []);


  const moduleColumns = [
  {
    title: 'ID',
    dataIndex: 'module_id',
    key: 'module_id',
  },
  {
    title: 'Title',
    dataIndex: 'module_name',
    key: 'module_name',
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
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => (
      <Space>
        <Button icon={<EditOutlined />} size="small">Edit</Button>
        <Button type="primary" size="small">View Exercises</Button>
      </Space>
    ),
  },
];

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>SQL Module Management</Title>
      <Paragraph>
        Manage modules for organizing SQL exercises. You can view and edit module information.
      </Paragraph>

      <Card
        title={
          <span><DatabaseOutlined /> SQL Modules</span>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
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
    </div>
  );
};

export default ModuleManage;
