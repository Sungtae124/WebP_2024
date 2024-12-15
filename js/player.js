let spotifyPlayerInstance = null; // 싱글톤으로 관리되는 Spotify Player 인스턴스
let deviceId = null; // Device ID 저장
let isPlayerReady = false; // 초기화 상태 추적

// Spotify Web Playback SDK 초기화 및 관리
export async function getPlayerInstance(accessToken, trackID = null, callbacks = {}) {
    if (spotifyPlayerInstance) {
        console.log("기존 Spotify Player를 재사용합니다.");
        if (trackID && deviceId) {
            await playTrack(deviceId, accessToken, trackID, state.position);
        }
        return spotifyPlayerInstance;
    }

    try{
        await waitForSpotifySDK();
        spotifyPlayerInstance = await initializeSpotifyWebPlaybackSDK(accessToken, trackID, callbacks);
        return spotifyPlayerInstance;
    }
    catch (err){
        console.error("Spotify Player 초기화 실패: ", err);
        throw err;
    }
}

export async function initializeSpotifyWebPlaybackSDK(accessToken, trackID, callbacks) {
    if (!accessToken) {
        throw new Error("Access Token이 필요합니다.");
    }

    if (spotifyPlayerInstance) {
        console.log("Spotify Player가 이미 초기화되었습니다.");
        return spotifyPlayerInstance;
    }

    return new Promise((resolve, reject) => {
        if (!window.Spotify) {
            reject(new Error("Spotify SDK가 로드되지 않았습니다."));
            return;
        }

        spotifyPlayerInstance = new Spotify.Player({
            name: "Web Playback SDK",
            getOAuthToken: (cb) => cb(accessToken),
            volume: 0.3,
        });

        spotifyPlayerInstance.addListener("ready", ({ device_id }) => {
            deviceId = device_id;
            isPlayerReady = true;
            console.log("Spotify Player 준비 완료. Device ID:", deviceId);
            if (callbacks.onPlayerReady) callbacks.onPlayerReady(deviceId);
            resolve(spotifyPlayerInstance);
        });

        spotifyPlayerInstance.addListener("player_state_changed", (state) => {
            if (state && callbacks.onPlayerStateChange) {
                callbacks.onPlayerStateChange(state);
            }
        });

        spotifyPlayerInstance.addListener("initialization_error", ({ message }) => {
            console.error("초기화 오류:", message);
            reject(new Error(`초기화 오류: ${message}`));
        });

        spotifyPlayerInstance.addListener("authentication_error", ({ message }) => {
            console.error("인증 오류:", message);
            reject(new Error(`인증 오류: ${message}`));
        });

        spotifyPlayerInstance.connect();
    });
}

// 위치 탐색
export async function seekPosition(positionMs) {
    if (!spotifyPlayerInstance) {
        console.error("Spotify Player가 초기화되지 않았습니다.");
        return;
    }

    try {
        await spotifyPlayerInstance.seek(positionMs);
        console.log(`위치로 이동: ${positionMs}ms`);
    } catch (error) {
        console.error("탐색 중 오류 발생:", error);
    }
}

// 특정 트랙을 재생하는 함수
export async function playTrack(deviceId, accessToken, trackID, positionMs) {
    if (!deviceId || !accessToken || !trackID || positionMs === undefined) {
        console.error("playTrack: 필요한 파라미터가 누락되었습니다.");
        console.error("deviceId:", deviceId);
        console.error("accessToken:", accessToken);
        console.error("trackID:", trackID);
        console.error("lastPosition:", positionMs);
        return;
    }

    try {
        const url = `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`;
        const body = JSON.stringify({
            uris: [`spotify:track:${trackID}`],
            position_ms: positionMs// 트랙 URI 배열
        });

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body,
        });

        if (response.ok) {
            console.log(`트랙 재생 성공: ${trackID}`);
            
            //setTimeout(seekPosition(lastPosition), 2000);
            //seekPosition(lastPosition);
        } else {
            const errorText = await response.text();
            console.error(`트랙 재생 실패: ${errorText}`);
        }
    } catch (error) {
        console.error("playTrack: 트랙 재생 중 오류 발생:", error);
    }
}


// Device ID 가져오기
export async function getDeviceId() {
    if (!spotifyPlayerInstance) {
        console.error("Spotify Player가 초기화되지 않았습니다.");
        await waitForSpotifyPlayerInitialization();
    }

    return deviceId;
}

// Spotify SDK 로드 대기
export async function waitForSpotifySDK() {
    return new Promise((resolve, reject) => {
        if (window.Spotify) {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (window.Spotify) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error("Spotify SDK 로드 시간 초과"));
            }, 5000);
        }
    });
}

// Spotify Player 초기화 대기
export async function waitForSpotifyPlayerInitialization(timeout = 5000) {
    const startTime = Date.now();
    while (!spotifyPlayerInstance) {
        if (Date.now() - startTime > timeout) {
            throw new Error("Spotify Player 초기화 시간 초과");
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return spotifyPlayerInstance;
}

// Player 상태 저장
export async function savePlayerState() {
    if (!spotifyPlayerInstance) {
        console.warn("Spotify Player가 초기화되지 않았습니다.");
        return null;
    }

    try {
        const state = await spotifyPlayerInstance.getCurrentState();
        if (!state) {
            console.error("플레이어 상태를 가져올 수 없습니다.");
            return null;
        }

        const { position, track_window } = state;
        const currentTrack = track_window?.current_track;

        const savedState = {
            trackID: currentTrack?.id || null,
            position: position || 0,
            trackName: currentTrack?.name || "Unknown",
            artistName: currentTrack?.artists?.map((a) => a.name).join(", ") || "Unknown Artist",
            albumImage: currentTrack?.album?.images[0]?.url || "/default/default-album.png",
        };

        console.log("저장된 상태:", savedState);
        return savedState;
    } catch (error) {
        console.error("상태 저장 중 오류 발생:", error);
        return null;
    }
}


// Player 제거
export function destroyPlayer() {
    if (spotifyPlayerInstance) {
        spotifyPlayerInstance.disconnect();
        console.log("Spotify Player 연결 해제 완료");
        spotifyPlayerInstance = null;
        deviceId = null;
        isPlayerReady = false;
    }
}

// Player UI 업데이트
export function updatePlaybackUI(state) {
    const { position, duration, paused } = state;
    const progressBar = document.querySelector(".progress-bar");
    const playButton = document.querySelector(".pip-play-button");

    if (progressBar) {
        progressBar.value = duration ? (position / duration) * 100 : 0;
    }

    if (playButton) {
        playButton.textContent = paused ? "▶️" : "⏸️";
    }
}