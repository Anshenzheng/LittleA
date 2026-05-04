import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  TimePicker,
  Tag,
  message,
  Popconfirm,
  List,
  Descriptions,
  Divider,
  Space,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PauseOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dayjs from 'dayjs';
import { taskAPI } from '../services/api';

const { TextArea } = Input;
const { Option } = Select;

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [currentResult, setCurrentResult] = useState(null);
  const [form] = Form.useForm();
  const [isEdit, setIsEdit] = useState(false);
  const [executingTaskId, setExecutingTaskId] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await taskAPI.getAll();
      if (response.success) {
        setTasks(response.data || []);
      }
    } catch (error) {
      message.error('获取任务列表失败');
      console.error('Fetch tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = () => {
    setIsEdit(false);
    setCurrentTask(null);
    form.resetFields();
    form.setFieldsValue({
      schedule_type: 'daily',
      weekday: 'monday',
    });
    setModalVisible(true);
  };

  const handleEdit = (task) => {
    setIsEdit(true);
    setCurrentTask(task);
    form.setFieldsValue({
      name: task.name,
      query: task.query,
      time: task.time ? dayjs(task.time, 'HH:mm') : null,
      schedule_type: task.schedule_type,
      weekday: task.weekday,
      description: task.description,
    });
    setModalVisible(true);
  };

  const handleDelete = async (taskId) => {
    try {
      const response = await taskAPI.delete(taskId);
      if (response.success) {
        message.success('任务删除成功');
        fetchTasks();
      }
    } catch (error) {
      message.error('任务删除失败');
      console.error('Delete task error:', error);
    }
  };

  const handlePause = async (taskId) => {
    try {
      const response = await taskAPI.pause(taskId);
      if (response.success) {
        message.success('任务已暂停');
        fetchTasks();
      }
    } catch (error) {
      message.error('暂停任务失败');
      console.error('Pause task error:', error);
    }
  };

  const handleResume = async (taskId) => {
    try {
      const response = await taskAPI.resume(taskId);
      if (response.success) {
        message.success('任务已恢复');
        fetchTasks();
      }
    } catch (error) {
      message.error('恢复任务失败');
      console.error('Resume task error:', error);
    }
  };

  const handleExecute = async (task) => {
    setExecutingTaskId(task.id);
    try {
      const response = await taskAPI.execute(task.id);
      if (response.success) {
        message.success('任务执行完成');
        setCurrentResult(response.data);
        setResultModalVisible(true);
        fetchTasks();
      }
    } catch (error) {
      message.error('任务执行失败');
      console.error('Execute task error:', error);
    } finally {
      setExecutingTaskId(null);
    }
  };

  const handleViewResult = (task) => {
    if (task.last_result) {
      setCurrentResult(task.last_result);
      setResultModalVisible(true);
    } else {
      message.info('该任务暂无执行结果');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const taskData = {
        name: values.name,
        query: values.query,
        time: values.time ? values.time.format('HH:mm') : '09:00',
        schedule_type: values.schedule_type,
        weekday: values.weekday,
        description: values.description,
      };

      if (isEdit && currentTask) {
        const response = await taskAPI.update(currentTask.id, taskData);
        if (response.success) {
          message.success('任务更新成功');
          setModalVisible(false);
          fetchTasks();
        }
      } else {
        const response = await taskAPI.create(taskData);
        if (response.success) {
          message.success('任务创建成功');
          setModalVisible(false);
          fetchTasks();
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      active: { color: 'green', text: '运行中' },
      paused: { color: 'orange', text: '已暂停' },
      completed: { color: 'blue', text: '已完成' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getScheduleTypeText = (type) => {
    const typeMap = {
      daily: '每天',
      weekly: '每周',
      hourly: '每小时',
    };
    return typeMap[type] || type;
  };

  const getWeekdayText = (day) => {
    const dayMap = {
      monday: '周一',
      tuesday: '周二',
      wednesday: '周三',
      thursday: '周四',
      friday: '周五',
      saturday: '周六',
      sunday: '周日',
    };
    return dayMap[day] || day;
  };

  return (
    <div>
      <Card
        title="任务列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建任务
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <RocketOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>暂无任务</p>
            <p>点击"新建任务"创建您的第一个定时搜集任务</p>
          </div>
        ) : (
          <List
            dataSource={tasks}
            renderItem={(task) => (
              <List.Item
                className="task-card"
                style={{
                  border: '1px solid #e8e8e8',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                }}
                actions={[
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewResult(task)}
                    disabled={!task.last_result}
                  >
                    查看结果
                  </Button>,
                  <Button
                    type="text"
                    icon={<RocketOutlined />}
                    onClick={() => handleExecute(task)}
                    loading={executingTaskId === task.id}
                  >
                    立即执行
                  </Button>,
                  task.status === 'active' ? (
                    <Button type="text" icon={<PauseOutlined />} onClick={() => handlePause(task.id)}>
                      暂停
                    </Button>
                  ) : (
                    <Button type="text" icon={<PlayCircleOutlined />} onClick={() => handleResume(task.id)}>
                      恢复
                    </Button>
                  ),
                  <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(task)}>
                    编辑
                  </Button>,
                  <Popconfirm
                    title="确定要删除这个任务吗？"
                    onConfirm={() => handleDelete(task.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span style={{ fontSize: 16, fontWeight: 500 }}>{task.name}</span>
                      {getStatusTag(task.status)}
                    </Space>
                  }
                  description={
                    <div>
                      <p style={{ margin: '8px 0' }}>
                        <strong>搜索关键词：</strong>
                        {task.query}
                      </p>
                      <p style={{ margin: '8px 0' }}>
                        <strong>执行时间：</strong>
                        {getScheduleTypeText(task.schedule_type)}
                        {task.schedule_type === 'weekly' && ` ${getWeekdayText(task.weekday)}`}
                        {task.schedule_type !== 'hourly' && ` ${task.time}`}
                      </p>
                      {task.description && (
                        <p style={{ margin: '8px 0', color: '#666' }}>
                          <strong>描述：</strong>
                          {task.description}
                        </p>
                      )}
                      {task.last_result && (
                        <p style={{ margin: '8px 0', color: '#1890ff' }}>
                          上次执行：{dayjs(task.last_result.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                        </p>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title={isEdit ? '编辑任务' : '新建任务'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="例如：每日 AI 新闻搜集" />
          </Form.Item>

          <Form.Item
            name="query"
            label="搜索关键词"
            rules={[{ required: true, message: '请输入搜索关键词' }]}
          >
            <Input placeholder="例如：AI 新闻 最新" />
          </Form.Item>

          <Form.Item
            name="schedule_type"
            label="执行频率"
            rules={[{ required: true, message: '请选择执行频率' }]}
          >
            <Select>
              <Option value="daily">每天</Option>
              <Option value="weekly">每周</Option>
              <Option value="hourly">每小时</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.schedule_type !== currentValues.schedule_type
            }
          >
            {({ getFieldValue }) => {
              const scheduleType = getFieldValue('schedule_type');
              if (scheduleType === 'weekly') {
                return (
                  <Form.Item
                    name="weekday"
                    label="执行日期"
                    rules={[{ required: true, message: '请选择执行日期' }]}
                  >
                    <Select>
                      <Option value="monday">周一</Option>
                      <Option value="tuesday">周二</Option>
                      <Option value="wednesday">周三</Option>
                      <Option value="thursday">周四</Option>
                      <Option value="friday">周五</Option>
                      <Option value="saturday">周六</Option>
                      <Option value="sunday">周日</Option>
                    </Select>
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.schedule_type !== currentValues.schedule_type
            }
          >
            {({ getFieldValue }) => {
              const scheduleType = getFieldValue('schedule_type');
              if (scheduleType !== 'hourly') {
                return (
                  <Form.Item
                    name="time"
                    label="执行时间"
                    rules={[{ required: true, message: '请选择执行时间' }]}
                  >
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item name="description" label="任务描述">
            <TextArea rows={3} placeholder="请输入任务描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="任务执行结果"
        open={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setResultModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {currentResult && (
          <div>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="查询关键词">{currentResult.query}</Descriptions.Item>
              <Descriptions.Item label="执行时间">
                {dayjs(currentResult.timestamp).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="执行状态">
                <Tag color={currentResult.status === 'success' ? 'green' : 'red'}>
                  {currentResult.status === 'success' ? '成功' : '失败'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider>执行摘要</Divider>

            <div className="markdown-content" style={{ maxHeight: 400, overflow: 'auto' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentResult.summary || '无执行结果'}
              </ReactMarkdown>
            </div>

            {currentResult.results && currentResult.results.length > 0 && (
              <>
                <Divider>搜索来源</Divider>
                <List
                  size="small"
                  dataSource={currentResult.results}
                  renderItem={(result, index) => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${index + 1}. ${result.title || '无标题'}`}
                        description={
                          <div>
                            <p style={{ margin: 0, color: '#666' }}>
                              {result.snippet || '无摘要'}
                            </p>
                            {result.link && (
                              <a href={result.link} target="_blank" rel="noopener noreferrer">
                                {result.link}
                              </a>
                            )}
                            {result.source && (
                              <Tag style={{ marginTop: 4 }}>{result.source}</Tag>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default TasksPage;
