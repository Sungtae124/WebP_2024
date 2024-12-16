import { getAccessTokenWithoutLogin, fetchSpotifySearchResults } from "./main_api.js";
import { initializePiP, updatePiP, showPiP, hidePiP, savePiPState } from "./pip.js";
import { setupLoginPopup, showLoginPopup } from "./main_login.js";
import { setupSearchBar } from "./search.js";
import { getAccessToken } from "./api.js";

const searchBar = document.getElementById("search-bar");
const suggestionsBox = document.getElementById("suggestions");

// 검색창 및 추천 검색어 설정
if (searchBar && suggestionsBox) {
    console.log("검색창 및 추천 검색어 박스 초기화 완료 (결과 페이지)");
    setupSearchBar(searchBar, suggestionsBox);
} else {
    console.error("검색창 또는 추천 검색어 박스가 초기화되지 않았습니다.");
}

// 검색 결과 렌더링 함수
async function fetchAndRenderSearchResults(query) {
    const token = await getAccessTokenWithoutLogin();
    if (!token) {
        console.error("Access Token 발급 실패");
        return;
    }

    const { tracks } = await fetchSpotifySearchResults(query, token);

    if (!tracks.length) {
        console.error("검색 결과가 없습니다.");
        document.getElementById("search-results").innerHTML = "<p>검색 결과가 없습니다.</p>";
        return;
    }

    const grid = document.getElementById("search-results");
    grid.innerHTML = "";

    tracks.forEach((track) => {
        const box = document.createElement("div");
        box.className = "result-box";
        box.innerHTML = `
            <img src="${track.album.images[0]?.url || '/default/default-album.png'}" alt="${track.name}">
            <div class="result-info">
                <h4>${track.name}</h4>
                <p>${track.artists[0]?.name}</p>
            </div>
        `;

        box.addEventListener("click", () => {
            const music = {
                albumImage: track.album.images[0]?.url || "/default/default-album.png",
                trackName: track.name,
                trackID: track.id,
                artistName: track.artists[0]?.name,
            };
            playMusic(music, false, 0); // track box 클릭 시 처음부터 시작.
        });

        grid.appendChild(box);
    });
}

function goToDetail(trackID) {
    if (!trackID) {
        console.error("Detail 페이지로 이동할 수 없습니다. 트랙 ID가 누락되었습니다.");
        return;
    }
    const currentPage = `https://sungtae124.github.io/WebP_2024/index.html`;
    const detailURL = `./detail.html?trackID=${encodeURIComponent(trackID)}&returnPage=${encodeURIComponent(currentPage)}`;
    window.location.href = detailURL; // 트랙 ID, return page를 포함해 Detail 페이지로 이동
}

// 음악 재생 및 PiP 초기화
async function playMusic(music, isReturned, lastPosition) {
    const isLoggedIn = getAccessToken();
    if (!isLoggedIn) {
        showLoginPopup("음악을 재생하려면 로그인이 필요합니다.");
        return;
    }

    console.log("전달된 lastPosition:", lastPosition);

    if (!isReturned) {
        const state = await savePiPState(music.trackID, lastPosition);
        console.log("저장된 PiP 상태:", state);
        goToDetail(music.trackID);
    }
    
    await initializePiP(getAccessToken(), music, lastPosition);
    console.log("Playing:", music.trackName, "-ID:", music.trackID);
    //updatePiP(music);
    showPiP();
    console.log("last position: ", lastPosition);
}

// 검색 버튼 클릭 이벤트
const searchButton = document.getElementById("search-button");
searchButton.addEventListener("click", async () => {
    const query = searchBar.value.trim();
    if (query) {
        window.location.href = `./result.html?query=${encodeURIComponent(query)}`;
    }
});

// 초기 데이터 로드
document.addEventListener("DOMContentLoaded", async () => {

    setupLoginPopup([".result-box"]);

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("query") || "한국 인디 밴드";
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

    fetchAndRenderSearchResults(query);

});