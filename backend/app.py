import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify
from flask_cors import CORS

from routes.config_routes import config_bp
from routes.task_routes import task_bp
from routes.chat_routes import chat_bp
from core.scheduler import task_scheduler

app = Flask(__name__)
CORS(app)

app.register_blueprint(config_bp, url_prefix='/api/config')
app.register_blueprint(task_bp, url_prefix='/api/tasks')
app.register_blueprint(chat_bp, url_prefix='/api/chat')


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'success': True,
        'data': {
            'status': 'running',
            'message': '个人智能助理服务运行正常'
        }
    })


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': '请求的资源不存在'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': '服务器内部错误'
    }), 500


def create_app():
    task_scheduler.start()
    return app


if __name__ == '__main__':
    task_scheduler.start()
    print("个人智能助理服务启动中...")
    print("API 地址: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
