import { getAccessToken } from "./auth.js"; // Access Token 가져오는 함수

// Spotify API 호출 함수
export async function fetchSpotifySuggestions(query, type = "track", limit = 5) {
    const token = sessionStorage.getItem("spotifyAccessToken");
    if (!token) {
        console.error("Access Token이 없습니다. 먼저 로그인하세요.");
        return [];
    }

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Spotify API 호출 실패: ${response.status}`);
        }

        const data = await response.json();

        // 데이터 변환
        return data.tracks.items.map((track) => ({
            name: track.name,
            artist: track.artists[0]?.name || "Unknown",
            albumImage: track.album.images[1]?.url || "", // 중간 크기 이미지
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