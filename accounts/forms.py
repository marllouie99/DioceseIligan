from django import forms
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from .email_utils import send_verification_code, verify_email_code, has_recent_verification, verify_password_reset_code

User = get_user_model()


class LoginForm(forms.Form):
    email_or_username = forms.CharField(label='Email', widget=forms.TextInput(attrs={
        'placeholder': 'Enter your email',
        'autocomplete': 'email'
    }))
    password = forms.CharField(label='Password', widget=forms.PasswordInput(attrs={
        'placeholder': 'Enter your password',
        'autocomplete': 'current-password'
    }))

    def clean(self):
        cleaned = super().clean()
        identifier = cleaned.get('email_or_username')
        password = cleaned.get('password')
        if not identifier or not password:
            return cleaned

        user = None
        # Try email lookup first
        try:
            user_obj = User.objects.get(email__iexact=identifier)
            user = authenticate(username=user_obj.get_username(), password=password)
        except User.DoesNotExist:
            # Fallback: treat as username
            user = authenticate(username=identifier, password=password)
        except User.MultipleObjectsReturned:
            # Multiple users with same email - try to authenticate with each
            users = User.objects.filter(email__iexact=identifier)
            for user_obj in users:
                user = authenticate(username=user_obj.get_username(), password=password)
                if user:
                    break

        if not user:
            raise forms.ValidationError('Invalid credentials. Please check your email/username and password.')

        cleaned['user'] = user
        return cleaned


class SignupForm(forms.Form):
    full_name = forms.CharField(label='Full name', widget=forms.TextInput(attrs={
        'placeholder': 'Enter your full name', 'autocomplete': 'name'
    }))
    email = forms.EmailField(label='Email', widget=forms.EmailInput(attrs={
        'placeholder': 'Enter your email', 'autocomplete': 'email'
    }))
    password = forms.CharField(label='Password', widget=forms.PasswordInput(attrs={
        'placeholder': 'Enter your password', 'autocomplete': 'new-password'
    }))
    confirm_password = forms.CharField(label='Confirm password', widget=forms.PasswordInput(attrs={
        'placeholder': 'Confirm your password', 'autocomplete': 'new-password'
    }))

    def clean_email(self):
        email = self.cleaned_data['email']
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError('An account with this email already exists.')
        return email

    def clean(self):
        cleaned = super().clean()
        pwd = cleaned.get('password')
        cpw = cleaned.get('confirm_password')
        if pwd and cpw and pwd != cpw:
            self.add_error('confirm_password', 'Passwords do not match.')
        # Validate password strength with Django's validators
        if pwd:
            try:
                validate_password(pwd)
            except forms.ValidationError as e:
                self.add_error('password', e)
        return cleaned

    def save(self):
        full_name = self.cleaned_data['full_name'].strip()
        email = self.cleaned_data['email']
        password = self.cleaned_data['password']

        base_username = email.split('@')[0][:30] or 'user'
        username = base_username
        suffix = 1
        while User.objects.filter(username__iexact=username).exists():
            username = f"{base_username}{suffix}"
            suffix += 1

        first_name = ''
        last_name = ''
        if full_name:
            parts = full_name.split(' ', 1)
            first_name = parts[0]
            if len(parts) > 1:
                last_name = parts[1]

        user = User.objects.create_user(username=username, email=email, password=password,
                                        first_name=first_name, last_name=last_name)

        # Set Profile.display_name to full_name if available
        try:
            profile = user.profile
            profile.display_name = full_name or username
            profile.save()
        except Exception:
            try:
                from .models import Profile
                Profile.objects.get_or_create(user=user, defaults={'display_name': full_name or username})
            except Exception:
                pass

        return user


class EmailVerificationForm(forms.Form):
    """Form for email verification step"""
    verification_code = forms.CharField(
        max_length=6,
        min_length=6,
        label='Verification Code',
        widget=forms.TextInput(attrs={
            'placeholder': 'Enter 6-digit code',
            'maxlength': '6',
            'pattern': '[0-9]{6}',
            'inputmode': 'numeric',
            'autocomplete': 'one-time-code',
            'class': 'verification-input'
        })
    )
    email = forms.EmailField(widget=forms.HiddenInput())
    
    def clean_verification_code(self):
        code = self.cleaned_data.get('verification_code')
        if code and not code.isdigit():
            raise forms.ValidationError('Verification code must contain only numbers.')
        return code
    
    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get('email')
        code = cleaned_data.get('verification_code')
        
        if email and code:
            if not verify_email_code(email, code):
                raise forms.ValidationError('Invalid or expired verification code. Please try again.')
        
        return cleaned_data


