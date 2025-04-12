import React from 'react';
import { Typography, Tabs } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import DynamicSQLQuery from '../components/layout/DynamicSQLQuery';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const StudentSQLCamp = () => {
  return (
      <div style={{ padding: '20px' }}>
        <Title level={2}>Dynamic SQL Query</Title>
        <Paragraph>
          Use the interactive SQL editor below to practice writing and executing SQL queries dynamically.
        </Paragraph>

        <Tabs defaultActiveKey="1">
          <TabPane tab="Dynamic SQL Query" key="1" icon={<CodeOutlined />}>
            <DynamicSQLQuery />
          </TabPane>
        </Tabs>
      </div>
  );
};

export default StudentSQLCamp;