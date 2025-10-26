"""
Template tags for donation ranking system
"""
from django import template
from accounts.donation_utils import get_user_donation_rank

register = template.Library()


@register.simple_tag
def get_user_rank(user):
    """
    Template tag to get a user's donation rank.
    Usage: {% get_user_rank user as user_rank %}
    """
    return get_user_donation_rank(user)
