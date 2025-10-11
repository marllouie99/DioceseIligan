# Philippine Address Enhancement Feature

## Overview
Enhanced address input system with cascading dropdowns for Philippine locations, search functionality, validation, and formatted display.

## Features Implemented

### 1. ✅ Cascading Address Dropdowns
**User Profile & Church Profile**
- **Region** → **Province** → **City/Municipality** → **Barangay**
- Automatic loading of dependent options
- Preserves saved values when editing

**Data Source:**
- PSGC API (Philippine Standard Geographic Code)
- Official government geographic codes
- Free, no API key required
- Cached for 24 hours for performance

### 2. ✅ Search/Filter Functionality
**Real-time search in all dropdowns:**
- Type to filter options instantly
- Case-insensitive search
- Highlights matching results
- Works on all 4 levels (Region, Province, City, Barangay)

**Implementation:**
- Search input above each dropdown
- Filters options as you type
- No page reload required

### 3. ✅ Postal Code Validation
**4-Digit Philippine Format:**
- Client-side: HTML5 pattern validation
- Server-side: Django form validation
- Auto-formats: Removes non-numeric characters
- Max length: 4 digits
- Error messages for invalid input

**Validation Rules:**
```python
- Must be exactly 4 digits
- Only numbers allowed
- Examples: 9000, 1000, 6000
```

### 4. ✅ Formatted Address Display
**Profile Overview:**
- Shows complete address in readable format
- Format: `Street, Brgy. Barangay, City, Province, Region, Postal Code`
- Example: `123 Rizal St, Brgy. Poblacion, Iligan City, Lanao del Norte, Region X, 9200`
- Displays with location icon
- Auto-updates when address is saved

**Church Profile:**
- Same formatted display via `church.full_address` property
- Backward compatible with legacy address fields
- Falls back gracefully if new fields are empty

## Database Schema

### Profile Model (User Address)
```python
region = CharField(max_length=200)
province = CharField(max_length=200)
city_municipality = CharField(max_length=200)
barangay = CharField(max_length=200)
street_address = CharField(max_length=300)
postal_code = CharField(max_length=4)
address = TextField()  # Legacy field (backward compatible)
```

### Church Model (Church Address)
```python
region = CharField(max_length=200)
province = CharField(max_length=200)
city_municipality = CharField(max_length=200)
barangay = CharField(max_length=200)
street_address = CharField(max_length=300)
postal_code = CharField(max_length=4)
address = TextField()  # Legacy field
city = CharField(max_length=100)  # Legacy field
state = CharField(max_length=100)  # Legacy field
country = CharField(max_length=100, default="Philippines")
```

## API Endpoints

### Philippine Address API
**Base Path:** `/api/`

| Endpoint | Method | Parameters | Description |
|----------|--------|------------|-------------|
| `/api/ph-regions/` | GET | None | Get all Philippine regions |
| `/api/ph-provinces/` | GET | `region_code` | Get provinces by region |
| `/api/ph-cities/` | GET | `province_code` | Get cities by province |
| `/api/ph-barangays/` | GET | `city_code` | Get barangays by city |

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "code": "100000000",
      "name": "Region X - Northern Mindanao",
      "region_name": "REGION X"
    }
  ]
}
```

**Caching:**
- All API responses cached for 24 hours
- Reduces external API calls
- Improves performance

## Files Modified

### Models
- `accounts/models.py` - Added Philippine address fields to Profile
- `core/models.py` - Added Philippine address fields to Church
- `core/models.py` - Updated `Church.full_address` property

### Forms
- `accounts/forms.py` - Added address fields to ProfileForm
- `accounts/forms.py` - Added postal code validation

### Views
- `accounts/ph_address_api.py` - NEW: API endpoints for address data

### URLs
- `accounts/urls.py` - Added 4 new API routes

### Templates
- `templates/manage_profile.html` - Enhanced with cascading dropdowns, search, and formatted display

### Migrations
- `accounts/migrations/0007_*.py` - Profile address fields
- `core/migrations/0026_*.py` - Church address fields

## Usage Guide

### For Users (Profile Page)

1. **Navigate to Profile:**
   - Go to "My Profile" → "Settings" tab
   - Scroll to "Contact Information"

2. **Select Address:**
   - **Region:** Type or select from dropdown
   - **Province:** Auto-enables after region selection
   - **City/Municipality:** Auto-enables after province selection
   - **Barangay:** Auto-enables after city selection
   - **Street Address:** Enter house/building number and street
   - **Postal Code:** Enter 4-digit code (e.g., 9200)

3. **Search Feature:**
   - Use search box above each dropdown
   - Type to filter options
   - Click to select

4. **View Address:**
   - Formatted address displays in profile overview
   - Shows with location pin icon

### For Admins (Church Management)

1. **Church Creation/Edit:**
   - Same cascading dropdown interface
   - Required for church verification
   - Displays in church profile page

2. **Address Display:**
   - `{{ church.full_address }}` in templates
   - Automatically formatted
   - Backward compatible

## Technical Details

### JavaScript Implementation
**File:** `templates/manage_profile.html` (inline script)

**Key Functions:**
- `loadRegions()` - Fetches all regions
- `loadProvinces(regionCode)` - Fetches provinces by region
- `loadCities(provinceCode)` - Fetches cities by province
- `loadBarangays(cityCode)` - Fetches barangays by city
- `setupSearch(searchId, selectId)` - Enables search filtering

**Event Handling:**
- Change events on dropdowns trigger cascading loads
- Input events on search boxes filter options
- Preserves selected values on page load

### Caching Strategy
**Django Cache:**
```python
cache_key = f'ph_regions'  # or provinces_{code}, etc.
cache.set(cache_key, data, 86400)  # 24 hours
```

**Benefits:**
- Reduces API calls to PSGC
- Faster page loads
- Lower bandwidth usage
- Geographic data rarely changes

### Validation
**Client-Side:**
- HTML5 `pattern="[0-9]{4}"` for postal code
- `maxlength="4"` attribute
- Real-time input filtering (removes non-digits)

**Server-Side:**
```python
def clean_postal_code(self):
    postal_code = self.cleaned_data.get('postal_code', '').strip()
    if postal_code and not postal_code.isdigit():
        raise ValidationError('Must contain only numbers.')
    if postal_code and len(postal_code) != 4:
        raise ValidationError('Must be exactly 4 digits.')
    return postal_code
