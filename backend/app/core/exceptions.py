"""Excepciones de dominio. No conocen HTTP: el mapeo a status codes vive en error_handlers."""


class DomainError(Exception):
    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class NotFoundError(DomainError):
    """El recurso solicitado no existe."""


class InvalidReferenceError(DomainError):
    """El payload referencia otra entidad que no existe."""
