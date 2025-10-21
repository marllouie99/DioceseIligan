# Map Navigation Feature

## Overview
The church location in the church detail page is now clickable and will open the location in a maps application.

## Implementation Details

### Files Modified

1. **`templates/partials/church/header.html`**
   - Added clickable location link with map icon
   - Includes data attributes for latitude, longitude, and address

2. **`static/css/pages/church_detail.css`**
   - Added styles for `.location-link` with hover effects
   - Styled `.location-icon` for proper sizing

3. **`static/js/core/church_detail.js`**
   - Added event listener for location link clicks
   - Implemented `openInMaps(lat, lng)` function
   - Implemented `openInMapsByAddress(address)` function as fallback

## How It Works

### URL Schemes Used

The implementation uses different URL schemes based on the user's platform:

#### iOS Devices
- **Primary**: `maps://maps.apple.com/?q={lat},{lng}` (Apple Maps)
- **Fallback**: Google Maps web URL

#### Android Devices
- **Primary**: `geo:{lat},{lng}?q={lat},{lng}` (Default maps app)
- **Fallback**: Google Maps web URL

#### Desktop/Other Devices
- **Direct**: Google Maps web URL in new tab

### Coordinate-Based vs Address-Based

1. **If coordinates (latitude/longitude) are available**: Uses coordinate-based navigation for better accuracy
2. **If only address is available**: Falls back to address-based search
3. **If neither is available**: Shows error notification

## Google Maps URLs API

The implementation uses the **Google Maps URLs API** which doesn't require an API key:

### Search Query Format
```
https://www.google.com/maps/search/?api=1&query={lat},{lng}
```
or
```
https://www.google.com/maps/search/?api=1&query={encoded_address}
```

### Parameters
- `api=1`: Required parameter for the Maps URLs API
- `query`: The search query (coordinates or address)

### Benefits
- ✅ No API key required
- ✅ Works on all platforms
- ✅ Opens in Google Maps app on mobile (if installed)
- ✅ Opens in browser on desktop
- ✅ Free to use with no quotas

## Testing Checklist

- [ ] Test on desktop browser (Chrome, Firefox, Edge)
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test with churches that have coordinates
- [ ] Test with churches that only have addresses
- [ ] Test with churches that have no location data
- [ ] Verify hover effect on location link
- [ ] Verify map icon displays correctly

## Future Enhancements

### 1. Add Coordinates to Existing Churches
If churches don't have latitude/longitude values, you can:
- Use a geocoding service to convert addresses to coordinates
- Add a management command to bulk geocode existing churches
- Allow church owners to set coordinates manually in church settings

### 2. Embedded Map Preview
Consider adding an embedded map in the church detail page:
```html
<div class="map-preview">
  <iframe 
    src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q={lat},{lng}"
    width="100%" 
    height="300" 
    frameborder="0">
  </iframe>
</div>
```
**Note**: This requires a Google Maps Embed API key.

### 3. Directions Feature
Add a "Get Directions" button that opens maps with directions from user's current location:
```javascript
// For Google Maps
https://www.google.com/maps/dir/?api=1&destination={lat},{lng}

// For Apple Maps (iOS)
maps://maps.apple.com/?daddr={lat},{lng}

// For Android
google.navigation:q={lat},{lng}
```

### 4. Waze Integration
Add option to open in Waze navigation app:
```javascript
https://waze.com/ul?ll={lat},{lng}&navigate=yes
```

## Browser Compatibility

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ iOS Safari (Apple Maps integration)
- ✅ Android Chrome (Google Maps integration)

## Security Considerations

- URL schemes are safe to use (no XSS risk)
- Address encoding prevents injection attacks
- No API keys exposed in client-side code
- Uses HTTPS for all web-based map URLs

## Troubleshooting

### Issue: Location link doesn't work on mobile
**Solution**: Ensure the device has a maps app installed. The fallback will open Google Maps in the browser.

### Issue: Coordinates show as "None"
**Solution**: Add latitude and longitude values to the church in the admin panel or church settings.

### Issue: Map opens to wrong location
**Solution**: Verify the coordinates in the database are correct (latitude should be between -90 and 90, longitude between -180 and 180).

## Related Documentation

- [Google Maps URLs API Documentation](https://developers.google.com/maps/documentation/urls/get-started)
- [Apple Maps URL Scheme](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html)
- [Android Geo URI Scheme](https://developer.android.com/guide/components/intents-common#Maps)
