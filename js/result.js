import { getAccessToken, fetchSpotifySearchResults } from "./main_api.js";
import { updatePiP, showPiP, hidePiP } from "./main_pip.js";


// PiP를 업데이트하고 보이도록 설정하는 함수
function playMusic(music) {
    updatePiP(music); // PiP 업데이트
    showPiP(); // PiP 표시
}

// 검색 결과를 동적으로 생성하는 함수
async function fetchAndRenderSearchResults(query) {
    const token = await getAccessToken();
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
                artistName: track.artists[0]?.name,
            };
            playMusic(music);
        });

        grid.appendChild(box);
    });
}

// 검색 버튼 클릭 이벤트
document.getElementById("search-button").addEventListener("click", async () => {
    const query = document.getElementById("search-bar").value.trim();
    if (query) {
        await fetchAndRenderSearchResults(query);
    }
});

// 초기 검색어로 페이지 로드
document.addEventListener("DOMContentLoaded", async () => {
    hidePiP();
    const defaultQuery = "한국 인디 밴드"; // 기본 검색어
    await fetchAndRenderSearchResults(defaultQuery);
});