class ProfileForm(forms.Form):
    first_name = forms.CharField(max_length=150, required=False, widget=forms.TextInput(attrs={
        'placeholder': 'Enter your first name'
    }))
    last_name = forms.CharField(max_length=150, required=False, widget=forms.TextInput(attrs={
        'placeholder': 'Enter your last name'
    }))
    email = forms.EmailField(widget=forms.EmailInput(attrs={
        'placeholder': 'Enter your email'
    }))
    display_name = forms.CharField(max_length=150, required=False, widget=forms.TextInput(attrs={
        'placeholder': 'Enter your display name'
    }))
    phone = forms.CharField(max_length=20, required=False, widget=forms.TextInput(attrs={
        'placeholder': 'Enter your phone number'
    }))
    
    # Philippine Address Fields
    region = forms.CharField(max_length=200, required=False)
    province = forms.CharField(max_length=200, required=False)
    city_municipality = forms.CharField(max_length=200, required=False)
    barangay = forms.CharField(max_length=200, required=False)
    street_address = forms.CharField(max_length=300, required=False, widget=forms.TextInput(attrs={
        'placeholder': 'House/Building No., Street Name'
    }))
    postal_code = forms.CharField(max_length=10, required=False, widget=forms.TextInput(attrs={
        'placeholder': 'e.g., 9000'
    }))
    
    # Legacy address field (for backward compatibility)
    address = forms.CharField(required=False, widget=forms.Textarea(attrs={
        'placeholder': 'Enter your address', 'rows': 3
    }))
    
    bio = forms.CharField(required=False, widget=forms.Textarea(attrs={
        'placeholder': 'Tell us about yourself', 'rows': 4
    }))
    date_of_birth = forms.DateField(required=False, widget=forms.DateInput(attrs={
        'type': 'date'
    }))
    profile_image = forms.ImageField(required=False)

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        self.profile = kwargs.pop('instance', None)
        super().__init__(*args, **kwargs)
        
        if self.user:
            self.fields['first_name'].initial = self.user.first_name
            self.fields['last_name'].initial = self.user.last_name
            self.fields['email'].initial = self.user.email
            
        if self.profile:
            self.fields['display_name'].initial = self.profile.display_name
            self.fields['phone'].initial = self.profile.phone
            self.fields['region'].initial = self.profile.region
            self.fields['province'].initial = self.profile.province
            self.fields['city_municipality'].initial = self.profile.city_municipality
            self.fields['barangay'].initial = self.profile.barangay
            self.fields['street_address'].initial = self.profile.street_address
            self.fields['postal_code'].initial = self.profile.postal_code
            self.fields['address'].initial = self.profile.address
            self.fields['bio'].initial = self.profile.bio
            self.fields['date_of_birth'].initial = self.profile.date_of_birth
            self.fields['profile_image'].initial = self.profile.profile_image

    def clean_email(self):
        email = self.cleaned_data['email']
        if self.user and User.objects.filter(email__iexact=email).exclude(pk=self.user.pk).exists():
            raise forms.ValidationError('An account with this email already exists.')
        return email
    
    def clean_postal_code(self):
        postal_code = self.cleaned_data.get('postal_code', '').strip()
        if postal_code and not postal_code.isdigit():
            raise forms.ValidationError('Postal code must contain only numbers.')
        if postal_code and len(postal_code) != 4:
            raise forms.ValidationError('Postal code must be exactly 4 digits.')
        return postal_code

    def save(self, commit=True):
        if not self.user or not self.profile:
            return None
            
        # Track changes for optimization
        user_changed = False
        profile_changed = False
        
        # Update user fields (only if changed)
        new_first_name = self.cleaned_data['first_name']
        new_last_name = self.cleaned_data['last_name']
        new_email = self.cleaned_data['email']
        
        if self.user.first_name != new_first_name:
            self.user.first_name = new_first_name
            user_changed = True
            
        if self.user.last_name != new_last_name:
            self.user.last_name = new_last_name
            user_changed = True
            
        if self.user.email != new_email:
            self.user.email = new_email
            user_changed = True
        
        # Update profile fields
        # If display_name is empty, auto-generate from first_name and last_name
        display_name = self.cleaned_data['display_name']
        if not display_name.strip():
            first_name = self.cleaned_data['first_name'].strip()
            last_name = self.cleaned_data['last_name'].strip()
            if first_name and last_name:
                display_name = f"{first_name} {last_name}"
            elif first_name:
                display_name = first_name
            elif last_name:
                display_name = last_name
        
        # Only update profile fields if they've changed
        if self.profile.display_name != display_name:
            self.profile.display_name = display_name
            profile_changed = True
            
        if self.profile.phone != self.cleaned_data['phone']:
            self.profile.phone = self.cleaned_data['phone']
            profile_changed = True
        
        # Update Philippine address fields
        if self.profile.region != self.cleaned_data['region']:
            self.profile.region = self.cleaned_data['region']
            profile_changed = True
            
        if self.profile.province != self.cleaned_data['province']:
            self.profile.province = self.cleaned_data['province']
            profile_changed = True
            
        if self.profile.city_municipality != self.cleaned_data['city_municipality']:
            self.profile.city_municipality = self.cleaned_data['city_municipality']
            profile_changed = True
            
        if self.profile.barangay != self.cleaned_data['barangay']:
            self.profile.barangay = self.cleaned_data['barangay']
            profile_changed = True
            
        if self.profile.street_address != self.cleaned_data['street_address']:
            self.profile.street_address = self.cleaned_data['street_address']
            profile_changed = True
            
        if self.profile.postal_code != self.cleaned_data['postal_code']:
            self.profile.postal_code = self.cleaned_data['postal_code']
            profile_changed = True
            
        if self.profile.address != self.cleaned_data['address']:
            self.profile.address = self.cleaned_data['address']
            profile_changed = True
            
        if self.profile.bio != self.cleaned_data['bio']:
            self.profile.bio = self.cleaned_data['bio']
            profile_changed = True
            
        if self.profile.date_of_birth != self.cleaned_data['date_of_birth']:
            self.profile.date_of_birth = self.cleaned_data['date_of_birth']
            profile_changed = True
        
        # Handle profile image
        if self.cleaned_data.get('profile_image'):
            self.profile.profile_image = self.cleaned_data['profile_image']
            profile_changed = True
        
        if commit:
            # Only save if there are actual changes
            if user_changed:
                self.user.save(update_fields=['first_name', 'last_name', 'email'])
            if profile_changed:
                self.profile.save()
        
        return self.profile


