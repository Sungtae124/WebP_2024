import { getAccessToken } from "./main_api.js";

/**
 * 아티스트 정보 가져오기
 * @param {string} artistId - 아티스트 ID
 * @returns {object|null} 아티스트 데이터
 */
export async function fetchArtistInfo(artistId) {
    const token = await getAccessToken();
    if (!token) {
        console.error("Access Token 발급 실패.");
        return null;
    }

    const url = `https://api.spotify.com/v1/artists/${artistId}`;
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("아티스트 정보 요청 실패:", response.statusText);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("아티스트 정보 요청 중 오류 발생:", error);
        return null;
    }
}

/**
 * 아티스트 앨범 목록 가져오기
 * @param {string} artistId - 아티스트 ID
 * @returns {array} 앨범 데이터 배열
 */
export async function fetchArtistAlbums(artistId) {
    const token = await getAccessToken();
    if (!token) {
        console.error("Access Token 발급 실패.");
        return [];
    }

    const url = `https://api.spotify.com/v1/artists/${artistId}/albums?limit=4&include_groups=album`;
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("아티스트 앨범 요청 실패:", response.statusText);
            return [];
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("아티스트 앨범 요청 중 오류 발생:", error);
        return [];
    }
}

/**
 * 아티스트 관련 플레이리스트 가져오기
 * @param {string} artistId - 아티스트 ID
 * @returns {array} 플레이리스트 데이터 배열
 */
export async function fetchArtistRelatedPlaylists(artistId) {
    const token = await getAccessToken();
    if (!token) {
        console.error("Access Token 발급 실패.");
        return [];
    }

    const relatedArtistsUrl = `https://api.spotify.com/v1/artists/${artistId}/related-artists`;
    try {
        const response = await fetch(relatedArtistsUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("관련 아티스트 요청 실패:", response.statusText);
            return [];
        }

        const relatedArtists = await response.json();
        if (!relatedArtists.artists.length) return [];

        const firstArtistId = relatedArtists.artists[0].id;
        const playlistsUrl = `https://api.spotify.com/v1/artists/${firstArtistId}/albums?limit=4`;

        const playlistResponse = await fetch(playlistsUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!playlistResponse.ok) {
            console.error("관련 플레이리스트 요청 실패:", playlistResponse.statusText);
            return [];
        }

        const playlists = await playlistResponse.json();
        return playlists.items || [];
    } catch (error) {
        console.error("관련 플레이리스트 요청 중 오류 발생:", error);
        return [];
    }
}
