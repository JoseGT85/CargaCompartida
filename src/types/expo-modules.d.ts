// Type declarations for expo packages (until installed)
declare module 'expo-image-picker' {
    export function requestMediaLibraryPermissionsAsync(): Promise<{ granted: boolean }>;
    export function launchImageLibraryAsync(options?: {
        mediaTypes?: string[];
        allowsEditing?: boolean;
        quality?: number;
        base64?: boolean;
    }): Promise<{
        canceled: boolean;
        assets: Array<{ uri: string; width: number; height: number }> | null;
    }>;
}

declare module 'expo-web-browser' {
    export function maybeCompleteAuthSession(): { type: string };
    export function openAuthSessionAsync(
        url: string,
        redirectUrl: string,
    ): Promise<{ type: string; url?: string }>;
}

declare module 'expo-auth-session' {
    export function makeRedirectUri(options?: {
        scheme?: string;
        path?: string;
    }): string;
}
