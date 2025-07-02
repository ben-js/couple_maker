import type { Context } from 'react';
interface Theme {
    primaryColor: string;
    CTA: {
        textColor: string;
        disabledColor: string;
        backgroundColor: string;
    };
    titleColor: string;
    subtitleColor: string;
    dividerColor: string;
    components: Extendable;
}
export declare class ThemeManager {
    private themeContext?;
    theme: Theme;
    forcedTheme: {
        components: Extendable;
    };
    setThemeContext(context: Context<any>): void;
    getThemeContext(): Context<any> | undefined;
    getTheme(): Theme;
    setItem(key: string, value: any): void;
    getItem(key: string): any;
    setComponentTheme(componentName: string, overrides: Dictionary<any> | Function): void;
    setComponentForcedTheme(componentName: string, overrides: Dictionary<any> | Function): void;
    get components(): Extendable;
    get forcedThemeComponents(): Extendable;
    get primaryColor(): string;
    get CTATextColor(): string;
    get CTADisabledColor(): string;
    get CTABackgroundColor(): string;
    get titleColor(): string;
    get subtitleColor(): string;
    get dividerColor(): string;
}
declare const _default: ThemeManager;
export default _default;
