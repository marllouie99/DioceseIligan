"""
Philippine Address API Views
Provides cascading dropdown data for Region → Province → City/Municipality → Barangay
Uses PSGC API (Philippine Standard Geographic Code)
"""
import requests
import logging
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.core.cache import cache

logger = logging.getLogger(__name__)

# PSGC API Base URL
PSGC_API_BASE = "https://psgc.gitlab.io/api"


@require_GET
def get_regions(request):
    """Get all regions in the Philippines"""
    cache_key = 'ph_regions'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return JsonResponse({'success': True, 'data': cached_data})
    
    try:
        response = requests.get(f"{PSGC_API_BASE}/regions/", timeout=10)
        response.raise_for_status()
        regions = response.json()
        
        # Format for dropdown
        formatted_regions = [
            {
                'code': region['code'],
                'name': region['name'],
                'region_name': region['regionName']
            }
            for region in regions
        ]
        
        # Cache for 24 hours (regions don't change often)
        cache.set(cache_key, formatted_regions, 86400)
        
        return JsonResponse({'success': True, 'data': formatted_regions})
    except Exception as e:
        logger.error(f"Failed to fetch regions: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_GET
def get_provinces(request):
    """Get provinces by region code"""
    region_code = request.GET.get('region_code')
    
    if not region_code or region_code == 'undefined':
        return JsonResponse({'success': False, 'error': 'region_code is required'}, status=400)
    
    cache_key = f'ph_provinces_{region_code}'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return JsonResponse({'success': True, 'data': cached_data})
    
    try:
        response = requests.get(f"{PSGC_API_BASE}/regions/{region_code}/provinces/", timeout=10)
        response.raise_for_status()
        provinces = response.json()
        
        # Format for dropdown
        formatted_provinces = [
            {
                'code': province['code'],
                'name': province['name']
            }
            for province in provinces
        ]
        
        # Cache for 24 hours
        cache.set(cache_key, formatted_provinces, 86400)
        
        return JsonResponse({'success': True, 'data': formatted_provinces})
    except Exception as e:
        logger.error(f"Failed to fetch provinces for region {region_code}: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_GET
def get_cities_municipalities(request):
    """Get cities/municipalities by province code"""
    province_code = request.GET.get('province_code')
    
    if not province_code:
        return JsonResponse({'success': False, 'error': 'province_code is required'}, status=400)
    
    cache_key = f'ph_cities_{province_code}'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return JsonResponse({'success': True, 'data': cached_data})
    
    try:
        response = requests.get(f"{PSGC_API_BASE}/provinces/{province_code}/cities-municipalities/", timeout=10)
        response.raise_for_status()
        cities = response.json()
        
        # Format for dropdown
        formatted_cities = [
            {
                'code': city['code'],
                'name': city['name']
            }
            for city in cities
        ]
        
        # Cache for 24 hours
        cache.set(cache_key, formatted_cities, 86400)
        
        return JsonResponse({'success': True, 'data': formatted_cities})
    except Exception as e:
        logger.error(f"Failed to fetch cities for province {province_code}: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@require_GET
def get_barangays(request):
    """Get barangays by city/municipality code"""
    city_code = request.GET.get('city_code')
    
    if not city_code:
        return JsonResponse({'success': False, 'error': 'city_code is required'}, status=400)
    
    cache_key = f'ph_barangays_{city_code}'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return JsonResponse({'success': True, 'data': cached_data})
    
    try:
        response = requests.get(f"{PSGC_API_BASE}/cities-municipalities/{city_code}/barangays/", timeout=10)
        response.raise_for_status()
        barangays = response.json()
        
        # Format for dropdown
        formatted_barangays = [
            {
                'code': barangay['code'],
                'name': barangay['name']
            }
            for barangay in barangays
        ]
        
        # Cache for 24 hours
        cache.set(cache_key, formatted_barangays, 86400)
        
        return JsonResponse({'success': True, 'data': formatted_barangays})
    except Exception as e:
        logger.error(f"Failed to fetch barangays for city {city_code}: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
