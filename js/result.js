import { getAccessTokenWithoutLogin, fetchSpotifySearchResults } from "./main_api.js";
import { getAccessToken } from "./api.js";
import { initializePiP, updatePiP, showPiP, hidePiP } from "./pip.js";
import { setupLoginPopup, showLoginPopup } from "./main_login.js";
import { setupSearchBar } from "./search.js";
//import { SpotifyPlayer } from "./player.js";

// 검색창 요소와 추천 검색어 박스 선택 - DOM 요소 가져오기
const searchBar = document.getElementById("search-bar");
const suggestionsBox = document.getElementById("suggestions");

// 추천 검색어 및 검색창 설정
if (searchBar && suggestionsBox) {
    console.log("검색창 및 추천 검색어 박스 초기화 완료 (결과 페이지)");
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
    const detailURL = `detail.html?trackID=${encodeURIComponent(trackID)}`;
    window.location.href = detailURL; // 트랙 ID를 포함해 Detail 페이지로 이동
}

// PiP를 업데이트하고 보이도록 설정하는 함수
async function playMusic(music) {
    const isLoggedIn = getAccessToken(); // 임시 설정
    if (!isLoggedIn) {
        showLoginPopup("음악을 재생하려면 로그인이 필요합니다.");
        return;
    }
    console.log("Playing:",music.trackName, "-ID:", music.trackID);
    //goToDetail(music.trackID);

    await initializePiP(getAccessToken(), music);
    updatePiP(music); // PiP 업데이트
    showPiP(); // PiP 표시
}

// 검색 결과를 동적으로 생성하는 함수
async function fetchAndRenderSearchResults(query) {
    const token = await getAccessTokenWithoutLogin();
    //console.log(token);
    if (!token) {
        console.error("Access Token 발급 실패");
        return;
    }

    // Spotify Search API 호출
    const { tracks } = await fetchSpotifySearchResults(query, token);

    if (!tracks.length) {
        console.error("검색 결과가 없습니다.");
        const grid = document.getElementById("search-results");
        grid.innerHTML = "<p>검색 결과가 없습니다.</p>";
        return;
    }

    // 검색 결과 그리드에 결과 추가
    const grid = document.getElementById("search-results");
    grid.innerHTML = ""; // 기존 결과 초기화

    // 트랙 결과 박스 생성
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

        // 클릭 이벤트 추가
        box.addEventListener("click", () => {
            const music = {
                albumImage: track.album.images[0]?.url || "/default/default-album.png",
                trackName: track.name,
                trackID: track.id,
                artistName: track.artists[0]?.name,
            };
            playMusic(music);
        });

        grid.appendChild(box);
    });
}

// 검색 버튼 클릭 이벤트
document.getElementById("search-button").addEventListener("click", async () => {
    const query = searchBar.value.trim();
    if (query) {
        //suggestionsBox.style.display = "none"; // 추천 검색어 창 숨기기
        window.location.href = `result.html?query=${encodeURIComponent(query)}`;
    }
});

// 메인 페이지 검색 결과 or 초기 검색어로 페이지 로드
document.addEventListener("DOMContentLoaded", async () => {
    hidePiP();

    // URL에서 검색어 읽기
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("query") || "한국 인디 밴드"; // 기본값 설정

    await fetchAndRenderSearchResults(query);
});