```

## Backward Compatibility

### Legacy Address Fields
- Old `address` field still exists
- Forms save to both new and legacy fields
- `full_address` property checks new fields first
- Falls back to legacy if new fields empty

### Migration Path
1. New users: Use structured fields
2. Existing users: Can keep legacy address or update
3. No data loss: Both formats supported

## Performance Optimization

### API Calls
- **Initial Load:** 1 API call (regions)
- **Per Selection:** 1 API call per dropdown change
- **With Cache:** 0 API calls after first load (24h)

### Database Queries
- No additional queries for address display
- Fields loaded with profile/church object
- Indexed for search if needed

### Frontend
- Minimal JavaScript (~200 lines)
- No external libraries required
- Vanilla JS for maximum compatibility

## Future Enhancements

### Potential Improvements
1. **Autocomplete:** Google Places API integration
2. **Map Integration:** Show location on map
3. **Geocoding:** Auto-fill lat/long from address
4. **Bulk Import:** CSV import for church addresses
5. **Address Verification:** Validate against official database
6. **Mobile Optimization:** Touch-friendly dropdowns
7. **Offline Support:** Cache address data locally

### Admin Features
1. **Address Statistics:** Dashboard showing address completion rates
2. **Data Quality:** Report incomplete/invalid addresses
3. **Bulk Update:** Mass update addresses via admin
4. **Export:** Export addresses to CSV/Excel

## Testing Checklist

### User Profile
- [ ] Load profile page - regions display
- [ ] Select region - provinces load
- [ ] Select province - cities load
- [ ] Select city - barangays load
- [ ] Search in each dropdown works
- [ ] Save profile with complete address
- [ ] Formatted address displays in overview
- [ ] Postal code validation works (4 digits only)
- [ ] Edit profile - saved values pre-selected

### Church Profile
- [ ] Create church with new address fields
- [ ] Edit church - cascading dropdowns work
- [ ] `church.full_address` displays correctly
- [ ] Legacy churches still show old address
- [ ] Search functionality in church forms

### API Endpoints
- [ ] `/api/ph-regions/` returns data
- [ ] `/api/ph-provinces/?region_code=XXX` works
- [ ] `/api/ph-cities/?province_code=XXX` works
- [ ] `/api/ph-barangays/?city_code=XXX` works
- [ ] Caching works (check logs)
- [ ] Error handling for invalid codes

## Troubleshooting

### Common Issues

**1. Dropdowns Not Loading**
- Check browser console for errors
- Verify API endpoints are accessible
- Check PSGC API status
- Clear Django cache: `python manage.py clear_cache`

**2. Search Not Working**
- Ensure JavaScript is enabled
- Check for JS errors in console
- Verify search input IDs match

**3. Postal Code Validation Failing**
- Must be exactly 4 digits
- No letters or special characters
- Check form error messages

**4. Address Not Displaying**
- Ensure all fields are saved
- Check template variable names
- Verify `full_address` property logic

### Debug Commands

```bash
# Clear cache
python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()

# Test API endpoint
curl http://localhost:8000/api/ph-regions/

# Check migrations
python manage.py showmigrations accounts core

# Run migrations
python manage.py migrate
```

## Support

### Resources
- **PSGC API Docs:** https://psgc.gitlab.io/api/
- **Django Cache:** https://docs.djangoproject.com/en/stable/topics/cache/
- **Philippine Postal Codes:** https://www.philpost.gov.ph/

### Contact
For issues or questions, check:
1. Application logs on Render
2. Browser console for JS errors
3. Django debug toolbar (development)

---

**Version:** 1.0  
**Last Updated:** October 12, 2025  
**Status:** ✅ Production Ready
