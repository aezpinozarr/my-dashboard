import psycopg2

conn_str = "dbname=mibasededatos user=miusuario password=micontrasena host=192.168.1.121 port=5432"


class PgHelper:
    def __init__(self):
        self.connection_string = conn_str
        self.conn = None
        self.errors = ""

    def connect(self):
        try:
            if self.conn is None or self.conn.closed:
                self.conn = psycopg2.connect(self.connection_string)
            return True
        except Exception as e:
            self.errors += f" {str(e)}"
            print("❌ Error de conexión:", e)
            return False

    def disconnect(self):
        try:
            if self.conn and not self.conn.closed:
                self.conn.close()
                self.conn = None
        except Exception as e:
            self.errors += f" {str(e)}"
            print("⚠️ Error al desconectar:", e)

    def clear_errors(self):
        self.errors = ""

    def ejecutar_funcion(self, sfunction_name, params=None, show_message=True):
        """
        Ejecuta una función / procedimiento en PostgreSQL (puede devolver ID, TRUE/FALSE u otro valor).
        """
        try:
            self.connect()
            cursor = self.conn.cursor()

            placeholders = ",".join(["%s"] * (len(params) if params else 0))
            sql = f"SELECT {sfunction_name}({placeholders});"

            cursor.execute(sql, params or [])
            result = cursor.fetchone()

            self.conn.commit()

            if result is not None:
                return result[0]  # puede ser int, bool, text, etc.
            else:
                if show_message:
                    print("⚠️ La función no devolvió ningún valor")
                return None

        except Exception as e:
            self.errors += f" {str(e)}"
            if show_message:
                print("❌ Error:", e)
            return None
        finally:
            self.disconnect()

    def call_procedure(self, sproc_name, params=None):
        try:
            self.connect()
            cursor = self.conn.cursor()
            if params:
                cursor.callproc(sproc_name, params)
            else:
                cursor.callproc(sproc_name)
                result = cursor.fetchall()  # retorna filas [(id, nombre), ...]
                cursor.close()
            return result
        
        except Exception as ee:
            self.errors += f" {str(ee)}"
        finally:
            self.disconnect()
