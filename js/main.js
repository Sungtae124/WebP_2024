import { getAccessToken, fetchSpotifySearchResults } from "./main_api.js";
import { updatePiP, showPiP, hidePiP } from "./main_pip.js";
import { renderGenreButtons } from "./genre.js";
import { setupLoginPopup, showLoginPopup } from "./main_login.js";
import { setupSearchBar } from "./search.js";

// Music 클래스 정의
class Music {
    constructor(albumImage, albumName, trackName, artistName) {
        this.albumImage = albumImage || "/default/default-album.png"; // 앨범 커버
        this.albumName = albumName || "Unknown Album"; // 앨범명
        this.trackName = trackName || "Unknown Track"; // 트랙명
        this.artistName = artistName || "Unknown Artist"; // 아티스트 이름
    }
}

// 검색창 요소와 추천 검색어 박스 선택 - DOM 요소 가져오기
const searchBar = document.getElementById("search-bar");
const suggestionsBox = document.getElementById("suggestions");

if (searchBar && suggestionsBox) {
    console.log("검색창 및 추천 검색어 박스 초기화 완료");
    setupSearchBar(searchBar, suggestionsBox);
} else {
    console.error("검색창 또는 추천 검색어 박스가 초기화되지 않았습니다.");
}

// 로그인 팝업 설정
document.addEventListener("DOMContentLoaded", () => {
    setupLoginPopup(null, [".large-box", ".medium-box"]);

    document.addEventListener("click", (e) => {
        const target = e.target.closest(".large-box, .medium-box");
        if (target) {
            const isLoggedIn = false; // 임시 설정
            if (!isLoggedIn) {
                e.preventDefault();
                showLoginPopup("음악을 재생하려면 로그인이 필요합니다.");
            } else {
                console.log("재생 시작");
            }
        }
    });
});

// 음원 박스 클릭 시 PiP 업데이트 및 표시
function playMusic(music) {
    const isLoggedIn = false; // 임시 설정
    if (!isLoggedIn) {
        showLoginPopup("음악을 재생하려면 로그인이 필요합니다.");
        return;
    }

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

    // URL에서 장르 매개변수 읽기
    const urlParams = new URLSearchParams(window.location.search);
    const genre = urlParams.get("genre") || "한국 인디 밴드"; // 기본 검색어

    const token = await getAccessToken();
    if (token) {
        const { tracks, albums, artists } = await fetchSpotifySearchResults(genre, token);
        renderMusicBoxes(tracks, albums, artists);
    }
    // 장르 버튼 렌더링
    await renderGenreButtons();
});