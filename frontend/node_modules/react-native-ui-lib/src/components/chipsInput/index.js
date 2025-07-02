import _map from "lodash/map";
import _isString from "lodash/isString";
import _get from "lodash/get";
import _size from "lodash/size";
import _debounce from "lodash/debounce";
import _isUndefined from "lodash/isUndefined";
import _invoke from "lodash/invoke";
import _isFunction from "lodash/isFunction";
import _isEmpty from "lodash/isEmpty";
import _isNil from "lodash/isNil";
import _cloneDeep from "lodash/cloneDeep";
import React, { Component } from 'react';
import { NativeModules, StyleSheet, findNodeHandle, ScrollView } from 'react-native';
import { Colors, BorderRadiuses, ThemeManager, Typography, Spacings } from "../../style";
import Assets from "../../assets";
import { LogService } from "../../services";
import { Constants, asBaseComponent } from "../../commons/new";
import TextFieldMigrator from "../textField/TextFieldMigrator";
import View from "../view";
import TouchableOpacity from "../touchableOpacity";
import Text from "../text";
import Chip from "../chip";
import Icon from "../icon";
import { getValidationBasedColor, getCounterTextColor, getCounterText, getChipDismissColor, isDisabled } from "./Presenter";
const GUTTER_SPACING = 8;
/**
 * @description: Chips input component
 * @modifiers: Typography
 * @gif: https://github.com/wix/react-native-ui-lib/blob/master/demo/showcase/ChipsInput/ChipsInput.gif?raw=true
 * @example: https://github.com/wix/react-native-ui-lib/blob/master/demo/src/screens/componentScreens/ChipsInputScreen.tsx
 * @extends: TextField
 */
