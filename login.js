import { getSpotifyAuthUrl, extractAccessToken } from "./api.js";

// Spotify 로그인 버튼 핸들링
document.getElementById("spotify-login-button").addEventListener("click", async () => {
    const authUrl = await getSpotifyAuthUrl(); // 비동기로 URL 생성
    window.location.href = authUrl;
});

// Access Token 추출 및 저장
const accessToken = extractAccessToken();
if (accessToken) {
    console.log("Access Token:", accessToken);
    localStorage.setItem("spotifyAccessToken", accessToken); // 브라우저에 저장
}
