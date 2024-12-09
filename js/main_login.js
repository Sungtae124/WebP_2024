import { login } from "./auth.js";

// 팝업 표시 함수
export function showLoginPopup(message) {
    const loginPopup = document.getElementById("login-popup");
    const loginMessage = document.getElementById("login-message");
    loginMessage.textContent = message || "로그인이 필요합니다.";
    loginPopup.classList.remove("hidden");
    document.body.classList.add("popup-active"); // 화면 흐림 효과
}

// 팝업 숨기기 함수
export function hideLoginPopup() {
    const loginPopup = document.getElementById("login-popup");
    loginPopup.classList.add("hidden");
    document.body.classList.remove("popup-active"); // 화면 복원
}

// 로그인 팝업 관련 이벤트 설정
export function setupLoginPopup(playButtonsSelector, triggerSelectors) {
    const loginButton = document.getElementById("login-button");
    const cancelButton = document.getElementById("cancel-button");
    //const usernameInput = document.getElementById("username");
    //const passwordInput = document.getElementById("password");

    // 로그인 요청 함수 (임시)
    function handleLogin() {
        /*
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            console.log("로그인 실패: 사용자 이름 또는 비밀번호가 비어 있습니다.");
            return;
        }
*/
        //console.log(`로그인 요청: ${username}, ${password}`);
        login()
        hideLoginPopup();

        // 실제 Auth.js 로그인 요청 로직
        // login();
    }

    // 로그인 버튼 클릭 이벤트
    loginButton.addEventListener("click", handleLogin);

    /*
    // 엔터 키 입력 시 로그인 처리
    [usernameInput, passwordInput].forEach((input) => {
        input.addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
                handleLogin();
            }
        });
    });*/

    // 팝업 취소 버튼
    cancelButton.addEventListener("click", hideLoginPopup);

    // 재생 버튼 클릭 이벤트 설정
    if (playButtonsSelector) {
        const playButtons = document.querySelectorAll(playButtonsSelector);
        playButtons.forEach((button) => {
            button.addEventListener("click", (e) => {
                const isLoggedIn = false; // 로그인 여부 확인 로직 (임시로 false 설정)
                if (!isLoggedIn) {
                    e.preventDefault(); // 기본 동작 방지
                    showLoginPopup("재생을 위해 로그인이 필요합니다."); // 로그인 팝업 표시
                } else {
                    console.log("재생 시작"); // 로그인 상태에서 재생
                }
            });
        });
    }

    // 추가 이벤트 트리거 설정
    if (triggerSelectors) {
        triggerSelectors.forEach((selector) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element) => {
                element.addEventListener("click", (e) => {
                    const isLoggedIn = false; // 로그인 여부 확인 로직 (임시로 false 설정)
                    if (!isLoggedIn) {
                        e.preventDefault(); // 기본 동작 방지
                        showLoginPopup("이 기능을 사용하려면 로그인이 필요합니다."); // 로그인 팝업 표시
                    } else {
                        console.log("기능 사용 가능"); // 로그인 상태에서 기능 실행
                    }
                });
            });
        });
    }
}


/*
// main_login.js: 로그인 팝업 관련 코드
export function setupLoginPopup(playButtonsSelector, triggerSelectors) {
    const loginPopup = document.getElementById("login-popup");
    const loginButton = document.getElementById("login-button");
    const cancelButton = document.getElementById("cancel-button");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const playButtons = document.querySelectorAll(playButtonsSelector);

    // 팝업 표시 함수
    function showLoginPopup(message) {
        const loginMessage = document.getElementById("login-message");
        loginMessage.textContent = message || "로그인이 필요합니다.";
        loginPopup.classList.remove("hidden");
        document.body.classList.add("popup-active"); // 화면 흐림
    }

    // 팝업 숨기기 함수
    function hideLoginPopup() {
        loginPopup.classList.add("hidden");
        document.body.classList.remove("popup-active"); // 화면 복원
    }

    // 로그인 요청 함수 (임시)
    function handleLogin() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            console.log("로그인 실패: 사용자 이름 또는 비밀번호가 비어 있습니다.");
            return;
        }

        console.log(`로그인 요청: ${username}, ${password}`);
        hideLoginPopup();

        // 실제 Auth.js 로그인 요청 로직
        // login();
    }

    // 로그인 버튼 클릭 이벤트
    loginButton.addEventListener("click", handleLogin);

    // 엔터 키 입력 시 로그인 처리
    [usernameInput, passwordInput].forEach((input) => {
        input.addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
                handleLogin();
            }
        });
    });

    // 팝업 취소 버튼
    cancelButton.addEventListener("click", hideLoginPopup);

    // 기존 재생 버튼 클릭 시 로그인 필요 여부 확인
    playButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            const isLoggedIn = false; // 로그인 여부 확인 로직 (임시로 false 설정)
            if (!isLoggedIn) {
                e.preventDefault(); // 기본 동작 방지
                showLoginPopup("재생을 위해 로그인이 필요합니다."); // 로그인 팝업 표시
            } else {
                console.log("재생 시작"); // 로그인 상태에서 재생
            }
        });
    });

    // 새로운 이벤트 트리거 추가
    triggerSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
            element.addEventListener("click", (e) => {
                const isLoggedIn = false; // 로그인 여부 확인 로직 (임시로 false 설정)
                if (!isLoggedIn) {
                    e.preventDefault(); // 기본 동작 방지
                    showLoginPopup("재생을 위해 로그인이 필요합니다."); // 로그인 팝업 표시
                } else {
                    console.log("기능 사용 가능"); // 로그인 상태에서 기능 실행
                }
            });
        });
    });
}
*/

/*
// main_login.js: 로그인 팝업 관련 코드
export function setupLoginPopup(playButtonsSelector) {
    const loginPopup = document.getElementById("login-popup");
    const loginButton = document.getElementById("login-button");
    const cancelButton = document.getElementById("cancel-button");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const playButtons = document.querySelectorAll(playButtonsSelector);

    // 팝업 표시 함수
    function showLoginPopup() {
        loginPopup.classList.remove("hidden");
    }

    // 팝업 숨기기 함수
    function hideLoginPopup() {
        loginPopup.classList.add("hidden");
    }

    // 로그인 요청 함수 (임시)
    function handleLogin() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            console.log("로그인 실패: 사용자 이름 또는 비밀번호가 비어 있습니다.");
            return;
        }

        console.log(`로그인 요청: ${username}, ${password}`);
        hideLoginPopup();

        // 실제 Auth.js 로그인 요청 로직
        // login();
    }

    // 로그인 버튼 클릭 이벤트
    loginButton.addEventListener("click", handleLogin);

    // 엔터 키 입력 시 로그인 처리
    [usernameInput, passwordInput].forEach((input) => {
        input.addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
                handleLogin();
            }
        });
    });

    // 팝업 취소 버튼
    cancelButton.addEventListener("click", hideLoginPopup);

    // 재생 버튼 클릭 시 로그인 필요 여부 확인
    playButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            const isLoggedIn = false; // 로그인 여부 확인 로직 (임시로 false 설정)
            if (!isLoggedIn) {
                e.preventDefault(); // 기본 동작 방지
                showLoginPopup(); // 로그인 팝업 표시
            } else {
                console.log("재생 시작"); // 로그인 상태에서 재생
            }
        });
    });
}
*/