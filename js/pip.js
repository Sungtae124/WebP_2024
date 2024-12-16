import {
    getPlayerInstance, 
    playTrack, 
    seekPosition, 
    savePlayerState, 
    updatePlaybackUI, 
    waitForSpotifySDK,
    getDeviceId
} from "./player.js";

let pipSpotifyPlayer = null;
let pipDeviceId = null; // Device ID 저장

// PiP 초기화 함수
export async function initializePiP(accessToken, defaultMusic, lastPosition) {
    const pip = document.getElementById("pip");

    if (!pip) {
        console.error("PiP 요소를 찾을 수 없습니다.");
        return;
    }

    try {
        await waitForSpotifySDK();

        console.log("Initializing PiP.. last position is", lastPosition);

        // Spotify Web Playback SDK 초기화
        pipSpotifyPlayer = await getPlayerInstance(accessToken, defaultMusic.trackID, {
            onPlayerReady: async (deviceId) => {
                console.log("PiP 플레이어 준비 완료. Device ID:", deviceId);
                pipDeviceId = deviceId; // Device ID 저장

                // 곡 재생
                try{
                    console.log("재생 시도");
                    await playTrack(deviceId, accessToken, defaultMusic.trackID, lastPosition);
                    //await pipSpotifyPlayer.pause();
                    console.log("곡 로드 완료:", defaultMusic.trackName);
                } catch (err) {
                    console.error("재생 시도 실패", err);
                }
            },
            onPlayerStateChange: (state) => {
                if (state) updatePlaybackUI(state); // 상태 변경 시 UI 업데이트
            },
        });

        if (!pipDeviceId) {
            pipDeviceId = await getDeviceId();
        }

        if (!pipSpotifyPlayer) {
            await waitForSpotifyPlayerInitialization();
        }

        if (defaultMusic.trackID && pipDeviceId) {
            updatePiP(defaultMusic);
        }

        setupControlButtons(0);
    } catch (error) {
        console.error("PiP 초기화 중 오류 발생:", error);
    }
}

// PiP UI 정보 업데이트
export async function updatePiP(music) {

    if(!pipSpotifyPlayer) {
        await waitForSpotifySDK();
    }

    console.log("Updating Pip..");

    if (!music || !music.trackID || !music.trackName || !music.artistName || !music.albumImage) {
        console.error("updatePiP: 불완전한 음악 정보:", music);
        return;
    }

    const pipImage = document.querySelector("#pip .album-cover");
    const pipTitle = document.querySelector("#pip .music-info p");

    if (pipImage) {
        pipImage.src = decodeURIComponent(music.albumImage) || "/default/default-album.png";
        pipImage.alt = `${decodeURIComponent(music.trackName)} - ${decodeURIComponent(music.artistName)}`;
    }

    if (pipTitle) {

        const truncateText = (text, maxLength) => {
            return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
        };
    
        const trackName = truncateText(decodeURIComponent(music.trackName || "Unknown Track"), 15);
        const artistName = truncateText(decodeURIComponent(music.artistName || "Unknown Artist"), 15);
    
        pipTitle.textContent = `${trackName} - ${artistName}`;
        //pipTitle.textContent = `${decodeURIComponent(music.trackName)} - ${decodeURIComponent(music.artistName)}`;
    }
}

// PiP UI 제어
export function showPiP() {
    const pip = document.getElementById("pip");
    if (pip) {
        pip.style.display = "flex";
        pip.style.opacity = "1";
    }
}

export function hidePiP() {
    const pip = document.getElementById("pip");
    if (pip) {
        pip.style.display = "none";
        pip.style.opacity = "0";
    }
}

// PiP 상태 저장
export async function savePiPState(trackID, position) {
    try {
        if (!trackID) {
            console.warn("trackID가 제공되지 않았습니다. 상태를 저장할 수 없습니다.");
            return null;
        }

        const savedState = {
            trackID,
            position,
        };

        console.log("저장된 PiP 상태:", savedState);
        return savedState;
    } catch (error) {
        console.error("PiP 상태 저장 중 오류 발생:", error);
        return null;
    }
}

