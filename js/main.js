import { getAccessTokenWithoutLogin, fetchSpotifySearchResults } from "./main_api.js";
import { initializePiP, updatePiP, showPiP, hidePiP, savePiPState } from "./pip.js";
import { renderGenreButtons } from "./genre.js";
import { setupLoginPopup, showLoginPopup } from "./main_login.js";
import { setupSearchBar } from "./search.js";
import { getAccessToken } from "./api.js";
import { waitForSpotifySDK } from "./player.js";

// Music 클래스 정의
class Music {
    constructor(albumImage, albumName, trackName, trackID, artistName) {
        this.albumImage = albumImage || "/default/default-album.png"; // 앨범 커버
        this.albumName = albumName || "Unknown Album"; // 앨범명
        this.trackName = trackName || "Unknown Track"; // 트랙명
        this.trackID = trackID || "5WYgNDkw0VsDIZwfwQWlXp"; // track ID 기본값
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
            const isLoggedIn = getAccessToken(); // 임시 설정
            if (!isLoggedIn) {
                e.preventDefault();
                showLoginPopup("음악을 재생하려면 로그인이 필요합니다.");
            } else {
                console.log("재생 시작");
            }
        }
    });
});

function goToDetail(trackID) {
    if (!trackID) {
        console.error("Detail 페이지로 이동할 수 없습니다. 트랙 ID가 누락되었습니다.");
        return;
    }
    const currentPage = `/index.html`;
    const detailURL = `detail.html?trackID=${encodeURIComponent(trackID)}&returnPage=${encodeURIComponent(currentPage)}`;
    window.location.href = detailURL; // 트랙 ID, return page를 포함해 Detail 페이지로 이동
}

// 음원 박스 클릭 시 PiP 업데이트 및 표시
async function playMusic(music, isReturned, lastPosition) {
    const isLoggedIn = getAccessToken();
    if (!isLoggedIn) {
        showLoginPopup("음악을 재생하려면 로그인이 필요합니다.");
        return;
    }
    if (!music.trackID) {
        console.error("트랙 ID가 없습니다. 음악 정보를 확인하세요.");
        return;
    }
    console.log("Playing:",music.trackName, "-ID:", music.trackID);
    console.log("전달된 lastPosition:", lastPosition);

    if (!isReturned) {
        const state = await savePiPState(music.trackID, lastPosition);
        console.log("저장된 PiP 상태:", state);
        goToDetail(music.trackID); // Detail page로 이동
    }
    
    await initializePiP(getAccessToken(), music, lastPosition);
    //updatePiP(music); // PiP 업데이트는 초기화 시 자동 진행
    showPiP(); // PiP 표시
    console.log("last position: ", lastPosition);
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
            playMusic(new Music(album.images[0]?.url, album.name, "", "", album.artists[0]?.name));
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
            playMusic(new Music(track.album.images[0]?.url, track.album.name, track.name, track.id, track.artists[0]?.name),false, 0);
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
    //await waitForSpotifySDK();

    // URL에서 장르 매개변수 읽기
    const urlParams = new URLSearchParams(window.location.search);

    const fromDetail = urlParams.get("fromDetail") || "true";
    const lastPosition = urlParams.get("lastPosition") || 0;
    const trackID = urlParams.get("trackID");
    const albumImage = decodeURIComponent(urlParams.get("albumImage"));
    const trackName = decodeURIComponent(urlParams.get("trackName"));
    const artistName = decodeURIComponent(urlParams.get("artistName"));

    if (trackID) {
        const music = { albumImage, trackName, trackID, artistName };
        if(fromDetail)  playMusic(music, true, lastPosition);
        else    playMusic(music, false, 0);
    }
    hidePiP();

    const genre = urlParams.get("genre") || "한국 인디 밴드"; // 기본 검색어

    const token = await getAccessTokenWithoutLogin();
    if (token) {
        const { tracks, albums, artists } = await fetchSpotifySearchResults(genre, token);
        renderMusicBoxes(tracks, albums, artists);
    }
    // 장르 버튼 렌더링
    await renderGenreButtons();
});