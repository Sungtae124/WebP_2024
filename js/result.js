import { getAccessTokenWithoutLogin, fetchSpotifySearchResults } from "./main_api.js";
import { initializePiP, updatePiP, showPiP, hidePiP, savePiPState } from "./pip.js";
import { setupLoginPopup, showLoginPopup } from "./main_login.js";
import { setupSearchBar } from "./search.js";
import { getAccessToken } from "./api.js";

const searchBar = document.getElementById("search-bar");
const suggestionsBox = document.getElementById("suggestions");

if (!window.Spotify) {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.head.appendChild(script);
} else {
    console.log("Spotify SDK가 이미 로드되었습니다.");
}

// 검색창 및 추천 검색어 설정
if (searchBar && suggestionsBox) {
    console.log("검색창 및 추천 검색어 박스 초기화 완료 (결과 페이지)");
    setupSearchBar(searchBar, suggestionsBox);
} else {
    console.error("검색창 또는 추천 검색어 박스가 초기화되지 않았습니다.");
}

// 로그인 팝업 설정
setupLoginPopup(null, [".large-box", ".medium-box"]);
document.addEventListener("click", (e) => {
    const target = e.target.closest(".large-box, .medium-box");
    if (target) {
        const isLoggedIn = getAccessToken();
        if (!isLoggedIn) {
            e.preventDefault();
            showLoginPopup("음악을 재생하려면 로그인이 필요합니다.");
        } else {
            console.log("재생 시작");
        }
    }
});

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
            playMusic(music,false, 0); // 임시 pip 테스트
        });

        grid.appendChild(box);
    });
}

function goToDetail(trackID) {
    if (!trackID) {
        console.error("Detail 페이지로 이동할 수 없습니다. 트랙 ID가 누락되었습니다.");
        return;
    }
    const detailURL = `detail.html?trackID=${encodeURIComponent(trackID)}&returnPage=${encodeURIComponent(result.html)}`;
    window.location.href = detailURL; // 트랙 ID를 포함해 Detail 페이지로 이동
}

// 음악 재생 및 PiP 초기화
async function playMusic(music, isReturned, lastPosition) {
    const isLoggedIn = getAccessToken();
    if (!isLoggedIn) {
        showLoginPopup("음악을 재생하려면 로그인이 필요합니다.");
        return;
    }

    console.log("Playing:", music.trackName, "-ID:", music.trackID);

    if (!isReturned) {
        const state = await savePiPState(music.trackID, lastPosition);
        console.log("저장된 PiP 상태:", state);
        //console.log("상태 저장 비활성");
    }
    goToDetail(music.trackID);
    
    await initializePiP(getAccessToken(), music, lastPosition);
    updatePiP(music);
    showPiP();
}

// 검색 버튼 클릭 이벤트
const searchButton = document.getElementById("search-button");
searchButton.addEventListener("click", async () => {
    const query = searchBar.value.trim();
    if (query) {
        window.location.href = `result.html?query=${encodeURIComponent(query)}`;
    }
});

// 초기 데이터 로드
(async () => {
    hidePiP();

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("query") || "한국 인디 밴드";
    const fromDetail = urlParams.get("fromDetail") === "true";
    const lastPosition = parseInt(urlParams.get("lastPosition"), 10) || 0;
    const trackID = urlParams.get("trackID");
    const albumImage = urlParams.get("albumImage");
    const trackName = urlParams.get("trackName");
    const artistName = urlParams.get("artistName");

    if (trackID) {
        const music = { albumImage, trackName, trackID, artistName };
        if(fromDetail)  playMusic(music, true, lastPosition);
        else    playMusic(music, false, 0);
    } else {
        await fetchAndRenderSearchResults(query);
    }
})();


/*
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
async function playMusic(music, isReturned, lastPosition) {
    const isLoggedIn = getAccessToken(); // 임시 설정
    if (!isLoggedIn) {
        showLoginPopup("음악을 재생하려면 로그인이 필요합니다.");
        return;
    }
    console.log("Playing:",music.trackName, "-ID:", music.trackID);

    //if(!isReturned) goToDetail(music.trackID);

    await initializePiP(getAccessToken(), music, lastPosition);
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
    //ToDo: detail 페이지에서 넘어왔을 때 조건부로 pip 표시.
    //hidePiP();

    // URL에서 검색어 읽기 및 리턴 정보 파악
    const urlParams = new URLSearchParams(window.location.search);

    // `fromDetail`, `isReturned`, `lastPosition`, `trackID` 가져오기
    const fromDetail = urlParams.get("fromDetail") === "true";
    //const isReturned = urlParams.get("isReturned") === "true";
    const lastPosition = urlParams.get("lastPosition");
    const trackID = urlParams.get("trackID");
    const albumImage = urlParams.get("albumImage");
    const albumName = "defaultAlbumName";
    const trackName = urlParams.get("trackName");
    const artistName = urlParams.get("artistName");

    if(fromDetail) {
        const music = {albumImage, albumName, trackName, trackID, artistName};
        playMusic(music, isReturned, lastPosition);
    } else hidePiP();

    const query = urlParams.get("query") || "한국 인디 밴드"; // 기본값 설정

    await fetchAndRenderSearchResults(query);
});
*/