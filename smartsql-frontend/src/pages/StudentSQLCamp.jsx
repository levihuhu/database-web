import React, { useState } from 'react';
import { Typography, Card, Row, Col, Menu, Badge, Progress } from 'antd';
import { 
  DatabaseOutlined, 
  TableOutlined, 
  FilterOutlined, 
  ApartmentOutlined, 
  FunctionOutlined,
  LockOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const modules = [
  {
    key: 'basics',
    title: 'SQL Basics',
    icon: <DatabaseOutlined />,
    description: 'Learn the fundamentals of SQL including SELECT, INSERT, UPDATE, and DELETE statements.',
    progress: 80,
    exercises: 10,
    completed: 8,
    unlocked: true
  },
  {
    key: 'joins',
    title: 'SQL Joins',
    icon: <TableOutlined />,
    description: 'Master different types of joins: INNER, LEFT, RIGHT, and FULL OUTER joins.',
    progress: 40,
    exercises: 8,
    completed: 3,
    unlocked: true
  },
  {
    key: 'filtering',
    title: 'Filtering & Sorting',
    icon: <FilterOutlined />,
    description: 'Learn to filter and sort data using WHERE, HAVING, ORDER BY, and GROUP BY clauses.',
    progress: 20,
    exercises: 12,
    completed: 2,
    unlocked: true
  },
  {
    key: 'subqueries',
    title: 'Subqueries',
    icon: <ApartmentOutlined />,
    description: 'Understand how to use subqueries to create more complex SQL statements.',
    progress: 0,
    exercises: 10,
    completed: 0,
    unlocked: false
  },
  {
    key: 'functions',
    title: 'SQL Functions',
    icon: <FunctionOutlined />,
    description: 'Explore various SQL functions including aggregate, string, and date functions.',
    progress: 0,
    exercises: 15,
    completed: 0,
    unlocked: false
  }
];

const StudentSQLCamp = () => {
  const [selectedModule, setSelectedModule] = useState('basics');

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>SQL Training Camp</Title>
      <Paragraph>
        Welcome to the SQL Training Camp! Select a module to start practicing SQL queries.
        Complete exercises to unlock advanced modules and improve your database skills.
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card title="Learning Modules">
            <Menu
              mode="vertical"
              selectedKeys={[selectedModule]}
              onClick={(e) => setSelectedModule(e.key)}
              style={{ border: 'none' }}
            >
              {modules.map(module => (
                <Menu.Item 
                  key={module.key} 
                  icon={module.icon}
                  disabled={!module.unlocked}
                >
                  <Link to={`/student/sql/${module.key}`}>
                    {module.title}
                    {!module.unlocked && <LockOutlined style={{ marginLeft: 8 }} />}
                    <Badge 
                      count={`${module.completed}/${module.exercises}`} 
                      style={{ 
                        backgroundColor: module.completed === module.exercises ? '#52c41a' : '#1890ff',
                        marginLeft: 8
                      }} 
                    />
                  </Link>
                </Menu.Item>
              ))}
            </Menu>
          </Card>
        </Col>
        <Col span={18}>
          <Row gutter={[16, 16]}>
            {modules.map(module => (
              <Col span={12} key={module.key}>
                <Card 
                  title={
                    <span>
                      {module.icon} {module.title}
                      {!module.unlocked && 
                        <LockOutlined style={{ marginLeft: 8, color: '#f5222d' }} />
                      }
                    </span>
                  }
                  hoverable={module.unlocked}
                  style={{ 
                    opacity: module.unlocked ? 1 : 0.7,
                    cursor: module.unlocked ? 'pointer' : 'not-allowed'
                  }}
                  onClick={() => {
                    if (module.unlocked) {
                      setSelectedModule(module.key);
                    }
                  }}
                >
                  <Paragraph>{module.description}</Paragraph>
                  <Progress 
                    percent={module.progress} 
                    status={module.progress === 100 ? "success" : "active"}
                    format={percent => `${percent}%`}
                  />
                  <div style={{ marginTop: 10 }}>
                    <Badge 
                      count={`${module.completed}/${module.exercises} completed`} 
                      style={{ 
                        backgroundColor: module.completed === module.exercises ? '#52c41a' : '#1890ff' 
                      }} 
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default StudentSQLCamp;