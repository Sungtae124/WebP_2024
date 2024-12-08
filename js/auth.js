const clientId = "83948c6bf89a41f9b93da3dc71245d60";
const redirectUri = "http://127.0.0.1:5500/callback.html";
const scope = "user-read-private user-read-email user-top-read streaming user-modify-playback-state user-read-playback-state playlist-modify-private playlist-modify-public playlist-read-private playlist-read-collaborative";
const state = "random_state_value";

function login(){
    console.log("debug");
    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;
    console.log("redirecting", authUrl);
    window.open(authUrl, "_blank");
}

function handleRedirectCallback(){
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");
    if(token){
        localStorage.setItem("spotify_token", token);
        window.location.href = "index.html"
    }
}

if (window.location.pathname.includes("callback.html")) {
    handleRedirectCallback();
}

export { login, handleRedirectCallback };