from flask import Flask, request, jsonify
import math

app = Flask(__name__)

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    num1 = data.get('num1', 0)
    num2 = data.get('num2', 0)
    operation = data.get('operation', 'add')

    result = None
    error = None

    if operation == 'add':
        result = num1 + num2
    elif operation == 'subtract':
        result = num1 - num2
    elif operation == 'multiply':
        result = num1 * num2
    elif operation == 'divide':
        if num2 == 0:
            error = 'Division by zero'
        else:
            result = num1 / num2
    elif operation == 'modulo':
        if num2 == 0:
            error = 'Division by zero'
        else:
            result = num1 % num2
    elif operation == 'power':
        result = num1 ** num2
    elif operation == 'square_root':
        if num1 < 0:
            error = 'Cannot take square root of a negative number'
        else:
            result = math.sqrt(num1)
    else:
        error = 'Invalid operation'

    if error:
        return jsonify({
            'status': 'error',
            'input': data,
            'result': None,
            'message': error
        }), 400

    return jsonify({
        'status': 'success',
        'input': data,
        'result': result,
        'message': 'Python processed your request!'
    })

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'Python is running!'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
