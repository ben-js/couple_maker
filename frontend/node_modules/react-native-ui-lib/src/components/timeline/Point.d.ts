/// <reference types="react" />
import { LayoutChangeEvent } from 'react-native';
import { PointProps } from './types';
declare type PointPropsInternal = PointProps & {
    onLayout?: (event: LayoutChangeEvent) => void;
};
declare const Point: (props: PointPropsInternal) => JSX.Element;
export default Point;
