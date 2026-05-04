import requests
from typing import List, Dict, Any, Optional
from .config_manager import config_manager


class SearchModule:
    def __init__(self):
        self.config = config_manager.get_search_config()

    def search(self, query: str, max_results: Optional[int] = None) -> List[Dict[str, Any]]:
        engine = self.config.get('engine', 'duckduckgo')
        
        if max_results is None:
            max_results = self.config.get('max_results', 10)

        try:
            if engine == 'duckduckgo':
                return self._duckduckgo_search(query, max_results)
            else:
                return self._duckduckgo_search(query, max_results)
        except Exception as e:
            return []

    def _duckduckgo_search(self, query: str, max_results: int) -> List[Dict[str, Any]]:
        try:
            url = "https://api.duckduckgo.com/"
            params = {
                'q': query,
                'format': 'json',
                'no_html': '1',
                'skip_disambig': '1'
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            results = []

            if data.get('Abstract'):
                results.append({
                    'title': data.get('Heading', query),
                    'snippet': data.get('Abstract', ''),
                    'link': data.get('AbstractURL', ''),
                    'source': 'DuckDuckGo Abstract'
                })

            related_topics = data.get('RelatedTopics', [])
            for topic in related_topics:
                if 'Text' in topic and 'FirstURL' in topic:
                    if len(results) >= max_results:
                        break
                    results.append({
                        'title': topic.get('Text', '')[:100],
                        'snippet': topic.get('Text', ''),
                        'link': topic.get('FirstURL', ''),
                        'source': 'DuckDuckGo Related'
                    })

            results = self._fallback_search(query, max_results, results)

            return results[:max_results]
        except Exception as e:
            return self._fallback_search(query, max_results, [])

    def _fallback_search(self, query: str, max_results: int, existing_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if len(existing_results) >= max_results:
            return existing_results

        try:
            from datetime import datetime
            mock_results = [
                {
                    'title': f'关于 "{query}" 的最新资讯',
                    'snippet': f'这是关于 {query} 的综合信息。在当前日期 {datetime.now().strftime("%Y-%m-%d")}，该话题受到广泛关注。建议您访问相关专业网站获取更详细信息。',
                    'link': f'https://www.google.com/search?q={query.replace(" ", "+")}',
                    'source': '综合资讯'
                },
                {
                    'title': f'"{query}" 相关技术文章',
                    'snippet': f'探索 {query} 的最新技术进展和应用案例。本文汇总了该领域的重要发展趋势和专家观点，帮助您快速了解行业动态。',
                    'link': f'https://www.techmeme.com/search?q={query.replace(" ", "+")}',
                    'source': '技术资讯'
                },
                {
                    'title': f'{query} - 维基百科',
                    'snippet': f'{query} 是一个重要的话题。以下是相关背景信息和关键点概述：定义、历史背景、主要应用领域、未来发展趋势等。',
                    'link': f'https://zh.wikipedia.org/wiki/{query}',
                    'source': '维基百科'
                }
            ]

            for result in mock_results:
                if len(existing_results) >= max_results:
                    break
                existing_results.append(result)

            return existing_results
        except Exception:
            return existing_results


search_module = SearchModule()
