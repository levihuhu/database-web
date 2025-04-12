import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Card, 
  Input, 
  Button, 
  Space, 
  Divider, 
  Table, 
  Alert, 
  Spin,
  Steps,
  Tooltip,
  Tag,
  Row,
  Col,
  message
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  DatabaseOutlined,
  CodeOutlined,
  SendOutlined,
  LeftOutlined,
  RightOutlined,
  InfoCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import apiClient from '../../services/api';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const SQLExercise = () => {
  const { courseId, moduleId, exerciseId } = useParams();
  const navigate = useNavigate();
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exerciseData, setExerciseData] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(null);

  useEffect(() => {
    const fetchExerciseDetails = async () => {
      if (!exerciseId) return; 

      setLoading(true);
      setFeedback(null);
      setIsCorrect(null);
      setScore(null);
      setUserAnswer('');

      try {
        const response = await apiClient.get(`/api/student/exercises/${exerciseId}/`);
        
        if (response.data.status === 'success') {
          let fetchedExercise = response.data.data;

          let parsedSchema = [];
          if (fetchedExercise.table_schema && typeof fetchedExercise.table_schema === 'string') {
            try {
              parsedSchema = JSON.parse(fetchedExercise.table_schema);
              if (!Array.isArray(parsedSchema)) {
                console.warn(`Parsed schema for exercise ${fetchedExercise.exercise_id} is not an array:`, parsedSchema);
                parsedSchema = [];
              }
            } catch (e) {
              console.error(`Failed to parse tableSchema for exercise ${fetchedExercise.exercise_id}:`, e);
              parsedSchema = [];
            }
          } else if (Array.isArray(fetchedExercise.table_schema)) {
            parsedSchema = fetchedExercise.table_schema;
          }
          fetchedExercise.tableSchema = parsedSchema;

          setExerciseData(fetchedExercise);
        } else {
          message.error(response.data.message || '获取练习详情失败');
          setExerciseData(null);
        }
      } catch (error) {
        console.error('Failed to fetch exercise details:', error);
        const errorMsg = error.response?.data?.message || '加载练习失败，请检查网络或稍后重试';
        message.error(errorMsg);
        setExerciseData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchExerciseDetails();
  }, [exerciseId]);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      message.warning('请输入您的 SQL 答案');
      return;
    }
    
    setLoading(true);
    setFeedback(null);
    setIsCorrect(null);
    setScore(null);
    
    try {
      const response = await apiClient.post(
        `/api/student/exercises/${exerciseId}/submit/`,
        { answer: userAnswer }
      );

      if (response.data.status === 'success') {
        const result = response.data.data;
        setIsCorrect(result.is_correct);
        setScore(result.score);
        const feedbackMsg = result.is_correct 
                            ? (result.message || '回答正确！恭喜！') 
                            : (result.message || '回答错误，请仔细检查 SQL 语句或逻辑。');
        setFeedback(feedbackMsg);
        message.success('答案已提交');
      } else {
        const errorMsg = response.data.message || '提交失败，请稍后重试';
        setFeedback(errorMsg);
        message.error(errorMsg);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      const errorMsg = error.response?.data?.message || '提交时发生错误，请检查网络或联系管理员';
      setFeedback(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}><Spin size="large" /></div>;
  }

  if (!exerciseData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Alert 
          message="错误"
          description="无法加载练习详情，请返回上一页重试。"
          type="error" 
          showIcon 
        />
        <Button style={{ marginTop: 16 }} onClick={() => navigate(-1)}>返回</Button>
      </div>
    );
  }

  const { 
    title, 
    description, 
    hint, 
    difficulty, 
    tableSchema,
    module_name, 
    course_name 
  } = exerciseData;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: 16 }}>
        <Button 
          icon={<LeftOutlined />} 
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </div>

      <Card title={
        <Space>
          <DatabaseOutlined />
          <span>{title}</span>
          <Tag color={
            difficulty === 'Easy' ? 'green' : 
            difficulty === 'Medium' ? 'blue' : 'red'
          }>
            {difficulty}
          </Tag>
          {course_name && module_name && (
            <Text type="secondary">{course_name} / {module_name}</Text>
          )}
        </Space>
      }>
        <Paragraph>{description}</Paragraph>
        
        {hint && (
          <Tooltip title="View Hint">
            <Button 
              icon={<InfoCircleOutlined />} 
              style={{ marginBottom: 16 }}
              onClick={() => {
                message.info(hint, 5);
              }}
            >
              Hint
            </Button>
          </Tooltip>
        )}

        <Divider orientation="left">Database Schema</Divider>
        <Row gutter={[16, 16]}>
          {Array.isArray(tableSchema) && tableSchema.length > 0 ? (
            tableSchema.map((table, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card 
                  size="small" 
                  title={<Text strong>{table.name}</Text>}
                  style={{ marginBottom: 16, height: '100%' }}
                  styles={{ body: { padding: '8px 12px' } }}
                >
                  {Array.isArray(table.columns) ? (
                    <ul style={{ paddingLeft: 16, margin: 0, listStyle: 'none' }}>
                      {table.columns.map((col, colIndex) => {
                        const colName = typeof col === 'string' ? col : col.name;
                        const colType = typeof col === 'string' ? '' : col.type || '';
                        return (
                          <li key={colIndex}>
                            <Space>
                              <Text code>{colName}</Text>
                              {colType && <Text type="secondary">({colType})</Text>}
                            </Space>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <Text type="secondary">No columns defined.</Text>
                  )}
                </Card>
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Text type="secondary">No schema information available.</Text>
            </Col>
          )}
        </Row>

        <Divider orientation="left">Your Answer</Divider>
        <TextArea
          rows={6}
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Write your SQL query here..."
          style={{ marginBottom: 16, fontFamily: 'monospace' }} 
        />
        <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            type="primary" 
            icon={<SendOutlined />} 
            onClick={handleSubmit} 
            loading={loading}
            disabled={!userAnswer.trim()}
          >
            Submit Answer
          </Button>
        </Space>

        {feedback && (
          <Alert
            message={isCorrect ? "Correct!" : "Incorrect"}
            description={feedback}
            type={isCorrect ? "success" : "error"}
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
        {score !== null && (
           <Alert
            message={<Space><TrophyOutlined /> Score</Space>}
            description={`Your score for this exercise: ${score}`}
            type="info"
            showIcon
            style={{ marginTop: 16 }}
           />
        )}

      </Card>
    </div>
  );
};

export default SQLExercise;