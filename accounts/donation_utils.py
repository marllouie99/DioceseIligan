"""
Utility functions for donation ranking system
"""
from django.db.models import Sum
from core.models import Donation


# Define ranking tiers (in PHP)
RANK_TIERS = [
    {'name': 'Bronze Supporter', 'min': 50, 'max': 999, 'color': '#CD7F32', 'icon': 'bronze'},
    {'name': 'Silver Supporter', 'min': 1000, 'max': 4999, 'color': '#C0C0C0', 'icon': 'silver'},
    {'name': 'Gold Supporter', 'min': 5000, 'max': 9999, 'color': '#FFD700', 'icon': 'gold'},
    {'name': 'Platinum Supporter', 'min': 10000, 'max': 24999, 'color': '#8B9DC3', 'icon': 'platinum'},
    {'name': 'Diamond Supporter', 'min': 25000, 'max': 49999, 'color': '#B9F2FF', 'icon': 'diamond'},
    {'name': 'Champion of Faith', 'min': 50000, 'max': float('inf'), 'color': '#9D00FF', 'icon': 'champion'},
]


def get_user_donation_rank(user):
    """
    Get the donation rank for a user.
    Returns None if user has no rank (donated less than ₱50).
    Returns dict with rank info if user has a rank.
    """
    if not user or not user.is_authenticated:
        return None
    
    # Check if user wants to show their rank
    try:
        profile = user.profile
        if not profile.show_donation_rank:
            return None
    except:
        return None
    
    # Calculate total donations
    total_donated = Donation.objects.filter(
        donor=user,
        payment_status='completed'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Determine rank
    if total_donated < 50:
        return None
    
    for tier in RANK_TIERS:
        if tier['min'] <= total_donated <= tier['max']:
            return tier
    
    return None


def get_rank_badge_html(rank, size='small'):
    """
    Generate HTML for a rank badge.
    
    Args:
        rank: Dict with rank info (name, color, icon)
        size: 'small', 'medium', or 'large'
    
    Returns:
        HTML string for the badge
    """
    if not rank:
        return ''
    
    size_classes = {
        'small': 'rank-badge-sm',
        'medium': 'rank-badge-md',
        'large': 'rank-badge-lg'
    }
    
    size_class = size_classes.get(size, 'rank-badge-sm')
    
    return f'''
    <span class="donation-rank-badge {size_class}" 
          style="background: {rank['color']}22; color: {rank['color']}; border: 1px solid {rank['color']}44;"
          title="{rank['name']}">
        {rank['name']}
    </span>
    '''
