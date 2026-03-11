class Evaluator:

    @staticmethod
    def evaluate(actual, operator, expected):

        if operator == ">":
            return actual > expected

        if operator == "<":
            return actual < expected

        if operator == ">=":
            return actual >= expected

        if operator == "<=":
            return actual <= expected

        if operator == "==":
            return actual == expected

        raise ValueError(f"Unsupported operator: {operator}")