//TODO : PiP 정보를 저장하여 detail로 이동. lastPosition, fromReturnPage 등을 활용하여 detail에서 연속 재생.
async function escapePiP() {
    try{
        if (!pipSpotifyPlayer) {
            console.error("Spotify Player가 초기화되지 않았습니다.");
            return;
        }

        const state = await pipSpotifyPlayer.getCurrentState();
        console.log("current state", state);
        if (!state) {
            console.error("플레이어 상태를 가져올 수 없습니다.");
            return;
        }

        // 세부 기능 구현 필요.
        const { position, track_window } = state;
        const currentTrack = track_window?.current_track;

        if (!currentTrack) {
            console.error("현재 재생 중인 트랙 정보를 가져올 수 없습니다.");
            return;
        }

        const trackID = currentTrack.id;
        const trackName = currentTrack.name;
        const artistName = currentTrack.artists.map((a) => a.name).join(", ");
        const albumImage = currentTrack.album.images[0]?.url || "/default/default-album.png";
        const lastPosition = position || 0;

        console.log("저장된 PiP 상태:", { trackID, trackName, artistName, albumImage, lastPosition });

        // detail 페이지로 이동할 URL 생성
        const params = new URLSearchParams({
            fromReturnPage: "true",
            trackID: encodeURIComponent(trackID),
            lastPosition,
            albumImage: encodeURIComponent(albumImage),
            trackName: encodeURIComponent(trackName),
            artistName: encodeURIComponent(artistName),
        });

        const returnUrl = `/detail.html?${params.toString()}`;
        console.log("Redirecting to:", returnUrl);

        // PiP 숨기기 및 페이지 이동
        hidePiP();
        await pipSpotifyPlayer.pause();
        window.location.href = returnUrl;
    } catch (err) {
        console.error("escape pip 실행 중 오류 발생", err);
    };
}

// PiP 이벤트 설정
export function setupControlButtons(lastPosition) {
    const playButton = document.querySelector(".pip-play-button");
    const progressBar = document.querySelector(".progress-bar");
    const escapePipButton = document.querySelector(".escape-pip-button");

    if (!playButton || !progressBar || !escapePipButton) {
        console.error("플레이어 제어 버튼, 진행 바, 세부페이지 이동 버튼을 찾을 수 없습니다.");
        return;
    }

    // 재생 버튼 이벤트
    playButton.addEventListener("click", async () => {
        try {
            if (!pipSpotifyPlayer) {
                console.error("Spotify Player가 초기화되지 않았습니다.");
                return;
            }

            const state = await pipSpotifyPlayer.getCurrentState();
            console.log("current state", state);
            if (!state) {
                console.error("플레이어 상태를 가져올 수 없습니다.");
                return;
            }

            if (state.paused) {
                // 재생 시작
                await pipSpotifyPlayer.resume();
                console.log("재생 시작");

                // `lastPosition`으로 이동
                // if (lastPosition && !isNaN(lastPosition)) {
                //     console.log("lastPosition으로 이동:", lastPosition);
                //     setTimeout(await seekPosition(lastPosition), 2000);
                // } else {
                //     console.warn("lastPosition 값이 유효하지 않습니다. 처음부터 재생합니다.");
                // }

                playButton.textContent = "⏸️";
            } else {
                // 일시정지
                await pipSpotifyPlayer.pause();
                console.log("일시정지");
                playButton.textContent = "▶️";
            }
        } catch (error) {
            console.error("재생 상태 토글 중 오류 발생:", error);
        }
    });

    // 슬라이더 이벤트
    progressBar.addEventListener("input", async () => {
        try {
            const state = await pipSpotifyPlayer.getCurrentState();
            if (state) {
                const { duration } = state;
                const seekPositionValue = Math.floor((progressBar.value / 100) * duration);

                if (!isNaN(seekPositionValue)) {
                    await seekPosition(seekPositionValue);
                    console.log(`슬라이더로 탐색: ${seekPositionValue}ms`);
                } else {
                    console.error("유효하지 않은 탐색 위치");
                }
            } else {
                console.error("플레이어 상태를 가져올 수 없습니다.");
            }
        } catch (error) {
            console.error("슬라이더 탐색 중 오류 발생:", error);
        }
    });

    //TODO : escapePiP() 활용하여 버튼 클릭 이벤트 처리
    escapePipButton.addEventListener("click", async () => {
        try{
            await escapePiP();
        } catch (err) {
            console.log("세부 페이지 이동 실패", err);
        }
    });

    console.log("PiP 제어 버튼 설정 완료");
}