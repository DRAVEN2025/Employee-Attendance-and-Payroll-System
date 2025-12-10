import mysql.connector

host = 'localhost'
user = 'root'
password = ''
db_name = 'employee_attendance_and_payroll_system'

def get_connection():
    try:
        connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=db_name
        )
        
        if connection.is_connected():
            print("Successfully connected to the database")
            return connection
        else:
            print("Failed to connect to the database")
            return None
    
    except mysql.connector.Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

connection = get_connection()