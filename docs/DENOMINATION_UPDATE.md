# Denomination Choices Update

**Date:** 2025-10-20  
**Purpose:** Updated denomination choices to focus exclusively on Roman Catholic Church types

---

## Changes Made

### Before
The system supported multiple denominations including:
- Roman Catholic
- Protestant denominations (Baptist, Methodist, Presbyterian, etc.)
- Other Christian denominations (Iglesia ni Cristo, Mormon, Jehovah's Witnesses, etc.)
- Non-Christian religions (Islam, Buddhism, Hinduism, etc.)

### After
The system now focuses exclusively on Roman Catholic Church types:
- **Roman Catholic Church** - General Catholic church
- **Roman Catholic Parish** - Standard parish (default)
- **Roman Catholic Chapel** - Smaller chapel
- **Roman Catholic Shrine** - Religious shrine
- **Roman Catholic Cathedral** - Cathedral church
- **Roman Catholic Basilica** - Basilica church
- **Other Catholic Community** - Other Catholic communities

---

## Rationale

Since the ChurchIligan system is specifically designed for the **Diocese of Iligan** and the Roman Catholic Church, it makes sense to:

1. **Focus on Catholic-specific categories** - Provides more relevant options for Catholic churches
2. **Improve data accuracy** - Users can specify the exact type of Catholic institution
3. **Better organization** - Helps distinguish between parishes, chapels, shrines, cathedrals, and basilicas
4. **Simplified user experience** - Reduces confusion by removing irrelevant options

---

## Database Migration Required

⚠️ **Important:** This change requires a database migration to update existing records.

### Migration Steps:

1. **Create migration:**
   ```bash
   python manage.py makemigrations core --name update_denomination_choices
   ```

2. **Review migration file** - Check that it properly handles existing data

3. **Apply migration:**
   ```bash
   python manage.py migrate core
   ```

### Handling Existing Data

**Existing churches with non-Catholic denominations:**
- Churches with `denomination='catholic'` will remain unchanged
- Churches with other denominations (e.g., 'protestant', 'baptist', etc.) will need to be:
  - Either manually updated to one of the new Catholic types
  - Or kept as-is if the field allows legacy values
  - Or migrated to `'other'` (Other Catholic Community)

**Recommended approach:**
```python
# In a data migration or management command
from core.models import Church

# Update all non-catholic denominations to 'other'
Church.objects.exclude(denomination='catholic').update(denomination='other')

# Or update all to 'parish' as default
Church.objects.all().update(denomination='parish')
```

---

## Impact on Existing Features

### 1. Church Filters
- Discover page filters will now show Catholic-specific types
- Super admin filters will show Catholic-specific types
- Charts and statistics will reflect Catholic categories

### 2. Church Creation
- Default denomination is now `'parish'` instead of `'other'`
- Users will see Catholic-specific options in the dropdown

### 3. Church Display
- Church detail pages will show the specific Catholic type
- Church cards will display the appropriate Catholic category

### 4. Search & Discovery
- Users can filter by specific Catholic institution types
- Better categorization for finding specific types of Catholic churches

---

## Testing Recommendations

1. **Create new church** - Verify dropdown shows only Catholic options
2. **Edit existing church** - Check that existing denominations are handled properly
3. **Filter churches** - Test filtering by new denomination types
4. **View church details** - Ensure denomination displays correctly
5. **Charts/Statistics** - Verify charts show correct Catholic categories

---

## Future Enhancements

Consider adding:
- **Diocesan-specific categories** - E.g., "Diocesan Shrine", "Mission Station"
- **Religious order churches** - E.g., "Jesuit Parish", "Franciscan Church"
- **Special designations** - E.g., "National Shrine", "Pilgrimage Site"

---

## Rollback Plan

If needed, you can rollback by:

1. Reverting the model changes in `core/models.py`
2. Running migrations to restore previous denomination choices
3. Updating any affected church records

---

## Notes

- The `denomination` field max_length is 20 characters, which accommodates all new choices
- The database field type remains `CharField`, no structural changes needed
- Existing code that references specific denominations may need updates
- Consider updating any hardcoded denomination checks in views/templates
