/// <reference types="react" />
import { KeyboardTrackingViewProps } from './KeyboardTracking/KeyboardTrackingView';
import KeyboardRegistry from './KeyboardInput/KeyboardRegistry';
import KeyboardAccessoryView, { KeyboardAccessoryViewProps } from './KeyboardInput/KeyboardAccessoryView';
import KeyboardUtils from './KeyboardInput/utils/KeyboardUtils';
export { KeyboardTrackingViewProps, KeyboardAccessoryViewProps };
declare const _default: {
    KeyboardTrackingView: import("react").ForwardRefExoticComponent<Pick<import("react-native").ViewProps & {
        trackInteractive?: boolean | undefined;
        revealKeyboardInteractive?: boolean | undefined;
        manageScrollView?: boolean | undefined;
        requiresSameParentToManageScrollView?: boolean | undefined;
        allowHitsOutsideBounds?: boolean | undefined;
        scrollToFocusedInput?: boolean | undefined;
        scrollBehavior?: number | undefined;
        addBottomView?: boolean | undefined;
        bottomViewColor?: string | undefined;
        useSafeArea?: boolean | undefined;
        usesBottomTabs?: boolean | undefined;
        ref?: any;
        style?: import("react-native").ViewStyle | undefined;
        children?: import("react").ReactChild | import("react").ReactChild[] | undefined;
    }, keyof import("react-native").ViewProps | "trackInteractive" | "revealKeyboardInteractive" | "manageScrollView" | "requiresSameParentToManageScrollView" | "allowHitsOutsideBounds" | "scrollToFocusedInput" | "scrollBehavior" | "addBottomView" | "bottomViewColor" | "useSafeArea" | "usesBottomTabs"> & import("react").RefAttributes<unknown>> & {
        scrollBehaviors: {
            NONE: any;
            SCROLL_TO_BOTTOM_INVERTED_ONLY: any;
            FIXED_OFFSET: any;
        };
    };
    KeyboardAwareInsetsView: {
        (props: KeyboardTrackingViewProps): JSX.Element;
        displayName: string;
    };
    KeyboardRegistry: typeof KeyboardRegistry;
    KeyboardAccessoryView: typeof KeyboardAccessoryView;
    KeyboardUtils: typeof KeyboardUtils;
};
export default _default;
