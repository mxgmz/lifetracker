# Migration Guide - Life OS Redesign

## ⚡ Quick Start

**Ejecuta el archivo completo:** `DATABASE_SCHEMA.sql` en el SQL Editor de Supabase.

Este archivo contiene **TODOS** los cambios necesarios para adaptar tu base de datos al frontend.

---

## Database Changes Required

### 1. Create journal_entries table

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date_key DATE NOT NULL,
  title TEXT,
  entry TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own entries
CREATE POLICY "Users can view own entries" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_journal_user_date ON journal_entries(user_id, date_key DESC);
```

## New Routes Created

- `/dashboard` - Completely redesigned with 3 sections
- `/manana` - Redesigned with 6 spiritual blocks
- `/tarde` - Redesigned with recalibration focus
- `/noche` - Redesigned with reflection and gratitude
- `/tentacion` - Redesigned with complete tracking
- `/journal` - NEW: Journaling page
- `/lectura` - NEW: Reading tracking (biblical & general)
- `/ejercicio` - NEW: Exercise tracking
- `/estudio` - NEW: Study session tracking

## New Components

- `FormBlock` - Consistent form sections with icons
- `StatCard` - Dashboard stats display
- `ScriptureHeader` - Scripture quotes
- `QuickActionCard` - Dashboard action cards
- `PageHeader` - Page titles with scriptures

## New Helper Functions

- `formatDate()` - Spanish date formatting
- `getDayOfYear()` - Day number calculator
- `getTodayKey()` - Date key generator
- `calculateRoutineScore()` - Routine completion %
- `getScriptureOfDay()` - Rotating scriptures

## Design System

### Colors
- Primary: Gray-900
- Background: Gray-50
- Cards: White with subtle gray borders
- Accents: Context-specific (yellow for morning, indigo for night, etc.)

### Spacing
- Max width: 680px
- Container padding: py-8 px-4
- Between sections: space-y-8
- Between form fields: space-y-6
- Between inputs: space-y-4

### Typography
- Font: Inter
- Titles: text-3xl font-bold
- Subtitles: text-base text-gray-600
- Labels: text-sm font-medium
- Body: text-base

### UI Elements
- Rounded corners: rounded-xl for cards, rounded-lg for inputs
- Shadows: shadow-sm
- Borders: border-gray-200
- Transitions: transition-all duration-200

## Features Implemented

### Dashboard
1. Header with greeting, date, day of year
2. Scripture of the day
3. 9 quick action cards (3x3 grid)
4. Today's snapshot with 6 key stats

### Morning Form
1. Sleep tracking (hours + quality)
2. Mental state (anxiety, energy, focus)
3. Spirituality (prayer, Bible reading, insight)
4. Morning routine (8 checkboxes)
5. Planned exercise (with details)
6. Day purpose (goals + identity keyword)

### Afternoon Form
1. Mental state refresher (4 sliders)
2. Study tracking (full details)
3. Physical discipline checkboxes
4. Micro-reset tracking
5. Temptation recording (if applicable)

### Night Form
1. Night routine (5 checkboxes)
2. Environment score
3. Social interactions (pos/neg)
4. Spiritual reflection
5. Gratitude (3 things)
6. Self-identity reflection
7. Tomorrow planning
8. General notes

### Temptation Form
- Type, trigger, risk level, intensity
- Context, action taken
- Win/loss tracking
- Future reflection

### New Pages
- **Journal**: Free-form writing with prompts
- **Reading**: Biblical or general book tracking
- **Exercise**: Complete workout logging
- **Study**: Learning session documentation

## Testing Checklist

- [ ] Login flow works
- [ ] Dashboard loads with all sections
- [ ] Morning form saves correctly
- [ ] Afternoon form saves correctly
- [ ] Night form saves correctly
- [ ] Temptation form saves correctly
- [ ] Journal entry creates successfully
- [ ] Reading logs save correctly
- [ ] Exercise logs save correctly
- [ ] Study sessions save correctly
- [ ] All data shows in dashboard snapshot
- [ ] Scripture rotates by day
- [ ] All forms validate properly
- [ ] Mobile responsive design works
- [ ] Navigation flows smoothly

## Notes

- All existing database tables remain unchanged
- RLS policies must be configured for journal_entries
- Scripture rotation uses day-of-year modulo
- Form submissions use existing helpers (getOrCreateFact, upsertDimension, updateFact)
- All pages follow the same max-width (680px) design system
- Consistent spacing, typography, and color scheme throughout

