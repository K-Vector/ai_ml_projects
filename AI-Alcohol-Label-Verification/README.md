# AI-Powered Alcohol Label Verification App

A full-stack web application that simulates the TTB (Alcohol and Tobacco Tax and Trade Bureau) label approval process using OCR technology.

## Overview

Upload an alcohol label image and verify if the information matches your product details. The app uses Python OCR (pytesseract) to extract text from labels and intelligently compares it with your form data.

## Features

-  Web form for TTB application data (brand name, product class, alcohol content, net contents)
- Image upload with preview
- OCR text extraction using pytesseract
- Intelligent verification with fuzzy matching
- Detailed results with visual indicators (✓/✗)
- Government warning text verification
- Clean, responsive UI

## Architecture

**Simplified Design - No External Storage Required:**
- Images passed directly as base64
- Python OCR service processes images in-memory
- Single Docker container deployment
- Minimal environment variables

**Tech Stack:**
- **Frontend:** React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, tRPC
- **OCR:** Python 3.11, Flask, pytesseract, Tesseract OCR

## How It Works

1. **User uploads label image** → Frontend reads as base64
2. **Frontend sends to backend** → Image + form data via tRPC
3. **Backend calls Python OCR** → Sends base64 image to Flask API (port 5001)
4. **Python extracts text** → pytesseract processes image
5. **Python verifies** → Compares extracted text with form data using fuzzy matching
6. **Results displayed** → Visual indicators show matches/mismatches