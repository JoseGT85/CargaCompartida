declare module 'lucide-react-native' {
    import { ComponentType } from 'react';
    import { SvgProps } from 'react-native-svg';

    export interface LucideProps extends SvgProps {
        size?: number | string;
        absoluteStrokeWidth?: boolean;
        color?: string;
    }

    export type Icon = ComponentType<LucideProps>;

    // Auth & Navigation
    export const Truck: Icon;
    export const Mail: Icon;
    export const Lock: Icon;
    export const Eye: Icon;
    export const EyeOff: Icon;

    // Home & Actions
    export const Home: Icon;
    export const Search: Icon;
    export const User: Icon;
    export const Plus: Icon;
    export const ChevronRight: Icon;
    export const ChevronLeft: Icon;

    // Content
    export const Package: Icon;
    export const MapPin: Icon;
    export const Star: Icon;
    export const Route: Icon;
    export const Calendar: Icon;
    export const DollarSign: Icon;
    export const Car: Icon;
    export const Pencil: Icon;

    // Documents & Upload
    export const Upload: Icon;
    export const FileText: Icon;
    export const Camera: Icon;
    export const Image: Icon;
    export const Check: Icon;
    export const CheckCircle: Icon;
    export const AlertCircle: Icon;
    export const Clock: Icon;
    export const Shield: Icon;
    export const ShieldCheck: Icon;
    export const X: Icon;

    // Generic export for any other icon
    export const icons: { [key: string]: Icon };
}
