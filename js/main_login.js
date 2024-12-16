import { login } from "./auth.js";

// 팝업 표시 함수
export function showLoginPopup(message) {
    const loginPopup = document.getElementById("login-popup");
    const loginMessage = document.getElementById("login-message");
    if (!loginPopup || !loginMessage) {
        console.error("로그인 팝업 요소가 존재하지 않습니다.");
        return;
    }
    console.log("로그인 팝업을 표시합니다:", message);
    loginMessage.textContent = message || "로그인이 필요합니다.";
    loginPopup.classList.remove("hidden");
    document.body.classList.add("popup-active"); // 화면 흐림 효과
}

// 팝업 숨기기 함수
export function hideLoginPopup() {
    const loginPopup = document.getElementById("login-popup");
    if (!loginPopup) {
        console.error("로그인 팝업 요소가 존재하지 않습니다.");
        return;
    }
    loginPopup.classList.add("hidden");
    document.body.classList.remove("popup-active"); // 화면 복원
}


// 로그인 팝업 관련 이벤트 설정
export function setupLoginPopup(triggerSelectors = []) {
    const loginButton = document.getElementById("popup-login-button");
    const cancelButton = document.getElementById("popup-cancel-button");
    
    // 로그인 버튼 클릭 이벤트
    loginButton.addEventListener("click", async () => {
        await login(); // 로그인 함수 호출
        const accessToken = getAccessToken();
        if (accessToken) {
            hideLoginPopup();
            window.location.reload(); // 로그인 성공 시 페이지 리로드
        }
    });

    // 팝업 취소 버튼
    cancelButton.addEventListener("click", hideLoginPopup);

}