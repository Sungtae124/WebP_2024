import { fetchArtistInfo, fetchArtistAlbums, fetchArtistRelatedPlaylists } from "./artist_info.js";

document.addEventListener("DOMContentLoaded", async () => {
/*
    const urlParams = new URLSearchParams(window.location.search);
    const artistId = urlParams.get("id");
    if (!artistId) {
        console.error("아티스트 ID가 제공되지 않았습니다.");
        return;
    }
*/
    const artistName = "한로로"; // 예시 아티스트 이름
    let artistId;

    // 아티스트 검색 후 ID 추출
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`;
    const token = await fetchAccessToken();
    const searchResponse = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        artistId = searchData.artists?.items[0]?.id;
    }

    if (!artistId) {
        console.error("아티스트를 찾을 수 없습니다.");
        return;
    }
    
    // 아티스트 정보 가져오기
    const artistInfo = await fetchArtistInfo(artistId);
    if (artistInfo) {
        document.getElementById("artist-name").textContent = artistInfo.name;
        document.getElementById("artist-image").src =
            artistInfo.images[0]?.url || "/default/default-artist.png";
        document.getElementById("artist-debut").textContent = `장르: ${artistInfo.genres.join(", ")}`;
    }

    // 대표 앨범 표시
    const albums = await fetchArtistAlbums(artistId);
    const albumGrid = document.querySelector(".album-grid");
    albums.forEach((album) => {
        const albumCard = document.createElement("div");
        albumCard.className = "album-card";
        albumCard.innerHTML = `
            <img src="${album.images[0]?.url || "/default/default-album.png"}" alt="${album.name}">
            <p>${album.name}</p>
        `;
        albumGrid.appendChild(albumCard);
    });

    // 관련 플레이리스트 표시
    const playlists = await fetchArtistRelatedPlaylists(artistId);
    const playlistGrid = document.querySelector(".playlist-grid");
    playlists.forEach((playlist) => {
        const playlistCard = document.createElement("div");
        playlistCard.className = "playlist-card";
        playlistCard.innerHTML = `
            <img src="${playlist.images[0]?.url || "/default/default-playlist.png"}" alt="${playlist.name}">
            <p>${playlist.name}</p>
        `;
        playlistGrid.appendChild(playlistCard);
    });
});
