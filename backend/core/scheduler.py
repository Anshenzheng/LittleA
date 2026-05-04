import threading
import time
import schedule
from typing import Dict, Any, Callable, Optional
from datetime import datetime
from .config_manager import config_manager
from .search_module import search_module
from .deepseek_client import deepseek_client


class TaskScheduler:
    def __init__(self):
        self.job_store: Dict[str, schedule.Job] = {}
        self.task_results: Dict[str, Dict[str, Any]] = {}
        self.running = False
        self._thread: Optional[threading.Thread] = None

    def start(self):
        if self.running:
            return
        self.running = True
        self._load_scheduled_tasks()
        self._thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self._thread.start()

    def stop(self):
        self.running = False
        schedule.clear()
        self.job_store.clear()

    def _run_scheduler(self):
        while self.running:
            schedule.run_pending()
            time.sleep(1)

    def _load_scheduled_tasks(self):
        tasks = config_manager.get_tasks()
        for task in tasks:
            if task.get("status") == "active":
                self._schedule_task(task)

    def _parse_cron_expression(self, cron_expr: str) -> Optional[Dict[str, str]]:
        parts = cron_expr.strip().split()
        if len(parts) < 5:
            return None

        return {
            'minute': parts[0],
            'hour': parts[1],
            'day': parts[2],
            'month': parts[3],
            'weekday': parts[4]
        }

    def _schedule_task(self, task: Dict[str, Any]):
        task_id = task.get("id")
        if not task_id:
            return

        if task_id in self.job_store:
            schedule.cancel_job(self.job_store[task_id])

        cron_expr = task.get("cron_expression", "")
        schedule_type = task.get("schedule_type", "daily")
        time_str = task.get("time", "09:00")

        job_func = self._create_task_function(task)

        if schedule_type == "daily":
            job = schedule.every().day.at(time_str).do(job_func)
        elif schedule_type == "hourly":
            job = schedule.every().hour.do(job_func)
        elif schedule_type == "weekly":
            day = task.get("weekday", "monday")
            weekday_map = {
                'monday': schedule.every().monday,
                'tuesday': schedule.every().tuesday,
                'wednesday': schedule.every().wednesday,
                'thursday': schedule.every().thursday,
                'friday': schedule.every().friday,
                'saturday': schedule.every().saturday,
                'sunday': schedule.every().sunday
            }
            job = weekday_map.get(day, schedule.every().monday).at(time_str).do(job_func)
        else:
            job = schedule.every().day.at(time_str).do(job_func)

        self.job_store[task_id] = job

    def _create_task_function(self, task: Dict[str, Any]) -> Callable:
        def task_function():
            task_id = task.get("id")
            query = task.get("query", "")

            if not query:
                return

            try:
                search_results = search_module.search(query)
                if search_results:
                    summary = deepseek_client.search_and_summarize(query, search_results)
                    self.task_results[task_id] = {
                        "task_id": task_id,
                        "query": query,
                        "results": search_results,
                        "summary": summary,
                        "timestamp": datetime.now().isoformat(),
                        "status": "success"
                    }
                else:
                    self.task_results[task_id] = {
                        "task_id": task_id,
                        "query": query,
                        "results": [],
                        "summary": "未找到相关搜索结果。",
                        "timestamp": datetime.now().isoformat(),
                        "status": "no_results"
                    }
            except Exception as e:
                self.task_results[task_id] = {
                    "task_id": task_id,
                    "query": query,
                    "results": [],
                    "summary": f"执行任务时发生错误: {str(e)}",
                    "timestamp": datetime.now().isoformat(),
                    "status": "error",
                    "error": str(e)
                }

        return task_function

    def add_task_schedule(self, task: Dict[str, Any]):
        if task.get("status") == "active":
            self._schedule_task(task)

    def remove_task_schedule(self, task_id: str):
        if task_id in self.job_store:
            schedule.cancel_job(self.job_store[task_id])
            del self.job_store[task_id]

    def pause_task(self, task_id: str):
        self.remove_task_schedule(task_id)

    def resume_task(self, task_id: str):
        task = config_manager.get_task(task_id)
        if task:
            self._schedule_task(task)

    def execute_task_immediately(self, task_id: str) -> Optional[Dict[str, Any]]:
        task = config_manager.get_task(task_id)
        if not task:
            return None

        task_func = self._create_task_function(task)
        task_func()

        return self.task_results.get(task_id)

    def get_task_result(self, task_id: str) -> Optional[Dict[str, Any]]:
        return self.task_results.get(task_id)

    def get_all_task_results(self) -> Dict[str, Dict[str, Any]]:
        return self.task_results


task_scheduler = TaskScheduler()
