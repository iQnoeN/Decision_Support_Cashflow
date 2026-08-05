"""Unit and API integration tests for UploadService and POST /upload inference pipeline."""

import io
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.services.upload_service import UploadService


class TestUploadPipeline(unittest.TestCase):
    """Test suite for UploadService and POST /upload API route."""

    def setUp(self):
        """Set up TestClient and test paths."""
        self.client = TestClient(app)
        self.project_root = Path(__file__).resolve().parents[2]
        self.sample_csv_path = self.project_root / "ml" / "data" / "raw" / "bank_statements.csv"

    def test_post_upload_valid_raw_bank_statement_csv(self):
        """Test POST /upload/ with actual raw bank statements CSV."""
        if not self.sample_csv_path.exists():
            self.skipTest("Sample raw bank_statements.csv not found")

        with open(self.sample_csv_path, "rb") as f:
            files = {"file": ("bank_statements.csv", f, "text/csv")}
            response = self.client.post("/upload/", files=files)

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("predicted_cashflow", data)
        self.assertIn("liquidity_score", data)
        self.assertIn("risk", data)
        self.assertIn("recommendations", data)
        self.assertIsInstance(data["predicted_cashflow"], float)
        self.assertIsInstance(data["liquidity_score"], float)
        self.assertIsInstance(data["risk"], str)
        self.assertIsInstance(data["recommendations"], list)

    def test_post_upload_invalid_extension(self):
        """Test POST /upload/ with an invalid file extension (.pdf)."""
        pdf_content = b"%PDF-1.4 dummy content"
        files = {"file": ("document.pdf", io.BytesIO(pdf_content), "application/pdf")}

        response = self.client.post("/upload/", files=files)

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("Invalid file type", data["detail"])


if __name__ == "__main__":
    unittest.main()
