import _cloneDeep from "lodash/cloneDeep";
import _isFunction from "lodash/isFunction";
import _get from "lodash/get";
import _set from "lodash/set";
import Colors from "./colors";
export class ThemeManager {
  theme = {
    primaryColor: Colors.$backgroundPrimaryHeavy,
    CTA: {
      textColor: Colors.white,
      disabledColor: Colors.grey60,
      backgroundColor: Colors.$backgroundPrimaryHeavy
    },
    titleColor: Colors.grey10,
    subtitleColor: Colors.grey40,
    dividerColor: Colors.grey70,
    components: {} // leave this key and delete the rest on V6
  };

  forcedTheme = {
    components: {}
  };
  setThemeContext(context) {
    this.themeContext = context;
  }
  getThemeContext() {
    return this.themeContext;
  }
  getTheme() {
    return this.theme;
  }
  setItem(key, value) {
    if (key === 'components') {
      throw new Error('Overriding the "components" key is not possible.');
    }
    // this.theme[key] = value;
    _set(this.theme, key, value);
  }
  getItem(key) {
    // return this.theme[key];
    return _get(this.theme, key);
  }
  setComponentTheme(componentName, overrides) {
    if (_isFunction(overrides)) {
      this.theme.components[componentName] = overrides;
    } else {
      this.theme.components[componentName] = _cloneDeep(overrides);
    }
  }
  setComponentForcedTheme(componentName, overrides) {
    if (_isFunction(overrides)) {
      this.forcedTheme.components[componentName] = overrides;
    } else {
      this.forcedTheme.components[componentName] = _cloneDeep(overrides);
    }
  }
  get components() {
    return this.theme.components;
  }
  get forcedThemeComponents() {
    return this.forcedTheme.components;
  }

  // TODO: remove getters below
  get primaryColor() {
    return this.theme.primaryColor;
  }
  get CTATextColor() {
    return this.theme.CTA.textColor;
  }
  get CTADisabledColor() {
    return this.theme.CTA.disabledColor;
  }
  get CTABackgroundColor() {
    return this.theme.CTA.backgroundColor;
  }
  get titleColor() {
    return this.theme.titleColor;
  }
  get subtitleColor() {
    return this.theme.subtitleColor;
  }
  get dividerColor() {
    return this.theme.dividerColor;
  }
}
export default new ThemeManager();