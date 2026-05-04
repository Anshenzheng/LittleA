import json
import os
from typing import Any, Dict, List, Optional


class ConfigManager:
    def __init__(self, config_file: str = None):
        if config_file is None:
            config_file = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                'config', 'default.json'
            )
        self.config_file = config_file
        self._config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return self._get_default_config()
        else:
            return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        return {
            "model": {
                "provider": "deepseek",
                "api_key": "",
                "base_url": "https://api.deepseek.com/v1",
                "model": "deepseek-chat",
                "temperature": 0.7,
                "max_tokens": 2048
            },
            "search": {
                "engine": "duckduckgo",
                "max_results": 10,
                "safe_search": True
            },
            "tasks": []
        }

    def _save_config(self) -> bool:
        try:
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self._config, f, ensure_ascii=False, indent=2)
            return True
        except IOError:
            return False

    def get_model_config(self) -> Dict[str, Any]:
        return self._config.get("model", {})

    def update_model_config(self, config: Dict[str, Any]) -> bool:
        self._config["model"] = {**self._config.get("model", {}), **config}
        return self._save_config()

    def get_search_config(self) -> Dict[str, Any]:
        return self._config.get("search", {})

    def update_search_config(self, config: Dict[str, Any]) -> bool:
        self._config["search"] = {**self._config.get("search", {}), **config}
        return self._save_config()

    def get_tasks(self) -> List[Dict[str, Any]]:
        return self._config.get("tasks", [])

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        tasks = self.get_tasks()
        for task in tasks:
            if task.get("id") == task_id:
                return task
        return None

    def add_task(self, task: Dict[str, Any]) -> Optional[str]:
        import uuid
        task_id = str(uuid.uuid4())
        task["id"] = task_id
        task["status"] = "active"
        task["created_at"] = self._get_current_time()
        task["updated_at"] = self._get_current_time()
        self._config["tasks"].append(task)
        if self._save_config():
            return task_id
        return None

    def update_task(self, task_id: str, updates: Dict[str, Any]) -> bool:
        tasks = self.get_tasks()
        for i, task in enumerate(tasks):
            if task.get("id") == task_id:
                self._config["tasks"][i] = {
                    **task,
                    **updates,
                    "updated_at": self._get_current_time()
                }
                return self._save_config()
        return False

    def delete_task(self, task_id: str) -> bool:
        tasks = self.get_tasks()
        for i, task in enumerate(tasks):
            if task.get("id") == task_id:
                del self._config["tasks"][i]
                return self._save_config()
        return False

    def pause_task(self, task_id: str) -> bool:
        return self.update_task(task_id, {"status": "paused"})

    def resume_task(self, task_id: str) -> bool:
        return self.update_task(task_id, {"status": "active"})

    def _get_current_time(self) -> str:
        from datetime import datetime
        return datetime.now().isoformat()


config_manager = ConfigManager()