class ChipsInput extends Component {
  static displayName = 'ChipsInput';
  static onChangeTagsActions = {
    ADDED: 'added',
    REMOVED: 'removed'
  };
  input = React.createRef();
  scrollRef = React.createRef();
  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      chips: _cloneDeep(props.tags || props.chips) || [],
      chipIndexToRemove: undefined,
      initialChips: props.tags || props.chips,
      isFocused: this.input.current?.isFocused() || false
    };
    LogService.componentDeprecationWarn({
      oldComponent: 'ChipsInput',
      newComponent: 'Incubator.ChipsInput'
    });
  }
  componentDidMount() {
    if (Constants.isAndroid) {
      const textInputHandle = findNodeHandle(this.input.current);
      if (textInputHandle && NativeModules.TextInputDelKeyHandler) {
        NativeModules.TextInputDelKeyHandler.register(textInputHandle);
      }
    }
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    const {
      tags,
      chips
    } = nextProps;
    if (tags && tags !== prevState.initialChips || chips && chips !== prevState.initialChips) {
      return {
        initialChips: nextProps.tags || nextProps.chips,
        chips: nextProps.tags || nextProps.chips
      };
    }
    return null;
  }
  addTag = () => {
    const {
      onCreateTag,
      disableTagAdding,
      maxLength,
      chips: chipsProps
    } = this.props;
    const {
      value,
      chips
    } = this.state;
    if (this.scrollRef?.current?.scrollToEnd) {
      this.scrollRef?.current?.scrollToEnd();
    }
    if (disableTagAdding) {
      return;
    }
    if (_isNil(value) || _isEmpty(value.trim())) {
      return;
    }
    if (maxLength && this.state.chips.length >= maxLength) {
      this.setState({
        value: ''
      });
      return;
    }
    const newChip = _isFunction(onCreateTag) ? onCreateTag(value) : chipsProps ? {
      label: value
    } : value;
    const newChips = [...chips, newChip];
    this.setState({
      value: '',
      chips: newChips
    });
    _invoke(this.props, 'onChangeTags', newChips, ChipsInput.onChangeTagsActions.ADDED, newChip);
    this.clear();
  };
  removeMarkedTag() {
    const {
      chips,
      chipIndexToRemove
    } = this.state;
    if (!_isUndefined(chipIndexToRemove)) {
      const removedTag = chips[chipIndexToRemove];
      chips.splice(chipIndexToRemove, 1);
      this.setState({
        chips,
        chipIndexToRemove: undefined
      });
      _invoke(this.props, 'onChangeTags', chips, ChipsInput.onChangeTagsActions.REMOVED, removedTag);
    }
  }
  markTagIndex = chipIndex => {
    this.setState({
      chipIndexToRemove: chipIndex
    });
  };
  onChangeText = _debounce(value => {
    this.setState({
      value,
      chipIndexToRemove: undefined
    });
    _invoke(this.props, 'onChangeText', value);
  }, 0);
  onTagPress(index) {
    const {
      onTagPress
    } = this.props;
    const {
      chipIndexToRemove
    } = this.state;

    // custom press handler
    if (onTagPress) {
      onTagPress(index, chipIndexToRemove);
      return;
    }

    // default press handler
    if (chipIndexToRemove === index) {
      this.removeMarkedTag();
    } else {
      this.markTagIndex(index);
    }
  }
  isLastTagMarked() {
    const {
      chips,
      chipIndexToRemove
    } = this.state;
    const tagsCount = _size(chips);
    const isLastTagMarked = chipIndexToRemove === tagsCount - 1;
    return isLastTagMarked;
  }
  removeTag = () => {
    const {
      value,
      chips,
      chipIndexToRemove
    } = this.state;
    const tagsCount = _size(chips);
    const hasNoValue = _isEmpty(value);
    const hasTags = tagsCount > 0;
    const {
      disableTagRemoval
    } = this.props;
    if (disableTagRemoval) {
      return;
    }
    if (hasNoValue && hasTags && _isUndefined(chipIndexToRemove)) {
      this.setState({
        chipIndexToRemove: tagsCount - 1
      });
    } else if (!_isUndefined(chipIndexToRemove)) {
      this.removeMarkedTag();
    }
  };
  onKeyPress = event => {
    _invoke(this.props, 'onKeyPress', event);
    const keyCode = _get(event, 'nativeEvent.key');
    const pressedBackspace = keyCode === Constants.backspaceKey;
    if (pressedBackspace) {
      this.removeTag();
    }
  };
  getLabel = item => {
    const {
      getLabel
    } = this.props;
    if (getLabel) {
      return getLabel(item);
    }
    if (_isString(item)) {
      return item;
    }
    return _get(item, 'label');
  };
  onFocus = () => {
    this.setState({
      isFocused: true
    });
  };
  onBlur = () => {
    this.setState({
      isFocused: false
    });
  };
  renderLabel(tag, shouldMarkTag) {
    const {
      typography
    } = this.props.modifiers;
    const label = this.getLabel(tag);
    return <View row centerV>
        {shouldMarkTag && <Icon style={[styles.removeIcon, tag.invalid && styles.basicTagStyle && styles.invalidTagRemoveIcon]} source={Assets.icons.x} />}
        <Text style={[tag.invalid ? shouldMarkTag ? styles.errorMessageWhileMarked : styles.errorMessage : styles.tagLabel, typography]} accessibilityLabel={`${label} tag`}>
          {!tag.invalid && shouldMarkTag ? 'Remove' : label}
        </Text>
      </View>;
  }
  renderTag = (tag, index) => {
    const {
      tagStyle,
      renderTag
    } = this.props;
    const {
      chipIndexToRemove
    } = this.state;
    const shouldMarkTag = chipIndexToRemove === index;
    const markedTagStyle = tag.invalid ? styles.invalidMarkedTag : styles.tagMarked;
    const defaultTagStyle = tag.invalid ? styles.invalidTag : styles.tag;
    if (_isFunction(renderTag)) {
      return renderTag(tag, index, shouldMarkTag, this.getLabel(tag));
    }
    return <View key={index} style={[defaultTagStyle, tagStyle, basicTagStyle, shouldMarkTag && markedTagStyle]}>
        {this.renderLabel(tag, shouldMarkTag)}
      </View>;
  };
  renderTagWrapper = (tag, index) => {
    return <TouchableOpacity key={index} activeOpacity={1} onPress={() => this.onTagPress(index)} accessibilityHint={!this.props.disableTagRemoval ? 'tap twice for remove tag mode' : undefined}>
        {this.renderTag(tag, index)}
      </TouchableOpacity>;
  };
  renderNewChip = () => {
    const {
      defaultChipProps
    } = this.props;
    const {
      chipIndexToRemove,
      chips
    } = this.state;
    const disabled = isDisabled(this.props);
    return _map(chips, (chip, index) => {
      const selected = chipIndexToRemove === index;
      const dismissColor = getChipDismissColor(chip, selected, defaultChipProps);
      return <View center flexS marginT-2 marginB-2>
          <Chip key={index} containerStyle={[styles.tag, chip.invalid && styles.invalidTag]} labelStyle={[styles.tagLabel, chip.invalid && styles.errorMessage, selected && !!chip.invalid && styles.errorMessageWhileMarked]} {...chip} {...defaultChipProps} disabled={disabled} marginR-s2 marginT-2 left={Assets.icons.x} onPress={_ => this.onTagPress(index)} onDismiss={selected ? () => this.onTagPress(index) : undefined} dismissColor={dismissColor} dismissIcon={Assets.icons.xSmall} dismissIconStyle={styles.dismissIconStyle} />
        </View>;
    });
  };
  renderTitleText = () => {
    const {
      title,
      defaultChipProps
    } = this.props;
    const color = this.state.isFocused ? getValidationBasedColor(this.state.chips, defaultChipProps) : Colors.grey30;
    return title && <Text text70L color={color}>{title}</Text>;
  };
  renderChips = () => {
    const {
      disableTagRemoval,
      chips: chipsProps
    } = this.props;
    const {
      chips
    } = this.state;
    const renderFunction = disableTagRemoval ? this.renderTag : this.renderTagWrapper;
    if (chipsProps) {
      return this.renderNewChip();
    } else {
      // The old way of creating the 'Chip' internally 
      return _map(chips, (tag, index) => {
        return <View>
            {renderFunction(tag, index)}
          </View>;
      });
    }
  };
  renderCharCounter() {
    const {
      maxLength
    } = this.props;
    const counter = this.state.chips.length;
    if (maxLength) {
      const color = getCounterTextColor(this.state.chips, this.props);
      const counterText = getCounterText(counter, maxLength);
      return <Text color={color} style={styles.label} accessibilityLabel={`${counter} out of ${maxLength} max chips`}>
          {counterText}
        </Text>;
    }
  }
  renderUnderline = () => {
    const {
      isFocused,
      chips
    } = this.state;
    const {
      defaultChipProps
    } = this.props;
    const color = getValidationBasedColor(chips, defaultChipProps);
    return <View height={1} marginT-10 backgroundColor={isFocused ? color : Colors.grey50} />;
  };
  renderTextInput() {
    const {
      inputStyle,
      selectionColor,
      title,
      ...others
    } = this.props;
    const {
      value
    } = this.state;
    const isLastTagMarked = this.isLastTagMarked();
    return <View style={styles.inputWrapper}>
        <TextFieldMigrator ref={this.input} text80 blurOnSubmit={false} {...others} maxLength={undefined} title={this.props.chips ? undefined : title} value={value} onSubmitEditing={this.addTag} onChangeText={this.onChangeText} onKeyPress={this.onKeyPress} enableErrors={false} onFocus={this.onFocus} onBlur={this.onBlur} hideUnderline selectionColor={isLastTagMarked ? 'transparent' : selectionColor} style={[inputStyle, styles.alignTextCenter]} containerStyle={{
        flexGrow: 0
      }} collapsable={false} accessibilityHint={!this.props.disableTagRemoval ? 'press keyboard delete button to remove last tag' : undefined} />
      </View>;
  }
  renderChipsContainer = () => {
    const {
      maxHeight,
      scrollViewProps
    } = this.props;
    const Container = maxHeight ? ScrollView : View;
    return <Container
    // @ts-expect-error
    ref={this.scrollRef} showsVerticalScrollIndicator={false} style={!maxHeight && styles.tagsList} contentContainerStyle={styles.tagsList} {...scrollViewProps}>
        {this.renderChips()}
        {this.renderTextInput()}
      </Container>;
  };
  render() {
    const {
      containerStyle,
      hideUnderline,
      validationErrorMessage,
      leftElement,
      maxHeight,
      chips
    } = this.props;
    const {
      chipIndexToRemove
    } = this.state;
    return <View style={[!hideUnderline && styles.withUnderline, containerStyle]}>
        {!!chips && this.renderTitleText()}
        <View style={[styles.tagListContainer, {
        maxHeight
      }]}>
          {leftElement}
          {this.renderChipsContainer()}
        </View>
        {!hideUnderline && this.renderUnderline()}
        {this.renderCharCounter()}
        {validationErrorMessage ? <View>
              <Text style={[styles.errorMessage, !!chipIndexToRemove && styles.errorMessageWhileMarked]}>
                {validationErrorMessage}
              </Text>
            </View> : null}
      </View>;
  }
  blur() {
    this.input.current?.blur();
  }
  focus() {
    this.input.current?.focus();
  }
  clear() {
    this.input.current?.clear();
  }
}
export { ChipsInput }; // For tests
export default asBaseComponent(ChipsInput);
const basicTagStyle = {
  borderRadius: BorderRadiuses.br100,
  paddingVertical: 4.5,
  paddingHorizontal: 12,
  marginRight: GUTTER_SPACING,
  marginVertical: GUTTER_SPACING / 2
};
const styles = StyleSheet.create({
  withUnderline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: ThemeManager.dividerColor
  },
  tagsList: {
    minHeight: 38,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  tagListContainer: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    flexWrap: 'nowrap'
  },
  inputWrapper: {
    flexGrow: 1,
    minWidth: 120,
    backgroundColor: 'transparent',
    justifyContent: 'center'
  },
  tag: {
    borderWidth: 0,
    paddingVertical: 5,
    backgroundColor: Colors.$backgroundPrimaryHeavy
  },
  invalidTag: {
    borderWidth: 1,
    borderColor: Colors.red30,
    backgroundColor: 'transparent'
  },
  basicTagStyle: {
    ...basicTagStyle
  },
  invalidMarkedTag: {
    borderColor: Colors.red10
  },
  tagMarked: {
    backgroundColor: Colors.grey10
  },
  dismissIconStyle: {
    width: 10,
    height: 10,
    marginRight: Spacings.s1
  },
  removeIcon: {
    tintColor: Colors.white,
    width: 10,
    height: 10,
    marginRight: 6
  },
  invalidTagRemoveIcon: {
    tintColor: Colors.red10
  },
  tagLabel: {
    ...Typography.text80,
    color: Colors.white
  },
  errorMessage: {
    ...Typography.text80,
    color: Colors.red30
  },
  errorMessageWhileMarked: {
    color: Colors.red10
  },
  label: {
    marginTop: Spacings.s1,
    alignSelf: 'flex-end',
    height: Typography.text80?.lineHeight,
    ...Typography.text80
  },
  alignTextCenter: {
    textAlignVertical: 'center'
  }
});