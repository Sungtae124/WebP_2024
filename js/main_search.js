import { getAccessToken, fetchSpotifySuggestions } from "./main_api.js";

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

// 추천 검색어 렌더링 함수
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
            <span>${suggestion.artist} - ${suggestion.name}</span>
        `;
        suggestionsBox.appendChild(suggestionDiv);
    });

    suggestionsBox.style.display = "block"; // 추천 검색어 창 보이기
}


// 검색창 이벤트 리스너 설정
searchBar.addEventListener("focus", setDefaultSuggestion);
searchBar.addEventListener(
    "input",
    debounce(async (event) => {
        const query = event.target.value.trim();
        if (!query) {
            setDefaultSuggestion();
            return;
        }

        const token = await getAccessToken(); // Access Token 발급
        if (!token) {
            console.error("Access Token 발급 실패.");
            return;
        }

        const suggestions = await fetchSpotifySuggestions(query, token);
        renderSuggestions(suggestions);
    }, 300)
);

// 검색창 이벤트 리스너
document.getElementById("search-bar").addEventListener("input", debounce(async (event) => {
    const query = event.target.value.trim();
    if (query.length > 2) { // 최소 3자 이상 입력 시 검색 실행
        await fetchAndRenderSearchResults(query);
    }
}, 300));

// 검색창 포커스 아웃(blur) 이벤트
searchBar.addEventListener("blur", () => {
    setTimeout(() => {
        suggestionsBox.style.display = "none"; // 추천 검색어 창 숨기기
    }, 200);
});
