# Multi-Church Management - Final Fix

## Issue
When a user owns multiple churches, actions performed in Church A were being executed on Church B (the first church returned by `.first()`).

## Root Cause
Several functions were using `.first()` to get the church instead of accepting a `church_id` parameter and using `get_object_or_404()`.

## Fixed Functions

### 1. **manage_services()** ✅
- **File**: `core/views.py` (Lines 1756-1777)
- **Change**: Now accepts `church_id` from GET parameters
- **Pattern**: Uses `get()` with church_id, falls back to `.first()` only when no church_id provided

### 2. **manage_service_images()** ✅
- **File**: `core/views.py` (Lines 2012-2021)
- **Change**: Gets service first, then extracts church and verifies ownership
- **Pattern**: `service = get_object_or_404(BookableService, id=service_id)` → verify `church.owner`

### 3. **manage_availability()** ✅
- **File**: `core/views.py` (Lines 2091-2112)
- **Change**: Now accepts `church_id` from GET parameters
- **Pattern**: Uses `get()` with church_id, falls back to `.first()` only when no church_id provided

### 4. **create_decline_reason()** ✅
- **File**: `core/views.py` (Lines 2472-2539)
- **Backend**: Already accepts `church_id` from JSON data (line 2480)
- **Frontend Fix**: Updated JavaScript to send `church_id` in request body
- **File**: `static/js/app/manage_church_new.js` (Lines 3156-3170)
- **Change**: Added `church_id: churchId` to the JSON payload

### 5. **create_availability URL** ✅
- **File**: `templates/core/manage_church.html` (Line 122)
- **Change**: Added `church_id={{ church.id }}` to the URL
- **Before**: `"{% url 'core:create_availability' %}?date=0"`
- **After**: `"{% url 'core:create_availability' %}?church_id={{ church.id }}&date=0"`

## Already Fixed (Previous Updates)
- ✅ create_service()
- ✅ edit_service()
- ✅ delete_service()
- ✅ update_church_logo()
- ✅ update_church_cover()
- ✅ create_availability()
- ✅ edit_availability()
- ✅ delete_availability()
- ✅ delete_decline_reason()
- ✅ toggle_decline_reason()
- ✅ request_verification()

## Testing Checklist

### Church A Actions
- ✅ Create service in Church A → Should create in Church A
- ✅ Edit service in Church A → Should edit Church A's service
- ✅ Delete service in Church A → Should delete from Church A
- ✅ Update Church A's logo → Should update Church A
- ✅ Update Church A's cover → Should update Church A
- ✅ Create availability in Church A → Should create for Church A
- ✅ Edit availability in Church A → Should edit Church A's availability
- ✅ Delete availability in Church A → Should delete from Church A
- ✅ Add decline reason in Church A → Should add to Church A
- ✅ Toggle decline reason in Church A → Should toggle Church A's reason
- ✅ Delete decline reason in Church A → Should delete from Church A
- ✅ Request verification for Church A → Should verify Church A
- ✅ All actions should redirect back to Church A's manage page

### Church B Actions
- ⏳ Repeat all above tests for Church B
- ⏳ Verify Church A data remains unchanged when working on Church B

## Implementation Pattern

All church-specific actions now follow this pattern:

```python
@login_required
def some_church_action(request):
    """Action description."""
    # Get church_id from GET or POST parameters
    church_id = request.GET.get('church_id') or request.POST.get('church_id')
    
    try:
        if church_id:
            church = request.user.owned_churches.get(id=church_id)
        else:
            # Fallback to first church if no church_id provided
            church = request.user.owned_churches.first()
            if not church:
                # Handle no church case
                ...
    except Church.DoesNotExist:
        messages.error(request, "You don't have permission to manage this church.")
        return redirect('core:select_church')
    
    # Continue with action...
```

For actions on related objects (services, availability, decline reasons):
```python
@login_required
def edit_related_object(request, object_id):
    """Edit related object."""
    # Get the object first to determine its church
    obj = get_object_or_404(RelatedModel, id=object_id)
    church = obj.church
    
    # Verify user owns this church
    if church.owner != request.user:
        messages.error(request, "You don't have permission to manage this object.")
        return redirect('core:select_church')
    
    # Continue with edit...
```

## Files Modified

### Python Files
1. `core/views.py` - Updated 3 functions (manage_services, manage_service_images, manage_availability)

### JavaScript Files
2. `static/js/app/manage_church_new.js` - Added church_id to decline reason creation

### Template Files
3. `templates/core/manage_church.html` - Added church_id to createAvailability URL

## Notes
- All functions now properly verify church ownership before performing actions
- Redirects always include the correct `church_id` parameter
- JavaScript functions extract `church_id` from the page's data attribute
- Fallback to `.first()` only occurs when no `church_id` is provided (for backward compatibility)
