const API_BASE_URL = "https://api.spotify.com/v1";

export async function fetchSpotifyData(endpoint, accessToken){
    try{
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if(!response.ok) throw new Error(`API 요청 실패: ${response.statusText}`)
    return await response.json();
    }catch{
        console.error("네트워크 에러: ", error);
        throw new Error("네트워크 에러.");
    }
}

export async function fetchTrackDetails(trackId, accessToken){
    return await fetchSpotifyData(`/tracks/${trackId}`, accessToken);
}

export async function fetchArtistDetails(artistId, accessToken){
    return await fetchSpotifyData(`/artists/${artistId}`, accessToken);
}

export async function fetchAlbumDetails(albumId, accessToken) {
    return await fetchSpotifyData(`/albums/${albumId}`, accessToken);
}

export function getAccessToken() {
    let token = localStorage.getItem("spotify_token");
    if (!token) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        token = params.get("access_token");

        // URL에서 추출한 토큰이 있으면 localStorage에 저장
        if (token) {
            localStorage.setItem("spotify_token", token);
        }
    }

    return token;
};