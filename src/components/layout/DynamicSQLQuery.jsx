import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Space,
  Table,
  Typography,
  Divider,
  message
} from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const DynamicSQLQuery = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [queryResults, setQueryResults] = useState([]);
  const [generatedQuery, setGeneratedQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/dynamic-sql/', {
        table_name: values.table_name,
        columns: values.columns || [],
        conditions: values.conditions?.map(cond => `${cond.column} ${cond.operator} '${cond.value}'`) || [],
        order_by: values.order_by?.map(order => `${order.column} ${order.direction}`) || [],
        limit: values.limit,
        offset: values.offset
      });

      setQueryResults(response.data.data);
      setGeneratedQuery(response.data.query);
      message.success('Query executed successfully');
    } catch (error) {
      console.error('Error executing query:', error);
      message.error('Query failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
      <div style={{ padding: '20px' }}>
        <Title level={2}>Dynamic SQL Query</Title>
        <Text type="secondary">
          Build SQL queries by selecting table name, columns, conditions, and order
        </Text>

        <Divider />

        <Card>
          <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                columns: [],
                conditions: [],
                order_by: []
              }}
          >
            <Form.Item
                name="table_name"
                label="Table Name"
                rules={[{ required: true, message: 'Please enter a table name' }]}
            >
              <Input placeholder="Enter table name" />
            </Form.Item>

            <Form.List name="columns">
              {(fields, { add, remove }) => (
                  <div>
                    {fields.map((field) => (
                        <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Form.Item
                              {...field}
                              name={[field.name]}
                              fieldKey={[field.fieldKey]}
                              rules={[{ required: true, message: 'Please enter a column name' }]}
                          >
                            <Input placeholder="Column name" />
                          </Form.Item>
                          <MinusOutlined onClick={() => remove(field.name)} />
                        </Space>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Column
                      </Button>
                    </Form.Item>
                  </div>
              )}
            </Form.List>

            <Form.List name="conditions">
              {(fields, { add, remove }) => (
                  <div>
                    {fields.map((field) => (
                        <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Form.Item
                              {...field}
                              name={[field.name, 'column']}
                              fieldKey={[field.fieldKey, 'column']}
                              rules={[{ required: true, message: 'Please enter a column name' }]}
                          >
                            <Input placeholder="Column name" />
                          </Form.Item>
                          <Form.Item
                              {...field}
                              name={[field.name, 'operator']}
                              fieldKey={[field.fieldKey, 'operator']}
                              rules={[{ required: true, message: 'Please select an operator' }]}
                          >
                            <Select style={{ width: 100 }}>
                              <Option value="=">=</Option>
                              <Option value="!=">!=</Option>
                              <Option value=">">&gt;</Option>
                              <Option value="<">&lt;</Option>
                              <Option value=">=">&gt;=</Option>
                              <Option value="<=">&lt;=</Option>
                              <Option value="LIKE">LIKE</Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                              {...field}
                              name={[field.name, 'value']}
                              fieldKey={[field.fieldKey, 'value']}
                              rules={[{ required: true, message: 'Please enter a value' }]}
                          >
                            <Input placeholder="Value" />
                          </Form.Item>
                          <MinusOutlined onClick={() => remove(field.name)} />
                        </Space>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Condition
                      </Button>
                    </Form.Item>
                  </div>
              )}
            </Form.List>

            <Form.List name="order_by">
              {(fields, { add, remove }) => (
                  <div>
                    {fields.map((field) => (
                        <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Form.Item
                              {...field}
                              name={[field.name, 'column']}
                              fieldKey={[field.fieldKey, 'column']}
                              rules={[{ required: true, message: 'Please enter a column name' }]}
                          >
                            <Input placeholder="Column name" />
                          </Form.Item>
                          <Form.Item
                              {...field}
                              name={[field.name, 'direction']}
                              fieldKey={[field.fieldKey, 'direction']}
                              rules={[{ required: true, message: 'Please select a sort direction' }]}
                          >
                            <Select style={{ width: 100 }}>
                              <Option value="ASC">Ascending</Option>
                              <Option value="DESC">Descending</Option>
                            </Select>
                          </Form.Item>
                          <MinusOutlined onClick={() => remove(field.name)} />
                        </Space>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Sorting
                      </Button>
                    </Form.Item>
                  </div>
              )}
            </Form.List>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Run Query
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {generatedQuery && (
            <Card style={{ marginTop: 16 }}>
              <Title level={4}>Generated SQL Query</Title>
              <Text code>{generatedQuery}</Text>
            </Card>
        )}

        {queryResults.length > 0 && (
            <Card style={{ marginTop: 16 }}>
              <Title level={4}>Query Results</Title>
              <Table
                  dataSource={queryResults}
                  columns={Object.keys(queryResults[0]).map((key) => ({
                    title: key,
                    dataIndex: key,
                    key: key,
                    render: (text, record) => {
                      if (key === 'course_id') {
                        return (
                            <a onClick={() => navigate(`/student/courses/${text}`)}>{text}</a>
                        );
                      }
                      return text;
                    }
                  }))}
                  rowKey={(record) => JSON.stringify(record)}
              />
            </Card>
        )}
      </div>
  );
};

export default DynamicSQLQuery;