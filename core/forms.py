from django import forms
from django.contrib.auth import get_user_model
from .models import (
    Church,
    ChurchFollow,
    BookableService,
    Availability,
    ServiceImage,
    Booking,
    Post,
    ChurchVerificationRequest,
    ChurchVerificationDocument,
    DeclineReason,
)
from .form_utils import get_form_widgets, clean_phone_field, clean_name_field


class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultipleFileField(forms.FileField):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget", MultipleFileInput())
        super().__init__(*args, **kwargs)

    def clean(self, data, initial=None):
        single_file_clean = super().clean
        if isinstance(data, (list, tuple)):
            result = [single_file_clean(d, initial) for d in data]
        else:
            result = single_file_clean(data, initial)
        return result


User = get_user_model()


def get_grouped_denomination_choices():
    """Return grouped denomination choices for selects using optgroups.
    Groups tailored for Iligan: Roman Catholic, Protestant & Evangelical,
    Other Christian, Islam, Indigenous Beliefs, Other Faiths.
    Values remain model codes.
    """
    from .models import Church
    label_map = dict(Church.DENOMINATION_CHOICES)
    roman_catholic = ['catholic']
    protestant_evangelical = [
        'protestant', 'uccp', 'baptist', 'methodist', 'presbyterian',
        'lutheran', 'pentecostal', 'evangelical'
    ]
    other_christian = ['iglesia_ni_cristo', 'adventist', 'mormon', 'jehovah', 'orthodox']
    islam = ['islam']
    indigenous = ['indigenous']
    other_faiths = ['buddhism', 'hinduism', 'other']

    def to_pairs(keys):
        return [(k, label_map.get(k, k.title())) for k in keys if k in label_map]

    return [
        ('Roman Catholic', to_pairs(roman_catholic)),
        ('Protestant & Evangelical', to_pairs(protestant_evangelical)),
        ('Other Christian', to_pairs(other_christian)),
        ('Islam', to_pairs(islam)),
        ('Indigenous Beliefs', to_pairs(indigenous)),
        ('Other Faiths', to_pairs(other_faiths)),
    ]

class ChurchVerificationUploadForm(forms.Form):
    """Upload at least 2 legal documents for church verification in the Philippines."""
    documents = MultipleFileField(
        required=True,
        help_text="Upload at least two legal documents (PDF/JPG/PNG/WebP). Max 10MB each.",
        widget=MultipleFileInput(attrs={
            'class': 'form-input',
            'accept': 'application/pdf,image/*',
            'multiple': True,
        })
    )
    agree = forms.BooleanField(
        required=True,
        label="I confirm these documents are authentic and authorized for submission"
    )

    def clean_documents(self):
        files = self.cleaned_data.get('documents') or []
        # Normalize to list
        if not isinstance(files, (list, tuple)):
            files = [files]
        if len(files) < 2:
            raise forms.ValidationError('Please upload at least two legal documents.')
        allowed = {'application/pdf', 'image/jpeg', 'image/png', 'image/webp'}
        for f in files:
            if getattr(f, 'size', 0) > 10 * 1024 * 1024:
                raise forms.ValidationError(f"{getattr(f, 'name', 'File')} is larger than 10MB.")
            ctype = getattr(f, 'content_type', '')
            if ctype not in allowed:
                raise forms.ValidationError(f"Unsupported file type: {ctype}. Allowed: PDF, JPG, PNG, WebP.")
        return files


