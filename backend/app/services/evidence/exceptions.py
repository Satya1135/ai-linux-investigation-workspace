"""
Custom exceptions for evidence intake and validation.
"""


class EvidenceException(Exception):
    """
    Base exception for all evidence intake errors.
    """
    def __init__(self, message: str, error_code: str = "EVIDENCE_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code


class UnsupportedExtensionError(EvidenceException):
    """
    Raised when an uploaded file has a disallowed or unsupported extension.
    """
    def __init__(self, message: str = "Unsupported file extension. Only .log and .txt files are permitted."):
        super().__init__(message=message, error_code="UNSUPPORTED_EXTENSION", status_code=400)


class OversizedEvidenceError(EvidenceException):
    """
    Raised when evidence size exceeds the 5 MB limit.
    """
    def __init__(self, message: str = "Evidence size exceeds the 5 MB limit."):
        super().__init__(message=message, error_code="OVERSIZED_EVIDENCE", status_code=413)


class EmptyEvidenceError(EvidenceException):
    """
    Raised when evidence input is empty or whitespace-only.
    """
    def __init__(self, message: str = "Evidence input cannot be empty."):
        super().__init__(message=message, error_code="EMPTY_EVIDENCE", status_code=400)


class BinaryEvidenceError(EvidenceException):
    """
    Raised when evidence contains binary content or null bytes.
    """
    def __init__(self, message: str = "Binary or non-text evidence rejected. Only plain text log files are allowed."):
        super().__init__(message=message, error_code="BINARY_EVIDENCE_REJECTED", status_code=400)


class SampleNotFoundError(EvidenceException):
    """
    Raised when a requested sample scenario cannot be located.
    """
    def __init__(self, message: str = "Sample evidence scenario not found."):
        super().__init__(message=message, error_code="SAMPLE_NOT_FOUND", status_code=404)


class MalformedEvidenceError(EvidenceException):
    """
    Raised when evidence cannot be parsed or safely normalized.
    """
    def __init__(self, message: str = "Malformed evidence input."):
        super().__init__(message=message, error_code="MALFORMED_EVIDENCE", status_code=400)
