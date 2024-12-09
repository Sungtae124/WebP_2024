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
    console.log("setDefaultSuggestion 호출됨");
    suggestionsBox.innerHTML = `
        <div class="suggestion-box">
            추천 검색어가 표시됩니다.
        </div>
    `;
    suggestionsBox.style.display = "block"; // 추천 검색어 창 보이기
}

// 추천 검색어 렌더링 함수
function renderSuggestions(suggestions) {
    console.log("renderSuggestions 호출됨:", suggestions);
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
    console.log("#suggestions display 스타일 설정:", suggestionsBox.style.display);
    
    suggestionsBox.addEventListener("click", (event) => {
        const target = event.target.closest(".suggestion-box");
        if (target) {
            const query = target.querySelector("span").textContent.trim();
            
            suggestionsBox.style.display = "none"; // 추천 검색어 창 숨기기
            window.location.href = `result.html?query=${encodeURIComponent(query)}`;
        }
    });
}

// 검색창 이벤트 설정 함수
export function setupSearchBar(searchBar, suggestionsBox) {
    if (!searchBar || !suggestionsBox) {
        console.error("검색창 또는 추천 검색어 박스가 초기화되지 않았습니다.");
        return;
    }

    // 검색창 엔터 입력 이벤트
    searchBar.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            const query = searchBar.value.trim();
            if (query) {
                console.log("검색창 엔터 입력: ", query);
                window.location.href = `result.html?query=${encodeURIComponent(query)}`;
            }
        }
    });

    //searchBar.addEventListener("focus", setDefaultSuggestion);
    // 검색창 포커스 이벤트
    searchBar.addEventListener("focus", () => {
        setDefaultSuggestion();
        console.log("검색창 focus 이벤트 발생");
        suggestionsBox.style.display = "block";
    });
    
    // 검색창 입력 이벤트
    searchBar.addEventListener(
        "input",
        debounce(async (event) => {
            const query = event.target.value.trim();
            console.log("입력된 검색어:", query); // 입력값 확인

            if (!query) {
                console.log("검색어가 비어 있음, 기본 추천 설정");
                //suggestionsBox.style.display = "block"
                setDefaultSuggestion();
                return;
            }

            const token = await getAccessToken(); // Access Token 발급
            if (!token) {
                console.error("Access Token 발급 실패.");
                return;
            }

            console.log("Access Token 발급 성공:", token);

            const suggestions = await fetchSpotifySuggestions(query, token);
            console.log("추천 검색어 API 응답:", suggestions);

            renderSuggestions(suggestions);
        }, 300)
    );

    // 검색창 포커스 아웃(blur) 이벤트
    searchBar.addEventListener("blur", () => {
        //console.log("검색창 blur 이벤트 발생");
        setTimeout(() => {
            console.log("검색창 blur 이벤트 발생, #suggestions 숨김 처리");
            suggestionsBox.style.display = "none";
        }, 200);
    });
}