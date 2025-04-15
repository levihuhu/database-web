import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Typography, Card, Spin, Alert, Button, Space, Tag, Divider, Row, Col,Tooltip, } from 'antd';
import { DatabaseOutlined, CodeOutlined, LeftOutlined, EditOutlined } from '@ant-design/icons';
import apiClient from '../../services/api';

const { Title, Paragraph, Text } = Typography;

const InstructorExerciseView = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExerciseDetail = async () => {
      if (!exerciseId) {
        setError('Exercise ID is missing.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/api/instructor/exercises/${exerciseId}/`);
        // Parse tableSchema if it's a string
        let fetchedExercise = response.data;
         if (fetchedExercise.tableSchema && typeof fetchedExercise.tableSchema === 'string') {
             try { fetchedExercise.tableSchema = JSON.parse(fetchedExercise.tableSchema); }
             catch (e) { console.error("Failed to parse schema", e); fetchedExercise.tableSchema = []; }
         } else if (!Array.isArray(fetchedExercise.tableSchema)) {
             fetchedExercise.tableSchema = []; // Default to empty array if not string or array
         }
        setExercise(fetchedExercise);
      } catch (err) {
        console.error('Failed to fetch exercise details:', err);
        setError(err.response?.data?.error || 'Failed to load exercise details.');
      } finally {
        setLoading(false);
      }
    };
    fetchExerciseDetail();
  }, [exerciseId]);

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}><Spin size="large" /></div>;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon style={{ margin: '20px' }} />;
  }

  if (!exercise) {
    return <Alert message="Exercise not found" type="warning" showIcon style={{ margin: '20px' }} />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <Space style={{ marginBottom: 16 }}>
         {/* Link back to the module's exercise list or all exercises */}
         <Button
            icon={<LeftOutlined />}
            onClick={() => navigate(exercise.moduleId ? `/teacher/modules/${exercise.moduleId}/exercises` : '/teacher/sql-exercises')}
         >
            Back to Exercises
         </Button>
         {/* Optional: Link to edit this exercise */}
         <Link to={`/teacher/sql-exercises`}> {/* Adjust if edit happens elsewhere */}
            <Button icon={<EditOutlined />}>Edit Exercise</Button>
         </Link>
      </Space>

      <Card title={
        <Space>
          <CodeOutlined />
          <span>{exercise.title}</span>
           <Tag color={exercise.difficulty === 'Easy' ? 'green' : exercise.difficulty === 'Medium' ? 'blue' : 'red'}>
              {exercise.difficulty}
           </Tag>
        </Space>
      }>
        <Title level={5}>Module</Title>
        <Paragraph>
          <Link to={`/teacher/modules/${exercise.moduleId}/exercises`}>{exercise.module || `ID: ${exercise.moduleId}`}</Link>
           (Course: {exercise.course || 'N/A'})
        </Paragraph>

        <Divider />
        <Title level={5}>Description</Title>
        <Paragraph>{exercise.description}</Paragraph>

        {exercise.hint && (
           <>
             <Divider />
             <Title level={5}>Hint</Title>
             <Paragraph>{exercise.hint}</Paragraph>
           </>
        )}

        <Divider />
        <Title level={5}>Expected Answer (SQL)</Title>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <code>{exercise.expectedAnswer}</code>
        </pre>

        <Divider />
        <Title level={5}>Database Schema</Title>
        <Row gutter={[16, 16]}>
           {Array.isArray(exercise.tableSchema) && exercise.tableSchema.length > 0 ? (
             exercise.tableSchema.map((table, index) => (
               <Col span={12} key={index}>
                 <Card size="small" title={<Text strong>{table.name}</Text>} style={{ marginBottom: 16 }}>
                   {Array.isArray(table.columns) && table.columns.length > 0 ? (
                     <ul style={{ paddingLeft: 20, margin: 0 }}>
                       {table.columns.map((column, idx) => <li key={idx}>{column}</li>)}
                     </ul>
                   ) : <Text type="secondary">No columns defined.</Text>}
                 </Card>
               </Col>
             ))
           ) : (
              <Col span={24}><Text type="secondary">No schema information provided.</Text></Col>
           )}
        </Row>
      </Card>
    </div>
  );
};

export default InstructorExerciseView;
