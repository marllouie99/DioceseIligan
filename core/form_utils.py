"""
Shared form utilities and validators.
"""
from django import forms
from django.core.validators import RegexValidator


class PhoneValidator:
    """Reusable phone number validator."""
    
    def __init__(self):
        self.validator = RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message='Enter a valid phone number.'
        )
    
    def __call__(self, value):
        if value:
            self.validator(value)
        return value


def get_form_widgets():
    """
    Get common form widgets with consistent styling.
    
    Returns:
        dict: Common widget configurations
    """
    return {
        'text_input': {
            'class': 'form-input',
            'placeholder': 'Enter text'
        },
        'email_input': {
            'class': 'form-input',
            'placeholder': 'email@example.com'
        },
        'phone_input': {
            'class': 'form-input',
            'placeholder': '+63 123 456 7890'
        },
        'url_input': {
            'class': 'form-input',
            'placeholder': 'https://www.example.com'
        },
        'textarea': {
            'class': 'form-textarea',
            'rows': 4
        },
        'select': {
            'class': 'form-select'
        },
        'checkbox': {
            'class': 'form-checkbox'
        },
        'number_input': {
            'class': 'form-input',
            'min': 0
        }
    }


def clean_phone_field(phone_value):
    """
    Clean and validate phone number field.
    
    Args:
        phone_value: The phone number value to clean
    
    Returns:
        str: Cleaned phone number
    
    Raises:
        forms.ValidationError: If phone number is invalid
    """
    if phone_value:
        validator = PhoneValidator()
        validator(phone_value)
    return phone_value


def clean_name_field(name_value, model_class, instance=None):
    """
    Clean and validate name field for uniqueness.
    
    Args:
        name_value: The name value to clean
        model_class: The model class to check against
        instance: Current instance (for updates)
    
    Returns:
        str: Cleaned name
    
    Raises:
        forms.ValidationError: If name already exists
    """
    if name_value:
        # Check if name already exists
        existing = model_class.objects.filter(name__iexact=name_value)
        if instance and instance.pk:
            existing = existing.exclude(pk=instance.pk)
        if existing.exists():
            raise forms.ValidationError(f'A {model_class._meta.verbose_name.lower()} with this name already exists.')
    return name_value
