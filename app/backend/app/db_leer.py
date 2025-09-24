from db import PgHelper


db = PgHelper()

# Insertar cliente

nuevo_id = db.ejecutar_funcion("cliente_nuevo", params=("Angel", 25))
print("🆔 Cliente creado con ID:", nuevo_id)
print("🆔 hola1")
print("🆔 hola12")
print("🆔 hola1233")


#nuevo_id = db.ejecutar_funcion("sp_servidor_publico_gestionar", params=("NUEVO",'null','Abgeliito','jefe',1))
#print("🆔 Cliente creado con ID:", nuevo_id)

# Actualizar cliente
#ok = db.ejecutar_funcion("cliente_editar", params=(nuevo_id, "Ana López Editada", 26))
#print("✅ Actualización:", ok)

# Eliminar cliente
#ok = db.ejecutar_funcion("cliente_eliminar", params=(nuevo_id,))
#--print("🗑️ Eliminación:", ok)




