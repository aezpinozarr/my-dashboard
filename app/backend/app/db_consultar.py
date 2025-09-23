from db import PgHelper


db = PgHelper()

# Insertar cliente

rows = db.call_procedure("catalogos.sp_servidor_publico")
print("Fetched Rows:")
for row in rows:
    print(row)
