"""
Custom exceptions for the defensive investigation pipeline.
"""


class InvestigationException(Exception):
    """
    Base exception for all investigation pipeline errors.
    """
    def __init__(self, message: str, error_code: str = "INVESTIGATION_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code


class EmptyInvestigationError(InvestigationException):
    """
    Raised when an investigation is requested with zero timeline events.
    """
    def __init__(
        self,
        message: str = "Cannot run investigation on empty timeline events. Please submit at least one timeline event.",
    ):
        super().__init__(message=message, error_code="EMPTY_TIMELINE_EVENTS", status_code=400)


class OversizedInvestigationError(InvestigationException):
    """
    Raised when the submitted timeline events count exceeds system limits.
    """
    def __init__(
        self,
        message: str = "Timeline event count exceeds maximum allowed limit of 2000 events.",
    ):
        super().__init__(message=message, error_code="OVERSIZED_INVESTIGATION_REQUEST", status_code=400)


class MalformedInvestigationError(InvestigationException):
    """
    Raised when submitted events cannot be processed due to invalid structure.
    """
    def __init__(
        self,
        message: str = "Malformed timeline event payload.",
    ):
        super().__init__(message=message, error_code="MALFORMED_INVESTIGATION_REQUEST", status_code=400)
