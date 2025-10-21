# Super Admin Church Manager Improvements

## Overview
Enhanced the super-admin church management system to allow manager reassignment and support managerless churches. Also prevents assigning users who already manage other churches.

## Changes Made

### 1. Database Model Changes (`core/models.py`)
- **Modified `Church.owner` field** to be nullable (`null=True, blank=True`)
- Updated help text to indicate churches can be managerless
- Migration file already exists: `0035_make_church_owner_nullable.py`

### 2. Form Changes (`core/forms.py`)

#### SuperAdminChurchCreateForm
- **Made `assigned_user` field optional** (`required=False`)
- Updated label to "Assign Church Manager (Optional)"
- Enhanced help text to explain:
  - Field is optional
  - Users who already manage another church are excluded
  - Church can be managerless

#### Form Initialization Logic
- **Added filtering logic** to exclude users who are already managing other churches
- Query excludes churches with existing owners (except current owner when editing)
- Current owner is always included in the list when editing
- Maintains existing profile completeness validation

### 3. View Changes (`core/views.py`)

#### super_admin_create_church
- Updated success messages to handle both scenarios:
  - With manager: Shows manager's name
  - Without manager: Indicates church is managerless

#### super_admin_edit_church
- Updated success messages to handle:
  - Manager assigned: Shows manager's name
  - No manager: Indicates church is now managerless
- Allows reassigning from one manager to another
- Allows removing manager (making church managerless)

### 4. Template Changes (`super_admin_create_church.html`)
- **Removed "required" indicator** from manager field label
- Updated page description to reflect new functionality:
  - Create: "optionally assign a user to manage it"
  - Edit: "Church can be managerless or assigned to a new manager"
- Enhanced warning message when no eligible users found
- Maintains Select2 integration for user selection

## Features Implemented

### ✅ Manager Reassignment
- Super-admin can change church manager in edit page
- Current manager is always available in the dropdown
- Smooth transition with notifications

### ✅ Managerless Churches
- Churches can be created without a manager
- Existing churches can have their manager removed
- System handles null owner gracefully

### ✅ Prevent Duplicate Managers
- Users who already manage a church are excluded from selection
- Only shows available users when creating new churches
- When editing, current manager is always available (to keep or change)

### ✅ User Experience
- Clear labels and help text
- Informative success messages
- Warning when no eligible users available
- Select2 dropdown for easy user search

## Database Migration Required

Run the following command to apply the database changes:
```bash
python manage.py migrate core
```

The migration `0035_make_church_owner_nullable.py` already exists and will:
- Make the `owner` field nullable in the `Church` model
- Allow existing churches to have null owners

## Testing Checklist

### Create Church
- [ ] Create church with a manager
- [ ] Create church without a manager (leave field empty)
- [ ] Verify users who already manage churches are not in the list
- [ ] Verify success messages are correct

### Edit Church
- [ ] Reassign church from one manager to another
- [ ] Remove manager from church (make it managerless)
- [ ] Keep existing manager unchanged
- [ ] Verify current manager is always available in dropdown
- [ ] Verify success messages are correct

### Edge Cases
- [ ] No eligible users available (all users incomplete profiles or already managers)
- [ ] User with incomplete profile cannot be selected
- [ ] Manager can be reassigned multiple times
- [ ] Managerless church can later be assigned a manager

## Bug Fixes Applied

### Issue 1: Manager Not Being Removed
**Problem**: When removing a manager from a church, the success message appeared but the manager was not actually removed from the database.

**Root Cause**: The form's `save()` method only set `church.owner = assigned_user` when `assigned_user` had a value, leaving the old value unchanged when the field was empty.

**Solution**: Changed from conditional assignment `if assigned_user: church.owner = assigned_user` to unconditional assignment `church.owner = assigned_user`, which properly sets the owner to `None` when the field is empty.

### Issue 2: Template Errors with Null Owner
**Problem**: `VariableDoesNotExist` errors when accessing church detail, list, and other pages for managerless churches.

**Root Cause**: Templates were accessing `church.owner.email` and `church.owner.get_full_name` without checking if `church.owner` was `None`.

**Solution**: Added `{% if church.owner %}` checks in all templates before accessing owner properties. When no manager exists, displays "No Manager" in red with appropriate styling.

**Templates Fixed**:
- `church_profile_admin.html` - Church detail page
- `super_admin_churches.html` - Church list page
- `super_admin_verifications.html` - Verifications page
- `super_admin_posts.html` - Posts list page

## Notes

- The form maintains all existing validations for profile completeness
- Email notifications are still sent when a user is assigned as manager
- No notification is sent when a church becomes managerless
- The system gracefully handles churches without owners throughout the application
- All templates now display "No Manager" indicator for managerless churches

## Related Files Modified

1. `core/models.py` - Church model owner field
2. `core/forms.py` - SuperAdminChurchCreateForm (fixed save method)
3. `core/views.py` - super_admin_create_church and super_admin_edit_church
4. `templates/core/super_admin_create_church.html` - Template updates
5. `templates/core/partials/church_profile_admin.html` - Added null checks for owner
6. `templates/core/super_admin_churches.html` - Added null checks for owner in list view
7. `templates/core/super_admin_verifications.html` - Added null checks for owner
8. `templates/core/super_admin_posts.html` - Added null checks for owner
9. `core/migrations/0035_make_church_owner_nullable.py` - Database migration

## Recommendations

1. **Run Migration**: Execute `python manage.py migrate core` to apply database changes
2. **Test Thoroughly**: Test all scenarios in the testing checklist
3. **Monitor Notifications**: Verify email notifications work correctly for manager assignments
4. **Check Permissions**: Ensure managerless churches don't break any permission checks in other parts of the application
5. **Update Documentation**: Update any user documentation about church management

## Future Enhancements

- Add ability to assign multiple managers to a church
- Add notification when a manager is removed
- Add audit log for manager changes
- Add bulk manager assignment/removal
- Add manager invitation system for users without complete profiles
