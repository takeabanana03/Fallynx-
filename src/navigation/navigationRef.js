import { createNavigationContainerRef } from '@react-navigation/native';

// A fall is detected inside a sensor callback, not inside a React component,
// so there is no navigation prop to reach for. This ref is how non-React code
// opens the countdown screen.

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) navigationRef.navigate(name, params);
}