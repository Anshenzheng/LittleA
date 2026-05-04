from flask import Blueprint, request, jsonify
from core.deepseek_client import deepseek_client
from core.search_module import search_module

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/send', methods=['POST'])
def send_message():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': '请求数据无效'}), 400
    
    messages = data.get('messages', [])
    if not messages:
        return jsonify({'success': False, 'message': '消息列表不能为空'}), 400
    
    try:
        response = deepseek_client.chat(messages)
        return jsonify({
            'success': True,
            'data': {
                'response': response
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'聊天请求失败: {str(e)}'}), 500


@chat_bp.route('/search', methods=['POST'])
def search_and_summarize():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': '请求数据无效'}), 400
    
    query = data.get('query', '')
    if not query:
        return jsonify({'success': False, 'message': '搜索查询不能为空'}), 400
    
    try:
        search_results = search_module.search(query)
        if search_results:
            summary = deepseek_client.search_and_summarize(query, search_results)
            return jsonify({
                'success': True,
                'data': {
                    'query': query,
                    'results': search_results,
                    'summary': summary
                }
            })
        else:
            return jsonify({
                'success': True,
                'data': {
                    'query': query,
                    'results': [],
                    'summary': '未找到相关搜索结果。'
                }
            })
    except Exception as e:
        return jsonify({'success': False, 'message': f'搜索失败: {str(e)}'}), 500


@chat_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'data': {
            'status': 'healthy',
            'message': '智能助理服务运行正常'
        }
    })
