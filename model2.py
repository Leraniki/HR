import os
import json
import numpy as np
from openai import OpenAI
from typing import List, Dict, Any, Optional

from flask import Flask, request, jsonify

API_KEY = "sk-Sou5qWmNeBPhIf6LYSnfsw" 
BASE_URL = "https://llm.t1v.scibox.tech/v1"  
CHAT_MODEL = "Qwen2.5-72B-Instruct-AWQ"
EMBEDDING_MODEL = "bge-m3"


client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
class MockDB:
    """
    Класс-заглушка для имитации работы с реальной базой данных.
    """
    def get_employee_summary(self, employee_id: int):
        print(f"[DB] Запрос сводки по сотруднику ID: {employee_id}")
        return {"name": "Иван Иванов", "position": "ML Engineer", "level": "Middle", "experience_years": 3}
    
    def get_employee_skills(self, employee_id: int):
        print(f"[DB] Запрос навыков сотрудника ID: {employee_id}")
        return {"hard_skills": ["Python", "PyTorch", "Docker", "SQL"], "soft_skills": ["communication", "teamwork"]}

    def get_employee_projects(self, employee_id: int):
        print(f"[DB] Запрос проектов сотрудника ID: {employee_id}")
        return [{"name": "Проект 'Альфа'", "role": "Разработчик ML-моделей", "description": "Разрабатывал модели кредитного скоринга."}]

    def check_profile_completeness(self, employee_id: int):
        print(f"[DB] Проверка полноты профиля ID: {employee_id}")
        return {"completeness_percent": 80, "missing_fields": ["certifications", "publications"]}

    def find_learning_courses(self, keywords: List[str], level: Optional[str] = None):
        print(f"[DB] Поиск курсов по ключевым словам: {keywords}, уровень: {level}")
        if "kubernetes" in [k.lower() for k in keywords]:
            return [{"name": "Kubernetes для продвинутых", "duration_hours": 40, "level": "advanced"}]
        if "devops" in [k.lower() for k in keywords]:
             return [{"name": "Основы DevOps для инженеров", "duration_hours": 60, "level": "middle"}]
        return []
    
    def get_available_technologies(self, category: Optional[str] = None):
        return ["Python", "Go", "Kubernetes", "Docker", "Terraform", "PyTorch", "TensorFlow", "PostgreSQL"]

    def filter_employees_by_criteria(self, criteria: dict):
        # Моковая фильтрация
        print(f"[DB] Фильтрация сотрудников по критериям: {criteria}")
        return [1, 2, 3, 4, 5]

    def get_employee_profile(self, employee_id: int):
        """
        Вспомогательная функция для потока менеджера, собирает полный профиль.
        """
        print(f"[DB] Сбор полного профиля для ID: {employee_id}")
        return {
            "id": employee_id,
            "summary": self.get_employee_summary(employee_id),
            "skills": self.get_employee_skills(employee_id),
            "projects": self.get_employee_projects(employee_id)
        }
    


EMPLOYEE_SYSTEM_PROMPT = """
Ты — 'Career Architect AI', эмпатичный и опытный HR-консультант. Твоя миссия — построить для сотрудника персонализированный и достижимый план карьерного развития.

Твой рабочий процесс:
1. Анализ Запроса: Внимательно изучи запрос сотрудника.
2. Сбор Данных: Используй инструменты, чтобы получить полную картину о сотруднике.
3. Формирование Ответа: Когда вся информация собрана, сформируй развернутый ответ.

ПРАВИЛА ВЫЗОВА ИНСТРУМЕНТОВ:
1. Если для ответа на запрос пользователя тебе нужна информация, твой следующий ответ должен быть ТОЛЬКО JSON-объектом.
2. Никогда не предваряй JSON-объект никаким текстом, пояснениями или приветствиями.
3. Твой ответ должен начинаться с символа `{` и заканчиваться символом `}`. Ничего другого в ответе быть не должно.

ПЛОХОЙ ПРИМЕР (ТАК ДЕЛАТЬ НЕЛЬЗЯ):
Конечно, я помогу! Вот JSON для получения данных:
{
  "tool_name": "get_employee_summary",
  "parameters": {}
}

ХОРОШИЙ ПРИМЕР (ТАК НУЖНО ДЕЛАТЬ):
{
  "tool_name": "get_employee_summary",
  "parameters": {}
}

Если тебе больше не нужно вызывать инструменты и у тебя достаточно информации, дай развернутый ответ пользователю в свободной форме.

Доступные инструменты:
1. get_employee_summary(employee_id: int)
   Описание: Получить краткую сводку по сотруднику: должность, уровень, опыт.
   Пример вызова: {"tool_name": "get_employee_summary", "parameters": {"employee_id": 123}}

2. check_profile_completeness(employee_id: int)
   Описание: Проверить анкету сотрудника на полноту и найти незаполненные разделы.
   Пример вызова: {"tool_name": "check_profile_completeness", "parameters": {"employee_id": 123}}

3. get_employee_skills(employee_id: int)
   Описание: Получить полный стек технологий (hard skills) и мягких навыков (soft skills) сотрудника.
   Пример вызова: {"tool_name": "get_employee_skills", "parameters": {"employee_id": 123}}

4. get_employee_projects(employee_id: int)
   Описание: Получить информацию о проектах, в которых участвовал сотрудник.
   Пример вызова: {"tool_name": "get_employee_projects", "parameters": {"employee_id": 123}}

5. find_learning_courses(keywords: list[str], level: str = None)
   Описание: Найти обучающие курсы по ключевым словам и, опционально, по уровню сложности.
   Пример вызова: {"tool_name": "find_learning_courses", "parameters": {"keywords": ["Kubernetes", "DevOps"]}}

Правила общения:
- Никогда не выдумывай информацию.
- Общайся с сотрудником на "ты", будь дружелюбным, но профессиональным.
- Не отвечай на запрос пользователя по существу, пока не соберешь необходимые данные.
"""


class LLMProcessor:
    def __init__(self, client, db_instance):
        self.client = client
        self.db = db_instance

        self.available_tools = {
        "get_employee_summary": self.db.get_employee_summary,
        "get_employee_skills": self.db.get_employee_skills,
        "get_employee_projects": self.db.get_employee_projects,
        "check_profile_completeness": self.db.check_profile_completeness,
        "find_learning_courses": self.db.find_learning_courses,
        }

    def _create_embedding(self, text: str) -> np.ndarray:
        """Создает эмбеддинг для текста."""
        response = self.client.embeddings.create(
            input=[text],
            model=EMBEDDING_MODEL
        )
        return np.array(response.data[0].embedding)

    def _create_profile_document(self, profile: dict) -> str:
        # ... (код функции из пункта 1) ...
        summary = profile.get("summary", {})
        skills = profile.get("skills", {})
        projects = profile.get("projects", [])
        
        name = summary.get("name", "Неизвестный сотрудник")
        position = f"{summary.get('level', '')} {summary.get('position', '')}".strip()
        hard_skills = ", ".join(skills.get("hard_skills", []))
        
        project_texts = []
        for p in projects:
            p_desc = p.get('description', 'описание отсутствует')
            project_texts.append(f"участвовал(а) в проекте '{p.get('name', 'безымянный')}' в роли '{p.get('role', 'не указана')}', где {p_desc.lower()}")
        
        document = f"Сотрудник: {name}. Должность: {position}. Ключевые навыки: {hard_skills}. Опыт в проектах: {' '.join(project_texts)}"
        return document.strip()
    
    def handle_employee_query(self, user_query: str, employee_id: int, max_steps: int = 5):
        """
        Обрабатывает запрос от сотрудника (Поток 1: HR-консультант).
        Эмулирует ReAct/Tool Calling через промпты.
        """
        print("\n=== НАЧАЛО ОБРАБОТКИ ЗАПРОСА СОТРУДНИКА ===")
        messages = [
            {"role": "system", "content": EMPLOYEE_SYSTEM_PROMPT},
            {"role": "user", "content": user_query}
        ]
        
        for i in range(max_steps):
            print(f"\n--- Итерация #{i + 1} ---")
            
            response = self.client.chat.completions.create(
                model=CHAT_MODEL,
                messages=messages,
                temperature=0.1 # Низкая температура для предсказуемости вызова функций
            )

            response_content = response.choices[0].message.content
            #print(f"Ответ LLM: {response_content}")

            try:
                # Пытаемся распарсить ответ как JSON - это сигнал к вызову функции
                tool_call_request = json.loads(response_content)
                function_name = tool_call_request.get("tool_name")
                function_args = tool_call_request.get("parameters", {})

                if function_name in self.available_tools:
                    function_to_call = self.available_tools[function_name]
                    
                    # Всегда передаем ID текущего пользователя, если функция его требует
                    if "employee_id" in function_to_call.__code__.co_varnames:
                        function_args["employee_id"] = employee_id

                    print(f"Вызов функции: {function_name}({function_args})")
                    function_response = function_to_call(**function_args)
                    
                    # Добавляем в историю и запрос на вызов, и результат вызова
                    messages.append({"role": "assistant", "content": response_content})
                    messages.append({
                        "role": "user", # Используем роль user, чтобы передать результат обратно LLM
                        "content": f"Результат вызова инструмента '{function_name}':\n{json.dumps(function_response, ensure_ascii=False)}"
                    })
                else:
                    # Модель сгенерировала JSON, но с неизвестной функцией
                    print(f"Ошибка: LLM запросила неизвестную функцию '{function_name}'")
                    messages.append({"role": "assistant", "content": response_content})
                    messages.append({
                        "role": "user",
                        "content": f"Ошибка: инструмент с именем '{function_name}' не найден."
                    })

            except (json.JSONDecodeError, AttributeError):
                # Если парсинг не удался, значит это финальный текстовый ответ для пользователя
                print(">>> LLM сгенерировала финальный ответ. Завершение цикла.")
                return response_content
        
        print(">>> Достигнут лимит итераций. Генерируем финальный ответ на основе собранных данных.")
        final_response_generation = self.client.chat.completions.create(
            model=CHAT_MODEL,
            messages=messages + [{"role": "user", "content": "Пожалуйста, предоставь финальный ответ на основе уже собранной информации."}]
        )
        return final_response_generation.choices[0].message.content
    
    def handle_manager_query(self, manager_query: str, top_k: int = 5):
        """
        Обрабатывает запрос от менеджера (Поток 2: Поиск кандидатов) с гибридным подходом.
        """
        print("\n=== НАЧАЛО ОБРАБОТКИ ЗАПРОСА МЕНЕДЖЕРА ===")
        
        # Шаг 1: Структурируем запрос с помощью LLM
        print("1. Вызов LLM для структурирования запроса менеджера...")
        prompt_struct = f"""
        Извлеки из запроса менеджера структурированные критерии поиска.
        Доступные поля для извлечения: 
        - hard_skills (list[str]): конкретные технологии.
        - level (str): уровень ('Junior', 'Middle', 'Senior', 'Lead').
        - experience_min_years (int): минимальный опыт в годах.
        - project_keywords (list[str]): ключевые слова из описания проектов (например, 'финтех', 'скоринг', 'e-commerce').
        
        Верни только JSON объект. Не добавляй поля, которых нет в запросе.

        Запрос: "{manager_query}"
        """
        response_struct = self.client.chat.completions.create(
            model=CHAT_MODEL, messages=[{"role": "user", "content": prompt_struct}],
            temperature=0.0, response_format={"type": "json_object"} # Используем JSON mode, если модель поддерживает
        )
        try:
            criteria = json.loads(response_struct.choices[0].message.content)
            print(f"   - Структурированные критерии: {criteria}")
        except (json.JSONDecodeError, IndexError, TypeError):
            print("   - Не удалось извлечь структурированные критерии, пропускаем жесткую фильтрацию.")
            criteria = {}

        # Шаг 2: Жесткая фильтрация по критериям через БД
        print("2. Фильтрация кандидатов по жестким критериям...")
        filtered_ids = self.db.filter_employees_by_criteria(criteria)
        if not filtered_ids:
            return "По заданным жестким критериям не найдено ни одного сотрудника. Попробуйте смягчить запрос."
        print(f"   - Найдено кандидатов после фильтрации: {len(filtered_ids)}")

        # Шаг 3: Семантическое ранжирование (Векторный поиск)
        print("3. Ранжирование с помощью эмбеддингов...")
        
        # 3.1. Получаем эмбеддинг для запроса менеджера
        query_embedding = self._create_embedding(manager_query)
        
        # 3.2. Получаем профили и создаем эмбеддинги для отфильтрованных кандидатов
        candidate_profiles = [self.db.get_employee_profile(emp_id) for emp_id in filtered_ids]
        candidate_documents = [self._create_profile_document(p) for p in candidate_profiles]
        candidate_embeddings = np.array([self._create_embedding(doc) for doc in candidate_documents])
        
        # 3.3. Считаем косинусное сходство (скалярное произведение для нормализованных векторов)
        similarities = np.dot(candidate_embeddings, query_embedding.T)
        
        # 3.4. Находим топ-K лучших кандидатов
        top_indices = np.argsort(similarities)[::-1][:top_k]
        top_profiles = [candidate_profiles[i] for i in top_indices]
        top_ids = [p['id'] for p in top_profiles]
        print(f"   - Топ-{len(top_ids)} кандидатов после семантического ранжирования: {top_ids}")
        
        # Шаг 4: Финальный вызов LLM для подготовки отчета менеджеру
        print("4. Финальный вызов LLM для подготовки отчета...")
        MANAGER_SUMMARY_PROMPT = f"""
        Ты — ассистент руководителя, специализирующийся на подборе внутренних кадров. Твоя задача — предоставить четкий и аргументированный отчет.

        **Изначальный запрос менеджера:**
        <query>
        {manager_query}
        </query>

        **Найденные наиболее релевантные кандидаты:**
        <candidates>
        {json.dumps(top_profiles, indent=2, ensure_ascii=False)}
        </candidates>

        **Твоя задача:**
        Подготовь краткое саммари по каждому кандидату в формате маркированного списка. Для каждого кандидата:
        1.  **Имя и должность:** Укажи ФИО, текущую должность и уровень.
        2.  **Ключевое соответствие:** Одним-двумя предложениями опиши, почему этот кандидат — отличный выбор. Ссылайся на ключевые слова из запроса (например, "Идеально подходит благодаря прямому опыту в кредитном скоринге и отличному знанию PyTorch").
        3.  **Области для уточнения:** Если есть что-то, на что менеджеру стоит обратить внимание (например, "Стек почти полностью совпадает, но нет опыта с Kubernetes, который упоминался как желательный"), кратко укажи это. Если всё идеально, напиши "Полное соответствие запросу".
        4.  **Рекомендация:** Напиши четкую рекомендацию ("Рекомендуется к собеседованию в первую очередь", "Хороший кандидат, рекомендуется к рассмотрению").

        Отчет должен быть структурированным, профессиональным и легко читаемым. Начни с общего вывода, например: "На основе вашего запроса я подобрал(а) следующих наиболее подходящих кандидатов:".
        """
        final_response = self.client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[{"role": "user", "content": MANAGER_SUMMARY_PROMPT}]
        )
        return final_response.choices[0].message.content

  


