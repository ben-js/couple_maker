import { AsyncStoragePackage } from "../optionalDependencies";
const isAsyncStorageInstalled = !!AsyncStoragePackage;
const validateAsyncStorage = method => {
  if (isAsyncStorageInstalled) {
    return true;
  } else {
    console.error(`RNUILib requires installing "@react-native-community/async-storage" dependency to use ${method}LocalScheme`);
    return false;
  }
};
class Config {
  appScheme = 'light';
  constructor() {
    this.setConfig({});
  }
  async setConfig(options) {
    const {
      usePlatformColors = false,
      appScheme = 'light',
      useLocalScheme = false
    } = options;
    this.usePlatformColors = usePlatformColors;
    if (isAsyncStorageInstalled && useLocalScheme) {
      this.appScheme = (await this.getLocalScheme?.()) || appScheme;
    } else {
      this.appScheme = appScheme;
    }
  }
  async setLocalScheme(scheme) {
    if (validateAsyncStorage('set')) {
      await AsyncStoragePackage.setItem?.('rnuilib.appScheme', scheme);
    }
  }
  async getLocalScheme() {
    if (validateAsyncStorage('get')) {
      return await AsyncStoragePackage.getItem?.('rnuilib.appScheme');
    }
  }
}
export default new Config();