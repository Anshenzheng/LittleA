import requests
from typing import List, Dict, Any, Optional
from .config_manager import config_manager


class DeepSeekClient:
    def __init__(self):
        pass

    def _get_config(self) -> Dict[str, Any]:
        return config_manager.get_model_config()

    def _get_headers(self) -> Dict[str, str]:
        config = self._get_config()
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config.get('api_key', '')}"
        }

    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        config = self._get_config()
        url = f"{config.get('base_url', 'https://api.deepseek.com/v1')}/chat/completions"
        
        payload = {
            "model": config.get('model', 'deepseek-chat'),
            "messages": messages,
            "temperature": temperature if temperature is not None else config.get('temperature', 0.7),
            "max_tokens": max_tokens if max_tokens is not None else config.get('max_tokens', 2048)
        }

        try:
            response = requests.post(
                url,
                headers=self._get_headers(),
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            data = response.json()
            return data['choices'][0]['message']['content']
        except requests.exceptions.RequestException as e:
            return f"请求错误: {str(e)}"
        except (KeyError, IndexError) as e:
            return f"响应解析错误: {str(e)}"

    def search_and_summarize(self, query: str, search_results: List[Dict[str, Any]]) -> str:
        context = "\n\n".join([
            f"标题: {result.get('title', '')}\n摘要: {result.get('snippet', '')}\n链接: {result.get('link', '')}"
            for result in search_results
        ])

        prompt = f"""请根据以下搜索结果，为查询 "{query}" 生成一份详细的摘要报告。

搜索结果：
{context}

请用 Markdown 格式输出，要求：
1. 标题清晰，层次分明
2. 提取关键信息，避免重复
3. 如有重要链接请保留
4. 语言简洁专业

请直接输出结果，不需要解释过程。"""

        messages = [
            {"role": "system", "content": "你是一个专业的信息整理助手，擅长从大量信息中提取关键内容并生成结构化报告。"},
            {"role": "user", "content": prompt}
        ]

        return self.chat(messages)


deepseek_client = DeepSeekClient()
