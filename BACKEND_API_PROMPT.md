# Backend Implementation Prompt — Skills Dashboard APIs

## Contexto del Proyecto
Este es un Dashboard de Competencias con las siguientes entidades:
- **Colaboradores**: Personas del equipo
- **Skills**: Habilidades que se evalúan
- **Categorías**: Agrupación de skills
- **Perfiles de Puesto**: Matriz Rol × Skill con criticidad (C/I/D/N)
- **Evaluaciones**: Calificación de skills por colaborador

---

## APIs Requeridas

### 1. Perfiles de Puesto (Role Profiles)

#### GET `/api/role-profiles`
Retorna todos los perfiles de puesto.
```json
{
  "UX Designer": { "1": "C", "2": "I", "3": "D" },
  "Developer": { "1": "D", "2": "C", "3": "I" }
}
```

#### GET `/api/role-profiles/:rol`
Retorna el perfil de un rol específico.

#### PUT `/api/role-profiles/:rol`
Guarda/actualiza el perfil de un rol.
```json
// Request body
{
  "1": "C",  // skill_id: criticidad
  "2": "I",
  "3": "N"
}
```

#### POST `/api/role-profiles`
Crea un nuevo perfil de puesto.
```json
{
  "rol": "Product Manager",
  "skills": { "1": "C", "2": "I" }
}
```

---

### 2. Colaboradores (Actualizar)

#### PUT `/api/collaborators/:id`
Actualizar colaborador. Debe soportar:
```json
{
  "nombre": "Ana Rodríguez",
  "rol": "UX Designer",
  "email": "ana@empresa.com",
  "lastEvaluated": "2024-12-15T10:30:00Z"  // timestamp de última evaluación
}
```

#### Campo `lastEvaluated`
- Se actualiza automáticamente cuando se guardan evaluaciones para ese colaborador
- El frontend lo usa para mostrar frescura (Reciente/Desactualizada)

---

### 3. Evaluaciones

#### GET `/api/collaborators/:id/skills`
Retorna las evaluaciones del colaborador.
```json
{
  "1": { "nivel": 3, "frecuencia": "D" },
  "2": { "nivel": 2, "frecuencia": "S" }
}
```

#### PUT `/api/collaborators/:id/skills`
Guarda las evaluaciones del colaborador.
```json
// Request body
{
  "1": { "nivel": 3, "frecuencia": "D" },
  "2": { "nivel": 2, "frecuencia": "S" }
}
```
**IMPORTANTE**: Al guardar, actualizar `lastEvaluated` del colaborador con la fecha actual.

---

### 4. Datos Maestros Existentes (Actualizar GET /api/data)

El endpoint `/api/data` debe retornar:
```json
{
  "collaborators": [...],
  "categories": [...],
  "skills": [...],
  "roleProfiles": {
    "UX Designer": { "1": "C", "2": "I" },
    "Developer": { "1": "D", "2": "C" }
  }
}
```

---

## Cambios en Modelo de Datos (db.json)

### Agregar colección `roleProfiles`
```json
{
  "roleProfiles": {
    "UX Designer": {
      "1": "C",
      "2": "I",
      "3": "D"
    },
    "Developer": {
      "1": "D",
      "2": "C"
    }
  }
}
```

### Agregar campo `lastEvaluated` a colaboradores
```json
{
  "id": 1,
  "nombre": "Ana Rodríguez",
  "rol": "UX Designer",
  "email": "ana@empresa.com",
  "lastEvaluated": "2024-12-15T10:30:00Z"
}
```

---

## Estado del Frontend (Ya Implementado ✅)

### Tab Colaboradores
- [x] Badge "⚠ Sin perfil" para roles sin perfil configurado
- [x] Fetches roleProfiles desde `/api/data`

### Tab Perfiles de Puesto
- [x] Botón "Nuevo Perfil" con modal de creación
- [x] Selector C/I/D/N/A para cada skill
- [x] Summary stats por categoría
- [x] Opción "Copiar de..." otro rol

### Tab Evaluaciones
- [x] Indicador de frescura (Reciente/Desactualizada)
- [x] Badge de estado de perfil
- [x] Lee criticidad desde roleProfiles[rol]
- [x] Skills N/A se ocultan con mensaje

---

## Flujo de Datos

```
Crear Colaborador → Selecciona Rol → 
  ├─ Rol tiene perfil? → ✓ Listo
  └─ Rol NO tiene perfil? → Mostrar warning → Link a crear perfil

Evaluar Colaborador →
  1. GET /api/data (trae roleProfiles)
  2. Buscar roleProfiles[colaborador.rol]
  3. Aplicar criticidad por skill del perfil
  4. Al guardar: PUT /api/collaborators/:id/skills

Guardar Perfil → PUT /api/role-profiles/:rol
```

---

## Validaciones

1. **Rol único por perfil**: No duplicar perfiles para el mismo rol
2. **Actualizar `lastEvaluated`** automáticamente al guardar evaluaciones
3. **Criticidad válida**: Solo valores 'C', 'I', 'D', 'N'
4. **Nivel válido**: 0-5
5. **Frecuencia válida**: 'D', 'S', 'M', 'T', 'N'

---

## Prioridad de Implementación

1. **Alta**: `PUT /api/role-profiles/:rol` — Guardar perfiles
2. **Alta**: `PUT /api/collaborators/:id/skills` — Guardar evaluaciones
3. **Media**: Agregar `roleProfiles` a `GET /api/data`
4. **Media**: Actualizar `lastEvaluated` al guardar evaluaciones
5. **Baja**: POST para crear nuevos perfiles desde cero
