# Location Permission Testing Guide

## Overview
This guide outlines the test scenarios for the new custom location permission modal implementation.

## Test Prerequisites
- Fresh app install (to reset permission state)
- iOS Simulator or physical device
- Expo Go or development build

## Test Scenarios

### Scenario 1: First Time User (Permission Undetermined)
**Steps:**
1. Delete and reinstall the app
2. Launch the app
3. Navigate to Home tab (should be default)

**Expected Behavior:**
- Custom modal appears with:
  - Location icon in a green circle
  - Title: "Allow "Rora" to use your location?"
  - Description about GPS helping driver find you
  - Map preview placeholder
  - "Allow Location Access" button (green)
  - "Enter Manually" button (grey)
- Modal cannot be dismissed by tapping outside

**Test 1a: User Taps "Allow Location Access"**
- System permission dialog should appear
- After granting: Modal closes, map centers on user location
- After denying: Modal closes, map stays at default St. Maarten location

**Test 1b: User Taps "Enter Manually"**
- Modal closes immediately
- Map shows default St. Maarten location
- Destination input still functional for manual address entry

### Scenario 2: Permission Already Granted
**Steps:**
1. Have location permission already granted
2. Close and reopen app
3. Navigate to Home tab

**Expected Behavior:**
- No modal appears
- Map immediately centers on user location
- Console logs show: "[HomeScreen] Permission already granted"

### Scenario 3: Permission Previously Denied
**Steps:**
1. Have location permission denied in system settings
2. Launch app
3. Navigate to Home tab

**Expected Behavior:**
- No modal appears (already denied)
- Map shows default St. Maarten location
- Manual location entry still works
- Console logs show: "[HomeScreen] Permission denied - manual entry mode"

### Scenario 4: Permission State Persistence
**Steps:**
1. Grant permission via modal
2. Close app completely
3. Reopen app

**Expected Behavior:**
- Modal does not reappear
- Location is fetched automatically

## Console Log Verification

### First Launch (Undetermined):
```
[HomeScreen] Initial permission status: undetermined
[HomeScreen] Permission undetermined - showing modal
```

### User Allows:
```
[HomeScreen] User tapped 'Allow Location Access'
[LocationService] Permission granted
[HomeScreen] Permission granted by user
[HomeScreen] Getting current position...
[LocationService] Got current position: {...}
```

### User Denies:
```
[HomeScreen] User chose manual entry
```

### Already Granted:
```
[HomeScreen] Initial permission status: granted
[HomeScreen] Permission already granted
[HomeScreen] Getting current position...
```

## Edge Cases to Test

### 1. Network Connection Issues
- Test with poor/no internet connection
- Location should still work (GPS-based)
- Manual entry should gracefully handle API errors

### 2. Location Services Disabled
- Turn off Location Services in device settings
- App should handle gracefully

### 3. App Background/Foreground
- Grant permission
- Background the app
- Foreground the app
- Location should update without re-prompting

## Manual Testing Checklist

- [ ] Fresh install shows custom modal (not system dialog first)
- [ ] "Allow Location Access" triggers system dialog
- [ ] System "Allow" grants permission and fetches location
- [ ] System "Deny" closes everything and allows manual entry
- [ ] "Enter Manually" closes modal and maintains manual entry functionality
- [ ] Modal does not reappear after being dismissed
- [ ] Already granted permission skips modal entirely
- [ ] Previously denied permission skips modal entirely
- [ ] Map centers on user location when permission granted
- [ ] Map stays at default when permission denied
- [ ] Destination input works regardless of permission state
- [ ] State persists across app restarts
- [ ] No memory leaks or crashes

## Known Limitations

1. **Zustand Store Persistence**: The store doesn't persist across app kills by default. On fresh launch after app termination, permission status is re-checked from the system (not the store).
   
2. **iOS vs Android**: System permission dialogs look different on each platform but the flow remains the same.

## Success Criteria

✅ All test scenarios pass
✅ No console errors
✅ Smooth user experience
✅ No repeated permission prompts
✅ Manual entry fallback works
✅ State management is correct

## Resetting Permission State for Testing

### iOS Simulator:
```bash
# Reset all content and settings
xcrun simctl erase all

# Or reset specific app
xcrun simctl privacy booted reset location com.yourapp.bundleid
```

### iOS Physical Device:
Settings → General → Transfer or Reset → Reset Location & Privacy

### Android Emulator:
Settings → Apps → Rora → Permissions → Location → Remove permission

## Notes

- The custom modal only appears when permission is **undetermined**
- Once the system permission is granted or denied, the custom modal will not appear again
- To test the modal again, you must reset location permissions or reinstall the app

