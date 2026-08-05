"""Unit and API integration tests for CSV Upload endpoint and UploadService."""

import io
import unittest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.upload_service import UploadService


class TestUploadEndpoint(unittest.TestCase):
    """Test suite for UploadService and POST /upload API route."""

    def setUp(self):
        """Set up TestClient."""
        self.client = TestClient(app)

    def test_upload_service_valid_csv(self):
        """Test UploadService validation with a valid CSV file."""
        service = UploadService()
        dummy_file = MagicMock()
        dummy_file.filename = "test_transactions.csv"

        result = service.validate_and_process_upload(dummy_file)

        self.assertEqual(result["filename"], "test_transactions.csv")
        self.assertEqual(result["status"], "File uploaded successfully.")
        self.assertEqual(result["next_step"], "Ready for preprocessing.")

    def test_post_upload_valid_csv(self):
        """Test POST /upload/ with a valid CSV file upload."""
        csv_content = b"Date,Cash_In,Cash_Out\n2026-08-01,100,50\n"
        files = {"file": ("data.csv", io.BytesIO(csv_content), "text/csv")}

        response = self.client.post("/upload/", files=files)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["filename"], "data.csv")
        self.assertEqual(data["status"], "File uploaded successfully.")
        self.assertEqual(data["next_step"], "Ready for preprocessing.")

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
