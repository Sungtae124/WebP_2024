let spotifyPlayerInstance = null; // 싱글톤으로 관리되는 Spotify Player 인스턴스
let deviceId = null; // Device ID 저장
let isPlayerReady = false; // 초기화 상태 추적

// Spotify Web Playback SDK 초기화 및 관리
export async function getPlayerInstance(accessToken, trackID = null, callbacks = {}) {
    if (spotifyPlayerInstance) {
        console.log("기존 Spotify Player를 재사용합니다.");
        if (trackID && deviceId) {
            await playTrack(deviceId, accessToken, trackID);
        }
        return spotifyPlayerInstance;
    }

    return initializeSpotifyWebPlaybackSDK(accessToken, trackID, callbacks);
}

export async function initializeSpotifyWebPlaybackSDK(accessToken, trackID, callbacks) {
    if (!accessToken) {
        throw new Error("Access Token이 필요합니다.");
    }

    return new Promise((resolve, reject) => {
        if (spotifyPlayerInstance) {
            console.log("Spotify Player가 이미 초기화되었습니다.");
            resolve(spotifyPlayerInstance);
            return;
        }

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
export async function playTrack(deviceId, accessToken, trackID) {
    if (!deviceId || !accessToken || !trackID) {
        console.error("playTrack: 필요한 파라미터가 누락되었습니다.");
        return;
    }

    try {
        const url = `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`;
        const body = JSON.stringify({
            uris: [`spotify:track:${trackID}`], // 트랙 URI 배열
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


/*
// 전역 변수 정의
let spotifyPlayer = null;

// Spotify Web Playback SDK 초기화
export async function initializeSpotifyWebPlaybackSDK(accessToken, trackID = null, callbacks = {}) {
    waitForSpotifySDK();
    
    if (!accessToken) {
        throw new Error("Access Token이 필요합니다.");
    }

    if (!window.Spotify) {
        console.error("Spotify SDK가 로드되지 않았습니다.");
        return null;
    }

    // 기존 플레이어 재사용
    if (spotifyPlayer) {
        console.log("기존 Spotify Player를 재사용합니다.");
        const deviceId = await getDeviceId();
        if (trackID && deviceId) {
            await playTrack(deviceId, accessToken, trackID);
        }
        return spotifyPlayer;
    }

    return new Promise((resolve, reject) => {
        // Spotify SDK가 로드되었는지 확인
        if (!window.Spotify) {
            console.error("Spotify SDK가 로드되지 않았습니다.");
            return reject("Spotify SDK 로드 실패");
        }

        window.onSpotifyWebPlaybackSDKReady = () => {
            console.log("Spotify Web Playback SDK 초기화 중...");

            spotifyPlayer = new Spotify.Player({
                name: "Web Playback SDK",
                getOAuthToken: cb => cb(accessToken),
                volume: 0.3, // 기본 볼륨 설정
            });

            const { onPlayerReady, onPlayerStateChange } = callbacks;

            // 플레이어 준비 이벤트
            spotifyPlayer.addListener("ready", ({ device_id }) => {
                console.log("플레이어 준비 완료. Device ID:", device_id);
                if (onPlayerReady) onPlayerReady(device_id);
                if (trackID) {
                    playTrack(device_id, accessToken, trackID).catch(err =>
                        console.error("초기 곡 재생 실패:", err)
                    );
                }
                resolve(spotifyPlayer);
            });

            // 상태 변경 이벤트
            spotifyPlayer.addListener("player_state_changed", state => {
                if (state && onPlayerStateChange) {
                    onPlayerStateChange(state);
                }
            });

            // 초기화 오류
            spotifyPlayer.addListener("initialization_error", ({ message }) => {
                console.error("초기화 오류:", message);
                reject(new Error(`초기화 오류: ${message}`));
            });

            // 인증 오류
            spotifyPlayer.addListener("authentication_error", ({ message }) => {
                console.error("인증 오류:", message);
                reject(new Error(`인증 오류: ${message}`));
            });

            // 플레이어 연결
            spotifyPlayer.connect().catch(err => {
                console.error("Spotify Player 연결 실패:", err);
                reject(err);
            });
        };
        // SDK 로드 타이밍 보장
        if (window.Spotify) {
            window.onSpotifyWebPlaybackSDKReady();
        }
        if (!window.Spotify) {
            reject(new Error("Spotify SDK가 로드되지 않았습니다."));
        }
    });
}

// 곡 재생
export async function playTrack(deviceId, accessToken, trackID) {
    
    try {
        const url = `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`;
        const body = JSON.stringify({ uris: [`spotify:track:${trackID}`] });
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body,
        });

        if (response.ok) {
            console.log("곡 재생 성공:", trackID);
        } else {
            console.error("곡 재생 실패:", await response.text());
        }
    } catch (error) {
        console.error("곡 재생 중 오류 발생:", error);
    }
}


*/


/*
// 전역 변수 정의
let spotifyPlayer = null;

// Spotify Web Playback SDK 초기화
export async function initializeSpotifyWebPlaybackSDK(accessToken, trackID, callbacks) {
    if (!accessToken || typeof callbacks !== "object") {
        throw new Error("올바른 accessToken 또는 callbacks가 전달되지 않았습니다.");
    }
    if (spotifyPlayer) {
        console.log("기존 Spotify Player를 재사용합니다.");
        if (trackID) {
            const deviceId = await getDeviceId();
            if (deviceId) {
                await playTrack(deviceId, accessToken, trackID);
            } else {
                console.error("Device ID를 가져올 수 없습니다.");
            }
        }
        return spotifyPlayer;
    }

    return new Promise((resolve, reject) => {
        window.onSpotifyWebPlaybackSDKReady = () => {
            console.log("Spotify Web Playback SDK 초기화 중...");

            spotifyPlayer = new Spotify.Player({
                name: "Web Playback SDK",
                getOAuthToken: cb => cb(accessToken),
                volume: 0.3, // 초기 볼륨 설정
            });

            const { onPlayerReady, onPlayerStateChange } = callbacks;

            // 플레이어 준비 이벤트
            spotifyPlayer.addListener("ready", ({ device_id }) => {
                console.log("플레이어 준비 완료. Device ID:", device_id);
                if (onPlayerReady) onPlayerReady(device_id);
                //if (trackID) playTrack(device_id, accessToken, trackID);
                if (trackID) {
                    playTrack(device_id, accessToken, trackID)
                        .catch(err => console.error("초기 곡 재생 실패:", err));
                }
                if (callbacks.onPlayerReady) callbacks.onPlayerReady(device_id);
                resolve(spotifyPlayer);
            });

            // 플레이어 상태 변경 이벤트
            spotifyPlayer.addListener("player_state_changed", state => {
                if (onPlayerStateChange && state) onPlayerStateChange(state);
            });

            // 연결 실패 처리
            spotifyPlayer.addListener("initialization_error", ({ message }) => reject("SDK 초기화 실패:" + message));
            spotifyPlayer.addListener("authentication_error", ({ message }) => reject("인증 실패:" + message));
            spotifyPlayer.addListener("account_error", ({ message }) => reject("계정 실패:" + message));

            // 플레이어 연결
            spotifyPlayer.connect().catch(err => {
                console.error("플레이어 연결 실패:", err);
                reject(err);
            });
        };
        // Spotify SDK가 로드되지 않은 경우 대비
        if (!window.Spotify) {
            reject("Spotify SDK가 로드되지 않았습니다.");
        }
    });
}

// Device ID 가져오기
export async function getDeviceId() {
    return new Promise((resolve, reject) => {
        if (spotifyPlayer) {
            spotifyPlayer.addListener("ready", ({ device_id }) => {
                resolve(device_id);
            });
        } else {
            console.error("Spotify Player가 초기화되지 않았습니다.");
            reject("Player not initialized");
        }
    });
}

// 곡 재생
export async function playTrack(deviceId, token, trackUri) {
    try {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ uris: [`spotify:track:${trackUri}`] }),
        });
        console.log("곡 재생 시작:", trackUri);
    } catch (error) {
        console.error("곡 재생 중 오류 발생:", error);
    }
}

// 곡 탐색
export async function seekTrack(positionMs) {
    if (!spotifyPlayer) {
        console.error("Spotify Player가 초기화되지 않았습니다.");
        return;
    }
    try {
        await spotifyPlayer.seek(positionMs);
        console.log(`위치로 이동: ${positionMs}ms`);
    } catch (error) {
        console.error("탐색 중 오류 발생:", error);
    }
}

// Spotify Player 상태 저장
export async function savePlayerState() {
    if (!spotifyPlayer) {
        console.error("Spotify Player가 초기화되지 않았습니다. 초기화를 다시 시도합니다.");
        try {
            await initializeSpotifyWebPlaybackSDK(localStorage.getItem("spotify_token"));
        } catch (error) {
            console.error("Spotify Player 재초기화 중 오류 발생:", error);
            return null;
        }
    }

    try {
        const state = await spotifyPlayer.getCurrentState();
        if (!state) {
            console.error("Player 상태를 가져오지 못했습니다.");
            return null;
        }

        const { position, track_window } = state;
        const track = track_window?.current_track;

        const savedState = {
            trackID: track?.id || null,
            position: position || 0,
            trackName: track?.name || "",
            artistName: track?.artists?.map(a => a.name).join(", ") || "",
            albumImage: track?.album?.images[0]?.url || "/default/default-album.png",
            albumName: track?.album?.name || "",
        };
        console.log("현재 상태 저장:", savedState);
        return savedState;
    } catch (error) {
        console.error("Spotify Player 상태 저장 중 오류 발생:", error);
        return null;
    }
    return null;
}

// Spotify Player 제거
export function destroyPlayer() {
    if (spotifyPlayer) {
        spotifyPlayer.disconnect();
        console.log("Spotify Player 해제 완료");
        spotifyPlayer = null;
    }
}

// UI 업데이트 함수 (예제 구현, 실제 사용 시 커스터마이징 필요)
export function updatePlaybackUI(state) {
    const { position, duration, paused } = state;
    const progressBar = document.querySelector(".progress-bar");
    const playButton = document.querySelector(".pip-play-button");

    if (progressBar) progressBar.value = duration ? (position / duration) * 100 : 0;
    if (playButton) playButton.textContent = paused ? "▶️" : "⏸️";
}
*/







/*
// 전역 변수 정의
let spotifyPlayer = null;

// 초기화 함수
export async function initializeSpotifyPlayer(accessToken) {
    if (spotifyPlayer && spotifyPlayer.player) {
        console.log("기존 Spotify Player를 재사용합니다.");
        return spotifyPlayer;
    }

    console.log("새로운 Spotify Player를 초기화합니다.");
    spotifyPlayer = new SpotifyPlayer(accessToken);
    await spotifyPlayer.initPlayer();

    // 기본 동작 및 이벤트 설정
    setupDefaultPlayerEvents(spotifyPlayer);

    return spotifyPlayer;
}

// Spotify Player 기본 이벤트 설정
function setupDefaultPlayerEvents(playerInstance) {
    const player = playerInstance.player;

    if (!player) {
        console.error("Player 인스턴스가 초기화되지 않았습니다.");
        return;
    }

    // Spotify Player 상태 변경 이벤트
    player.addListener("player_state_changed", state => {
        if (state) {
            updatePlaybackUI(state); // UI 업데이트 함수 호출
        }
    });

    // UI 제어 바인딩
    const playButton = document.querySelector(".pip-play-button");
    const progressBar = document.querySelector(".progress-bar");

    if (playButton) {
        playButton.addEventListener("click", () => {
            player.togglePlay(); // 재생 상태 토글
        });
    }

    if (progressBar) {
        progressBar.addEventListener("input", () => {
            player.getCurrentState().then(state => {
                if (state) {
                    const { duration } = state;
                    const seekPosition = (progressBar.value / 100) * duration; // 탐색 위치 계산
                    player.seek(seekPosition); // 해당 위치로 이동
                }
            });
        });
    }

    console.log("Spotify Player 이벤트 및 기본 동작 설정 완료");
}

// Spotify Player 상태 저장 함수
async function savePlayerState(player) {
    try {
        const state = await player.getCurrentState();
        if (state) {
            const { position, track_window } = state;
            const track = track_window?.current_track;

            const savedState = {
                trackID: track?.id || null,
                position: position || 0,
                trackName: track?.name || "",
                artistName: track?.artists?.map(a => a.name).join(", ") || "",
                albumImage: track?.album?.images[0]?.url || "/default/default-album.png",
                albumName: track?.album?.name || ""
            };

            console.log("현재 상태 저장:", savedState);
            return savedState;
        }
    } catch (error) {
        console.error("Spotify Player 상태 저장 중 오류 발생:", error);
    }
    return null;
}
*/