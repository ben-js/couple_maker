import React from 'react';
import { ViewStyle, ViewProps, View as RNView } from 'react-native';
export interface ThumbProps extends ViewProps {
    /**
     * The thumb style
     */
    thumbStyle?: ViewStyle;
    /**
     * The active (during press) thumb style
     */
    activeThumbStyle?: ViewStyle;
    /**
     * If true the Slider will not change it's style on press
     */
    disableActiveStyling?: boolean;
    /**
     * Defines how far a touch event can start away from the thumb.
     */
    thumbHitSlop?: ViewProps['hitSlop'];
    /**
     * Thumb color
     */
    thumbTintColor?: string;
    /**
     * If true the Slider will be disabled and will appear in disabled color
     */
    disabled?: boolean;
    /** ref to thumb component */
    ref?: React.RefObject<RNView>;
}
declare const Thumb: React.ForwardRefExoticComponent<Pick<ThumbProps, "style" | "children" | "hitSlop" | "onLayout" | "pointerEvents" | "removeClippedSubviews" | "testID" | "nativeID" | "collapsable" | "needsOffscreenAlphaCompositing" | "renderToHardwareTextureAndroid" | "focusable" | "shouldRasterizeIOS" | "isTVSelectable" | "hasTVPreferredFocus" | "tvParallaxProperties" | "tvParallaxShiftDistanceX" | "tvParallaxShiftDistanceY" | "tvParallaxTiltAngle" | "tvParallaxMagnification" | "onStartShouldSetResponder" | "onMoveShouldSetResponder" | "onResponderEnd" | "onResponderGrant" | "onResponderReject" | "onResponderMove" | "onResponderRelease" | "onResponderStart" | "onResponderTerminationRequest" | "onResponderTerminate" | "onStartShouldSetResponderCapture" | "onMoveShouldSetResponderCapture" | "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel" | "onTouchEndCapture" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "accessibilityRole" | "accessibilityState" | "accessibilityHint" | "accessibilityValue" | "onAccessibilityAction" | "accessibilityLiveRegion" | "importantForAccessibility" | "accessibilityElementsHidden" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "disabled" | "thumbStyle" | "activeThumbStyle" | "disableActiveStyling" | "thumbHitSlop" | "thumbTintColor"> & React.RefAttributes<unknown>>;
export default Thumb;