class ForgotPasswordForm(forms.Form):
    """Form for requesting password reset"""
    email = forms.EmailField(
        label='Email Address',
        widget=forms.EmailInput(attrs={
            'placeholder': 'Enter your email address',
            'autocomplete': 'email',
            'class': 'form-control'
        })
    )
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if not User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError('No account found with this email address.')
        return email


class PasswordResetCodeForm(forms.Form):
    """Form for entering password reset code"""
    reset_code = forms.CharField(
        max_length=6,
        min_length=6,
        label='Reset Code',
        widget=forms.TextInput(attrs={
            'placeholder': 'Enter 6-digit code',
            'maxlength': '6',
            'pattern': '[0-9]{6}',
            'inputmode': 'numeric',
            'autocomplete': 'one-time-code',
            'class': 'verification-input'
        })
    )
    email = forms.EmailField(widget=forms.HiddenInput())
    
    def clean_reset_code(self):
        code = self.cleaned_data.get('reset_code')
        if code and not code.isdigit():
            raise forms.ValidationError('Reset code must contain only numbers.')
        return code
    
    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get('email')
        code = cleaned_data.get('reset_code')
        
        if email and code:
            if not verify_password_reset_code(email, code):
                raise forms.ValidationError('Invalid or expired reset code. Please try again.')
        
        return cleaned_data


class LoginWithCodeForm(forms.Form):
    """Form for requesting a login code"""
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'placeholder': 'Enter your email address',
            'class': 'form-control',
            'id': 'id_email'
        }),
        label='Email Address'
    )
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        
        # Check if user exists
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if not User.objects.filter(email=email).exists():
            raise forms.ValidationError('No account found with this email address.')
        
        return email


class LoginCodeVerificationForm(forms.Form):
    """Form for verifying login code"""
    email = forms.EmailField(widget=forms.HiddenInput())
    login_code = forms.CharField(
        max_length=6,
        min_length=6,
        widget=forms.TextInput(attrs={
            'placeholder': '000000',
            'class': 'verification-input',
            'id': 'id_login_code',
            'pattern': '[0-9]{6}',
            'inputmode': 'numeric'
        }),
        label='Login Code',
        help_text='Enter the 6-digit code sent to your email'
    )
    
    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get('email')
        code = cleaned_data.get('login_code')
        
        if email and code:
            from .email_utils import verify_login_code
            if not verify_login_code(email, code):
                raise forms.ValidationError('Invalid or expired login code. Please try again.')
        
        return cleaned_data


class SetNewPasswordForm(forms.Form):
    """Form for setting new password after reset"""
    new_password = forms.CharField(
        label='New Password',
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Enter your new password',
            'autocomplete': 'new-password'
        })
    )
    confirm_password = forms.CharField(
        label='Confirm New Password',
        widget=forms.PasswordInput(attrs={
            'placeholder': 'Confirm your new password',
            'autocomplete': 'new-password'
        })
    )
    email = forms.EmailField(widget=forms.HiddenInput())
    
    def clean(self):
        cleaned_data = super().clean()
        new_password = cleaned_data.get('new_password')
        confirm_password = cleaned_data.get('confirm_password')
        
        if new_password and confirm_password:
            if new_password != confirm_password:
                self.add_error('confirm_password', 'Passwords do not match.')
        
        # Validate password strength
        if new_password:
            try:
                validate_password(new_password)
            except forms.ValidationError as e:
                self.add_error('new_password', e)
        
        return cleaned_data
