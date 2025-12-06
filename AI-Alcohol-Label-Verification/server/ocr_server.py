#!/usr/bin/env python3
"""
Simple Flask API server for OCR verification
Runs on port 5001 and provides /verify endpoint
"""

from flask import Flask, request, jsonify
from ocr_service import verify_label_api
import base64

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/verify', methods=['POST'])
def verify():
    try:
        data = request.json
        
        # Decode base64 image
        image_base64 = data.get('image_bytes')
        if not image_base64:
            return jsonify({
                'success': False,
                'matches': {},
                'details': ['Error: No image data provided'],
                'extracted_text': ''
            }), 400
        
        image_bytes = base64.b64decode(image_base64)
        
        # Call verification API
        result = verify_label_api(
            image_bytes=image_bytes,
            brand_name=data['brand_name'],
            product_class=data['product_class'],
            alcohol_content=float(data['alcohol_content']),
            net_contents=data.get('net_contents')
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'matches': {},
            'details': [f'Error: {str(e)}'],
            'extracted_text': ''
        }), 500

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5001))
    host = os.environ.get('HOST', '127.0.0.1')
    app.run(host=host, port=port, debug=False)
