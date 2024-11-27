import { extractAccessToken } from "./api.js";

// 검색창 요소와 추천 검색어 박스 선택
const searchBar = document.getElementById("search-bar");
const suggestionsBox = document.getElementById("suggestions");

// 디바운스 함수 (API 호출 최소화)
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// 기본 안내 문구를 설정하는 함수
function setDefaultSuggestion() {
    suggestionsBox.innerHTML = `
        <div class="suggestion-box">
            추천 검색어가 표시됩니다.
        </div>
    `;
    suggestionsBox.style.display = "block"; // 추천 검색어 창 보이기
}

// 추천 검색어 렌더링
function renderSuggestions(suggestions) {
    suggestionsBox.innerHTML = ""; // 기존 내용 초기화

    if (suggestions.length === 0) {
        setDefaultSuggestion(); // 추천 검색어가 없을 경우 기본 안내 문구 표시
        return;
    }

    suggestions.forEach((suggestion) => {
        const suggestionDiv = document.createElement("div");
        suggestionDiv.className = "suggestion-box";
        suggestionDiv.innerHTML = `
            <img src="${suggestion.albumImage}" alt="${suggestion.name}" class="suggestion-img" />
            <span>${suggestion.name} - ${suggestion.artist}</span>
        `;
        suggestionsBox.appendChild(suggestionDiv);
    });
    suggestionsBox.style.display = "block";
}

// Spotify API 호출
async function fetchSpotifySuggestions(query) {
    const accessToken = localStorage.getItem("spotifyAccessToken"); // 저장된 Access Token 가져오기
    if (!accessToken) {
        console.error("Access Token이 없습니다. 로그인하세요.");
        return [];
    }

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
    )}&type=track&limit=5`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            console.error("Spotify API 요청 실패:", response.statusText);
            return [];
        }

        const data = await response.json();
        return data.tracks.items.map((track) => ({
            name: track.name,
            artist: track.artists[0]?.name,
            albumImage: track.album.images[0]?.url,
        }));
    } catch (error) {
        console.error("Spotify API 호출 중 오류 발생:", error);
        return [];
    }
}

// 검색창 이벤트 리스너 설정
searchBar.addEventListener("focus", setDefaultSuggestion); // 검색창 클릭 시 기본 안내 문구 표시
searchBar.addEventListener(
    "input",
    debounce(async (event) => {
        const query = event.target.value.trim();

        if (!query) {
            // 입력값이 없으면 기본 안내 문구 표시
            setDefaultSuggestion();
            return;
        }

        const suggestions = await fetchSpotifySuggestions(query);
        renderSuggestions(suggestions);
    }, 300)
);

// 검색창 포커스 아웃(blur) 이벤트
searchBar.addEventListener("blur", () => {
    setTimeout(() => {
        suggestionsBox.style.display = "none"; // 추천 검색어 창 숨기기
    }, 200); // 클릭 이벤트를 고려한 딜레이
});
