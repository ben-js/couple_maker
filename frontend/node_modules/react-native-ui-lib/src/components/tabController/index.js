import _isUndefined from "lodash/isUndefined";
import _filter from "lodash/filter";
import _noop from "lodash/noop";
// TODO: support commented props
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useAnimatedReaction, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { useOrientation, useThemeProps } from "../../hooks";
import { Constants } from "../../commons/new";
import { LogService } from "../../services";
import TabBarContext from "./TabBarContext";
import TabBar from "./TabBar";
import TabBarItem, { TabControllerItemProps } from "./TabBarItem";
import TabPage from "./TabPage";
import PageCarousel from "./PageCarousel";
import useImperativeTabControllerHandle, { TabControllerImperativeMethods } from "./useImperativeTabControllerHandle";
export { TabControllerItemProps, TabControllerImperativeMethods };

// TODO: should migrate selectedIndex to initialIndex (and make this prop uncontrolled)

const getScreenWidth = useSafeArea => {
  const {
    left,
    right
  } = Constants.getSafeAreaInsets();
  return Constants.windowWidth - (useSafeArea && Constants.isIphoneX ? left + right : 0);
};

/**
 * @description: A performant solution for a tab controller with lazy load mechanism
 * @example: https://github.com/wix/react-native-ui-lib/blob/master/demo/src/screens/componentScreens/TabControllerScreen/index.tsx
 * @notes: This component is based on react-native-gesture-handler
 * @important: On Android, if using react-native-navigation, make sure to wrap your screen with gestureHandlerRootHOC
 * @importantLink: https://kmagiera.github.io/react-native-gesture-handler/docs/getting-started.html#with-wix-react-native-navigation-https-githubcom-wix-react-native-navigation
 */
const TabController = React.forwardRef((props, ref) => {
  const themeProps = useThemeProps(props, 'TabController');
  const {
    initialIndex = 0,
    selectedIndex,
    asCarousel = false,
    items,
    onChangeIndex = _noop,
    carouselPageWidth,
    useSafeArea = false,
    children
  } = themeProps;
  const [screenWidth, setScreenWidth] = useState(getScreenWidth(useSafeArea));
  if (items?.length < 2) {
    console.warn('TabController component expect a minimum of 2 items');
  }
  useOrientation({
    onOrientationChange: () => {
      setScreenWidth(getScreenWidth(useSafeArea));
    }
  });
  const pageWidth = useMemo(() => {
    return carouselPageWidth || screenWidth;
  }, [carouselPageWidth, screenWidth]);
  const ignoredItems = useMemo(() => {
    return _filter(items, item => item.ignore);
  }, [items]);

  /* backwards compatibility for `selectedIndex` prop. this line eventually should be removed */
  const _initialIndex = selectedIndex || initialIndex;

  /* currentPage - static page index */
  const currentPage = useSharedValue(_initialIndex);
  /* targetPage - transitioned page index (can be a fraction when transitioning between pages) */
  const targetPage = useSharedValue(_initialIndex);
  // const carouselOffset = useSharedValue(initialIndex * Math.round(pageWidth));

  const setCurrentIndex = useCallback(index => {
    'worklet';

    currentPage.value = index;
  }, []);
  useEffect(() => {
    if (!_isUndefined(selectedIndex)) {
      LogService.deprecationWarn({
        component: 'TabController',
        oldProp: 'selectedIndex',
        newProp: 'initialIndex'
      });
    }
  }, [selectedIndex]);
  useEffect(() => {
    setCurrentIndex(_initialIndex);
  }, [_initialIndex]);
  useAnimatedReaction(() => {
    return currentPage.value;
  }, (value, prevValue) => {
    if (value !== prevValue) {
      targetPage.value = withTiming(value);
      prevValue !== null && runOnJS(onChangeIndex)(value, prevValue);
    }
  });
  useImperativeTabControllerHandle(ref, setCurrentIndex);
  const context = useMemo(() => {
    return {
      /* Pass Props */
      initialIndex: _initialIndex,
      asCarousel,
      pageWidth,
      /* Items */
      items,
      ignoredItems,
      itemsCount: items.length - ignoredItems.length,
      /* Animated Values */
      targetPage,
      currentPage,
      // carouselOffset,
      containerWidth: screenWidth,
      /* Callbacks */
      onChangeIndex,
      setCurrentIndex
    };
  }, [_initialIndex, asCarousel, items, onChangeIndex, screenWidth]);
  return <TabBarContext.Provider value={context}>{children}</TabBarContext.Provider>;
});

// @ts-expect-error
TabController.TabBar = TabBar;
// @ts-expect-error
TabController.TabBarItem = TabBarItem;
// @ts-expect-error
TabController.TabPage = TabPage;
// @ts-expect-error
TabController.PageCarousel = PageCarousel;
export default TabController;