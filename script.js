document.addEventListener("DOMContentLoaded", () => {
    const sideButtons = document.querySelectorAll(".side-buttons button");
    const mainContainer = document.querySelector(".main-container");
    const body = document.body;

    const songTitle = document.getElementById("song-title");
    const artistName = document.getElementById("artist-name");

    songTitle.textContent = "Web Project"; // 노래 제목
    artistName.textContent = "Park SeoYeon"; // 아티스트 이름

    let activePanel = null; // 현재 활성 패널
    let activeButton = null; // 현재 활성 버튼

    // 각 버튼에 이벤트 리스너 추가
    sideButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // 같은 버튼을 눌렀다면 패널 닫기
            if (activeButton === button) {
                closeActivePanel();
                return;
            }

            // 다른 버튼 클릭 시 전환
            const previousPanel = activePanel; // 현재 패널 저장
            const previousButton = activeButton; // 현재 버튼 저장
            const newPanel = createPanel(button.innerText); // 새 패널 생성

            // 새 패널 DOM에 추가
            body.appendChild(newPanel);

            // 새 패널 애니메이션 시작
            setTimeout(() => {
                newPanel.style.opacity = "1"; // 새 패널 표시
            }, 10);

            // 메인 컨테이너 이동
            mainContainer.style.transform = "translateX(-350px)";

            // 기존 패널 제거 (전환 처리)
            if (previousPanel) {
                previousPanel.style.opacity = "0"; // 기존 패널 숨김
                setTimeout(() => {
                    previousPanel.remove(); // DOM에서 제거
                }, 500); // 애니메이션 후 삭제
            }

            // 새 패널 활성화
            activePanel = newPanel;
            activeButton = button;
        });
    });

    // 새 패널 생성 함수
    function createPanel(content) {
        const panel = document.createElement("div");
        panel.classList.add("side-panel");
        panel.innerText = `패널: ${content}`;
        panel.style.opacity = "0"; // 초기 투명
        return panel;
    }

    // 기존 패널 닫기 함수
    function closeActivePanel() {
        if (activePanel) {
            activePanel.style.opacity = "0"; // 패널 숨김
            setTimeout(() => {
                activePanel.remove(); // DOM에서 제거
            }, 500); // 애니메이션 후 제거
            activePanel = null;
            activeButton = null;
            mainContainer.style.transform = "translateX(0)"; // 메인 컨테이너 복귀
        }
    }
});
