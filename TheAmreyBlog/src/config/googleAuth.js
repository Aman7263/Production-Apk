import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

// Helper to parse auth tokens from the Deep Link returned by Google/Supabase
const extractParamsFromUrl = (url) => {
    const params = {};
    const hash = url.split('#')[1] || url.split('?')[1];
    if (hash) {
        hash.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value) params[key] = decodeURIComponent(value);
        });
    }
    return params;
};

export async function signInWithGoogle() {
    try {
        const redirectUri = AuthSession.makeRedirectUri({
            useProxy: true,    // IMPORTANT: works in Expo Go
            scheme: "theamrey" // must match your app.json scheme
        });

        console.log("Redirect URI:", redirectUri);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { 
                redirectTo: redirectUri,
                skipBrowserRedirect: true // Crucial for React Native!
            },
        });

        if (error) return { error };
        if (!data?.url) return { error: new Error('No OAuth URL returned from Supabase') };

        // Open the browser for the Google Sign in
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

        if (res.type === 'success' && res.url) {
            const params = extractParamsFromUrl(res.url);

            if (params.error) {
                return { error: new Error(params.error_description || params.error) };
            }

            if (params.access_token && params.refresh_token) {
                const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                    access_token: params.access_token,
                    refresh_token: params.refresh_token
                });
                
                if (sessionError) return { error: sessionError };
                return { data: sessionData };
            }
            
            return { error: new Error('Could not extract tokens from URL') };
        }

        return { error: new Error('Google sign in was cancelled or failed') };
    } catch (err) {
        return { error: err };
    }
}