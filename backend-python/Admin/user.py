from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from header import app
from db import connection

@app.route('/api/users', methods=['GET', 'POST', 'PUT', 'DELETE'])
def handle_users():
    action = request.args.get('action', '')

    if not action and request.method == 'GET':
        return read_users()
    
    if action == 'read':
        return read_users()
    elif action == 'insert':
        return insert_user()
    elif action == 'update':
        return update_user()
    elif action == 'delete':
        return delete_user()
    else:
        return jsonify({
            'type': 'error',
            'message': 'Invalid action'
        }), 400

def read_users():
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Get specific user by ID
        user_id = request.args.get('user_id')
        if user_id:
            query = "SELECT * FROM users WHERE user_id = %s"
            cursor.execute(query, (user_id,))
            user = cursor.fetchone()
            cursor.close()
            
            if user:
                return jsonify(user), 200
            else:
                return jsonify({
                    'type': 'error',
                    'message': 'User not found'
                }), 404
        
        # Get all users - FIXED: Include password field
        else:
            query = "SELECT user_id, username, password, created_at, updated_at FROM users"
            cursor.execute(query)
            users = cursor.fetchall()
            cursor.close()
            
            return jsonify(users), 200
            
    except mysql.connector.Error as e:
        return jsonify({
            'type': 'error',
            'message': f'Database error: {str(e)}'
        }), 500

def insert_user():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                'type': 'error',
                'message': 'Username and password are required'
            }), 400
        
        cursor = connection.cursor()
        query = "INSERT INTO users (username, password) VALUES (%s, %s)"
        cursor.execute(query, (username, password))
        connection.commit()
        
        user_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'type': 'success',
            'message': 'User created successfully',
            'user_id': user_id
        }), 201
        
    except mysql.connector.Error as e:
        return jsonify({
            'type': 'error',
            'message': f'Database error: {str(e)}'
        }), 500

def update_user():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        username = data.get('username')
        password = data.get('password')
        
        if not user_id:
            return jsonify({
                'type': 'error',
                'message': 'User ID is required'
            }), 400
        
        cursor = connection.cursor()
        
        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
        if not cursor.fetchone():
            cursor.close()
            return jsonify({
                'type': 'error',
                'message': 'User not found'
            }), 404
        
        # Build dynamic update query
        update_fields = []
        params = []
        
        if username:
            update_fields.append("username = %s")
            params.append(username)
        if password:
            update_fields.append("password = %s")
            params.append(password)
        
        if not update_fields:
            cursor.close()
            return jsonify({
                'type': 'error',
                'message': 'No fields to update'
            }), 400
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(user_id)
        
        query = f"UPDATE users SET {', '.join(update_fields)} WHERE user_id = %s"
        cursor.execute(query, params)
        connection.commit()
        cursor.close()
        
        return jsonify({
            'type': 'success',
            'message': 'User updated successfully'
        }), 200
        
    except mysql.connector.Error as e:
        return jsonify({
            'type': 'error',
            'message': f'Database error: {str(e)}'
        }), 500

def delete_user():
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                'type': 'error',
                'message': 'User ID is required'
            }), 400
        
        cursor = connection.cursor()
        
        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
        if not cursor.fetchone():
            cursor.close()
            return jsonify({
                'type': 'error',
                'message': 'User not found'
            }), 404
        
        query = "DELETE FROM users WHERE user_id = %s"
        cursor.execute(query, (user_id,))
        connection.commit()
        cursor.close()
        
        return jsonify({
            'type': 'success',
            'message': 'User deleted successfully'
        }), 200
        
    except mysql.connector.Error as e:
        return jsonify({
            'type': 'error',
            'message': f'Database error: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True)