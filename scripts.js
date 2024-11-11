document.getElementById("search-bar").addEventListener("input", function() {
    const query = this.value;
    const suggestionsBox = document.getElementById("suggestions");
    suggestionsBox.innerHTML = ''; // 기존 추천어 삭제

    if (query.length > 0) {
        // API 요청으로 추천 검색어 불러오기 구현
        // 예시로 간단히 더미 데이터 추가
        const dummySuggestions = ["노래 1", "노래 2", "아티스트 1"];
        dummySuggestions.forEach(suggestion => {
            const suggestionDiv = document.createElement("div");
            suggestionDiv.className = "suggestion";
            suggestionDiv.textContent = suggestion;
            suggestionsBox.appendChild(suggestionDiv);
        });
    }
});
