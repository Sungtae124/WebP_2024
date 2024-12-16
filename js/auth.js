const clientId = "11238807f52543e4892bd1f06766aa34";
const scope = "user-read-private user-read-email user-top-read streaming user-modify-playback-state user-read-playback-state playlist-modify-private playlist-modify-public playlist-read-private playlist-read-collaborative user-library-read user-library-modify";
const redirectUri = "https://sungtae124.github.io/WebP_2024/callback.html";

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
        window.location.href = "../index.html"    //임시 수정
    }
}

if (window.location.pathname.includes("callback.html")) {
    handleRedirectCallback();
}

export { login, handleRedirectCallback };