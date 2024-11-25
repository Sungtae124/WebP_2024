// keys.txt 파일에서 데이터를 읽어오는 함수
async function loadKeys() {
    const response = await fetch("./keys.txt"); // keys.txt 파일 요청
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
    const keys = await loadKeys(); // 비동기로 keys 가져오기
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
            console.log("Access Token 발급 성공:", data.access_token);
            return data.access_token;
        } else {
            console.error("Access Token 발급 실패:", data);
            return null;
        }
    } catch (error) {
        console.error("Access Token 요청 중 오류 발생:", error);
        return null;
    }
}

// Spotify API 호출 함수
export async function fetchSpotifySuggestions(query, token) {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`;

    try {
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
        return data.tracks.items.map((track) => ({
            name: track.name,
            artist: track.artists[0]?.name,
            albumImage: track.album.images[0]?.url,
        }));
    } catch (error) {
        console.error("Spotify API 호출 중 오류 발생:", error);
        return [];
    }
}




/*
// YouTube Music API 호출
export async function fetchYoutubeSuggestions(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=YOUR_YOUTUBE_API_KEY`; // YouTube API 키 필요
    const response = await fetch(url);
    const data = await response.json();
    return data.items.map(item => ({
        name: item.snippet.title,
        artist: item.snippet.channelTitle,
        source: "YouTube",
    }));
}

// 카카오뮤직 API 호출 (예시)
export async function fetchKakaoSuggestions(query) {
    // 카카오뮤직 API 엔드포인트가 없다면 웹 스크래핑 또는 다른 방법 활용 필요
    const url = `https://api.kakao.com/music/search?q=${encodeURIComponent(query)}&limit=5`; // 가상의 URL
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer YOUR_KAKAO_TOKEN`, // 카카오뮤직 API 토큰 필요
        },
    });
    const data = await response.json();
    return data.items.map(item => ({
        name: item.title,
        artist: item.artist,
        source: "KakaoMusic",
    }));
}
*/