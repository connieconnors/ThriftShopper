# Development Notes

## Known Issues

### Hydration Mismatch from Chrome Extensions

**Issue:** React hydration mismatches can occur when Chrome extensions inject DOM elements into the page (e.g., `#open-incognito-widget` from certain extensions).

**Solution:** This is expected behavior and does not affect app functionality. The app logic does not need to be modified to work around extension DOM injection.

**Detection:** A development-only console warning will appear if extension-injected elements are detected.

**Note:** This only occurs in development when React DevTools or strict hydration checking is enabled. It does not affect production builds.

