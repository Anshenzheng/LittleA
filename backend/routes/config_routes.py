from flask import Blueprint, request, jsonify
from core.config_manager import config_manager

config_bp = Blueprint('config', __name__)


@config_bp.route('/model', methods=['GET'])
def get_model_config():
    config = config_manager.get_model_config()
    return jsonify({
        'success': True,
        'data': {
            **{k: v for k, v in config.items() if k != 'api_key'},
            'api_key_configured': bool(config.get('api_key'))
        }
    })


@config_bp.route('/model', methods=['PUT'])
def update_model_config():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': '请求数据无效'}), 400

    current_config = config_manager.get_model_config()
    
    updates = {}
    for key, value in data.items():
        if key == 'api_key':
            if value and value.strip():
                updates[key] = value.strip()
            elif key not in current_config:
                updates[key] = ''
        else:
            updates[key] = value

    if not updates:
        return jsonify({
            'success': True,
            'message': '配置无变化',
            'data': {
                **{k: v for k, v in config_manager.get_model_config().items() if k != 'api_key'},
                'api_key_configured': bool(config_manager.get_model_config().get('api_key'))
            }
        })

    success = config_manager.update_model_config(updates)
    if success:
        return jsonify({
            'success': True,
            'message': '模型配置已更新',
            'data': {
                **{k: v for k, v in config_manager.get_model_config().items() if k != 'api_key'},
                'api_key_configured': bool(config_manager.get_model_config().get('api_key'))
            }
        })
    return jsonify({'success': False, 'message': '配置更新失败'}), 500


@config_bp.route('/search', methods=['GET'])
def get_search_config():
    config = config_manager.get_search_config()
    return jsonify({
        'success': True,
        'data': config
    })


@config_bp.route('/search', methods=['PUT'])
def update_search_config():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': '请求数据无效'}), 400

    success = config_manager.update_search_config(data)
    if success:
        return jsonify({
            'success': True,
            'message': '搜索配置已更新',
            'data': config_manager.get_search_config()
        })
    return jsonify({'success': False, 'message': '配置更新失败'}), 500


@config_bp.route('/all', methods=['GET'])
def get_all_config():
    model_config = config_manager.get_model_config()
    search_config = config_manager.get_search_config()
    
    return jsonify({
        'success': True,
        'data': {
            'model': {
                **{k: v for k, v in model_config.items() if k != 'api_key'},
                'api_key_configured': bool(model_config.get('api_key'))
            },
            'search': search_config
        }
    })
