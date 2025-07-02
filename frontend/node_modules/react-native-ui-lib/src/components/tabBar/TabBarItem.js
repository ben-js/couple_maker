import _isNil from "lodash/isNil";
import _isEmpty from "lodash/isEmpty";
import _get from "lodash/get";
import _pick from "lodash/pick";
import React, { PureComponent } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Typography, Spacings } from "../../style";
import { Constants, asBaseComponent } from "../../commons/new";
import View from "../view";
import TouchableOpacity from "../touchableOpacity";
import Text from "../text";
import Image from "../image";
import Badge from "../badge";
const INDICATOR_HEIGHT = 2;
const INDICATOR_BG_COLOR = Colors.$backgroundPrimaryHeavy;
const HORIZONTAL_PADDING = Constants.isTablet ? Spacings.s7 : Spacings.s5;
/**
 * @description: TabBar.Item, inner component of TabBar for configuring the tabs
 * @example: https://github.com/wix/react-native-ui-lib/blob/master/demo/src/screens/componentScreens/TabBarScreen.tsx
 * @extends: TouchableOpacity
 * @extendsLink: https://reactnative.dev/docs/touchableopacity
 */
class TabBarItem extends PureComponent {
  static displayName = 'TabBar.Item';
  static defaultProps = {
    maxLines: 1
  };
  constructor(props) {
    super(props);
    this.state = {
      indicatorOpacity: props.selected ? new Animated.Value(1) : new Animated.Value(0),
      selected: props.selected
    };
  }
  componentDidUpdate(prevProps) {
    if (prevProps.selected !== this.props.selected) {
      this.animate(this.props.selected);
    }
  }
  animate(newValue) {
    Animated.timing(this.state.indicatorOpacity, {
      toValue: newValue ? 1 : 0,
      easing: Easing.ease,
      duration: 150,
      useNativeDriver: true
    }).start(this.onAnimateCompleted);
  }
  onAnimateCompleted = () => {
    this.setState({
      selected: this.props.selected
    });
  };
  getFlattenStyle(style) {
    return StyleSheet.flatten(style);
  }
  getStylePropValue(flattenStyle, propName) {
    let prop;
    if (flattenStyle) {
      const propObject = _pick(flattenStyle, [propName]);
      prop = propObject[propName];
    }
    return prop;
  }
  getColorFromStyle(style) {
    const flattenStyle = this.getFlattenStyle(style);
    return this.getStylePropValue(flattenStyle, 'color');
  }
  getLayout() {
    return this.layout;
  }
  onLayout = event => {
    this.layout = event.nativeEvent.layout;
  };
  render() {
    const {
      indicatorOpacity,
      selected
    } = this.state;
    const {
      children,
      indicatorStyle,
      icon,
      iconColor,
      iconSelectedColor,
      label,
      labelStyle,
      badgeProps,
      leadingAccessory,
      trailingAccessory,
      uppercase,
      maxLines,
      selectedLabelStyle,
      showDivider,
      width,
      onPress,
      activeBackgroundColor,
      backgroundColor,
      testID,
      accessibilityLabel,
      style
    } = this.props;
    const iconTint = iconColor || this.getColorFromStyle(labelStyle) || this.getColorFromStyle(styles.label);
    const iconSelectedTint = iconSelectedColor || this.getColorFromStyle(selectedLabelStyle) || this.getColorFromStyle(styles.selectedLabel);
    const badgeSize = _get(badgeProps, 'size', 16);
    return <TouchableOpacity activeOpacity={1} onPress={onPress} style={[width ? {
      width
    } : {
      flex: 1
    }, style]} testID={testID} backgroundColor={backgroundColor} activeBackgroundColor={activeBackgroundColor} onLayout={this.onLayout} accessibilityState={selected ? {
      selected: true
    } : undefined} accessibilityRole={'tab'} accessibilityLabel={accessibilityLabel}>
        <View row flex center style={[showDivider && styles.divider, styles.contentContainer]}>
          {leadingAccessory}
          {icon && <Image style={!_isEmpty(label) && styles.icon} source={icon} tintColor={selected ? iconSelectedTint : iconTint} />}
          {!_isEmpty(label) && <Text numberOfLines={maxLines} uppercase={uppercase} style={[labelStyle || styles.label, selected && (selectedLabelStyle || styles.selectedLabel)]}>
              {label}
            </Text>}
          {children}
          {!_isNil(badgeProps) && <Badge backgroundColor={Colors.red30} {...badgeProps} size={badgeSize} containerStyle={[styles.badge, badgeProps.containerStyle]} />}
          {trailingAccessory}
        </View>
        <Animated.View style={[{
        opacity: indicatorOpacity
      }, styles.indicator, indicatorStyle]} />
      </TouchableOpacity>;
  }
}
export default asBaseComponent(TabBarItem);
const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: HORIZONTAL_PADDING
  },
  label: {
    color: Colors.$textPrimary,
    ...Typography.text80
  },
  selectedLabel: {
    color: Colors.$textPrimary,
    ...Typography.text80,
    fontWeight: 'bold'
  },
  divider: {
    borderRightWidth: 1,
    borderRightColor: Colors.grey70,
    marginVertical: 14 // NOTE: will not cut long text at the top and bottom in iOS if TabBar not high enough
  },

  indicator: {
    backgroundColor: INDICATOR_BG_COLOR,
    height: INDICATOR_HEIGHT,
    marginHorizontal: HORIZONTAL_PADDING
  },
  badge: {
    marginLeft: Spacings.s1
  },
  icon: {
    marginRight: 6
  }
});