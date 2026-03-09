import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle() {
    try {
        const redirectUri = AuthSession.makeRedirectUri({
            useProxy: true,    // IMPORTANT: works in Expo Go
            scheme: "theamrey" // must match your app.json scheme
        });

        console.log("Redirect URI:", redirectUri);

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: redirectUri },
        });

        if (error) return { error };
        return {};
    } catch (err) {
        return { error: err };
    }
}