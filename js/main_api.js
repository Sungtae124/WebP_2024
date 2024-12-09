let cachedAccessToken = null;
let tokenExpiryTime = null;

// keys.txt 파일에서 데이터를 읽어오는 함수
async function loadKeys() {
    const response = await fetch("./keys.txt");
    const text = await response.text();
    const keys = {};
    text.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
            keys[key.trim()] = value.trim();
        }
    });
    return keys;
}

// Access Token 발급 함수
export async function getAccessToken() {
    if (cachedAccessToken && tokenExpiryTime > Date.now()) {
        return cachedAccessToken; // 유효한 캐시된 토큰 반환
    }

    const keys = await loadKeys();
    const clientId = keys["SPOTIFY_CLIENT_ID"];
    const clientSecret = keys["SPOTIFY_CLIENT_SECRET"];
    const tokenUrl = "https://accounts.spotify.com/api/token";

    try {
        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${btoa(clientId + ":" + clientSecret)}`,
            },
            body: "grant_type=client_credentials",
        });

        const data = await response.json();
        if (response.ok) {
            cachedAccessToken = data.access_token;
            tokenExpiryTime = Date.now() + data.expires_in * 1000;
            return cachedAccessToken;
        } else {
            console.error("Access Token 발급 실패:", data);
            return null;
        }
    } catch (error) {
        console.error("Access Token 요청 중 오류 발생:", error);
        return null;
    }
}

// Spotify API를 사용해 추천 정보 가져오기
export async function fetchSpotifyRecommendations(genre, token) {
    const url = `https://api.spotify.com/v1/recommendations?seed_genres=${encodeURIComponent(
        genre
    )}&limit=10`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("Spotify API 요청 실패:", response.statusText);
            return { tracks: [] }; // 기본값 반환
        }

        const data = await response.json();
        console.log("Spotify Recommendations Data:", data); // 디버깅용 출력
        return data;



    } catch (error) {
        console.error("Spotify API 호출 중 오류 발생:", error);
        return { tracks: [] }; // 기본값 반환
    }
}

// 검색어 기반으로 Spotify 추천 데이터 가져오기
export async function fetchSpotifySearchResults(query, token) {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
    )}&type=track,album,artist&limit=12`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("Spotify Search API 요청 실패:", response.statusText);
            return { tracks: [], albums: [], artists: [] };
        }

        const data = await response.json();

        // 검색 결과 정리
        return {
            tracks: data.tracks?.items || [],
            albums: data.albums?.items || [],
            artists: data.artists?.items || [],
        };
    } catch (error) {
        console.error("Spotify Search API 호출 중 오류 발생:", error);
        return { tracks: [], albums: [], artists: [] };
    }

}

// 추천 검색어 가져오기
export async function fetchSpotifySuggestions(query, token) {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
    )}&type=track&limit=5`;

    try {
        console.log("Spotify API 요청 URL:", url);

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("Spotify API 요청 실패:", response.statusText);
            return [];
        }

        const data = await response.json();
        console.log("Spotify API 응답 데이터:", data);
        
        return data.tracks.items.map((track) => ({
            name: track.name,
            artist: track.artists[0]?.name,
            albumImage: track.album.images[0]?.url || "/default/default-album.png",
        }));
    } catch (error) {
        console.error("Spotify API 호출 중 오류 발생:", error);
        return [];
    }
}