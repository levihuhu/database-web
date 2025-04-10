import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Table, 
  Typography, 
  Spin, 
  Select, 
  Tabs,
  Progress,
  Button,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  TrophyOutlined, 
  FrownOutlined, 
  CheckCircleOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Color configuration
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [needAttention, setNeedAttention] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [completionRate, setCompletionRate] = useState([]);
  const [trendData, setTrendData] = useState([]);

  // Mock data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock statistics data
        const mockStats = {
          averageScore: 78.5,
          highestScore: 98,
          lowestScore: 45,
          completionCount: 87,
          totalStudents: 120,
          totalAssignments: 15,
          improvementRate: 12.3,
        };
        
        // Mock recent assignments data
        const mockAssignments = [
          { id: 1, name: 'Math Midterm Test', dueDate: '2023-10-15', completionRate: 92, averageScore: 76 },
          { id: 2, name: 'Physics Lab Report', dueDate: '2023-10-10', completionRate: 85, averageScore: 82 },
          { id: 3, name: 'English Reading Comprehension', dueDate: '2023-10-05', completionRate: 95, averageScore: 79 },
          { id: 4, name: 'History Essay', dueDate: '2023-09-30', completionRate: 78, averageScore: 74 },
          { id: 5, name: 'Chemistry Quiz', dueDate: '2023-09-25', completionRate: 90, averageScore: 81 },
        ];
        
        // Mock top students data
        const mockTopStudents = [
          { id: '202301', name: 'John Smith', averageScore: 95, trend: 'up', improvement: 3.2 },
          { id: '202315', name: 'Emma Johnson', averageScore: 93, trend: 'stable', improvement: 0.5 },
          { id: '202342', name: 'Michael Brown', averageScore: 91, trend: 'up', improvement: 2.1 },
          { id: '202327', name: 'Sophia Davis', averageScore: 90, trend: 'down', improvement: -1.2 },
          { id: '202309', name: 'William Wilson', averageScore: 89, trend: 'up', improvement: 4.5 },
        ];
        
        // Mock students needing attention data
        const mockNeedAttention = [
          { id: '202356', name: 'Oliver Taylor', averageScore: 52, issue: 'Declining grades', trend: 'down', change: -8.5 },
          { id: '202318', name: 'Ava Martinez', averageScore: 58, issue: 'Incomplete assignments', trend: 'down', change: -5.2 },
          { id: '202333', name: 'James Anderson', averageScore: 61, issue: 'Low attendance', trend: 'down', change: -3.7 },
          { id: '202322', name: 'Charlotte Thomas', averageScore: 59, issue: 'Low class participation', trend: 'stable', change: -0.5 },
          { id: '202347', name: 'Benjamin Harris', averageScore: 55, issue: 'Multiple failing subjects', trend: 'down', change: -7.1 },
        ];
        
        // Mock grade distribution data
        const mockGradeDistribution = [
          { range: '90-100', count: 15, percentage: 12.5 },
          { range: '80-89', count: 35, percentage: 29.2 },
          { range: '70-79', count: 42, percentage: 35.0 },
          { range: '60-69', count: 18, percentage: 15.0 },
          { range: '0-59', count: 10, percentage: 8.3 },
        ];
        
        // Mock subject performance data
        const mockSubjectPerformance = [
          { subject: 'Math', averageScore: 76, highestScore: 98, lowestScore: 45, passRate: 85 },
          { subject: 'Language', averageScore: 82, highestScore: 96, lowestScore: 55, passRate: 92 },
          { subject: 'English', averageScore: 79, highestScore: 97, lowestScore: 48, passRate: 88 },
          { subject: 'Physics', averageScore: 74, highestScore: 95, lowestScore: 42, passRate: 80 },
          { subject: 'Chemistry', averageScore: 77, highestScore: 94, lowestScore: 50, passRate: 86 },
        ];
        
        // Mock completion rate data
        const mockCompletionRate = [
          { name: 'Completed', value: 87 },
          { name: 'Incomplete', value: 33 },
        ];
        
        // Mock trend data
        const mockTrendData = [
          { month: 'Sep', averageScore: 72, completionRate: 80 },
          { month: 'Oct', averageScore: 75, completionRate: 82 },
          { month: 'Nov', averageScore: 73, completionRate: 85 },
          { month: 'Dec', averageScore: 78, completionRate: 88 },
          { month: 'Jan', averageScore: 76, completionRate: 84 },
          { month: 'Feb', averageScore: 79, completionRate: 87 },
        ];
        
        setStats(mockStats);
        setRecentAssignments(mockAssignments);
        setTopStudents(mockTopStudents);
        setNeedAttention(mockNeedAttention);
        setGradeDistribution(mockGradeDistribution);
        setSubjectPerformance(mockSubjectPerformance);
        setCompletionRate(mockCompletionRate);
        setTrendData(mockTrendData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedClass, selectedSubject]);

  const handleClassChange = (value) => {
    setSelectedClass(value);
  };

  const handleSubjectChange = (value) => {
    setSelectedSubject(value);
  };

  // Table column configuration
  const assignmentColumns = [
    {
      title: 'Assignment Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
    },
    {
      title: 'Completion Rate',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (rate) => `${rate}%`,
    },
    {
      title: 'Average Score',
      dataIndex: 'averageScore',
      key: 'averageScore',
    },
  ];

  const topStudentColumns = [
    {
      title: 'Student ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Average Score',
      dataIndex: 'averageScore',
      key: 'averageScore',
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend, record) => (
        <span>
          {trend === 'up' ? (
            <ArrowUpOutlined style={{ color: '#52c41a' }} />
          ) : trend === 'down' ? (
            <ArrowDownOutlined style={{ color: '#f5222d' }} />
          ) : (
            <span>-</span>
          )}
          {' '}
          {record.improvement > 0 ? '+' : ''}{record.improvement}%
        </span>
      ),
    },
  ];

  const needAttentionColumns = [
    {
      title: 'Student ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Average Score',
      dataIndex: 'averageScore',
      key: 'averageScore',
    },
    {
      title: 'Issue',
      dataIndex: 'issue',
      key: 'issue',
      render: (issue) => (
        <Text type="danger">
          <ExclamationCircleOutlined /> {issue}
        </Text>
      ),
    },
    {
      title: 'Change',
      dataIndex: 'change',
      key: 'change',
      render: (change) => (
        <Text type="danger">
          {change}%
        </Text>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4}>Instructor Dashboard</Title>
                <Text type="secondary">Welcome back, Mr. Smith! Here's the latest data for your classes.</Text>
              </Col>
              <Col>
                <Row gutter={16}>
                  <Col>
                    <Select
                      style={{ width: 120 }}
                      placeholder="Select Class"
                      defaultValue="all"
                      onChange={handleClassChange}
                    >
                      <Option value="all">All Classes</Option>
                      <Option value="class1">Grade 10 (1)</Option>
                      <Option value="class2">Grade 10 (2)</Option>
                      <Option value="class3">Grade 10 (3)</Option>
                    </Select>
                  </Col>
                  <Col>
                    <Select
                      style={{ width: 120 }}
                      placeholder="Select Subject"
                      defaultValue="all"
                      onChange={handleSubjectChange}
                    >
                      <Option value="all">All Subjects</Option>
                      <Option value="math">Math</Option>
                      <Option value="chinese">Language</Option>
                      <Option value="english">English</Option>
                      <Option value="physics">Physics</Option>
                      <Option value="chemistry">Chemistry</Option>
                    </Select>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Statistics cards */}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={stats.averageScore}
              precision={1}
              valueStyle={{ color: '#3f8600' }}
              prefix={<BarChartOutlined />}
              suffix="pts"
            />
            <Text type="secondary">Overall class performance</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Highest Score"
              value={stats.highestScore}
              precision={1}
              valueStyle={{ color: '#faad14' }}
              prefix={<TrophyOutlined />}
              suffix="pts"
            />
            <Text type="secondary">Top student performance</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Lowest Score"
              value={stats.lowestScore}
              precision={1}
              valueStyle={{ color: '#cf1322' }}
              prefix={<FrownOutlined />}
              suffix="pts"
            />
            <Text type="secondary">Needs attention</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completion Count"
              value={stats.completionCount}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CheckCircleOutlined />}
              suffix={`/${stats.totalStudents}`}
            />
            <Progress 
              percent={Math.round((stats.completionCount / stats.totalStudents) * 100)} 
              size="small" 
              status="active" 
            />
          </Card>
        </Col>

        {/* Grade distribution chart */}
        <Col xs={24} md={12}>
          <Card title="Grade Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="count" name="Student Count" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="percentage" name="Percentage" fill="#82ca9d" unit="%" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Completion rate pie chart */}
        <Col xs={24} md={12}>
          <Card title="Assignment Completion">
            <Row>
              <Col span={12}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={completionRate}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {completionRate.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Col>
              <Col span={12}>
                <div style={{ padding: '20px' }}>
                  <Statistic 
                    title="Completion Rate" 
                    value={Math.round((stats.completionCount / stats.totalStudents) * 100)} 
                    suffix="%" 
                    valueStyle={{ color: '#3f8600' }}
                  />
                  <Divider />
                  <Statistic 
                    title="Total Assignments" 
                    value={stats.totalAssignments} 
                    valueStyle={{ fontSize: '20px' }}
                  />
                  <Statistic 
                    title="Improvement Rate" 
                    value={stats.improvementRate} 
                    precision={1}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<ArrowUpOutlined />}
                    suffix="%"
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Trend chart */}
        <Col span={24}>
          <Card title="Score and Completion Rate Trends">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="averageScore" name="Average Score" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="completionRate" name="Completion Rate" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Student performance tables */}
        <Col span={24}>
          <Card>
            <Tabs defaultActiveKey="1">
              <TabPane tab="Recent Assignments" key="1">
                <Table 
                  columns={assignmentColumns} 
                  dataSource={recentAssignments} 
                  rowKey="id" 
                  pagination={false}
                />
              </TabPane>
              <TabPane tab="Top Students" key="2">
                <Table 
                  columns={topStudentColumns} 
                  dataSource={topStudents} 
                  rowKey="id" 
                  pagination={false}
                />
              </TabPane>
              <TabPane tab="Needs Attention" key="3">
                <Table 
                  columns={needAttentionColumns} 
                  dataSource={needAttention} 
                  rowKey="id" 
                  pagination={false}
                />
              </TabPane>
              <TabPane tab="Subject Performance" key="4">
                <Table 
                  columns={[
                    { title: 'Subject', dataIndex: 'subject', key: 'subject' },
                    { title: 'Average Score', dataIndex: 'averageScore', key: 'averageScore' },
                    { title: 'Highest Score', dataIndex: 'highestScore', key: 'highestScore' },
                    { title: 'Lowest Score', dataIndex: 'lowestScore', key: 'lowestScore' },
                    { title: 'Pass Rate', dataIndex: 'passRate', key: 'passRate', render: (rate) => `${rate}%` },
                  ]} 
                  dataSource={subjectPerformance} 
                  rowKey="subject" 
                  pagination={false}
                />
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherDashboard;