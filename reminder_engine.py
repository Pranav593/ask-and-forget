# reminder_engine.py

import time
import logging
from typing import Dict, Any, List

from database import db
from data_route import route
from evaluator import Evaluator
from google.cloud.firestore import FieldFilter


logging.basicConfig(level=logging.INFO)


class ReminderEngine:

    POLL_INTERVAL = 60  # seconds

    # ----------------------------
    # Database
    # ----------------------------

    @staticmethod
    def get_active_reminders() -> List[Dict[str, Any]]:
        docs = (
            db.collection("reminders")
            .where(filter=FieldFilter("is_active", "==", True))
            .stream()
        )

        reminders = []

        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            reminders.append(data)

        return reminders

    # ----------------------------
    # Engine Loop
    # ----------------------------

    @classmethod
    def run(cls):
        logging.info("Reminder Engine started")

        while True:
            try:
                cls.run_cycle()
            except Exception as e:
                logging.error(f"Engine cycle failed: {e}")

            time.sleep(cls.POLL_INTERVAL)

    @classmethod
    def run_cycle(cls):
        reminders = cls.get_active_reminders()

        logging.info(f"Processing {len(reminders)} reminders")

        for reminder in reminders:
            cls.process_reminder(reminder)

    # ----------------------------
    # Reminder Processing
    # ----------------------------

    @classmethod
    def process_reminder(cls, reminder: Dict[str, Any]):

        try:

            trigger_type = reminder.get("trigger_type")
            location = reminder.get("location")

            payload = {}

            if trigger_type == "weather.current":
                payload["city"] = location

            if trigger_type == "stock.price":
                payload["symbol"] = location

            if trigger_type == "time.now":
                payload["timezone"] = location

            # ----------------------------
            # Fetch data from router
            # ----------------------------

            response = route(trigger_type, payload)

            if not response.get("ok"):
                logging.error(
                    f"Router failed for reminder {reminder['id']}: {response['error']}"
                )
                return

            data = response["data"]
            logging.info(f"Data fetched for reminder {reminder['id']}: {data}")

            # ----------------------------
            # Extract metric
            # ----------------------------

            # Map common/generic metric names to actual data keys
            METRIC_ALIASES = {
                "temperature": "temp_f",
                "temp": "temp_f",
                "temp_fahrenheit": "temp_f",
                "feels_like": "feels_like_f",
                "feels_like_temperature": "feels_like_f",
                "wind": "wind_mph",
                "wind_speed": "wind_mph",
                "weather_description": "description",
                "weather_code": "code",
                "stock_price": "price",
            }

            condition = reminder.get("condition", {})

            metric = condition.get("metric")
            # Resolve aliases
            metric = METRIC_ALIASES.get(metric, metric)
            operator = condition.get("operator")
            expected_value = condition.get("value")

            actual_value = data.get(metric)

            if actual_value is None:
                logging.warning(
                    f"Metric '{metric}' not found in data for reminder {reminder['id']}. "
                    f"Available keys: {list(data.keys())}"
                )
                return

            # ----------------------------
            # Evaluate condition
            # ----------------------------

            result = Evaluator.evaluate(
                actual_value,
                operator,
                expected_value
            )

            logging.info(
                f"Reminder {reminder['id']}: {metric} {operator} {expected_value} => "
                f"actual={actual_value}, triggered={result}"
            )

            if result:
                cls.trigger_reminder(reminder)

        except Exception as e:

            logging.error(
                f"Error processing reminder {reminder.get('id')}: {e}"
            )

    # ----------------------------
    # Trigger Action
    # ----------------------------

    @staticmethod
    def trigger_reminder(reminder: Dict[str, Any]):

        reminder_id = reminder["id"]

        logging.info(f"Reminder triggered: {reminder_id}")

        # Update Firestore
        db.collection("reminders").document(reminder_id).update({
            "lastTriggeredAt": int(time.time())
        })

        # TODO: send notification/email/push