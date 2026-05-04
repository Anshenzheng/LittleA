from flask import Blueprint, request, jsonify
from core.config_manager import config_manager
from core.scheduler import task_scheduler

task_bp = Blueprint('task', __name__)


@task_bp.route('/', methods=['GET'])
def get_tasks():
    tasks = config_manager.get_tasks()
    results = task_scheduler.get_all_task_results()
    
    for task in tasks:
        if task['id'] in results:
            task['last_result'] = results[task['id']]
        else:
            task['last_result'] = None
    
    return jsonify({
        'success': True,
        'data': tasks
    })


@task_bp.route('/<task_id>', methods=['GET'])
def get_task(task_id):
    task = config_manager.get_task(task_id)
    if not task:
        return jsonify({'success': False, 'message': '任务不存在'}), 404
    
    result = task_scheduler.get_task_result(task_id)
    if result:
        task['last_result'] = result
    
    return jsonify({
        'success': True,
        'data': task
    })


@task_bp.route('/', methods=['POST'])
def create_task():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': '请求数据无效'}), 400
    
    required_fields = ['name', 'query', 'time']
    for field in required_fields:
        if field not in data:
            return jsonify({'success': False, 'message': f'缺少必填字段: {field}'}), 400
    
    task_data = {
        'name': data.get('name'),
        'query': data.get('query'),
        'time': data.get('time'),
        'schedule_type': data.get('schedule_type', 'daily'),
        'weekday': data.get('weekday', 'monday'),
        'description': data.get('description', '')
    }
    
    task_id = config_manager.add_task(task_data)
    if task_id:
        task = config_manager.get_task(task_id)
        task_scheduler.add_task_schedule(task)
        return jsonify({
            'success': True,
            'message': '任务创建成功',
            'data': task
        }), 201
    
    return jsonify({'success': False, 'message': '任务创建失败'}), 500


@task_bp.route('/<task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': '请求数据无效'}), 400
    
    allowed_fields = ['name', 'query', 'time', 'schedule_type', 'weekday', 'description']
    updates = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not updates:
        return jsonify({'success': False, 'message': '没有可更新的字段'}), 400
    
    success = config_manager.update_task(task_id, updates)
    if success:
        task = config_manager.get_task(task_id)
        task_scheduler.remove_task_schedule(task_id)
        if task.get('status') == 'active':
            task_scheduler.add_task_schedule(task)
        return jsonify({
            'success': True,
            'message': '任务更新成功',
            'data': task
        })
    
    return jsonify({'success': False, 'message': '任务更新失败或任务不存在'}), 404


@task_bp.route('/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    task_scheduler.remove_task_schedule(task_id)
    success = config_manager.delete_task(task_id)
    
    if success:
        return jsonify({
            'success': True,
            'message': '任务删除成功'
        })
    
    return jsonify({'success': False, 'message': '任务删除失败或任务不存在'}), 404


@task_bp.route('/<task_id>/pause', methods=['POST'])
def pause_task(task_id):
    success = config_manager.pause_task(task_id)
    if success:
        task_scheduler.pause_task(task_id)
        return jsonify({
            'success': True,
            'message': '任务已暂停',
            'data': config_manager.get_task(task_id)
        })
    
    return jsonify({'success': False, 'message': '任务暂停失败或任务不存在'}), 404


@task_bp.route('/<task_id>/resume', methods=['POST'])
def resume_task(task_id):
    success = config_manager.resume_task(task_id)
    if success:
        task_scheduler.resume_task(task_id)
        return jsonify({
            'success': True,
            'message': '任务已恢复',
            'data': config_manager.get_task(task_id)
        })
    
    return jsonify({'success': False, 'message': '任务恢复失败或任务不存在'}), 404


@task_bp.route('/<task_id>/execute', methods=['POST'])
def execute_task_immediately(task_id):
    result = task_scheduler.execute_task_immediately(task_id)
    if result:
        return jsonify({
            'success': True,
            'message': '任务执行完成',
            'data': result
        })
    
    return jsonify({'success': False, 'message': '任务执行失败或任务不存在'}), 404


@task_bp.route('/<task_id>/result', methods=['GET'])
def get_task_result(task_id):
    result = task_scheduler.get_task_result(task_id)
    if result:
        return jsonify({
            'success': True,
            'data': result
        })
    
    return jsonify({'success': False, 'message': '未找到任务结果'}), 404
