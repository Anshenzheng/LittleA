import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  message,
  Switch,
  Divider,
  Space,
  Alert,
} from 'antd';
import { SaveOutlined, ReloadOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { configAPI } from '../services/api';

const { Option } = Select;
const { TextArea, Password } = Input;

function ConfigPage() {
  const [modelForm] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await configAPI.getAll();
      if (response.success) {
        const { model, search } = response.data;
        modelForm.setFieldsValue(model);
        searchForm.setFieldsValue(search);
      }
    } catch (error) {
      message.error('获取配置失败');
      console.error('Fetch configs error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSaveModelConfig = async () => {
    try {
      const values = await modelForm.validateFields();
      setSaving(true);

      const response = await configAPI.updateModelConfig(values);
      if (response.success) {
        message.success('模型配置保存成功');
      } else {
        message.error(response.message || '保存失败');
      }
    } catch (error) {
      console.error('Save model config error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSearchConfig = async () => {
    try {
      const values = await searchForm.validateFields();
      setSaving(true);

      const response = await configAPI.updateSearchConfig(values);
      if (response.success) {
        message.success('搜索配置保存成功');
      } else {
        message.error(response.message || '保存失败');
      }
    } catch (error) {
      console.error('Save search config error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <Alert
        message="配置说明"
        description="请正确配置以下参数以确保系统正常运行。模型 API Key 是必需的，用于调用 DeepSeek 大语言模型。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card
        title="模型配置"
        loading={loading}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchConfigs}>
              刷新
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveModelConfig} loading={saving}>
              保存
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Form form={modelForm} layout="vertical" initialValues={{ provider: 'deepseek' }}>
          <Form.Item name="provider" label="模型提供商">
            <Select disabled>
              <Option value="deepseek">DeepSeek</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="api_key"
            label="API Key"
            rules={[{ required: true, message: '请输入 API Key' }]}
            extra="请访问 https://platform.deepseek.com/ 获取 API Key"
          >
            <Input.Search
              placeholder="请输入 API Key"
              type={showApiKey ? 'text' : 'password'}
              enterButton={
                <Button onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </Button>
              }
              onSearch={() => {}}
            />
          </Form.Item>

          <Form.Item
            name="base_url"
            label="API 地址"
            rules={[{ required: true, message: '请输入 API 地址' }]}
          >
            <Input placeholder="https://api.deepseek.com/v1" />
          </Form.Item>

          <Form.Item
            name="model"
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Select>
              <Option value="deepseek-chat">deepseek-chat</Option>
              <Option value="deepseek-coder">deepseek-coder</Option>
            </Select>
          </Form.Item>

          <Form.Item name="temperature" label="温度 (Temperature)">
            <InputNumber
              min={0}
              max={2}
              step={0.1}
              style={{ width: 200 }}
              placeholder="0.7"
            />
            <span style={{ marginLeft: 16, color: '#666' }}>
              较低的值使输出更确定，较高的值使输出更随机
            </span>
          </Form.Item>

          <Form.Item name="max_tokens" label="最大生成长度 (Max Tokens)">
            <InputNumber
              min={1}
              max={128000}
              step={1}
              style={{ width: 200 }}
              placeholder="2048"
            />
            <span style={{ marginLeft: 16, color: '#666' }}>
              单次响应的最大 token 数量
            </span>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title="搜索配置"
        loading={loading}
        extra={
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveSearchConfig} loading={saving}>
            保存
          </Button>
        }
      >
        <Form form={searchForm} layout="vertical" initialValues={{ safe_search: true }}>
          <Form.Item name="engine" label="搜索引擎">
            <Select>
              <Option value="duckduckgo">DuckDuckGo</Option>
              <Option value="google">Google (需配置 API)</Option>
              <Option value="bing">Bing (需配置 API)</Option>
            </Select>
          </Form.Item>

          <Form.Item name="max_results" label="最大搜索结果数">
            <InputNumber
              min={1}
              max={50}
              step={1}
              style={{ width: 200 }}
              placeholder="10"
            />
            <span style={{ marginLeft: 16, color: '#666' }}>
              每次搜索返回的最大结果数量
            </span>
          </Form.Item>

          <Form.Item name="safe_search" label="安全搜索" valuePropName="checked">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            <span style={{ marginLeft: 16, color: '#666' }}>
              开启后将过滤成人内容
            </span>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      <Card title="使用提示">
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <strong>API Key 配置：</strong>
            请确保在模型配置中填写有效的 DeepSeek API Key，否则无法使用聊天和搜索摘要功能。
          </li>
          <li>
            <strong>任务创建：</strong>
            前往"任务中心"可以创建定时搜索任务，系统将在指定时间自动搜索并整理成报告。
          </li>
          <li>
            <strong>立即执行：</strong>
            在任务列表中点击"立即执行"可以立即运行某个任务，查看执行效果。
          </li>
          <li>
            <strong>配置保存：</strong>
            修改配置后请点击"保存"按钮，配置将保存到本地文件中。
          </li>
        </ul>
      </Card>
    </div>
  );
}

export default ConfigPage;
