#!/usr/bin/env python3
"""
OCR Service for Alcohol Label Verification
Uses pytesseract to extract text from label images
"""

import re
from typing import Dict, List, Optional
from dataclasses import dataclass
import pytesseract
from PIL import Image
import io


@dataclass
class VerificationResult:
    """Result of label verification"""
    success: bool
    matches: Dict[str, bool]
    details: List[str]
    extracted_text: str


class LabelVerifier:
    """Verifies alcohol label information against form data"""
    
    def __init__(self):
        pass
    
    def extract_text_from_image(self, image_bytes: bytes) -> str:
        """
        Extract text from image using OCR
        
        Args:
            image_bytes: Image file bytes
            
        Returns:
            Extracted text string
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Use pytesseract to extract text
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            raise ValueError(f"Could not read text from the label image: {str(e)}")
    
    def normalize_text(self, text: str) -> str:
        """Normalize text for comparison (lowercase, remove extra spaces)"""
        return ' '.join(text.lower().split())
    
    def find_in_text(self, text: str, search_term: str) -> bool:
        """Check if search term exists in text (case-insensitive)"""
        normalized_text = self.normalize_text(text)
        normalized_search = self.normalize_text(search_term)
        return normalized_search in normalized_text
    
    def extract_alcohol_content(self, text: str) -> Optional[float]:
        """
        Extract alcohol content percentage from text
        Looks for patterns like "45%", "45% ABV", "45% Alc./Vol."
        """
        # Pattern to match alcohol percentage
        patterns = [
            r'(\d+(?:\.\d+)?)\s*%\s*(?:abv|alc|alcohol)',
            r'(\d+(?:\.\d+)?)\s*%',
            r'(\d+(?:\.\d+)?)\s*proof',  # Will convert proof to ABV
        ]
        
        text_lower = text.lower()
        
        for pattern in patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                value = float(matches[0])
                # Convert proof to ABV if needed (proof = 2 * ABV)
                if 'proof' in pattern:
                    value = value / 2
                return value
        
        return None
    
    def extract_volume(self, text: str) -> Optional[str]:
        """
        Extract volume/net contents from text
        Looks for patterns like "750 mL", "12 fl oz"
        """
        patterns = [
            r'(\d+(?:\.\d+)?\s*(?:ml|mL|milliliters?))',
            r'(\d+(?:\.\d+)?\s*(?:l|L|liters?))',
            r'(\d+(?:\.\d+)?\s*(?:fl\s*oz|fluid\s*ounces?))',
            r'(\d+(?:\.\d+)?\s*(?:oz|ounces?))',
        ]
        
        text_lower = text.lower()
        
        for pattern in patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            if matches:
                return matches[0].strip()
        
        return None
    
    def check_government_warning(self, text: str) -> bool:
        """Check if government warning text is present"""
        warning_keywords = ['government warning', 'surgeon general', 'pregnancy', 'health']
        text_lower = text.lower()
        
        # Check if at least 2 warning keywords are present
        found_keywords = sum(1 for keyword in warning_keywords if keyword in text_lower)
        return found_keywords >= 2
    
    def verify_label(
        self,
        image_bytes: bytes,
        brand_name: str,
        product_class: str,
        alcohol_content: float,
        net_contents: Optional[str] = None
    ) -> VerificationResult:
        """
        Verify label image against form data
        
        Args:
            image_bytes: Image file bytes
            brand_name: Expected brand name
            product_class: Expected product class/type
            alcohol_content: Expected alcohol content (ABV %)
            net_contents: Expected net contents (optional)
            
        Returns:
            VerificationResult with match details
        """
        # Extract text from image
        try:
            extracted_text = self.extract_text_from_image(image_bytes)
        except ValueError as e:
            return VerificationResult(
                success=False,
                matches={},
                details=[str(e)],
                extracted_text=""
            )
        
        if not extracted_text.strip():
            return VerificationResult(
                success=False,
                matches={},
                details=["Could not read text from the label image. Please try a clearer image."],
                extracted_text=""
            )
        
        # Verify each field
        matches = {}
        details = []
        
        # Check brand name
        brand_match = self.find_in_text(extracted_text, brand_name)
        matches['brand_name'] = brand_match
        if brand_match:
            details.append(f"✓ Brand name '{brand_name}' found on label")
        else:
            details.append(f"✗ Brand name '{brand_name}' does not match the form input")
        
        # Check product class
        class_match = self.find_in_text(extracted_text, product_class)
        matches['product_class'] = class_match
        if class_match:
            details.append(f"✓ Product class '{product_class}' found on label")
        else:
            details.append(f"✗ Product class '{product_class}' does not match the form input")
        
        # Check alcohol content
        extracted_abv = self.extract_alcohol_content(extracted_text)
        abv_match = False
        if extracted_abv is not None:
            # Allow small tolerance (0.5%) for OCR errors
            abv_match = abs(extracted_abv - alcohol_content) <= 0.5
            matches['alcohol_content'] = abv_match
            if abv_match:
                details.append(f"✓ Alcohol content {alcohol_content}% matches label ({extracted_abv}%)")
            else:
                details.append(f"✗ Alcohol content on label ({extracted_abv}%) differs from form ({alcohol_content}%)")
        else:
            matches['alcohol_content'] = False
            details.append(f"✗ Could not find alcohol content on label (expected {alcohol_content}%)")
        
        # Check net contents (optional)
        if net_contents:
            extracted_volume = self.extract_volume(extracted_text)
            volume_match = False
            if extracted_volume:
                # Normalize and compare
                volume_match = self.normalize_text(net_contents) in self.normalize_text(extracted_volume)
                matches['net_contents'] = volume_match
                if volume_match:
                    details.append(f"✓ Net contents '{net_contents}' found on label")
                else:
                    details.append(f"✗ Net contents on label ('{extracted_volume}') differs from form ('{net_contents}')")
            else:
                matches['net_contents'] = False
                details.append(f"✗ Could not find net contents on label (expected '{net_contents}')")
        
        # Check government warning
        warning_present = self.check_government_warning(extracted_text)
        matches['government_warning'] = warning_present
        if warning_present:
            details.append("✓ Government warning text found on label")
        else:
            details.append("⚠ Government warning text is missing from the label")
        
        # Determine overall success
        required_matches = ['brand_name', 'product_class', 'alcohol_content']
        success = all(matches.get(field, False) for field in required_matches)
        
        return VerificationResult(
            success=success,
            matches=matches,
            details=details,
            extracted_text=extracted_text
        )


def verify_label_api(
    image_bytes: bytes,
    brand_name: str,
    product_class: str,
    alcohol_content: float,
    net_contents: Optional[str] = None
) -> Dict:
    """
    API function to verify label
    
    Returns:
        Dictionary with verification results
    """
    verifier = LabelVerifier()
    result = verifier.verify_label(
        image_bytes=image_bytes,
        brand_name=brand_name,
        product_class=product_class,
        alcohol_content=alcohol_content,
        net_contents=net_contents
    )
    
    return {
        'success': result.success,
        'matches': result.matches,
        'details': result.details,
        'extracted_text': result.extracted_text
    }
