import { fetchUserProfile, createPlaylist, fetchUserPlaylists, getAccessToken } from './api.js';

const createPlaylistButton = document.getElementById('create-playlist');
const playlistNameInput = document.getElementById('playlist-name');
const playlistsList = document.getElementById('playlists');

// 플레이리스트 생성 핸들러
async function handleCreatePlaylist() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        alert("Spotify에 로그인하세요.");
        return;
    }

    const playlistName = playlistNameInput.value.trim();
    if (!playlistName) {
        alert("플레이리스트 이름을 입력하세요.");
        return;
    }

    try {
        const userProfile = await fetchUserProfile(accessToken);
        const userId = userProfile.id;
        const newPlaylist = await createPlaylist(userId, playlistName, accessToken);

        alert(`플레이리스트 '${newPlaylist.name}' 생성 성공!`);
        await loadPlaylists();
    } catch (error) {
        console.error("플레이리스트 생성 중 오류: ", error);
        alert("플레이리스트 생성 중 오류가 발생했습니다.");
    }
}

// 플레이리스트 목록 로드
async function loadPlaylists() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        alert("Spotify에 로그인하세요.");
        return;
    }

    try {
        const playlists = await fetchUserPlaylists(accessToken);
        playlistsList.innerHTML = '';

        playlists.items.forEach(playlist => {
            const li = document.createElement('li');
            li.textContent = playlist.name;
            playlistsList.appendChild(li);
        });
    } catch (error) {
        console.error("플레이리스트 불러오기 오류: ", error);
    }
}

// 이벤트 리스너 등록
createPlaylistButton.addEventListener('click', handleCreatePlaylist);
document.addEventListener('DOMContentLoaded', loadPlaylists);
