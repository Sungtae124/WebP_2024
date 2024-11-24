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

// 검색창 포커스 이벤트
searchBar.addEventListener("focus", () => {
    suggestionsBox.innerHTML = `
        <div class="suggestion-box">
            추천 검색어가 표시됩니다.
        </div>
    `;
    suggestionsBox.style.display = "block"; // 추천 검색어 창 보이기
});

// 검색창 입력 이벤트
searchBar.addEventListener("input", debounce(async (event) => {
    const query = event.target.value.trim();

    if (!query) {
        // 입력값이 없으면 기본 안내 문구 표시
        suggestionsBox.innerHTML = `
            <div class="suggestion-box">
                추천 검색어가 표시됩니다.
            </div>
        `;
        return;
    }

    // Spotify API 호출
    const suggestions = await fetchSpotifySuggestions(query);

    // 추천 검색어 표시
    renderSuggestions(suggestions);
}, 300));

// 검색창 포커스 아웃(blur) 이벤트
searchBar.addEventListener("blur", () => {
    setTimeout(() => {
        suggestionsBox.style.display = "none"; // 추천 검색어 창 숨기기
    }, 200); // 클릭 이벤트를 고려한 딜레이
});

// 추천 검색어 렌더링
function renderSuggestions(suggestions) {
    suggestionsBox.innerHTML = "";
    suggestions.forEach((suggestion) => {
        const suggestionDiv = document.createElement("div");
        suggestionDiv.className = "suggestion-box";
        suggestionDiv.innerText = suggestion.name; // 기본 텍스트
        suggestionsBox.appendChild(suggestionDiv);
    });
    suggestionsBox.style.display = "block";
}