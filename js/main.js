import { getAccessToken, fetchSpotifySearchResults } from "./main_api.js";
import { updatePiP, showPiP, hidePiP } from "./main_pip.js";

// Music 클래스 정의
class Music {
    constructor(albumImage, albumName, trackName, artistName) {
        this.albumImage = albumImage || "/default/default-album.png"; // 앨범 커버
        this.albumName = albumName || "Unknown Album"; // 앨범명
        this.trackName = trackName || "Unknown Track"; // 트랙명
        this.artistName = artistName || "Unknown Artist"; // 아티스트 이름
    }
}

// 음원 박스 클릭 시 PiP 업데이트 및 표시
function playMusic(music) {
    updatePiP(music); // PiP 업데이트
    showPiP(); // PiP 표시
}

// 추천 목록 박스 렌더링
function renderMusicBoxes(tracks, albums, artists) {
    const grid = document.querySelector(".recommendation-grid");
    grid.innerHTML = ""; // 기존 박스 초기화

    // Large Box: 추천 앨범
    if (albums.length > 0) {
        const album = albums[0];
        const largeBox = document.createElement("div");
        largeBox.className = "large-box";
        largeBox.innerHTML = `
            <img src="${album.images[0]?.url}" alt="${album.name}" class="album-image">
            <div class="music-info">
                <h4>${album.name}</h4>
                <p>${album.artists[0]?.name}</p>
            </div>
        `;
        largeBox.addEventListener("click", () => {
            playMusic(new Music(album.images[0]?.url, album.name, "", album.artists[0]?.name));
        });
        grid.appendChild(largeBox);
    }

    // Medium Boxes: 추천 곡
    tracks.slice(0, 2).forEach((track) => {
        const mediumBox = document.createElement("div");
        mediumBox.className = "medium-box";
        mediumBox.innerHTML = `
            <img src="${track.album.images[0]?.url}" alt="${track.name}" class="album-image">
            <div class="music-info">
                <h4>${track.name}</h4>
                <p>${track.artists[0]?.name}</p>
            </div>
        `;
        mediumBox.addEventListener("click", () => {
            playMusic(new Music(track.album.images[0]?.url, track.album.name, track.name, track.artists[0]?.name));
        });
        grid.appendChild(mediumBox);
    });

    // Small Boxes: 추천 아티스트
    artists.slice(0, 4).forEach((artist) => {
        const smallBox = document.createElement("div");
        smallBox.className = "small-box";
        smallBox.innerHTML = `
            <img src="${artist.images[0]?.url || "/default/default-artist.png"}" alt="${artist.name}" class="artist-image">
            <div class="music-info">
                <h4>${artist.name}</h4>
            </div>
        `;
        smallBox.addEventListener("click", () => {
            //playMusic(new Music(artist.images[0]?.url || "/default/default-artist.png", "", "", artist.name));
            //여기에 아티스트 상세 페이지로 연결하는 기능 추가 필요
        });
        grid.appendChild(smallBox);
    });
}

// 초기 검색 및 데이터 렌더링
document.addEventListener("DOMContentLoaded", async () => {
    hidePiP();
    const query = "한국 인디 밴드"; // 기본 검색어
    const token = await getAccessToken();
    if (token) {
        const { tracks, albums, artists } = await fetchSpotifySearchResults(query, token);
        renderMusicBoxes(tracks, albums, artists);
    }
});

/*
import { getAccessToken, fetchSpotifySearchResults } from "./main_api.js";
import { updatePiP, initializePiP } from "./main_pip.js";

// Music 클래스 정의
class Music {
    constructor(albumImage, albumName, trackName, artistName) {
        this.albumImage = albumImage || "/default/default-album.png"; // 앨범 커버
        this.albumName = albumName || "Unknown Album"; // 앨범명
        this.trackName = trackName || "Unknown Track"; // 트랙명
        this.artistName = artistName || "Unknown Artist"; // 아티스트 이름
    }
}

// 음원 박스 클릭 시 PiP 업데이트 및 표시
function playMusic(music) {
    updatePiP(music); // PiP 업데이트
    showPiP(); // PiP 표시
}

// 추천 목록 박스 렌더링
function renderMusicBoxes(tracks, albums, artists) {
    const grid = document.querySelector(".recommendation-grid");
    grid.innerHTML = ""; // 기존 박스 초기화

    // Large Box: 추천 앨범
    if (albums.length > 0) {
        const album = albums[0];
        const largeBox = document.createElement("div");
        largeBox.className = "large-box";
        largeBox.innerHTML = `
            <img src="${album.images[0]?.url}" alt="${album.name}" class="album-image">
            <div class="music-info">
                <h4>${album.name}</h4>
                <p>${album.artists[0]?.name}</p>
            </div>
        `;
        grid.appendChild(largeBox);
    }

    // Medium Boxes: 추천 곡
    tracks.slice(0, 2).forEach((track) => {
        const mediumBox = document.createElement("div");
        mediumBox.className = "medium-box";
        mediumBox.innerHTML = `
            <img src="${track.album.images[0]?.url}" alt="${track.name}" class="album-image">
            <div class="music-info">
                <h4>${track.name}</h4>
                <p>${track.artists[0]?.name}</p>
            </div>
        `;
        grid.appendChild(mediumBox);
    });

    // Small Boxes: 추천 아티스트
    artists.slice(0, 4).forEach((artist) => {
        const smallBox = document.createElement("div");
        smallBox.className = "small-box";
        smallBox.innerHTML = `
            <img src="${artist.images[0]?.url || "/default/default-artist.png"}" alt="${artist.name}" class="artist-image">
            <div class="music-info">
                <h4>${artist.name}</h4>
            </div>
        `;
        grid.appendChild(smallBox);
    });
}

// Spotify 데이터 가져오기 및 렌더링
async function fetchAndRenderSearchResults(query) {
    // Access Token 발급
    const token = await getAccessToken();
    if (!token) {
        console.error("Access Token 발급 실패");
        return;
    }

    // Spotify Search API 호출
    const { tracks, albums, artists } = await fetchSpotifySearchResults(query, token);

    if (!tracks.length && !albums.length && !artists.length) {
        console.error("검색 결과가 없습니다.");
        return;
    }

    // 데이터를 바탕으로 렌더링
    renderMusicBoxes(tracks, albums, artists);

    
    // 초기 PiP 설정
    if (tracks.length > 0) {
        const firstTrack = tracks[0];
        initializePiP(
            new Music(
                firstTrack.album.images[0]?.url,
                firstTrack.album.name,
                firstTrack.name,
                firstTrack.artists[0]?.name
            )
        );
    }
}

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", () => {
    const query = "한국 인디 밴드"; // 기본 검색어
    fetchAndRenderSearchResults(query);
});*/