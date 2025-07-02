/// <reference types="react" />
import { UniDriver, UniDriverClass } from './UniDriver';
export declare type ComponentDriverArgs = {
    testID: string;
    Driver?: UniDriverClass;
    component: JSX.Element;
};
/**
 * Please run clear after each test
 * */
export declare class ComponentDriver {
    protected readonly testID: string;
    protected readonly uniDriver: UniDriver;
    static uniDrivers: {
        [key: string]: UniDriver;
    };
    static clear(): void;
    constructor({ testID, component, Driver }: ComponentDriverArgs);
    exists: () => Promise<boolean>;
    getElement: () => Promise<any>;
    press: () => Promise<any>;
    protected getByTestId: (testID: string) => Promise<any>;
    getElementProps: () => Promise<any>;
    getPropsByTestId: (testID: string) => Promise<any>;
    selectorByText: (text: string) => Promise<any>;
    getByDisplayValue: (text: string) => Promise<any>;
}
