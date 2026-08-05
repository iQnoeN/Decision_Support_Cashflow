"""Logging utility for configuring standard application logging."""

import logging
import sys


def get_logger(name: str = "app") -> logging.Logger:
    """Retrieve and configure a standard logger instance."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger
