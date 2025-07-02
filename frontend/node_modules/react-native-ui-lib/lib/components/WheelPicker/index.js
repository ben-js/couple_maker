import _findIndex from "lodash/findIndex";
import _map from "lodash/map";
import React, { Component } from 'react';
import { DeviceEventEmitter, requireNativeComponent, StyleSheet, View } from 'react-native';
import WheelPickerItem from "./WheelPickerItem";
import { Constants } from "../../../src/commons/new";
import { LogService } from "../../../src/services";
import { Typography, Colors } from "../../../src/style";
import { PickerPackage, CommunityPickerPackage } from "../../../src/optionalDependencies";
const Picker = PickerPackage?.Picker || CommunityPickerPackage?.Picker || (() => null);
const WheelPickerNative = requireNativeComponent('WheelPicker');
class WheelPicker extends Component {
  static displayName = 'WheelPicker';
  static defaultProps = {
    labelStyle: {
      fontSize: Typography.text70?.fontSize,
      fontFamily: Typography.text70?.fontFamily
    },
    color: Colors.$textPrimary
  };
  constructor(props) {
    super(props);
    this.onValueChange = this.onValueChange.bind(this); //eslint-disable-line
    this.getItems();
    DeviceEventEmitter.addListener('log', this.onLogReceived); // TODO: consider moving to a more generic place (base class?)

    LogService.componentDeprecationWarn({
      oldComponent: 'WheelPicker',
      newComponent: 'Incubator.WheelPicker'
    });
  }
  state = {
    items: this.getItems()
  };
  onLogReceived = event => {
    // @ts-expect-error
    console[event.LogType](event.TAG, event.text);
  };
  onValueChange(event) {
    const index = event.nativeEvent.itemIndex;
    const {
      onValueChange
    } = this.props;
    if (onValueChange) {
      const {
        items
      } = this.state;
      onValueChange(items[index].value, index);
    }
  }
  getItems() {
    const {
      children
    } = this.props;
    const items = _map(React.Children.toArray(children), child => ({
      //@ts-expect-error
      value: child.props.value,
      //@ts-expect-error
      label: child.props.label
    }));
    return items;
  }
  getInitialIndex() {
    const {
      items
    } = this.state;
    const {
      selectedValue
    } = this.props;
    return _findIndex(items, {
      value: selectedValue
    });
  }
  extractLabelsFromItems() {
    return _map(this.state.items, 'label');
  }
  render() {
    const {
      style,
      color,
      labelStyle,
      itemHeight
    } = this.props;
    return <View collapsable={false} style={styles.container}>
        <WheelPickerNative
      // @ts-expect-error
      data={this.extractLabelsFromItems()} initialIndex={this.getInitialIndex()} onChange={this.onValueChange} style={[styles.wheelPicker, style]} color={color} labelColor={labelStyle?.color || color} fontSize={labelStyle?.fontSize} itemHeight={itemHeight} fontFamily={labelStyle?.fontFamily} />
      </View>;
  }
}
WheelPicker.Item = WheelPickerItem;
const styles = StyleSheet.create({
  container: {
    overflow: 'hidden'
  },
  wheelPicker: {
    width: 200,
    height: 200
  }
});
export default Constants.isAndroid ? WheelPicker : Picker;