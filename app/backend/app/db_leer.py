from db import PgHelper


db = PgHelper()

# Insertar cliente

# nuevo_id = db.ejecutar_funcion("cliente_nuevo", params=("Angel", 25))
# print("🆔 Cliente creado con ID:", nuevo_id)


nuevo_id = db.ejecutar_funcion("catalogos.sp_servidor_publico_gestionar", params=(
    # para que funcione tiene que tener un nombre diferente
    'NUEVO', '0', 'Abgeliito2', 'jefe', True))
print("🆔 Cliente creado con ID:", nuevo_id)

# Actualizar cliente
# ok = db.ejecutar_funcion("cliente_editar", params=(nuevo_id, "Ana López Editada", 26))
# print("✅ Actualización:", ok)

# Eliminar cliente
# ok = db.ejecutar_funcion("cliente_eliminar", params=(nuevo_id,))
# --print("🗑️ Eliminación:", ok)



