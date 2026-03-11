from __future__ import annotations

import operator as op
from typing import Any, Callable, Dict


class EvaluatorError(ValueError):
    """Raised when a condition cannot be evaluated safely."""


class Evaluator:
    _OPERATORS: Dict[str, Callable[[Any, Any], bool]] = {
        "==": op.eq,
        "!=": op.ne,
        ">": op.gt,
        ">=": op.ge,
        "<": op.lt,
        "<=": op.le,
    }

    _COMPARISON_ONLY = {">", ">=", "<", "<="}
    _BOOL_TRUE = {"true", "1", "yes", "y", "on"}
    _BOOL_FALSE = {"false", "0", "no", "n", "off"}

    @classmethod
    def evaluate(cls, left: Any, operator: str, right: Any) -> bool:
        """
        Evaluate a condition using a dynamic operator.

        Supported examples:
        - strings:  "rain" == "rain"
        - numbers:  75 > 70
        - booleans: True == true
        """
        if operator not in cls._OPERATORS:
            raise EvaluatorError(
                f"Unsupported operator '{operator}'. "
                f"Supported operators: {sorted(cls._OPERATORS.keys())}"
            )

        if operator in cls._COMPARISON_ONLY:
            left_num = cls._to_number(left)
            right_num = cls._to_number(right)
            return cls._OPERATORS[operator](left_num, right_num)

        # Equality operators support boolean, numeric, and string semantics.
        if cls._is_bool_like(left) and cls._is_bool_like(right):
            left_bool = cls._to_bool(left)
            right_bool = cls._to_bool(right)
            return cls._OPERATORS[operator](left_bool, right_bool)

        if cls._is_number_like(left) and cls._is_number_like(right):
            left_num = cls._to_number(left)
            right_num = cls._to_number(right)
            return cls._OPERATORS[operator](left_num, right_num)

        return cls._OPERATORS[operator](str(left), str(right))

    @classmethod
    def evaluate_condition(cls, actual_value: Any, condition: dict) -> bool:
        """
        Evaluate using a JSON condition object.

        Expected shape:
        {
            "operator": "==",
            "value": <string|number|boolean>
        }
        """
        if not isinstance(condition, dict):
            raise EvaluatorError("Condition must be a dictionary")

        operator = condition.get("operator")
        if not isinstance(operator, str):
            raise EvaluatorError("Condition must include a string 'operator' field")

        if "value" in condition:
            target = condition["value"]
        elif "threshold" in condition:
            # Backward-compatible alias for older payloads.
            target = condition["threshold"]
        else:
            raise EvaluatorError("Condition must include 'value' (or legacy 'threshold')")

        return cls.evaluate(actual_value, operator, target)

    @classmethod
    def _is_number_like(cls, value: Any) -> bool:
        if isinstance(value, bool):
            return False
        if isinstance(value, (int, float)):
            return True
        if isinstance(value, str):
            try:
                float(value)
                return True
            except ValueError:
                return False
        return False

    @classmethod
    def _to_number(cls, value: Any) -> float:
        if not cls._is_number_like(value):
            raise EvaluatorError(f"Value '{value}' is not numeric")
        return float(value)

    @classmethod
    def _is_bool_like(cls, value: Any) -> bool:
        if isinstance(value, bool):
            return True
        if isinstance(value, str):
            lowered = value.strip().lower()
            return lowered in cls._BOOL_TRUE or lowered in cls._BOOL_FALSE
        return False

    @classmethod
    def _to_bool(cls, value: Any) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in cls._BOOL_TRUE:
                return True
            if lowered in cls._BOOL_FALSE:
                return False
        raise EvaluatorError(f"Value '{value}' is not boolean")