class ChurchCreateForm(forms.ModelForm):
    """Streamlined form for creating a new church - focused on essential booking/appointment system info."""
    
    # Additional fields for better UX
    confirm_ownership = forms.BooleanField(
        required=True,
        widget=forms.CheckboxInput(attrs={'class': 'form-checkbox'}),
        label="I confirm that I am authorized to create and manage this church listing"
    )
    
    class Meta:
        model = Church
        # Essential fields only for church booking/appointment system
        fields = [
            # Basic Information (Required)
            'name', 'description', 'denomination',
            
            # Contact Information (Required for bookings)
            'email', 'phone',
            
            # Location (Required for appointments)
            'address', 'city', 'state', 'country',
            
            # Visual Identity (Important for social media)
            'logo', 'cover_image',
            
            # Service Information (Essential for booking system)
            'service_times',
            
            # Social Media (Optional but important for engagement)
            'facebook_url', 'instagram_url',
            
            # Payment Information (Optional - needed for donations)
            'paypal_email'
        ]
        widgets = {
            # Basic Information
            'name': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Enter your church name',
                'maxlength': 200,
                'required': True
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Briefly describe your church and what makes it special (this will be visible to visitors)',
                'rows': 4,
                'required': True
            }),
            'denomination': forms.Select(attrs={
                'class': 'form-select',
                'required': True
            }),
            
            # Contact Information
            'email': forms.EmailInput(attrs={
                'class': 'form-input',
                'placeholder': 'church@example.com',
                'required': True
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': '+63 123 456 7890',
                'required': True
            }),
            
            # Location
            'address': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Complete street address (needed for appointments)',
                'rows': 2,
                'required': True
            }),
            'city': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'City',
                'required': True
            }),
            'state': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'State/Province',
                'required': True
            }),
            'country': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Country',
                'required': True
            }),
            
            # Visual Identity
            'logo': forms.FileInput(attrs={
                'class': 'form-input',
                'accept': 'image/*'
            }),
            'cover_image': forms.FileInput(attrs={
                'class': 'form-input',
                'accept': 'image/*'
            }),
            
            # Service Information
            'service_times': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Service times (e.g., Sunday 9:00 AM, 11:00 AM\nWednesday 7:00 PM)',
                'rows': 3,
                'required': True
            }),
            
            # Social Media
            'facebook_url': forms.URLInput(attrs={
                'class': 'form-input',
                'placeholder': 'https://facebook.com/yourchurch'
            }),
            'instagram_url': forms.URLInput(attrs={
                'class': 'form-input',
                'placeholder': 'https://instagram.com/yourchurch'
            }),
            
            # Payment Information
            'paypal_email': forms.EmailInput(attrs={
                'class': 'form-input',
                'placeholder': 'paypal@yourchurch.com (for receiving donations)'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        # Group denomination choices for better UX
        try:
            self.fields['denomination'].choices = get_grouped_denomination_choices()
        except Exception:
            pass

        # Set default country
        if not self.instance.pk:
            self.fields['country'].initial = 'Philippines'
    
    def clean_name(self):
        return clean_name_field(self.cleaned_data.get('name'), Church, self.instance)
    
    def clean_phone(self):
        return clean_phone_field(self.cleaned_data.get('phone'))
    
    def clean_pastor_phone(self):
        return clean_phone_field(self.cleaned_data.get('pastor_phone'))
    
    def save(self, commit=True):
        church = super().save(commit=False)
        if self.user:
            church.owner = self.user
        if commit:
            church.save()
        return church


class ChurchUpdateForm(forms.ModelForm):
    """Form for updating an existing church."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make all fields not required by default for partial section updates
        for field_name, field in self.fields.items():
            field.required = False
    
    class Meta:
        model = Church
        fields = [
            'name', 'description', 'denomination', 'size',
            'email', 'phone', 'website',
            'address', 'city', 'state', 'country', 'postal_code',
            'pastor_name', 'pastor_email', 'pastor_phone',
            'logo', 'cover_image',
            'service_times', 'special_services', 'ministries',
            'facebook_url', 'instagram_url', 'youtube_url', 'twitter_url',
            'paypal_email',
            'member_count', 'is_active'
        ]
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Enter church name',
                'maxlength': 200
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Describe your church, its mission, and what makes it special',
                'rows': 4
            }),
            'denomination': forms.Select(attrs={'class': 'form-select'}),
            'size': forms.Select(attrs={'class': 'form-select'}),
            'email': forms.EmailInput(attrs={
                'class': 'form-input',
                'placeholder': 'church@example.com'
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': '+63 123 456 7890'
            }),
            'website': forms.URLInput(attrs={
                'class': 'form-input',
                'placeholder': 'https://www.yourchurch.com'
            }),
            'address': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Enter complete street address',
                'rows': 2
            }),
            'city': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'City'
            }),
            'state': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'State/Province'
            }),
            'country': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Country'
            }),
            'postal_code': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Postal/ZIP code'
            }),
            'pastor_name': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Lead pastor/minister name'
            }),
            'pastor_email': forms.EmailInput(attrs={
                'class': 'form-input',
                'placeholder': 'pastor@example.com'
            }),
            'pastor_phone': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': '+63 123 456 7890'
            }),
            'service_times': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'e.g., Sunday 9:00 AM, 11:00 AM\nWednesday 7:00 PM',
                'rows': 3
            }),
            'special_services': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Special services, events, or programs',
                'rows': 3
            }),
            'ministries': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Available ministries and programs',
                'rows': 3
            }),
            'facebook_url': forms.URLInput(attrs={
                'class': 'form-input',
                'placeholder': 'https://facebook.com/yourchurch'
            }),
            'instagram_url': forms.URLInput(attrs={
                'class': 'form-input',
                'placeholder': 'https://instagram.com/yourchurch'
            }),
            'youtube_url': forms.URLInput(attrs={
                'class': 'form-input',
                'placeholder': 'https://youtube.com/yourchurch'
            }),
            'twitter_url': forms.URLInput(attrs={
                'class': 'form-input',
                'placeholder': 'https://twitter.com/yourchurch'
            }),
            'paypal_email': forms.EmailInput(attrs={
                'class': 'form-input',
                'placeholder': 'paypal@yourchurch.com (required for receiving donations)'
            }),
            'member_count': forms.NumberInput(attrs={
                'class': 'form-input',
                'placeholder': 'Approximate number of members',
                'min': 0
            }),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-checkbox'}),
        }
    
    def clean_name(self):
        return clean_name_field(self.cleaned_data.get('name'), Church, self.instance)
    
    def clean_phone(self):
        return clean_phone_field(self.cleaned_data.get('phone'))
    
    def clean_pastor_phone(self):
        return clean_phone_field(self.cleaned_data.get('pastor_phone'))


class ChurchSearchForm(forms.Form):
    """Form for searching churches."""
    query = forms.CharField(
        max_length=100,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'search-input',
            'placeholder': 'Search churches by name, city, or denomination...',
            'autocomplete': 'off'
        })
    )
    denomination = forms.ChoiceField(required=False, widget=forms.Select(attrs={'class': 'form-select'}))
    city = forms.CharField(
        max_length=100,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-input',
            'placeholder': 'City'
        })
    )
    size = forms.ChoiceField(
        choices=[('', 'All Sizes')] + Church.SIZE_CHOICES,
        required=False,
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Top option for all + grouped choices
        try:
            grouped = get_grouped_denomination_choices()
            self.fields['denomination'].choices = [('', 'All Denominations')] + grouped
        except Exception:
            self.fields['denomination'].choices = [('', 'All Denominations')] + Church.DENOMINATION_CHOICES


class BookableServiceForm(forms.ModelForm):
    """Form for creating and editing bookable services with minimal restrictions."""
    
    # Multiple image upload field
    images = MultipleFileField(
        widget=MultipleFileInput(attrs={
            'class': 'form-input',
            'accept': 'image/*',
            'multiple': True
        }),
        required=False,
        help_text="Upload multiple images for this service"
    )
    
    class Meta:
        model = BookableService
        fields = [
            'name', 'description', 'image', 'price', 'is_free', 'currency', 'duration', 
            'max_bookings_per_day', 'advance_booking_days', 'is_active', 
            'requires_approval', 'preparation_notes', 'cancellation_policy'
        ]
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'e.g., Counseling Session, Baptism, Wedding Consultation',
                'maxlength': 200
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Describe what this service includes and what people can expect (optional)',
                'rows': 3
            }),
            'image': forms.FileInput(attrs={
                'class': 'form-input',
                'accept': 'image/*'
            }),
            'price': forms.NumberInput(attrs={
                'class': 'form-input',
                'step': '0.01',
                'min': '0',
                'placeholder': '0.00'
            }),
            'is_free': forms.CheckboxInput(attrs={'class': 'form-checkbox'}),
            'currency': forms.Select(attrs={'class': 'form-select'}),
            'duration': forms.Select(attrs={'class': 'form-select'}),
            'max_bookings_per_day': forms.NumberInput(attrs={
                'class': 'form-input',
                'min': 1,
                'max': 1000,
                'placeholder': '10'
            }),
            'advance_booking_days': forms.NumberInput(attrs={
                'class': 'form-input',
                'min': 0,
                'max': 365,
                'placeholder': '7'
            }),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-checkbox'}),
            'requires_approval': forms.CheckboxInput(attrs={'class': 'form-checkbox'}),
            'preparation_notes': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Instructions for people booking this service (optional)',
                'rows': 2
            }),
            'cancellation_policy': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Cancellation policy (optional)',
                'rows': 2
            }),
        }
    
    def __init__(self, *args, **kwargs):
        self.church = kwargs.pop('church', None)
        super().__init__(*args, **kwargs)
        
        # Set initial value for is_free checkbox
        if self.instance and self.instance.pk:
            self.fields['is_free'].initial = not self.instance.price
        
        # Make currency field not required initially
        self.fields['currency'].required = False
    
    def save(self, commit=True):
        service = super().save(commit=False)
        if self.church:
            service.church = self.church
        if commit:
            service.save()
        return service
    
    def clean(self):
        cleaned_data = super().clean()
        is_free = cleaned_data.get('is_free')
        price = cleaned_data.get('price')
        currency = cleaned_data.get('currency')
        
        # If service is not free and has a price, validate it
        if not is_free and price and price <= 0:
            self.add_error('price', 'Price must be greater than 0 when service is not free.')
        
        # If service is free, clear the price and currency
        if is_free:
            cleaned_data['price'] = None
            cleaned_data['currency'] = 'PHP'  # Set default currency
        
        return cleaned_data


class BookingForm(forms.ModelForm):
    """Form for creating a booking request with date and preferred time."""
    
    # Add a time field for the wizard interface
    time = forms.CharField(
        max_length=20,
        required=False,
        widget=forms.HiddenInput(),
        help_text="Preferred time slot selected by user"
    )
    
    class Meta:
        model = Booking
        fields = ['date', 'start_time', 'notes']
        widgets = {
            'date': forms.DateInput(attrs={'class': 'form-input', 'type': 'date', 'required': True}),
            'start_time': forms.TimeInput(attrs={'class': 'form-input', 'type': 'time'}),
            'notes': forms.Textarea(attrs={'class': 'form-textarea', 'rows': 3, 'placeholder': 'Additional notes (optional)'}),
        }

    def __init__(self, *args, **kwargs):
        self.service = kwargs.pop('service', None)
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        # Set HTML5 min/max for the date field when service is provided
        if self.service:
            from datetime import date, timedelta
            today = date.today()
            max_date = today + timedelta(days=self.service.advance_booking_days)
            self.fields['date'].widget.attrs.update({
                'min': today.strftime('%Y-%m-%d'),
                'max': max_date.strftime('%Y-%m-%d'),
            })

    def clean_date(self):
        d = self.cleaned_data.get('date')
        if not self.service:
            return d
        from datetime import date, timedelta
        today = date.today()
        if d < today:
            raise forms.ValidationError('Please choose a future date.')
        max_date = today + timedelta(days=self.service.advance_booking_days)
        if d > max_date:
            raise forms.ValidationError('Selected date is beyond the allowed booking window.')
        # Check availability: must not be a closed date
        closed = Availability.objects.filter(church=self.service.church, date=d, is_closed=True).exists()
        if closed:
            raise forms.ValidationError('This date is closed. Please choose another date.')
        return d
    
    def clean_time(self):
        """Parse the time string from the wizard to set start_time."""
        time_str = self.cleaned_data.get('time')
        if time_str:
            from datetime import datetime
            try:
                # Parse time strings like "9:00 AM", "2:30 PM"
                time_obj = datetime.strptime(time_str, '%I:%M %p').time()
                # Set the start_time field
                self.cleaned_data['start_time'] = time_obj
                return time_str
            except ValueError:
                raise forms.ValidationError('Invalid time format.')
        return time_str
    
    def clean(self):
        """Process the time field and convert to start_time."""
        cleaned_data = super().clean()
        time_str = cleaned_data.get('time')
        
        if time_str:
            from datetime import datetime
            try:
                # Parse time strings like "9:00 AM", "2:30 PM"
                time_obj = datetime.strptime(time_str, '%I:%M %p').time()
                # Set the start_time field
                cleaned_data['start_time'] = time_obj
            except ValueError:
                raise forms.ValidationError('Invalid time format.')
        
        return cleaned_data

    def save(self, commit=True):
        booking = super().save(commit=False)
        if self.service:
            booking.service = self.service
            booking.church = self.service.church
        if self.user:
            booking.user = self.user
        booking.status = Booking.STATUS_REQUESTED
        if commit:
            booking.save()
        return booking


class DeclineReasonForm(forms.ModelForm):
    """Form for adding/editing a church-specific decline reason."""
    class Meta:
        model = DeclineReason
        fields = ['label', 'is_active']
        widgets = {
            'label': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'e.g., Schedule conflict, Incomplete requirements',
                'maxlength': 200,
                'required': True
            }),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-checkbox'}),
        }

    def __init__(self, *args, **kwargs):
        self.church = kwargs.pop('church', None)
        super().__init__(*args, **kwargs)

    def save(self, commit=True):
        obj = super().save(commit=False)
        if self.church:
            obj.church = self.church
        if commit:
            obj.save()
        return obj


class ServiceImageForm(forms.ModelForm):
    """Form for adding service images."""
    
    class Meta:
        model = ServiceImage
        fields = ['image', 'caption', 'order', 'is_primary']
        widgets = {
            'image': forms.FileInput(attrs={
                'class': 'form-input',
                'accept': 'image/*'
            }),
            'caption': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Image caption (optional)',
                'maxlength': 200
            }),
            'order': forms.NumberInput(attrs={
                'class': 'form-input',
                'min': 0,
                'placeholder': '0'
            }),
            'is_primary': forms.CheckboxInput(attrs={'class': 'form-checkbox'}),
        }


class AvailabilityForm(forms.ModelForm):
    """Form for creating and editing availability entries."""
    
    class Meta:
        model = Availability
        fields = [
            'date', 'type', 'is_closed', 'start_time', 'end_time',
            'reason', 'notes'
        ]
        widgets = {
            'date': forms.DateInput(attrs={
                'class': 'form-input',
                'type': 'date'
            }),
            'type': forms.Select(attrs={'class': 'form-select'}),
            'is_closed': forms.CheckboxInput(attrs={'class': 'form-checkbox'}),
            'start_time': forms.TimeInput(attrs={
                'class': 'form-input',
                'type': 'time'
            }),
            'end_time': forms.TimeInput(attrs={
                'class': 'form-input',
                'type': 'time'
            }),
            'reason': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'e.g., Holiday, Maintenance, Special Event',
                'maxlength': 200
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Additional details about this availability change',
                'rows': 3
            }),
        }
    
    def __init__(self, *args, **kwargs):
        self.church = kwargs.pop('church', None)
        super().__init__(*args, **kwargs)
        
        # Make time fields required when not closed
        if self.instance and not self.instance.is_closed:
            self.fields['start_time'].required = True
            self.fields['end_time'].required = True
    
    def clean(self):
        cleaned_data = super().clean()
        is_closed = cleaned_data.get('is_closed')
        start_time = cleaned_data.get('start_time')
        end_time = cleaned_data.get('end_time')
        date_field = cleaned_data.get('date')
        
        # Check if date is in the past
        if date_field:
            from datetime import date
            if date_field < date.today():
                self.add_error('date', 'Cannot create availability entries for past dates.')
        
        # If not closed, require start and end times
        if not is_closed:
            if not start_time:
                self.add_error('start_time', 'Start time is required when church is not closed.')
            if not end_time:
                self.add_error('end_time', 'End time is required when church is not closed.')
            
            # Validate that end time is after start time
            if start_time and end_time and end_time <= start_time:
                self.add_error('end_time', 'End time must be after start time.')
        
        return cleaned_data
    
    def save(self, commit=True):
        availability = super().save(commit=False)
        if self.church:
            availability.church = self.church
        if commit:
            availability.save()
        return availability


class AvailabilityBulkForm(forms.Form):
    """Form for bulk availability management."""
    
    dates = forms.CharField(
        widget=forms.HiddenInput(),
        help_text="Comma-separated list of dates"
    )
    action = forms.ChoiceField(
        choices=[
            ('close', 'Close these dates'),
            ('open', 'Open these dates'),
            ('special_hours', 'Set special hours'),
        ],
        widget=forms.RadioSelect(attrs={'class': 'form-radio'})
    )
    start_time = forms.TimeField(
        required=False,
        widget=forms.TimeInput(attrs={
            'class': 'form-input',
            'type': 'time'
        })
    )
    end_time = forms.TimeField(
        required=False,
        widget=forms.TimeInput(attrs={
            'class': 'form-input',
            'type': 'time'
        })
    )
    reason = forms.CharField(
        max_length=200,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-input',
            'placeholder': 'Reason for availability change'
        })
    )
    notes = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'form-textarea',
            'placeholder': 'Additional notes',
            'rows': 3
        })
    )
    
    def clean(self):
        cleaned_data = super().clean()
        action = cleaned_data.get('action')
        start_time = cleaned_data.get('start_time')
        end_time = cleaned_data.get('end_time')
        
        # If setting special hours, require times
        if action == 'special_hours':
            if not start_time:
                self.add_error('start_time', 'Start time is required for special hours.')
            if not end_time:
                self.add_error('end_time', 'End time is required for special hours.')
            
            if start_time and end_time and end_time <= start_time:
                self.add_error('end_time', 'End time must be after start time.')
        
        return cleaned_data


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['content', 'image', 'post_type', 'event_title', 'event_start_date', 
                  'event_end_date', 'event_location', 'max_participants', 
                  'enable_donation', 'donation_goal']
        widgets = {
            'content': forms.Textarea(attrs={
                'class': 'form-textarea',
                'rows': 4,
                'placeholder': "What's happening at your church?",
                'style': 'resize: none; border: none; outline: none; font-size: 16px;'
            }),
            'image': forms.FileInput(attrs={
                'class': 'form-input',
                'accept': 'image/*,video/*',
                'style': 'display: none;'
            }),
            'event_start_date': forms.DateTimeInput(attrs={
                'type': 'datetime-local',
                'class': 'form-input'
            }),
            'event_end_date': forms.DateTimeInput(attrs={
                'type': 'datetime-local',
                'class': 'form-input'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        self.church = kwargs.pop('church', None)
        super().__init__(*args, **kwargs)
        # Make event fields not required by default
        self.fields['event_title'].required = False
        self.fields['event_start_date'].required = False
        self.fields['event_end_date'].required = False
        self.fields['event_location'].required = False
        self.fields['max_participants'].required = False
        # Make donation fields not required by default
        self.fields['enable_donation'].required = False
        self.fields['donation_goal'].required = False
    
    def clean_content(self):
        content = self.cleaned_data.get('content')
        if not content or not content.strip():
            raise forms.ValidationError("Post content cannot be empty.")
        return content.strip()
    
    def clean_image(self):
        image = self.cleaned_data.get('image')
        if image:
            # Check file size (max 10MB)
            if image.size > 10 * 1024 * 1024:
                raise forms.ValidationError("Image file too large. Maximum size is 10MB.")
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            if image.content_type not in allowed_types:
                raise forms.ValidationError("Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.")
        
        return image
    
    def clean(self):
        cleaned_data = super().clean()
        post_type = cleaned_data.get('post_type')
        enable_donation = cleaned_data.get('enable_donation')
        
        # Validate event-specific fields if post type is event
        if post_type == 'event':
            event_title = cleaned_data.get('event_title')
            event_start_date = cleaned_data.get('event_start_date')
            event_end_date = cleaned_data.get('event_end_date')
            
            if not event_title or not event_title.strip():
                raise forms.ValidationError("Event title is required for event posts.")
            
            if not event_start_date:
                raise forms.ValidationError("Event start date is required for event posts.")
            
            if not event_end_date:
                raise forms.ValidationError("Event end date is required for event posts.")
            
            # Validate end date is after start date
            if event_start_date and event_end_date and event_end_date < event_start_date:
                raise forms.ValidationError("Event end date must be after start date.")
        
        # Validate PayPal email is set if donations are enabled
        if enable_donation and self.church:
            if not self.church.paypal_email:
                raise forms.ValidationError(
                    "Please set up your PayPal email in Church Profile settings before enabling donations. "
                    "This is required to receive donation payments directly."
                )
        
        return cleaned_data