# if __name__ == '__main__':
#     client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
#     db = MockDB()
    
#     processor = LLMProcessor(client, db )
    
#     # employee_query = "Привет, я стремлюсь стать senior mlops через 3 года. Сейчас я middle ml. Подскажи, что мне нужно изучить?"
#     # employee_response = processor.handle_employee_query(employee_query, employee_id=123)
#     # print("\n\n*** ОТВЕТ ДЛЯ СОТРУДНИКА ***")
#     # print(employee_response)
    
#     manager_query = "Ищу Python-разработчика уровня Middle+ с опытом в финтехе для работы над проектом кредитного скоринга."
#     manager_response = processor.handle_manager_query(manager_query)
#     print("\n\n*** ОТВЕТ ДЛЯ МЕНЕДЖЕРА ***")
#     print(manager_response)



app = Flask(__name__)


print("Инициализация API...")
client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
db = MockDB()
processor = LLMProcessor(client, db)
print("API готово к работе.")

@app.route('/chat', methods=['POST'])
def handle_chat():
    """
    Эта функция будет вызываться каждый раз, когда фронтенд отправляет
    запрос на адрес http://<адрес_сервера>/chat
    """
    # Получаем JSON данные, которые отправил фронтенд
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    user_query = data.get('query')
    user_role = data.get('role') # 'employee' или 'manager'
    user_id = data.get('userId', 123) # Получаем ID, если нет - ставим заглушку

    if not user_query or not user_role:
        return jsonify({"error": "Missing 'query' or 'role' in request"}), 400
        
    print(f"\n[API] Получен запрос от {user_role} (ID: {user_id}): '{user_query}'")

    try:
        if user_role == 'employee':
            response_text = processor.handle_employee_query(user_query, employee_id=user_id)
        elif user_role == 'manager':
            # Раскомментируй, когда допишешь логику для менеджера
            # response_text = processor.handle_manager_query(user_query)
            response_text = "Логика для менеджера еще не подключена." # Временная заглушка
        else:
            return jsonify({"error": "Invalid role specified"}), 400
            
        # Возвращаем ответ в формате JSON
        return jsonify({"response": response_text})

    except Exception as e:
        print(f"[API] Произошла ошибка: {e}")
        return jsonify({"error": "An internal error occurred"}), 500


# ===============================================================
# ШАГ 2.3: Запуск сервера
# ===============================================================

if __name__ == '__main__':
    # Запускаем веб-сервер. 
    # debug=True позволяет автоматически перезагружать сервер при изменениях в коде.
    # host='0.0.0.0' делает сервер доступным в локальной сети (полезно для хакатона).
    app.run(host='0.0.0.0', port=5000, debug=True)