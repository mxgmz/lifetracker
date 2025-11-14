# Sliders Reference - Life OS

## 📊 Todos los Sliders: Escala 1-5

Este documento lista todos los sliders del sistema y sus rangos actualizados.

---

## ✅ Sliders Implementados (Todos 1-5)

### **Página: Mañana (`/manana`)**

| Campo | Rango | Tabla Destino | Campo DB |
|-------|-------|---------------|----------|
| Calidad de sueño | 1-5 | `fact_habitos_diarios` | `calidad_sueno` |
| Ansiedad | 1-5 | `dim_estado_emocional` | `ansiedad` |
| Energía | 1-5 | `fact_habitos_diarios` | `energia_diaria` |
| Enfoque | 1-5 | `dim_estado_emocional` | `enfoque` |

---

### **Página: Tarde (`/tarde`)**

| Campo | Rango | Tabla Destino | Campo DB |
|-------|-------|---------------|----------|
| Ansiedad | 1-5 | `dim_estado_emocional` | `ansiedad` |
| Enfoque | 1-5 | `dim_estado_emocional` | `enfoque` |
| Estrés | 1-5 | `fact_habitos_diarios` | `estres` |
| Ánimo | 1-5 | `dim_estado_emocional` | `animo` |
| Profundidad (estudio) | 1-5 | `dim_estudio` | `profundidad` |
| Intensidad (tentación) | 1-5 | `dim_tentacion` | `nivel_riesgo` |

---

### **Página: Noche (`/noche`)**

| Campo | Rango | Tabla Destino | Campo DB |
|-------|-------|---------------|----------|
| Orden del ambiente | 1-5 | `dim_ambiente` | `orden_cuarto` |
| Identidad del día | 1-5 | `fact_habitos_diarios` | `identidad_dia` |

---

### **Página: Tentación (`/tentacion`)**

| Campo | Rango | Tabla Destino | Campo DB |
|-------|-------|---------------|----------|
| Nivel de riesgo | 1-5 | `dim_tentacion` | `nivel_riesgo` |
| Intensidad | 1-5 | `dim_tentacion` | `nivel_riesgo` |

---

### **Página: Ejercicio (`/ejercicio`)**

| Campo | Rango | Tabla Destino | Campo DB |
|-------|-------|---------------|----------|
| RPE - Intensidad percibida | 1-5 | `dim_ejercicio` | `intensidad` |

---

### **Página: Estudio (`/estudio`)**

| Campo | Rango | Tabla Destino | Campo DB |
|-------|-------|---------------|----------|
| Profundidad | 1-5 | `dim_estudio` | `profundidad` |

---

## 🎯 Interpretación de Escala 1-5

### **Escala General**
- **1** = Muy bajo / Mínimo
- **2** = Bajo
- **3** = Medio / Moderado
- **4** = Alto
- **5** = Muy alto / Máximo

### **Contextos Específicos**

#### **Calidad de Sueño**
- 1 = Terrible (no descansé)
- 2 = Mala (me desperté varias veces)
- 3 = Regular (algo de descanso)
- 4 = Buena (descansé bien)
- 5 = Excelente (desperté renovado)

#### **Ansiedad**
- 1 = Totalmente tranquilo
- 2 = Ligera inquietud
- 3 = Algo ansioso
- 4 = Bastante ansioso
- 5 = Muy ansioso / Pánico

#### **Energía**
- 1 = Agotado / Sin energía
- 2 = Baja energía
- 3 = Energía moderada
- 4 = Buena energía
- 5 = Lleno de energía

#### **Enfoque**
- 1 = Muy disperso
- 2 = Dificultad para concentrarse
- 3 = Enfoque moderado
- 4 = Buen enfoque
- 5 = Totalmente concentrado

#### **Intensidad de Ejercicio (RPE)**
- 1 = Muy fácil
- 2 = Fácil
- 3 = Moderado
- 4 = Difícil
- 5 = Muy difícil / Máximo esfuerzo

#### **Profundidad de Estudio**
- 1 = Superficial (solo leí)
- 2 = Revisión ligera
- 3 = Estudio moderado
- 4 = Estudio profundo
- 5 = Inmersión total / Dominio

#### **Identidad del Día**
- 1 = No fui quien quiero ser
- 2 = Poco alineado con mi identidad
- 3 = Neutral / Algunos momentos buenos
- 4 = Mayormente alineado
- 5 = Totalmente quien quiero ser

---

## 🗄️ Database Constraints

Todos los campos tienen constraints en la base de datos:

```sql
CHECK (campo >= 1 AND campo <= 5)
```

Esto asegura integridad de datos y previene valores fuera de rango.

---

## 📝 Notas de Implementación

### **Frontend (React Hook Form)**
```javascript
const { register, handleSubmit, watch, setValue } = useForm({
  defaultValues: {
    campo_slider: 3, // Valor por defecto en medio
  },
})
```

### **Componente Slider**
```javascript
<Slider
  label="Nombre del campo"
  name="campo_slider"
  register={register}
  min={1}
  max={5}
  value={watch('campo_slider')}
  onChange={(e) => setValue('campo_slider', parseInt(e.target.value))}
/>
```

### **Base de Datos**
Todos los campos de tipo `integer` con valores 1-5 tienen constraints aplicados automáticamente vía `DATABASE_SCHEMA.sql`.

---

## ✅ Verificación

Para verificar que todos los constraints están correctos:

```sql
SELECT 
  conrelid::regclass as tabla,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE contype = 'c'
  AND conrelid::regclass::text LIKE 'dim_%'
  OR conrelid::regclass::text = 'fact_habitos_diarios'
ORDER BY conrelid, conname;
```

---

**Última actualización:** Noviembre 2025

