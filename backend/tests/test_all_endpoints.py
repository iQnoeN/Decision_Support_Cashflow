"""Comprehensive automated test suite for all backend endpoints and error scenarios."""

import io
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app


class TestBackendEndpoints(unittest.TestCase):
    """Test suite covering root, health, predict, upload, and error validation endpoints."""

    def setUp(self):
        """Set up FastAPI TestClient and test paths."""
        self.client = TestClient(app)
        self.project_root = Path(__file__).resolve().parents[2]
        self.sample_csv_path = self.project_root / "ml" / "data" / "raw" / "bank_statements.csv"

        self.valid_predict_payload = {
            "cash_in": 1500.0,
            "cash_out": 1000.0,
            "end_balance": 5000.0,
            "transaction_count": 25,
            "lag_1": 450.0,
            "lag_7": 300.0,
            "rolling_mean_7": 400.0,
            "rolling_std_7": 150.0,
            "rolling_cashin_7": 10500.0,
            "rolling_cashout_7": 7000.0,
        }

    # 1. GET /
    def test_get_root(self):
        """Test GET / returns 200 OK and expected message."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertEqual(data["message"], "Backend is running successfully.")

    # 2. GET /health
    def test_get_health(self):
        """Test GET /health returns 200 OK and healthy status."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("service", data)
        self.assertIn("version", data)

    # 3. POST /predict
    def test_post_predict_success(self):
        """Test POST /predict/ returns complete prediction response payload."""
        response = self.client.post("/predict/", json=self.valid_predict_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("predicted_cashflow", data)
        self.assertIn("liquidity_score", data)
        self.assertIn("risk", data)
        self.assertIn("recommendations", data)

    # 4. POST /upload (Valid CSV)
    def test_post_upload_success(self):
        """Test POST /upload/ with a valid raw bank statements CSV."""
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

    # 5. Invalid CSV upload (Corrupted / Empty CSV)
    def test_post_upload_invalid_csv_content(self):
        """Test POST /upload/ with an empty/corrupted CSV file."""
        corrupted_content = b""
        files = {"file": ("empty.csv", io.BytesIO(corrupted_content), "text/csv")}
        response = self.client.post("/upload/", files=files)

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("detail", data)

    # 6. Missing required columns
    def test_post_upload_missing_columns(self):
        """Test POST /upload/ with a CSV that lacks required schema columns."""
        invalid_schema_csv = b"col1,col2,col3\n1,2,3\n"
        files = {"file": ("invalid_schema.csv", io.BytesIO(invalid_schema_csv), "text/csv")}
        response = self.client.post("/upload/", files=files)

        self.assertEqual(response.status_code, 400)
        data = response.json()
        detail_msg = data["detail"].lower()
        self.assertTrue("invalid csv schema" in detail_msg or "missing required columns" in detail_msg)

    # 7. Invalid file extension
    def test_post_upload_invalid_extension(self):
        """Test POST /upload/ with a non-CSV file extension (.pdf)."""
        pdf_content = b"%PDF-1.4 dummy content"
        files = {"file": ("document.pdf", io.BytesIO(pdf_content), "application/pdf")}
        response = self.client.post("/upload/", files=files)

        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("Invalid file type", data["detail"])


if __name__ == "__main__":
    unittest.main()
