declare module 'lucide-react-native' {
    import { SvgProps } from 'react-native-svg';
    import { ComponentType } from 'react';

    export interface LucideProps extends SvgProps {
        size?: number | string;
        absoluteStrokeWidth?: boolean;
        color?: string;
    }

    export type Icon = ComponentType<LucideProps>;

    export const Truck: Icon;
    export const Mail: Icon;
    export const Lock: Icon;
    export const Eye: Icon;
    export const EyeOff: Icon;
    // Generic export for any other icon
    export const icons: { [key: string]: Icon };
}
